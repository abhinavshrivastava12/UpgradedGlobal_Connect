import React, { useState, useEffect, useRef, useContext } from 'react';
import dp from "../assets/dp.webp";
import moment from "moment";
import { BiLike, BiSolidLike, BiDotsHorizontalRounded } from "react-icons/bi";
import { FaRegCommentDots, FaRetweet } from "react-icons/fa";
import { BsEmojiSmile } from "react-icons/bs";
import { FiTrash2, FiEdit2, FiLink } from "react-icons/fi";
import { MdOutlineShare } from "react-icons/md";
import axios from 'axios';
import { userDataContext } from '../context/UserContext';
import io from "socket.io-client";
import ConnectionButton from './ConnectionButton';

const socket = io();

function Post({ id, author, like = [], comment = [], description = "", image, createdAt }) {
  const [more, setMore] = useState(false);
  const { userData, getPost, handleGetProfile } = useContext(userDataContext);
  const [likes, setLikes] = useState(Array.isArray(like) ? like : []);
  const [comments, setComments] = useState(Array.isArray(comment) ? comment : []);
  const [commentContent, setCommentContent] = useState("");
  const [showComment, setShowComment] = useState(false);
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedDescription, setEditedDescription] = useState(description);

  const moreOptionsRef = useRef(null);
  const shareOptionsRef = useRef(null);

  const emojis = ['👍', '❤️', '😂', '😮', '😢', '🔥', '🎉', '👏'];
  const isAuthor = userData?._id === author?._id;
  const token = localStorage.getItem('token');

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

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (moreOptionsRef.current && !moreOptionsRef.current.contains(e.target)) setShowMoreOptions(false);
      if (shareOptionsRef.current && !shareOptionsRef.current.contains(e.target)) setShowShareOptions(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLike = async () => {
    try {
      await axios.get(`/api/post/like/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` },
        withCredentials: true
      });
    } catch (error) {
      console.error("Like error:", error);
      alert("Failed to like post");
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!commentContent.trim()) return;
    try {
      await axios.post(`/api/post/comment/${id}`, 
        { content: commentContent },
        {
          headers: { 'Authorization': `Bearer ${token}` },
          withCredentials: true
        }
      );
      setCommentContent("");
    } catch (error) {
      console.error("Comment error:", error);
      alert("Failed to add comment");
    }
  };

  const handleAddEmoji = (emoji) => { 
    setCommentContent(prev => prev + emoji); 
    setShowEmojiPicker(false); 
  };

  const handleDeletePost = async () => {
    if (!isAuthor) return;
    if (!window.confirm("Delete this post?")) return;
    
    setIsDeleting(true);
    try {
      await axios.delete(`/api/post/delete/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` },
        withCredentials: true
      });
      getPost();
    } catch (error) {
      console.error("Delete error:", error);
      alert("Failed to delete");
    } finally {
      setIsDeleting(false);
      setShowMoreOptions(false);
    }
  };

  const handleRepost = async () => {
    try {
      await axios.post(`/api/post/repost/${id}`, {}, {
        headers: { 'Authorization': `Bearer ${token}` },
        withCredentials: true
      });
      getPost();
    } catch (error) {
      console.error("Repost error:", error);
      alert(error.response?.data?.message || "Failed to repost");
    }
  };

  const handleShare = (platform) => {
    const postUrl = `${window.location.origin}/post/${id}`;
    const shareText = description?.slice(0, 100);
    switch (platform) {
      case 'copy': 
        navigator.clipboard.writeText(postUrl); 
        alert('Link copied!'); 
        break;
      case 'twitter': 
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(postUrl)}`, '_blank'); 
        break;
      case 'facebook': 
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postUrl)}`, '_blank'); 
        break;
      default: 
        break;
    }
    setShowShareOptions(false);
  };

  return (
    <div className="w-full bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-slate-700">
      
      {/* Header */}
      <div className='flex justify-between items-start p-6 pb-4 bg-slate-800/50'>
        <div className='flex gap-4 items-start cursor-pointer group' onClick={() => handleGetProfile(author?.userName)}>
          <div className='w-12 h-12 rounded-full overflow-hidden border-2 border-purple-500 group-hover:border-purple-400 transition-colors shadow-sm'>
            <img src={author?.profileImage || dp} alt="" className='h-full w-full object-cover' />
          </div>
          <div className="flex-1">
            <div className='text-base font-semibold text-white hover:text-purple-400 transition-colors'>
              {author?.firstName} {author?.lastName}
            </div>
            <div className='text-sm text-gray-300 mb-1'>{author?.headline}</div>
            <div className='text-xs text-gray-400 flex items-center gap-2'>
              {createdAt ? moment(createdAt).fromNow() : ''}
              <span className="w-1 h-1 bg-gray-500 rounded-full"></span>
              <span>🌐 Public</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isAuthor && <ConnectionButton userId={author?._id} />}
          <div className="relative" ref={moreOptionsRef}>
            <button className="p-2 rounded-full hover:bg-slate-700 transition-colors"
                    onClick={e => { e.stopPropagation(); setShowMoreOptions(!showMoreOptions); }}>
              <BiDotsHorizontalRounded className="w-5 h-5 text-gray-300" />
            </button>
            {showMoreOptions && (
              <div className="absolute right-0 top-full mt-2 bg-slate-800 rounded-xl shadow-2xl border border-slate-700 py-2 w-48 z-50">
                {isAuthor ? (
                  <>
                    <button className="w-full px-4 py-2 text-left hover:bg-slate-700 flex items-center gap-3 text-purple-400" 
                            onClick={() => { setIsEditing(!isEditing); setShowMoreOptions(false); }}>
                      <FiEdit2 className="w-4 h-4" /> Edit post
                    </button>
                    <button className="w-full px-4 py-2 text-left hover:bg-slate-700 flex items-center gap-3 text-red-400" 
                            onClick={handleDeletePost} disabled={isDeleting}>
                      <FiTrash2 className="w-4 h-4" /> Delete post
                    </button>
                  </>
                ) : (
                  <button className="w-full px-4 py-2 text-left hover:bg-slate-700 flex items-center gap-3 text-gray-300" 
                          onClick={() => handleShare('copy')}>
                    <FiLink className="w-4 h-4" /> Copy link
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 pb-4">
        {isEditing ? (
          <textarea
            className="w-full p-3 bg-slate-700 text-white rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
            value={editedDescription}
            onChange={(e) => setEditedDescription(e.target.value)}
            rows={3}
          />
        ) : (
          <div className={`text-gray-200 leading-relaxed ${!more && description?.length > 300 ? "max-h-20 overflow-hidden" : ""}`}>
            {description}
          </div>
        )}
        {description && description.length > 300 && !isEditing && (
          <button className="text-purple-400 hover:text-purple-300 text-sm font-medium mt-2 hover:underline"
                  onClick={() => setMore(!more)}>
            {more ? "Show less" : "Show more"}
          </button>
        )}
      </div>

      {/* Image */}
      {image && (
        <div className="w-full max-h-96 overflow-hidden bg-slate-900">
          <img src={image} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500 cursor-pointer" />
        </div>
      )}

      {/* Stats */}
      <div className="flex justify-between items-center px-6 py-3 border-t border-slate-700 bg-slate-800/30">
        <div className="flex items-center gap-2 text-gray-300 text-sm">
          <div className="flex -space-x-1">
            <div className="w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center border-2 border-slate-800">
              <BiLike className="text-white w-3 h-3" />
            </div>
          </div>
          <span className="hover:underline cursor-pointer">{likes.length}</span>
        </div>
        <div className="flex items-center gap-4 text-gray-300 text-sm">
          <button className="hover:text-purple-400 hover:underline cursor-pointer transition-colors"
                  onClick={() => setShowComment(!showComment)}>
            {comments.length} comments
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-around items-center px-6 py-3 border-t border-slate-700 bg-slate-800/50">
        {!likes.includes(userData?._id) ? (
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-purple-500/20 text-gray-200 hover:text-purple-400 font-medium group"
                  onClick={handleLike}>
            <BiLike className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span>Like</span>
          </button>
        ) : (
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-500/20 text-purple-400 font-semibold"
                  onClick={handleLike}>
            <BiSolidLike className="w-5 h-5 animate-pulse" />
            <span>Liked</span>
          </button>
        )}

        <button className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-green-500/20 text-gray-200 hover:text-green-400 font-medium group"
                onClick={() => setShowComment(!showComment)}>
          <FaRegCommentDots className="w-5 h-5 group-hover:scale-110 transition-transform" />
          <span>Comment</span>
        </button>

        <button className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-pink-500/20 text-gray-200 hover:text-pink-400 font-medium group"
                onClick={handleRepost}>
          <FaRetweet className="w-5 h-5 group-hover:scale-110 transition-transform" />
          <span>Repost</span>
        </button>

        <div className="relative" ref={shareOptionsRef}>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-yellow-500/20 text-gray-200 hover:text-yellow-400 font-medium group"
                  onClick={() => setShowShareOptions(!showShareOptions)}>
            <MdOutlineShare className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span>Share</span>
          </button>
          {showShareOptions && (
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-slate-800 rounded-xl shadow-2xl border border-slate-700 py-2 w-48 z-50">
              <button onClick={() => handleShare('copy')} className="w-full px-4 py-2 hover:bg-slate-700 flex items-center gap-3 text-gray-300">Copy Link</button>
              <button onClick={() => handleShare('twitter')} className="w-full px-4 py-2 hover:bg-slate-700 flex items-center gap-3 text-blue-400">Twitter</button>
              <button onClick={() => handleShare('facebook')} className="w-full px-4 py-2 hover:bg-slate-700 flex items-center gap-3 text-blue-600">Facebook</button>
            </div>
          )}
        </div>
      </div>

      {/* Comment Input */}
      {showComment && (
        <form onSubmit={handleComment} className="flex gap-2 items-center px-6 py-3 border-t border-slate-700 bg-slate-800/30">
          <img src={userData?.profileImage || dp} alt="" className="w-10 h-10 rounded-full" />
          <div className="flex-1 relative">
            <input type="text" placeholder="Write a comment..." value={commentContent} 
                   onChange={e => setCommentContent(e.target.value)}
                   className="w-full border border-slate-600 bg-slate-700 text-white rounded-full py-2 px-4 pl-10 focus:outline-none focus:ring-1 focus:ring-purple-500" />
            <button type="button" onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="absolute left-2 top-2 text-gray-400 hover:text-yellow-400">
              <BsEmojiSmile />
            </button>
            {showEmojiPicker && (
              <div className="absolute bottom-full left-0 mb-2 flex flex-wrap gap-1 bg-slate-800 border border-slate-700 rounded-lg p-2 shadow-xl z-50">
                {emojis.map(e => <button key={e} type="button" onClick={() => handleAddEmoji(e)} className="p-1 hover:bg-slate-700 rounded">{e}</button>)}
              </div>
            )}
          </div>
          <button type="submit" className="bg-purple-600 text-white px-4 py-2 rounded-full hover:bg-purple-700 transition-colors">Post</button>
        </form>
      )}

      {/* Comments List */}
      {comments.length > 0 && showComment && (
        <div className="px-6 pb-4 bg-slate-800/20">
          {comments.map((com, idx) => (
            <div key={idx} className="flex gap-3 items-start my-2">
              <img src={com.user?.profileImage || dp} alt="" className="w-8 h-8 rounded-full" />
              <div className="bg-slate-700 p-2 rounded-xl flex-1">
                <div className="text-sm font-semibold text-white">{com.user?.firstName} {com.user?.lastName}</div>
                <div className="text-sm text-gray-300">{com.content}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Post;