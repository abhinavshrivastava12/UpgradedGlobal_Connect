// src/services/socket.js
import { io } from "socket.io-client";

// Pass auth.userId if you have it at init time; otherwise call register() after login.
export const makeSocket = (serverUrl, userId) => {
  const socket = io(serverUrl, {
    withCredentials: true,
    auth: userId ? { userId } : undefined
  });

  const register = (id) => socket.emit("register", id);
  return { socket, register };
};
