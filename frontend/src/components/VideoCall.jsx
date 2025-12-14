import React from 'react';
import { useCall } from '../context/CallContext';
import { Phone, PhoneOff, Video, VideoOff, Mic, MicOff } from 'lucide-react';

function VideoCall() {
  const {
    call,
    callAccepted,
    myVideo,
    userVideo,
    stream,
    callUser,
    endCall,
    answerCall,
    callEnded
  } = useCall();

  const [muted, setMuted] = React.useState(false);
  const [videoOff, setVideoOff] = React.useState(false);

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

  if (!call.isReceivingCall && !callAccepted) return null;

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center">
      <div className="w-full h-full relative">
        
        {/* Remote Video (Full Screen) */}
        {callAccepted && (
          <video 
            ref={userVideo} 
            autoPlay 
            playsInline
            className="w-full h-full object-cover"
          />
        )}

        {/* My Video (Small Corner) */}
        <div className="absolute top-4 right-4 w-48 h-36 bg-gray-800 rounded-lg overflow-hidden shadow-2xl">
          <video 
            ref={myVideo} 
            autoPlay 
            muted 
            playsInline
            className="w-full h-full object-cover"
          />
        </div>

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
            onClick={endCall}
            className="p-4 rounded-full bg-red-600 hover:bg-red-700 transition-all"
          >
            <PhoneOff className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Incoming Call UI */}
        {call.isReceivingCall && !callAccepted && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80">
            <div className="bg-gray-800 rounded-2xl p-8 text-center">
              <div className="w-20 h-20 bg-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                <Phone className="w-10 h-10 text-white animate-pulse" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Incoming Call</h2>
              <p className="text-gray-300 mb-6">Someone is calling you...</p>
              
              <div className="flex gap-4 justify-center">
                <button
                  onClick={answerCall}
                  className="px-6 py-3 bg-green-600 hover:bg-green-700 rounded-full text-white font-semibold flex items-center gap-2"
                >
                  <Phone className="w-5 h-5" />
                  Answer
                </button>
                <button
                  onClick={endCall}
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
        {!callAccepted && !call.isReceivingCall && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
            <div className="w-20 h-20 bg-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center">
              <Phone className="w-10 h-10 text-white animate-pulse" />
            </div>
            <p className="text-white text-xl">Calling...</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default VideoCall;