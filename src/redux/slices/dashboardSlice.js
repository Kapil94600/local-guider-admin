// src/redux/slices/dashboardSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  getDashboardStats,
  getAnalyticsBookingTrend,
  getAnalyticsRevenueTrend,
  getAnalyticsUserGrowth,
  getAnalyticsTopGuiders,
  getAnalyticsTopPhotographers,
  getAnalyticsBookingStatus,
} from "../../api/admin";

// ═══════════════════════════════════════════════════════════════
// FETCH ANALYTICS — accepts { range } and forwards to backend
// ═══════════════════════════════════════════════════════════════
export const fetchAnalyticsData = createAsyncThunk(
  "dashboard/fetchAnalyticsData",
  async ({ range = "30d" } = {}, { rejectWithValue }) => {
    try {
      const [
        bookingTrendRes,
        revenueTrendRes,
        userGrowthRes,
        topGuidersRes,
        topPhotographersRes,
        bookingStatusRes,
      ] = await Promise.all([
        getAnalyticsBookingTrend({ range }),
        getAnalyticsRevenueTrend({ range }),
        getAnalyticsUserGrowth({ range }),
        getAnalyticsTopGuiders(),
        getAnalyticsTopPhotographers(),
        getAnalyticsBookingStatus(),
      ]);

      return {
        bookingTrend: bookingTrendRes.data?.data || [],
        revenueTrend: revenueTrendRes.data?.data || [],
        userGrowth: userGrowthRes.data?.data || [],
        topGuiders: topGuidersRes.data?.data || [],
        topPhotographers: topPhotographersRes.data?.data || [],
        bookingStatus: bookingStatusRes.data?.data || [],
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch analytics data"
      );
    }
  }
);

// ═══════════════════════════════════════════════════════════════
// FETCH DASHBOARD STATS
// Backend calculates all real data (no frontend fallbacks)
// ═══════════════════════════════════════════════════════════════
export const fetchDashboardStats = createAsyncThunk(
  "dashboard/fetchStats",
  async (_, { rejectWithValue }) => {
    try {
      const response = await getDashboardStats();
      const stats = response.data?.data || response.data;

      if (!stats || typeof stats !== "object") {
        throw new Error("Invalid dashboard response");
      }

      return stats;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to load dashboard"
      );
    }
  }
);

// ═══════════════════════════════════════════════════════════════
// SLICE
// ═══════════════════════════════════════════════════════════════
const dashboardSlice = createSlice({
  name: "dashboard",
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
    // ✅ Clear all state (for logout)
    resetDashboard: (state) => {
      state.stats = null;
      state.analytics = null;
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // ── Dashboard Stats ──
      .addCase(fetchDashboardStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDashboardStats.fulfilled, (state, action) => {
        state.loading = false;
        state.stats = action.payload;
        state.error = null;
      })
      .addCase(fetchDashboardStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.stats = null;
      })

      // ── Analytics ──
      .addCase(fetchAnalyticsData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAnalyticsData.fulfilled, (state, action) => {
        state.loading = false;
        state.analytics = action.payload;
        state.error = null;
      })
      .addCase(fetchAnalyticsData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.analytics = null;
      });
  },
});

export const { clearDashboardError, resetDashboard } = dashboardSlice.actions;
export default dashboardSlice.reducer;