// src/api/auth.js
import apiClient from './axios';

// ═══════════════════════════════════════════
// Backend OTP (MSG91/Twilio)
// ═══════════════════════════════════════════
export const sendOtp = (phone) =>
  apiClient.post('/auth/send-otp', { phone });

export const verifyOtp = (phone, otp) =>
  apiClient.post('/auth/verify-otp', { phone, otp });

// ═══════════════════════════════════════════
// Token management
// ═══════════════════════════════════════════
export const refreshToken = (refreshToken) =>
  apiClient.post('/auth/refresh-token', { refreshToken });

// ═══════════════════════════════════════════
// Firebase (optional — baad me)
// ═══════════════════════════════════════════
export const firebaseLogin = (idToken) =>
  apiClient.post('/auth/firebase-login', { idToken });