import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { sendOtp, verifyOtp } from '../../api/auth';

const safeJSONParse = (data) => {
  if (!data) return null;
  try { return JSON.parse(data); } catch { return null; }
};

export const sendOtpThunk = createAsyncThunk(
  'auth/sendOtp',
  async (phone, { rejectWithValue }) => {
    try {
      const res = await sendOtp(phone);
      return res.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to send OTP');
    }
  }
);

export const verifyOtpThunk = createAsyncThunk(
  'auth/verifyOtp',
  async ({ phone, otp }, { rejectWithValue }) => {
    try {
      const res = await verifyOtp(phone, otp);
      console.log('🔍 Full verify response:', res);

      // 🔥 Extract tokens & user – handles multiple response shapes
      let accessToken, refreshToken, user;
      const data = res.data;

      if (data.accessToken && data.user) {
        accessToken = data.accessToken;
        refreshToken = data.refreshToken;
        user = data.user;
      } else if (data.data && data.data.accessToken) {
        accessToken = data.data.accessToken;
        refreshToken = data.data.refreshToken;
        user = data.data.user;
      } else if (data.token && data.user) {
        accessToken = data.token;
        refreshToken = data.refreshToken;
        user = data.user;
      } else if (data.success && data.data) {
        accessToken = data.data.accessToken || data.data.token;
        refreshToken = data.data.refreshToken;
        user = data.data.user;
      } else {
        throw new Error('Unexpected response: ' + JSON.stringify(data));
      }

      if (!accessToken || !user) {
        throw new Error('Missing accessToken or user');
      }

      localStorage.setItem('accessToken', accessToken);
      if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(user));

      console.log('✅ Tokens stored:', { accessToken, refreshToken, user });
      return { user, accessToken, refreshToken };
    } catch (error) {
      console.error('❌ verifyOtp error:', error);
      return rejectWithValue(error.message || 'Verification failed');
    }
  }
);

const initialState = {
  user: safeJSONParse(localStorage.getItem('user')),
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
    clearError: (state) => { state.error = null; },
    resetOtpState: (state) => {
      state.otpSent = false;
      state.phone = '';
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(sendOtpThunk.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(sendOtpThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        state.otpSent = true;
        state.phone = action.meta.arg;
        state.error = null;
      })
      .addCase(sendOtpThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
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
        state.phone = '';
        state.error = null;
      })
      .addCase(verifyOtpThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { logout, clearError, resetOtpState } = authSlice.actions;
export default authSlice.reducer;