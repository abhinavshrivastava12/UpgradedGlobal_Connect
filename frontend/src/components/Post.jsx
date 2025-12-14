import { useState, useEffect } from 'react';
import axios from 'axios';
import { Heart, MessageCircle, Repeat2, Share, Trash2, MoreHorizontal } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import dp from '../assets/dp.webp';

const Post = ({ post, currentUser, onDelete }) => {
  // ✅ FIXED: Early validation
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
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    if (post) {
      setIsLiked(post.like?.includes(currentUser?._id) || false);
      setLikesCount(post.like?.length || 0);
      setComments(post.comment || []);
    }
  }, [post, currentUser]);

  const handleLike = async () => {
    try {
      const response = await axios.post(`/api/post/like/${post._id}`);
      
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
      const response = await axios.post(`/api/post/comment/${post._id}`, {
        content: comment.trim()
      });

      if (response.data) {
        setComments(response.data.comment || []);
        setComment('');
      }
    } catch (error) {
      console.error('Comment error:', error);
      alert('Failed to comment');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    
    setIsDeleting(true);
    try {
      const response = await axios.delete(`/api/post/delete/${post._id}`);
      
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
              <MoreHorizontal className="w-5 h-5 text-gray-400" />
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

          <button className="flex items-center space-x-2 text-gray-400 hover:text-green-400 transition-colors group">
            <div className="p-2 rounded-full group-hover:bg-green-500/10">
              <Repeat2 className="w-5 h-5" />
            </div>
          </button>

          <button className="flex items-center space-x-2 text-gray-400 hover:text-blue-400 transition-colors group">
            <div className="p-2 rounded-full group-hover:bg-blue-500/10">
              <Share className="w-5 h-5" />
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
    </div>
  );
};

export default Post;