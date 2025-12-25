import React, { useContext } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Home, Users, Bell, Briefcase, MessageCircle, LogOut, User, Bookmark, BarChart3 } from 'lucide-react';
import { userDataContext } from '../context/UserContext';
import axios from 'axios';

const dp = 'https://ui-avatars.com/api/?name=User&size=200&background=6366f1&color=fff';

function Nav() {
  const { userData, setUserData } = useContext(userDataContext);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await axios.get('/api/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      localStorage.removeItem('email');
      delete axios.defaults.headers.common['Authorization'];
      setUserData(null);
      navigate('/login');
    }
  };

  const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/network', icon: Users, label: 'Network' },
    { path: '/jobs', icon: Briefcase, label: 'Jobs' },
    { path: '/chat', icon: MessageCircle, label: 'Messages' },
    { path: '/notification', icon: Bell, label: 'Notifications' },
    { path: '/bookmarks', icon: Bookmark, label: 'Saved' },
    { path: '/analytics', icon: BarChart3, label: 'Analytics' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-700 shadow-2xl">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="text-white font-bold text-xl">G</span>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent hidden sm:block">
              Global Connect
            </span>
          </Link>

          {/* Navigation Items */}
          <div className="flex items-center gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all ${
                    isActive 
                      ? 'bg-purple-600 text-white' 
                      : 'text-gray-300 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs font-medium hidden md:block">{item.label}</span>
                </Link>
              );
            })}

            {/* Profile Dropdown */}
            <div className="relative group ml-2">
              <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-700 transition-all">
                <img
                  src={userData?.profileImage || dp}
                  alt="Profile"
                  className="w-8 h-8 rounded-full border-2 border-purple-500 object-cover"
                />
                <span className="text-sm font-medium text-gray-300 hidden lg:block">
                  {userData?.firstName || 'User'}
                </span>
              </button>

              {/* Dropdown Menu */}
              <div className="absolute right-0 top-full mt-2 w-48 bg-slate-800 rounded-xl shadow-2xl border border-slate-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                {/* ✅ FIXED: Profile link now goes to /profile without userName */}
                <Link
                  to="/profile"
                  className="flex items-center gap-3 px-4 py-3 hover:bg-slate-700 rounded-t-xl transition-all text-gray-300 hover:text-white"
                >
                  <User className="w-4 h-4" />
                  <span className="text-sm">My Profile</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-700 rounded-b-xl transition-all text-red-400 hover:text-red-300"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="text-sm">Logout</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Nav;