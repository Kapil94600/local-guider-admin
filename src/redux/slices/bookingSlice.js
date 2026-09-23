// src/redux/slices/bookingSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as api from '../../api/admin';

// ═══════════════════════════════════════════════════════════════
// ✅ HELPER: Extract list + count from any response shape
// ═══════════════════════════════════════════════════════════════
const extractList = (payload) => {
  if (!payload) return { items: [], total: 0 };
  if (Array.isArray(payload)) {
    return { items: payload, total: payload.length };
  }
  if (Array.isArray(payload.rows)) {
    return {
      items: payload.rows,
      total: payload.count || payload.rows.length,
    };
  }
  if (Array.isArray(payload.data)) {
    return {
      items: payload.data,
      total: payload.total || payload.data.length,
    };
  }
  if (Array.isArray(payload.items)) {
    return {
      items: payload.items,
      total: payload.total || payload.items.length,
    };
  }
  return { items: [], total: 0 };
};

// ═══════════════════════════════════════════════════════════════
// FETCH BOOKINGS (with filters)
// ═══════════════════════════════════════════════════════════════
export const fetchBookings = createAsyncThunk(
  'bookings/fetchAll',
  async (params = {}, { rejectWithValue }) => {
    try {
      const res = await api.getBookings(params);
      const payload = res.data?.data ?? res.data;
      return extractList(payload);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch bookings'
      );
    }
  }
);

// ═══════════════════════════════════════════════════════════════
// FETCH BOOKING BY ID
// ═══════════════════════════════════════════════════════════════
export const fetchBookingById = createAsyncThunk(
  'bookings/fetchById',
  async (id, { rejectWithValue }) => {
    try {
      const res = await api.getBookingById(id);
      return res.data?.data ?? res.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch booking'
      );
    }
  }
);

// ═══════════════════════════════════════════════════════════════
// UPDATE BOOKING STATUS
// ═══════════════════════════════════════════════════════════════
export const updateBookingStatus = createAsyncThunk(
  'bookings/updateStatus',
  async ({ id, status, notes }, { rejectWithValue }) => {
    try {
      const res = await api.updateBookingStatus(id, status, notes);
      return res.data?.data ?? res.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to update status'
      );
    }
  }
);

// ═══════════════════════════════════════════════════════════════
// SLICE
// ═══════════════════════════════════════════════════════════════
const initialState = {
  items: [],
  selectedItem: null,
  total: 0,
  loading: false,
  updating: false,
  error: null,
  pagination: { page: 1, limit: 10 },
};

const bookingSlice = createSlice({
  name: 'bookings',
  initialState,
  reducers: {
    setPage: (state, action) => {
      state.pagination.page = action.payload;
    },
    setLimit: (state, action) => {
      state.pagination.limit = action.payload;
    },
    clearSelected: (state) => {
      state.selectedItem = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    resetBookings: (state) => {
      state.items = [];
      state.selectedItem = null;
      state.total = 0;
      state.loading = false;
      state.updating = false;
      state.error = null;
      state.pagination = { page: 1, limit: 10 };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBookings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBookings.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items || [];
        state.total = action.payload.total || 0;
      })
      .addCase(fetchBookings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
        state.items = [];
        state.total = 0;
      })
      .addCase(fetchBookingById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBookingById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedItem = action.payload;
      })
      .addCase(fetchBookingById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })
      .addCase(updateBookingStatus.pending, (state) => {
        state.updating = true;
        state.error = null;
      })
      .addCase(updateBookingStatus.fulfilled, (state, action) => {
        state.updating = false;
        const updated = action.payload;
        const idx = state.items.findIndex((b) => b.id === updated.id);
        if (idx !== -1) state.items[idx] = updated;
        if (state.selectedItem?.id === updated.id) {
          state.selectedItem = updated;
        }
      })
      .addCase(updateBookingStatus.rejected, (state, action) => {
        state.updating = false;
        state.error = action.payload || action.error.message;
      });
  },
});

export const {
  setPage,
  setLimit,
  clearSelected,
  clearError,
  resetBookings,
} = bookingSlice.actions;

export default bookingSlice.reducer;