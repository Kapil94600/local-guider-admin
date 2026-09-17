// src/redux/slices/dashboardSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  getDashboardStats,
  getUsers,
  getGuiders,
  getPhotographers,
  getPlaces,
  getBookings,
  getReviews,
  getRoleRequests,
  getPayments,
  getAnalyticsBookingTrend,
  getAnalyticsRevenueTrend,
  getAnalyticsUserGrowth,
  getAnalyticsTopGuiders,
  getAnalyticsTopPhotographers,
  getAnalyticsBookingStatus,
} from '../../api/admin';
// ✅ getFavorites removed

const getTotal = (response) => {
  if (!response) return 0;
  const data = response.data || response;
  if (data.total !== undefined) return data.total;
  if (data.count !== undefined) return data.count;
  if (Array.isArray(data)) return data.length;
  if (data.data && data.data.total) return data.data.total;
  if (data.data && Array.isArray(data.data)) return data.data.length;
  return 0;
};

const getItems = (response) => {
  if (!response) return [];
  const data = response.data || response;
  if (Array.isArray(data)) return data;
  if (data.data && Array.isArray(data.data)) return data.data;
  if (data.rows && Array.isArray(data.rows)) return data.rows;
  if (data.items && Array.isArray(data.items)) return data.items;
  if (Array.isArray(data.data?.rows)) return data.data.rows;
  if (Array.isArray(data.data?.items)) return data.data.items;
  return [];
};

const defaultStats = {
  totalUsers: 0,
  totalGuiders: 0,
  totalPhotographers: 0,
  totalPlaces: 0,
  totalBookings: 0,
  totalRevenue: 0,
  totalReviews: 0,
  pendingRoleRequests: 0,
  userGrowth: [],
  bookingTrend: [],
  revenueByCategory: [],
  recentUsers: [],
  recentRoleRequests: [],
};

export const fetchAnalyticsData = createAsyncThunk(
  'dashboard/fetchAnalyticsData',
  async (_, { rejectWithValue }) => {
    try {
      const [bookingTrendRes, revenueTrendRes, userGrowthRes, topGuidersRes, topPhotographersRes, bookingStatusRes] =
        await Promise.all([
          getAnalyticsBookingTrend(),
          getAnalyticsRevenueTrend(),
          getAnalyticsUserGrowth(),
          getAnalyticsTopGuiders(),
          getAnalyticsTopPhotographers(),
          getAnalyticsBookingStatus(),
        ]);

      return {
        bookingTrend: bookingTrendRes.data.data,
        revenueTrend: revenueTrendRes.data.data,
        userGrowth: userGrowthRes.data.data,
        topGuiders: topGuidersRes.data.data,
        topPhotographers: topPhotographersRes.data.data,
        bookingStatus: bookingStatusRes.data.data,
      };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch analytics data');
    }
  }
);

export const fetchDashboardStats = createAsyncThunk(
  'dashboard/fetchStats',
  async (_, { rejectWithValue }) => {
    try {
      try {
        const response = await getDashboardStats();
        let stats = response.data?.data || response.data?.stats || response.data;
        if (stats && typeof stats === 'object' && 'totalUsers' in stats) {
          return stats;
        }
      } catch (dashboardError) {
        console.warn('⚠️ Dashboard endpoint failed, falling back to individual APIs:', dashboardError.message);
      }

      // ✅ Favorites removed from this list
      const [
        usersRes, guidersRes, photographersRes, placesRes, bookingsRes,
        reviewsRes, roleRequestsRes, paymentsRes,
      ] = await Promise.allSettled([
        getUsers({ limit: 5 }),
        getGuiders({ limit: 1 }),
        getPhotographers({ limit: 1 }),
        getPlaces({ limit: 1 }),
        getBookings({ limit: 1 }),
        getReviews({ limit: 1 }),
        getRoleRequests({ limit: 5 }),
        getPayments({ limit: 1 }),
      ]);

      const totalUsers = usersRes.status === 'fulfilled' ? getTotal(usersRes.value) : 0;
      const totalGuiders = guidersRes.status === 'fulfilled' ? getTotal(guidersRes.value) : 0;
      const totalPhotographers = photographersRes.status === 'fulfilled' ? getTotal(photographersRes.value) : 0;
      const totalPlaces = placesRes.status === 'fulfilled' ? getTotal(placesRes.value) : 0;
      const totalBookings = bookingsRes.status === 'fulfilled' ? getTotal(bookingsRes.value) : 0;
      const totalReviews = reviewsRes.status === 'fulfilled' ? getTotal(reviewsRes.value) : 0;
      const pendingRoleRequests = roleRequestsRes.status === 'fulfilled' ? getTotal(roleRequestsRes.value) : 0;

      let totalRevenue = 0;
      if (paymentsRes.status === 'fulfilled') {
        const payments = getItems(paymentsRes.value);
        totalRevenue = payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
      }

      let recentUsers = [];
      if (usersRes.status === 'fulfilled') {
        const users = getItems(usersRes.value);
        recentUsers = users.slice(0, 5);
      }

      let recentRoleRequests = [];
      if (roleRequestsRes.status === 'fulfilled') {
        const requests = getItems(roleRequestsRes.value);
        recentRoleRequests = requests.slice(0, 5);
      }

      return {
        totalUsers, totalGuiders, totalPhotographers, totalPlaces, totalBookings,
        totalRevenue, totalReviews, pendingRoleRequests,
        userGrowth: [], bookingTrend: [], revenueByCategory: [], recentUsers, recentRoleRequests,
      };
    } catch (error) {
      if (import.meta.env.DEV) return defaultStats;
      return rejectWithValue(error.response?.data?.message || 'Failed to load dashboard');
    }
  }
);

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState: {
    stats: null,
    analytics: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearDashboardError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardStats.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchDashboardStats.fulfilled, (state, action) => { state.loading = false; state.stats = action.payload; state.error = null; })
      .addCase(fetchDashboardStats.rejected, (state, action) => { state.loading = false; state.error = action.payload; if (import.meta.env.DEV) state.stats = defaultStats; })
      .addCase(fetchAnalyticsData.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchAnalyticsData.fulfilled, (state, action) => { state.loading = false; state.analytics = action.payload; state.error = null; })
      .addCase(fetchAnalyticsData.rejected, (state, action) => { state.loading = false; state.error = action.payload; });
  },
});

export const { clearDashboardError } = dashboardSlice.actions;
export default dashboardSlice.reducer;