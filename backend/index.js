import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import cookieParser from 'cookie-parser';

dotenv.config();

const app = express();
const server = http.createServer(app);

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? process.env.CLIENT_URL 
      : 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000
});

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.CLIENT_URL 
    : 'http://localhost:5173',
  credentials: true
}));
app.use(cookieParser());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// MongoDB connection
mongoose.connect(process.env.MONGODB_URL)
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));

// Socket.io connection handling
export const userSocketMap = new Map();

io.on('connection', (socket) => {
  console.log('✅ User connected:', socket.id);

  socket.on('join', ({ userId, email, token }) => {
    if (userId) {
      userSocketMap.set(userId, socket.id);
      socket.userId = userId;
      console.log('👤 User registered:', userId);
      
      // Emit online users list
      io.emit('onlineUsers', Array.from(userSocketMap.keys()));
    }
  });

  socket.on('user-connected', (userId) => {
    if (userId) {
      userSocketMap.set(userId, socket.id);
      socket.userId = userId;
      io.emit('active-users', Array.from(userSocketMap.keys()));
      console.log('👤 User connected:', userId);
    }
  });

  socket.on('sendMessage', (data) => {
    console.log('📨 Sending message:', data);
    const recipientSocketId = userSocketMap.get(data.to);
    if (recipientSocketId) {
      io.to(recipientSocketId).emit('message', {
        from: data.userId,
        user: data.user || data.userId,
        text: data.text,
        timestamp: data.timestamp || new Date().toISOString(),
        id: data.id || Date.now()
      });
    }
  });

  socket.on('send-message', (data) => {
    console.log('📨 Sending message (v2):', data);
    const recipientSocketId = userSocketMap.get(data.recipientId);
    if (recipientSocketId) {
      io.to(recipientSocketId).emit('receive-message', data);
    }
  });

  socket.on('typing', (recipientId) => {
    const recipientSocketId = userSocketMap.get(recipientId);
    if (recipientSocketId && socket.userId) {
      io.to(recipientSocketId).emit('typing', socket.userId);
    }
  });

  socket.on('new-post', (post) => {
    socket.broadcast.emit('post-created', post);
  });

  socket.on('post-liked', (data) => {
    const authorSocketId = userSocketMap.get(data.authorId);
    if (authorSocketId) {
      io.to(authorSocketId).emit('post-like-notification', data);
    }
  });

  // Video call events
  socket.on('callUser', (data) => {
    const recipientSocketId = userSocketMap.get(data.userToCall);
    if (recipientSocketId) {
      io.to(recipientSocketId).emit('callUser', {
        signal: data.signalData,
        from: data.from
      });
    }
  });

  socket.on('answerCall', (data) => {
    const callerSocketId = userSocketMap.get(data.to);
    if (callerSocketId) {
      io.to(callerSocketId).emit('callAccepted', data.signal);
    }
  });

  socket.on('endCall', (data) => {
    const recipientSocketId = userSocketMap.get(data.to);
    if (recipientSocketId) {
      io.to(recipientSocketId).emit('callEnded');
    }
  });

  socket.on('disconnect', () => {
    if (socket.userId) {
      userSocketMap.delete(socket.userId);
      io.emit('active-users', Array.from(userSocketMap.keys()));
      io.emit('onlineUsers', Array.from(userSocketMap.keys()));
      console.log('❌ User disconnected:', socket.userId);
    }
  });
});

app.set('io', io);

// Import routes
import authRoutes from './routes/auth.routes.js';
import postRoutes from './routes/post.routes.js';
import userRoutes from './routes/user.routes.js';
import connectionRoutes from './routes/connection.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import chatRoutes from './routes/chat.routes.js';
import jobRoutes from './routes/job.routes.js';
import aiRoutes from './routes/ai.routes.js';

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/post', postRoutes);
app.use('/api/user', userRoutes);
app.use('/api/connection', connectionRoutes);
app.use('/api/notification', notificationRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/ai', aiRoutes);

app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Server is running',
    socketConnected: io.engine.clientsCount
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

const PORT = process.env.PORT || 8000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Socket.io ready for connections`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

export { io };