import { createEntitySlice } from './createEntitySlice';
import * as api from '../../api/admin'; // admin APIs handle status updates

const guiderSlice = createEntitySlice('guiders', {
  getAll: api.getGuiders,
  getById: api.getGuiderById,
  updateStatus: api.updateGuiderStatus,
  delete: api.deleteGuider,
});

export const {
  fetchAll: fetchGuiders,
  fetchById: fetchGuiderById,
  updateStatus: updateGuiderStatus,
  remove: deleteGuider,
  setPage,
  setLimit,
  setFilters,
  clearSelected,
} = guiderSlice.actions;

export default guiderSlice.reducer;