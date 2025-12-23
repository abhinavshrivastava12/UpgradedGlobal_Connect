import React, { useContext, useEffect, useRef, useState } from "react";
import dp from "../assets/dp.webp";
import { FiPlus } from "react-icons/fi";
import { userDataContext } from "../context/UserContext";
import EditProfile from "../components/EditProfile";
import { RxCross1 } from "react-icons/rx";
import { BsImage } from "react-icons/bs";
import { IoSparklesSharp } from "react-icons/io5";
import axios from "axios";
import Post from "../components/Post";
import AIChat from "../components/AIChat";
import Stories from "../components/Stories"; // ✅ ADDED
import TrendingHashtags from '../components/TrendingHashtags';

function Home() {
  const { userData = {}, edit, setEdit, postData, getPost, handleGetProfile } = useContext(userDataContext);

  const [frontendImage, setFrontendImage] = useState("");
  const [backendImage, setBackendImage] = useState("");
  const [description, setDescription] = useState("");
  const [uploadPost, setUploadPost] = useState(false);
  const [posting, setPosting] = useState(false);
  const [suggestedUser, setSuggestedUser] = useState([]);
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
  };

  const handleUploadPost = async () => {
    if (!description.trim() && !backendImage) {
      alert("Please add content or image");
      return;
    }

    setPosting(true);
    try {
      const token = localStorage.getItem('token');
      const formdata = new FormData();
      formdata.append("description", description);
      if (backendImage) formdata.append("image", backendImage);
      
      await axios.post(`/api/post/create`, formdata, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        },
        withCredentials: true,
      });
      
      setPosting(false);
      setUploadPost(false);
      setDescription("");
      setFrontendImage("");
      setBackendImage("");
      getPost();
      fetchUserStats();
    } catch (error) {
      setPosting(false);
      console.error("Post upload error:", error);
      alert("Failed to create post: " + (error.response?.data?.message || error.message));
    }
  };

  const handleSuggestedUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const result = await axios.get(`/api/user/suggestedusers`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        withCredentials: true,
      });
      
      const users = Array.isArray(result.data) ? result.data.slice(0, 5) : [];
      setSuggestedUser(users);
    } catch (error) {
      console.error("Error fetching suggested users:", error);
      setSuggestedUser([]);
    }
  };

  const fetchUserStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/user/stats`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        withCredentials: true,
      });
      setUserStats(response.data);
    } catch (error) {
      console.error("Error fetching user stats:", error);
    }
  };

  useEffect(() => {
    handleSuggestedUsers();
    fetchUserStats();
  }, []);

  useEffect(() => {
    getPost();
  }, []);

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-[#0f1419] via-[#1a1f2e] to-[#0f1419] text-white flex flex-col lg:flex-row p-5 gap-5 pt-24">
      {edit && <EditProfile />}

      {/* LEFT SIDEBAR */}
      <div className="w-full lg:w-[25%] flex flex-col gap-5 overflow-y-auto custom-scrollbar">
        {/* Profile Card */}
        <div className="bg-gradient-to-br from-[#1e293b] to-[#334155] rounded-2xl p-6 shadow-2xl border border-slate-700 flex flex-col items-center hover:shadow-purple-500/20 transition-all duration-300">
          <div
            className="relative w-[100px] h-[100px] rounded-full overflow-hidden border-4 border-purple-500 cursor-pointer hover:border-purple-400 transition-all"
            onClick={() => setEdit(true)}
          >
            <img
              src={userData?.profileImage || dp}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          </div>
          
          <h2 className="mt-4 font-bold text-xl text-white">
            {`${userData?.firstName || 'Guest'} ${userData?.lastName || 'User'}`}
          </h2>
          <p className="text-sm text-gray-300 text-center mt-1">
            {userData?.headline || 'Not Logged In'}
          </p>
          
          <div className="flex gap-6 mt-4">
            <div className="text-center">
              <div className="font-bold text-lg text-purple-400">{userStats.posts}</div>
              <div className="text-xs text-gray-400">Posts</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-lg text-purple-400">{userStats.followers}</div>
              <div className="text-xs text-gray-400">Followers</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-lg text-purple-400">{userStats.following}</div>
              <div className="text-xs text-gray-400">Following</div>
            </div>
          </div>
          
          <button
            className="mt-4 px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-full shadow-lg hover:from-purple-700 hover:to-pink-700 hover:scale-105 transition-all flex items-center gap-2"
            onClick={() => setEdit(true)}
          >
            <IoSparklesSharp size={16} />
            Edit Profile
          </button>
        </div>

        {/* Suggested Users */}
        <div className="bg-gradient-to-br from-[#1e293b] to-[#334155] rounded-2xl p-5 shadow-xl border border-slate-700">
          <h3 className="font-semibold text-lg mb-4 flex items-center gap-2 text-white">
            <IoSparklesSharp className="text-purple-400" />
            People You May Know
          </h3>
          <div className="flex flex-col gap-3 max-h-[400px] overflow-y-auto custom-scrollbar">
            {Array.isArray(suggestedUser) && suggestedUser.length > 0 ? (
              suggestedUser.map((su) => (
                <div
                  key={su._id || su.userName}
                  className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 cursor-pointer transition-all border border-slate-700/50 hover:border-purple-500/50"
                  onClick={() => su.userName && handleGetProfile(su.userName)}
                >
                  <div className="w-[50px] h-[50px] rounded-full overflow-hidden border-2 border-purple-500">
                    <img
                      src={su.profileImage || dp}
                      alt="User"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex flex-col flex-1">
                    <span className="font-semibold text-white">
                      {su.firstName && su.lastName ? `${su.firstName} ${su.lastName}` : su.userName || 'User'}
                    </span>
                    <span className="text-xs text-gray-400 line-clamp-1">
                      {su.headline || 'No headline'}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-400 text-center py-4">No suggestions available</p>
            )}
          </div>
        </div>
      </div>

      {/* CENTER FEED */}
      <div className="w-full lg:w-[50%] flex flex-col gap-5 overflow-y-auto custom-scrollbar">
        
        {/* ✅ STORIES SECTION - ADDED */}
        <div className="bg-gradient-to-br from-[#1e293b] to-[#334155] rounded-2xl p-4 shadow-xl border border-slate-700">
          <Stories />
        </div>

        {/* Create Post Button */}
        <div className="bg-gradient-to-br from-[#1e293b] to-[#334155] rounded-2xl p-4 shadow-xl border border-slate-700">
          <button
            className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-3 hover:from-purple-700 hover:to-pink-700 hover:scale-[1.02] transition-all"
            onClick={() => setUploadPost(true)}
          >
            <FiPlus size={24} />
            <span className="text-lg">Share Your Thoughts</span>
          </button>
        </div>

        {/* Posts Feed */}
        <div className="space-y-4">
          {postData && Array.isArray(postData) && postData.length > 0 ? (
            postData.map((post) => {
              if (!post || !post._id) {
                console.warn('Skipping invalid post:', post);
                return null;
              }
              return (
                <div key={post._id} className="bg-gradient-to-br from-[#1e293b] to-[#334155] rounded-2xl overflow-hidden border border-slate-700">
                  <Post 
                    post={post}
                    currentUser={userData}
                    onDelete={(postId) => {
                      getPost();
                    }}
                  />
                </div>
              );
            })
          ) : (
            <div className="bg-gradient-to-br from-[#1e293b] to-[#334155] rounded-2xl p-8 text-center border border-slate-700">
              <div className="text-6xl mb-4">📭</div>
              <p className="text-gray-300 text-lg">No posts yet</p>
              <p className="text-gray-500 text-sm mt-2">Be the first to share something!</p>
            </div>
          )}
        </div>
      </div>

      <AIChat />
      <TrendingHashtags />

      {/* Create Post Modal */}
      {uploadPost && (
        <>
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40"
            onClick={() => setUploadPost(false)}
          />
          <div className="fixed top-1/2 left-1/2 w-[95%] max-w-2xl bg-gradient-to-br from-[#1e293b] to-[#334155] rounded-3xl shadow-2xl p-6 transform -translate-x-1/2 -translate-y-1/2 z-50 text-white border border-slate-700">
            
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-xl flex items-center gap-2">
                <IoSparklesSharp className="text-purple-400" />
                Create Post
              </h2>
              <button
                onClick={() => setUploadPost(false)}
                className="p-2 hover:bg-slate-700 rounded-full transition-colors"
              >
                <RxCross1 size={20} />
              </button>
            </div>

            <textarea
              className="w-full p-4 bg-slate-800 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-gray-500 text-white text-lg border border-slate-700"
              placeholder="What's on your mind?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />

            {frontendImage && (
              <div className="mt-4 relative">
                <img
                  src={frontendImage}
                  alt="Preview"
                  className="w-full max-h-64 object-cover rounded-xl"
                />
                <button
                  onClick={() => {setFrontendImage(""); setBackendImage("");}}
                  className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600"
                >
                  <RxCross1 size={16} />
                </button>
              </div>
            )}

            <div className="flex justify-between items-center mt-6">
              <button
                onClick={() => image.current.click()}
                className="p-3 bg-purple-600/20 text-purple-400 rounded-full hover:bg-purple-600/30 transition-all"
              >
                <BsImage size={20} />
              </button>
              
              <button
                className={`px-8 py-3 rounded-full font-bold transition-all ${
                  posting || (!description.trim() && !frontendImage)
                    ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                    : "bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 hover:scale-105"
                }`}
                onClick={handleUploadPost}
                disabled={posting || (!description.trim() && !frontendImage)}
              >
                {posting ? "Posting..." : "Post"}
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