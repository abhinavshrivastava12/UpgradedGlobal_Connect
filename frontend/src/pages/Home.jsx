import React, { useContext, useEffect, useRef, useState } from "react";
import dp from "../assets/dp.webp";
import { FiPlus, FiCamera, FiSun, FiMoon, FiTrendingUp, FiHeart, FiMessageCircle, FiShare2 } from "react-icons/fi";
import { userDataContext } from "../context/userContext";
import EditProfile from "../components/EditProfile";
import { RxCross1 } from "react-icons/rx";
import { BsImage, BsEmojiSmile, BsBookmark } from "react-icons/bs";
import { BiPoll } from "react-icons/bi";
import { MdVerified } from "react-icons/md";
import { IoSparklesSharp } from "react-icons/io5";
import axios from "axios";
import { authDataContext } from "../context/AuthContext";
import Post from "../components/Post";
import AIChat from "../components/AIChat";

// Mock celebrity data for suggested users
const celebritySuggestions = [
  {
    firstName: "Elon",
    lastName: "Musk",
    userName: "elonmusk",
    headline: "CEO of Tesla & SpaceX • Visionary Entrepreneur",
    profileImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
    verified: true,
    followers: "150M"
  },
  {
    firstName: "Oprah",
    lastName: "Winfrey",
    userName: "oprah",
    headline: "Media Mogul • Philanthropist • Author",
    profileImage: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face",
    verified: true,
    followers: "45M"
  },
  {
    firstName: "Bill",
    lastName: "Gates",
    userName: "billgates",
    headline: "Co-founder Microsoft • Philanthropist",
    profileImage: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
    verified: true,
    followers: "60M"
  },
  {
    firstName: "Michelle",
    lastName: "Obama",
    userName: "michelleobama",
    headline: "Former First Lady • Author • Advocate",
    profileImage: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face",
    verified: true,
    followers: "52M"
  },
  {
    firstName: "Tim",
    lastName: "Cook",
    userName: "timcook",
    headline: "CEO of Apple • Technology Leader",
    profileImage: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face",
    verified: true,
    followers: "15M"
  }
];

function Home() {
  const { userData, edit, setEdit, postData, getPost, handleGetProfile } =
    useContext(userDataContext);
  const { serverUrl } = useContext(authDataContext);

  const [frontendImage, setFrontendImage] = useState("");
  const [backendImage, setBackendImage] = useState("");
  const [description, setDescription] = useState("");
  const [uploadPost, setUploadPost] = useState(false);
  const [posting, setPosting] = useState(false);
  const [suggestedUser, setSuggestedUser] = useState([]);
  const [darkMode, setDarkMode] = useState(false);
  const [showTrending, setShowTrending] = useState(false);
  const [postType, setPostType] = useState('text'); // text, poll, image
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [likedPosts, setLikedPosts] = useState(new Set());
  const [userStats, setUserStats] = useState({
    followers: 0,
    following: 0,
    posts: 0
  });

  const image = useRef();

  const handleImage = (e) => {
    const file = e.target.files[0];
    setBackendImage(file);
    setFrontendImage(URL.createObjectURL(file));
    setPostType('image');
  };

  const handleUploadPost = async () => {
    setPosting(true);
    try {
      const formdata = new FormData();
      formdata.append("description", description);
      if (backendImage) formdata.append("image", backendImage);
      if (postType === 'poll') {
        formdata.append("pollOptions", JSON.stringify(pollOptions.filter(opt => opt.trim())));
      }
      formdata.append("postType", postType);
      
      await axios.post(serverUrl + "/api/post/create", formdata, {
        withCredentials: true,
      });
      
      setPosting(false);
      setUploadPost(false);
      setDescription("");
      setFrontendImage("");
      setBackendImage("");
      setPostType('text');
      setPollOptions(['', '']);
      getPost();
      fetchUserStats(); // Refresh stats after new post
    } catch (error) {
      setPosting(false);
      console.log(error);
    }
  };

  const handleSuggestedUsers = async () => {
    try {
      const result = await axios.get(serverUrl + "/api/user/suggestedusers", {
        withCredentials: true,
      });
      // Mix real users with celebrities
      const mixedSuggestions = [...celebritySuggestions.slice(0, 3), ...result.data.slice(0, 2)];
      setSuggestedUser(mixedSuggestions);
    } catch (error) {
      console.log(error);
      // Fallback to celebrities only
      setSuggestedUser(celebritySuggestions.slice(0, 5));
    }
  };

  // Fetch real user statistics
  const fetchUserStats = async () => {
    try {
      const response = await axios.get(serverUrl + "/api/user/stats", {
        withCredentials: true,
      });
      setUserStats(response.data);
    } catch (error) {
      console.log("Error fetching user stats:", error);
      // Keep default values if API fails
    }
  };

  const addPollOption = () => {
    if (pollOptions.length < 4) {
      setPollOptions([...pollOptions, '']);
    }
  };

  const updatePollOption = (index, value) => {
    const newOptions = [...pollOptions];
    newOptions[index] = value;
    setPollOptions(newOptions);
  };

  const removePollOption = (index) => {
    if (pollOptions.length > 2) {
      const newOptions = pollOptions.filter((_, i) => i !== index);
      setPollOptions(newOptions);
    }
  };

  const toggleLike = async (postId) => {
    try {
      await axios.post(serverUrl + `/api/post/like/${postId}`, {}, {
        withCredentials: true,
      });
      // Update local state
      const newLikedPosts = new Set(likedPosts);
      if (newLikedPosts.has(postId)) {
        newLikedPosts.delete(postId);
      } else {
        newLikedPosts.add(postId);
      }
      setLikedPosts(newLikedPosts);
      // Refresh posts to get updated counts
      getPost();
    } catch (error) {
      console.log("Error toggling like:", error);
    }
  };

  useEffect(() => {
    handleSuggestedUsers();
    fetchUserStats();
  }, []);

  useEffect(() => {
    getPost();
  }, [uploadPost]);

  const themeClasses = darkMode
    ? "bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white"
    : "bg-gradient-to-br from-[#1A1F71] to-[#2C2C2C] text-white";

  const cardClasses = darkMode
    ? "bg-gray-800 border border-gray-700"
    : "bg-gradient-to-r from-[#1A1F71] to-[#d19a9a]";

  const secondaryCardClasses = darkMode
    ? "bg-gray-900 border border-gray-700"
    : "bg-[#2C2C2C]";

  return (
    // Updated parent container for overall page scrolling
    <div className={`w-full h-screen ${themeClasses} flex flex-col lg:flex-row p-5 gap-5 relative transition-all duration-500 overflow-y-auto custom-scrollbar`}>
      {edit && <EditProfile />}

      {/* Dark Mode Toggle */}
      <div className="fixed top-5 right-5 z-30">
        <button
          onClick={() => setDarkMode(!darkMode)}
          className={`p-3 rounded-full ${darkMode ? 'bg-yellow-500 text-gray-900' : 'bg-gray-800 text-yellow-500'}
            hover:scale-110 transform transition-all duration-300 shadow-lg hover:shadow-xl`}
        >
          {darkMode ? <FiSun size={20} /> : <FiMoon size={20} />}
        </button>
      </div>

      {/* Left Sidebar - Added overflow-y-auto to this container */}
      <div className="w-full lg:w-[25%] flex flex-col gap-5 mt-[90px] overflow-y-auto custom-scrollbar">
        {/* Profile Card with Enhanced Animation */}
        <div className={`${cardClasses} rounded-2xl p-6 shadow-2xl flex flex-col items-center relative
          hover:scale-105 transform transition-all duration-500 hover:shadow-3xl group`}>
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          <div
            className="relative w-[100px] h-[100px] rounded-full overflow-hidden border-4 border-[#FFD700] cursor-pointer
              hover:border-purple-500 transition-all duration-300 hover:scale-110 transform group"
            onClick={() => setEdit(true)}
          >
            <img
              src={userData.profileImage || dp}
              alt="Profile"
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
              <FiCamera className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" size={24} />
            </div>
          </div>
          
          <h2 className="mt-4 font-bold text-xl bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            {`${userData.firstName} ${userData.lastName}`}
          </h2>
          <p className="text-sm text-gray-300 text-center mt-1">{userData.headline}</p>
          
          {/* Real Stats */}
          <div className="flex gap-6 mt-4">
            <div className="text-center">
              <div className="font-bold text-lg text-[#FFD700]">{userStats.followers}</div>
              <div className="text-xs text-gray-400">Followers</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-lg text-[#FFD700]">{userStats.following}</div>
              <div className="text-xs text-gray-400">Following</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-lg text-[#FFD700]">{userStats.posts}</div>
              <div className="text-xs text-gray-400">Posts</div>
            </div>
          </div>
          
          <button
            className="mt-4 px-6 py-2 bg-gradient-to-r from-[#FFD700] to-[#FFCC00] text-[#1A1F71] font-semibold rounded-full
              shadow-lg hover:shadow-xl hover:scale-105 transform transition-all duration-300 flex items-center gap-2"
            onClick={() => setEdit(true)}
          >
            <IoSparklesSharp size={16} />
            Edit Profile
          </button>
        </div>

        {/* Trending Topics */}
        <div className={`${secondaryCardClasses} rounded-2xl p-5 shadow-lg hover:shadow-xl transition-shadow duration-300`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <FiTrendingUp className="text-[#FFD700]" />
              Trending
            </h3>
            <button
              onClick={() => setShowTrending(!showTrending)}
              className="text-[#FFD700] hover:text-yellow-400 transition-colors"
            >
              {showTrending ? 'Hide' : 'Show'}
            </button>
          </div>
          
          {showTrending && (
            <div className="space-y-3 animate-fadeIn">
              {['#ReactJS', '#WebDevelopment', '#AI', '#TechTrends', '#Innovation'].map((tag, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded-lg hover:bg-[#1A1F71] cursor-pointer transition-colors">
                  <span className="text-[#FFD700] font-medium">{tag}</span>
                </div>
              ))}
            </div>
          )}
        </div>

{/* Enhanced Suggested Users */}
<div className={`${secondaryCardClasses} rounded-2xl p-5 shadow-lg hover:shadow-xl transition-shadow duration-300`}>
  <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
    <IoSparklesSharp className="text-[#FFD700]" />
    Suggested Personalities
  </h3>
  {/* Main scrollable area for suggested users */}
  <div className="flex flex-col gap-3 max-h-[500px] overflow-y-auto custom-scrollbar">
    {suggestedUser.length > 0 ? (
      suggestedUser.map((su, i) => (
        <div
          key={i}
          className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#1A1F71] cursor-pointer
            transition-all duration-300 hover:scale-102 hover:shadow-md group"
          onClick={() => su.userName && handleGetProfile(su.userName)}
        >
          <div className="relative w-[55px] h-[55px] rounded-full overflow-hidden border-2 border-[#FFD700] group-hover:border-purple-500 transition-colors">
            {/* Added a check for profileImage to prevent broken image icons */}
            <img
              src={su.profileImage || dp}
              alt="User"
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            />
            {su.verified && (
              <MdVerified className="absolute -bottom-1 -right-1 bg-blue-500 text-white rounded-full p-0.5" size={18} />
            )}
          </div>
          <div className="flex flex-col flex-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold group-hover:text-[#FFD700] transition-colors">
                {/* Fallback to username if first and last name are not available */}
                {su.firstName && su.lastName ? `${su.firstName} ${su.lastName}` : su.userName || 'New User'}
              </span>
              {su.verified && <MdVerified className="text-blue-500" size={16} />}
            </div>
            <span className="text-xs text-gray-300 line-clamp-1">{su.headline || 'No headline available'}</span>
            {su.followers && (
              <span className="text-xs text-[#FFD700] mt-1">{su.followers} followers</span>
            )}
          </div>
          <button className="opacity-0 group-hover:opacity-100 px-3 py-1 bg-[#FFD700] text-[#1A1F71]
            rounded-full text-xs font-medium hover:bg-yellow-400 transition-all duration-300">
            Follow
          </button>
        </div>
      ))
    ) : (
      <p className="text-gray-400">No suggestions</p>
    )}
  </div>
</div>
      </div>

      {/* Center Feed - Added overflow-y-auto to this container */}
      <div className="w-full lg:w-[50%] flex flex-col gap-5 mt-[90px] overflow-y-auto custom-scrollbar">
        {/* Enhanced Post Creation Button */}
        <div className={`${secondaryCardClasses} rounded-2xl p-4 shadow-lg`}>
          <button
            className="w-full py-4 bg-gradient-to-r from-[#FFD700] via-[#FFCC00] to-[#FFB700] text-[#1A1F71]
              font-bold rounded-xl shadow-lg flex items-center justify-center gap-3
              hover:scale-105 transform transition-all duration-300 hover:shadow-2xl group relative overflow-hidden"
            onClick={() => setUploadPost(true)}
          >
            <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-12" />
            <FiPlus size={24} className="group-hover:rotate-180 transition-transform duration-300" />
            <span className="text-lg">What's on your mind?</span>
          </button>
          
          {/* Quick Action Buttons */}
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => { setUploadPost(true); setPostType('image'); }}
              className="flex-1 py-2 px-3 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg text-blue-400
                hover:text-blue-300 transition-all duration-300 flex items-center justify-center gap-2 text-sm"
            >
              <BsImage size={16} /> Photo
            </button>
            <button
              onClick={() => { setUploadPost(true); setPostType('poll'); }}
              className="flex-1 py-2 px-3 bg-green-500/20 hover:bg-green-500/30 rounded-lg text-green-400
                hover:text-green-300 transition-all duration-300 flex items-center justify-center gap-2 text-sm"
            >
              <BiPoll size={16} /> Poll
            </button>
            <button
              className="flex-1 py-2 px-3 bg-purple-500/20 hover:bg-purple-500/30 rounded-lg text-purple-400
                hover:text-purple-300 transition-all duration-300 flex items-center justify-center gap-2 text-sm"
            >
              <BsEmojiSmile size={16} /> Feeling
            </button>
          </div>
        </div>

        {/* Enhanced Posts */}
        <div className="space-y-4">
          {postData.map((post, index) => (
            <div key={index} className={`${secondaryCardClasses} rounded-2xl p-6 shadow-lg
              hover:shadow-xl transition-all duration-300 hover:scale-[1.02] group`}>
              <Post {...post} />
              
              {/* Real Interaction Buttons with actual counts from post data */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-600">
                <button
                  onClick={() => toggleLike(post._id || post.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300
                    ${post.isLiked || likedPosts.has(post._id || post.id)
                      ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                      : 'hover:bg-gray-700 text-gray-400 hover:text-red-400'}`}
                >
                  <FiHeart className={post.isLiked || likedPosts.has(post._id || post.id) ? 'fill-current' : ''} size={18} />
                  <span className="text-sm">{post.likes?.length || 0}</span>
                </button>
                
                <button className="flex items-center gap-2 px-4 py-2 rounded-full hover:bg-gray-700
                  text-gray-400 hover:text-blue-400 transition-all duration-300">
                  <FiMessageCircle size={18} />
                  <span className="text-sm">{post.comments?.length || 0}</span>
                </button>
                
                <button className="flex items-center gap-2 px-4 py-2 rounded-full hover:bg-gray-700
                  text-gray-400 hover:text-green-400 transition-all duration-300">
                  <FiShare2 size={18} />
                  <span className="text-sm">{post.shares?.length || 0}</span>
                </button>
                
                <button className="flex items-center gap-2 px-4 py-2 rounded-full hover:bg-gray-700
                  text-gray-400 hover:text-yellow-400 transition-all duration-300">
                  <BsBookmark size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <AIChat/>

      {/* Enhanced Post Modal */}
      {uploadPost && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-40 animate-fadeIn"
            onClick={() => setUploadPost(false)}
          />
          <div className={`fixed top-1/2 left-1/2 w-[95%] max-w-2xl ${secondaryCardClasses} rounded-3xl
            shadow-2xl p-6 transform -translate-x-1/2 -translate-y-1/2 z-50 text-white
            animate-scaleIn border border-gray-600`}>
            
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-xl flex items-center gap-2">
                <IoSparklesSharp className="text-[#FFD700]" />
                Create {postType === 'poll' ? 'Poll' : postType === 'image' ? 'Photo Post' : 'Post'}
              </h2>
              <button
                onClick={() => setUploadPost(false)}
                className="p-2 hover:bg-gray-700 rounded-full transition-colors"
              >
                <RxCross1 size={20} />
              </button>
            </div>

            {/* Post Type Tabs */}
            <div className="flex gap-2 mb-4">
              {['text', 'image', 'poll'].map((type) => (
                <button
                  key={type}
                  onClick={() => setPostType(type)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 capitalize
                    ${postType === type
                      ? 'bg-[#FFD700] text-[#1A1F71]'
                      : 'bg-gray-700 hover:bg-gray-600 text-gray-300'}`}
                >
                  {type === 'text' && <BsEmojiSmile className="inline mr-1" />}
                  {type === 'image' && <BsImage className="inline mr-1" />}
                  {type === 'poll' && <BiPoll className="inline mr-1" />}
                  {type}
                </button>
              ))}
            </div>

            {/* Content Input */}
            <textarea
              className={`w-full p-4 ${darkMode ? 'bg-gray-800' : 'bg-[#1A1F71]'} rounded-xl resize-none
                focus:outline-none focus:ring-2 focus:ring-[#FFD700] transition-all duration-300
                placeholder-gray-400 text-lg`}
              placeholder={postType === 'poll' ? "Ask a question..." : "What's on your mind?"}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />

            {/* Poll Options */}
            {postType === 'poll' && (
              <div className="mt-4 space-y-2">
                <label className="text-sm text-gray-400 flex items-center gap-2">
                  <BiPoll />
                  Poll Options
                </label>
                {pollOptions.map((option, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      placeholder={`Option ${index + 1}`}
                      value={option}
                      onChange={(e) => updatePollOption(index, e.target.value)}
                      className={`flex-1 p-3 ${darkMode ? 'bg-gray-800' : 'bg-[#1A1F71]'} rounded-lg
                        focus:outline-none focus:ring-2 focus:ring-[#FFD700] transition-all duration-300`}
                    />
                    {pollOptions.length > 2 && (
                      <button
                        onClick={() => removePollOption(index)}
                        className="px-3 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                      >
                        <RxCross1 />
                      </button>
                    )}
                  </div>
                ))}
                {pollOptions.length < 4 && (
                  <button
                    onClick={addPollOption}
                    className="w-full p-3 border-2 border-dashed border-gray-600 rounded-lg
                      text-gray-400 hover:border-[#FFD700] hover:text-[#FFD700] transition-colors"
                  >
                    + Add Option
                  </button>
                )}
              </div>
            )}

            {/* Image Preview */}
            {frontendImage && (
              <div className="mt-4 relative">
                <img
                  src={frontendImage}
                  alt="Preview"
                  className="w-full max-h-64 object-cover rounded-xl"
                />
                <button
                  onClick={() => {setFrontendImage(""); setBackendImage(""); setPostType('text');}}
                  className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full
                    hover:bg-red-600 transition-colors"
                >
                  <RxCross1 size={16} />
                </button>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-between items-center mt-6">
              <div className="flex gap-3">
                <button
                  onClick={() => image.current.click()}
                  className="p-3 bg-blue-500/20 text-blue-400 rounded-full hover:bg-blue-500/30
                    transition-colors hover:scale-110 transform duration-200"
                  title="Add Image"
                >
                  <BsImage size={20} />
                </button>
                <button
                  className="p-3 bg-yellow-500/20 text-yellow-400 rounded-full hover:bg-yellow-500/30
                    transition-colors hover:scale-110 transform duration-200"
                  title="Add Emoji"
                >
                  <BsEmojiSmile size={20} />
                </button>
              </div>
              
              <button
                className="px-8 py-3 bg-gradient-to-r from-[#FFD700] to-[#FFCC00] text-[#1A1F71]
                  rounded-full font-bold hover:scale-105 transform transition-all duration-300
                  disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                  shadow-lg hover:shadow-xl"
                onClick={handleUploadPost}
                disabled={posting || (!description.trim() && !frontendImage)}
              >
                {posting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-[#1A1F71] border-t-transparent rounded-full animate-spin" />
                    Posting...
                  </div>
                ) : (
                  `Post ${postType === 'poll' ? 'Poll' : ''}`
                )}
              </button>
            </div>
            
            <input type="file" ref={image} hidden onChange={handleImage} accept="image/*" />
          </div>
        </>
      )}
    </div>
  );
}

export default Home;