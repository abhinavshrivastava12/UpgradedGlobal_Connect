import React, { useState, useEffect } from 'react';
import { TrendingUp, Hash } from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function TrendingHashtags() {
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadTrending();
  }, []);

  const loadTrending = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: { 'Authorization': `Bearer ${token}` },
        withCredentials: true
      };

      const response = await axios.get('/api/hashtags/trending?limit=10', config);
      if (response.data.success) {
        setTrending(response.data.trending);
      }
    } catch (error) {
      console.error('Load trending error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleHashtagClick = (tag) => {
    navigate(`/explore/${tag}`);
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-5 shadow-xl border border-slate-700">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-slate-700 rounded w-1/2"></div>
          {[1, 2, 3].map(i => (
            <div key={i} className="h-12 bg-slate-700 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (trending.length === 0) return null;

  return (
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-5 shadow-xl border border-slate-700">
      <h3 className="font-semibold text-lg mb-4 flex items-center gap-2 text-white">
        <TrendingUp className="w-5 h-5 text-orange-400" />
        Trending Now
      </h3>
      
      <div className="space-y-3">
        {trending.map((item, index) => (
          <button
            key={item.tag}
            onClick={() => handleHashtagClick(item.tag)}
            className="w-full text-left p-3 rounded-xl bg-slate-700/50 hover:bg-slate-600/50 transition-all border border-slate-600 hover:border-orange-500/50 group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm">
                  {index + 1}
                </div>
                <div>
                  <div className="flex items-center gap-1 text-white font-semibold group-hover:text-orange-400 transition-colors">
                    <Hash className="w-4 h-4" />
                    {item.tag.replace('#', '')}
                  </div>
                  <div className="text-xs text-gray-400">
                    {item.count} {item.count === 1 ? 'post' : 'posts'}
                  </div>
                </div>
              </div>
              <TrendingUp className="w-4 h-4 text-orange-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export default TrendingHashtags;