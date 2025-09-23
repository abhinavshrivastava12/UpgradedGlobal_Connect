import React, { useContext, useEffect, useState } from 'react';
import Nav from '../components/Nav';
import dp from "../assets/dp.webp";
import { HiPencil } from "react-icons/hi2";
import { userDataContext } from '../context/UserContext';
import { authDataContext } from '../context/AuthContext';
import EditProfile from '../components/EditProfile';
import Post from '../components/Post';
import ConnectionButton from '../components/ConnectionButton';
import { io } from "socket.io-client";

const socket = io("https://upgradedglobal-connect.onrender.com"); // Socket server URL

function Profile() {
  const { userData, edit, setEdit, postData, profileData, handleGetProfile, getPost } = useContext(userDataContext);
  const { serverUrl } = useContext(authDataContext);

  const [profilePosts, setProfilePosts] = useState([]);

  // Filter posts for this profile
  useEffect(() => {
    if (profileData && postData) {
      const filteredPosts = postData.filter(post => post.author?._id === profileData._id);
      setProfilePosts(filteredPosts);
    } else {
      setProfilePosts([]);
    }
  }, [profileData, postData]);

  // Listen for real-time post updates (like/comment/repost)
  useEffect(() => {
    socket.on("likeUpdated", ({ postId, likes }) => {
      setProfilePosts(prev =>
        prev.map(post => post._id === postId ? { ...post, like: Array.isArray(likes) ? likes : [] } : post)
      );
    });

    socket.on("commentAdded", ({ postId, comments }) => {
      setProfilePosts(prev =>
        prev.map(post => post._id === postId ? { ...post, comment: Array.isArray(comments) ? comments : [] } : post)
      );
    });

    socket.on("postReposted", ({ postId, newPost }) => {
      setProfilePosts(prev => [newPost, ...prev]);
    });

    return () => {
      socket.off("likeUpdated");
      socket.off("commentAdded");
      socket.off("postReposted");
    };
  }, []);

  const skills = profileData?.skills ?? [];
  const education = profileData?.education ?? [];
  const experience = profileData?.experience ?? [];
  const connectionsCount = profileData?.connection?.length ?? 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1A1A71] to-[#2C2C3C] text-white flex flex-col items-center">
      <Nav />
      {edit && <EditProfile />}

      <div className="max-w-7xl w-full flex flex-col lg:flex-row gap-6 px-4 py-10">
        {/* Left Section */}
        <section className="flex-1 space-y-6">
          {/* Profile Info Card */}
          <div className="bg-white text-black rounded-xl shadow p-6 relative">
            <div className="h-36 rounded-t-xl overflow-hidden">
              {profileData?.coverImage ? (
                <img src={profileData.coverImage} alt="Cover" className="w-full h-full object-cover" />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">No Cover Photo</div>
              )}
            </div>
            <div className="relative -top-16 flex items-center space-x-6">
              <div className="h-32 w-32 rounded-full border-4 border-white overflow-hidden cursor-pointer" onClick={() => setEdit(true)}>
                <img src={profileData?.profileImage || dp} alt="Profile" className="h-full w-full object-cover" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">{profileData?.firstName} {profileData?.lastName}</h1>
                <p className="text-gray-600">{profileData?.headline || 'No headline'}</p>
                <p className="text-gray-500">{profileData?.location || 'No location'}</p>
                <p className="text-gray-500">{connectionsCount} connection{connectionsCount !== 1 ? 's' : ''}</p>
                {profileData?._id === userData?._id ? (
                  <button onClick={() => setEdit(true)} className="mt-4 px-5 py-2 bg-gradient-to-r from-yellow-400 to-yellow-500 text-black rounded-full font-semibold hover:brightness-105 transition">
                    Edit Profile <HiPencil className="inline ml-1" />
                  </button>
                ) : (
                  <ConnectionButton userId={profileData?._id} />
                )}
              </div>
            </div>
          </div>

          {/* Posts */}
          <div className="bg-white text-black rounded-xl shadow p-6">
            <h2 className="text-2xl font-semibold mb-4">Posts ({profilePosts.length})</h2>
            {profilePosts.length === 0 ? (
              <p className="text-gray-500">No posts available</p>
            ) : (
              profilePosts.map(post => (
                <Post
                  key={post._id}
                  id={post._id}
                  author={post.author}
                  description={post.description}
                  image={post.image}
                  like={post.like}
                  comment={post.comment}
                  createdAt={post.createdAt}
                />
              ))
            )}
          </div>
        </section>

        {/* Right Section */}
        <aside className="w-80 space-y-6">
          {skills.length > 0 && (
            <InfoCard title="Skills">
              <div className="flex flex-wrap gap-2">
                {skills.map((skill, idx) => (
                  <span key={idx} className="bg-gray-200 text-black rounded-full px-3 py-1 text-sm">{skill}</span>
                ))}
              </div>
              {profileData?._id === userData?._id && (
                <button onClick={() => setEdit(true)} className="mt-3 w-full px-4 py-2 rounded-full border-2 border-blue-600 text-blue-600 hover:bg-blue-100 transition">
                  Add Skills
                </button>
              )}
            </InfoCard>
          )}

          {education.length > 0 && (
            <InfoCard title="Education">
              {education.map((edu, idx) => (
                <div key={idx} className="bg-gray-100 rounded-lg p-3 mb-3">
                  <p className="font-semibold">{edu.college}</p>
                  <p>{edu.degree} - {edu.fieldOfStudy}</p>
                </div>
              ))}
              {profileData?._id === userData?._id && (
                <button onClick={() => setEdit(true)} className="mt-3 w-full px-4 py-2 rounded-full border-2 border-blue-600 text-blue-600 hover:bg-blue-100 transition">
                  Add Education
                </button>
              )}
            </InfoCard>
          )}

          {experience.length > 0 && (
            <InfoCard title="Experience">
              {experience.map((exp, idx) => (
                <div key={idx} className="bg-gray-100 rounded-lg p-3 mb-3">
                  <p className="font-semibold">{exp.title} at {exp.company}</p>
                  <p>{exp.description}</p>
                </div>
              ))}
              {profileData?._id === userData?._id && (
                <button onClick={() => setEdit(true)} className="mt-3 w-full px-4 py-2 rounded-full border-2 border-blue-600 text-blue-600 hover:bg-blue-100 transition">
                  Add Experience
                </button>
              )}
            </InfoCard>
          )}
        </aside>
      </div>
    </div>
  )
}

function InfoCard({ title, children }) {
  return (
    <div className="bg-white text-black rounded-xl shadow p-6">
      <h3 className="text-xl font-semibold mb-4">{title}</h3>
      {children}
    </div>
  )
}

export default Profile;
