// src/api/axios.js
import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "https://local-guider-backend.onrender.com/api/v1";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 30000,
});

// ═══════════════════════════════════════════════════════════════
// ✅ FIX: Multi-tab BroadcastChannel — token sync across tabs
// ═══════════════════════════════════════════════════════════════
const AUTH_CHANNEL = "auth-sync";

let broadcastChannel = null;
try {
  if (typeof window !== "undefined" && "BroadcastChannel" in window) {
    broadcastChannel = new BroadcastChannel(AUTH_CHANNEL);

    // Listen for token updates from other tabs
    broadcastChannel.onmessage = (event) => {
      const { type, accessToken, refreshToken } = event.data || {};

      if (type === "TOKEN_REFRESHED" && accessToken) {
        localStorage.setItem("accessToken", accessToken);
        if (refreshToken) {
          localStorage.setItem("refreshToken", refreshToken);
        }
        console.log("🔄 Token synced from another tab");
      } else if (type === "LOGOUT") {
        console.log("🔒 Logout synced from another tab");
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
        window.dispatchEvent(new CustomEvent("auth:logout"));
      }
    };
  }
} catch (e) {
  console.warn("BroadcastChannel not available:", e.message);
}

const broadcastTokenUpdate = (accessToken, refreshToken) => {
  if (broadcastChannel) {
    broadcastChannel.postMessage({
      type: "TOKEN_REFRESHED",
      accessToken,
      refreshToken,
    });
  }
};

export const broadcastLogout = () => {
  if (broadcastChannel) {
    broadcastChannel.postMessage({ type: "LOGOUT" });
  }
};

// ═══════════════════════════════════════════════════════════════
// REFRESH QUEUE — prevent parallel refresh calls
// ═══════════════════════════════════════════════════════════════
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

// ═══════════════════════════════════════════════════════════════
// REQUEST INTERCEPTOR
// ═══════════════════════════════════════════════════════════════
apiClient.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem("accessToken");
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    if (import.meta.env.DEV) {
      console.log(`[API →] ${config.method?.toUpperCase()} ${config.url}`);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ═══════════════════════════════════════════════════════════════
// RESPONSE INTERCEPTOR
// ═══════════════════════════════════════════════════════════════
apiClient.interceptors.response.use(
  (response) => {
    if (import.meta.env.DEV) {
      console.log(`[API ←] ${response.status} ${response.config.url}`);
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    if (!originalRequest) {
      return Promise.reject(error);
    }

    // Network retry — 1s delay
    if (
      !originalRequest._networkRetry &&
      (error.code === "ECONNABORTED" ||
        error.code === "ERR_NETWORK" ||
        !error.response)
    ) {
      originalRequest._networkRetry = true;
      console.warn("[API] Retrying after network error...");
      await new Promise((r) => setTimeout(r, 1000));
      return apiClient(originalRequest);
    }

    // 401 refresh flow
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (originalRequest.url?.includes("/auth/refresh-token")) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem("refreshToken");
        if (!refreshToken) throw new Error("No refresh token");

        const res = await axios.post(
          `${API_BASE_URL}/auth/refresh-token`,
          { refreshToken },
          { timeout: 30000 }
        );

        const newAccessToken =
          res.data?.data?.accessToken || res.data?.accessToken;
        if (!newAccessToken) throw new Error("No access token in response");

        localStorage.setItem("accessToken", newAccessToken);

        // ✅ FIX: Broadcast to other tabs
        broadcastTokenUpdate(newAccessToken, refreshToken);

        processQueue(null, newAccessToken);

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);

        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");

        // ✅ FIX: Broadcast logout to other tabs
        broadcastLogout();

        // ✅ FIX: Dispatch custom event
        window.dispatchEvent(new CustomEvent("auth:logout"));

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;