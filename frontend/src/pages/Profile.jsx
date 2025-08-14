
import React, { useContext, useEffect, useState } from 'react';
import Nav from '../components/Nav';
import dp from "../assets/dp.webp";
import { HiPencil } from "react-icons/hi2";
import { userDataContext } from '../context/userContext';
import { authDataContext } from '../context/AuthContext';
import EditProfile from '../components/EditProfile';
import Post from '../components/Post';
import ConnectionButton from '../components/ConnectionButton';

function Profile() {
  const { userData, edit, setEdit, postData, profileData } = useContext(userDataContext);
  const { serverUrl } = useContext(authDataContext);

  const [profilePost, setProfilePost] = useState([]);

  useEffect(() => {
    setProfilePost(postData.filter((post) => post.author._id === profileData._id));
  }, [profileData, postData]);

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-[#1A1F71] to-[#2C2C2C] flex flex-col items-center">
      <Nav />
      {edit && <EditProfile />}

      <div className="w-full max-w-[1200px] flex flex-col lg:flex-row gap-6 pt-[100px] px-4 pb-10">
        
        {/* Left Column - Posts */}
        <div className="w-full lg:w-2/3 flex flex-col gap-6">
          {/* Profile Card */}
          <div className="relative bg-white rounded-lg shadow-lg overflow-hidden">
            {/* Cover Image */}
            <div className="w-full h-36 bg-gray-300 overflow-hidden cursor-pointer">
              {profileData.coverImage ? (
                <img src={profileData.coverImage} alt="Cover" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">No Cover Photo</div>
              )}
            </div>

            {/* Profile Picture */}
            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-lg absolute top-24 left-6 cursor-pointer">
              <img src={profileData.profileImage || dp} alt="Profile" className="w-full h-full object-cover" />
            </div>

            {/* User Info */}
            <div className="mt-16 ml-6 mb-4">
              <div className="text-2xl font-semibold text-gray-800">{`${profileData.firstName} ${profileData.lastName}`}</div>
              <div className="text-lg text-gray-600">{profileData.headline || ""}</div>
              <div className="text-gray-500">{profileData.location}</div>
              <div className="text-gray-500">{`${profileData.connection.length} connections`}</div>

              {/* Action Button */}
              {profileData._id === userData._id ? (
                <button
                  className="mt-4 px-5 py-2 rounded-full border-2 border-yellow-400 bg-gradient-to-r from-[#FFD700] to-[#FFCC00] text-[#1A1F71] flex items-center gap-2 hover:bg-yellow-100 transition"
                  onClick={() => setEdit(true)}
                >
                  Edit Profile <HiPencil />
                </button>
              ) : (
                <div className="mt-4">
                  <ConnectionButton userId={profileData._id} />
                </div>
              )}
            </div>
          </div>

          {/* Posts Section */}
          <div className="bg-white rounded-lg shadow-lg p-4 flex flex-col gap-4">
            <div className="text-xl font-semibold text-gray-700">{`Posts (${profilePost.length})`}</div>
            {profilePost.length === 0 && <div className="text-gray-400 text-center py-4">No Posts Yet</div>}
            {profilePost.map((post, index) => (
              <Post
                key={index}
                id={post._id}
                description={post.description}
                author={post.author}
                image={post.image}
                like={post.like}
                comment={post.comment}
                createdAt={post.createdAt}
              />
            ))}
          </div>
        </div>

        {/* Right Column - Skills, Education, Experience */}
        <div className="w-full lg:w-1/3 flex flex-col gap-6">
          {/* Skills */}
          {profileData.skills.length > 0 && (
            <Card title="Skills">
              <div className="flex flex-wrap gap-2">
                {profileData.skills.map((skill, idx) => (
                  <span key={idx} className="px-3 py-1 bg-gray-100 rounded-full text-gray-700 text-sm">{skill}</span>
                ))}
              </div>
              {profileData._id === userData._id && (
                <button
                  className="mt-3 w-full px-4 py-2 rounded-full border-2 border-[#24b2ff] text-[#24b2ff] hover:bg-[#e5f7ff]"
                  onClick={() => setEdit(true)}
                >
                  Add Skills
                </button>
              )}
            </Card>
          )}

          {/* Education */}
          {profileData.education.length > 0 && (
            <Card title="Education">
              <div className="flex flex-col gap-3">
                {profileData.education.map((edu, idx) => (
                  <div key={idx} className="bg-gray-50 p-3 rounded-lg">
                    <div className="font-semibold text-gray-800">College: {edu.college}</div>
                    <div className="text-gray-600">Degree: {edu.degree}</div>
                    <div className="text-gray-600">Field: {edu.fieldOfStudy}</div>
                  </div>
                ))}
              </div>
              {profileData._id === userData._id && (
                <button
                  className="mt-3 w-full px-4 py-2 rounded-full border-2 border-[#24b2ff] text-[#24b2ff] hover:bg-[#e5f7ff]"
                  onClick={() => setEdit(true)}
                >
                  Add Education
                </button>
              )}
            </Card>
          )}

          {/* Experience */}
          {profileData.experience.length > 0 && (
            <Card title="Experience">
              <div className="flex flex-col gap-3">
                {profileData.experience.map((ex, idx) => (
                  <div key={idx} className="bg-gray-50 p-3 rounded-lg">
                    <div className="font-semibold text-gray-800">Title: {ex.title}</div>
                    <div className="text-gray-600">Company: {ex.company}</div>
                    <div className="text-gray-600">Description: {ex.description}</div>
                  </div>
                ))}
              </div>
              {profileData._id === userData._id && (
                <button
                  className="mt-3 w-full px-4 py-2 rounded-full border-2 border-[#24b2ff] text-[#24b2ff] hover:bg-[#e5f7ff]"
                  onClick={() => setEdit(true)}
                >
                  Add Experience
                </button>
              )}
            </Card>
          )}
        </div>

      </div>
    </div>
  );
}

export default Profile;

/* Card Helper Component */
function Card({ title, children }) {
  return (
    <div className="bg-white rounded-lg shadow-lg p-4 flex flex-col gap-3">
      <div className="text-lg font-semibold text-gray-700">{title}</div>
      {children}
    </div>
  );
}
