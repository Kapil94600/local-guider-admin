import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as api from '../../api/admin';

// ✅ Fetch users with params
export const fetchUsers = createAsyncThunk(
  'users/fetchAll',
  async (params = {}) => {
    const res = await api.getUsers(params);
    return {
      data: res.data.data, // { rows, count }
    };
  }
);

// ✅ Fetch single user
export const fetchUserById = createAsyncThunk(
  'users/fetchById',
  async (id) => {
    const res = await api.getUserById(id);
    return res.data.data;
  }
);

// ✅ Update status
export const updateUserStatus = createAsyncThunk(
  'users/updateStatus',
  async ({ id, status }) => {
    const res = await api.updateUserStatus(id, status);
    return res.data.data;
  }
);

// ✅ Delete user
export const deleteUser = createAsyncThunk(
  'users/delete',
  async (id) => {
    await api.deleteUser(id);
    return { id };
  }
);

const initialState = {
  items: [],
  selectedItem: null,
  total: 0,
  loading: false,
  error: null,
  pagination: { page: 1, limit: 10 },
};

const userSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    setPage: (state, action) => { state.pagination.page = action.payload; },
    setLimit: (state, action) => { state.pagination.limit = action.payload; },
    clearSelected: (state) => { state.selectedItem = null; },
  },
  extraReducers: (builder) => {
    builder
      // fetchUsers
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        const data = action.payload.data;
        state.items = data?.rows || data || [];
        state.total = data?.count || state.items.length;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
        state.items = [];
        state.total = 0;
      })
      // fetchUserById
      .addCase(fetchUserById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedItem = action.payload;
      })
      .addCase(fetchUserById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
        state.selectedItem = null;
      })
      // updateUserStatus
      .addCase(updateUserStatus.fulfilled, (state, action) => {
        const updated = action.payload;
        const index = state.items.findIndex(item => item.id === updated.id);
        if (index !== -1) state.items[index] = updated;
        if (state.selectedItem?.id === updated.id) state.selectedItem = updated;
      })
      // deleteUser
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.items = state.items.filter(item => item.id !== action.payload.id);
        state.total -= 1;
      });
  },
});

export const { setPage, setLimit, clearSelected } = userSlice.actions;
export default userSlice.reducer;