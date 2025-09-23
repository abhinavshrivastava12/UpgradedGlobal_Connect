import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AgoraRTC from 'agora-rtc-sdk-ng';
import './Chat.css';

// Agora Configuration
const APP_ID = import.meta.env.VITE_AGORA_APP_ID || '04d8a9031217470bb3b5c0d6b7a0db55';

// Socket connection - Updated to match your server config
const socket = io('https://upgradedglobal-connect.onrender.com', { 
  autoConnect: false,
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

  // Agora states
  const [agoraClient] = useState(() => AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' }));
  const [localTracks, setLocalTracks] = useState({ audio: null, video: null });
  const [remoteUsers, setRemoteUsers] = useState([]);
  const [callAccepted, setCallAccepted] = useState(false);
  const [calling, setCalling] = useState(false);
  const [callType, setCallType] = useState(null);

  const myVideo = useRef(null);
  const remoteVideo = useRef(null);
  const typingTimeoutRef = useRef(null);
  const messageEndRef = useRef(null);
  const channelRef = useRef(null);

  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const email = localStorage.getItem('email');
  const userId = localStorage.getItem('userId');

  const displayName = (mail) => (mail ? mail.split('@')[0] : 'User');
  const formatTime = (ts) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Configure axios defaults
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      axios.defaults.withCredentials = true;
    }
  }, [token]);

  const addNotification = (text) => {
    const id = Date.now() + Math.random();
    setNotifications((prev) => [...prev, { id, text }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 4000);
  };

  const scrollToBottom = () => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchChatHistory = async (otherUserId) => {
    try {
      const response = await axios.get(`https://upgradedglobal-connect.onrender.com/api/chat/history/${otherUserId}`);
      setMessages(response.data.items || []);
    } catch (error) {
      console.error("Failed to fetch chat history:", error);
      if (error.response?.status === 401) {
        addNotification('Session expired. Please login again.');
        handleLogout();
        return;
      }
      setMessages([]);
    }
  };

  // Check call availability using your existing endpoint
  const checkCallAvailability = async (targetUserId) => {
    try {
      const response = await axios.get(`https://upgradedglobal-connect.onrender.com/api/connection/getStatus/${targetUserId}`);
      
      if (response.data.success !== undefined) {
        return response.data;
      } else {
        return {
          success: true,
          available: true,
          online: true
        };
      }
    } catch (error) {
      console.error('Call availability check failed:', error);
      if (error.response?.status === 500) {
        console.warn('Server error checking availability, proceeding with call');
        return { success: true, available: true, online: true };
      }
      if (error.response?.status === 401) {
        throw new Error('Please login again');
      }
      throw new Error('Failed to check user availability');
    }
  };

  // Agora Functions
  const generateChannelName = (user1Id, user2Id) => {
    const ids = [user1Id, user2Id].sort();
    return `chat-${ids[0]}-${ids[1]}`;
  };

  const getAgoraToken = async (channelName) => {
    try {
      const response = await axios.post('https://upgradedglobal-connect.onrender.com/api/agora/token', {
        channelName,
        userId: userId
      });
      
      if (response.data.warning) {
        console.warn('No Agora certificate - using null token for testing');
        return null;
      }
      
      return response.data.token;
    } catch (error) {
      console.error('Failed to get Agora token:', error);
      if (error.response?.status === 401) {
        throw new Error('Authentication failed. Please login again.');
      }
      throw error;
    }
  };

  const startAgoraCall = async (isVideo = true) => {
    if (!selectedUser?.id) {
      addNotification('Select someone to call first.');
      return;
    }

    try {
      console.log('Starting Agora call:', isVideo ? 'video' : 'audio');
      setCalling(true);
      setCallType(isVideo ? 'video' : 'audio');

      try {
        const availability = await checkCallAvailability(selectedUser.id);
        if (!availability.available) {
          throw new Error(availability.reason || 'User is not available for calls');
        }
      } catch (statusError) {
        console.warn('Could not verify user status, proceeding with call:', statusError.message);
      }

      const channelName = generateChannelName(userId, selectedUser.id);
      channelRef.current = channelName;

      const agoraToken = await getAgoraToken(channelName);

      await agoraClient.join(APP_ID, channelName, agoraToken, parseInt(userId));

      const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
      let videoTrack = null;
      
      if (isVideo) {
        videoTrack = await AgoraRTC.createCameraVideoTrack();
      }

      setLocalTracks({ audio: audioTrack, video: videoTrack });

      const tracksToPublish = videoTrack ? [audioTrack, videoTrack] : [audioTrack];
      await agoraClient.publish(tracksToPublish);

      if (videoTrack && myVideo.current) {
        videoTrack.play(myVideo.current);
      }

      setCalling(false);
      setCallAccepted(true);
      
      socket.emit('agoraCallUser', {
        to: selectedUser.id,
        channelName,
        callType: isVideo ? 'video' : 'audio',
        from: userId,
        email
      });

      addNotification(`Calling ${displayName(selectedUser.email)}...`);

    } catch (error) {
      console.error('Agora call failed:', error);
      addNotification(error.message || 'Call failed');
      setCalling(false);
      endAgoraCall();
    }
  };

  const answerAgoraCall = async (channelName, isVideo) => {
    try {
      console.log('Answering Agora call');
      setCallAccepted(true);
      setCallType(isVideo ? 'video' : 'audio');
      channelRef.current = channelName;

      const agoraToken = await getAgoraToken(channelName);

      await agoraClient.join(APP_ID, channelName, agoraToken, parseInt(userId));

      const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
      let videoTrack = null;
      
      if (isVideo) {
        videoTrack = await AgoraRTC.createCameraVideoTrack();
      }

      setLocalTracks({ audio: audioTrack, video: videoTrack });

      const tracksToPublish = videoTrack ? [audioTrack, videoTrack] : [audioTrack];
      await agoraClient.publish(tracksToPublish);

      if (videoTrack && myVideo.current) {
        videoTrack.play(myVideo.current);
      }

      addNotification('Call connected');
    } catch (error) {
      console.error('Failed to answer call:', error);
      addNotification('Failed to answer call');
      endAgoraCall();
    }
  };

  const endAgoraCall = async () => {
    console.log('Ending Agora call');

    try {
      if (localTracks.audio) {
        localTracks.audio.close();
      }
      if (localTracks.video) {
        localTracks.video.close();
      }

      await agoraClient.leave();

      setLocalTracks({ audio: null, video: null });
      setRemoteUsers([]);
      setCallAccepted(false);
      setCalling(false);
      setCallType(null);
      channelRef.current = null;

      if (myVideo.current) {
        myVideo.current.srcObject = null;
      }
      if (remoteVideo.current) {
        remoteVideo.current.srcObject = null;
      }

      if (selectedUser?.id) {
        socket.emit('agoraEndCall', { to: selectedUser.id });
      }

    } catch (error) {
      console.error('Error ending call:', error);
    }
  };

  useEffect(() => {
    const handleUserPublished = async (user, mediaType) => {
      console.log('User published:', user.uid, mediaType);
      
      await agoraClient.subscribe(user, mediaType);
      
      if (mediaType === 'video' && remoteVideo.current) {
        user.videoTrack.play(remoteVideo.current);
      }
      if (mediaType === 'audio') {
        user.audioTrack.play();
      }

      setRemoteUsers(prev => {
        const existing = prev.find(u => u.uid === user.uid);
        if (existing) {
          return prev.map(u => u.uid === user.uid ? user : u);
        }
        return [...prev, user];
      });
    };

    const handleUserUnpublished = (user, mediaType) => {
      console.log('User unpublished:', user.uid, mediaType);
      
      if (mediaType === 'video' && remoteVideo.current) {
        remoteVideo.current.srcObject = null;
      }
    };

    const handleUserLeft = (user) => {
      console.log('User left:', user.uid);
      setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid));
      
      if (remoteVideo.current) {
        remoteVideo.current.srcObject = null;
      }
      
      addNotification('User left the call');
    };

    agoraClient.on('user-published', handleUserPublished);
    agoraClient.on('user-unpublished', handleUserUnpublished);
    agoraClient.on('user-left', handleUserLeft);

    return () => {
      agoraClient.off('user-published', handleUserPublished);
      agoraClient.off('user-unpublished', handleUserUnpublished);
      agoraClient.off('user-left', handleUserLeft);
    };
  }, [agoraClient]);

  useEffect(() => {
    if (!token || !userId) {
      navigate('/');
      return;
    }

    const onConnect = () => {
      console.log('Socket connected:', socket.id);
      setConnectionStatus('connected');
      socket.emit('join', { token, email, userId });
    };

    const onDisconnect = () => {
      console.log('Socket disconnected');
      setConnectionStatus('disconnected');
    };

    const onError = (error) => {
      console.error('Socket error:', error);
      if (error.message === 'Authentication failed') {
        addNotification('Authentication failed. Please login again.');
        handleLogout();
      }
    };

    const onMessage = (msg) => {
      const newMsg = { ...msg, timestamp: msg.timestamp || new Date().toISOString() };
      setMessages((prev) => [...prev, newMsg]);
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

    const onAgoraCallUser = async ({ channelName, callType: incomingCallType, from, email: callerEmail }) => {
      console.log('Incoming Agora call:', channelName, incomingCallType);
      
      const shouldAnswer = window.confirm(
        `${displayName(callerEmail)} is calling you (${incomingCallType}). Accept?`
      );
      
      if (shouldAnswer) {
        await answerAgoraCall(channelName, incomingCallType === 'video');
        socket.emit('agoraCallAccepted', { to: from });
      } else {
        socket.emit('agoraCallDeclined', { to: from });
      }
    };

    const onAgoraCallAccepted = () => {
      console.log('Agora call accepted');
      addNotification('Call connected');
    };

    const onAgoraCallDeclined = () => {
      console.log('Agora call declined');
      addNotification('Call declined');
      endAgoraCall();
    };

    const onAgoraEndCall = () => {
      console.log('Agora call ended by peer');
      endAgoraCall();
      addNotification('Call ended');
    };

    const onAgoraCallFailed = ({ message }) => {
      console.log('Agora call failed:', message);
      addNotification(message || 'Call failed');
      endAgoraCall();
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('error', onError);
    socket.on('message', onMessage);
    socket.on('onlineUsers', onOnlineUsers);
    socket.on('typing', onTyping);
    socket.on('agoraCallUser', onAgoraCallUser);
    socket.on('agoraCallAccepted', onAgoraCallAccepted);
    socket.on('agoraCallDeclined', onAgoraCallDeclined);
    socket.on('agoraEndCall', onAgoraEndCall);
    socket.on('agoraCallFailed', onAgoraCallFailed);

    if (!socket.connected) {
      socket.connect();
    }

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('error', onError);
      socket.off('message', onMessage);
      socket.off('onlineUsers', onOnlineUsers);
      socket.off('typing', onTyping);
      socket.off('agoraCallUser', onAgoraCallUser);
      socket.off('agoraCallAccepted', onAgoraCallAccepted);
      socket.off('agoraCallDeclined', onAgoraCallDeclined);
      socket.off('agoraEndCall', onAgoraEndCall);
      socket.off('agoraCallFailed', onAgoraCallFailed);
      
      endAgoraCall();
      socket.disconnect();
    };
  }, [token, email, navigate, selectedUser, userId, agoraClient]);

  useEffect(() => {
    if (selectedUser) {
      fetchChatHistory(selectedUser.id);
    }
  }, [selectedUser]);

  const handleSelectUser = (user) => {
    if (callAccepted || calling) {
      endAgoraCall();
    }
    
    setSelectedUser(user);
    setMessages([]);
    fetchChatHistory(user.id);
    setTyping(false);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!selectedUser || !message.trim()) return;

    const msgData = {
      from: userId,
      user: email,
      text: message.trim(),
      to: selectedUser.id,
      timestamp: new Date().toISOString(),
    };

    socket.emit('sendMessage', {
      userId: userId,
      to: selectedUser.id,
      text: message.trim(),
      timestamp: new Date().toISOString(),
    });

    setMessages((prev) => [...prev, msgData]);
    setMessage('');
  };

  const handleTyping = (e) => {
    setMessage(e.target.value);
    if (selectedUser?.id) {
      socket.emit('typing', selectedUser.id);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('email');
    localStorage.removeItem('userId');
    delete axios.defaults.headers.common['Authorization'];
    endAgoraCall();
    navigate('/');
  };

  return (
    <div className="chat-container">
      <aside className="sidebar">
        <div className="user-list-header">
          <h3>Online Users ({onlineUsers.length})</h3>
          <button className="logout-btn" onClick={handleLogout}>Logout</button>
        </div>
        
        <div className="connection-status" style={{ 
          padding: '5px 10px', 
          marginBottom: '10px', 
          borderRadius: '5px',
          backgroundColor: connectionStatus === 'connected' ? '#4CAF50' : '#f44336',
          color: 'white',
          fontSize: '12px'
        }}>
          Status: {connectionStatus}
        </div>

        <ul className="user-list">
          {onlineUsers.length === 0 ? (
            <li style={{ padding: '10px', color: '#aaa', fontSize: '14px' }}>
              No online users found
            </li>
          ) : (
            onlineUsers.map((user) => (
              <li
                key={user.id}
                className={`user-item ${selectedUser?.id === user.id ? 'selected-user' : ''}`}
                onClick={() => handleSelectUser(user)}
                title={user.email}
              >
                <span className="online-dot" />
                <img
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(displayName(user.email))}&background=45a29e&color=fff&rounded=true&size=34`}
                  alt={user.email}
                  className="user-avatar"
                />
                <div className="user-info">
                  <span className="user-name">{displayName(user.email)}</span>
                  <small className="last-seen">Online</small>
                </div>
              </li>
            ))
          )}
        </ul>
      </aside>

      <main className="chat-main">
        {selectedUser && (
          <header className="chat-header flex-shrink-0">
            <div className="chat-with">
              <h1>Chat with {displayName(selectedUser.email)}</h1>
              <span className="status-pill">
                {onlineUsers.find(u => u.id === selectedUser.id) ? 'Online' : 'Offline'}
              </span>
            </div>
            <div className="call-controls">
              <button 
                className="call-btn" 
                onClick={() => startAgoraCall(true)}
                disabled={calling || callAccepted}
              >
                Video Call
              </button>
              <button 
                className="call-btn" 
                onClick={() => startAgoraCall(false)}
                disabled={calling || callAccepted}
              >
                Audio Call
              </button>
              {(callAccepted || calling) && (
                <button className="end-call-btn" onClick={endAgoraCall}>
                  End Call
                </button>
              )}
            </div>
          </header>
        )}

        <div className="chat-messages" id="chat-scroll-area">
          {messages.map((msg, i) => {
            const isMine = msg.from === userId;
            return (
              <div key={i} className={`message ${isMine ? 'my-message' : 'their-message'}`}>
                <div className="message-content">
                  {!isMine && <strong className="sender">{displayName(msg.user)}: </strong>}
                  <span>{msg.text}</span>
                  <span className="message-time">{formatTime(msg.timestamp)}</span>
                </div>
              </div>
            );
          })}
          <div ref={messageEndRef} />
          {typing && selectedUser && (
            <div className="typing-indicator">
              {displayName(selectedUser.email)} is typing...
            </div>
          )}
        </div>

        {selectedUser && (
          <form className="message-form flex-shrink-0" onSubmit={handleSendMessage}>
            <input
              type="text"
              placeholder="Type a message..."
              value={message}
              onChange={handleTyping}
              autoComplete="off"
            />
            <button type="submit" disabled={!message.trim()} aria-label="Send message">
              Send
            </button>
          </form>
        )}

        {(callAccepted || calling) && (
          <div className="video-container">
            <div className="video-tile">
              <video 
                className="my-video" 
                playsInline 
                muted 
                ref={myVideo} 
                autoPlay 
                style={{ display: callType === 'audio' ? 'none' : 'block' }}
              />
              <div className="video-label">You {callType === 'audio' && '(Audio Only)'}</div>
            </div>
            
            {remoteUsers.length > 0 && (
              <div className="video-tile">
                <video 
                  className="user-video" 
                  playsInline 
                  ref={remoteVideo} 
                  autoPlay 
                  style={{ display: callType === 'audio' ? 'none' : 'block' }}
                />
                <div className="video-label">
                  {selectedUser ? displayName(selectedUser.email) : 'Partner'} 
                  {callType === 'audio' && ' (Audio Only)'}
                </div>
              </div>
            )}
            
            {calling && (
              <div className="call-status">
                Calling {selectedUser ? displayName(selectedUser.email) : ''}...
              </div>
            )}
          </div>
        )}
      </main>

      <div className="notification-panel">
        {notifications.map((n) => (
          <div key={n.id} className="notification">{n.text}</div>
        ))}
      </div>
    </div>
  );
}

export default ChatWindow;