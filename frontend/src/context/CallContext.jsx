import { createContext, useContext, useState, useRef, useEffect } from 'react';
import Peer from 'simple-peer';
import io from 'socket.io-client';

const CallContext = createContext();

// ✅ FIXED: Backend ka correct URL use karo
const socket = io(import.meta.env.VITE_SERVER_URL || 'http://localhost:8000', {
  withCredentials: true,
  transports: ['websocket', 'polling']
});

export const CallProvider = ({ children }) => {
  const [callAccepted, setCallAccepted] = useState(false);
  const [callEnded, setCallEnded] = useState(false);
  const [stream, setStream] = useState(null);
  const [call, setCall] = useState({});
  const [myId, setMyId] = useState('');
  const [userName, setUserName] = useState('');
  
  const myVideo = useRef();
  const userVideo = useRef();
  const connectionRef = useRef();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const email = localStorage.getItem('email');
    const userId = localStorage.getItem('userId');

    if (token && userId) {
      socket.emit('join', { token, email, userId });
      setMyId(userId);
      setUserName(email?.split('@')[0] || 'User');
    }

    socket.on('callUser', ({ from, signal }) => {
      setCall({ isReceivingCall: true, from, signal });
    });

    socket.on('callAccepted', (signal) => {
      setCallAccepted(true);
      connectionRef.current.signal(signal);
    });

    socket.on('callEnded', () => {
      endCall();
    });

    return () => {
      socket.off('callUser');
      socket.off('callAccepted');
      socket.off('callEnded');
    };
  }, []);

  const callUser = async (id) => {
    try {
      const currentStream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      
      setStream(currentStream);
      if (myVideo.current) {
        myVideo.current.srcObject = currentStream;
      }
      
      const peer = new Peer({
        initiator: true,
        trickle: false,
        stream: currentStream
      });
      
      peer.on('signal', (data) => {
        socket.emit('callUser', {
          userToCall: id,
          signalData: data,
          from: myId
        });
      });
      
      peer.on('stream', (remoteStream) => {
        if (userVideo.current) {
          userVideo.current.srcObject = remoteStream;
        }
      });
      
      connectionRef.current = peer;
    } catch (error) {
      console.error('Call error:', error);
      alert('Could not access camera/microphone');
    }
  };

  const answerCall = async () => {
    try {
      const currentStream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      
      setStream(currentStream);
      setCallAccepted(true);
      
      if (myVideo.current) {
        myVideo.current.srcObject = currentStream;
      }
      
      const peer = new Peer({
        initiator: false,
        trickle: false,
        stream: currentStream
      });
      
      peer.on('signal', (data) => {
        socket.emit('answerCall', {
          signal: data,
          to: call.from
        });
      });
      
      peer.on('stream', (remoteStream) => {
        if (userVideo.current) {
          userVideo.current.srcObject = remoteStream;
        }
      });
      
      peer.signal(call.signal);
      connectionRef.current = peer;
    } catch (error) {
      console.error('Answer call error:', error);
      alert('Could not access camera/microphone');
    }
  };

  const endCall = () => {
    setCallEnded(true);
    setCallAccepted(false);
    setCall({});
    
    if (connectionRef.current) {
      connectionRef.current.destroy();
    }
    
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    
    socket.emit('endCall', { to: call.from || myId });
  };

  return (
    <CallContext.Provider value={{
      call,
      callAccepted,
      myVideo,
      userVideo,
      stream,
      callUser,
      endCall,
      answerCall,
      callEnded,
      myId,
      userName
    }}>
      {children}
    </CallContext.Provider>
  );
};

export const useCall = () => useContext(CallContext);