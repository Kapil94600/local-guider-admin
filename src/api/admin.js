// src/api/admin.js
import apiClient from './axios';

export const getDashboardStats = () => apiClient.get('/admin/dashboard');

// Users
export const getUsers = (params) => apiClient.get('/admin/users', { params });
export const getUserById = (id) => apiClient.get(`/admin/users/${id}`);
export const getUser = getUserById;
export const updateUserStatus = (id, isActive) =>
  apiClient.put(`/admin/users/${id}/status`, { isActive });
export const deleteUser = (id) => apiClient.delete(`/admin/users/${id}`);

// Block / Unblock
export const blockUser = (blockedUserId, reason = 'Admin block') =>
  apiClient.post('/blocks', { blockedUserId, reason });
export const unblockUser = (blockId) => apiClient.delete(`/blocks/${blockId}`);
export const unblockUserByUserId = (blockedUserId) =>
  apiClient.delete(`/blocks/by-user/${blockedUserId}`);
export const getBlocks = () => apiClient.get('/blocks');

// Guiders
export const getGuiders = (params) => apiClient.get('/admin/guiders', { params });
export const getGuiderById = (id) => apiClient.get(`/admin/guiders/${id}`);
export const updateGuiderStatus = (id, isActive) =>
  apiClient.put(`/admin/guiders/${id}/status`, { isActive });
export const deleteGuider = (id) => apiClient.delete(`/admin/guiders/${id}`);
export const createGuider = (data) => apiClient.post('/admin/guiders', data);

// Photographers
export const getPhotographers = (params) => apiClient.get('/admin/photographers', { params });
export const getPhotographerById = (id) => apiClient.get(`/admin/photographers/${id}`);
export const updatePhotographerStatus = (id, isActive) =>
  apiClient.put(`/admin/photographers/${id}/status`, { isActive });
export const deletePhotographer = (id) => apiClient.delete(`/admin/photographers/${id}`);
export const createPhotographer = (data) => apiClient.post('/admin/photographers', data);

// Places
export const getPlaces = (params) => apiClient.get('/admin/places', { params });
export const getPlaceById = (id) => apiClient.get(`/admin/places/${id}`);
export const createPlace = (data) => apiClient.post('/admin/places', data);
export const updatePlace = (id, data) => apiClient.put(`/admin/places/${id}`, data);
export const updatePlaceStatus = (id, isActive) =>
  apiClient.put(`/admin/places/${id}/status`, { isActive });
export const deletePlace = (id) => apiClient.delete(`/admin/places/${id}`);

// Sliders
export const getSliders = (params) => apiClient.get('/admin/sliders', { params });
export const getSliderById = (id) => apiClient.get(`/admin/sliders/${id}`);
export const createSlider = (data) => apiClient.post('/admin/sliders', data);
export const updateSlider = (id, data) => apiClient.put(`/admin/sliders/${id}`, data);
export const deleteSlider = (id) => apiClient.delete(`/admin/sliders/${id}`);

// Offers
export const getOffers = (params) => apiClient.get('/admin/offers', { params });
export const getOfferById = (id) => apiClient.get(`/admin/offers/${id}`);
export const createOffer = (data) => apiClient.post('/admin/offers', data);
export const updateOffer = (id, data) => apiClient.put(`/admin/offers/${id}`, data);
export const deleteOffer = (id) => apiClient.delete(`/admin/offers/${id}`);

// ID Cards
export const getIdCards = (params) => apiClient.get('/id-cards', { params });
export const getIdCardById = (id) => apiClient.get(`/id-cards/${id}`);
export const revokeIdCard = (id) => apiClient.put(`/id-cards/${id}/revoke`);

// Notifications
export const getNotifications = (params) => apiClient.get('/admin/notifications', { params });
export const sendBroadcastNotification = (data) =>
  apiClient.post('/admin/notifications/send', data);

// Reviews
export const getReviews = (params) => apiClient.get('/admin/reviews', { params });
export const getReviewById = (id) => apiClient.get(`/admin/reviews/${id}`);
export const updateReviewStatus = (id, isActive) =>
  apiClient.put(`/admin/reviews/${id}/status`, { isActive });
export const deleteReview = (id) => apiClient.delete(`/admin/reviews/${id}`);

// Bookings
export const getBookings = (params) => apiClient.get('/admin/bookings', { params });
export const getBookingById = (id) => apiClient.get(`/admin/bookings/${id}`);
export const updateBookingStatus = (id, status, notes) =>
  apiClient.put(`/admin/bookings/${id}/status`, { status, notes });

// Role Requests
export const getRoleRequests = (params) => apiClient.get('/admin/role-requests', { params });
export const approveRoleRequest = (id) =>
  apiClient.put(`/admin/role-requests/${id}/status`, { status: 'APPROVED' });
export const rejectRoleRequest = (id) =>
  apiClient.put(`/admin/role-requests/${id}/status`, { status: 'REJECTED' });

// Payments
export const getPayments = (params) => apiClient.get('/payments/admin', { params });
export const getPaymentById = (id) => apiClient.get(`/payments/admin/${id}`);

// Chat Management
export const getAdminConversations = (params) => apiClient.get('/chat/conversations', { params });
export const getAdminMessages = (conversationId, params) =>
  apiClient.get(`/chat/conversations/${conversationId}/messages`, { params });
export const sendAdminMessage = (data) => apiClient.post('/chat/send', data);
export const startAdminConversation = (data) => apiClient.post('/chat/conversations/start', data);

// Analytics
export const getAnalyticsBookingTrend = () => apiClient.get('/analytics/booking-trend');
export const getAnalyticsRevenueTrend = () => apiClient.get('/analytics/revenue-trend');
export const getAnalyticsUserGrowth = () => apiClient.get('/analytics/user-growth');
export const getAnalyticsTopGuiders = () => apiClient.get('/analytics/top-guiders');
export const getAnalyticsTopPhotographers = () => apiClient.get('/analytics/top-photographers');
export const getAnalyticsBookingStatus = () => apiClient.get('/analytics/booking-status');

// Withdrawals
export const getWithdrawalRequests = (params) => apiClient.get('/withdrawal/all', { params });
export const getWithdrawalRequestById = (id) => apiClient.get(`/withdrawal/${id}`);
export const approveWithdrawalRequest = (id) =>
  apiClient.put(`/withdrawal/${id}/status`, { status: 'APPROVED' });
export const rejectWithdrawalRequest = (id, adminMessage) =>
  apiClient.put(`/withdrawal/${id}/status`, { status: 'REJECTED', adminMessage });

// Wallets
export const getWallets = (params) => apiClient.get('/wallet/all', { params });
export const updateWalletBalance = (userId, data) =>
  apiClient.put(`/wallet/${userId}/balance`, data);

// ═══════════════════════════════════════════
// ✅ GALLERY - Place / Guider / Photographer
// ═══════════════════════════════════════════

// Place Gallery (Admin full control)
export const addPlaceGalleryImage = (placeId, imageUrl) =>
  apiClient.post(`/places/${placeId}/gallery`, { imageUrl });
export const removePlaceGalleryImage = (placeId, imageUrl) =>
  apiClient.delete(`/places/${placeId}/gallery`, { data: { imageUrl } });
export const replacePlaceGallery = (placeId, images) =>
  apiClient.put(`/places/${placeId}/gallery`, { images });

// Guider Gallery (Owner uploads, admin deletes)
export const addGuiderGalleryImage = (guiderId, imageUrl) =>
  apiClient.post(`/guiders/${guiderId}/gallery`, { imageUrl });
export const removeGuiderGalleryImage = (guiderId, imageUrl) =>
  apiClient.delete(`/guiders/${guiderId}/gallery`, { data: { imageUrl } });
export const replaceGuiderGallery = (guiderId, images) =>
  apiClient.put(`/guiders/${guiderId}/gallery`, { images });

// Photographer Gallery (Owner uploads, admin deletes)
export const addPhotographerGalleryImage = (photographerId, imageUrl) =>
  apiClient.post(`/photographers/${photographerId}/gallery`, { imageUrl });
export const removePhotographerGalleryImage = (photographerId, imageUrl) =>
  apiClient.delete(`/photographers/${photographerId}/gallery`, { data: { imageUrl } });
export const replacePhotographerGallery = (photographerId, images) =>
  apiClient.put(`/photographers/${photographerId}/gallery`, { images });