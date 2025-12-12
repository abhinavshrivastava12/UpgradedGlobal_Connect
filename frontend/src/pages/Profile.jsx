
import React, { useContext, useEffect, useState } from 'react';
import Nav from '../components/Nav';
import dp from "../assets/dp.webp";
import { HiPencil } from "react-icons/hi2";
import { userDataContext } from '../context/UserContext';
import EditProfile from '../components/EditProfile';
import Post from '../components/Post';
import ConnectionButton from '../components/ConnectionButton';

function Profile() {
  const { userData, edit, setEdit, postData, profileData } = useContext(userDataContext);
  const [profilePosts, setProfilePosts] = useState([]);

  useEffect(() => {
    if (Array.isArray(postData) && profileData?._id) {
      const filtered = postData.filter((post) => post?.author?._id === profileData._id);
      setProfilePosts(filtered);
      console.log('Profile posts:', filtered.length);
    } else {
      setProfilePosts([]);
    }
  }, [profileData, postData]);

  const skills = profileData?.skills ?? [];
  const education = profileData?.education ?? [];
  const experience = profileData?.experience ?? [];
  const connectionsCount = profileData?.connection?.length ?? 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1A1A71] to-[#2C2C3C] text-white pt-20">
      <Nav />
      {edit && <EditProfile />}

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-6">
          
          {/* LEFT SECTION */}
          <section className="flex-1 space-y-6">

            {/* PROFILE CARD - FIXED LAYOUT */}
            <div className="bg-white text-black rounded-2xl shadow-xl overflow-hidden">
              
              {/* Cover Image */}
              <div className="h-48 bg-gradient-to-r from-blue-500 to-purple-600 relative">
                {profileData?.coverImage && (
                  <img 
                    src={profileData.coverImage} 
                    alt="Cover" 
                    className="w-full h-full object-cover"
                  />
                )}
              </div>

              {/* Profile Content */}
              <div className="px-6 pb-6">
                <div className="flex flex-col sm:flex-row items-start gap-6 -mt-16 relative">
                  
                  {/* Profile Image - Floating above cover */}
                  <div 
                    className="w-32 h-32 rounded-full border-4 border-white overflow-hidden cursor-pointer bg-white shadow-xl flex-shrink-0 z-10"
                    onClick={() => userData?._id === profileData?._id && setEdit(true)}
                  >
                    <img 
                      src={profileData?.profileImage || dp} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Name & Details Section */}
                  <div className="flex-1 mt-16 sm:mt-0">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div>
                        <h1 className="text-3xl font-bold text-gray-900">
                          {profileData?.firstName} {profileData?.lastName}
                        </h1>
                        <p className="text-gray-600 font-medium mt-1">
                          {profileData?.headline || 'No headline'}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            📍 {profileData?.location || 'No location'}
                          </span>
                          <span className="flex items-center gap-1">
                            🔗 {connectionsCount} connection{connectionsCount !== 1 && 's'}
                          </span>
                        </div>
                      </div>

                      {/* Action Button */}
                      <div className="flex-shrink-0">
                        {profileData?._id === userData?._id ? (
                          <button
                            onClick={() => setEdit(true)}
                            className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full font-semibold hover:from-blue-700 hover:to-purple-700 transition-all flex items-center gap-2 shadow-lg"
                          >
                            <HiPencil className="w-4 h-4" />
                            Edit Profile
                          </button>
                        ) : (
                          <ConnectionButton userId={profileData?._id} />
                        )}
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>

            {/* POSTS SECTION - FIXED */}
            <div className="bg-white text-black rounded-2xl shadow-xl p-6">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                📝 Posts
                <span className="text-sm font-normal text-gray-500">
                  ({profilePosts.length})
                </span>
              </h2>
              
              {profilePosts.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📭</div>
                  <p className="text-gray-500 text-lg">No posts yet</p>
                  {profileData?._id === userData?._id && (
                    <p className="text-gray-400 text-sm mt-2">
                      Start sharing your thoughts!
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  {profilePosts.map((post) => (
                    <div key={post._id} className="border-b border-gray-100 pb-6 last:border-0">
                      <Post {...post} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* RIGHT SIDEBAR */}
          <aside className="w-full lg:w-96 space-y-6">
            
            {/* Skills Card */}
            {skills.length > 0 && (
              <div className="bg-white text-black rounded-2xl shadow-xl p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  💡 Skills
                </h3>
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill, idx) => (
                    <span 
                      key={idx} 
                      className="bg-gradient-to-r from-blue-50 to-purple-50 text-gray-800 border border-blue-200 rounded-full px-4 py-2 text-sm font-medium hover:shadow-md transition-shadow"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Education Card */}
            {education.length > 0 && (
              <div className="bg-white text-black rounded-2xl shadow-xl p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  🎓 Education
                </h3>
                <div className="space-y-4">
                  {education.map((edu, idx) => (
                    <div 
                      key={idx} 
                      className="bg-gray-50 rounded-xl p-4 border border-gray-200 hover:shadow-md transition-shadow"
                    >
                      <p className="font-bold text-gray-900">{edu.college}</p>
                      <p className="text-sm text-gray-600 mt-1">
                        {edu.degree} - {edu.fieldOfStudy}
                      </p>
                      {edu.startYear && edu.endYear && (
                        <p className="text-xs text-gray-500 mt-1">
                          {edu.startYear} - {edu.endYear}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Experience Card */}
            {experience.length > 0 && (
              <div className="bg-white text-black rounded-2xl shadow-xl p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  💼 Experience
                </h3>
                <div className="space-y-4">
                  {experience.map((exp, idx) => (
                    <div 
                      key={idx} 
                      className="bg-gray-50 rounded-xl p-4 border border-gray-200 hover:shadow-md transition-shadow"
                    >
                      <p className="font-bold text-gray-900">{exp.title}</p>
                      <p className="text-sm text-gray-600 mt-1">{exp.company}</p>
                      {exp.description && (
                        <p className="text-sm text-gray-500 mt-2">{exp.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}

export default Profile;