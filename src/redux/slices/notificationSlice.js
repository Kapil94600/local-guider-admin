import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as api from '../../api/admin';

export const fetchNotifications = createAsyncThunk('notifications/fetchAll', async (params) => {
  const res = await api.getNotifications(params);
  const data = res.data?.data;

  // ✅ Handle both array and { rows, count } format
  if (Array.isArray(data)) return { items: data, total: data.length };
  if (data?.rows) return { items: data.rows, total: data.count };
  return { items: [], total: 0 };
});

export const sendBroadcast = createAsyncThunk('notifications/send', async (data, { rejectWithValue }) => {
  try {
    const res = await api.sendBroadcastNotification(data);
    return res.data.data; // { count: number }
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to send');
  }
});

const initialState = {
  items: [],
  total: 0,
  loading: false,
  sending: false,
  error: null,
  pagination: { page: 1, limit: 10 },
};

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    setPage: (state, action) => { state.pagination.page = action.payload; },
    setLimit: (state, action) => { state.pagination.limit = action.payload; },
    clearError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items || [];
        state.total = action.payload.total || state.items.length;
      })
      .addCase(fetchNotifications.rejected, (state, action) => { state.loading = false; state.error = action.error.message; })
      .addCase(sendBroadcast.pending, (state) => { state.sending = true; state.error = null; })
      .addCase(sendBroadcast.fulfilled, (state) => { state.sending = false; })
      .addCase(sendBroadcast.rejected, (state, action) => { state.sending = false; state.error = action.payload; });
  },
});

export const { setPage, setLimit, clearError } = notificationSlice.actions;
export default notificationSlice.reducer;