import dotenv from "dotenv";
import express from "express";
import http from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";
import { fileURLToPath } from 'url';

// Local imports
import connectDb from "./config/db.js";
import authRouter from "./routes/auth.routes.js";
import userRouter from "./routes/user.routes.js";
import postRouter from "./routes/post.routes.js";
import connectionRouter from "./routes/connection.routes.js";
import notificationRouter from "./routes/notification.routes.js";
import aiRoutes from "./routes/ai.routes.js";
import jobRoutes from "./routes/job.routes.js";
import chatRoutes from "./routes/chat.routes.js";
import agoraRoutes from "./routes/agora.routes.js";
import Message from "./models/Message.js";

dotenv.config({ path: "./.env" });

const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 8000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ==================== MIDDLEWARE ====================
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser());

// ==================== SERVE FRONTEND ====================
app.use(express.static(path.join(__dirname, 'dist')));

// ==================== CORS CONFIGURATION ====================
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:3000',
      process.env.FRONTEND_URL
    ].filter(Boolean);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      // For same-origin deployment
      callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie']
};

// Apply CORS to all API routes
app.use("/api", cors(corsOptions));
app.options("*", cors(corsOptions)); // Handle preflight requests

// ==================== API ROUTES ====================
app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.use("/api/post", postRouter);
app.use("/api/connection", connectionRouter);
app.use("/api/notification", notificationRouter);
app.use("/api/jobs", jobRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/agora", agoraRoutes);

// ==================== SOCKET.IO SETUP ====================
export const io = new Server(server, {
  cors: corsOptions,
  pingTimeout: 60000,
  pingInterval: 25000
});

export const userSocketMap = new Map();
const activeUsers = {};

const sendOnlineUsers = () => {
  const users = Object.values(activeUsers).map((u) => ({
    id: u.userId,
    email: u.email,
    lastSeen: u.lastSeen,
  }));
  io.emit("onlineUsers", users);
};

const findSocketByUserId = (userId) => {
  return userSocketMap.get(userId);
};

io.on("connection", (socket) => {
  console.log("⚡ New socket connected:", socket.id);

  socket.on("join", ({ token, email, userId }) => {
    try {
      if (!userId || !token) {
        console.error("Missing userId or token");
        socket.emit("error", { message: "Missing authentication data" });
        return;
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      if (decoded.userId !== userId && decoded.id !== userId) {
        console.error("User ID mismatch in token");
        socket.emit("error", { message: "Invalid authentication" });
        return;
      }

      // Remove old socket if exists
      const oldSocketId = userSocketMap.get(userId);
      if (oldSocketId && oldSocketId !== socket.id) {
        console.log(`Removing old connection for user ${userId}: ${oldSocketId}`);
        const oldSocket = io.sockets.sockets.get(oldSocketId);
        if (oldSocket) {
          oldSocket.disconnect(true);
        }
      }

      userSocketMap.set(userId, socket.id);
      activeUsers[socket.id] = { userId, email, lastSeen: new Date() };

      console.log(`✅ Registered: ${userId} (${email}) -> ${socket.id}`);
      
      socket.join(`user_${userId}`);
      
      sendOnlineUsers();
    } catch (err) {
      console.error("❌ Auth failed:", err.message);
      socket.emit("error", { message: "Authentication failed" });
      socket.disconnect();
    }
  });

  socket.on("sendMessage", async ({ userId, to, text }) => {
    try {
      const senderData = activeUsers[socket.id];
      if (!senderData || senderData.userId !== userId) {
        console.error("Unauthorized message send attempt");
        socket.emit("error", { message: "Unauthorized" });
        return;
      }

      if (!text || !text.trim()) {
        console.error("Empty message");
        return;
      }

      const timestamp = new Date();
      
      const newMessage = new Message({
        from: userId,
        to,
        text: text.trim(),
        timestamp,
      });
      await newMessage.save();
      console.log("💾 Message saved to database");

      const receiverSocketId = findSocketByUserId(to);
      const msg = {
        from: userId,
        text: text.trim(),
        timestamp: timestamp.toISOString(),
        user: senderData.email,
      };

      socket.emit("message", msg);

      if (receiverSocketId) {
        io.to(receiverSocketId).emit("message", msg);
        console.log(`📤 Message sent from ${userId} to ${to}`);
      } else {
        console.log(`❌ User ${to} is offline - message saved but not delivered`);
      }
    } catch (error) {
      console.error("❌ Failed to process message:", error.message);
      socket.emit("error", { message: "Failed to send message" });
    }
  });

  socket.on("agoraCallUser", ({ to, channelName, callType, from, email }) => {
    try {
      const callerData = activeUsers[socket.id];
      if (!callerData || callerData.userId !== from) {
        console.error("Unauthorized call attempt");
        socket.emit("agoraCallFailed", { message: "Unauthorized call attempt" });
        return;
      }

      console.log(`📞 Call: ${from} -> ${to} (${callType}), Channel: ${channelName}`);
      const receiverSocketId = findSocketByUserId(to);

      if (receiverSocketId) {
        io.to(receiverSocketId).emit("agoraCallUser", {
          channelName,
          callType,
          from,
          email: callerData.email,
        });
        console.log(`📞 Call notification sent to ${to}`);
      } else {
        console.log(`❌ User ${to} offline`);
        socket.emit("agoraCallFailed", { message: "User is offline" });
      }
    } catch (error) {
      console.error("❌ Error processing call:", error.message);
      socket.emit("agoraCallFailed", { message: "Call failed" });
    }
  });

  socket.on("agoraCallAccepted", ({ to }) => {
    const callerSocketId = findSocketByUserId(to);
    if (callerSocketId) {
      io.to(callerSocketId).emit("agoraCallAccepted");
      console.log(`✅ Call accepted notification sent to ${to}`);
    }
  });

  socket.on("agoraCallDeclined", ({ to }) => {
    const callerSocketId = findSocketByUserId(to);
    if (callerSocketId) {
      io.to(callerSocketId).emit("agoraCallDeclined");
      console.log(`❌ Call declined notification sent to ${to}`);
    }
  });

  socket.on("agoraEndCall", ({ to }) => {
    const receiverSocketId = findSocketByUserId(to);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("agoraEndCall");
      console.log(`📞 Call end notification sent to ${to}`);
    }
  });
  
  socket.on("typing", (receiverUserId) => {
    const receiverSocketId = findSocketByUserId(receiverUserId);
    if (receiverSocketId) {
      const senderEmail = activeUsers[socket.id]?.email;
      if (senderEmail) {
        io.to(receiverSocketId).emit("typing", senderEmail);
      }
    }
  });

  socket.on("disconnect", (reason) => {
    console.log(`❌ Socket disconnected: ${socket.id}, Reason: ${reason}`);
    
    if (activeUsers[socket.id]) {
      const userData = activeUsers[socket.id];
      userData.lastSeen = new Date();

      userSocketMap.delete(userData.userId);
      delete activeUsers[socket.id];
      
      console.log(`🔄 Cleaned up user: ${userData.userId} (${userData.email})`);
      sendOnlineUsers();
    }
  });

  socket.on("error", (error) => {
    console.error(`❌ Socket error for ${socket.id}:`, error);
  });
});

// ==================== CATCH-ALL FOR FRONTEND ====================
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// ==================== ERROR HANDLERS ====================
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('UncaughtException:', error);
  if (process.env.NODE_ENV !== 'production') {
    process.exit(1);
  }
});

// ==================== START SERVER ====================
server.listen(port, () => {
  connectDb();
  console.log(`🚀 Server started on port ${port}`);
});