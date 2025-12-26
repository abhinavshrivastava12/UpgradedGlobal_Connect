import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import cookieParser from 'cookie-parser';
import Message from './models/Message.js';

dotenv.config();

const app = express();
const server = http.createServer(app);

// ✅ FIXED: Dynamic CORS configuration
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

console.log('🌍 Configured CLIENT_URL:', CLIENT_URL);  // Debug log

const io = new Server(server, {
  cors: {
    origin: CLIENT_URL,  // Ab yeh .env se aayega
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000
});

// ✅ FIXED: Dynamic CORS for Express
app.use(cors({
  origin: CLIENT_URL,
  credentials: true
}));

app.use(cookieParser());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// MongoDB connection
mongoose.connect(process.env.MONGODB_URL)
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));

// Socket.io
export const userSocketMap = new Map();

io.on('connection', (socket) => {
  console.log('✅ User connected:', socket.id);

  socket.on('join', ({ userId, email, token }) => {
    if (userId) {
      userSocketMap.set(userId, socket.id);
      socket.userId = userId;
      socket.email = email;
      console.log('👤 User registered:', userId);
      
      io.emit('onlineUsers', Array.from(userSocketMap.keys()));
      io.emit('active-users', Array.from(userSocketMap.keys()));
    }
  });

  socket.on('sendMessage', async (data) => {
    console.log('📨 Message received:', data);
    
    try {
      const message = await Message.create({
        from: data.from,
        to: data.to,
        text: data.text,
        image: data.image || null,
        timestamp: new Date()
      });

      await message.populate('from', 'firstName lastName userName profileImage');
      await message.populate('to', 'firstName lastName userName profileImage');

      const messageData = {
        _id: message._id.toString(),
        from: {
          _id: message.from._id.toString(),
          firstName: message.from.firstName,
          lastName: message.from.lastName,
          userName: message.from.userName,
          profileImage: message.from.profileImage
        },
        to: {
          _id: message.to._id.toString(),
          firstName: message.to.firstName,
          lastName: message.to.lastName,
          userName: message.to.userName,
          profileImage: message.to.profileImage
        },
        text: message.text,
        image: message.image,
        timestamp: message.timestamp,
        readAt: message.readAt
      };

      const recipientSocketId = userSocketMap.get(data.to);
      if (recipientSocketId) {
        io.to(recipientSocketId).emit('receiveMessage', messageData);
      }

      socket.emit('messageSent', messageData);

    } catch (error) {
      console.error('Message save error:', error);
      socket.emit('messageError', { error: 'Failed to send message' });
    }
  });

  socket.on('typing', (recipientId) => {
    const recipientSocketId = userSocketMap.get(recipientId);
    if (recipientSocketId && socket.userId) {
      io.to(recipientSocketId).emit('userTyping', {
        userId: socket.userId,
        email: socket.email
      });
    }
  });

  socket.on('stopTyping', (recipientId) => {
    const recipientSocketId = userSocketMap.get(recipientId);
    if (recipientSocketId && socket.userId) {
      io.to(recipientSocketId).emit('userStoppedTyping', socket.userId);
    }
  });

  socket.on('callUser', (data) => {
    const recipientSocketId = userSocketMap.get(data.userToCall);
    if (recipientSocketId) {
      io.to(recipientSocketId).emit('incomingCall', {
        signal: data.signalData,
        from: data.from,
        callerInfo: data.callerInfo
      });
    }
  });

  socket.on('answerCall', (data) => {
    const callerSocketId = userSocketMap.get(data.to);
    if (callerSocketId) {
      io.to(callerSocketId).emit('callAccepted', {
        signal: data.signal,
        from: socket.userId
      });
    }
  });

  socket.on('rejectCall', (data) => {
    const callerSocketId = userSocketMap.get(data.to);
    if (callerSocketId) {
      io.to(callerSocketId).emit('callRejected', {
        from: socket.userId
      });
    }
  });

  socket.on('endCall', (data) => {
    const recipientSocketId = userSocketMap.get(data.to);
    if (recipientSocketId) {
      io.to(recipientSocketId).emit('callEnded', {
        from: socket.userId
      });
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
import agoraRoutes from './routes/agora.routes.js';
import storyRoutes from './routes/story.routes.js';
import bookmarkRoutes from './routes/bookmark.routes.js';
import hashtagRoutes from './routes/hashtag.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import statusRoutes from './routes/status.routes.js';
import reactionRoutes from './routes/reaction.routes.js';

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/post', postRoutes);
app.use('/api/user', userRoutes);
app.use('/api/connection', connectionRoutes);
app.use('/api/notification', notificationRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/agora', agoraRoutes);
app.use('/api/stories', storyRoutes);
app.use('/api/bookmarks', bookmarkRoutes);
app.use('/api/hashtags', hashtagRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/status', statusRoutes);
app.use('/api/reactions', reactionRoutes);

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
  console.log(`🔗 Client URL: ${CLIENT_URL}`);
});

export { io };