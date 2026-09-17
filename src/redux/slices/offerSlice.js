import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as api from '../../api/admin';

export const fetchOffers = createAsyncThunk('offers/fetchAll', async (params) => {
  const res = await api.getOffers(params);
  return res.data.data;
});

export const createOffer = createAsyncThunk('offers/create', async (data, { rejectWithValue }) => {
  try {
    const res = await api.createOffer(data);
    return res.data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Creation failed');
  }
});

export const updateOffer = createAsyncThunk('offers/update', async ({ id, data }, { rejectWithValue }) => {
  try {
    const res = await api.updateOffer(id, data);
    return res.data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Update failed');
  }
});

export const deleteOffer = createAsyncThunk('offers/delete', async (id) => {
  await api.deleteOffer(id);
  return { id };
});

const initialState = {
  items: [],
  total: 0,
  loading: false,
  error: null,
  pagination: { page: 1, limit: 10 },
};

const offerSlice = createSlice({
  name: 'offers',
  initialState,
  reducers: {
    setPage: (state, action) => { state.pagination.page = action.payload; },
    setLimit: (state, action) => { state.pagination.limit = action.payload; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchOffers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOffers.fulfilled, (state, action) => {
        state.loading = false;
        state.items = Array.isArray(action.payload) ? action.payload : (action.payload?.data || []);
        state.total = action.payload?.total || state.items.length;
      })
      .addCase(fetchOffers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(createOffer.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
        state.total += 1;
      })
      .addCase(updateOffer.fulfilled, (state, action) => {
        const index = state.items.findIndex(item => item.id === action.payload.id);
        if (index !== -1) state.items[index] = action.payload;
      })
      .addCase(deleteOffer.fulfilled, (state, action) => {
        state.items = state.items.filter(item => item.id !== action.payload.id);
        state.total -= 1;
      });
  },
});

export const { setPage, setLimit } = offerSlice.actions;
export default offerSlice.reducer;