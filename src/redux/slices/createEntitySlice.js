// src/redux/createEntitySlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

// ═══════════════════════════════════════════════════════════════
// ✅ FIX B-4: Don't mutate slice.actions — export separately
// Also: extract helper for API response shape
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

export const createEntitySlice = (name, api) => {
  // ═══════════════════════════════════════════════════════════════
  // THUNKS
  // ═══════════════════════════════════════════════════════════════
  const fetchAll = createAsyncThunk(
    `${name}/fetchAll`,
    async (params = {}, { rejectWithValue }) => {
      try {
        const res = await api.getAll(params);
        const payload = res.data?.data ?? res.data;
        return extractList(payload);
      } catch (error) {
        return rejectWithValue(
          error.response?.data?.message || "Failed to fetch"
        );
      }
    }
  );

  const fetchById = createAsyncThunk(
    `${name}/fetchById`,
    async (id, { rejectWithValue }) => {
      try {
        const res = await api.getById(id);
        return res.data?.data ?? res.data;
      } catch (error) {
        return rejectWithValue(
          error.response?.data?.message || "Failed to fetch"
        );
      }
    }
  );

  const updateStatus = createAsyncThunk(
    `${name}/updateStatus`,
    async ({ id, status }, { rejectWithValue }) => {
      try {
        const res = await api.updateStatus(id, status);
        return res.data?.data ?? res.data;
      } catch (error) {
        return rejectWithValue(
          error.response?.data?.message || "Failed to update status"
        );
      }
    }
  );

  const remove = createAsyncThunk(
    `${name}/remove`,
    async (id, { rejectWithValue }) => {
      try {
        await api.delete(id);
        return id;
      } catch (error) {
        return rejectWithValue(
          error.response?.data?.message || "Failed to delete"
        );
      }
    }
  );

  // ═══════════════════════════════════════════════════════════════
  // INITIAL STATE
  // ═══════════════════════════════════════════════════════════════
  const initialState = {
    items: [],
    selectedItem: null,
    total: 0,
    loading: false,
    error: null,
    pagination: { page: 1, limit: 10, total: 0 },
    filters: {},
  };

  // ═══════════════════════════════════════════════════════════════
  // SLICE
  // ═══════════════════════════════════════════════════════════════
  const slice = createSlice({
    name,
    initialState,
    reducers: {
      setPage: (state, action) => {
        state.pagination.page = action.payload;
      },
      setLimit: (state, action) => {
        state.pagination.limit = action.payload;
      },
      setFilters: (state, action) => {
        state.filters = { ...state.filters, ...action.payload };
      },
      clearSelected: (state) => {
        state.selectedItem = null;
      },
      clearError: (state) => {
        state.error = null;
      },
    },
    extraReducers: (builder) => {
      builder
        // ── fetchAll ──
        .addCase(fetchAll.pending, (state) => {
          state.loading = true;
          state.error = null;
        })
        .addCase(fetchAll.fulfilled, (state, action) => {
          state.loading = false;
          state.items = action.payload.items;
          state.total = action.payload.total;
          state.pagination.total = action.payload.total;
        })
        .addCase(fetchAll.rejected, (state, action) => {
          state.loading = false;
          state.error = action.payload || action.error.message;
        })
        // ── fetchById ──
        .addCase(fetchById.pending, (state) => {
          state.loading = true;
          state.error = null;
        })
        .addCase(fetchById.fulfilled, (state, action) => {
          state.loading = false;
          state.selectedItem = action.payload;
        })
        .addCase(fetchById.rejected, (state, action) => {
          state.loading = false;
          state.error = action.payload || action.error.message;
        })
        // ── updateStatus ──
        .addCase(updateStatus.fulfilled, (state, action) => {
          const updated = action.payload;
          const idx = state.items.findIndex((i) => i.id === updated.id);
          if (idx !== -1) state.items[idx] = updated;
          if (state.selectedItem?.id === updated.id)
            state.selectedItem = updated;
        })
        .addCase(updateStatus.rejected, (state, action) => {
          state.error = action.payload || action.error.message;
        })
        // ── remove ──
        .addCase(remove.fulfilled, (state, action) => {
          state.items = state.items.filter((i) => i.id !== action.payload);
          if (state.selectedItem?.id === action.payload)
            state.selectedItem = null;
          state.total = Math.max(0, state.total - 1);
        })
        .addCase(remove.rejected, (state, action) => {
          state.error = action.payload || action.error.message;
        });
    },
  });

  // ═══════════════════════════════════════════════════════════════
  // ✅ FIX B-4: Return thunks as a separate object (not mutating slice.actions)
  // ═══════════════════════════════════════════════════════════════
  return {
    slice,
    thunks: {
      fetchAll,
      fetchById,
      updateStatus,
      remove,
    },
  };
};