// src/redux/slices/authSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { sendOtp, verifyOtp } from '../../api/auth';

// ═══════════════════════════════════════════
// Send OTP — Backend (MSG91/Twilio)
// ═══════════════════════════════════════════
export const sendOtpThunk = createAsyncThunk(
  'auth/sendOtp',
  async (phone, { rejectWithValue }) => {
    try {
      const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`;
      console.log('🔵 Sending OTP — Phone:', formattedPhone);

      const res = await sendOtp(formattedPhone);
      console.log('✅ OTP sent via backend:', res.data);

      return { phone: formattedPhone };
    } catch (error) {
      console.error('❌ Send OTP error:', error);
      return rejectWithValue(
        error.response?.data?.message || 'Failed to send OTP'
      );
    }
  }
);

// ═══════════════════════════════════════════
// Verify OTP — Backend
// ═══════════════════════════════════════════
export const verifyOtpThunk = createAsyncThunk(
  'auth/verifyOtp',
  async ({ phone, otp }, { rejectWithValue }) => {
    try {
      // ⚡ Phone format `+91` prefix ke saath — same as sendOtpThunk
      const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`;
      console.log('🔵 Verify OTP — Phone:', formattedPhone, 'OTP:', otp);

      const res = await verifyOtp(formattedPhone, otp);
      const data = res.data;

      const accessToken = data.data?.accessToken || data.accessToken;
      const refreshToken = data.data?.refreshToken || data.refreshToken;
      const user = data.data?.user || data.user;

      if (!accessToken || !user) {
        throw new Error('Missing accessToken or user');
      }

      // ✅ Admin role check
      const allowedRoles = ['ADMIN', 'SUPER_ADMIN'];
      if (!allowedRoles.includes(user.role)) {
        throw new Error('Access denied. Admin only.');
      }

      localStorage.setItem('accessToken', accessToken);
      if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(user));

      console.log('✅ Admin login successful:', user.id, 'Role:', user.role);
      return { user, accessToken, refreshToken };
    } catch (error) {
      console.error('❌ Verify OTP error:', error);
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Invalid OTP'
      );
    }
  }
);

// ═══════════════════════════════════════════
// Slice
// ═══════════════════════════════════════════
const initialState = {
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  token: localStorage.getItem('accessToken') || null,
  refreshToken: localStorage.getItem('refreshToken') || null,
  isLoading: false,
  error: null,
  otpSent: false,
  phone: '',
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    resetOtpState: (state) => {
      state.otpSent = false;
      state.phone = '';
      state.error = null;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.otpSent = false;
      state.phone = '';
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    },
  },
  extraReducers: (builder) => {
    builder
      // Send OTP
      .addCase(sendOtpThunk.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(sendOtpThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        state.otpSent = true;
        state.phone = action.payload.phone;
      })
      .addCase(sendOtpThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Verify OTP
      .addCase(verifyOtpThunk.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(verifyOtpThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        state.otpSent = false;
      })
      .addCase(verifyOtpThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, resetOtpState, logout } = authSlice.actions;
export default authSlice.reducer;