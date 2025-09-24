import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Video, Phone, PhoneOff, Send, Users, Wifi, WifiOff, Moon, Sun } from 'lucide-react';

// Mock socket.io implementation for demo
const mockSocket = {
  connected: false,
  id: 'demo-socket-id',
  
  connect() {
    this.connected = true;
    setTimeout(() => this.emit('connect'), 100);
  },
  
  disconnect() {
    this.connected = false;
    this.emit('disconnect');
  },
  
  emit(event, data) {
    console.log('Socket emit:', event, data);
    
    // Simulate responses
    if (event === 'join') {
      setTimeout(() => {
        this.emit('onlineUsers', [
          { id: '1', email: 'user1@example.com' },
          { id: '2', email: 'user2@example.com' },
          { id: '3', email: 'user3@example.com' }
        ]);
      }, 500);
    }
    
    if (event === 'sendMessage') {
      // Echo message back as demo
      setTimeout(() => {
        this.emit('message', {
          from: data.to,
          user: 'demo@example.com',
          text: `Demo response to: ${data.text}`,
          to: data.userId,
          timestamp: new Date().toISOString()
        });
      }, 1000);
    }
  },
  
  on(event, callback) {
    this.listeners = this.listeners || {};
    this.listeners[event] = this.listeners[event] || [];
    this.listeners[event].push(callback);
  },
  
  off(event, callback) {
    if (this.listeners && this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }
  },
  
  emit(event, ...args) {
    if (this.listeners && this.listeners[event]) {
      this.listeners[event].forEach(callback => callback(...args));
    }
  }
};

function ChatWindow() {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [typing, setTyping] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  
  // Call states
  const [calling, setCalling] = useState(false);
  const [callAccepted, setCallAccepted] = useState(false);
  const [callType, setCallType] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  
  const messageEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  
  // Mock user data
  const token = 'demo-token';
  const email = 'demo@example.com';
  const userId = 'demo-user-123';

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

  // Mock API calls
  const fetchChatHistory = useCallback(async (otherUserId) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const mockMessages = [
        {
          from: otherUserId,
          user: `user${otherUserId}@example.com`,
          text: 'Hello! How are you?',
          timestamp: new Date(Date.now() - 300000).toISOString()
        },
        {
          from: userId,
          user: email,
          text: 'Hi there! I\'m good, thanks!',
          timestamp: new Date(Date.now() - 120000).toISOString()
        }
      ];
      
      setMessages(mockMessages);
    } catch (error) {
      console.error("Failed to fetch chat history:", error);
      addNotification('Failed to load chat history');
      setMessages([]);
    }
  }, [userId, email, addNotification]);

  const checkCallAvailability = useCallback(async (targetUserId) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 300));
      return { success: true, available: true, online: true };
    } catch (error) {
      console.error('Call availability check failed:', error);
      throw new Error('Failed to check user availability');
    }
  }, []);

  // Call functions
  const startCall = useCallback(async (isVideo = true) => {
    if (!selectedUser?.id) {
      addNotification('Select someone to call first.');
      return;
    }

    try {
      setCalling(true);
      setCallType(isVideo ? 'video' : 'audio');

      const availability = await checkCallAvailability(selectedUser.id);
      if (!availability.available) {
        throw new Error('User is not available for calls');
      }

      // Simulate call initiation
      mockSocket.emit('callUser', {
        to: selectedUser.id,
        callType: isVideo ? 'video' : 'audio',
        from: userId,
        email
      });

      addNotification(`Calling ${displayName(selectedUser.email)}...`);

      // Simulate call acceptance after 3 seconds
      setTimeout(() => {
        setCallAccepted(true);
        setCalling(false);
        addNotification('Call connected');
      }, 3000);

    } catch (error) {
      console.error('Call failed:', error);
      addNotification(error.message || 'Call failed');
      setCalling(false);
      endCall();
    }
  }, [selectedUser, userId, email, addNotification, displayName, checkCallAvailability]);

  const endCall = useCallback(() => {
    setCallAccepted(false);
    setCalling(false);
    setCallType(null);
    
    if (selectedUser?.id) {
      mockSocket.emit('endCall', { to: selectedUser.id });
    }
    
    addNotification('Call ended');
  }, [selectedUser, addNotification]);

  // Socket event handlers
  useEffect(() => {
    const onConnect = () => {
      console.log('Socket connected');
      setConnectionStatus('connected');
      mockSocket.emit('join', { token, email, userId });
    };

    const onDisconnect = () => {
      console.log('Socket disconnected');
      setConnectionStatus('disconnected');
    };

    const onMessage = (msg) => {
      const newMsg = { ...msg, timestamp: msg.timestamp || new Date().toISOString() };
      setMessages(prev => [...prev, newMsg]);
      if (msg.from !== userId) {
        addNotification(`${displayName(msg.user)} sent a message`);
      }
    };

    const onOnlineUsers = (users) => {
      setOnlineUsers(users || []);
    };

    const onTyping = (userTypingEmail) => {
      if (selectedUser && userTypingEmail === selectedUser.email) {
        setTyping(true);
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => setTyping(false), 1500);
      }
    };

    // Setup event listeners
    mockSocket.on('connect', onConnect);
    mockSocket.on('disconnect', onDisconnect);
    mockSocket.on('message', onMessage);
    mockSocket.on('onlineUsers', onOnlineUsers);
    mockSocket.on('typing', onTyping);

    if (!mockSocket.connected) {
      mockSocket.connect();
    }

    return () => {
      mockSocket.off('connect', onConnect);
      mockSocket.off('disconnect', onDisconnect);
      mockSocket.off('message', onMessage);
      mockSocket.off('onlineUsers', onOnlineUsers);
      mockSocket.off('typing', onTyping);
      
      clearTimeout(typingTimeoutRef.current);
      endCall();
      mockSocket.disconnect();
    };
  }, [userId, email, selectedUser, addNotification, displayName, endCall]);

  useEffect(() => {
    if (selectedUser) {
      fetchChatHistory(selectedUser.id);
    }
  }, [selectedUser, fetchChatHistory]);

  const handleSelectUser = useCallback((user) => {
    if (callAccepted || calling) {
      endCall();
    }
    
    setSelectedUser(user);
    setMessages([]);
    setTyping(false);
  }, [callAccepted, calling, endCall]);

  const handleSendMessage = useCallback((e) => {
    e.preventDefault();
    if (!selectedUser || !message.trim()) return;

    const msgData = {
      from: userId,
      user: email,
      text: message.trim(),
      to: selectedUser.id,
      timestamp: new Date().toISOString(),
    };

    mockSocket.emit('sendMessage', {
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
      mockSocket.emit('typing', selectedUser.id);
    }
  }, [selectedUser]);

  const handleLogout = useCallback(() => {
    endCall();
    addNotification('Logout functionality disabled in demo');
  }, [endCall, addNotification]);

  const toggleDarkMode = useCallback(() => {
    setDarkMode(prev => !prev);
  }, []);

  return (
    <div className={`flex h-screen transition-colors duration-300 ${
      darkMode ? 'bg-gray-900' : 'bg-gray-100'
    }`}>
      {/* Sidebar */}
      <aside className={`w-80 border-r flex flex-col transition-colors duration-300 ${
        darkMode 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-white border-gray-300'
      }`}>
        <div className={`p-4 border-b transition-colors duration-300 ${
          darkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div className="flex justify-between items-center mb-4">
            <h3 className={`font-semibold text-lg flex items-center gap-2 transition-colors duration-300 ${
              darkMode ? 'text-white' : 'text-gray-900'
            }`}>
              <Users className="w-5 h-5" />
              Online Users ({onlineUsers.length})
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleDarkMode}
                className={`p-2 rounded-lg transition-all duration-300 ${
                  darkMode 
                    ? 'bg-gray-700 text-yellow-400 hover:bg-gray-600' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
              <button 
                className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600 transition-colors"
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>
          </div>
          
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors duration-300 ${
            connectionStatus === 'connected' 
              ? darkMode 
                ? 'bg-green-900 text-green-300' 
                : 'bg-green-100 text-green-800'
              : darkMode 
                ? 'bg-red-900 text-red-300' 
                : 'bg-red-100 text-red-800'
          }`}>
            {connectionStatus === 'connected' ? 
              <Wifi className="w-4 h-4" /> : 
              <WifiOff className="w-4 h-4" />
            }
            Status: {connectionStatus}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {onlineUsers.length === 0 ? (
            <div className={`p-4 text-center transition-colors duration-300 ${
              darkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              No online users found
            </div>
          ) : (
            <ul className="p-2 space-y-1">
              {onlineUsers.map((user) => (
                <li
                  key={user.id}
                  className={`p-3 rounded-lg cursor-pointer transition-all duration-300 ${
                    darkMode 
                      ? 'hover:bg-gray-700' 
                      : 'hover:bg-gray-50'
                  } ${
                    selectedUser?.id === user.id 
                      ? darkMode 
                        ? 'bg-blue-900 border border-blue-700' 
                        : 'bg-blue-100 border border-blue-300'
                      : ''
                  }`}
                  onClick={() => handleSelectUser(user)}
                  title={user.email}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <img
                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(displayName(user.email))}&background=${darkMode ? '1f2937' : '3b82f6'}&color=${darkMode ? 'f3f4f6' : 'fff'}&rounded=true&size=40`}
                        alt={user.email}
                        className="w-10 h-10 rounded-full"
                      />
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`font-medium truncate transition-colors duration-300 ${
                        darkMode ? 'text-gray-100' : 'text-gray-900'
                      }`}>
                        {displayName(user.email)}
                      </div>
                      <div className="text-sm text-green-500">Online</div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col">
        {selectedUser ? (
          <>
            {/* Chat Header */}
            <header className={`border-b p-4 transition-colors duration-300 ${
              darkMode 
                ? 'bg-gray-800 border-gray-700' 
                : 'bg-white border-gray-300'
            }`}>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <img
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(displayName(selectedUser.email))}&background=${darkMode ? '374151' : '3b82f6'}&color=${darkMode ? 'f3f4f6' : 'fff'}&rounded=true&size=40`}
                    alt={selectedUser.email}
                    className="w-10 h-10 rounded-full"
                  />
                  <div>
                    <h1 className={`font-semibold text-lg transition-colors duration-300 ${
                      darkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      Chat with {displayName(selectedUser.email)}
                    </h1>
                    <span className={`text-sm px-2 py-1 rounded-full transition-colors duration-300 ${
                      onlineUsers.find(u => u.id === selectedUser.id) 
                        ? darkMode 
                          ? 'bg-green-900 text-green-300' 
                          : 'bg-green-100 text-green-800'
                        : darkMode 
                          ? 'bg-gray-700 text-gray-300' 
                          : 'bg-gray-100 text-gray-600'
                    }`}>
                      {onlineUsers.find(u => u.id === selectedUser.id) ? 'Online' : 'Offline'}
                    </span>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <button 
                    className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    onClick={() => startCall(true)}
                    disabled={calling || callAccepted}
                  >
                    <Video className="w-4 h-4" />
                    Video Call
                  </button>
                  <button 
                    className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    onClick={() => startCall(false)}
                    disabled={calling || callAccepted}
                  >
                    <Phone className="w-4 h-4" />
                    Audio Call
                  </button>
                  {(callAccepted || calling) && (
                    <button 
                      className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                      onClick={endCall}
                    >
                      <PhoneOff className="w-4 h-4" />
                      End Call
                    </button>
                  )}
                </div>
              </div>
            </header>

            {/* Messages Area */}
            <div className={`flex-1 overflow-y-auto p-4 space-y-4 transition-colors duration-300 ${
              darkMode ? 'bg-gray-900' : 'bg-gray-50'
            }`}>
              {messages.map((msg, i) => {
                const isMine = msg.from === userId;
                return (
                  <div key={i} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg transition-colors duration-300 ${
                      isMine 
                        ? darkMode 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-blue-500 text-white'
                        : darkMode 
                          ? 'bg-gray-700 border border-gray-600 text-gray-100' 
                          : 'bg-white border border-gray-300'
                    }`}>
                      {!isMine && (
                        <div className={`font-medium text-sm mb-1 transition-colors duration-300 ${
                          darkMode ? 'text-gray-300' : 'text-gray-600'
                        }`}>
                          {displayName(msg.user)}
                        </div>
                      )}
                      <div className="text-sm">{msg.text}</div>
                      <div className={`text-xs mt-1 transition-colors duration-300 ${
                        isMine 
                          ? darkMode 
                            ? 'text-blue-200' 
                            : 'text-blue-100'
                          : darkMode 
                            ? 'text-gray-400' 
                            : 'text-gray-500'
                      }`}>
                        {formatTime(msg.timestamp)}
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {typing && (
                <div className="flex justify-start">
                  <div className={`rounded-lg px-4 py-2 max-w-xs transition-colors duration-300 ${
                    darkMode 
                      ? 'bg-gray-700 border border-gray-600' 
                      : 'bg-white border border-gray-300'
                  }`}>
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        <div className={`w-2 h-2 rounded-full animate-bounce ${
                          darkMode ? 'bg-gray-400' : 'bg-gray-400'
                        }`}></div>
                        <div className={`w-2 h-2 rounded-full animate-bounce ${
                          darkMode ? 'bg-gray-400' : 'bg-gray-400'
                        }`} style={{ animationDelay: '0.1s' }}></div>
                        <div className={`w-2 h-2 rounded-full animate-bounce ${
                          darkMode ? 'bg-gray-400' : 'bg-gray-400'
                        }`} style={{ animationDelay: '0.2s' }}></div>
                      </div>
                      <span className={`text-xs transition-colors duration-300 ${
                        darkMode ? 'text-gray-300' : 'text-gray-500'
                      }`}>
                        {displayName(selectedUser.email)} is typing...
                      </span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messageEndRef} />
            </div>

            {/* Call Status */}
            {(callAccepted || calling) && (
              <div className={`p-4 transition-colors duration-300 ${
                darkMode ? 'bg-gray-800 text-white' : 'bg-gray-800 text-white'
              }`}>
                <div className="text-center">
                  {calling && (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
                      <span>Calling {displayName(selectedUser.email)}...</span>
                    </div>
                  )}
                  {callAccepted && (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>
                        {callType === 'video' ? 'Video' : 'Audio'} call active with {displayName(selectedUser.email)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Message Input */}
            <div className={`border-t p-4 transition-colors duration-300 ${
              darkMode 
                ? 'bg-gray-800 border-gray-700' 
                : 'bg-white border-gray-300'
            }`}>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={message}
                  onChange={handleTyping}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(e)}
                  className={`flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-300 ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  }`}
                  autoComplete="off"
                />
                <button 
                  onClick={handleSendMessage}
                  disabled={!message.trim()} 
                  className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  Send
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className={`flex-1 flex items-center justify-center transition-colors duration-300 ${
            darkMode ? 'bg-gray-900' : 'bg-gray-50'
          }`}>
            <div className={`text-center transition-colors duration-300 ${
              darkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              <Users className={`w-12 h-12 mx-auto mb-4 transition-colors duration-300 ${
                darkMode ? 'text-gray-600' : 'text-gray-400'
              }`} />
              <h2 className={`text-xl font-semibold mb-2 transition-colors duration-300 ${
                darkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>Welcome to Global Connect</h2>
              <p>Select a user from the sidebar to start chatting</p>
            </div>
          </div>
        )}
      </main>

      {/* Notifications */}
      <div className="fixed top-4 right-4 space-y-2 z-50">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`px-4 py-2 rounded-lg shadow-lg animate-in slide-in-from-right-2 duration-300 transition-colors ${
              darkMode 
                ? 'bg-gray-800 text-white border border-gray-700' 
                : 'bg-gray-900 text-white'
            }`}
          >
            {notification.text}
          </div>
        ))}
      </div>
    </div>
  );
}

export default ChatWindow;