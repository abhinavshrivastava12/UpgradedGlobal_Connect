import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Send, Search, ArrowLeft, Image, Smile, MoreVertical } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useSocket } from '../context/SocketContext';

const Messages = ({ currentUser }) => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const { socket, isConnected } = useSocket();

  // Load conversations
  useEffect(() => {
    loadConversations();
  }, []);

  // Setup socket listeners
  useEffect(() => {
    if (!socket) return;

    socket.on('receive-message', (data) => {
      console.log('Received message:', data);
      
      // Add message to current conversation
      if (data.conversationId === selectedConversation?._id) {
        setMessages(prev => [...prev, data.message]);
        scrollToBottom();
      }
      
      // Update conversations list
      loadConversations();
    });

    return () => {
      socket.off('receive-message');
    };
  }, [socket, selectedConversation]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversations = async () => {
    try {
      const { data } = await axios.get('/api/messages/conversations');
      if (data.success) {
        setConversations(data.conversations);
      }
    } catch (error) {
      console.error('Load conversations error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId) => {
    try {
      const { data } = await axios.get(
        `/api/messages/conversation/${conversationId}/messages`
      );
      if (data.success) {
        setMessages(data.messages);
      }
    } catch (error) {
      console.error('Load messages error:', error);
    }
  };

  const handleSelectConversation = (conversation) => {
    setSelectedConversation(conversation);
    loadMessages(conversation._id);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!messageText.trim() || sending) return;

    setSending(true);
    try {
      const { data } = await axios.post('/api/messages/send', {
        conversationId: selectedConversation._id,
        text: messageText.trim()
      });

      if (data.success) {
        setMessages(prev => [...prev, data.message]);
        setMessageText('');
        scrollToBottom();
        
        // Update conversation list
        loadConversations();

        // Emit socket event
        if (socket) {
          const recipientId = selectedConversation.participants.find(
            p => p._id !== currentUser._id
          )?._id;
          
          socket.emit('send-message', {
            recipientId,
            message: data.message,
            conversationId: selectedConversation._id
          });
        }
      }
    } catch (error) {
      console.error('Send message error:', error);
      alert('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleSearch = async (query) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const { data } = await axios.get(`/api/messages/search-users?q=${query}`);
      if (data.success) {
        setSearchResults(data.users);
      }
    } catch (error) {
      console.error('Search error:', error);
    }
  };

  const handleStartConversation = async (user) => {
    try {
      const { data } = await axios.post(`/api/messages/conversation/${user._id}`);
      if (data.success) {
        setSelectedConversation(data.conversation);
        loadMessages(data.conversation._id);
        setSearchQuery('');
        setSearchResults([]);
        loadConversations();
      }
    } catch (error) {
      console.error('Start conversation error:', error);
    }
  };

  const getOtherUser = (conversation) => {
    return conversation.participants.find(p => p._id !== currentUser._id);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl text-gray-600">Loading messages...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-white">
      {/* Sidebar - Conversations List */}
      <div className={`${selectedConversation ? 'hidden md:block' : 'block'} w-full md:w-96 border-r border-gray-200 flex flex-col`}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold mb-3">Messages</h2>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search people"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="absolute z-10 w-80 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 max-h-96 overflow-y-auto">
              {searchResults.map(user => (
                <button
                  key={user._id}
                  onClick={() => handleStartConversation(user)}
                  className="w-full p-3 hover:bg-gray-50 flex items-center space-x-3 text-left"
                >
                  <img
                    src={user.profilePicture || '/default-avatar.png'}
                    alt={user.username}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <p className="font-semibold">{user.name}</p>
                    <p className="text-sm text-gray-500">@{user.username}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>No conversations yet</p>
              <p className="text-sm mt-2">Search for people to start chatting</p>
            </div>
          ) : (
            conversations.map(conversation => {
              const otherUser = getOtherUser(conversation);
              return (
                <button
                  key={conversation._id}
                  onClick={() => handleSelectConversation(conversation)}
                  className={`w-full p-4 hover:bg-gray-50 flex items-start space-x-3 border-b border-gray-100 text-left ${
                    selectedConversation?._id === conversation._id ? 'bg-blue-50' : ''
                  }`}
                >
                  <img
                    src={otherUser?.profilePicture || '/default-avatar.png'}
                    alt={otherUser?.username}
                    className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <p className="font-semibold truncate">{otherUser?.name}</p>
                      {conversation.lastMessage && (
                        <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                          {formatDistanceToNow(new Date(conversation.updatedAt), { addSuffix: true })}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 truncate">@{otherUser?.username}</p>
                    {conversation.lastMessage && (
                      <p className="text-sm text-gray-600 truncate mt-1">
                        {conversation.lastMessage.text || 'Image'}
                      </p>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Chat Area */}
      {selectedConversation ? (
        <div className="flex-1 flex flex-col">
          {/* Chat Header */}
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setSelectedConversation(null)}
                className="md:hidden p-2 hover:bg-gray-100 rounded-full"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <img
                src={getOtherUser(selectedConversation)?.profilePicture || '/default-avatar.png'}
                alt="User"
                className="w-10 h-10 rounded-full object-cover"
              />
              <div>
                <p className="font-semibold">{getOtherUser(selectedConversation)?.name}</p>
                <p className="text-sm text-gray-500">
                  @{getOtherUser(selectedConversation)?.username}
                </p>
              </div>
            </div>
            <button className="p-2 hover:bg-gray-100 rounded-full">
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p>No messages yet</p>
                <p className="text-sm mt-2">Start the conversation!</p>
              </div>
            ) : (
              messages.map((message, index) => {
                const isOwn = message.sender._id === currentUser._id;
                return (
                  <div
                    key={message._id || index}
                    className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex items-end space-x-2 max-w-md ${isOwn ? 'flex-row-reverse space-x-reverse' : ''}`}>
                      {!isOwn && (
                        <img
                          src={message.sender.profilePicture || '/default-avatar.png'}
                          alt={message.sender.username}
                          className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                        />
                      )}
                      <div>
                        <div
                          className={`px-4 py-2 rounded-2xl ${
                            isOwn
                              ? 'bg-blue-500 text-white'
                              : 'bg-white text-gray-900 border border-gray-200'
                          }`}
                        >
                          {message.image && (
                            <img
                              src={message.image}
                              alt="Message"
                              className="rounded-lg mb-2 max-w-xs"
                            />
                          )}
                          {message.text && (
                            <p className="break-words">{message.text}</p>
                          )}
                        </div>
                        <p className={`text-xs text-gray-500 mt-1 ${isOwn ? 'text-right' : ''}`}>
                          {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 bg-white">
            <div className="flex items-center space-x-2">
              <button
                type="button"
                className="p-2 text-blue-500 hover:bg-blue-50 rounded-full"
              >
                <Image className="w-5 h-5" />
              </button>
              <button
                type="button"
                className="p-2 text-blue-500 hover:bg-blue-50 rounded-full"
              >
                <Smile className="w-5 h-5" />
              </button>
              <input
                type="text"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 px-4 py-2 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={sending}
              />
              <button
                type="submit"
                disabled={!messageText.trim() || sending}
                className="p-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="hidden md:flex flex-1 items-center justify-center bg-gray-50">
          <div className="text-center text-gray-500">
            <p className="text-xl mb-2">Select a conversation</p>
            <p className="text-sm">Choose from your existing conversations or start a new one</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Messages;