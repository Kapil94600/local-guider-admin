import { createEntitySlice } from './createEntitySlice';
import * as api from '../../api/admin';

const reviewSlice = createEntitySlice('reviews', {
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
  setPage,
  setLimit,
  setFilters,
  clearSelected,
} = reviewSlice.actions;

export default reviewSlice.reducer;