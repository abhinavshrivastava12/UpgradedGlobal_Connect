import { useState, useEffect } from 'react';
import axios from 'axios';
import { Heart, MessageCircle, Repeat2, Share2, Trash2, MoreHorizontal, X, Bookmark, BookmarkCheck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import dp from '../assets/dp.webp';

const Post = ({ post, currentUser, onDelete }) => {
  if (!post || !post._id) {
    console.error('Invalid post data:', post);
    return null;
  }

  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false); // Bookmark State
  const [showMenu, setShowMenu] = useState(false);
  const [isReposting, setIsReposting] = useState(false);
  const [showRepostModal, setShowRepostModal] = useState(false);
  const [repostText, setRepostText] = useState('');
  const [showShareMenu, setShowShareMenu] = useState(false);

  // Initial post data effect
  useEffect(() => {
    if (post) {
      setIsLiked(post.like?.includes(currentUser?._id) || false);
      setLikesCount(post.like?.length || 0);
      setComments(post.comment || []);
    }
  }, [post, currentUser]);

  // Check Bookmark Status effect
  useEffect(() => {
    if (post?._id) {
      checkBookmarkStatus();
    }
  }, [post._id]);

  const checkBookmarkStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: { 'Authorization': `Bearer ${token}` },
        withCredentials: true
      };
      const response = await axios.get(`/api/bookmarks/check/${post._id}`, config);
      if (response.data.success) {
        setIsBookmarked(response.data.bookmarked);
      }
    } catch (error) {
      console.error('Check bookmark error:', error);
    }
  };

  const handleBookmark = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: { 'Authorization': `Bearer ${token}` },
        withCredentials: true
      };
      const response = await axios.post(`/api/bookmarks/toggle/${post._id}`, {}, config);
      if (response.data.success) {
        setIsBookmarked(response.data.bookmarked);
      }
    } catch (error) {
      console.error('Toggle bookmark error:', error);
      alert('Failed to bookmark post');
    }
  };

  const handleLike = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: { 'Authorization': `Bearer ${token}` },
        withCredentials: true
      };

      const response = await axios.post(`/api/post/like/${post._id}`, {}, config);
      
      if (response.data) {
        setIsLiked(!isLiked);
        setLikesCount(isLiked ? likesCount - 1 : likesCount + 1);
      }
    } catch (error) {
      console.error('Like error:', error);
      alert('Failed to like post');
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;

    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: { 'Authorization': `Bearer ${token}` },
        withCredentials: true
      };

      const response = await axios.post(`/api/post/comment/${post._id}`, {
        content: comment.trim()
      }, config);

      if (response.data) {
        setComments(response.data.comment || []);
        setComment('');
      }
    } catch (error) {
      console.error('Comment error:', error);
      alert('Failed to comment');
    }
  };

  const handleRepost = async () => {
    setIsReposting(true);
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: { 'Authorization': `Bearer ${token}` },
        withCredentials: true
      };

      const response = await axios.post(`/api/post/repost/${post._id}`, {
        description: repostText.trim() || `Reposted from @${post.author?.userName}`
      }, config);

      if (response.data) {
        alert('Post reposted successfully!');
        setShowRepostModal(false);
        setRepostText('');
        window.location.reload(); 
      }
    } catch (error) {
      console.error('Repost error:', error);
      if (error.response?.data?.message === 'Already reposted') {
        alert('You have already reposted this post');
      } else {
        alert('Failed to repost');
      }
    } finally {
      setIsReposting(false);
    }
  };

  const handleShare = (platform) => {
    const postUrl = `${window.location.origin}/post/${post._id}`;
    const text = post.description || 'Check out this post!';
    
    let shareUrl = '';
    
    switch(platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(postUrl)}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postUrl)}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(postUrl)}`;
        break;
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodeURIComponent(text + ' ' + postUrl)}`;
        break;
      case 'copy':
        navigator.clipboard.writeText(postUrl);
        alert('Link copied to clipboard!');
        setShowShareMenu(false);
        return;
    }
    
    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400');
      setShowShareMenu(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    
    setIsDeleting(true);
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: { 'Authorization': `Bearer ${token}` },
        withCredentials: true
      };

      const response = await axios.delete(`/api/post/delete/${post._id}`, config);
      
      if (response.data) {
        if (onDelete) onDelete(post._id);
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete post');
    } finally {
      setIsDeleting(false);
      setShowMenu(false);
    }
  };

  const isOwner = currentUser?._id === post.author?._id;
  const author = post.author || {};

  return (
    <div className="border-b border-slate-700 hover:bg-slate-800/50 transition-colors p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start space-x-3 flex-1 min-w-0">
          <img
            src={author.profileImage || dp}
            alt={author.userName || 'User'}
            className="w-12 h-12 rounded-full flex-shrink-0 object-cover border-2 border-purple-500"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center flex-wrap gap-2">
              <span className="font-bold text-white truncate">
                {author.firstName && author.lastName 
                  ? `${author.firstName} ${author.lastName}` 
                  : author.userName || 'Unknown User'}
              </span>
              <span className="text-gray-400 text-sm truncate">
                @{author.userName || 'unknown'}
              </span>
              <span className="text-gray-500 text-sm">·</span>
              <span className="text-gray-500 text-sm flex-shrink-0">
                {post.createdAt ? formatDistanceToNow(new Date(post.createdAt), { addSuffix: true }) : 'Just now'}
              </span>
            </div>
            {author.headline && (
              <p className="text-sm text-gray-400 mt-1">{author.headline}</p>
            )}
          </div>
        </div>

        {/* Menu */}
        {isOwner && (
          <div className="relative flex-shrink-0 ml-2">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 hover:bg-slate-700 rounded-full transition-colors"
            >
              < MoreHorizontal className="w-5 h-5 text-gray-400" />
            </button>
            
            {showMenu && (
              <>
                <div 
                  className="fixed inset-0 z-10"
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute right-0 mt-1 bg-slate-800 rounded-lg shadow-lg border border-slate-700 py-1 z-20 min-w-[150px]">
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="w-full px-4 py-2 text-left text-red-400 hover:bg-slate-700 flex items-center space-x-2 disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>{isDeleting ? 'Deleting...' : 'Delete Post'}</span>
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="ml-0 md:ml-[60px]">
        {post.description && (
          <p className="text-gray-100 mb-4 whitespace-pre-wrap break-words text-lg">
            {post.description}
          </p>
        )}

        {/* Image */}
        {post.image && (
          <div className="mb-4 rounded-2xl overflow-hidden">
            <img
              src={post.image}
              alt="Post"
              className="w-full max-h-[500px] object-cover cursor-pointer"
              onClick={() => window.open(post.image, '_blank')}
            />
          </div>
        )}

        {/* Reposted Content */}
        {post.repostOf && (
          <div className="mb-4 border border-slate-600 rounded-xl p-4 bg-slate-800/50">
            <div className="flex items-center gap-2 mb-2 text-gray-400 text-sm">
              <Repeat2 className="w-4 h-4" />
              <span>Reposted from @{post.repostOf.author?.userName}</span>
            </div>
            {post.repostOf.description && (
              <p className="text-gray-300">{post.repostOf.description}</p>
            )}
            {post.repostOf.image && (
              <img src={post.repostOf.image} alt="Repost" className="rounded-lg mt-2 max-h-60 object-cover" />
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between max-w-md mt-4">
          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center space-x-2 text-gray-400 hover:text-blue-400 transition-colors group"
          >
            <div className="p-2 rounded-full group-hover:bg-blue-500/10">
              <MessageCircle className="w-5 h-5" />
            </div>
            <span className="text-sm">{comments.length}</span>
          </button>

          <button
            onClick={() => setShowRepostModal(true)}
            className="flex items-center space-x-2 text-gray-400 hover:text-green-400 transition-colors group"
          >
            <div className="p-2 rounded-full group-hover:bg-green-500/10">
              <Repeat2 className="w-5 h-5" />
            </div>
          </button>

          <button
            onClick={handleLike}
            className={`flex items-center space-x-2 transition-colors group ${
              isLiked ? 'text-red-500' : 'text-gray-400 hover:text-red-500'
            }`}
          >
            <div className={`p-2 rounded-full ${
              isLiked ? 'bg-red-500/10' : 'group-hover:bg-red-500/10'
            }`}>
              <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
            </div>
            <span className="text-sm">{likesCount}</span>
          </button>

          <div className="relative">
            <button 
              onClick={() => setShowShareMenu(!showShareMenu)}
              className="flex items-center space-x-2 text-gray-400 hover:text-blue-400 transition-colors group"
            >
              <div className="p-2 rounded-full group-hover:bg-blue-500/10">
                <Share2 className="w-5 h-5" />
              </div>
            </button>

            {showShareMenu && (
              <>
                <div 
                  className="fixed inset-0 z-10"
                  onClick={() => setShowShareMenu(false)}
                />
                <div className="absolute bottom-full right-0 mb-2 bg-slate-800 rounded-lg shadow-lg border border-slate-700 py-2 z-20 min-w-[200px]">
                  <button onClick={() => handleShare('twitter')} className="w-full px-4 py-2 text-left text-white hover:bg-slate-700">Share on Twitter</button>
                  <button onClick={() => handleShare('facebook')} className="w-full px-4 py-2 text-left text-white hover:bg-slate-700">Share on Facebook</button>
                  <button onClick={() => handleShare('linkedin')} className="w-full px-4 py-2 text-left text-white hover:bg-slate-700">Share on LinkedIn</button>
                  <button onClick={() => handleShare('whatsapp')} className="w-full px-4 py-2 text-left text-white hover:bg-slate-700">Share on WhatsApp</button>
                  <button onClick={() => handleShare('copy')} className="w-full px-4 py-2 text-left text-white hover:bg-slate-700">Copy Link</button>
                </div>
              </>
            )}
          </div>

          {/* Bookmark Button */}
          <button
            onClick={handleBookmark}
            className={`flex items-center space-x-2 transition-colors group ${
              isBookmarked ? 'text-yellow-500' : 'text-gray-400 hover:text-yellow-500'
            }`}
          >
            <div className={`p-2 rounded-full ${
              isBookmarked ? 'bg-yellow-500/10' : 'group-hover:bg-yellow-500/10'
            }`}>
              {isBookmarked ? (
                <BookmarkCheck className="w-5 h-5 fill-current" />
              ) : (
                <Bookmark className="w-5 h-5" />
              )}
            </div>
          </button>
        </div>

        {/* Comments Section */}
        {showComments && (
          <div className="mt-6 pt-4 border-t border-slate-700">
            <form onSubmit={handleComment} className="mb-4">
              <div className="flex space-x-2">
                <img
                  src={currentUser?.profileImage || dp}
                  alt="You"
                  className="w-10 h-10 rounded-full flex-shrink-0 object-cover border-2 border-purple-500"
                />
                <div className="flex-1 flex space-x-2">
                  <input
                    type="text"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Post your reply"
                    className="flex-1 px-4 py-2 bg-slate-700 border border-slate-600 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder-gray-400"
                  />
                  <button
                    type="submit"
                    disabled={!comment.trim()}
                    className="px-6 py-2 bg-purple-600 text-white rounded-full hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                  >
                    Reply
                  </button>
                </div>
              </div>
            </form>

            {comments.length > 0 && (
              <div className="space-y-4">
                {comments.map((c, idx) => (
                  <div key={idx} className="flex space-x-3">
                    <img
                      src={c.user?.profileImage || dp}
                      alt={c.user?.userName}
                      className="w-10 h-10 rounded-full flex-shrink-0 object-cover border-2 border-purple-500"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="bg-slate-700 rounded-2xl px-4 py-3">
                        <p className="font-semibold text-sm text-white">
                          {c.user?.firstName && c.user?.lastName 
                            ? `${c.user.firstName} ${c.user.lastName}` 
                            : c.user?.userName || 'User'}
                        </p>
                        <p className="text-gray-100 break-words mt-1">{c.content}</p>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 ml-4">
                        {c.createdAt ? formatDistanceToNow(new Date(c.createdAt), { addSuffix: true }) : 'Just now'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Repost Modal */}
      {showRepostModal && (
        <>
          <div 
            className="fixed inset-0 bg-black/60 z-40"
            onClick={() => setShowRepostModal(false)}
          />
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-slate-800 rounded-2xl p-6 z-50 w-[90%] max-w-md border border-slate-700">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">Repost</h3>
              <button
                onClick={() => setShowRepostModal(false)}
                className="p-2 hover:bg-slate-700 rounded-full"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            
            <textarea
              value={repostText}
              onChange={(e) => setRepostText(e.target.value)}
              placeholder="Add a comment (optional)"
              className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
              rows={3}
            />
            
            <div className="mt-4 flex gap-3">
              <button
                onClick={() => setShowRepostModal(false)}
                className="flex-1 px-4 py-2 border border-slate-600 text-gray-300 rounded-lg hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleRepost}
                disabled={isReposting}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isReposting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Reposting...
                  </>
                ) : (
                  <>
                    <Repeat2 className="w-4 h-4" />
                    Repost
                  </>
                )}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Post;