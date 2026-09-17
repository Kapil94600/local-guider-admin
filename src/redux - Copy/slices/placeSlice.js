import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as api from '../../api/admin';

export const fetchPlaces = createAsyncThunk('places/fetchAll', async (params) => {
  const res = await api.getPlaces(params);
  return res.data.data;
});

export const fetchPlaceById = createAsyncThunk('places/fetchById', async (id) => {
  const res = await api.getPlaceById(id);
  return res.data.data;
});

export const createPlace = createAsyncThunk('places/create', async (data, { rejectWithValue }) => {
  try {
    const res = await api.createPlace(data);
    return res.data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Creation failed');
  }
});

export const updatePlace = createAsyncThunk('places/update', async ({ id, data }, { rejectWithValue }) => {
  try {
    const res = await api.updatePlace(id, data);
    return res.data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Update failed');
  }
});

export const deletePlace = createAsyncThunk('places/delete', async (id) => {
  await api.deletePlace(id);
  return { id };
});

const initialState = {
  items: [],
  selectedItem: null,
  total: 0,
  loading: false,
  error: null,
  pagination: { page: 1, limit: 10 },
};

const placeSlice = createSlice({
  name: 'places',
  initialState,
  reducers: {
    setPage: (state, action) => { state.pagination.page = action.payload; },
    setLimit: (state, action) => { state.pagination.limit = action.payload; },
    clearSelected: (state) => { state.selectedItem = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPlaces.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchPlaces.fulfilled, (state, action) => {
        state.loading = false;
        state.items = Array.isArray(action.payload) ? action.payload : (action.payload?.data || []);
        state.total = action.payload?.total || state.items.length;
      })
      .addCase(fetchPlaces.rejected, (state, action) => { state.loading = false; state.error = action.error.message; })
      .addCase(fetchPlaceById.pending, (state) => { state.loading = true; })
      .addCase(fetchPlaceById.fulfilled, (state, action) => { state.loading = false; state.selectedItem = action.payload; })
      .addCase(fetchPlaceById.rejected, (state, action) => { state.loading = false; state.error = action.error.message; })
      .addCase(createPlace.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
        state.total += 1;
      })
      .addCase(updatePlace.fulfilled, (state, action) => {
        const updated = action.payload;
        const idx = state.items.findIndex(item => item.id === updated.id);
        if (idx !== -1) state.items[idx] = updated;
        if (state.selectedItem?.id === updated.id) state.selectedItem = updated;
      })
      .addCase(deletePlace.fulfilled, (state, action) => {
        state.items = state.items.filter(item => item.id !== action.payload.id);
        state.total -= 1;
      });
  },
});

export const { setPage, setLimit, clearSelected } = placeSlice.actions;
export default placeSlice.reducer;