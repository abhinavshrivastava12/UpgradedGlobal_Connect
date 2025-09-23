import React, { createContext, useContext, useEffect, useState } from 'react'
import { authDataContext } from './AuthContext'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

export const userDataContext = createContext()

function UserContext({ children }) {
  const [userData, setUserData] = useState(null)
  const [edit, setEdit] = useState(false)
  const [postData, setPostData] = useState([])
  const [profileData, setProfileData] = useState(null)
  const { serverUrl } = useContext(authDataContext)
  const navigate = useNavigate()

  const getCurrentUser = async () => {
    try {
      const result = await axios.get(`${serverUrl}/api/user/currentuser`, { withCredentials: true })
      setUserData(result.data)
    } catch (error) {
      console.error(error)
      setUserData(null)
      // Optionally add redirect here for unauthorized users
    }
  }
const getPost = async () => {
  try {
    const result = await axios.get(`${serverUrl}/api/post/getpost`, { withCredentials: true });
    setPostData(result.data);
  } catch (error) {
    console.error(error);
  }
};


  const handleGetProfile = async (userName) => {
    try {
      const result = await axios.get(`${serverUrl}/api/user/profile/${userName}`, { withCredentials: true })
      setProfileData(result.data)
      navigate('/profile')
    } catch (error) {
      console.error(error)
    }
  }

  useEffect(() => {
    getCurrentUser()
    getPost()
  }, [])

  return (
    <userDataContext.Provider value={{ userData, setUserData, edit, setEdit, postData, setPostData, getPost, handleGetProfile, profileData, setProfileData }}>
      {children}
    </userDataContext.Provider>
  )
}

export default UserContext
