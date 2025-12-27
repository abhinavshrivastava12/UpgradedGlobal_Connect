import React, { useEffect, useRef, useState } from 'react';
import { Phone, PhoneOff, Video, VideoOff, Mic, MicOff, X, Maximize2, Minimize2 } from 'lucide-react';
import AgoraRTC from 'agora-rtc-sdk-ng';
import io from 'socket.io-client';

const APP_ID = '04d8a9031217470bb3b5c0d6b7a0db55';

function VideoCallModal({ isOpen, onClose, recipientId, recipientName, currentUserId }) {
  const [muted, setMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false);
  const [callStatus, setCallStatus] = useState('connecting');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  const localVideoRef = useRef();
  const remoteVideoRef = useRef();
  const clientRef = useRef(null);
  const localAudioTrackRef = useRef(null);
  const localVideoTrackRef = useRef(null);
  const durationIntervalRef = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    const SOCKET_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:8000';
    socketRef.current = io(SOCKET_URL, {
      withCredentials: true,
      transports: ['websocket', 'polling']
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      console.log('📞 Video socket connected');
      const token = localStorage.getItem('token') || '';
      const email = localStorage.getItem('email') || '';
      socket.emit('join', { userId: currentUserId, token, email });
    });

    socket.on('callAccepted', () => {
      console.log('✅ Call accepted');
      setCallStatus('connected');
    });

    socket.on('callRejected', () => {
      console.log('❌ Call rejected');
      alert('Call was rejected');
      handleEndCall();
    });

    socket.on('callEnded', () => {
      console.log('🔚 Call ended');
      handleEndCall();
    });

    socket.on('callFailed', (data) => {
      console.log('❌ Call failed:', data.message);
      alert(data.message);
      handleEndCall();
    });

    initializeCall();

    return () => {
      cleanup();
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [isOpen]);

  useEffect(() => {
    if (callStatus === 'connected') {
      durationIntervalRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (durationIntervalRef.current) clearInterval(durationIntervalRef.current);
    }

    return () => {
      if (durationIntervalRef.current) clearInterval(durationIntervalRef.current);
    };
  }, [callStatus]);

  const initializeCall = async () => {
    try {
      console.log('📞 Initializing call...');

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token');
      }

      // ✅ FIXED: Better error handling
      const response = await fetch('/api/agora/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include',
        body: JSON.stringify({
          channelName: `call_${currentUserId}_${recipientId}`,
          userId: currentUserId
        })
      });

      // ✅ CRITICAL: Check response before JSON parsing
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Token request failed:', response.status, errorText);
        throw new Error(`Failed to get token: ${response.status}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response:', text);
        throw new Error('Server returned invalid response');
      }

      const data = await response.json();
      
      // ✅ Validate response
      if (!data || !data.success) {
        console.error('Invalid response:', data);
        throw new Error(data?.message || 'Invalid token response');
      }

      const { token: agoraToken, uid, appId } = data;
      console.log('✅ Token received');

      const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
      clientRef.current = client;

      await client.join(appId || APP_ID, `call_${currentUserId}_${recipientId}`, agoraToken || null, uid);
      console.log('✅ Joined channel');

      const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
      localAudioTrackRef.current = audioTrack;
      localVideoTrackRef.current = videoTrack;

      if (localVideoRef.current) {
        videoTrack.play(localVideoRef.current);
      }

      await client.publish([audioTrack, videoTrack]);
      console.log('✅ Published tracks');

      setCallStatus('ringing');

      if (socketRef.current) {
        const email = localStorage.getItem('email') || '';
        socketRef.current.emit('callUser', {
          userToCall: recipientId,
          from: currentUserId,
          signalData: { channelName: `call_${currentUserId}_${recipientId}` },
          callerInfo: {
            name: email.split('@')[0] || 'User',
            profileImage: ''
          }
        });
        console.log('📤 Call signal sent');
      }

      client.on('user-published', async (user, mediaType) => {
        console.log('📥 Remote published:', mediaType);
        await client.subscribe(user, mediaType);

        if (mediaType === 'video') {
          setCallStatus('connected');
          const remoteVideoTrack = user.videoTrack;
          if (remoteVideoRef.current) {
            remoteVideoTrack.play(remoteVideoRef.current);
          }
        }

        if (mediaType === 'audio') {
          const remoteAudioTrack = user.audioTrack;
          remoteAudioTrack.play();
        }
      });

      client.on('user-left', () => {
        console.log('👋 Remote left');
        setCallStatus('ended');
        setTimeout(() => handleEndCall(), 2000);
      });

    } catch (error) {
      console.error('❌ Call error:', error);
      alert('Failed to start call: ' + error.message);
      onClose();
    }
  };

  const cleanup = async () => {
    try {
      if (localAudioTrackRef.current) {
        localAudioTrackRef.current.stop();
        localAudioTrackRef.current.close();
      }
      if (localVideoTrackRef.current) {
        localVideoTrackRef.current.stop();
        localVideoTrackRef.current.close();
      }
      if (clientRef.current) {
        await clientRef.current.leave();
      }
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  };

  const handleEndCall = async () => {
    setCallStatus('ended');
    if (socketRef.current) {
      socketRef.current.emit('endCall', { to: recipientId });
    }
    await cleanup();
    onClose();
  };

  const toggleMute = () => {
    if (localAudioTrackRef.current) {
      localAudioTrackRef.current.setEnabled(muted);
      setMuted(!muted);
    }
  };

  const toggleVideo = () => {
    if (localVideoTrackRef.current) {
      localVideoTrackRef.current.setEnabled(videoOff);
      setVideoOff(!videoOff);
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
      <div className="relative w-full h-full bg-gray-900">
        
        {/* Status Bar */}
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 bg-black/70 px-6 py-3 rounded-full">
          <p className="text-white text-sm font-medium">
            {callStatus === 'connecting' && 'Connecting...'}
            {callStatus === 'ringing' && 'Ringing...'}
            {callStatus === 'connected' && formatDuration(callDuration)}
            {callStatus === 'ended' && 'Call Ended'}
          </p>
        </div>

        {/* Close Button */}
        <button
          onClick={handleEndCall}
          className="absolute top-4 right-4 z-10 p-2 bg-red-600 rounded-full hover:bg-red-700"
        >
          <X className="w-6 h-6 text-white" />
        </button>

        {/* Remote Video */}
        <div className="w-full h-full bg-gray-800">
          <div ref={remoteVideoRef} className="w-full h-full" />
          
          {callStatus !== 'connected' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="w-32 h-32 bg-purple-600 rounded-full flex items-center justify-center mb-4">
                <span className="text-white text-4xl font-bold">
                  {recipientName?.charAt(0)?.toUpperCase()}
                </span>
              </div>
              <h2 className="text-2xl font-bold text-white">{recipientName}</h2>
            </div>
          )}
        </div>

        {/* Local Video */}
        <div className="absolute top-20 right-4 w-48 h-36 bg-gray-800 rounded-xl overflow-hidden border-2 border-gray-700">
          <div ref={localVideoRef} className="w-full h-full" />
          {videoOff && (
            <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
              <VideoOff className="w-8 h-8 text-gray-400" />
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-4">
          <button
            onClick={toggleMute}
            className={`p-5 rounded-full ${muted ? 'bg-red-600' : 'bg-gray-700'} hover:opacity-80`}
          >
            {muted ? <MicOff className="w-7 h-7 text-white" /> : <Mic className="w-7 h-7 text-white" />}
          </button>

          <button
            onClick={toggleVideo}
            className={`p-5 rounded-full ${videoOff ? 'bg-red-600' : 'bg-gray-700'} hover:opacity-80`}
          >
            {videoOff ? <VideoOff className="w-7 h-7 text-white" /> : <Video className="w-7 h-7 text-white" />}
          </button>

          <button
            onClick={handleEndCall}
            className="p-5 rounded-full bg-red-600 hover:bg-red-700"
          >
            <PhoneOff className="w-7 h-7 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default VideoCallModal;