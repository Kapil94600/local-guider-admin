// src/redux/slices/guiderSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as api from "../../api/admin";

// ═══════════════════════════════════════════════════════════════
// NORMALIZE guider (User → user for frontend)
// ═══════════════════════════════════════════════════════════════
const normalizeGuider = (guider) => {
  if (!guider) return guider;
  const userData = guider.User || guider.user || null;

  return {
    ...guider,
    user: userData
      ? {
          id: userData.id,
          email: userData.email,
          phone: userData.phone,
          firstName: userData.firstName,
          lastName: userData.lastName,
          profileImage: userData.profileImage,
          role: userData.role,
          isActive: userData.isActive,
        }
      : null,
  };
};

// ---------- Thunks ----------

// Fetch all guiders
export const fetchGuiders = createAsyncThunk(
  "guiders/fetchGuiders",
  async (params, { rejectWithValue }) => {
    try {
      const response = await api.getGuiders(params);
      let guiders = response.data?.data || response.data || [];
      if (!Array.isArray(guiders)) {
        guiders = guiders.rows || guiders.items || [];
      }
      const normalized = guiders.map(normalizeGuider);
      return { items: normalized, total: normalized.length };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch guiders"
      );
    }
  }
);

// Fetch single guider
export const fetchGuiderById = createAsyncThunk(
  "guiders/fetchGuiderById",
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.getGuiderById(id);
      const guider = response.data?.data || response.data;
      return normalizeGuider(guider);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch guider"
      );
    }
  }
);

// Create
export const createGuider = createAsyncThunk(
  "guiders/createGuider",
  async (data, { rejectWithValue }) => {
    try {
      const response = await api.createGuider(data);
      return normalizeGuider(response.data?.data || response.data);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Create failed"
      );
    }
  }
);

// ═══════════════════════════════════════════════════════════════
// ✅ FIX B-5: Rename — updateGuiderStatus (was: updateGuider)
// ═══════════════════════════════════════════════════════════════
export const updateGuiderStatus = createAsyncThunk(
  "guiders/updateGuiderStatus",
  async ({ id, isActive }, { rejectWithValue }) => {
    try {
      const response = await api.updateGuiderStatus(id, isActive);
      return normalizeGuider(response.data?.data || response.data);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Update failed"
      );
    }
  }
);

// ✅ NEW: Full update (name, bio, etc.)
export const updateGuider = createAsyncThunk(
  "guiders/updateGuider",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await api.updateGuider(id, data);
      return normalizeGuider(response.data?.data || response.data);
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Update failed"
      );
    }
  }
);

// Delete
export const deleteGuider = createAsyncThunk(
  "guiders/deleteGuider",
  async (id, { rejectWithValue }) => {
    try {
      await api.deleteGuider(id);
      return { id };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Delete failed"
      );
    }
  }
);

// ---------- Slice ----------
const initialState = {
  items: [],
  selectedItem: null,
  loading: false,
  error: null,
  total: 0,
  pagination: { page: 1, limit: 10 },
};

const guiderSlice = createSlice({
  name: "guiders",
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
  },
  extraReducers: (builder) => {
    builder
      // ── fetchGuiders ──
      .addCase(fetchGuiders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchGuiders.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items || [];
        state.total = action.payload.total || state.items.length;
      })
      .addCase(fetchGuiders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
        state.items = [];
        state.total = 0;
      })
      // ── fetchGuiderById ──
      .addCase(fetchGuiderById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchGuiderById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedItem = action.payload;
      })
      .addCase(fetchGuiderById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
        state.selectedItem = null;
      })
      // ── createGuider ──
      .addCase(createGuider.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createGuider.fulfilled, (state, action) => {
        state.loading = false;
        state.items.unshift(action.payload);
        state.total += 1;
      })
      .addCase(createGuider.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })
      // ── ✅ FIX B-5: updateGuiderStatus ──
      .addCase(updateGuiderStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateGuiderStatus.fulfilled, (state, action) => {
        state.loading = false;
        const updated = action.payload;
        const index = state.items.findIndex((item) => item.id === updated.id);
        if (index !== -1) {
          state.items[index] = { ...state.items[index], ...updated };
        }
        if (state.selectedItem && state.selectedItem.id === updated.id) {
          state.selectedItem = { ...state.selectedItem, ...updated };
        }
      })
      .addCase(updateGuiderStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })
      // ── ✅ NEW: updateGuider (full) ──
      .addCase(updateGuider.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateGuider.fulfilled, (state, action) => {
        state.loading = false;
        const updated = action.payload;
        const index = state.items.findIndex((item) => item.id === updated.id);
        if (index !== -1) {
          state.items[index] = { ...state.items[index], ...updated };
        }
        if (state.selectedItem && state.selectedItem.id === updated.id) {
          state.selectedItem = { ...state.selectedItem, ...updated };
        }
      })
      .addCase(updateGuider.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })
      // ── deleteGuider ──
      .addCase(deleteGuider.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteGuider.fulfilled, (state, action) => {
        state.loading = false;
        state.items = state.items.filter(
          (item) => item.id !== action.payload.id
        );
        state.total = state.items.length;
        if (state.selectedItem && state.selectedItem.id === action.payload.id) {
          state.selectedItem = null;
        }
      })
      .addCase(deleteGuider.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      });
  },
});

export const { setPage, setLimit, clearSelected, clearError } =
  guiderSlice.actions;
export default guiderSlice.reducer;