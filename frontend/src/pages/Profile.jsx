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
    } else {
      setProfilePosts([]);
    }
  }, [profileData, postData]);

  const skills = profileData?.skills ?? [];
  const education = profileData?.education ?? [];
  const experience = profileData?.experience ?? [];
  const connectionsCount = profileData?.connection?.length ?? 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white pt-20">
      <Nav />
      {edit && <EditProfile />}

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-6">
          
          {/* LEFT SECTION */}
          <section className="flex-1 space-y-6">

            {/* PROFILE CARD - COMPLETELY FIXED */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-slate-700">
              
              {/* Cover Image */}
              <div className="h-48 bg-gradient-to-r from-purple-600 to-pink-600 relative">
                {profileData?.coverImage && (
                  <img 
                    src={profileData.coverImage} 
                    alt="Cover" 
                    className="w-full h-full object-cover"
                  />
                )}
              </div>

              {/* Profile Content - FIXED LAYOUT */}
              <div className="px-6 pb-6">
                {/* Profile Image - Floating */}
                <div className="flex flex-col items-start -mt-16 relative z-10">
                  <div 
                    className="w-32 h-32 rounded-full border-4 border-slate-800 overflow-hidden cursor-pointer bg-slate-700 shadow-2xl mb-4"
                    onClick={() => userData?._id === profileData?._id && setEdit(true)}
                  >
                    <img 
                      src={profileData?.profileImage || dp} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Name & Info Section - FIXED */}
                  <div className="w-full">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                      <div className="flex-1">
                        <h1 className="text-3xl font-bold text-white mb-2">
                          {profileData?.firstName} {profileData?.lastName}
                        </h1>
                        <p className="text-gray-300 font-medium text-lg mb-2">
                          {profileData?.headline || 'No headline'}
                        </p>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
                          <span className="flex items-center gap-1">
                            📍 {profileData?.location || 'No location'}
                          </span>
                          <span className="flex items-center gap-1">
                            🔗 {connectionsCount} connection{connectionsCount !== 1 && 's'}
                          </span>
                        </div>
                      </div>

                      {/* Action Button - FIXED */}
                      <div className="flex-shrink-0">
                        {profileData?._id === userData?._id ? (
                          <button
                            onClick={() => setEdit(true)}
                            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full font-semibold hover:from-purple-700 hover:to-pink-700 transition-all flex items-center gap-2 shadow-lg hover:shadow-purple-500/50"
                          >
                            <HiPencil className="w-5 h-5" />
                            Edit Profile
                          </button>
                        ) : (
                          <ConnectionButton userId={profileData?._id} />
                        )}
                      </div>
                    </div>

                    {/* Stats - NEW */}
                    <div className="flex gap-8 pt-4 border-t border-slate-700">
                      <div>
                        <div className="text-2xl font-bold text-purple-400">{profilePosts.length}</div>
                        <div className="text-sm text-gray-400">Posts</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-purple-400">{connectionsCount}</div>
                        <div className="text-sm text-gray-400">Connections</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-purple-400">
                          {(skills?.length || 0) + (education?.length || 0)}
                        </div>
                        <div className="text-sm text-gray-400">Skills & Education</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* POSTS SECTION */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-2xl p-6 border border-slate-700">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-white">
                📝 Posts
                <span className="text-sm font-normal text-gray-400">
                  ({profilePosts.length})
                </span>
              </h2>
              
              {profilePosts.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📭</div>
                  <p className="text-gray-400 text-lg">No posts yet</p>
                  {profileData?._id === userData?._id && (
                    <p className="text-gray-500 text-sm mt-2">
                      Start sharing your thoughts!
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  {profilePosts.map((post) => (
                    <div key={post._id} className="border-b border-slate-700 pb-6 last:border-0">
                      <Post {...post} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* RIGHT SIDEBAR */}
          <aside className="w-full lg:w-96 space-y-6">
            
            {/* Skills */}
            {skills.length > 0 && (
              <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-2xl p-6 border border-slate-700">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-white">
                  💡 Skills
                </h3>
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill, idx) => (
                    <span 
                      key={idx} 
                      className="bg-purple-500/20 text-purple-300 border border-purple-500/50 rounded-full px-4 py-2 text-sm font-medium hover:bg-purple-500/30 transition-all"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Education */}
            {education.length > 0 && (
              <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-2xl p-6 border border-slate-700">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-white">
                  🎓 Education
                </h3>
                <div className="space-y-4">
                  {education.map((edu, idx) => (
                    <div 
                      key={idx} 
                      className="bg-slate-700/50 rounded-xl p-4 border border-slate-600 hover:border-purple-500/50 transition-all"
                    >
                      <p className="font-bold text-white">{edu.college}</p>
                      <p className="text-sm text-gray-300 mt-1">
                        {edu.degree} - {edu.fieldOfStudy}
                      </p>
                      {edu.startYear && edu.endYear && (
                        <p className="text-xs text-gray-400 mt-1">
                          {edu.startYear} - {edu.endYear}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Experience */}
            {experience.length > 0 && (
              <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-2xl p-6 border border-slate-700">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-white">
                  💼 Experience
                </h3>
                <div className="space-y-4">
                  {experience.map((exp, idx) => (
                    <div 
                      key={idx} 
                      className="bg-slate-700/50 rounded-xl p-4 border border-slate-600 hover:border-purple-500/50 transition-all"
                    >
                      <p className="font-bold text-white">{exp.title}</p>
                      <p className="text-sm text-gray-300 mt-1">{exp.company}</p>
                      {exp.description && (
                        <p className="text-sm text-gray-400 mt-2">{exp.description}</p>
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