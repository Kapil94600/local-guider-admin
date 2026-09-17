// src/api/roleRequests.js
import apiClient from './axios';

export const roleRequestsApi = {
  // ✅ admin path
  getRoleRequests: (params) => apiClient.get('/admin/role-requests', { params }),
  submitRoleRequest: (data) => apiClient.post('/role-requests', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
    transformRequest: (d) => d,
  }),
  updateRoleRequestStatus: (id, status) =>
    apiClient.put(`/admin/role-requests/${id}/status`, { status }),
};