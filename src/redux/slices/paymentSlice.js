// src/redux/slices/paymentSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as api from '../../api/admin';

// ═══════════════════════════════════════════════════════════════
// ✅ HELPER: Extract rows + count (robust against shape changes)
// ═══════════════════════════════════════════════════════════════
const extractList = (payload) => {
  if (!payload) return { items: [], total: 0 };
  if (Array.isArray(payload)) {
    return { items: payload, total: payload.length };
  }
  if (Array.isArray(payload.rows)) {
    return { items: payload.rows, total: payload.count || payload.rows.length };
  }
  if (Array.isArray(payload.data)) {
    return { items: payload.data, total: payload.total || payload.data.length };
  }
  if (Array.isArray(payload.items)) {
    return { items: payload.items, total: payload.total || payload.items.length };
  }
  return { items: [], total: 0 };
};

// ═══════════════════════════════════════════════════════════════
// FETCH ALL PAYMENTS
// ═══════════════════════════════════════════════════════════════
export const fetchPayments = createAsyncThunk(
  'payments/fetchAll',
  async (params = {}, { rejectWithValue }) => {
    try {
      const res = await api.getPayments(params);
      const payload = res.data?.data ?? res.data;
      return extractList(payload);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch payments'
      );
    }
  }
);

// ═══════════════════════════════════════════════════════════════
// FETCH PAYMENT BY ID
// ═══════════════════════════════════════════════════════════════
export const fetchPaymentById = createAsyncThunk(
  'payments/fetchById',
  async (id, { rejectWithValue }) => {
    try {
      const res = await api.getPaymentById(id);
      return res.data?.data ?? res.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch payment'
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
  error: null,
  pagination: { page: 1, limit: 10 },
};

const paymentSlice = createSlice({
  name: 'payments',
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
    resetPayments: (state) => {
      state.items = [];
      state.selectedItem = null;
      state.total = 0;
      state.loading = false;
      state.error = null;
      state.pagination = { page: 1, limit: 10 };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPayments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPayments.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items || [];
        state.total = action.payload.total || 0;
      })
      .addCase(fetchPayments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
        state.items = [];
        state.total = 0;
      })
      .addCase(fetchPaymentById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPaymentById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedItem = action.payload;
      })
      .addCase(fetchPaymentById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      });
  },
});

export const {
  setPage,
  setLimit,
  clearSelected,
  clearError,
  resetPayments,
} = paymentSlice.actions;

export default paymentSlice.reducer;