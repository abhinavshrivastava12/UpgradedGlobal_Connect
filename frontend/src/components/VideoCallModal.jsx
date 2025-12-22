import React, { useEffect, useRef, useState } from 'react';
import { Phone, PhoneOff, Video, VideoOff, Mic, MicOff, X } from 'lucide-react';
import io from 'socket.io-client';
import Peer from 'simple-peer';

const socket = io('http://localhost:8000', {
  withCredentials: true,
  transports: ['websocket', 'polling']
});

function VideoCallModal({ 
  isOpen, 
  onClose, 
  recipientId, 
  recipientName,
  currentUserId 
}) {
  const [stream, setStream] = useState(null);
  const [callAccepted, setCallAccepted] = useState(false);
  const [callEnded, setCallEnded] = useState(false);
  const [muted, setMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null);
  const [calling, setCalling] = useState(false);

  const myVideo = useRef();
  const userVideo = useRef();
  const connectionRef = useRef();

  useEffect(() => {
    if (!isOpen) return;

    // Get media stream
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((currentStream) => {
        setStream(currentStream);
        if (myVideo.current) {
          myVideo.current.srcObject = currentStream;
        }
      })
      .catch((err) => {
        console.error('Failed to get media:', err);
        alert('Failed to access camera/microphone. Please check permissions.');
      });

    // Socket listeners
    socket.on('incomingCall', ({ signal, from, callerInfo }) => {
      setIncomingCall({ signal, from, callerInfo });
    });

    socket.on('callAccepted', ({ signal }) => {
      setCallAccepted(true);
      connectionRef.current.signal(signal);
    });

    socket.on('callRejected', () => {
      alert('Call was rejected');
      handleEndCall();
    });

    socket.on('callEnded', () => {
      handleEndCall();
    });

    return () => {
      socket.off('incomingCall');
      socket.off('callAccepted');
      socket.off('callRejected');
      socket.off('callEnded');
      
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isOpen]);

  const callUser = () => {
    if (!stream) {
      alert('Please allow camera/microphone access first');
      return;
    }

    setCalling(true);
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream: stream
    });

    peer.on('signal', (data) => {
      socket.emit('callUser', {
        userToCall: recipientId,
        signalData: data,
        from: currentUserId,
        callerInfo: { name: 'You' }
      });
    });

    peer.on('stream', (remoteStream) => {
      if (userVideo.current) {
        userVideo.current.srcObject = remoteStream;
      }
    });

    connectionRef.current = peer;
  };

  const answerCall = () => {
    if (!stream || !incomingCall) return;

    setCallAccepted(true);
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream: stream
    });

    peer.on('signal', (data) => {
      socket.emit('answerCall', {
        signal: data,
        to: incomingCall.from
      });
    });

    peer.on('stream', (remoteStream) => {
      if (userVideo.current) {
        userVideo.current.srcObject = remoteStream;
      }
    });

    peer.signal(incomingCall.signal);
    connectionRef.current = peer;
    setIncomingCall(null);
  };

  const rejectCall = () => {
    if (incomingCall) {
      socket.emit('rejectCall', { to: incomingCall.from });
      setIncomingCall(null);
    }
  };

  const handleEndCall = () => {
    setCallEnded(true);
    
    if (connectionRef.current) {
      connectionRef.current.destroy();
    }

    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }

    socket.emit('endCall', { to: recipientId });
    onClose();
  };

  const toggleMute = () => {
    if (stream) {
      stream.getAudioTracks()[0].enabled = muted;
      setMuted(!muted);
    }
  };

  const toggleVideo = () => {
    if (stream) {
      stream.getVideoTracks()[0].enabled = videoOff;
      setVideoOff(!videoOff);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center">
      <div className="w-full h-full relative">
        
        {/* Close Button */}
        <button
          onClick={handleEndCall}
          className="absolute top-4 right-4 z-10 p-2 bg-red-600 rounded-full hover:bg-red-700 transition-all"
        >
          <X className="w-6 h-6 text-white" />
        </button>

        {/* Remote Video (Full Screen) */}
        {callAccepted && !callEnded && (
          <video 
            ref={userVideo} 
            autoPlay 
            playsInline
            className="w-full h-full object-cover"
          />
        )}

        {/* My Video (Small Corner) */}
        <div className="absolute top-4 right-20 w-48 h-36 bg-gray-800 rounded-lg overflow-hidden shadow-2xl">
          <video 
            ref={myVideo} 
            autoPlay 
            muted 
            playsInline
            className="w-full h-full object-cover"
          />
        </div>

        {/* Incoming Call UI */}
        {incomingCall && !callAccepted && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80">
            <div className="bg-gray-800 rounded-2xl p-8 text-center">
              <div className="w-20 h-20 bg-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                <Phone className="w-10 h-10 text-white animate-pulse" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Incoming Call</h2>
              <p className="text-gray-300 mb-6">
                {incomingCall.callerInfo?.name || 'Someone'} is calling you...
              </p>
              
              <div className="flex gap-4 justify-center">
                <button
                  onClick={answerCall}
                  className="px-6 py-3 bg-green-600 hover:bg-green-700 rounded-full text-white font-semibold flex items-center gap-2"
                >
                  <Phone className="w-5 h-5" />
                  Answer
                </button>
                <button
                  onClick={rejectCall}
                  className="px-6 py-3 bg-red-600 hover:bg-red-700 rounded-full text-white font-semibold flex items-center gap-2"
                >
                  <PhoneOff className="w-5 h-5" />
                  Decline
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Calling Status */}
        {!callAccepted && !incomingCall && !callEnded && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
            <div className="w-20 h-20 bg-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center">
              <Phone className="w-10 h-10 text-white animate-pulse" />
            </div>
            <p className="text-white text-xl mb-4">
              {calling ? 'Calling...' : 'Ready to call'}
            </p>
            {!calling && (
              <button
                onClick={callUser}
                className="px-8 py-3 bg-green-600 hover:bg-green-700 rounded-full text-white font-semibold"
              >
                Start Call
              </button>
            )}
          </div>
        )}

        {/* Controls */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-4">
          
          {/* Mute Button */}
          <button
            onClick={toggleMute}
            className={`p-4 rounded-full transition-all ${
              muted ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            {muted ? <MicOff className="w-6 h-6 text-white" /> : <Mic className="w-6 h-6 text-white" />}
          </button>

          {/* Video Toggle */}
          <button
            onClick={toggleVideo}
            className={`p-4 rounded-full transition-all ${
              videoOff ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            {videoOff ? <VideoOff className="w-6 h-6 text-white" /> : <Video className="w-6 h-6 text-white" />}
          </button>

          {/* End Call */}
          <button
            onClick={handleEndCall}
            className="p-4 rounded-full bg-red-600 hover:bg-red-700 transition-all"
          >
            <PhoneOff className="w-6 h-6 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default VideoCallModal;