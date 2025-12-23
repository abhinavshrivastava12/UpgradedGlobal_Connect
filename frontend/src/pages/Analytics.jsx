import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Users, Eye, Heart, MessageCircle } from 'lucide-react';
import axios from 'axios';
import Nav from '../components/Nav';

function Analytics() {
  const [analytics, setAnalytics] = useState(null);
  const [period, setPeriod] = useState('7d');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, [period]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: { 'Authorization': `Bearer ${token}` },
        withCredentials: true
      };

      const response = await axios.get(`/api/analytics/user?period=${period}`, config);
      if (response.data.success) {
        setAnalytics(response.data.analytics);
      }
    } catch (error) {
      console.error('Load analytics error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 pt-20">
        <Nav />
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-32 bg-slate-800 rounded-2xl"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-40 bg-slate-800 rounded-2xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!analytics) return null;

  const StatCard = ({ icon: Icon, label, value, color = 'purple' }) => (
    <div className={`bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border border-slate-700 hover:border-${color}-500/50 transition-all`}>
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 bg-${color}-500/20 rounded-xl`}>
          <Icon className={`w-6 h-6 text-${color}-400`} />
        </div>
        <TrendingUp className={`w-5 h-5 text-${color}-400`} />
      </div>
      <div className="text-3xl font-bold text-white mb-1">{value}</div>
      <div className="text-sm text-gray-400">{label}</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pt-20">
      <Nav />
      
      <div className="max-w-6xl mx-auto px-4 py-8">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-4 flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-purple-400" />
            Your Analytics
          </h1>
          
          {/* Period Selector */}
          <div className="flex gap-2">
            {['7d', '30d', '90d', 'all'].map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  period === p
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-800 text-gray-400 hover:bg-slate-700'
                }`}
              >
                {p === 'all' ? 'All Time' : p.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={BarChart3}
            label="Total Posts"
            value={analytics.overview.totalPosts}
            color="blue"
          />
          <StatCard
            icon={Heart}
            label="Total Likes"
            value={analytics.overview.totalLikes}
            color="red"
          />
          <StatCard
            icon={MessageCircle}
            label="Total Comments"
            value={analytics.overview.totalComments}
            color="green"
          />
          <StatCard
            icon={Users}
            label="New Connections"
            value={analytics.overview.newConnections}
            color="purple"
          />
        </div>

        {/* Engagement Rate */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border border-slate-700 mb-8">
          <h3 className="text-xl font-bold text-white mb-4">Engagement Rate</h3>
          <div className="text-5xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            {analytics.overview.engagementRate}
          </div>
          <p className="text-gray-400 mt-2">Average likes + comments per post</p>
        </div>

        {/* Most Liked Post */}
        {analytics.mostLikedPost && (
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border border-slate-700">
            <h3 className="text-xl font-bold text-white mb-4">🔥 Top Performing Post</h3>
            <p className="text-gray-300 mb-4">{analytics.mostLikedPost.description}...</p>
            <div className="flex gap-6 text-sm">
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-red-400" />
                <span className="text-gray-300">{analytics.mostLikedPost.likes} likes</span>
              </div>
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-green-400" />
                <span className="text-gray-300">{analytics.mostLikedPost.comments} comments</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Analytics;