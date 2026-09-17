import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as api from '../../api/admin';

export const fetchSliders = createAsyncThunk('sliders/fetchAll', async (params) => {
  const res = await api.getSliders(params);
  return res.data.data;
});

export const createSlider = createAsyncThunk('sliders/create', async (data, { rejectWithValue }) => {
  try {
    const res = await api.createSlider(data);
    return res.data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Creation failed');
  }
});

export const updateSlider = createAsyncThunk('sliders/update', async ({ id, data }, { rejectWithValue }) => {
  try {
    const res = await api.updateSlider(id, data);
    return res.data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Update failed');
  }
});

export const deleteSlider = createAsyncThunk('sliders/delete', async (id) => {
  await api.deleteSlider(id);
  return { id };
});

const initialState = {
  items: [],
  total: 0,
  loading: false,
  error: null,
  pagination: { page: 1, limit: 10 },
};

const sliderSlice = createSlice({
  name: 'sliders',
  initialState,
  reducers: {
    setPage: (state, action) => { state.pagination.page = action.payload; },
    setLimit: (state, action) => { state.pagination.limit = action.payload; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSliders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSliders.fulfilled, (state, action) => {
        state.loading = false;
        state.items = Array.isArray(action.payload) ? action.payload : (action.payload?.data || []);
        state.total = action.payload?.total || state.items.length;
      })
      .addCase(fetchSliders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(createSlider.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
        state.total += 1;
      })
      .addCase(updateSlider.fulfilled, (state, action) => {
        const index = state.items.findIndex(item => item.id === action.payload.id);
        if (index !== -1) state.items[index] = action.payload;
      })
      .addCase(deleteSlider.fulfilled, (state, action) => {
        state.items = state.items.filter(item => item.id !== action.payload.id);
        state.total -= 1;
      });
  },
});

export const { setPage, setLimit } = sliderSlice.actions;
export default sliderSlice.reducer;