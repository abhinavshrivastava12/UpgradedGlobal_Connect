// src/services/socket.js
import { io } from "socket.io-client";

let socket;

export const initSocket = (serverUrl, { userId, email, token }) => {
  if (!userId || !token) return null; // prevent unauthed socket

  socket = io(serverUrl, {
    withCredentials: true,
    autoConnect: true, // connect manually after registration
  });

  const register = () => {
    socket.emit("join", { userId, email, token });
  };

  // Optional: reconnect on disconnect
  socket.on("connect", () => {
    console.log("✅ Socket connected:", socket.id);
    register();
  });

  socket.on("disconnect", (reason) => {
    console.log("❌ Socket disconnected:", reason);
  });

  socket.on("error", (err) => {
    console.error("❌ Socket error:", err);
  });

  return socket;
};
