import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { BrowserRouter } from 'react-router-dom';
import axios from 'axios';

import AuthContext from './context/AuthContext.jsx';
import UserContext from './context/UserContext.jsx';
import { CallProvider } from './context/CallContext.jsx';

// ✅ CRITICAL: Correct backend URL without trailing slash
const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:8000';
axios.defaults.baseURL = SERVER_URL;
axios.defaults.withCredentials = true;

const token = localStorage.getItem('token');
if (token) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

console.log('🔗 Frontend connecting to:', axios.defaults.baseURL);

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