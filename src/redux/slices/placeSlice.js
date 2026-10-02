// src/redux/slices/placeSlice.js
// ═══════════════════════════════════════════════════════════════
// PLACES SLICE — admin panel
// ═══════════════════════════════════════════════════════════════
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as api from "../../api/admin";

// ═══════════════════════════════════════════════════════════════
// FETCH ALL PLACES
// ═══════════════════════════════════════════════════════════════
export const fetchPlaces = createAsyncThunk(
  "places/fetchAll",
  async (params = {}, { rejectWithValue }) => {
    try {
      const res = await api.getPlaces(params);
      const payload = res.data?.data || res.data;

      // ✅ Handle different response shapes
      if (Array.isArray(payload)) {
        return { items: payload, total: payload.length };
      }
      if (payload?.rows) {
        return { items: payload.rows, total: payload.count || payload.rows.length };
      }
      return { items: [], total: 0 };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch places"
      );
    }
  }
);

// ═══════════════════════════════════════════════════════════════
// FETCH PLACE BY ID
// ═══════════════════════════════════════════════════════════════
export const fetchPlaceById = createAsyncThunk(
  "places/fetchById",
  async (id, { rejectWithValue }) => {
    try {
      const res = await api.getPlaceById(id);
      return res.data?.data || res.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch place"
      );
    }
  }
);

// ═══════════════════════════════════════════════════════════════
// CREATE PLACE
// ═══════════════════════════════════════════════════════════════
export const createPlace = createAsyncThunk(
  "places/create",
  async (data, { rejectWithValue }) => {
    try {
      const res = await api.createPlace(data);
      return res.data?.data || res.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Creation failed"
      );
    }
  }
);

// ═══════════════════════════════════════════════════════════════
// UPDATE PLACE
// ═══════════════════════════════════════════════════════════════
export const updatePlace = createAsyncThunk(
  "places/update",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await api.updatePlace(id, data);
      return res.data?.data || res.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Update failed"
      );
    }
  }
);

// ═══════════════════════════════════════════════════════════════
// DELETE PLACE
// ═══════════════════════════════════════════════════════════════
export const deletePlace = createAsyncThunk(
  "places/delete",
  async (id, { rejectWithValue }) => {
    try {
      await api.deletePlace(id);
      return { id };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Delete failed"
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
  pagination: { page: 1, limit: 10 },
};

// ═══════════════════════════════════════════════════════════════
// SLICE
// ═══════════════════════════════════════════════════════════════
const placeSlice = createSlice({
  name: "places",
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
      // ═══════════════════════════════════════════════
      // fetchPlaces
      // ═══════════════════════════════════════════════
      .addCase(fetchPlaces.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPlaces.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items || [];
        state.total = action.payload.total || state.items.length;
      })
      .addCase(fetchPlaces.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
        state.items = [];
        state.total = 0;
      })

      // ═══════════════════════════════════════════════
      // fetchPlaceById
      // ═══════════════════════════════════════════════
      .addCase(fetchPlaceById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPlaceById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedItem = action.payload;
      })
      .addCase(fetchPlaceById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
        state.selectedItem = null;
      })

      // ═══════════════════════════════════════════════
      // createPlace
      // ═══════════════════════════════════════════════
      .addCase(createPlace.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createPlace.fulfilled, (state, action) => {
        state.loading = false;
        state.items.unshift(action.payload);
        state.total += 1;
      })
      .addCase(createPlace.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })

      // ═══════════════════════════════════════════════
      // updatePlace
      // ═══════════════════════════════════════════════
      .addCase(updatePlace.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updatePlace.fulfilled, (state, action) => {
        state.loading = false;
        const updated = action.payload;
        const idx = state.items.findIndex((item) => item.id === updated.id);
        if (idx !== -1) state.items[idx] = updated;
        if (state.selectedItem?.id === updated.id) {
          state.selectedItem = updated;
        }
      })
      .addCase(updatePlace.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })

      // ═══════════════════════════════════════════════
      // deletePlace
      // ═══════════════════════════════════════════════
      .addCase(deletePlace.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deletePlace.fulfilled, (state, action) => {
        state.loading = false;
        state.items = state.items.filter(
          (item) => item.id !== action.payload.id
        );
        state.total = Math.max(0, state.total - 1);
      })
      .addCase(deletePlace.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      });
  },
});

export const { setPage, setLimit, clearSelected, clearError } =
  placeSlice.actions;
export default placeSlice.reducer;