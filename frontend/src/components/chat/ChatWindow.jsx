import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Video, Phone, Send, Users, Wifi, WifiOff } from 'lucide-react';
import io from 'socket.io-client';
import { useCall } from '../../context/CallContext';
import VideoCall from '../VideoCall';

const socket = io('/', {
  withCredentials: true,
  transports: ['websocket', 'polling']
});

function ChatWindow() {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [typing, setTyping] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  
  const messageEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  
  const { callUser, callAccepted } = useCall();
  
  const token = localStorage.getItem('token');
  const email = localStorage.getItem('email');
  const userId = localStorage.getItem('userId');

  const displayName = useCallback((mail) => 
    mail ? mail.split('@')[0] : 'User', []);
  
  const formatTime = useCallback((ts) => 
    new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), []);

  const addNotification = useCallback((text) => {
    const id = Date.now() + Math.random();
    setNotifications(prev => [...prev, { id, text }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 4000);
  }, []);

  const scrollToBottom = useCallback(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (!token || !userId) {
      console.error("No auth data");
      addNotification("Please login to use chat");
      return;
    }

    const onConnect = () => {
      console.log('✅ Connected');
      setConnectionStatus('connected');
      socket.emit('join', { token, email, userId });
    };

    const onDisconnect = () => {
      setConnectionStatus('disconnected');
      addNotification('Reconnecting...');
    };

    const onMessage = (msg) => {
      const newMsg = { 
        ...msg, 
        timestamp: msg.timestamp || new Date().toISOString(), 
        id: msg.id || Date.now() + Math.random() 
      };
      setMessages(prev => [...prev, newMsg]);
      if (msg.from !== userId) {
        addNotification(`New message from ${displayName(msg.user)}`);
      }
    };

    const onOnlineUsers = (users) => {
      console.log("Online users:", users);
      setOnlineUsers(users || []);
    };

    const onTyping = (userTypingEmail) => {
      if (selectedUser && userTypingEmail === selectedUser.email) {
        setTyping(true);
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => setTyping(false), 1500);
      }
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('message', onMessage);
    socket.on('onlineUsers', onOnlineUsers);
    socket.on('typing', onTyping);

    if (!socket.connected) {
      socket.connect();
    }

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('message', onMessage);
      socket.off('onlineUsers', onOnlineUsers);
      socket.off('typing', onTyping);
      clearTimeout(typingTimeoutRef.current);
    };
  }, [userId, email, token, selectedUser, addNotification, displayName]);

  const handleSelectUser = useCallback((user) => {
    setSelectedUser(user);
    setMessages([]);
    setTyping(false);
  }, []);

  const handleSendMessage = useCallback((e) => {
    e.preventDefault();
    if (!selectedUser || !message.trim()) return;

    const msgData = {
      from: userId,
      user: email,
      text: message.trim(),
      to: selectedUser.id,
      timestamp: new Date().toISOString(),
      id: Date.now()
    };

    socket.emit('sendMessage', {
      userId: userId,
      to: selectedUser.id,
      text: message.trim(),
      timestamp: new Date().toISOString(),
    });

    setMessages(prev => [...prev, msgData]);
    setMessage('');
  }, [selectedUser, message, userId, email]);

  const handleTyping = useCallback((e) => {
    setMessage(e.target.value);
    if (selectedUser?.id) {
      socket.emit('typing', selectedUser.id);
    }
  }, [selectedUser]);

  const startVideoCall = () => {
    if (!selectedUser?.id) {
      addNotification('Select a user first');
      return;
    }
    callUser(selectedUser.id);
    addNotification(`Calling ${displayName(selectedUser.email)}...`);
  };

  return (
    <>
      <VideoCall />
      
      <div className="flex h-screen bg-slate-900">
        
        {/* Sidebar */}
        <aside className="w-80 border-r border-slate-700 bg-slate-800 flex flex-col">
          <div className="p-4 border-b border-slate-700">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-lg text-white flex items-center gap-2">
                <Users className="w-5 h-5" />
                Online ({onlineUsers.length})
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
            {onlineUsers.length === 0 ? (
              <div className="p-4 text-center text-gray-400">
                No users online
              </div>
            ) : (
              <ul className="p-2 space-y-1">
                {onlineUsers.map((user) => (
                  <li
                    key={user.id}
                    className={`p-3 rounded-lg cursor-pointer transition-all hover:bg-slate-700 ${
                      selectedUser?.id === user.id ? 'bg-purple-900 border border-purple-700' : ''
                    }`}
                    onClick={() => handleSelectUser(user)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                          {displayName(user.email).charAt(0).toUpperCase()}
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-800"></div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate text-white">
                          {displayName(user.email)}
                        </div>
                        <div className="text-sm text-green-400">Online</div>
                      </div>
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
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                      {displayName(selectedUser.email).charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h1 className="font-semibold text-lg text-white">
                        {displayName(selectedUser.email)}
                      </h1>
                      <span className="text-sm px-2 py-1 rounded-full bg-green-900 text-green-300">
                        Online
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button 
                      className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                      onClick={startVideoCall}
                      disabled={callAccepted}
                    >
                      <Video className="w-4 h-4" />
                      Video Call
                    </button>
                  </div>
                </div>
              </header>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => {
                  const isMine = msg.from === userId;
                  return (
                    <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        isMine 
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white' 
                          : 'bg-slate-700 text-gray-100'
                      }`}>
                        <div className="text-sm">{msg.text}</div>
                        <div className={`text-xs mt-1 ${
                          isMine ? 'text-purple-200' : 'text-gray-400'
                        }`}>
                          {formatTime(msg.timestamp)}
                        </div>
                      </div>
                    </div>
                  );
                })}
                
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
                <div className="flex gap-2">
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
                    disabled={!message.trim()} 
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
                <p className="text-gray-500">Select a user to start chatting</p>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Notifications */}
      <div className="fixed top-4 right-4 space-y-2 z-50">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className="px-4 py-2 rounded-lg shadow-lg bg-slate-800 text-white border border-slate-700"
          >
            {notification.text}
          </div>
        ))}
      </div>
    </>
  );
}

export default ChatWindow;