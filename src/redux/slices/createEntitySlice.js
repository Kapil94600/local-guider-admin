import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

export const createEntitySlice = (name, api) => {
  const fetchAll = createAsyncThunk(
    `${name}/fetchAll`,
    async (params) => (await api.getAll(params)).data
  );
  const fetchById = createAsyncThunk(
    `${name}/fetchById`,
    async (id) => (await api.getById(id)).data
  );
  const updateStatus = createAsyncThunk(
    `${name}/updateStatus`,
    async ({ id, status }) => (await api.updateStatus(id, status)).data
  );
  const remove = createAsyncThunk(
    `${name}/remove`,
    async (id) => {
      await api.delete(id);
      return id;
    }
  );

  const initialState = {
    items: [],
    selectedItem: null,
    total: 0,
    loading: false,
    error: null,
    pagination: { page: 1, limit: 10, total: 0 },
    filters: {},
  };

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
    },
    extraReducers: (builder) => {
      builder
        .addCase(fetchAll.pending, (state) => {
          state.loading = true;
          state.error = null;
        })
        .addCase(fetchAll.fulfilled, (state, action) => {
          state.loading = false;
          state.items = action.payload.data || action.payload;
          state.total = action.payload.total || action.payload.length;
          state.pagination.total = action.payload.total || action.payload.length;
        })
        .addCase(fetchAll.rejected, (state, action) => {
          state.loading = false;
          state.error = action.error.message;
        })
        .addCase(fetchById.pending, (state) => {
          state.loading = true;
        })
        .addCase(fetchById.fulfilled, (state, action) => {
          state.loading = false;
          state.selectedItem = action.payload;
        })
        .addCase(fetchById.rejected, (state, action) => {
          state.loading = false;
          state.error = action.error.message;
        })
        .addCase(updateStatus.fulfilled, (state, action) => {
          const updated = action.payload;
          const idx = state.items.findIndex((i) => i.id === updated.id);
          if (idx !== -1) state.items[idx] = updated;
          if (state.selectedItem?.id === updated.id) state.selectedItem = updated;
        })
        .addCase(remove.fulfilled, (state, action) => {
          state.items = state.items.filter((i) => i.id !== action.payload);
          if (state.selectedItem?.id === action.payload) state.selectedItem = null;
          state.total -= 1;
        });
    },
  });

  slice.actions.fetchAll = fetchAll;
  slice.actions.fetchById = fetchById;
  slice.actions.updateStatus = updateStatus;
  slice.actions.remove = remove;

  return slice;
};