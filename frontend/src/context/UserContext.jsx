import React, { createContext, useContext, useEffect, useState } from 'react';
import { authDataContext } from './AuthContext';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export const userDataContext = createContext();

function UserContext({ children }) {
  const [userData, setUserData] = useState(null);
  const [edit, setEdit] = useState(false);
  const [postData, setPostData] = useState([]); 
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  const getCurrentUser = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setUserData(null);
        setLoading(false);
        return;
      }

      const config = {
        headers: { 'Authorization': `Bearer ${token}` },
        withCredentials: true
      };
      
      const result = await axios.get(`/api/user/currentuser`, config);
      setUserData(result.data);
    } catch (error) {
      console.error("Current user error:", error);
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
        localStorage.removeItem('email');
        setUserData(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const getPost = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setPostData([]);
        return;
      }

      const config = {
        headers: { 'Authorization': `Bearer ${token}` },
        withCredentials: true
      };
      
      const result = await axios.get(`/api/post/getpost`, config);
      const posts = Array.isArray(result.data) ? result.data : [];
      setPostData(posts);
      console.log('✅ Posts loaded:', posts.length);
    } catch (error) {
      console.error("Fetch posts error:", error);
      if (error.response?.status === 401) {
        console.log("Unauthorized - clearing auth");
        localStorage.removeItem('token');
      }
      setPostData([]);
    }
  };

  const handleGetProfile = async (userName) => {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: { 'Authorization': `Bearer ${token}` },
        withCredentials: true
      };
      
      const result = await axios.get(`/api/user/profile/${userName}`, config);
      setProfileData(result.data);
      navigate("/profile");
    } catch (error) {
      console.error("Profile error:", error);
      alert("Failed to load profile");
    }
  };

  useEffect(() => {
    getCurrentUser();
  }, []);

  useEffect(() => {
    if (userData) {
      getPost();
    }
  }, [userData]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <userDataContext.Provider value={{
      userData, 
      setUserData,
      edit, 
      setEdit,
      postData, 
      setPostData,
      getPost,
      handleGetProfile,
      profileData, 
      setProfileData,
    }}>
      {children}
    </userDataContext.Provider>
  );
}

export default UserContext;