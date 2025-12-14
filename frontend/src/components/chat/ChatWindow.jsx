import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Video, Phone, PhoneOff, Send, Users, Wifi, WifiOff, Moon, Sun } from 'lucide-react';
import io from 'socket.io-client';

// Initialize real socket
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
  
  const [calling, setCalling] = useState(false);
  const [callAccepted, setCallAccepted] = useState(false);
  const [callType, setCallType] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  
  const messageEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  
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

  // Socket event handlers
  useEffect(() => {
    if (!token || !userId) {
      console.error("No auth data found");
      addNotification("Please login to use chat");
      return;
    }

    const onConnect = () => {
      console.log('✅ Socket connected');
      setConnectionStatus('connected');
      socket.emit('join', { token, email, userId });
    };

    const onDisconnect = () => {
      console.log('❌ Socket disconnected');
      setConnectionStatus('disconnected');
      addNotification('Connection lost. Reconnecting...');
    };

    const onMessage = (msg) => {
      const newMsg = { 
        ...msg, 
        timestamp: msg.timestamp || new Date().toISOString(), 
        id: msg.id || Date.now() + Math.random() 
      };
      setMessages(prev => [...prev, newMsg]);
      if (msg.from !== userId) {
        addNotification(`${displayName(msg.user)} sent a message`);
      }
    };

    const onOnlineUsers = (users) => {
      console.log("Online users received:", users);
      setOnlineUsers(users || []);
    };

    const onTyping = (userTypingEmail) => {
      if (selectedUser && userTypingEmail === selectedUser.email) {
        setTyping(true);
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => setTyping(false), 1500);
      }
    };

    // VIDEO CALL EVENTS
    const onCallUser = ({ signal, from }) => {
      addNotification(`Incoming call from ${from}`);
      // Handle incoming call UI
    };

    const onCallAccepted = (signal) => {
      setCallAccepted(true);
      setCalling(false);
      addNotification('Call connected');
    };

    const onCallEnded = () => {
      setCallAccepted(false);
      setCalling(false);
      setCallType(null);
      addNotification('Call ended');
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('message', onMessage);
    socket.on('onlineUsers', onOnlineUsers);
    socket.on('typing', onTyping);
    socket.on('callUser', onCallUser);
    socket.on('callAccepted', onCallAccepted);
    socket.on('callEnded', onCallEnded);

    if (!socket.connected) {
      socket.connect();
    }

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('message', onMessage);
      socket.off('onlineUsers', onOnlineUsers);
      socket.off('typing', onTyping);
      socket.off('callUser', onCallUser);
      socket.off('callAccepted', onCallAccepted);
      socket.off('callEnded', onCallEnded);
      clearTimeout(typingTimeoutRef.current);
    };
  }, [userId, email, token, selectedUser, addNotification, displayName]);

  const handleSelectUser = useCallback((user) => {
    if (callAccepted || calling) {
      endCall();
    }
    setSelectedUser(user);
    setMessages([]);
    setTyping(false);
  }, [callAccepted, calling]);

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

  const startCall = useCallback((isVideo = true) => {
    if (!selectedUser?.id) {
      addNotification('Select a user to call');
      return;
    }

    setCalling(true);
    setCallType(isVideo ? 'video' : 'audio');
    
    socket.emit('callUser', {
      userToCall: selectedUser.id,
      signalData: { /* peer signal data */ },
      from: userId
    });

    addNotification(`Calling ${displayName(selectedUser.email)}...`);
  }, [selectedUser, userId, addNotification, displayName]);

  const endCall = useCallback(() => {
    setCallAccepted(false);
    setCalling(false);
    setCallType(null);
    
    if (selectedUser?.id) {
      socket.emit('endCall', { to: selectedUser.id });
    }
    
    addNotification('Call ended');
  }, [selectedUser, addNotification]);

  const toggleDarkMode = useCallback(() => {
    setDarkMode(prev => !prev);
  }, []);

  return (
    <div className={`flex h-screen transition-colors duration-300 ${
      darkMode ? 'bg-gray-900' : 'bg-gray-100'
    }`}>
      
      {/* Sidebar */}
      <aside className={`w-80 border-r flex flex-col transition-colors duration-300 ${
        darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'
      }`}>
        <div className={`p-4 border-b transition-colors duration-300 ${
          darkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div className="flex justify-between items-center mb-4">
            <h3 className={`font-semibold text-lg flex items-center gap-2 ${
              darkMode ? 'text-white' : 'text-gray-900'
            }`}>
              <Users className="w-5 h-5" />
              Online ({onlineUsers.length})
            </h3>
            <button
              onClick={toggleDarkMode}
              className={`p-2 rounded-lg transition-all ${
                darkMode ? 'bg-gray-700 text-yellow-400 hover:bg-gray-600' 
                         : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
          
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
            connectionStatus === 'connected' 
              ? darkMode ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-800'
              : darkMode ? 'bg-red-900 text-red-300' : 'bg-red-100 text-red-800'
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
            <div className={`p-4 text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              No users online
            </div>
          ) : (
            <ul className="p-2 space-y-1">
              {onlineUsers.map((user) => (
                <li
                  key={user.id}
                  className={`p-3 rounded-lg cursor-pointer transition-all ${
                    darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                  } ${
                    selectedUser?.id === user.id 
                      ? darkMode ? 'bg-purple-900 border border-purple-700' 
                                 : 'bg-purple-100 border border-purple-300'
                      : ''
                  }`}
                  onClick={() => handleSelectUser(user)}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                        {displayName(user.email).charAt(0).toUpperCase()}
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`font-medium truncate ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
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

      {/* Main Chat */}
      <main className="flex-1 flex flex-col">
        {selectedUser ? (
          <>
            <header className={`border-b p-4 ${
              darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'
            }`}>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                    {displayName(selectedUser.email).charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h1 className={`font-semibold text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {displayName(selectedUser.email)}
                    </h1>
                    <span className={`text-sm px-2 py-1 rounded-full ${
                      darkMode ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-800'
                    }`}>
                      Online
                    </span>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <button 
                    className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
                    onClick={() => startCall(true)}
                    disabled={calling || callAccepted}
                  >
                    <Video className="w-4 h-4" />
                    Video
                  </button>
                  <button 
                    className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                    onClick={() => startCall(false)}
                    disabled={calling || callAccepted}
                  >
                    <Phone className="w-4 h-4" />
                    Audio
                  </button>
                  {(callAccepted || calling) && (
                    <button 
                      className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                      onClick={endCall}
                    >
                      <PhoneOff className="w-4 h-4" />
                      End
                    </button>
                  )}
                </div>
              </div>
            </header>

            <div className={`flex-1 overflow-y-auto p-4 space-y-4 ${
              darkMode ? 'bg-gray-900' : 'bg-gray-50'
            }`}>
              {messages.map((msg) => {
                const isMine = msg.from === userId;
                return (
                  <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      isMine 
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' 
                        : darkMode ? 'bg-gray-700 text-gray-100' : 'bg-white border'
                    }`}>
                      <div className="text-sm">{msg.text}</div>
                      <div className={`text-xs mt-1 ${
                        isMine ? 'text-purple-200' : darkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        {formatTime(msg.timestamp)}
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {typing && (
                <div className="flex justify-start">
                  <div className={`rounded-lg px-4 py-2 ${
                    darkMode ? 'bg-gray-700' : 'bg-white border'
                  }`}>
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                      <span className={`text-xs ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                        typing...
                      </span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messageEndRef} />
            </div>

            {(callAccepted || calling) && (
              <div className="p-4 bg-gray-800 text-white">
                <div className="text-center">
                  {calling && <span>Calling {displayName(selectedUser.email)}...</span>}
                  {callAccepted && <span>{callType === 'video' ? 'Video' : 'Audio'} call active</span>}
                </div>
              </div>
            )}

            <div className={`border-t p-4 ${
              darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'
            }`}>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={message}
                  onChange={handleTyping}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(e)}
                  className={`flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                    darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                  }`}
                />
                <button 
                  onClick={handleSendMessage}
                  disabled={!message.trim()} 
                  className="px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  Send
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className={`flex-1 flex items-center justify-center ${
            darkMode ? 'bg-gray-900' : 'bg-gray-50'
          }`}>
            <div className="text-center">
              <Users className={`w-12 h-12 mx-auto mb-4 ${
                darkMode ? 'text-gray-600' : 'text-gray-400'
              }`} />
              <h2 className={`text-xl font-semibold mb-2 ${
                darkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>Welcome to Chat</h2>
              <p className={darkMode ? 'text-gray-400' : 'text-gray-500'}>
                Select a user to start chatting
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Notifications */}
      <div className="fixed top-4 right-4 space-y-2 z-50">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`px-4 py-2 rounded-lg shadow-lg animate-in slide-in-from-right-2 ${
              darkMode ? 'bg-gray-800 text-white border border-gray-700' : 'bg-gray-900 text-white'
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