import React, { useState, useEffect, useRef, useContext } from 'react';
import dp from "../assets/dp.webp";
import moment from "moment";
import { FaRegCommentDots, FaHeart, FaRetweet } from "react-icons/fa";
import { BiLike, BiSolidLike, BiDotsHorizontalRounded } from "react-icons/bi";
import { BsEmojiSmile } from "react-icons/bs";
import { FiTrash2, FiFlag, FiLink } from "react-icons/fi";
import { HiOutlineThumbUp, HiOutlineHeart, HiOutlineEmojiHappy, HiOutlineEmojiSad, HiOutlineFire } from "react-icons/hi";
import { MdOutlineShare } from "react-icons/md";
import axios from 'axios';
import { authDataContext } from '../context/AuthContext';
import { userDataContext } from '../context/UserContext';
import { io } from "socket.io-client";
import ConnectionButton from './ConnectionButton';

// Socket setup
const socket = io();

// Error Boundary
class PostErrorBoundary extends React.Component {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error, info) { console.error(error, info); }
  render() { if (this.state.hasError) return <div>Something went wrong in Post!</div>; return this.props.children; }
}

function Post({ id, author, like = [], comment = [], description = "", image, createdAt }) {
  const [more, setMore] = useState(false);
  const { serverUrl } = useContext(authDataContext);
  const { userData, getPost, handleGetProfile } = useContext(userDataContext);
  const [likes, setLikes] = useState(Array.isArray(like) ? like : []);
  const [comments, setComments] = useState(Array.isArray(comment) ? comment : []);
  const [commentContent, setCommentContent] = useState("");
  const [showComment, setShowComment] = useState(false);
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const moreOptionsRef = useRef(null);
  const shareOptionsRef = useRef(null);

  const emojis = ['👍', '❤️', '😂', '😮', '😢', '🔥', '🎉', '👏', '🥳', '😎'];

  const reactions = [
    { type: 'like', icon: HiOutlineThumbUp, color: 'text-blue-500', label: 'Like' },
    { type: 'love', icon: HiOutlineHeart, color: 'text-red-500', label: 'Love' },
    { type: 'haha', icon: HiOutlineEmojiHappy, color: 'text-yellow-500', label: 'Haha' },
    { type: 'sad', icon: HiOutlineEmojiSad, color: 'text-yellow-600', label: 'Sad' },
    { type: 'wow', icon: HiOutlineFire, color: 'text-orange-500', label: 'Wow' }
  ];

  const isAuthor = userData?._id === author?._id;

  // Socket listeners for real-time updates
  useEffect(() => {
    socket.on("likeUpdated", ({ postId, likes }) => {
      if (postId === id) setLikes(Array.isArray(likes) ? likes : []);
    });
    socket.on("commentAdded", ({ postId, comments }) => {
      if (postId === id) setComments(Array.isArray(comments) ? comments : []);
    });
    return () => {
      socket.off("likeUpdated");
      socket.off("commentAdded");
    };
  }, [id]);

  useEffect(() => { getPost(); }, [likes, comments]);

  // Click outside for menus
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (moreOptionsRef.current && !moreOptionsRef.current.contains(e.target)) setShowMoreOptions(false);
      if (shareOptionsRef.current && !shareOptionsRef.current.contains(e.target)) setShowShareOptions(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Like
  const handleLike = async () => {
    try {
      const res = await axios.get(`${serverUrl}/api/post/like/${id}`, { withCredentials: true });
      setLikes(Array.isArray(res.data.like) ? res.data.like : []);
    } catch (error) { console.error(error); }
  };

  // Reaction
  const handleReaction = async (reactionType) => {
    try {
      const res = await axios.post(`${serverUrl}/api/post/reaction/${id}`, { reaction: reactionType }, { withCredentials: true });
      setLikes(Array.isArray(res.data.like) ? res.data.like : []);
      setShowReactions(false);
    } catch (error) { console.error(error); }
  };

  // Comment
  const handleComment = async (e) => {
    e.preventDefault();
    if (!commentContent.trim()) return;
    try {
      const res = await axios.post(`${serverUrl}/api/post/comment/${id}`, { content: commentContent }, { withCredentials: true });
      setComments(Array.isArray(res.data.comment) ? res.data.comment : []);
      setCommentContent("");
    } catch (error) { console.error(error); }
  };

  const handleAddEmoji = (emoji) => { setCommentContent(prev => prev + emoji); setShowEmojiPicker(false); };

  const handleDeletePost = async () => {
    if (!isAuthor) return;
    setIsDeleting(true);
    try { await axios.delete(`${serverUrl}/api/post/delete/${id}`, { withCredentials: true }); getPost(); }
    catch (error) { console.error(error); }
    finally { setIsDeleting(false); setShowMoreOptions(false); }
  };

  const handleRepost = async () => {
    try { await axios.post(`${serverUrl}/api/post/repost/${id}`, {}, { withCredentials: true }); getPost(); }
    catch (error) { console.error(error); }
  };

  const handleShare = (platform) => {
    const postUrl = `${window.location.origin}/post/${id}`;
    const shareText = description?.slice(0, 100) + (description.length > 100 ? "..." : "");
    switch (platform) {
      case 'copy': navigator.clipboard.writeText(postUrl); alert('Link copied!'); break;
      case 'twitter': window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(postUrl)}`, '_blank'); break;
      case 'facebook': window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postUrl)}`, '_blank'); break;
      case 'email': window.open(`mailto:?subject=Check out this post&body=${encodeURIComponent(shareText + '\n\n' + postUrl)}`, '_blank'); break;
      default: break;
    }
    setShowShareOptions(false);
  };

  return (
    <PostErrorBoundary>
      <div className="w-full bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100">
        {/* Header */}
        <div className='flex justify-between items-start p-6 pb-4'>
          <div className='flex gap-4 items-start cursor-pointer group' onClick={() => handleGetProfile(author?.userName)}>
            <div className='w-12 h-12 rounded-full overflow-hidden border-2 border-gray-200 group-hover:border-blue-300 transition-colors shadow-sm'>
              <img src={author?.profileImage || dp} alt="" className='h-full w-full object-cover' />
            </div>
            <div className="flex-1">
              <div className='text-base font-semibold hover:text-blue-600 transition-colors group-hover:text-blue-600'>
                {author?.firstName} {author?.lastName}
              </div>
              <div className='text-sm text-gray-600 mb-1'>{author?.headline}</div>
              <div className='text-xs text-gray-500 flex items-center gap-2'>
                {createdAt ? moment(createdAt).fromNow() : ''}
                <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                <span>🌐 Public</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isAuthor && <ConnectionButton userId={author?._id} />}
            <div className="relative" ref={moreOptionsRef}>
              <button className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                      onClick={e => { e.stopPropagation(); setShowMoreOptions(!showMoreOptions); }}>
                <BiDotsHorizontalRounded className="w-5 h-5 text-gray-600" />
              </button>
              {showMoreOptions && (
                <div className="absolute right-0 top-full mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 py-2 w-48 z-50">
                  {isAuthor ? (
                    <button className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 text-red-600" onClick={handleDeletePost} disabled={isDeleting}>
                      <FiTrash2 className="w-4 h-4" /> Delete post
                    </button>
                  ) : (
                    <button className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 text-gray-700">
                      <FiFlag className="w-4 h-4" /> Report post
                    </button>
                  )}
                  <button className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 text-gray-700" onClick={() => handleShare('copy')}>
                    <FiLink className="w-4 h-4" /> Copy link
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 pb-4">
          <div className={`text-gray-800 leading-relaxed ${!more && description?.length > 300 ? "max-h-20 overflow-hidden" : ""}`}>
            {description}
          </div>
          {description && description.length > 300 && (
            <button className="text-blue-600 hover:text-blue-700 text-sm font-medium mt-2 hover:underline"
                    onClick={() => setMore(!more)}>
              {more ? "Show less" : "Show more"}
            </button>
          )}
        </div>

        {/* Image */}
        {image && (
          <div className="w-full max-h-96 overflow-hidden bg-gray-100">
            <img src={image} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500 cursor-pointer" />
          </div>
        )}

        {/* Stats */}
        <div className="flex justify-between items-center px-6 py-3 border-t border-gray-100">
          <div className="flex items-center gap-2 text-gray-600 text-sm">
            <div className="flex -space-x-1">
              <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center border-2 border-white">
                <BiLike className="text-white w-3 h-3" />
              </div>
              <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center border-2 border-white">
                <FaHeart className="text-white w-2.5 h-2.5" />
              </div>
            </div>
            <span className="hover:underline cursor-pointer">{likes.length}</span>
          </div>

          <div className="flex items-center gap-4 text-gray-600 text-sm">
            <button className="hover:text-blue-600 hover:underline cursor-pointer transition-colors"
                    onClick={() => setShowComment(!showComment)}>
              {comments.length} comments
            </button>
            <span className="hover:underline cursor-pointer">12 shares</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-around items-center px-6 py-3 border-t border-gray-100 bg-gray-50">
          <div className="relative">
            {!likes.includes(userData?._id) ? (
              <button className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-blue-50 text-gray-700 hover:text-blue-600 font-medium group"
                      onClick={handleLike}
                      onMouseEnter={() => setShowReactions(true)}
                      onMouseLeave={() => setTimeout(() => setShowReactions(false), 300)}>
                <BiLike className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span>Like</span>
              </button>
            ) : (
              <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-50 text-blue-600 font-semibold"
                      onClick={handleLike}
                      onMouseEnter={() => setShowReactions(true)}
                      onMouseLeave={() => setTimeout(() => setShowReactions(false), 300)}>
                <BiSolidLike className="w-5 h-5 animate-pulse" />
                <span>Liked</span>
              </button>
            )}

            {showReactions && (
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-white rounded-full shadow-2xl border border-gray-200 px-2 py-1 flex gap-1 z-50"
                   onMouseEnter={() => setShowReactions(true)}
                   onMouseLeave={() => setShowReactions(false)}>
                {reactions.map(({ type, icon: Icon, color, label }) => (
                  <button key={type} className={`p-2 rounded-full hover:bg-gray-100 hover:scale-125 transition-all duration-200 ${color}`}
                          onClick={() => handleReaction(type)}
                          title={label}>
                    <Icon className="w-6 h-6" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <button className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-green-50 text-gray-700 hover:text-green-600 font-medium group"
                  onClick={() => setShowComment(!showComment)}>
            <FaRegCommentDots className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span>Comment</span>
          </button>

          <button className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-purple-50 text-gray-700 hover:text-purple-600 font-medium group"
                  onClick={handleRepost}>
            <FaRetweet className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span>Repost</span>
          </button>

          <div className="relative" ref={shareOptionsRef}>
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-yellow-50 text-gray-700 hover:text-yellow-600 font-medium group"
                    onClick={() => setShowShareOptions(!showShareOptions)}>
              <MdOutlineShare className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span>Share</span>
            </button>
            {showShareOptions && (
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-white rounded-xl shadow-2xl border border-gray-200 py-2 w-48 z-50">
                <button onClick={() => handleShare('copy')} className="w-full px-4 py-2 hover:bg-gray-50 flex items-center gap-3 text-gray-700">Copy Link</button>
                <button onClick={() => handleShare('twitter')} className="w-full px-4 py-2 hover:bg-gray-50 flex items-center gap-3 text-blue-500">Twitter</button>
                <button onClick={() => handleShare('facebook')} className="w-full px-4 py-2 hover:bg-gray-50 flex items-center gap-3 text-blue-800">Facebook</button>
                <button onClick={() => handleShare('email')} className="w-full px-4 py-2 hover:bg-gray-50 flex items-center gap-3 text-red-600">Email</button>
              </div>
            )}
          </div>
        </div>

        {/* Comment Input */}
        {showComment && (
          <form onSubmit={handleComment} className="flex gap-2 items-center px-6 py-3 border-t border-gray-100">
            <img src={userData?.profileImage || dp} alt="" className="w-10 h-10 rounded-full" />
            <div className="flex-1 relative">
              <input type="text" placeholder="Write a comment..." value={commentContent} onChange={e => setCommentContent(e.target.value)}
                     className="w-full border border-gray-200 rounded-full py-2 px-4 pl-10 focus:outline-none focus:ring-1 focus:ring-blue-500" />
              <button type="button" onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="absolute left-2 top-2 text-gray-500 hover:text-yellow-500">
                <BsEmojiSmile />
              </button>
              {showEmojiPicker && (
                <div className="absolute bottom-full left-0 mb-2 flex flex-wrap gap-1 bg-white border border-gray-200 rounded-lg p-2 shadow-xl z-50">
                  {emojis.map(e => <button key={e} type="button" onClick={() => handleAddEmoji(e)} className="p-1">{e}</button>)}
                </div>
              )}
            </div>
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-full hover:bg-blue-700 transition-colors">Post</button>
          </form>
        )}

        {/* Comments List */}
        {comments.length > 0 && showComment && (
          <div className="px-6 pb-4">
            {comments.map(com => (
              <div key={com._id} className="flex gap-3 items-start my-2">
                <img src={com.user?.profileImage || dp} alt="" className="w-8 h-8 rounded-full" />
                <div className="bg-gray-100 p-2 rounded-xl flex-1">
                  <div className="text-sm font-semibold">{com.user?.firstName} {com.user?.lastName}</div>
                  <div className="text-sm">{com.content}</div>
                  <div className="text-xs text-gray-400">{com.createdAt ? moment(com.createdAt).fromNow() : ''}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PostErrorBoundary>
  );
}

export default Post;
