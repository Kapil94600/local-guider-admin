// src/redux/slices/photographerSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as api from '../../api/admin';

// ═══════════════════════════════════════════════════════════════
// ✅ FIX: Backend ab User include karta hai (`photographer.User`)
// — no more N+1 (per-photographer getUser calls)
// — normalize `User` (bada) → `user` (chhota) for frontend compat
// ═══════════════════════════════════════════════════════════════
const normalizePhotographer = (photographer) => {
  if (!photographer) return photographer;
  const userData = photographer.User || photographer.user || null;

  return {
    ...photographer,
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

// Fetch all photographers with user details (NO N+1)
export const fetchPhotographers = createAsyncThunk(
  'photographers/fetchPhotographers',
  async (params, { rejectWithValue }) => {
    try {
      const response = await api.getPhotographers(params);
      let photographers = response.data?.data || response.data || [];
      if (!Array.isArray(photographers)) {
        photographers = photographers.rows || photographers.items || [];
      }

      // ✅ No per-photographer getUser() calls
      const normalized = photographers.map(normalizePhotographer);

      return {
        items: normalized,
        total: normalized.length,
      };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch photographers');
    }
  }
);

// Fetch single photographer by ID
export const fetchPhotographerById = createAsyncThunk(
  'photographers/fetchPhotographerById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.getPhotographerById(id);
      const photographer = response.data?.data || response.data;
      // ✅ No getUser() call — backend already includes User
      return normalizePhotographer(photographer);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch photographer');
    }
  }
);

// ✅ Create photographer
export const createPhotographer = createAsyncThunk(
  'photographers/createPhotographer',
  async (data, { rejectWithValue }) => {
    try {
      const response = await api.createPhotographer(data);
      return normalizePhotographer(response.data?.data || response.data);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Create failed');
    }
  }
);

export const updatePhotographerStatus = createAsyncThunk(
  'photographers/updatePhotographerStatus',
  async ({ id, status }, { rejectWithValue }) => {
    try {
      const response = await api.updatePhotographerStatus(id, status);
      return normalizePhotographer(response.data?.data || response.data);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Status update failed');
    }
  }
);

export const deletePhotographer = createAsyncThunk(
  'photographers/deletePhotographer',
  async (id, { rejectWithValue }) => {
    try {
      await api.deletePhotographer(id);
      return { id };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Delete failed');
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

const photographerSlice = createSlice({
  name: 'photographers',
  initialState,
  reducers: {
    setPage: (state, action) => { state.pagination.page = action.payload; },
    setLimit: (state, action) => { state.pagination.limit = action.payload; },
    clearSelected: (state) => { state.selectedItem = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPhotographers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPhotographers.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items || [];
        state.total = action.payload.total || state.items.length;
      })
      .addCase(fetchPhotographers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
        state.items = [];
        state.total = 0;
      })
      .addCase(fetchPhotographerById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPhotographerById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedItem = action.payload;
      })
      .addCase(fetchPhotographerById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
        state.selectedItem = null;
      })
      .addCase(createPhotographer.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createPhotographer.fulfilled, (state, action) => {
        state.loading = false;
        state.items.unshift(action.payload);
        state.total += 1;
      })
      .addCase(createPhotographer.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })
      .addCase(updatePhotographerStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updatePhotographerStatus.fulfilled, (state, action) => {
        state.loading = false;
        const updated = action.payload;
        const index = state.items.findIndex(item => item.id === updated.id);
        if (index !== -1) state.items[index] = { ...state.items[index], ...updated };
        if (state.selectedItem && state.selectedItem.id === updated.id) {
          state.selectedItem = { ...state.selectedItem, ...updated };
        }
      })
      .addCase(updatePhotographerStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })
      .addCase(deletePhotographer.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deletePhotographer.fulfilled, (state, action) => {
        state.loading = false;
        state.items = state.items.filter(item => item.id !== action.payload.id);
        state.total = state.items.length;
        if (state.selectedItem && state.selectedItem.id === action.payload.id) {
          state.selectedItem = null;
        }
      })
      .addCase(deletePhotographer.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      });
  },
});

export const { setPage, setLimit, clearSelected } = photographerSlice.actions;
export default photographerSlice.reducer;