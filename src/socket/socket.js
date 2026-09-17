// src/socket/socket.js
import { Server } from "socket.io";

let io = null;
const onlineUsers = new Map(); // userId -> Set of socketIds

export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: "*", // tighten in production
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log("🔌 Socket connected:", socket.id);

    // Client sends "register" with their userId
    socket.on("register", (userId) => {
      if (!userId) return;
      const room = `user:${userId}`;
      socket.join(room);

      // Track online users
      if (!onlineUsers.has(userId)) {
        onlineUsers.set(userId, new Set());
      }
      onlineUsers.get(userId).add(socket.id);

      // Broadcast presence
      io.emit("presence:update", { userId, isOnline: true });

      console.log(`✅ User ${userId} registered on socket ${socket.id}`);
    });

    // Typing indicator
    socket.on("chat:typing", ({ conversationId, receiverId, isTyping, userId }) => {
      if (!receiverId) return;
      io.to(`user:${receiverId}`).emit("chat:typing", {
        conversationId,
        userId,
        isTyping,
      });
    });

    // Read receipt
    socket.on("chat:read", ({ conversationId, senderId, userId }) => {
      if (!senderId) return;
      io.to(`user:${senderId}`).emit("chat:read", {
        conversationId,
        readBy: userId,
        readAt: new Date(),
      });
    });

    socket.on("disconnect", () => {
      // Remove socket from any user's Set
      for (const [userId, sockets] of onlineUsers.entries()) {
        if (sockets.has(socket.id)) {
          sockets.delete(socket.id);
          if (sockets.size === 0) {
            onlineUsers.delete(userId);
            io.emit("presence:update", { userId, isOnline: false });
          }
          break;
        }
      }
      console.log("❌ Socket disconnected:", socket.id);
    });
  });

  return io;
};

export const getIO = () => io;

export const getOnlineUsers = () => Array.from(onlineUsers.keys());