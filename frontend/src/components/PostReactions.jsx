import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const reactions = [
  { type: 'like', emoji: '👍', label: 'Like', color: 'text-blue-500' },
  { type: 'love', emoji: '❤️', label: 'Love', color: 'text-red-500' },
  { type: 'haha', emoji: '😂', label: 'Haha', color: 'text-yellow-500' },
  { type: 'wow', emoji: '😮', label: 'Wow', color: 'text-purple-500' },
  { type: 'sad', emoji: '😢', label: 'Sad', color: 'text-gray-500' },
  { type: 'angry', emoji: '😠', label: 'Angry', color: 'text-orange-500' }
];

function PostReactions({ postId, currentUserId }) {
  const [showPicker, setShowPicker] = useState(false);
  const [postReactions, setPostReactions] = useState({
    like: [],
    love: [],
    haha: [],
    wow: [],
    sad: [],
    angry: []
  });
  const [userReaction, setUserReaction] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const pickerRef = useRef();

  useEffect(() => {
    loadReactions();
  }, [postId]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setShowPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadReactions = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: { 'Authorization': `Bearer ${token}` },
        withCredentials: true
      };

      const response = await axios.get(`/api/reactions/${postId}`, config);
      if (response.data.success) {
        setPostReactions(response.data.reactions);
        
        // Find user's reaction
        let found = null;
        Object.keys(response.data.reactions).forEach(type => {
          if (response.data.reactions[type]?.some(u => u._id === currentUserId)) {
            found = type;
          }
        });
        setUserReaction(found);
      }
    } catch (error) {
      console.error('Load reactions error:', error);
    }
  };

  const handleReaction = async (reactionType) => {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: { 'Authorization': `Bearer ${token}` },
        withCredentials: true
      };

      if (userReaction === reactionType) {
        // Remove reaction
        await axios.delete(`/api/reactions/${postId}`, config);
        setUserReaction(null);
      } else {
        // Add/Change reaction
        await axios.post(`/api/reactions/${postId}`, { reactionType }, config);
        setUserReaction(reactionType);
      }

      loadReactions();
      setShowPicker(false);
    } catch (error) {
      console.error('Handle reaction error:', error);
    }
  };

  const getTotalReactions = () => {
    return Object.values(postReactions).reduce((total, arr) => total + (arr?.length || 0), 0);
  };

  const getTopReactions = () => {
    const sorted = reactions
      .map(r => ({ ...r, count: postReactions[r.type]?.length || 0 }))
      .filter(r => r.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
    return sorted;
  };

  const totalCount = getTotalReactions();
  const topReactions = getTopReactions();

  return (
    <div className="relative">
      {/* Reaction Button */}
      <div className="flex items-center gap-2">
        <button
          onMouseEnter={() => setShowPicker(true)}
          onClick={() => userReaction ? handleReaction(userReaction) : setShowPicker(true)}
          className={`flex items-center space-x-2 transition-colors group ${
            userReaction 
              ? reactions.find(r => r.type === userReaction)?.color 
              : 'text-gray-400 hover:text-blue-400'
          }`}
        >
          <div className="p-2 rounded-full group-hover:bg-blue-500/10">
            <span className="text-xl">
              {userReaction ? reactions.find(r => r.type === userReaction)?.emoji : '👍'}
            </span>
          </div>
          {totalCount > 0 && (
            <span className="text-sm font-medium">{totalCount}</span>
          )}
        </button>

        {/* Reaction Summary */}
        {totalCount > 0 && (
          <button
            onClick={() => setShowDetails(true)}
            className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-300 transition-colors"
          >
            {topReactions.map(r => (
              <span key={r.type} className="text-lg">{r.emoji}</span>
            ))}
            {totalCount > 3 && (
              <span className="text-xs ml-1">+{totalCount - topReactions.length}</span>
            )}
          </button>
        )}
      </div>

      {/* Reaction Picker */}
      {showPicker && (
        <div
          ref={pickerRef}
          className="absolute bottom-full left-0 mb-2 bg-slate-800 rounded-full px-2 py-2 shadow-2xl border border-slate-700 flex gap-1 z-10 animate-in fade-in slide-in-from-bottom-2"
        >
          {reactions.map(reaction => (
            <button
              key={reaction.type}
              onClick={() => handleReaction(reaction.type)}
              className={`p-2 rounded-full hover:scale-125 transition-transform ${
                userReaction === reaction.type ? 'bg-slate-700' : 'hover:bg-slate-700'
              }`}
              title={reaction.label}
            >
              <span className="text-2xl">{reaction.emoji}</span>
            </button>
          ))}
        </div>
      )}

      {/* Reaction Details Modal */}
      {showDetails && (
        <>
          <div
            className="fixed inset-0 bg-black/60 z-40"
            onClick={() => setShowDetails(false)}
          />
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-md bg-slate-800 rounded-2xl p-6 z-50 border border-slate-700 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">Reactions ({totalCount})</h3>
              <button onClick={() => setShowDetails(false)}>
                <span className="text-gray-400 text-2xl">&times;</span>
              </button>
            </div>

            <div className="space-y-4">
              {reactions.map(reaction => {
                const users = postReactions[reaction.type] || [];
                if (users.length === 0) return null;

                return (
                  <div key={reaction.type} className="bg-slate-700/50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-2xl">{reaction.emoji}</span>
                      <span className="text-white font-semibold">{reaction.label}</span>
                      <span className="text-gray-400 text-sm">({users.length})</span>
                    </div>
                    <div className="space-y-2">
                      {users.map(user => (
                        <div key={user._id} className="flex items-center gap-3">
                          <img
                            src={user.profileImage}
                            alt={user.userName}
                            className="w-8 h-8 rounded-full"
                          />
                          <span className="text-white text-sm">
                            {user.firstName} {user.lastName}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default PostReactions;