// VideoCallModal.jsx - COMPLETE FIXED VERSION

import React, { useEffect, useRef, useState } from 'react';
import { Phone, PhoneOff, Video, VideoOff, Mic, MicOff, X } from 'lucide-react';
import AgoraRTC from 'agora-rtc-sdk-ng';
import io from 'socket.io-client';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:8000';

function VideoCallModal({ isOpen, onClose, recipientId, recipientName, currentUserId }) {
  const [muted, setMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false);
  const [callStatus, setCallStatus] = useState('connecting');
  const [callDuration, setCallDuration] = useState(0);

  const localVideoRef = useRef();
  const remoteVideoRef = useRef();
  const clientRef = useRef(null);
  const localAudioTrackRef = useRef(null);
  const localVideoTrackRef = useRef(null);
  const durationIntervalRef = useRef(null);
  const socketRef = useRef(null);
  const callTimeoutRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    console.log('📞 VideoCallModal opened');
    console.log('   Recipient ID:', recipientId);
    console.log('   Current User ID:', currentUserId);
    console.log('   Server URL:', SERVER_URL);

    // ✅ Initialize Socket with better error handling
    socketRef.current = io(SERVER_URL, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 3,
      timeout: 10000
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      console.log('📞 Video socket connected:', socket.id);
      const token = localStorage.getItem('token') || '';
      const email = localStorage.getItem('email') || '';
      
      // ✅ Wait a bit before emitting to ensure connection is stable
      setTimeout(() => {
        socket.emit('join', { userId: currentUserId, token, email });
      }, 100);
    });

    socket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error.message);
      setCallStatus('connection-failed');
    });

    socket.on('callRinging', (data) => {
      console.log('📞 Call is ringing...', data);
      setCallStatus('ringing');
    });

    socket.on('callAccepted', (data) => {
      console.log('✅ Call accepted by recipient', data);
      setCallStatus('connected');
      if (callTimeoutRef.current) {
        clearTimeout(callTimeoutRef.current);
      }
    });

    socket.on('callRejected', (data) => {
      console.log('❌ Call rejected', data);
      alert('Call was rejected');
      handleEndCall();
    });

    socket.on('callEnded', (data) => {
      console.log('🔚 Call ended by other party', data);
      handleEndCall();
    });

    socket.on('callFailed', (data) => {
      console.log('❌ Call failed:', data.message);
      alert(data.message || 'Call failed');
      handleEndCall();
    });

    initializeCall();

    return () => {
      cleanup();
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      if (callTimeoutRef.current) {
        clearTimeout(callTimeoutRef.current);
      }
    };
  }, [isOpen]);

  useEffect(() => {
    if (callStatus === 'connected') {
      durationIntervalRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    }

    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, [callStatus]);

  const initializeCall = async () => {
    try {
      console.log('📞 Initializing call...');
      console.log('🌐 Backend URL:', SERVER_URL);

      // ✅ Wait for socket to be connected
      if (!socketRef.current?.connected) {
        console.log('⏳ Waiting for socket connection...');
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('Socket connection timeout'));
          }, 5000);
          
          socketRef.current.once('connect', () => {
            clearTimeout(timeout);
            resolve();
          });
        });
      }

      // ✅ Get Agora Token
      const response = await fetch(`${SERVER_URL}/api/agora/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        credentials: 'include',
        body: JSON.stringify({
          channelName: `call_${currentUserId}_${recipientId}`,
          userId: currentUserId
        })
      });

      console.log('📡 Token Response status:', response.status);

      if (!response.ok) {
        throw new Error(`Failed to get token: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Token received:', data);
      
      if (!data || !data.success) {
        throw new Error(data?.message || 'Invalid token response');
      }

      const { token: agoraToken, uid, appId } = data;

      // ✅ Create Agora client
      const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
      clientRef.current = client;

      // ✅ Join channel
      await client.join(
        appId, 
        `call_${currentUserId}_${recipientId}`, 
        agoraToken, 
        uid
      );
      console.log('✅ Joined Agora channel');

      // ✅ Create local tracks
      const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
      localAudioTrackRef.current = audioTrack;
      localVideoTrackRef.current = videoTrack;

      // ✅ Play local video
      if (localVideoRef.current) {
        videoTrack.play(localVideoRef.current);
        console.log('✅ Local video playing');
      }

      // ✅ Publish tracks
      await client.publish([audioTrack, videoTrack]);
      console.log('✅ Published tracks');

      // ✅ Send call signal via Socket.io with retry
      if (socketRef.current && socketRef.current.connected) {
        const email = localStorage.getItem('email') || '';
        
        console.log('📤 Sending call signal...');
        
        socketRef.current.emit('callUser', {
          userToCall: recipientId,
          from: currentUserId,
          signalData: { 
            channelName: `call_${currentUserId}_${recipientId}`,
            token: agoraToken,
            uid: uid
          },
          callerInfo: {
            name: recipientName || email.split('@')[0] || 'User',
            profileImage: ''
          }
        });
        
        console.log('📤 Call signal sent');
        setCallStatus('ringing');
        
        // ✅ Set timeout for no answer (30 seconds)
        callTimeoutRef.current = setTimeout(() => {
          if (callStatus === 'ringing') {
            console.log('⏰ Call timeout - no answer');
            alert('No answer. Please try again later.');
            handleEndCall();
          }
        }, 30000);
        
      } else {
        console.error('❌ Socket not connected!');
        throw new Error('Socket connection failed. Please check your internet connection.');
      }

      // ✅ Handle remote user
      client.on('user-published', async (user, mediaType) => {
        console.log('📥 Remote user published:', mediaType);
        await client.subscribe(user, mediaType);

        if (mediaType === 'video') {
          setCallStatus('connected');
          const remoteVideoTrack = user.videoTrack;
          if (remoteVideoRef.current) {
            remoteVideoTrack.play(remoteVideoRef.current);
            console.log('✅ Remote video playing');
          }
        }

        if (mediaType === 'audio') {
          const remoteAudioTrack = user.audioTrack;
          remoteAudioTrack.play();
          console.log('✅ Remote audio playing');
        }
      });

      client.on('user-unpublished', (user, mediaType) => {
        console.log('📤 Remote user unpublished:', mediaType);
      });

      client.on('user-left', () => {
        console.log('👋 Remote user left');
        setCallStatus('ended');
        setTimeout(() => handleEndCall(), 2000);
      });

    } catch (error) {
      console.error('❌ Call initialization error:', error);
      alert('Failed to start call: ' + error.message);
      onClose();
    }
  };

  const cleanup = async () => {
    try {
      console.log('🧹 Cleaning up call resources...');
      
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
      if (callTimeoutRef.current) {
        clearTimeout(callTimeoutRef.current);
      }
      
      console.log('✅ Cleanup complete');
    } catch (error) {
      console.error('❌ Cleanup error:', error);
    }
  };

  const handleEndCall = async () => {
    console.log('🔚 Ending call...');
    setCallStatus('ended');
    
    if (socketRef.current && socketRef.current.connected) {
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
            {callStatus === 'connecting' && '🔄 Connecting...'}
            {callStatus === 'ringing' && '📞 Ringing...'}
            {callStatus === 'connected' && `⏱️ ${formatDuration(callDuration)}`}
            {callStatus === 'ended' && '📴 Call Ended'}
            {callStatus === 'connection-failed' && '❌ Connection Failed'}
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
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900">
              <div className="w-32 h-32 bg-purple-600 rounded-full flex items-center justify-center mb-4">
                <span className="text-white text-5xl font-bold">
                  {recipientName?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">{recipientName || 'User'}</h2>
              <p className="text-gray-400">
                {callStatus === 'connecting' && 'Connecting...'}
                {callStatus === 'ringing' && 'Calling...'}
                {callStatus === 'ended' && 'Call ended'}
                {callStatus === 'connection-failed' && (
                  <>
                    <span className="block text-red-400">Connection failed</span>
                    <span className="block text-sm mt-2">Please check your internet</span>
                  </>
                )}
              </p>
            </div>
          )}
        </div>

        {/* Local Video */}
        <div className="absolute top-20 right-4 w-48 h-36 bg-gray-800 rounded-xl overflow-hidden border-2 border-gray-700 shadow-2xl">
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
            className={`p-5 rounded-full ${muted ? 'bg-red-600' : 'bg-gray-700'} hover:opacity-80 transition-all shadow-lg`}
          >
            {muted ? <MicOff className="w-7 h-7 text-white" /> : <Mic className="w-7 h-7 text-white" />}
          </button>

          <button
            onClick={toggleVideo}
            className={`p-5 rounded-full ${videoOff ? 'bg-red-600' : 'bg-gray-700'} hover:opacity-80 transition-all shadow-lg`}
          >
            {videoOff ? <VideoOff className="w-7 h-7 text-white" /> : <Video className="w-7 h-7 text-white" />}
          </button>

          <button
            onClick={handleEndCall}
            className="p-5 rounded-full bg-red-600 hover:bg-red-700 transition-all shadow-lg"
          >
            <PhoneOff className="w-7 h-7 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default VideoCallModal;