import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as api from '../../api/admin';

export const fetchBookings = createAsyncThunk('bookings/fetchAll', async (params) => {
  const res = await api.getBookings(params);
  return res.data.data;
});

export const fetchBookingById = createAsyncThunk('bookings/fetchById', async (id) => {
  const res = await api.getBookingById(id);
  return res.data.data;
});

export const updateBookingStatus = createAsyncThunk('bookings/updateStatus', async ({ id, status }) => {
  const res = await api.updateBookingStatus(id, status);
  return res.data.data;
});

const initialState = {
  items: [],
  selectedItem: null,
  total: 0,
  loading: false,
  error: null,
  pagination: { page: 1, limit: 10 },
};

const bookingSlice = createSlice({
  name: 'bookings',
  initialState,
  reducers: {
    setPage: (state, action) => { state.pagination.page = action.payload; },
    setLimit: (state, action) => { state.pagination.limit = action.payload; },
    clearSelected: (state) => { state.selectedItem = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBookings.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchBookings.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload || [];
        state.total = state.items.length;
      })
      .addCase(fetchBookings.rejected, (state, action) => { state.loading = false; state.error = action.error.message; })
      .addCase(fetchBookingById.pending, (state) => { state.loading = true; })
      .addCase(fetchBookingById.fulfilled, (state, action) => { state.loading = false; state.selectedItem = action.payload; })
      .addCase(fetchBookingById.rejected, (state, action) => { state.loading = false; state.error = action.error.message; })
      .addCase(updateBookingStatus.fulfilled, (state, action) => {
        const updated = action.payload;
        const idx = state.items.findIndex(item => item.id === updated.id);
        if (idx !== -1) state.items[idx] = updated;
        if (state.selectedItem?.id === updated.id) state.selectedItem = updated;
      });
  },
});

export const { setPage, setLimit, clearSelected } = bookingSlice.actions;
export default bookingSlice.reducer;