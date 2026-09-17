// src/redux/slices/idCardSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as api from '../../api/admin';

const extractIdCards = (data) => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (data.rows && Array.isArray(data.rows)) return data.rows;
  if (data.data && Array.isArray(data.data)) return data.data;
  if (data.items && Array.isArray(data.items)) return data.items;
  return [];
};

export const fetchIdCards = createAsyncThunk('idCards/fetchAll', async (params) => {
  const res = await api.getIdCards(params);
  const payload = res.data?.data || res.data;
  return {
    items: extractIdCards(payload),
    total: payload?.total || payload?.count || extractIdCards(payload).length,
  };
});

export const revokeIdCard = createAsyncThunk('idCards/revoke', async (id) => {
  const res = await api.revokeIdCard(id);
  return res.data?.data || res.data;
});

const initialState = {
  items: [],
  total: 0,
  loading: false,
  error: null,
  pagination: { page: 1, limit: 10 },
};

const idCardSlice = createSlice({
  name: 'idCards',
  initialState,
  reducers: {
    setPage: (state, action) => { state.pagination.page = action.payload; },
    setLimit: (state, action) => { state.pagination.limit = action.payload; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchIdCards.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchIdCards.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items || [];
        state.total = action.payload.total || state.items.length;
      })
      .addCase(fetchIdCards.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
        state.items = [];
      })
      .addCase(revokeIdCard.fulfilled, (state, action) => {
        const index = state.items.findIndex(item => item.id === action.payload.id);
        if (index !== -1) state.items[index] = action.payload;
      });
  },
});

export const { setPage, setLimit } = idCardSlice.actions;
export default idCardSlice.reducer;