import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Video, Send, Users, Wifi, WifiOff, Image, X } from 'lucide-react';
import io from 'socket.io-client';
import axios from 'axios';
import dp from '../../assets/dp.webp';

const socket = io('http://localhost:8000', {
  withCredentials: true,
  transports: ['websocket', 'polling']
});

function ChatWindow() {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [typing, setTyping] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [loading, setLoading] = useState(false);
  
  const messageEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);
  
  const token = localStorage.getItem('token');
  const userId = localStorage.getItem('userId');

  const scrollToBottom = useCallback(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Load inbox conversations
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
      console.error('Load inbox error:', error);
    }
  };

  // Load chat history
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
      console.error('Load history error:', error);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  // Socket setup
  useEffect(() => {
    if (!token || !userId) {
      console.error("❌ No auth data");
      return;
    }

    const onConnect = () => {
      console.log('✅ Socket Connected:', socket.id);
      setConnectionStatus('connected');
      socket.emit('join', { token, userId });
      loadInbox();
    };

    const onDisconnect = (reason) => {
      console.log('❌ Socket Disconnected:', reason);
      setConnectionStatus('disconnected');
    };

    const onReceiveMessage = (msg) => {
      console.log('📨 Message received:', msg);
      
      // Add to messages if from selected user
      if (selectedUser && (msg.from._id === selectedUser._id || msg.to._id === selectedUser._id)) {
        setMessages(prev => [...prev, msg]);
      }
      
      // Reload inbox
      loadInbox();
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
    socket.on('userTyping', onUserTyping);
    socket.on('userStoppedTyping', () => setTyping(null));

    if (!socket.connected) {
      socket.connect();
    } else {
      onConnect();
    }

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('receiveMessage', onReceiveMessage);
      socket.off('userTyping', onUserTyping);
      socket.off('userStoppedTyping');
      clearTimeout(typingTimeoutRef.current);
    };
  }, [userId, token, selectedUser]);

  const handleSelectUser = (conv) => {
    const user = conv.userInfo;
    setSelectedUser(user);
    setMessages([]);
    setTyping(null);
    loadChatHistory(user._id);
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if ((!message.trim() && !selectedImage) || !selectedUser) return;

    let imageUrl = null;

    // Upload image if selected
    if (selectedImage) {
      try {
        const formData = new FormData();
        formData.append('image', selectedImage);
        
        const config = {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          },
          withCredentials: true
        };

        const response = await axios.post('/api/upload/image', formData, config);
        imageUrl = response.data.url;
      } catch (error) {
        console.error('Image upload error:', error);
        alert('Failed to upload image');
        return;
      }
    }

    const msgData = {
      from: userId,
      to: selectedUser._id,
      text: message.trim(),
      image: imageUrl,
      timestamp: new Date().toISOString()
    };

    socket.emit('sendMessage', msgData);
    
    setMessage('');
    handleRemoveImage();
  };

  const handleTyping = (e) => {
    setMessage(e.target.value);
    if (selectedUser) {
      socket.emit('typing', selectedUser._id);
    }
  };

  const getUserName = (user) => {
    if (!user) return 'Unknown';
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user.userName || 'User';
  };

  return (
    <div className="flex h-screen bg-slate-900 pt-20">
      
      {/* Sidebar - Conversations */}
      <aside className="w-80 border-r border-slate-700 bg-slate-800 flex flex-col">
        <div className="p-4 border-b border-slate-700">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-lg text-white flex items-center gap-2">
              <Users className="w-5 h-5" />
              Messages
            </h3>
          </div>
          
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
            connectionStatus === 'connected' 
              ? 'bg-green-900 text-green-300' 
              : 'bg-red-900 text-red-300'
          }`}>
            {connectionStatus === 'connected' ? 
              <Wifi className="w-4 h-4" /> : 
              <WifiOff className="w-4 h-4" />
            }
            {connectionStatus}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-4 text-center text-gray-400">
              No conversations yet
            </div>
          ) : (
            <ul className="p-2 space-y-1">
              {conversations.map((conv) => (
                <li
                  key={conv._id}
                  className={`p-3 rounded-lg cursor-pointer transition-all hover:bg-slate-700 ${
                    selectedUser?._id === conv.userInfo._id ? 'bg-purple-900 border border-purple-700' : ''
                  }`}
                  onClick={() => handleSelectUser(conv)}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-purple-500">
                        <img 
                          src={conv.userInfo.profileImage || dp}
                          alt={getUserName(conv.userInfo)}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate text-white">
                        {getUserName(conv.userInfo)}
                      </div>
                      <div className="text-sm text-gray-400 truncate">
                        {conv.lastMessage?.text || 'Image'}
                      </div>
                    </div>
                    {conv.unread > 0 && (
                      <div className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs font-bold">
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

      {/* Main Chat */}
      <main className="flex-1 flex flex-col bg-slate-900">
        {selectedUser ? (
          <>
            <header className="border-b border-slate-700 p-4 bg-slate-800">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-purple-500">
                    <img 
                      src={selectedUser.profileImage || dp}
                      alt={getUserName(selectedUser)}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h1 className="font-semibold text-lg text-white">
                      {getUserName(selectedUser)}
                    </h1>
                    <span className="text-sm text-gray-400">
                      @{selectedUser.userName}
                    </span>
                  </div>
                </div>
                
                <button className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                  <Video className="w-4 h-4" />
                  Video Call
                </button>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {loading ? (
                <div className="text-center text-gray-400">Loading messages...</div>
              ) : messages.length === 0 ? (
                <div className="text-center text-gray-400">No messages yet. Start the conversation!</div>
              ) : (
                messages.map((msg, idx) => {
                  const isMine = msg.from._id === userId || msg.from === userId;
                  const sender = isMine ? 'You' : getUserName(msg.from);
                  
                  return (
                    <div key={msg._id || idx} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs lg:max-w-md ${isMine ? 'order-2' : 'order-1'}`}>
                        {!isMine && (
                          <div className="text-xs text-gray-400 mb-1">{sender}</div>
                        )}
                        <div className={`px-4 py-2 rounded-lg ${
                          isMine 
                            ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white' 
                            : 'bg-slate-700 text-gray-100'
                        }`}>
                          {msg.image && (
                            <img 
                              src={msg.image} 
                              alt="Shared" 
                              className="rounded-lg mb-2 max-w-full cursor-pointer"
                              onClick={() => window.open(msg.image, '_blank')}
                            />
                          )}
                          {msg.text && <div className="text-sm">{msg.text}</div>}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              
              {typing && (
                <div className="flex justify-start">
                  <div className="rounded-lg px-4 py-2 bg-slate-700">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                      <span className="text-xs text-gray-300">typing...</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messageEndRef} />
            </div>

            <div className="border-t border-slate-700 p-4 bg-slate-800">
              {imagePreview && (
                <div className="mb-2 relative inline-block">
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    className="h-20 rounded-lg"
                  />
                  <button
                    onClick={handleRemoveImage}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              
              <div className="flex gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 flex items-center gap-2"
                >
                  <Image className="w-4 h-4" />
                </button>
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={message}
                  onChange={handleTyping}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(e)}
                  className="flex-1 px-4 py-2 border border-slate-600 bg-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button 
                  onClick={handleSendMessage}
                  disabled={!message.trim() && !selectedImage} 
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  Send
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Users className="w-12 h-12 mx-auto mb-4 text-gray-600" />
              <h2 className="text-xl font-semibold mb-2 text-gray-300">Welcome to Chat</h2>
              <p className="text-gray-500">Select a conversation to start chatting</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default ChatWindow;