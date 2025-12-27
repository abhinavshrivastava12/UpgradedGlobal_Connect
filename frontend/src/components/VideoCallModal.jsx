import React, { useEffect, useRef, useState } from 'react';
import { Phone, PhoneOff, Video, VideoOff, Mic, MicOff, X, Maximize2, Minimize2 } from 'lucide-react';
import AgoraRTC from 'agora-rtc-sdk-ng';
import io from 'socket.io-client';

const APP_ID = '04d8a9031217470bb3b5c0d6b7a0db55';

function VideoCallModal({
  isOpen,
  onClose,
  recipientId,
  recipientName,
  currentUserId
}) {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
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
      console.log('📞 Video call socket connected');
      const token = localStorage.getItem('token') || '';
      const email = localStorage.getItem('email') || '';
      socket.emit('join', { 
        userId: currentUserId, 
        token,
        email
      });
    });

    socket.on('callAccepted', (data) => {
      console.log('✅ Call accepted by recipient');
      setCallStatus('connected');
    });

    socket.on('callRejected', () => {
      console.log('❌ Call rejected by recipient');
      alert('Call was rejected');
      handleEndCall();
    });

    socket.on('callEnded', () => {
      console.log('🔚 Call ended by other user');
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
      if (socketRef.current) {
        socketRef.current.disconnect();
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
      console.log('📞 Initializing video call...');

      // ✅ FIX: Proper token fetching with error handling
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

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

      // ✅ FIX: Better response validation
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Token fetch failed:', response.status, errorText);
        throw new Error(`Failed to get token: ${response.status}`);
      }

      const data = await response.json();
      
      // ✅ FIX: Validate response data
      if (!data || !data.appId) {
        console.error('Invalid response data:', data);
        throw new Error('Invalid token response');
      }

      const { token: agoraToken, uid, appId } = data;
      console.log('✅ Agora token received');

      const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
      clientRef.current = client;

      await client.join(appId || APP_ID, `call_${currentUserId}_${recipientId}`, agoraToken || null, uid);
      console.log('✅ Joined Agora channel');

      const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
      localAudioTrackRef.current = audioTrack;
      localVideoTrackRef.current = videoTrack;

      if (localVideoRef.current) {
        videoTrack.play(localVideoRef.current);
      }

      await client.publish([audioTrack, videoTrack]);
      console.log('✅ Published local tracks');

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
        console.log('📤 Call signal sent to recipient');
      }

      client.on('user-published', async (user, mediaType) => {
        console.log('📥 Remote user published:', mediaType);
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

      client.on('user-unpublished', (user, mediaType) => {
        console.log('📤 Remote user unpublished:', mediaType);
      });

      client.on('user-left', () => {
        console.log('👋 Remote user left');
        setCallStatus('ended');
        setTimeout(() => {
          handleEndCall();
        }, 2000);
      });

    } catch (error) {
      console.error('❌ Call initialization error:', error);
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
      console.error('❌ Cleanup error:', error);
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
      if (muted) {
        localAudioTrackRef.current.setEnabled(true);
      } else {
        localAudioTrackRef.current.setEnabled(false);
      }
      setMuted(!muted);
    }
  };

  const toggleVideo = () => {
    if (localVideoTrackRef.current) {
      if (videoOff) {
        localVideoTrackRef.current.setEnabled(true);
      } else {
        localVideoTrackRef.current.setEnabled(false);
      }
      setVideoOff(!videoOff);
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 bg-black z-50 flex items-center justify-center ${isFullscreen ? '' : 'p-4'}`}>
      <div className={`relative ${isFullscreen ? 'w-full h-full' : 'w-full max-w-6xl h-[90vh]'} bg-gray-900 rounded-2xl overflow-hidden shadow-2xl`}>
        
        {callStatus !== 'connected' && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 bg-black/70 backdrop-blur-md px-6 py-3 rounded-full">
            <p className="text-white text-sm font-medium flex items-center gap-2">
              {callStatus === 'connecting' && (
                <>
                  <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
                  Connecting...
                </>
              )}
              {callStatus === 'ringing' && (
                <>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                  Ringing...
                </>
              )}
              {callStatus === 'ended' && (
                <>
                  <div className="w-2 h-2 bg-red-400 rounded-full" />
                  Call Ended
                </>
              )}
            </p>
          </div>
        )}

        {callStatus === 'connected' && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 bg-green-500/20 backdrop-blur-md px-6 py-2 rounded-full border border-green-500/50">
            <p className="text-green-300 text-sm font-medium">
              {formatDuration(callDuration)}
            </p>
          </div>
        )}

        <button
          onClick={handleEndCall}
          className="absolute top-4 right-4 z-10 p-2 bg-red-600 rounded-full hover:bg-red-700 transition-all shadow-lg"
        >
          <X className="w-6 h-6 text-white" />
        </button>

        <button
          onClick={toggleFullscreen}
          className="absolute top-4 right-16 z-10 p-2 bg-gray-700/70 rounded-full hover:bg-gray-600 transition-all"
        >
          {isFullscreen ? (
            <Minimize2 className="w-5 h-5 text-white" />
          ) : (
            <Maximize2 className="w-5 h-5 text-white" />
          )}
        </button>

        <div className="relative w-full h-full bg-gray-800">
          <div 
            ref={remoteVideoRef}
            className="w-full h-full"
            style={{ objectFit: 'cover' }}
          />
          
          {callStatus !== 'connected' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="w-32 h-32 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mb-4 shadow-2xl">
                <span className="text-white text-4xl font-bold">
                  {recipientName?.charAt(0)?.toUpperCase()}
                </span>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">{recipientName}</h2>
            </div>
          )}
        </div>

        <div className="absolute top-20 right-4 w-48 h-36 bg-gray-800 rounded-xl overflow-hidden shadow-2xl border-2 border-gray-700">
          <div 
            ref={localVideoRef}
            className="w-full h-full"
            style={{ objectFit: 'cover' }}
          />
          {videoOff && (
            <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
              <VideoOff className="w-8 h-8 text-gray-400" />
            </div>
          )}
        </div>

        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-4">
          
          <button
            onClick={toggleMute}
            className={`p-5 rounded-full transition-all shadow-lg ${
              muted 
                ? 'bg-red-600 hover:bg-red-700' 
                : 'bg-gray-700/70 hover:bg-gray-600'
            }`}
          >
            {muted ? (
              <MicOff className="w-7 h-7 text-white" />
            ) : (
              <Mic className="w-7 h-7 text-white" />
            )}
          </button>

          <button
            onClick={toggleVideo}
            className={`p-5 rounded-full transition-all shadow-lg ${
              videoOff 
                ? 'bg-red-600 hover:bg-red-700' 
                : 'bg-gray-700/70 hover:bg-gray-600'
            }`}
          >
            {videoOff ? (
              <VideoOff className="w-7 h-7 text-white" />
            ) : (
              <Video className="w-7 h-7 text-white" />
            )}
          </button>

          <button
            onClick={handleEndCall}
            className="p-5 rounded-full bg-red-600 hover:bg-red-700 transition-all shadow-lg"
          >
            <PhoneOff className="w-7 h-7 text-white" />
          </button>
        </div>

        <div className="absolute bottom-28 left-1/2 transform -translate-x-1/2 text-center">
          <p className="text-white text-lg font-medium">{recipientName}</p>
          <p className="text-gray-400 text-sm">
            {callStatus === 'connected' ? 'Connected' : 'Calling...'}
          </p>
        </div>
      </div>
    </div>
  );
}

export default VideoCallModal;