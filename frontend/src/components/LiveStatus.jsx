import React, { useState, useEffect } from 'react';
import { Activity, X, Smile } from 'lucide-react';
import axios from 'axios';

const emojiList = ['🟢', '🔴', '🟡', '🟣', '🔵', '💼', '🏖️', '🎮', '📚', '☕', '🎵', '💤'];

function LiveStatus({ userId, userName }) {
  const [showModal, setShowModal] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('🟢');
  const [currentStatus, setCurrentStatus] = useState(null);
  const [friendStatuses, setFriendStatuses] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCurrentStatus();
    loadFriendStatuses();
  }, []);

  const loadCurrentStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: { 'Authorization': `Bearer ${token}` },
        withCredentials: true
      };

      const response = await axios.get(`/api/status/user/${userId}`, config);
      if (response.data.success && response.data.status) {
        setCurrentStatus(response.data.status);
      }
    } catch (error) {
      console.error('Load status error:', error);
    }
  };

  const loadFriendStatuses = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: { 'Authorization': `Bearer ${token}` },
        withCredentials: true
      };

      const response = await axios.get('/api/status/friends', config);
      if (response.data.success) {
        setFriendStatuses(response.data.statuses);
      }
    } catch (error) {
      console.error('Load friend statuses error:', error);
    }
  };

  const handleSetStatus = async () => {
    if (!statusText.trim()) {
      alert('Please enter a status');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: { 'Authorization': `Bearer ${token}` },
        withCredentials: true
      };

      const response = await axios.post(
        '/api/status/set',
        { text: statusText, emoji: selectedEmoji },
        config
      );

      if (response.data.success) {
        setCurrentStatus(response.data.status);
        setShowModal(false);
        setStatusText('');
        loadFriendStatuses();
      }
    } catch (error) {
      console.error('Set status error:', error);
      alert('Failed to set status');
    } finally {
      setLoading(false);
    }
  };

  const handleClearStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: { 'Authorization': `Bearer ${token}` },
        withCredentials: true
      };

      await axios.delete('/api/status/clear', config);
      setCurrentStatus(null);
      loadFriendStatuses();
    } catch (error) {
      console.error('Clear status error:', error);
    }
  };

  return (
    <>
      {/* Current User Status */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-4 shadow-xl border border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-green-400" />
            Live Status
          </h3>
        </div>

        {currentStatus ? (
          <div className="bg-slate-700/50 rounded-xl p-4 mb-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{currentStatus.emoji}</span>
              <div className="flex-1">
                <p className="text-white font-medium">{currentStatus.text}</p>
                <p className="text-xs text-gray-400">
                  Expires in {Math.ceil((new Date(currentStatus.expiresAt) - new Date()) / (1000 * 60 * 60))}h
                </p>
              </div>
              <button
                onClick={handleClearStatus}
                className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowModal(true)}
            className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 transition-all"
          >
            + Set Status
          </button>
        )}

        {/* Friend Statuses */}
        {friendStatuses.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-semibold text-gray-400 mb-2">Friends</p>
            {friendStatuses.map((status) => (
              <div key={status._id} className="bg-slate-700/30 rounded-lg p-3">
                <div className="flex items-center gap-3">
                  <img
                    src={status.user.profileImage}
                    alt={status.user.userName}
                    className="w-8 h-8 rounded-full"
                  />
                  <div className="flex-1">
                    <p className="text-white text-sm font-medium">
                      {status.user.firstName} {status.user.lastName}
                    </p>
                    <p className="text-gray-300 text-xs flex items-center gap-2">
                      <span className="text-lg">{status.emoji}</span>
                      {status.text}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Set Status Modal */}
      {showModal && (
        <>
          <div
            className="fixed inset-0 bg-black/60 z-40"
            onClick={() => setShowModal(false)}
          />
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-md bg-slate-800 rounded-2xl p-6 z-50 border border-slate-700">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">Set Live Status</h3>
              <button onClick={() => setShowModal(false)}>
                <X className="w-6 h-6 text-gray-400 hover:text-white" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Emoji Selector */}
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Choose Emoji</label>
                <div className="flex flex-wrap gap-2">
                  {emojiList.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => setSelectedEmoji(emoji)}
                      className={`text-2xl p-2 rounded-lg transition-all ${
                        selectedEmoji === emoji
                          ? 'bg-purple-600 scale-110'
                          : 'bg-slate-700 hover:bg-slate-600'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Status Input */}
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Status Text</label>
                <input
                  type="text"
                  placeholder="What's happening?"
                  maxLength={100}
                  value={statusText}
                  onChange={(e) => setStatusText(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <p className="text-xs text-gray-400 mt-1">
                  {statusText.length}/100 characters
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-600"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSetStatus}
                  disabled={loading || !statusText.trim()}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 disabled:opacity-50"
                >
                  {loading ? 'Setting...' : 'Set Status'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}

export default LiveStatus;