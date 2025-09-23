import dotenv from "dotenv";
dotenv.config({ path: "./.env" });

import express from "express";
import connectDb from "./config/db.js";
import authRouter from "./routes/auth.routes.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import userRouter from "./routes/user.routes.js";
import postRouter from "./routes/post.routes.js";
import connectionRouter from "./routes/connection.routes.js";
import notificationRouter from "./routes/notification.routes.js";
import aiRoutes from "./routes/ai.routes.js";
import jobRoutes from "./routes/job.routes.js";
import chatRoutes from "./routes/chat.routes.js";
import agoraRoutes from "./routes/agora.routes.js";
import http from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import Message from "./models/Message.js";

// -------------------- APP + SERVER --------------------
const app = express();
const server = http.createServer(app);

const allowedOrigins = [
  "http://localhost:5173",
  "https://upgradedglobal-connect-1.onrender.com"
];

export const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
});

// -------------------- MIDDLEWARE --------------------
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

const port = process.env.PORT || 8000;

// -------------------- API ROUTES --------------------
app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.use("/api/post", postRouter);
app.use("/api/connection", connectionRouter);
app.use("/api/notification", notificationRouter);
app.use("/api/jobs", jobRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/agora", agoraRoutes);

// -------------------- SOCKET.IO LOGIC --------------------

// Maps - Keep your existing export name for compatibility
export const userSocketMap = new Map(); // userId -> socketId
const activeUsers = {}; // socketId -> { userId, email, lastSeen }

// Send online users
const sendOnlineUsers = () => {
  const users = Object.values(activeUsers).map((u) => ({
    id: u.userId,
    email: u.email,
    lastSeen: u.lastSeen,
  }));
  io.emit("onlineUsers", users);
};

// Find socket by userId
const findSocketByUserId = (userId) => {
  return userSocketMap.get(userId);
};

io.on("connection", (socket) => {
  console.log("⚡ New socket connected:", socket.id);

  // ---------------- Register User ----------------
  socket.on("join", ({ token, email, userId }) => {
    try {
      if (!userId || !token) {
        console.error("Missing userId or token");
        socket.emit("error", { message: "Missing authentication data" });
        socket.disconnect();
        return;
      }

      // Verify JWT
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Additional validation: ensure the userId matches the token
      if (decoded.userId !== userId && decoded.id !== userId) {
        console.error("User ID mismatch in token");
        socket.emit("error", { message: "Invalid authentication" });
        socket.disconnect();
        return;
      }

      // Remove old socket if same user already connected
      const oldSocketId = userSocketMap.get(userId);
      if (oldSocketId && oldSocketId !== socket.id) {
        console.log(`Removing old connection for user ${userId}: ${oldSocketId}`);
        if (activeUsers[oldSocketId]) {
          delete activeUsers[oldSocketId];
        }
        userSocketMap.delete(userId);
        // Disconnect the old socket
        const oldSocket = io.sockets.sockets.get(oldSocketId);
        if (oldSocket) {
          oldSocket.disconnect();
        }
      }

      // Save new mapping
      userSocketMap.set(userId, socket.id);
      activeUsers[socket.id] = { userId, email, lastSeen: new Date() };

      console.log(`✅ Registered: ${userId} (${email}) -> ${socket.id}`);

      // Join user to their own room for private messages
      socket.join(`user_${userId}`);

      sendOnlineUsers();
    } catch (err) {
      console.error("❌ Auth failed:", err.message);
      socket.emit("error", { message: "Authentication failed" });
      socket.disconnect();
    }
  });

  // ---------------- Typing Indicator ----------------
  socket.on("typing", (receiverUserId) => {
    const receiverSocketId = findSocketByUserId(receiverUserId);
    if (receiverSocketId) {
      const senderEmail = activeUsers[socket.id]?.email;
      if (senderEmail) {
        io.to(receiverSocketId).emit("typing", senderEmail);
      }
    }
  });

  // ---------------- Private Chat ----------------
  socket.on("sendMessage", async ({ userId, to, text, timestamp }) => {
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

      const newMessage = new Message({
        from: userId,
        to,
        text: text.trim(),
        timestamp: timestamp || new Date().toISOString(),
      });
      await newMessage.save();
      console.log("💾 Message saved to database");

      const receiverSocketId = findSocketByUserId(to);
      const msg = {
        from: userId,
        text: text.trim(),
        timestamp: timestamp || new Date().toISOString(),
        user: senderData.email,
      };

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

  // ---------------- Agora Call System ----------------
  socket.on("agoraCallUser", ({ to, channelName, callType, from, email }) => {
    try {
      const callerData = activeUsers[socket.id];
      if (!callerData || callerData.userId !== from) {
        console.error("Unauthorized call attempt");
        socket.emit("error", { message: "Unauthorized call attempt" });
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
    try {
      const callerSocketId = findSocketByUserId(to);
      if (callerSocketId) {
        io.to(callerSocketId).emit("agoraCallAccepted");
        console.log(`✅ Call accepted notification sent to ${to}`);
      }
    } catch (error) {
      console.error("❌ Error processing call acceptance:", error.message);
    }
  });

  socket.on("agoraCallDeclined", ({ to }) => {
    try {
      const callerSocketId = findSocketByUserId(to);
      if (callerSocketId) {
        io.to(callerSocketId).emit("agoraCallDeclined");
        console.log(`❌ Call declined notification sent to ${to}`);
      }
    } catch (error) {
      console.error("❌ Error processing call decline:", error.message);
    }
  });

  socket.on("agoraEndCall", ({ to }) => {
    try {
      const receiverSocketId = findSocketByUserId(to);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("agoraEndCall");
        console.log(`📞 Call end notification sent to ${to}`);
      }
    } catch (error) {
      console.error("❌ Error processing call end:", error.message);
    }
  });

  // ---------------- Disconnect Handler ----------------
  socket.on("disconnect", (reason) => {
    console.log(`❌ Socket disconnected: ${socket.id}, Reason: ${reason}`);

    try {
      if (activeUsers[socket.id]) {
        const userData = activeUsers[socket.id];
        userData.lastSeen = new Date();

        userSocketMap.delete(userData.userId);
        delete activeUsers[socket.id];

        console.log(`🔄 Cleaned up user: ${userData.userId} (${userData.email})`);
        sendOnlineUsers();
      }
    } catch (error) {
      console.error("❌ Error during disconnect cleanup:", error.message);
    }
  });

  socket.on("error", (error) => {
    console.error(`❌ Socket error for ${socket.id}:`, error);
  });
});

// -------------------- GLOBAL ERROR HANDLERS --------------------
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("UncaughtException:", error);
  if (process.env.NODE_ENV !== "production") {
    process.exit(1);
  }
});

// -------------------- START SERVER --------------------
server.listen(port, () => {
  connectDb();
  console.log(`🚀 Server started on port ${port}`);
});
