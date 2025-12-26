import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { BrowserRouter } from 'react-router-dom';
import axios from 'axios';  // ✅ Import axios

import AuthContext from './context/AuthContext.jsx';
import UserContext from './context/UserContext.jsx';
import { CallProvider } from './context/CallContext.jsx';

// ✅ CRITICAL: Set axios defaults
axios.defaults.baseURL = import.meta.env.VITE_SERVER_URL || 'http://localhost:8000';
axios.defaults.withCredentials = true;

// ✅ Add token to all requests
const token = localStorage.getItem('token');
if (token) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

console.log('🔗 Frontend connecting to:', axios.defaults.baseURL);  // Debug log

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <AuthContext>
      <UserContext>
        <CallProvider>
          <App />
        </CallProvider>
      </UserContext>
    </AuthContext>
  </BrowserRouter>
);