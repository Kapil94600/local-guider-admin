// src/socket/socket.js
import { io } from "socket.io-client";

let socket = null;
const onlineUsers = new Map();

const getSocketUrl = () => {
  const API_URL =
    import.meta.env.VITE_API_URL ||
    "https://local-guider-backend.onrender.com/api/v1";
  return API_URL.replace(/\/api\/v1\/?$/, "");
};

export const initSocket = (token) => {
  if (!token) {
    console.warn("⚠️ initSocket called without token — aborting");
    return null;
  }

  // Reuse existing socket if same token
  if (socket && socket.auth?.token === token) {
    if (!socket.connected) socket.connect();
    return socket;
  }

  // Tear down old
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }

  // ═══════════════════════════════════════════════════════════════
  // ✅ FIX C-2: Transport order — polling first, then upgrade
  // (Previously: websocket first → fails on corporate WiFi / proxies)
  // ═══════════════════════════════════════════════════════════════
  socket = io(getSocketUrl(), {
    auth: { token },
    transports: ["polling", "websocket"], // ✅ FIXED ORDER
    upgrade: true,
    rememberUpgrade: false,
    reconnection: true,
    reconnectionAttempts: 30,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    withCredentials: true,
    timeout: 20000,
    path: "/socket.io",
  });

  socket.on("connect", () => {
    console.log("🔌 Socket connected (authenticated):", socket.id);
    console.log(
      "   transport:",
      socket.io.engine?.transport?.name || "unknown"
    );
  });

  socket.on("connect_error", (err) => {
    console.error("❌ Socket auth error:", err.message);
    if (err.message?.includes("Authentication")) {
      socket.disconnect();
      socket = null;
    }
  });

  socket.on("disconnect", (reason) => {
    console.log("❌ Socket disconnected:", reason);
  });

  // Track upgrade
  socket.io.on("upgrade", (transport) => {
    console.log("⬆️ Transport upgraded to:", transport.name);
  });

  socket.io.on("upgradeError", (err) => {
    console.warn("⚠️ Upgrade failed (staying on polling):", err?.message);
  });

  return socket;
};

export const getIO = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
  onlineUsers.clear();
};

export const getOnlineUsers = () => Array.from(onlineUsers.keys());