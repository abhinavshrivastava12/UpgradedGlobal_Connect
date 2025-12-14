import { useState, useEffect } from 'react';
import axios from 'axios';
import { Heart, MessageCircle, Repeat2, Share, Trash2, MoreHorizontal, Bookmark } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const Post = ({ post, currentUser, onDelete, onUpdate }) => {
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [isRetweeted, setIsRetweeted] = useState(false);
  const [retweetCount, setRetweetCount] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    if (post) {
      setIsLiked(post.likes?.includes(currentUser?._id) || false);
      setLikesCount(post.likes?.length || 0);
      setIsRetweeted(post.retweets?.includes(currentUser?._id) || false);
      setRetweetCount(post.retweets?.length || 0);
      setComments(post.comments || []);
    }
  }, [post, currentUser]);

  if (!post || !post._id) {
    console.error('Invalid post data:', post);
    return null;
  }

  const handleLike = async () => {
    try {
      const response = await axios.post(`/api/post/like/${post._id}`);
      
      if (response.data.success) {
        setIsLiked(!isLiked);
        setLikesCount(isLiked ? likesCount - 1 : likesCount + 1);
      }
    } catch (error) {
      console.error('Like error:', error);
      alert('Failed to like post');
    }
  };

  const handleRetweet = async () => {
    try {
      const response = await axios.post(`/api/post/retweet/${post._id}`);
      
      if (response.data.success) {
        setIsRetweeted(!isRetweeted);
        setRetweetCount(isRetweeted ? retweetCount - 1 : retweetCount + 1);
      }
    } catch (error) {
      console.error('Retweet error:', error);
      alert('Failed to retweet');
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;

    try {
      const response = await axios.post(`/api/post/comment/${post._id}`, {
        text: comment.trim()
      });

      if (response.data.success) {
        setComments([...comments, response.data.comment]);
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
      const response = await axios.delete(`/api/post/${post._id}`);
      
      if (response.data.success) {
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

  const isOwner = currentUser?._id === post.user?._id;

  return (
    <div className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start space-x-3 flex-1 min-w-0">
            <img
              src={post.user?.profilePicture || '/default-avatar.png'}
              alt={post.user?.username || 'User'}
              className="w-12 h-12 rounded-full flex-shrink-0 object-cover"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center flex-wrap gap-2">
                <span className="font-bold text-gray-900 truncate">
                  {post.user?.name || 'Unknown User'}
                </span>
                <span className="text-gray-500 text-sm truncate">
                  @{post.user?.username || 'unknown'}
                </span>
                <span className="text-gray-500 text-sm">·</span>
                <span className="text-gray-500 text-sm flex-shrink-0">
                  {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                </span>
              </div>
            </div>
          </div>

          {/* Menu */}
          {isOwner && (
            <div className="relative flex-shrink-0 ml-2">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 hover:bg-blue-50 rounded-full transition-colors"
              >
                <MoreHorizontal className="w-5 h-5 text-gray-500" />
              </button>
              
              {showMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-10"
                    onClick={() => setShowMenu(false)}
                  />
                  <div className="absolute right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20 min-w-[150px]">
                    <button
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 flex items-center space-x-2 disabled:opacity-50"
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
          {post.text && (
            <p className="text-gray-900 mb-3 whitespace-pre-wrap break-words">
              {post.text}
            </p>
          )}

          {/* Images */}
          {post.images && post.images.length > 0 && (
            <div className={`grid gap-2 mb-3 rounded-2xl overflow-hidden ${
              post.images.length === 1 ? 'grid-cols-1' : 
              post.images.length === 2 ? 'grid-cols-2' : 
              post.images.length === 3 ? 'grid-cols-2' : 
              'grid-cols-2'
            }`}>
              {post.images.map((img, idx) => (
                <img
                  key={idx}
                  src={img}
                  alt={`Post ${idx + 1}`}
                  className={`w-full object-cover cursor-pointer ${
                    post.images.length === 1 ? 'max-h-[500px]' : 
                    post.images.length === 3 && idx === 0 ? 'row-span-2 h-full' : 
                    'h-[200px]'
                  }`}
                  onClick={() => window.open(img, '_blank')}
                />
              ))}
            </div>
          )}

          {/* Poll */}
          {post.poll && (
            <div className="mb-3 border border-gray-200 rounded-2xl p-4">
              <p className="font-semibold mb-3">{post.poll.question}</p>
              {post.poll.options.map((option, idx) => (
                <button
                  key={idx}
                  className="w-full mb-2 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-left font-medium"
                >
                  {option.text}
                </button>
              ))}
              <p className="text-sm text-gray-500 mt-2">
                {post.poll.options.reduce((sum, opt) => sum + (opt.votes?.length || 0), 0)} votes
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between max-w-md mt-3">
            <button
              onClick={() => setShowComments(!showComments)}
              className="flex items-center space-x-2 text-gray-500 hover:text-blue-500 transition-colors group"
            >
              <div className="p-2 rounded-full group-hover:bg-blue-50">
                <MessageCircle className="w-5 h-5" />
              </div>
              <span className="text-sm">{comments.length}</span>
            </button>

            <button
              onClick={handleRetweet}
              className={`flex items-center space-x-2 transition-colors group ${
                isRetweeted ? 'text-green-500' : 'text-gray-500 hover:text-green-500'
              }`}
            >
              <div className={`p-2 rounded-full ${
                isRetweeted ? 'bg-green-50' : 'group-hover:bg-green-50'
              }`}>
                <Repeat2 className="w-5 h-5" />
              </div>
              <span className="text-sm">{retweetCount}</span>
            </button>

            <button
              onClick={handleLike}
              className={`flex items-center space-x-2 transition-colors group ${
                isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
              }`}
            >
              <div className={`p-2 rounded-full ${
                isLiked ? 'bg-red-50' : 'group-hover:bg-red-50'
              }`}>
                <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
              </div>
              <span className="text-sm">{likesCount}</span>
            </button>

            <button className="flex items-center space-x-2 text-gray-500 hover:text-blue-500 transition-colors group">
              <div className="p-2 rounded-full group-hover:bg-blue-50">
                <Bookmark className="w-5 h-5" />
              </div>
            </button>

            <button className="flex items-center space-x-2 text-gray-500 hover:text-blue-500 transition-colors group">
              <div className="p-2 rounded-full group-hover:bg-blue-50">
                <Share className="w-5 h-5" />
              </div>
            </button>
          </div>

          {/* Comments Section */}
          {showComments && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <form onSubmit={handleComment} className="mb-4">
                <div className="flex space-x-2">
                  <img
                    src={currentUser?.profilePicture || '/default-avatar.png'}
                    alt="You"
                    className="w-10 h-10 rounded-full flex-shrink-0 object-cover"
                  />
                  <div className="flex-1 flex space-x-2">
                    <input
                      type="text"
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Post your reply"
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:border-blue-500"
                    />
                    <button
                      type="submit"
                      disabled={!comment.trim()}
                      className="px-6 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                    >
                      Reply
                    </button>
                  </div>
                </div>
              </form>

              {comments.length > 0 && (
                <div className="space-y-3">
                  {comments.map((c, idx) => (
                    <div key={idx} className="flex space-x-3">
                      <img
                        src={c.user?.profilePicture || '/default-avatar.png'}
                        alt={c.user?.username}
                        className="w-10 h-10 rounded-full flex-shrink-0 object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="bg-gray-100 rounded-2xl px-4 py-2">
                          <p className="font-semibold text-sm">{c.user?.name}</p>
                          <p className="text-gray-900 break-words">{c.text}</p>
                        </div>
                        <p className="text-xs text-gray-500 mt-1 ml-4">
                          {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}
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
    </div>
  );
};

export default Post;