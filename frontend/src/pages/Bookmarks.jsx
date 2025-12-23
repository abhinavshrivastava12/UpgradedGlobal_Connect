import React, { useState, useEffect, useContext } from 'react';
import { Bookmark, BookmarkCheck } from 'lucide-react';
import axios from 'axios';
import Nav from '../components/Nav';
import Post from '../components/Post';
import { userDataContext } from '../context/UserContext';

function Bookmarks() {
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const { userData } = useContext(userDataContext);

  useEffect(() => {
    loadBookmarks();
  }, []);

  const loadBookmarks = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: { 'Authorization': `Bearer ${token}` },
        withCredentials: true
      };

      const response = await axios.get('/api/bookmarks', config);
      if (response.data.success) {
        setBookmarks(response.data.bookmarks);
      }
    } catch (error) {
      console.error('Load bookmarks error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveBookmark = (postId) => {
    setBookmarks(bookmarks.filter(post => post._id !== postId));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading bookmarks...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pt-20">
      <Nav />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-2xl border border-slate-700 p-6">
          
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-purple-500/20 rounded-xl">
              <Bookmark className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Saved Posts</h1>
              <p className="text-gray-400 text-sm">{bookmarks.length} items</p>
            </div>
          </div>

          {bookmarks.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-slate-700 rounded-full mx-auto mb-4 flex items-center justify-center">
                <Bookmark className="w-10 h-10 text-gray-500" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">No bookmarks yet</h3>
              <p className="text-gray-400">
                Save posts to view them later
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {bookmarks.map((post) => (
                <div key={post._id} className="border-b border-slate-700 pb-6 last:border-0">
                  <Post 
                    post={post}
                    currentUser={userData}
                    onDelete={handleRemoveBookmark}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Bookmarks;
