import React, { useContext, useEffect, useState } from 'react';
import Nav from '../components/Nav';
import axios from 'axios';
import { RxCross1 } from "react-icons/rx";
import { Bell, Trash2, Heart, MessageCircle, UserCheck } from "lucide-react";
import { formatDistanceToNow } from 'date-fns';

const dp = 'https://ui-avatars.com/api/?name=User&size=200&background=6366f1&color=fff';

function Notification() {
  const [notificationData, setNotificationData] = useState([]);
  const [loading, setLoading] = useState(true);

  const handleGetNotification = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const config = {
        headers: { 'Authorization': `Bearer ${token}` },
        withCredentials: true
      };

      const result = await axios.get('/api/notification/get', config);
      console.log('✅ Notifications loaded:', result.data);
      
      // ✅ Backend directly returns array
      const notifications = Array.isArray(result.data) ? result.data : [];
      setNotificationData(notifications);
    } catch (error) {
      console.error("❌ Error fetching notifications:", error);
      setNotificationData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNotification = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: { 'Authorization': `Bearer ${token}` },
        withCredentials: true
      };

      await axios.delete(`/api/notification/deleteone/${id}`, config);
      
      // Remove from UI immediately
      setNotificationData(prev => prev.filter(n => n._id !== id));
    } catch (error) {
      console.error("❌ Error deleting notification:", error);
      alert('Failed to delete notification');
    }
  };

  const handleClearAllNotification = async () => {
    if (!window.confirm('Delete all notifications?')) return;
    
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: { 'Authorization': `Bearer ${token}` },
        withCredentials: true
      };

      await axios.delete('/api/notification', config);
      setNotificationData([]);
    } catch (error) {
      console.error("❌ Error clearing notifications:", error);
      alert('Failed to clear notifications');
    }
  };

  const getNotificationIcon = (type) => {
    switch(type) {
      case 'like':
        return <Heart className="w-5 h-5 text-pink-500" />;
      case 'comment':
        return <MessageCircle className="w-5 h-5 text-blue-500" />;
      case 'connectionAccepted':
        return <UserCheck className="w-5 h-5 text-green-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const getNotificationMessage = (type) => {
    switch(type) {
      case 'like':
        return 'liked your post';
      case 'comment':
        return 'commented on your post';
      case 'connectionAccepted':
        return 'accepted your connection request';
      default:
        return 'sent you a notification';
    }
  };

  const getNotificationColor = (type) => {
    switch(type) {
      case 'like':
        return 'border-l-pink-500 bg-pink-50 hover:bg-pink-100';
      case 'comment':
        return 'border-l-blue-500 bg-blue-50 hover:bg-blue-100';
      case 'connectionAccepted':
        return 'border-l-green-500 bg-green-50 hover:bg-green-100';
      default:
        return 'border-l-gray-500 bg-gray-50 hover:bg-gray-100';
    }
  };

  useEffect(() => {
    handleGetNotification();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pt-20">
        <Nav />
        <div className="flex items-center justify-center h-screen">
          <div className="text-white text-xl">Loading notifications...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pt-20">
      <Nav />

      <div className="max-w-4xl mx-auto px-4 py-8">
        
        {/* Header */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-2xl border border-slate-700 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-500/20 rounded-xl">
                <Bell className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Notifications</h1>
                <p className="text-sm text-gray-400">{notificationData.length} total</p>
              </div>
            </div>
            
            {notificationData.length > 0 && (
              <button
                onClick={handleClearAllNotification}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-all"
              >
                <Trash2 className="w-4 h-4" />
                Clear All
              </button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        {notificationData.length === 0 ? (
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-2xl border border-slate-700 p-12 text-center">
            <div className="w-20 h-20 bg-slate-700 rounded-full mx-auto mb-4 flex items-center justify-center">
              <Bell className="w-10 h-10 text-gray-500" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No notifications yet</h3>
            <p className="text-gray-400">When you get notifications, they'll show up here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notificationData.map((noti) => (
              <div
                key={noti._id}
                className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl shadow-xl border border-slate-700 p-4 hover:border-purple-500/50 transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  
                  {/* User Info & Message */}
                  <div className="flex items-start gap-3 flex-1">
                    
                    {/* Profile Image */}
                    <img
                      src={noti.relatedUser?.profileImage || dp}
                      alt="User"
                      className="w-12 h-12 rounded-full border-2 border-purple-500 object-cover flex-shrink-0"
                    />
                    
                    {/* Notification Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {getNotificationIcon(noti.type)}
                        <p className="text-white font-medium">
                          <span className="font-bold">
                            {noti.relatedUser?.firstName || ''} {noti.relatedUser?.lastName || ''}
                          </span>
                          {' '}
                          <span className="text-gray-300">
                            {getNotificationMessage(noti.type)}
                          </span>
                        </p>
                      </div>
                      
                      {/* Timestamp */}
                      <p className="text-xs text-gray-400">
                        {noti.createdAt ? formatDistanceToNow(new Date(noti.createdAt), { addSuffix: true }) : 'Just now'}
                      </p>
                      
                      {/* Related Post Preview */}
                      {noti.relatedPost && (
                        <div className="mt-3 flex items-center gap-3 p-2 bg-slate-700/50 rounded-lg">
                          {noti.relatedPost.image && (
                            <img
                              src={noti.relatedPost.image}
                              alt="Post"
                              className="w-16 h-12 rounded object-cover"
                            />
                          )}
                          {noti.relatedPost.description && (
                            <p className="text-sm text-gray-300 line-clamp-2 flex-1">
                              {noti.relatedPost.description}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Delete Button */}
                  <button
                    onClick={() => handleDeleteNotification(noti._id)}
                    className="p-2 hover:bg-red-500/20 rounded-lg transition-colors flex-shrink-0"
                  >
                    <RxCross1 className="w-5 h-5 text-gray-400 hover:text-red-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Notification;