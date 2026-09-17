// src/redux/slices/roleRequestSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '../../api/axios'; // ✅ uses auto-refresh interceptor

// ✅ Fetch all role requests
export const fetchRoleRequests = createAsyncThunk(
  'roleRequests/fetchRoleRequests',
  async (params = { page: 1, limit: 10 }) => {
    const response = await apiClient.get('/admin/role-requests', { params });
    return response.data.data;
  }
);

// ✅ Approve
export const approveRoleRequest = createAsyncThunk(
  'roleRequests/approveRoleRequest',
  async (id) => {
    const payload = { status: 'APPROVED' };
    const response = await apiClient.put(`/admin/role-requests/${id}/status`, payload);
    return response.data.data;
  }
);

// ✅ Reject (with optional adminMessage)
export const rejectRoleRequest = createAsyncThunk(
  'roleRequests/rejectRoleRequest',
  async ({ id, adminMessage } = {}) => {
    const payload = { status: 'REJECTED' };
    if (adminMessage) payload.adminMessage = adminMessage;
    const response = await apiClient.put(`/admin/role-requests/${id}/status`, payload);
    return response.data.data;
  }
);

const roleRequestSlice = createSlice({
  name: 'roleRequests',
  initialState: {
    items: [],
    total: 0,
    loading: false,
    error: null,
    pagination: { page: 1, limit: 10 },
  },
  reducers: {
    setPage: (state, action) => {
      state.pagination.page = action.payload;
    },
    setLimit: (state, action) => {
      state.pagination.limit = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRoleRequests.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRoleRequests.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload || [];
        state.total = state.items.length;
      })
      .addCase(fetchRoleRequests.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(approveRoleRequest.fulfilled, (state, action) => {
        const updated = action.payload;
        const index = state.items.findIndex((item) => item.id === updated.id);
        if (index !== -1) state.items[index] = updated;
      })
      .addCase(approveRoleRequest.rejected, (state, action) => {
        console.error('Approve failed:', action.error.message);
      })
      .addCase(rejectRoleRequest.fulfilled, (state, action) => {
        const updated = action.payload;
        const index = state.items.findIndex((item) => item.id === updated.id);
        if (index !== -1) state.items[index] = updated;
      })
      .addCase(rejectRoleRequest.rejected, (state, action) => {
        console.error('Reject failed:', action.error.message);
      });
  },
});

export const { setPage, setLimit } = roleRequestSlice.actions;
export default roleRequestSlice.reducer;