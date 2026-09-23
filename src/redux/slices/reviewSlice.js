// src/redux/slices/reviewSlice.js
import { createEntitySlice } from './createEntitySlice';
import * as api from '../../api/admin';

const { slice, thunks } = createEntitySlice('reviews', {
  getAll: api.getReviews,
  getById: api.getReviewById,
  updateStatus: api.updateReviewStatus,
  delete: api.deleteReview,
});

export const {
  fetchAll: fetchReviews,
  fetchById: fetchReviewById,
  updateStatus: updateReviewStatus,
  remove: deleteReview,
} = thunks;

export const {
  setPage,
  setLimit,
  setFilters,
  clearSelected,
  clearError,
} = slice.actions;

export default slice.reducer;