import React, { useContext, useEffect, useState, useRef } from 'react'
import dp from "../assets/dp.webp"
import moment from "moment"
import { FaRegCommentDots, FaHeart, FaRegHeart, FaShare, FaRetweet } from "react-icons/fa";
import { BiLike, BiSolidLike, BiDotsHorizontalRounded } from "react-icons/bi";
import { LuSendHorizontal } from "react-icons/lu";
import { BsEmojiSmile } from "react-icons/bs";
import { FiMoreHorizontal, FiTrash2, FiFlag, FiLink, FiMail, FiTwitter, FiFacebook } from "react-icons/fi";
import { HiOutlineEmojiHappy, HiOutlineEmojiSad, HiOutlineThumbUp, HiOutlineHeart, HiOutlineFire } from "react-icons/hi";
import { RiDeleteBinLine, RiShareLine } from "react-icons/ri";
import { MdOutlineShare } from "react-icons/md";
import axios from 'axios';
import { authDataContext } from '../context/AuthContext';
import { userDataContext } from '../context/userContext';
import { io } from "socket.io-client"
import ConnectionButton from './ConnectionButton';

let socket = io("http://localhost:8000");

function Post({ id, author, like, comment, description, image, createdAt, repostOf }) {
  let [more, setMore] = useState(false);
  let { serverUrl } = useContext(authDataContext);
  let { userData, getPost, handleGetProfile } = useContext(userDataContext);
  let [likes, setLikes] = useState(like);
  let [commentContent, setCommentContent] = useState("");
  let [comments, setComments] = useState(comment);
  let [showComment, setShowComment] = useState(false);
  let [showMoreOptions, setShowMoreOptions] = useState(false);
  let [showReactions, setShowReactions] = useState(false);
  let [showShareOptions, setShowShareOptions] = useState(false);
  let [isDeleting, setIsDeleting] = useState(false);
  let [showEmojiPicker, setShowEmojiPicker] = useState(false);
  let moreOptionsRef = useRef(null);
  let shareOptionsRef = useRef(null);

  // Emojis for the comment section
  const emojis = ['👍', '❤️', '😂', '😮', '😢', '🔥', '🎉', '👏', '🥳', '😎'];

  // Reaction types for the like button hover
  const reactions = [
    { type: 'like', icon: HiOutlineThumbUp, color: 'text-blue-500', label: 'Like' },
    { type: 'love', icon: HiOutlineHeart, color: 'text-red-500', label: 'Love' },
    { type: 'haha', icon: HiOutlineEmojiHappy, color: 'text-yellow-500', label: 'Haha' },
    { type: 'sad', icon: HiOutlineEmojiSad, color: 'text-yellow-600', label: 'Sad' },
    { type: 'wow', icon: HiOutlineFire, color: 'text-orange-500', label: 'Wow' }
  ];

  const isAuthor = userData._id === author._id;

  const handleLike = async () => {
    try {
      let result = await axios.get(serverUrl + `/api/post/like/${id}`, { withCredentials: true });
      setLikes(result.data.like);
    } catch (error) {
      console.log(error);
    }
  };

  const handleReaction = async (reactionType) => {
    try {
      let result = await axios.post(serverUrl + `/api/post/reaction/${id}`, {
        reaction: reactionType
      }, { withCredentials: true });
      setLikes(result.data.like);
      setShowReactions(false);
    } catch (error) {
      console.log(error);
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!commentContent.trim()) return;
    
    try {
      let result = await axios.post(serverUrl + `/api/post/comment/${id}`, {
        content: commentContent
      }, { withCredentials: true });
      setComments(result.data.comment);
      setCommentContent("");
    } catch (error) {
      console.log(error);
    }
  };
  
  const handleAddEmoji = (emoji) => {
    setCommentContent(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const handleDeletePost = async () => {
    setIsDeleting(true);
    try {
      await axios.delete(serverUrl + `/api/post/delete/${id}`, { withCredentials: true });
      getPost(); // Refresh the posts
    } catch (error) {
      console.log(error);
    } finally {
      setIsDeleting(false);
      setShowMoreOptions(false);
    }
  };

  const handleRepost = async () => {
    try {
      await axios.post(serverUrl + `/api/post/repost/${id}`, {}, { withCredentials: true });
      getPost(); // Refresh the posts
    } catch (error) {
      console.log(error);
    }
  };

  const handleShare = (platform) => {
    const postUrl = `${window.location.origin}/post/${id}`;
    const shareText = description.slice(0, 100) + (description.length > 100 ? '...' : '');
    
    switch (platform) {
      case 'copy':
        navigator.clipboard.writeText(postUrl);
        alert('Link copied to clipboard!');
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(postUrl)}`, '_blank');
        break;
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postUrl)}`, '_blank');
        break;
      case 'email':
        window.open(`mailto:?subject=Check out this post&body=${encodeURIComponent(shareText + '\n\n' + postUrl)}`, '_blank');
        break;
      default:
        break;
    }
    setShowShareOptions(false);
  };

  useEffect(() => {
    socket.on("likeUpdated", ({ postId, likes }) => {
      if (postId === id) setLikes(likes);
    });
    socket.on("commentAdded", ({ postId, comm }) => {
      if (postId === id) setComments(comm);
    });

    return () => {
      socket.off("likeUpdated");
      socket.off("commentAdded");
    };
  }, [id]);

  useEffect(() => {
    getPost();
  }, [likes, comments]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (moreOptionsRef.current && !moreOptionsRef.current.contains(event.target)) {
        setShowMoreOptions(false);
      }
      if (shareOptionsRef.current && !shareOptionsRef.current.contains(event.target)) {
        setShowShareOptions(false);
      }
      // You may need to add refs for other dropdowns
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="w-full bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100">

      {/* Header */}
      <div className='flex justify-between items-start p-6 pb-4'>
        <div
          className='flex gap-4 items-start cursor-pointer group'
          onClick={() => handleGetProfile(author.userName)}
        >
          <div className='w-12 h-12 rounded-full overflow-hidden border-2 border-gray-200 group-hover:border-blue-300 transition-colors shadow-sm'>
            <img src={author.profileImage || dp} alt="" className='h-full w-full object-cover' />
          </div>
          <div className="flex-1">
            <div className='text-base font-semibold hover:text-blue-600 transition-colors group-hover:text-blue-600'>
              {`${author.firstName} ${author.lastName}`}
            </div>
            <div className='text-sm text-gray-600 mb-1'>{author.headline}</div>
            <div className='text-xs text-gray-500 flex items-center gap-2'>
              {moment(createdAt).fromNow()}
              <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
              <span>🌐 Public</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isAuthor && <ConnectionButton userId={author._id} />}
          
          {/* More Options Menu */}
          <div className="relative" ref={moreOptionsRef}>
            <button
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                setShowMoreOptions(!showMoreOptions);
              }}
            >
              <BiDotsHorizontalRounded className="w-5 h-5 text-gray-600" />
            </button>

            {showMoreOptions && (
              <div className="absolute right-0 top-full mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 py-2 w-48 z-50">
                {isAuthor ? (
                  <>
                    <button
                      className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 text-red-600"
                      onClick={handleDeletePost}
                    >
                      <FiTrash2 className="w-4 h-4" />
                      Delete post
                    </button>
                  </>
                ) : (
                  <>
                    <button className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 text-gray-700">
                      <FiFlag className="w-4 h-4" />
                      Report post
                    </button>
                  </>
                )}
                <button
                  className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 text-gray-700"
                  onClick={() => handleShare('copy')}
                >
                  <FiLink className="w-4 h-4" />
                  Copy link
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Post Content */}
      <div className="px-6 pb-4">
        <div className={`text-gray-800 leading-relaxed ${!more && description.length > 300 ? "max-h-20 overflow-hidden" : ""}`}>
          {description}
        </div>
        {description.length > 300 && (
          <button
            className="text-blue-600 hover:text-blue-700 text-sm font-medium mt-2 hover:underline"
            onClick={() => setMore(prev => !prev)}
          >
            {more ? "Show less" : "Show more"}
          </button>
        )}
      </div>

      {/* Image */}
      {image && (
        <div className='w-full max-h-96 overflow-hidden bg-gray-100'>
          <img 
            src={image} 
            alt="" 
            className='w-full h-full object-cover hover:scale-105 transition-transform duration-500 cursor-pointer' 
          />
        </div>
      )}

      {/* Engagement Stats */}
      <div className='flex justify-between items-center px-6 py-3 border-t border-gray-100'>
        <div className='flex items-center gap-2 text-gray-600 text-sm'>
          <div className="flex -space-x-1">
            <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center border-2 border-white">
              <BiLike className='text-white w-3 h-3' />
            </div>
            <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center border-2 border-white">
              <FaHeart className='text-white w-2.5 h-2.5' />
            </div>
          </div>
          <span className="hover:underline cursor-pointer">{likes.length} reactions</span>
        </div>
        <div className='flex items-center gap-4 text-gray-600 text-sm'>
          <button
            className='hover:text-blue-600 hover:underline cursor-pointer transition-colors'
            onClick={() => setShowComment(prev => !prev)}
          >
            {comments.length} comments
          </button>
          <span className="hover:underline cursor-pointer">12 shares</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className='flex justify-around items-center px-6 py-3 border-t border-gray-100 bg-gray-50'>
        {/* Like/Reaction Button */}
        <div className="relative">
          {!likes.includes(userData._id) ? (
            <button
              className='flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-blue-50 text-gray-700 hover:text-blue-600 transition-all duration-200 font-medium group'
              onClick={handleLike}
              onMouseEnter={() => setShowReactions(true)}
              onMouseLeave={() => setTimeout(() => setShowReactions(false), 300)}
            >
              <BiLike className='w-5 h-5 group-hover:scale-110 transition-transform' />
              <span>Like</span>
            </button>
          ) : (
            <button
              className='flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-50 text-blue-600 font-semibold transition-all duration-200'
              onClick={handleLike}
              onMouseEnter={() => setShowReactions(true)}
              onMouseLeave={() => setTimeout(() => setShowReactions(false), 300)}
            >
              <BiSolidLike className='w-5 h-5 animate-pulse' />
              <span>Liked</span>
            </button>
          )}

          {/* Reactions Popup */}
          {showReactions && (
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-white rounded-full shadow-2xl border border-gray-200 px-2 py-1 flex gap-1 z-50"
                  onMouseEnter={() => setShowReactions(true)}
                  onMouseLeave={() => setShowReactions(false)}
            >
              {reactions.map((reaction) => (
                <button
                  key={reaction.type}
                  className={`p-2 rounded-full hover:bg-gray-100 hover:scale-125 transition-all duration-200 ${reaction.color}`}
                  onClick={() => handleReaction(reaction.type)}
                  title={reaction.label}
                >
                  <reaction.icon className="w-6 h-6" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Comment Button */}
        <button
          className='flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-green-50 text-gray-700 hover:text-green-600 transition-all duration-200 font-medium group'
          onClick={() => setShowComment(prev => !prev)}
        >
          <FaRegCommentDots className='w-5 h-5 group-hover:scale-110 transition-transform' />
          <span>Comment</span>
        </button>

        {/* Repost Button */}
        <button
          className='flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-green-50 text-gray-700 hover:text-green-600 transition-all duration-200 font-medium group'
          onClick={handleRepost}
        >
          <FaRetweet className='w-5 h-5 group-hover:scale-110 transition-transform' />
          <span>Repost</span>
        </button>

        {/* Share Button */}
        <div className="relative" ref={shareOptionsRef}>
          <button
            className='flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-purple-50 text-gray-700 hover:text-purple-600 transition-all duration-200 font-medium group'
            onClick={(e) => {
              e.stopPropagation();
              setShowShareOptions(!showShareOptions);
            }}
          >
            <MdOutlineShare className='w-5 h-5 group-hover:scale-110 transition-transform' />
            <span>Share</span>
          </button>

          {/* Share Options */}
          {showShareOptions && (
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-white rounded-xl shadow-2xl border border-gray-200 py-2 w-48 z-50">
              <button
                className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 text-gray-700"
                onClick={() => handleShare('copy')}
              >
                <FiLink className="w-4 h-4" />
                Copy link
              </button>
              <button
                className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 text-blue-500"
                onClick={() => handleShare('twitter')}
              >
                <FiTwitter className="w-4 h-4" />
                Share on Twitter
              </button>
              <button
                className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 text-blue-600"
                onClick={() => handleShare('facebook')}
              >
                <FiFacebook className="w-4 h-4" />
                Share on Facebook
              </button>
              <button
                className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 text-gray-600"
                onClick={() => handleShare('email')}
              >
                <FiMail className="w-4 h-4" />
                Send via email
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Comments Section */}
      {showComment && (
        <div className='px-6 pb-6 bg-gray-50 border-t border-gray-100'>
          {/* Comment Input */}
          <div className="pt-4 relative">
            <form
              className="flex items-center gap-3 bg-white rounded-full px-4 py-2 shadow-sm border border-gray-200 focus-within:border-blue-300 transition-colors"
              onSubmit={handleComment}
            >
              <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-200">
                <img
                  src={userData.profileImage || dp}
                  alt="Your avatar"
                  className="w-full h-full object-cover"
                />
              </div>
              <input
                type="text"
                placeholder="Write a comment..."
                className='flex-1 outline-none border-none text-sm bg-transparent'
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
              />
              <button 
                type="button"
                className="text-gray-400 hover:text-yellow-500 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowEmojiPicker(prev => !prev);
                }}
              >
                <BsEmojiSmile className="w-4 h-4" />
              </button>
              <button 
                type="submit"
                disabled={!commentContent.trim()}
                className={`${commentContent.trim() ? 'text-blue-600 hover:text-blue-700' : 'text-gray-300'} transition-colors`}
              >
                <LuSendHorizontal className="w-4 h-4" />
              </button>
            </form>
            
            {/* Emoji Picker */}
            {showEmojiPicker && (
              <div 
                className="absolute top-12 left-12 mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 p-2 flex gap-1 z-50"
                onClick={(e) => e.stopPropagation()}
              >
                {emojis.map((emoji, index) => (
                  <button
                    key={index}
                    type="button"
                    className="p-2 text-xl rounded-full hover:bg-gray-100 hover:scale-110 transition-all duration-200"
                    onClick={() => handleAddEmoji(emoji)}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Comments List */}
          {comments.length > 0 && (
            <div className='mt-4 space-y-3 max-h-80 overflow-y-auto'>
              {comments.map((com) => (
                <div key={com._id} className='flex gap-3 bg-white rounded-xl p-3 shadow-sm'>
                  <div 
                    className='w-8 h-8 rounded-full overflow-hidden border border-gray-200 cursor-pointer hover:border-blue-300 transition-colors flex-shrink-0'
                    onClick={() => handleGetProfile(com.user.userName)}
                  >
                    <img src={com.user.profileImage || dp} alt="" className='h-full w-full object-cover' />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="bg-gray-100 rounded-2xl px-4 py-2">
                      <div 
                        className='text-sm font-semibold text-gray-900 hover:text-blue-600 cursor-pointer transition-colors'
                        onClick={() => handleGetProfile(com.user.userName)}
                      >
                        {`${com.user.firstName} ${com.user.lastName}`}
                      </div>
                      <div className='text-sm text-gray-700 mt-1 break-words'>{com.content}</div>
                    </div>
                    <div className="flex items-center gap-4 mt-2 px-2">
                      <button className="text-xs text-gray-500 hover:text-blue-600 font-medium">Like</button>
                      <button className="text-xs text-gray-500 hover:text-blue-600 font-medium">Reply</button>
                      <span className="text-xs text-gray-400">{moment(com.createdAt).fromNow()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Post;