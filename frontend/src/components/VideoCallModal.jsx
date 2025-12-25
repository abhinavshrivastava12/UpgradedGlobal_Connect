import React, { useEffect, useRef, useState } from 'react';
import { Phone, PhoneOff, Video, VideoOff, Mic, MicOff, X, Maximize2, Minimize2 } from 'lucide-react';
import AgoraRTC from 'agora-rtc-sdk-ng';
import axios from 'axios';

const APP_ID = '04d8a9031217470bb3b5c0d6b7a0db55'; // Your Agora App ID

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
  const [callStatus, setCallStatus] = useState('connecting'); // connecting, ringing, connected, ended
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  
  const localVideoRef = useRef();
  const remoteVideoRef = useRef();
  const clientRef = useRef(null);
  const localAudioTrackRef = useRef(null);
  const localVideoTrackRef = useRef(null);
  const durationIntervalRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    initializeCall();

    return () => {
      cleanup();
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
      // Get Agora token from backend
      const token = localStorage.getItem('token');
      const response = await axios.post(
        '/api/agora/token',
        { 
          channelName: `call_${currentUserId}_${recipientId}`,
          userId: currentUserId 
        },
        {
          headers: { 'Authorization': `Bearer ${token}` },
          withCredentials: true
        }
      );

      const { token: agoraToken, uid } = response.data;

      // Create Agora client
      const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
      clientRef.current = client;

      // Join channel
      await client.join(APP_ID, `call_${currentUserId}_${recipientId}`, agoraToken, uid);

      // Create local tracks
      const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
      localAudioTrackRef.current = audioTrack;
      localVideoTrackRef.current = videoTrack;

      // Play local video
      if (localVideoRef.current) {
        videoTrack.play(localVideoRef.current);
      }

      // Publish local tracks
      await client.publish([audioTrack, videoTrack]);

      setCallStatus('ringing');

      // Listen for remote users
      client.on('user-published', async (user, mediaType) => {
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
        if (mediaType === 'video') {
          // Remote user turned off video
        }
      });

      client.on('user-left', () => {
        setCallStatus('ended');
        setTimeout(() => {
          handleEndCall();
        }, 2000);
      });

    } catch (error) {
      console.error('Call initialization error:', error);
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
        
        {/* Call Status Banner */}
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

        {/* Call Duration */}
        {callStatus === 'connected' && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 bg-green-500/20 backdrop-blur-md px-6 py-2 rounded-full border border-green-500/50">
            <p className="text-green-300 text-sm font-medium">
              {formatDuration(callDuration)}
            </p>
          </div>
        )}

        {/* Close Button */}
        <button
          onClick={handleEndCall}
          className="absolute top-4 right-4 z-10 p-2 bg-red-600 rounded-full hover:bg-red-700 transition-all shadow-lg"
        >
          <X className="w-6 h-6 text-white" />
        </button>

        {/* Fullscreen Toggle */}
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

        {/* Remote Video (Full Screen) */}
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

        {/* Local Video (Small Corner) */}
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

        {/* Controls */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-4">
          
          {/* Mute Button */}
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

          {/* Video Toggle */}
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

          {/* End Call */}
          <button
            onClick={handleEndCall}
            className="p-5 rounded-full bg-red-600 hover:bg-red-700 transition-all shadow-lg">
            <PhoneOff className="w-7 h-7 text-white" />
            </button>
            </div>
                {/* Call Info */}
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