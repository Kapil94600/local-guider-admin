// src/redux/slices/photographerSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as api from '../../api/admin';

// ---------- Thunks ----------

// Fetch all photographers with user details
export const fetchPhotographers = createAsyncThunk(
  'photographers/fetchPhotographers',
  async (params, { rejectWithValue }) => {
    try {
      const response = await api.getPhotographers(params);
      let photographers = response.data?.data || response.data || [];
      if (!Array.isArray(photographers)) {
        photographers = photographers.rows || photographers.items || [];
      }

      // Fetch user details for each photographer
      const photographersWithUsers = await Promise.all(
        photographers.map(async (photographer) => {
          if (photographer.userId) {
            try {
              const userRes = await api.getUser(photographer.userId);
              const user = userRes.data?.data || userRes.data;
              return {
                ...photographer,
                user: {
                  email: user.email,
                  phone: user.phone,
                  firstName: user.firstName,
                  lastName: user.lastName,
                  profileImage: user.profileImage,
                },
              };
            } catch {
              return photographer;
            }
          }
          return photographer;
        })
      );

      return {
        items: photographersWithUsers,
        total: photographersWithUsers.length,
      };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch photographers');
    }
  }
);

// Fetch single photographer by ID (with user details)
export const fetchPhotographerById = createAsyncThunk(
  'photographers/fetchPhotographerById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.getPhotographerById(id);
      let photographer = response.data?.data || response.data;
      if (photographer.userId) {
        try {
          const userRes = await api.getUser(photographer.userId);
          const user = userRes.data?.data || userRes.data;
          photographer = { ...photographer, user };
        } catch {}
      }
      return photographer;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch photographer');
    }
  }
);

export const createPhotographer = createAsyncThunk(
  'photographers/createPhotographer',
  async (data, { rejectWithValue }) => {
    try {
      const response = await api.createPhotographer(data);
      return response.data?.data || response.data;
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
      return response.data?.data || response.data;
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
      // fetchPhotographers
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
      // fetchPhotographerById
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
      // createPhotographer
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
      // updatePhotographerStatus
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
      // deletePhotographer
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