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

const socket = io();

function Profile() {
  const { userData, edit, setEdit, postData, profileData } = useContext(userDataContext);
  const [profilePosts, setProfilePosts] = useState([]);

  useEffect(() => {
    if (Array.isArray(postData) && profileData?._id) {
      const filtered = postData.filter((post) => post?.author?._id === profileData._id);
      setProfilePosts(filtered);
    } else {
      setProfilePosts([]);
    }
  }, [profileData, postData]);

  // Socket logic same as before...
  useEffect(() => {
    socket.on("likeUpdated", ({ postId, likes }) => {
      setProfilePosts((prev) =>
        prev.map((post) => post._id === postId ? { ...post, like: Array.isArray(likes) ? likes : [] } : post)
      );
    });
    socket.on("commentAdded", ({ postId, comments }) => {
      setProfilePosts((prev) =>
        prev.map((post) => post._id === postId ? { ...post, comment: Array.isArray(comments) ? comments : [] } : post)
      );
    });
    socket.on("postReposted", ({ postId, newPost }) => {
      setProfilePosts((prev) => [newPost, ...prev]);
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
    // FIX 1: Padding top 100px for Navbar overlap
    <div className="min-h-screen bg-gradient-to-br from-[#1A1A71] to-[#2C2C3C] text-white flex flex-col items-center pt-[100px] pb-10">
      <Nav />
      {edit && <EditProfile />}

      <div className="max-w-7xl w-full flex flex-col lg:flex-row gap-6 px-4">
        {/* LEFT SECTION */}
        <section className="flex-1 space-y-6">

          {/* PROFILE CARD */}
          <div className="bg-white text-black rounded-xl shadow relative">
            
            {/* Cover Image */}
            <div className="h-36 rounded-t-xl overflow-hidden bg-gray-200 w-full">
              {profileData?.coverImage ? (
                <img src={profileData.coverImage} alt="Cover" className="w-full h-full object-cover" />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">No Cover Photo</div>
              )}
            </div>

            {/* Profile Header Content */}
            <div className="px-6 pb-6">
              <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 -mt-12 sm:-mt-16">
                
                {/* Profile Image - Only this moves up */}
                <div 
                  className="w-32 h-32 rounded-full border-4 border-white overflow-hidden cursor-pointer bg-white relative z-10 flex-shrink-0 shadow-md"
                  onClick={() => setEdit(true)}
                >
                  <img src={profileData?.profileImage || dp} alt="Profile" className="w-full h-full object-cover" />
                </div>

                {/* Name & Details - Stays on white background */}
                <div className="flex-1 text-center sm:text-left mt-2 sm:mt-0 sm:pb-2">
                  <h1 className="text-3xl font-bold leading-tight">
                    {profileData?.firstName} {profileData?.lastName}
                  </h1>
                  <p className="text-gray-600 font-medium">{profileData?.headline || 'No headline'}</p>
                  <p className="text-gray-500 text-sm">{profileData?.location || 'No location'}</p>
                  
                  <p className="text-gray-500 font-medium mt-1">
                    {connectionsCount} connection{connectionsCount !== 1 && 's'}
                  </p>
                </div>

                {/* Action Button */}
                <div className="mt-4 sm:mt-0 sm:pb-4">
                  {profileData?._id === userData?._id ? (
                    <button
                      onClick={() => setEdit(true)}
                      className="px-5 py-2 bg-gradient-to-r from-yellow-400 to-yellow-500 text-black rounded-full font-semibold hover:brightness-105 transition flex items-center gap-2 shadow-sm"
                    >
                      Edit Profile <HiPencil />
                    </button>
                  ) : (
                    <ConnectionButton userId={profileData?._id} />
                  )}
                </div>

              </div>
            </div>
          </div>

          {/* POSTS */}
          <div className="bg-white text-black rounded-xl shadow p-6">
            <h2 className="text-2xl font-semibold mb-4">Posts ({profilePosts.length})</h2>
            {profilePosts.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No posts available</p>
            ) : (
              <div className="space-y-4">
                {profilePosts.map((post) => (
                  <Post key={post._id} {...post} />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* RIGHT SECTION */}
        <aside className="w-full lg:w-80 space-y-6">
          {skills.length > 0 && (
            <InfoCard title="Skills">
              <div className="flex flex-wrap gap-2">
                {skills.map((skill, idx) => (
                  <span key={idx} className="bg-gray-100 text-gray-800 rounded-full px-3 py-1 text-sm font-medium">
                    {skill}
                  </span>
                ))}
              </div>
            </InfoCard>
          )}

          {education.length > 0 && (
            <InfoCard title="Education">
              {education.map((edu, idx) => (
                <div key={idx} className="bg-gray-50 rounded-lg p-3 mb-3 border border-gray-100">
                  <p className="font-bold text-gray-800">{edu.college}</p>
                  <p className="text-sm text-gray-600">{edu.degree} - {edu.fieldOfStudy}</p>
                </div>
              ))}
            </InfoCard>
          )}

          {experience.length > 0 && (
            <InfoCard title="Experience">
              {experience.map((exp, idx) => (
                <div key={idx} className="bg-gray-50 rounded-lg p-3 mb-3 border border-gray-100">
                  <p className="font-bold text-gray-800">{exp.title} <span className="text-gray-500 font-normal">at</span> {exp.company}</p>
                  <p className="text-sm text-gray-600 mt-1">{exp.description}</p>
                </div>
              ))}
            </InfoCard>
          )}
        </aside>
      </div>
    </div>
  );
}

function InfoCard({ title, children }) {
  return (
    <div className="bg-white text-black rounded-xl shadow p-6">
      <h3 className="text-xl font-bold mb-4 border-b pb-2 border-gray-100">{title}</h3>
      {children}
    </div>
  );
}

export default Profile;