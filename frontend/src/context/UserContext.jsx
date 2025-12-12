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

  const { serverUrl } = useContext(authDataContext);
  const navigate = useNavigate();

  // Fetch Current User
  const getCurrentUser = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        withCredentials: true
      };
      
      const result = await axios.get(
        `${serverUrl}/api/user/currentuser`,
        config
      );
      setUserData(result.data);
    } catch (error) {
      console.error("Current user error:", error);
      setUserData(null);
    }
  };

  // Fetch Posts - FIXED: Handle direct array response
  const getPost = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        withCredentials: true
      };
      
      const result = await axios.get(
        `${serverUrl}/api/post/getpost`,
        config
      );

      // Backend returns direct array, not an object
      const posts = Array.isArray(result.data) ? result.data : [];
      setPostData(posts);
      console.log('Posts loaded:', posts.length);

    } catch (error) {
      console.error("Fetch posts error:", error);
      setPostData([]);
    }
  };

  // Fetch Selected Profile
  const handleGetProfile = async (userName) => {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        withCredentials: true
      };
      
      const result = await axios.get(
        `${serverUrl}/api/user/profile/${userName}`,
        config
      );
      setProfileData(result.data);
      navigate("/profile");
    } catch (error) {
      console.error("Profile error:", error);
    }
  };

  useEffect(() => {
    getCurrentUser();
    getPost();
  }, []);

  return (
    <userDataContext.Provider value={{
      userData, setUserData,
      edit, setEdit,
      postData, setPostData,
      getPost,
      handleGetProfile,
      profileData, setProfileData,
    }}>
      {children}
    </userDataContext.Provider>
  );
}

export default UserContext;