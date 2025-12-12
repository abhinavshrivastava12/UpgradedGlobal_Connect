import React, { useContext, useEffect, useRef, useState } from "react";
import dp from "../assets/dp.webp";
import { FiPlus } from "react-icons/fi";
import { userDataContext } from "../context/UserContext";
import EditProfile from "../components/EditProfile";
import { RxCross1 } from "react-icons/rx";
import { BsImage, BsEmojiSmile } from "react-icons/bs";
import { IoSparklesSharp } from "react-icons/io5";
import axios from "axios";
import { authDataContext } from "../context/AuthContext";
import Post from "../components/Post";
import AIChat from "../components/AIChat";

function Home() {
  const { userData = {}, edit, setEdit, postData, getPost, handleGetProfile } = useContext(userDataContext);
  const { serverUrl } = useContext(authDataContext);

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
      
      await axios.post(`${serverUrl}/api/post/create`, formdata, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        withCredentials: true,
      });
      
      setPosting(false);
      setUploadPost(false);
      setDescription("");
      setFrontendImage("");
      setBackendImage("");
      getPost(); // Reload posts
      fetchUserStats(); // Update stats
    } catch (error) {
      setPosting(false);
      console.error("Post upload error:", error);
      alert("Failed to create post");
    }
  };

  const handleSuggestedUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const result = await axios.get(`${serverUrl}/api/user/suggestedusers`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        withCredentials: true,
      });
      
      const users = Array.isArray(result.data) ? result.data : [];
      setSuggestedUser(users);
    } catch (error) {
      console.error("Error fetching suggested users:", error);
      setSuggestedUser([]);
    }
  };

  const fetchUserStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${serverUrl}/api/user/stats`, {
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
    <div className="w-full min-h-screen bg-gradient-to-br from-[#1A1F71] to-[#2C2C2C] text-white flex flex-col lg:flex-row p-5 gap-5 pt-24">
      {edit && <EditProfile />}

      {/* LEFT SIDEBAR */}
      <div className="w-full lg:w-[25%] flex flex-col gap-5 overflow-y-auto custom-scrollbar">
        {/* Profile Card */}
        <div className="bg-gradient-to-r from-[#1A1F71] to-[#d19a9a] rounded-2xl p-6 shadow-2xl flex flex-col items-center hover:scale-105 transform transition-all">
          <div
            className="relative w-[100px] h-[100px] rounded-full overflow-hidden border-4 border-[#FFD700] cursor-pointer"
            onClick={() => setEdit(true)}
          >
            <img
              src={userData?.profileImage || dp}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          </div>
          
          <h2 className="mt-4 font-bold text-xl">
            {`${userData?.firstName || 'Guest'} ${userData?.lastName || 'User'}`}
          </h2>
          <p className="text-sm text-gray-300 text-center mt-1">
            {userData?.headline || 'Not Logged In'}
          </p>
          
          <div className="flex gap-6 mt-4">
            <div className="text-center">
              <div className="font-bold text-lg text-[#FFD700]">{userStats.posts}</div>
              <div className="text-xs text-gray-400">Posts</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-lg text-[#FFD700]">{userStats.followers}</div>
              <div className="text-xs text-gray-400">Followers</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-lg text-[#FFD700]">{userStats.following}</div>
              <div className="text-xs text-gray-400">Following</div>
            </div>
          </div>
          
          <button
            className="mt-4 px-6 py-2 bg-gradient-to-r from-[#FFD700] to-[#FFCC00] text-[#1A1F71] font-semibold rounded-full shadow-lg hover:scale-105 transition-all flex items-center gap-2"
            onClick={() => setEdit(true)}
          >
            <IoSparklesSharp size={16} />
            Edit Profile
          </button>
        </div>

        {/* Suggested Users */}
        <div className="bg-[#2C2C2C] rounded-2xl p-5 shadow-lg">
          <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <IoSparklesSharp className="text-[#FFD700]" />
            Suggested Users
          </h3>
          <div className="flex flex-col gap-3 max-h-[400px] overflow-y-auto custom-scrollbar">
            {Array.isArray(suggestedUser) && suggestedUser.length > 0 ? (
              suggestedUser.map((su) => (
                <div
                  key={su._id || su.userName}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#1A1F71] cursor-pointer transition-all"
                  onClick={() => su.userName && handleGetProfile(su.userName)}
                >
                  <div className="w-[50px] h-[50px] rounded-full overflow-hidden border-2 border-[#FFD700]">
                    <img
                      src={su.profileImage || dp}
                      alt="User"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex flex-col flex-1">
                    <span className="font-semibold">
                      {su.firstName && su.lastName ? `${su.firstName} ${su.lastName}` : su.userName || 'User'}
                    </span>
                    <span className="text-xs text-gray-300 line-clamp-1">
                      {su.headline || 'No headline'}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-400 text-center">No suggestions</p>
            )}
          </div>
        </div>
      </div>

      {/* CENTER FEED */}
      <div className="w-full lg:w-[50%] flex flex-col gap-5 overflow-y-auto custom-scrollbar">
        {/* Create Post Button */}
        <div className="bg-[#2C2C2C] rounded-2xl p-4 shadow-lg">
          <button
            className="w-full py-4 bg-gradient-to-r from-[#FFD700] via-[#FFCC00] to-[#FFB700] text-[#1A1F71] font-bold rounded-xl shadow-lg flex items-center justify-center gap-3 hover:scale-105 transition-all"
            onClick={() => setUploadPost(true)}
          >
            <FiPlus size={24} />
            <span className="text-lg">Create Post</span>
          </button>
        </div>

        {/* Posts Feed - FIXED */}
        <div className="space-y-4">
          {postData && Array.isArray(postData) && postData.length > 0 ? (
            postData.map((post) => (
              <div key={post._id} className="bg-[#2C2C2C] rounded-2xl shadow-lg hover:shadow-xl transition-all">
                <Post {...post} />
              </div>
            ))
          ) : (
            <div className="bg-[#2C2C2C] rounded-2xl p-8 text-center">
              <p className="text-gray-400 text-lg">No posts yet</p>
              <p className="text-gray-500 text-sm mt-2">Be the first to share something!</p>
            </div>
          )}
        </div>
      </div>

      <AIChat />

      {/* Create Post Modal */}
      {uploadPost && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-40"
            onClick={() => setUploadPost(false)}
          />
          <div className="fixed top-1/2 left-1/2 w-[95%] max-w-2xl bg-[#2C2C2C] rounded-3xl shadow-2xl p-6 transform -translate-x-1/2 -translate-y-1/2 z-50 text-white border border-gray-600">
            
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-xl flex items-center gap-2">
                <IoSparklesSharp className="text-[#FFD700]" />
                Create Post
              </h2>
              <button
                onClick={() => setUploadPost(false)}
                className="p-2 hover:bg-gray-700 rounded-full transition-colors"
              >
                <RxCross1 size={20} />
              </button>
            </div>

            <textarea
              className="w-full p-4 bg-[#1A1F71] rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-[#FFD700] placeholder-gray-400 text-lg"
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
                className="p-3 bg-blue-500/20 text-blue-400 rounded-full hover:bg-blue-500/30"
              >
                <BsImage size={20} />
              </button>
              
              <button
                className={`px-8 py-3 rounded-full font-bold transition-all ${
                  posting || (!description.trim() && !frontendImage)
                    ? "bg-gray-600 cursor-not-allowed"
                    : "bg-gradient-to-r from-[#FFD700] to-[#FFCC00] text-[#1A1F71] hover:scale-105"
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