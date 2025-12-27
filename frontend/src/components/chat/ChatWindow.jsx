import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Video, Send, Users, Wifi, WifiOff, Image, X } from 'lucide-react';
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
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [typing, setTyping] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [loading, setLoading] = useState(false);
  const [showVideoCall, setShowVideoCall] = useState(false);
  
  const messageEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);
  const socketRef = useRef(null);
  const hasAutoSelectedRef = useRef(false);
  
  const token = localStorage.getItem('token');
  const userId = localStorage.getItem('userId');

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

  // ✅ FIX: Auto-select user from post (once only)
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
      
      // Clear location state
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [conversations]);

  // ✅ SOCKET CONNECTION
  useEffect(() => {
    if (!token || !userId) return;

    if (!socketRef.current) {
      const SOCKET_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:8000';
      
      socketRef.current = io(SOCKET_URL, {
        withCredentials: true,
        transports: ['websocket', 'polling'],
        reconnection: true
      });
    }

    const socket = socketRef.current;

    const onConnect = () => {
      console.log('✅ Socket Connected');
      setConnectionStatus('connected');
      socket.emit('join', { token, userId, email: localStorage.getItem('email') });
      loadInbox();
    };

    const onDisconnect = () => {
      console.log('❌ Disconnected');
      setConnectionStatus('disconnected');
    };

    const onReceiveMessage = (msg) => {
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

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('receiveMessage', onReceiveMessage);
    socket.on('messageSent', onMessageSent);
    socket.on('userTyping', onUserTyping);
    socket.on('userStoppedTyping', () => setTyping(null));

    if (!socket.connected) socket.connect();
    else onConnect();

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('receiveMessage');
      socket.off('messageSent');
      socket.off('userTyping');
      socket.off('userStoppedTyping');
    };
  }, [userId, token, selectedUser?._id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages.length]);

  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  const handleSelectUser = (conv) => {
    setSelectedUser(conv.userInfo);
    setMessages([]);
    setTyping(null);
    loadChatHistory(conv.userInfo._id);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if ((!message.trim() && !selectedImage) || !selectedUser) return;

    const msgData = {
      from: userId,
      to: selectedUser._id,
      text: message.trim(),
      image: null,
      timestamp: new Date().toISOString()
    };

    socketRef.current?.emit('sendMessage', msgData);
    setMessage('');
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