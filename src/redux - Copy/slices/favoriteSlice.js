import { createEntitySlice } from './createEntitySlice';
import * as api from '../../api/admin';

const favoriteSlice = createEntitySlice('favorites', {
  getAll: api.getFavorites,
  getById: api.getFavoriteById,
  updateStatus: () => {}, // no status update
  delete: api.deleteFavorite,
});

export const {
  fetchAll: fetchFavorites,
  fetchById: fetchFavoriteById,
  remove: deleteFavorite,
  setPage,
  setLimit,
  setFilters,
  clearSelected,
} = favoriteSlice.actions;

export default favoriteSlice.reducer;