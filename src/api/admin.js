// src/api/admin.js
// ═══════════════════════════════════════════════════════════════
// ADMIN API — all admin endpoints
// ═══════════════════════════════════════════════════════════════
import apiClient from "./axios";

// ═══════════════════════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════════════════════
export const getDashboardStats = () => apiClient.get("/admin/dashboard");

// ═══════════════════════════════════════════════════════════════
// USERS
// ═══════════════════════════════════════════════════════════════
export const getUsers = (params) =>
  apiClient.get("/admin/users", { params });
export const getUserById = (id) => apiClient.get(`/admin/users/${id}`);
export const getUser = getUserById;
export const updateUserStatus = (id, isActive) =>
  apiClient.put(`/admin/users/${id}/status`, { isActive });
export const deleteUser = (id) => apiClient.delete(`/admin/users/${id}`);

// ═══════════════════════════════════════════════════════════════
// BLOCK / UNBLOCK
// ═══════════════════════════════════════════════════════════════
export const blockUser = (blockedUserId, reason = "Admin block") =>
  apiClient.post("/blocks", { blockedUserId, reason });
export const unblockUser = (blockId) =>
  apiClient.delete(`/blocks/${blockId}`);
export const unblockUserByUserId = (blockedUserId) =>
  apiClient.delete(`/blocks/by-user/${blockedUserId}`);
export const getBlocks = () => apiClient.get("/blocks");

// ═══════════════════════════════════════════════════════════════
// GUIDERS
// ═══════════════════════════════════════════════════════════════
export const getGuiders = (params) =>
  apiClient.get("/admin/guiders", { params });
export const getGuiderById = (id) => apiClient.get(`/admin/guiders/${id}`);
export const updateGuiderStatus = (id, isActive) =>
  apiClient.put(`/admin/guiders/${id}/status`, { isActive });
export const deleteGuider = (id) => apiClient.delete(`/admin/guiders/${id}`);
export const createGuider = (data) => apiClient.post("/admin/guiders", data);
export const updateGuider = (id, data) =>
  apiClient.put(`/admin/guiders/${id}`, data);

// ═══════════════════════════════════════════════════════════════
// PHOTOGRAPHERS
// ═══════════════════════════════════════════════════════════════
export const getPhotographers = (params) =>
  apiClient.get("/admin/photographers", { params });
export const getPhotographerById = (id) =>
  apiClient.get(`/admin/photographers/${id}`);
export const updatePhotographerStatus = (id, isActive) =>
  apiClient.put(`/admin/photographers/${id}/status`, { isActive });
export const deletePhotographer = (id) =>
  apiClient.delete(`/admin/photographers/${id}`);
export const createPhotographer = (data) =>
  apiClient.post("/admin/photographers", data);
export const updatePhotographer = (id, data) =>
  apiClient.put(`/admin/photographers/${id}`, data);

// ═══════════════════════════════════════════════════════════════
// ✅ PLACES — Admin endpoints
// ═══════════════════════════════════════════════════════════════
export const getPlaces = (params) =>
  apiClient.get("/admin/places", { params });        // ✅ admin route
export const getPlaceById = (id) =>
  apiClient.get(`/admin/places/${id}`);              // ✅ admin route
export const createPlace = (data) =>
  apiClient.post("/admin/places", data);             // ✅ admin route
export const updatePlace = (id, data) =>
  apiClient.put(`/admin/places/${id}`, data);        // ✅ admin route
export const updatePlaceStatus = (id, isActive) =>
  apiClient.put(`/admin/places/${id}/status`, { isActive }); // ✅ admin route
export const deletePlace = (id) =>
  apiClient.delete(`/admin/places/${id}`);           // ✅ admin route

// ═══════════════════════════════════════════════════════════════
// SLIDERS
// ═══════════════════════════════════════════════════════════════
export const getSliders = (params) =>
  apiClient.get("/sliders", { params });
export const getSliderById = (id) => apiClient.get(`/sliders/${id}`);
export const createSlider = (data) => apiClient.post("/sliders", data);
export const updateSlider = (id, data) =>
  apiClient.put(`/sliders/${id}`, data);
export const deleteSlider = (id) => apiClient.delete(`/sliders/${id}`);

// ═══════════════════════════════════════════════════════════════
// OFFERS
// ═══════════════════════════════════════════════════════════════
export const getOffers = (params) =>
  apiClient.get("/offers", { params });
export const getOfferById = (id) => apiClient.get(`/offers/${id}`);
export const createOffer = (data) => apiClient.post("/offers", data);
export const updateOffer = (id, data) =>
  apiClient.put(`/offers/${id}`, data);
export const deleteOffer = (id) => apiClient.delete(`/offers/${id}`);

// ═══════════════════════════════════════════════════════════════
// ID CARDS
// ═══════════════════════════════════════════════════════════════
export const getIdCards = (params) =>
  apiClient.get("/id-cards", { params });
export const getIdCardById = (id) => apiClient.get(`/id-cards/${id}`);
export const revokeIdCard = (id) =>
  apiClient.put(`/id-cards/${id}/revoke`);

// ═══════════════════════════════════════════════════════════════
// NOTIFICATIONS
// ═══════════════════════════════════════════════════════════════
export const getNotifications = (params) =>
  apiClient.get("/admin/notifications", { params });
export const sendBroadcastNotification = (data) =>
  apiClient.post("/admin/notifications/send", data);

// ═══════════════════════════════════════════════════════════════
// REVIEWS
// ═══════════════════════════════════════════════════════════════
export const getReviews = (params) =>
  apiClient.get("/admin/reviews", { params });
export const getReviewById = (id) => apiClient.get(`/admin/reviews/${id}`);
export const updateReviewStatus = (id, isActive) =>
  apiClient.put(`/admin/reviews/${id}/status`, { isActive });
export const deleteReview = (id) =>
  apiClient.delete(`/admin/reviews/${id}`);

// ═══════════════════════════════════════════════════════════════
// BOOKINGS
// ═══════════════════════════════════════════════════════════════
export const getBookings = (params) =>
  apiClient.get("/admin/bookings", { params });
export const getBookingById = (id) => apiClient.get(`/admin/bookings/${id}`);
export const updateBookingStatus = (id, status, notes) =>
  apiClient.put(`/admin/bookings/${id}/status`, { status, notes });

// ═══════════════════════════════════════════════════════════════
// ROLE REQUESTS
// ═══════════════════════════════════════════════════════════════
export const getRoleRequests = (params) =>
  apiClient.get("/admin/role-requests", { params });
export const approveRoleRequest = (id) =>
  apiClient.put(`/admin/role-requests/${id}/status`, { status: "APPROVED" });
export const rejectRoleRequest = (id, adminMessage) =>
  apiClient.put(`/admin/role-requests/${id}/status`, {
    status: "REJECTED",
    adminMessage,
  });
export const updateRoleRequestDocs = (id, data) =>
  apiClient.put(`/role-requests/${id}`, data);

// ═══════════════════════════════════════════════════════════════
// PAYMENTS
// ═══════════════════════════════════════════════════════════════
export const getPayments = (params) =>
  apiClient.get("/payments/admin", { params });
export const getPaymentById = (id) =>
  apiClient.get(`/payments/admin/${id}`);

// ═══════════════════════════════════════════════════════════════
// CHAT MANAGEMENT
// ═══════════════════════════════════════════════════════════════
export const getAdminConversations = (params) =>
  apiClient.get("/chat/conversations", { params });
export const getAdminMessages = (conversationId, params) =>
  apiClient.get(`/chat/conversations/${conversationId}/messages`, { params });
export const sendAdminMessage = (data) => apiClient.post("/chat/send", data);
export const startAdminConversation = (data) =>
  apiClient.post("/chat/conversations/start", data);

// ═══════════════════════════════════════════════════════════════
// ANALYTICS
// ═══════════════════════════════════════════════════════════════
export const getAnalyticsBookingTrend = (params) =>
  apiClient.get("/analytics/booking-trend", { params });
export const getAnalyticsRevenueTrend = (params) =>
  apiClient.get("/analytics/revenue-trend", { params });
export const getAnalyticsUserGrowth = (params) =>
  apiClient.get("/analytics/user-growth", { params });
export const getAnalyticsTopGuiders = (params) =>
  apiClient.get("/analytics/top-guiders", { params });
export const getAnalyticsTopPhotographers = (params) =>
  apiClient.get("/analytics/top-photographers", { params });
export const getAnalyticsBookingStatus = (params) =>
  apiClient.get("/analytics/booking-status", { params });

// ═══════════════════════════════════════════════════════════════
// WITHDRAWALS
// ═══════════════════════════════════════════════════════════════
export const getWithdrawalRequests = (params) =>
  apiClient.get("/withdrawal/all", { params });
export const getWithdrawalRequestById = (id) =>
  apiClient.get(`/withdrawal/${id}`);
export const approveWithdrawalRequest = (id, adminMessage) =>
  apiClient.put(`/withdrawal/${id}/status`, {
    status: "APPROVED",
    adminMessage,
  });
export const rejectWithdrawalRequest = (id, adminMessage) =>
  apiClient.put(`/withdrawal/${id}/status`, {
    status: "REJECTED",
    adminMessage,
  });

// ═══════════════════════════════════════════════════════════════
// WALLETS
// ═══════════════════════════════════════════════════════════════
export const getWallets = (params) =>
  apiClient.get("/wallet/all", { params });
export const updateWalletBalance = (userId, data) =>
  apiClient.put(`/wallet/${userId}/balance`, data);

// ═══════════════════════════════════════════════════════════════
// GALLERY
// ═══════════════════════════════════════════════════════════════
export const addPlaceGalleryImage = (placeId, imageUrl) =>
  apiClient.post(`/places/${placeId}/gallery`, { imageUrl });
export const removePlaceGalleryImage = (placeId, imageUrl) =>
  apiClient.delete(`/places/${placeId}/gallery`, { data: { imageUrl } });
export const replacePlaceGallery = (placeId, images) =>
  apiClient.put(`/places/${placeId}/gallery`, { images });

export const addGuiderGalleryImage = (guiderId, imageUrl) =>
  apiClient.post(`/guiders/${guiderId}/gallery`, { imageUrl });
export const removeGuiderGalleryImage = (guiderId, imageUrl) =>
  apiClient.delete(`/guiders/${guiderId}/gallery`, { data: { imageUrl } });
export const replaceGuiderGallery = (guiderId, images) =>
  apiClient.put(`/guiders/${guiderId}/gallery`, { images });

export const addPhotographerGalleryImage = (photographerId, imageUrl) =>
  apiClient.post(`/photographers/${photographerId}/gallery`, { imageUrl });
export const removePhotographerGalleryImage = (photographerId, imageUrl) =>
  apiClient.delete(`/photographers/${photographerId}/gallery`, {
    data: { imageUrl },
  });
export const replacePhotographerGallery = (photographerId, images) =>
  apiClient.put(`/photographers/${photographerId}/gallery`, { images });

// ═══════════════════════════════════════════════════════════════
// ✅ NEW: LOCATIONS (Nominatim search)
// ═══════════════════════════════════════════════════════════════
export const searchLocations = async (query, options = {}) => {
  if (!query || query.trim().length < 2) return [];

  const { countryCode = "in", limit = 15 } = options;

  try {
    const params = new URLSearchParams({
      q: query.trim(),
      format: "json",
      addressdetails: "1",
      limit: String(limit),
      countrycodes: countryCode,
    });

    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?${params.toString()}`,
      {
        headers: {
          "User-Agent": "LocalGuiderAdmin/1.0",
          Accept: "application/json",
        },
      }
    );

    if (!res.ok) return [];

    const data = await res.json();
    if (!Array.isArray(data)) return [];

    const seen = new Set();
    const results = [];

    for (const item of data) {
      const addr = item.address || {};

      const city =
        addr.city ||
        addr.town ||
        addr.village ||
        addr.municipality ||
        addr.suburb ||
        addr.county ||
        "";

      const district =
        addr.state_district ||
        addr.county ||
        addr.district ||
        city ||
        "";

      const state = addr.state || addr.region || "";
      const country = addr.country || "";

      if (!city && !district && !state) continue;

      const uniqueKey = `${city}|${district}|${state}`.toLowerCase();
      if (seen.has(uniqueKey)) continue;
      seen.add(uniqueKey);

      const displayParts = [city, district, state, country].filter(
        (v, i, arr) => v && arr.indexOf(v) === i
      );

      results.push({
        id: String(item.place_id || uniqueKey),
        city: city || district || state,
        district: district || city,
        state,
        country,
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
        displayName: displayParts.join(", "),
      });
    }

    return results;
  } catch (err) {
    console.error("Location search error:", err);
    return [];
  }
};