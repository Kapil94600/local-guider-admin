// src/redux/slices/guiderSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as api from '../../api/admin';

// ---------- Thunks ----------

// Fetch all guiders with user details
export const fetchGuiders = createAsyncThunk(
  'guiders/fetchGuiders',
  async (params, { rejectWithValue }) => {
    try {
      const response = await api.getGuiders(params);
      let guiders = response.data?.data || response.data || [];
      // Ensure it's an array
      if (!Array.isArray(guiders)) {
        guiders = guiders.rows || guiders.items || [];
      }

      // Fetch user details for each guider
      const guidersWithUsers = await Promise.all(
        guiders.map(async (guider) => {
          if (guider.userId) {
            try {
              const userRes = await api.getUser(guider.userId);
              const user = userRes.data?.data || userRes.data;
              // Merge user fields into guider
              return {
                ...guider,
                user: {
                  email: user.email,
                  phone: user.phone,
                  firstName: user.firstName,
                  lastName: user.lastName,
                  profileImage: user.profileImage,
                },
              };
            } catch {
              // If user fetch fails, return guider without user
              return guider;
            }
          }
          return guider;
        })
      );

      return {
        items: guidersWithUsers,
        total: guidersWithUsers.length,
      };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch guiders');
    }
  }
);

// Fetch a single guider by ID (with user details)
export const fetchGuiderById = createAsyncThunk(
  'guiders/fetchGuiderById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.getGuiderById(id);
      let guider = response.data?.data || response.data;
      // Fetch user if userId exists
      if (guider.userId) {
        try {
          const userRes = await api.getUser(guider.userId);
          const user = userRes.data?.data || userRes.data;
          guider = { ...guider, user };
        } catch {
          // ignore
        }
      }
      return guider;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch guider');
    }
  }
);

export const createGuider = createAsyncThunk(
  'guiders/createGuider',
  async (data, { rejectWithValue }) => {
    try {
      const response = await api.createGuider(data);
      return response.data?.data || response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Create failed');
    }
  }
);

export const updateGuider = createAsyncThunk(
  'guiders/updateGuider',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await api.updateGuiderStatus(id, data.isActive);
      return response.data?.data || response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Update failed');
    }
  }
);

export const deleteGuider = createAsyncThunk(
  'guiders/deleteGuider',
  async (id, { rejectWithValue }) => {
    try {
      await api.deleteGuider(id);
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

const guiderSlice = createSlice({
  name: 'guiders',
  initialState,
  reducers: {
    setPage: (state, action) => { state.pagination.page = action.payload; },
    setLimit: (state, action) => { state.pagination.limit = action.payload; },
    clearSelected: (state) => { state.selectedItem = null; },
  },
  extraReducers: (builder) => {
    builder
      // fetchGuiders
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
      // fetchGuiderById
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
      // createGuider
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
      // updateGuider
      .addCase(updateGuider.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateGuider.fulfilled, (state, action) => {
        state.loading = false;
        const updated = action.payload;
        const index = state.items.findIndex(item => item.id === updated.id);
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
      // deleteGuider
      .addCase(deleteGuider.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteGuider.fulfilled, (state, action) => {
        state.loading = false;
        state.items = state.items.filter(item => item.id !== action.payload.id);
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

export const { setPage, setLimit, clearSelected } = guiderSlice.actions;
export default guiderSlice.reducer;