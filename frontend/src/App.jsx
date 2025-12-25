import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useContext, useEffect } from 'react';
import axios from 'axios';

// Import pages
import Login from './pages/Login';
import Signup from './pages/Signup';
import Home from './pages/Home';
import Profile from './pages/Profile';
import Network from './pages/Network';
import Notification from './pages/Notification';
import ChatPage from './pages/ChatPage';
import JobBoard from './pages/JobBoard';
import Bookmarks from './pages/Bookmarks';
import Analytics from './pages/Analytics';

// Import components
import Nav from './components/Nav';

// Import contexts
import { userDataContext } from './context/UserContext';

function App() {
  const { userData, setUserData } = useContext(userDataContext);
  const navigate = useNavigate();

  // Configure axios defaults for all requests
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }, []);

  // Handle logout
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

  return (
    <div className="min-h-screen bg-slate-900">
      {userData && <Nav />}
      
      <Routes>
        {userData ? (
          <>
            <Route path="/" element={<Home />} />
            {/* ✅ FIXED: Profile route with optional userName parameter */}
            <Route path="/profile" element={<Profile />} />
            <Route path="/profile/:userName" element={<Profile />} />
            <Route path="/network" element={<Network />} />
            <Route path="/notification" element={<Notification />} />
            <Route path="/bookmarks" element={<Bookmarks />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/jobs" element={<JobBoard />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </>
        ) : (
          <>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </>
        )}
      </Routes>
    </div>
  );
}

export default App;