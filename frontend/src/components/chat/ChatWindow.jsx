import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Video, Send, Users, Wifi, WifiOff, X, Phone } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import io from 'socket.io-client';
import axios from 'axios';
import { formatDistanceToNow } from 'date-fns';
import VideoCallModal from '../VideoCallModal';

const dp = 'https://ui-avatars.com/api/?name=User&size=200&background=6366f1&color=fff';

function ChatWindow() {
  const location = useLocation();
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [conversations, setConversations] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [typing, setTyping] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [loading, setLoading] = useState(false);
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null);
  
  const messageEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const socketRef = useRef(null);
  const hasAutoSelectedRef = useRef(false);
  
  const token = localStorage.getItem('token');
  const userId = localStorage.getItem('userId');
  const email = localStorage.getItem('email');

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      messageEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, 100);
  }, []);

  const loadInbox = async () => {
    try {
      const config = {
        headers: { 'Authorization': `Bearer ${token}` },
        withCredentials: true
      };
      
      const response = await axios.get('/api/chat/inbox', config);
      if (response.data.success) {
        setConversations(response.data.data || []);
      }
    } catch (error) {
      console.error('❌ Load inbox error:', error);
    }
  };

  const loadChatHistory = async (otherUserId) => {
    try {
      setLoading(true);
      const config = {
        headers: { 'Authorization': `Bearer ${token}` },
        withCredentials: true
      };
      
      const response = await axios.get(`/api/chat/history/${otherUserId}`, config);
      if (response.data.success) {
        setMessages(response.data.items || []);
      }
    } catch (error) {
      console.error('❌ Load history error:', error);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const userFromPost = location.state?.selectedUser;
    
    if (userFromPost && userFromPost._id && !hasAutoSelectedRef.current) {
      console.log('📨 Auto-selecting user from post');
      hasAutoSelectedRef.current = true;
      
      const existingConv = conversations.find(
        conv => conv.userInfo._id === userFromPost._id
      );
      
      if (existingConv) {
        handleSelectUser(existingConv);
      } else {
        setSelectedUser(userFromPost);
        loadChatHistory(userFromPost._id);
      }
      
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [conversations]);

  // ✅ FIXED: Socket Connection with proper registration
  useEffect(() => {
    if (!token || !userId) {
      console.error('❌ Missing token or userId');
      return;
    }

    console.log('🔌 Initializing socket connection...');
    console.log('   User ID:', userId);
    console.log('   Email:', email);

    const SOCKET_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:8000';
    console.log('   Server URL:', SOCKET_URL);
    
    socketRef.current = io(SOCKET_URL, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    const socket = socketRef.current;

    const onConnect = () => {
      console.log('✅ Socket Connected:', socket.id);
      setConnectionStatus('connected');
      
      // ✅ CRITICAL: Register user immediately
      console.log('📝 Registering user with socket...');
      socket.emit('join', { 
        userId, 
        email, 
        token 
      });
      
      loadInbox();
    };

    const onDisconnect = (reason) => {
      console.log('❌ Socket Disconnected:', reason);
      setConnectionStatus('disconnected');
    };

    const onReceiveMessage = (msg) => {
      console.log('📨 Message received:', msg);
      setMessages(prev => {
        if (prev.some(m => m._id === msg._id)) return prev;
        if (selectedUser && (msg.from._id === selectedUser._id || msg.to._id === selectedUser._id)) {
          return [...prev, msg];
        }
        return prev;
      });
      loadInbox();
    };

    const onMessageSent = (msg) => {
      console.log('✅ Message sent confirmation:', msg);
      setMessages(prev => {
        if (prev.some(m => m._id === msg._id)) return prev;
        if (selectedUser && (msg.from._id === userId || msg.to._id === selectedUser._id)) {
          return [...prev, msg];
        }
        return prev;
      });
    };

    const onUserTyping = (data) => {
      if (selectedUser && data.userId === selectedUser._id) {
        setTyping(data);
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => setTyping(null), 3000);
      }
    };

    // ✅ FIXED: Incoming call handler
    const onIncomingCall = (data) => {
      console.log('📞 ========== INCOMING CALL RECEIVED ==========');
      console.log('   From:', data.from);
      console.log('   Caller Info:', data.callerInfo);
      console.log('   Signal:', data.signal);
      
      setIncomingCall(data);
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('receiveMessage', onReceiveMessage);
    socket.on('messageSent', onMessageSent);
    socket.on('userTyping', onUserTyping);
    socket.on('userStoppedTyping', () => setTyping(null));
    socket.on('incomingCall', onIncomingCall);

    if (!socket.connected) {
      socket.connect();
    } else {
      onConnect();
    }

    return () => {
      console.log('🔌 Cleaning up socket listeners');
      socket.off('connect');
      socket.off('disconnect');
      socket.off('receiveMessage');
      socket.off('messageSent');
      socket.off('userTyping');
      socket.off('userStoppedTyping');
      socket.off('incomingCall');
      socket.disconnect();
    };
  }, [userId, token, email, selectedUser?._id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages.length]);

const handleVideoCallClick = async () => {
  console.log('📹 Video call button clicked');
  
  // ✅ Check permissions first
  try {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert('Your browser does not support video calls.\n\nPlease use Chrome, Firefox, or Safari.');
      return;
    }

    // Request permission
    console.log('🎥 Checking camera/microphone permissions...');
    const stream = await navigator.mediaDevices.getUserMedia({ 
      video: true, 
      audio: true 
    });
    
    // Stop the test stream
    stream.getTracks().forEach(track => track.stop());
    console.log('✅ Permissions granted, starting call...');
    
    // Now open the video call modal
    setShowVideoCall(true);
    
  } catch (error) {
    console.error('❌ Permission check failed:', error);
    
    let errorMessage = 'Camera/Microphone access is required for video calls.';
    
    if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
      errorMessage = '📹 Camera/Microphone Permission Needed\n\n';
      errorMessage += 'To make video calls, please:\n\n';
      errorMessage += '1️⃣ Click the camera icon in your browser address bar\n';
      errorMessage += '2️⃣ Select "Allow" for camera and microphone\n';
      errorMessage += '3️⃣ Refresh the page and try again\n\n';
      errorMessage += '💡 On mobile: Check your browser app permissions in phone settings';
    } else if (error.name === 'NotFoundError') {
      errorMessage = '❌ No camera or microphone found on your device';
    } else if (error.name === 'NotReadableError') {
      errorMessage = '⚠️ Camera or microphone is already in use by another app. Please close other apps and try again.';
    }
    
    alert(errorMessage);
  }
};

  const handleSelectUser = (conv) => {
    setSelectedUser(conv.userInfo);
    setMessages([]);
    setTyping(null);
    loadChatHistory(conv.userInfo._id);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim() || !selectedUser) return;

    const msgData = {
      from: userId,
      to: selectedUser._id,
      text: message.trim(),
      image: null,
      timestamp: new Date().toISOString()
    };

    if (socketRef.current?.connected) {
      socketRef.current.emit('sendMessage', msgData);
      setMessage('');
    } else {
      console.error('❌ Socket not connected');
      alert('Connection lost. Please refresh the page.');
    }
  };

  const handleAcceptCall = () => {
    if (incomingCall) {
      setShowVideoCall(true);
      setSelectedUser({
        _id: incomingCall.from,
        userName: incomingCall.callerInfo.name,
        firstName: incomingCall.callerInfo.name,
        lastName: '',
        profileImage: incomingCall.callerInfo.profileImage
      });
      setIncomingCall(null);
    }
  };

  const handleRejectCall = () => {
    if (incomingCall && socketRef.current?.connected) {
      socketRef.current.emit('rejectCall', { to: incomingCall.from });
      setIncomingCall(null);
    }
  };

  const getUserName = (user) => {
    if (!user) return 'Unknown';
    if (user.firstName && user.lastName) return `${user.firstName} ${user.lastName}`;
    return user.userName || 'User';
  };

  return (
    <>
      <div className="flex h-screen bg-slate-900 pt-16">
        
        <aside className="w-80 border-r border-slate-700 bg-slate-800 flex flex-col">
          <div className="p-4 border-b border-slate-700">
            <h3 className="font-semibold text-lg text-white flex items-center gap-2 mb-4">
              <Users className="w-5 h-5" />
              Messages
            </h3>
            
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
              connectionStatus === 'connected' ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'
            }`}>
              {connectionStatus === 'connected' ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
              {connectionStatus}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="p-4 text-center text-gray-400">No conversations</div>
            ) : (
              <ul className="p-2 space-y-1">
                {conversations.map((conv) => (
                  <li
                    key={conv._id}
                    className={`p-3 rounded-lg cursor-pointer hover:bg-slate-700 ${
                      selectedUser?._id === conv.userInfo._id ? 'bg-purple-900' : ''
                    }`}
                    onClick={() => handleSelectUser(conv)}
                  >
                    <div className="flex items-center gap-3">
                      <img 
                        src={conv.userInfo.profileImage || dp}
                        alt={getUserName(conv.userInfo)}
                        className="w-10 h-10 rounded-full border-2 border-purple-500"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-white truncate">
                          {getUserName(conv.userInfo)}
                        </div>
                        <div className="text-sm text-gray-400 truncate">
                          {conv.lastMessage?.text || 'Image'}
                        </div>
                      </div>
                      {conv.unread > 0 && (
                        <div className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs">
                          {conv.unread}
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>

        <main className="flex-1 flex flex-col bg-slate-900">
          {selectedUser ? (
            <>
              <header className="border-b border-slate-700 p-4 bg-slate-800">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <img 
                      src={selectedUser.profileImage || dp}
                      alt={getUserName(selectedUser)}
                      className="w-10 h-10 rounded-full border-2 border-purple-500"
                    />
                    <div>
                      <h1 className="font-semibold text-lg text-white">{getUserName(selectedUser)}</h1>
                      <span className="text-sm text-gray-400">@{selectedUser.userName}</span>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => setShowVideoCall(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                  >
                    <Video className="w-4 h-4" />
                    Video Call
                  </button>
                </div>
              </header>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {loading ? (
                  <div className="text-center text-gray-400">Loading...</div>
                ) : messages.length === 0 ? (
                  <div className="text-center text-gray-400">Start the conversation!</div>
                ) : (
                  messages.map((msg, idx) => {
                    const isMine = msg.from._id === userId || msg.from === userId;
                    
                    return (
                      <div key={msg._id || idx} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs px-4 py-2 rounded-lg ${
                          isMine ? 'bg-purple-600 text-white' : 'bg-slate-700 text-gray-100'
                        }`}>
                          {msg.text && <div className="text-sm">{msg.text}</div>}
                        </div>
                      </div>
                    );
                  })
                )}
                
                {typing && (
                  <div className="flex justify-start">
                    <div className="bg-slate-700 rounded-lg px-4 py-3">
                      <span className="text-sm text-gray-300">typing...</span>
                    </div>
                  </div>
                )}
                
                <div ref={messageEndRef} />
              </div>

              <div className="border-t border-slate-700 p-4 bg-slate-800">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Type a message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(e)}
                    className="flex-1 px-4 py-2 bg-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <button 
                    onClick={handleSendMessage}
                    disabled={!message.trim() || loading} 
                    className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Users className="w-12 h-12 mx-auto mb-4 text-gray-600" />
                <h2 className="text-xl font-semibold text-gray-300">Select a conversation</h2>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ✅ Incoming Call Popup */}
      {incomingCall && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center">
          <div className="bg-slate-800 rounded-2xl p-8 text-center max-w-md">
            <div className="w-24 h-24 bg-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center animate-pulse">
              <Phone className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Incoming Call</h2>
            <p className="text-gray-300 mb-6">{incomingCall.callerInfo.name} is calling...</p>
            
            <div className="flex gap-4 justify-center">
              <button
                onClick={handleRejectCall}
                className="px-6 py-3 bg-red-600 hover:bg-red-700 rounded-full text-white font-semibold flex items-center gap-2"
              >
                <X className="w-5 h-5" />
                Decline
              </button>
              <button
                onClick={handleAcceptCall}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 rounded-full text-white font-semibold flex items-center gap-2 animate-pulse"
              >
                <Phone className="w-5 h-5" />
                Answer
              </button>
            </div>
          </div>
        </div>
      )}

      {showVideoCall && selectedUser && (
        <VideoCallModal
          isOpen={showVideoCall}
          onClose={() => setShowVideoCall(false)}
          recipientId={selectedUser._id}
          recipientName={getUserName(selectedUser)}
          currentUserId={userId}
        />
      )}
    </>
  );
}

export default ChatWindow;