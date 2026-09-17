import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box, Grid, Paper, Typography, Avatar, Chip, Stack, Skeleton, Alert, Button,
  ToggleButton, ToggleButtonGroup, FormControl, InputLabel, Select, MenuItem,
} from '@mui/material';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, AreaChart, Area,
  CartesianGrid,
} from 'recharts';
import PanelHeader from '../components/PanelHeader';
import { fetchAnalyticsData } from '../redux/slices/dashboardSlice';
import { COLORS, FONT_DISPLAY } from '../theme/dashboardTheme';

const RANGE_OPTIONS = [
  { value: '7d', label: '7D' },
  { value: '30d', label: '30D' },
  { value: '90d', label: '90D' },
];

const Reports = () => {
  const dispatch = useDispatch();
  const { analytics, loading, error } = useSelector((state) => state.dashboard);
  const [range, setRange] = useState('30d');
  const [retryCount, setRetryCount] = useState(0);

  // 🔍 Log state changes for debugging
  useEffect(() => {
    console.log('📊 Analytics State:', analytics);
    console.log('🔄 Loading:', loading);
    console.log('❌ Error:', error);
  }, [analytics, loading, error]);

  // Fetch data on range change or retry
  useEffect(() => {
    console.log(`🚀 Fetching analytics data for range: ${range}`);
    dispatch(fetchAnalyticsData({ range }))
      .unwrap()
      .then((res) => {
        console.log('✅ Analytics API Response:', res);
        // Check for revenue key
        if (res) {
          const possibleRevenueKeys = ['revenueTrend', 'revenueData', 'revenue', 'monthlyRevenue'];
          const foundKey = possibleRevenueKeys.find(key => res[key] && Array.isArray(res[key]) && res[key].length > 0);
          if (foundKey) {
            console.log(`💰 Revenue data found under key: "${foundKey}"`, res[foundKey]);
          } else {
            console.warn('⚠️ No revenue data array found. Available keys:', Object.keys(res));
          }
        }
      })
      .catch((err) => {
        console.error('❌ Analytics API Error:', err);
      });
  }, [dispatch, range, retryCount]);

  const handleRangeChange = (e, newRange) => {
    if (newRange) setRange(newRange);
  };

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
  };

  // --- Smart data extraction with fallbacks ---
  const {
    bookingTrend = [],
    revenueTrend = [],
    revenueData = [],
    revenue = [],
    userGrowth = [],
    topGuiders = [],
    topPhotographers = [],
    bookingStatus = [],
  } = analytics || {};

  // Smart revenue selector
  const getRevenueData = () => {
    const possibleKeys = ['revenueTrend', 'revenueData', 'revenue', 'monthlyRevenue'];
    for (const key of possibleKeys) {
      if (analytics && analytics[key] && Array.isArray(analytics[key]) && analytics[key].length > 0) {
        console.log(`✅ Using revenue data from key: "${key}"`);
        return analytics[key];
      }
    }
    console.warn('⚠️ No revenue data found, using fallback');
    return [
      { month: 'Jan', revenue: 1200 },
      { month: 'Feb', revenue: 1800 },
      { month: 'Mar', revenue: 1500 },
      { month: 'Apr', revenue: 2200 },
      { month: 'May', revenue: 2000 },
      { month: 'Jun', revenue: 2800 },
    ];
  };

  const safeRevenueTrend = getRevenueData();

  // Smart booking trend selector
  const getBookingTrend = () => {
    if (analytics?.bookingTrend?.length) return analytics.bookingTrend;
    if (analytics?.bookingData?.length) return analytics.bookingData;
    if (analytics?.bookings?.length) return analytics.bookings;
    return [
      { month: 'Jan', bookings: 2 },
      { month: 'Feb', bookings: 4 },
      { month: 'Mar', bookings: 3 },
      { month: 'Apr', bookings: 6 },
      { month: 'May', bookings: 5 },
      { month: 'Jun', bookings: 8 },
    ];
  };
  const safeBookingTrend = getBookingTrend();

  // Smart user growth selector
  const getUserGrowth = () => {
    if (analytics?.userGrowth?.length) return analytics.userGrowth;
    if (analytics?.growth?.length) return analytics.growth;
    return [
      { month: 'Jan', users: 10 },
      { month: 'Feb', users: 18 },
      { month: 'Mar', users: 15 },
      { month: 'Apr', users: 25 },
      { month: 'May', users: 22 },
      { month: 'Jun', users: 32 },
    ];
  };
  const safeUserGrowth = getUserGrowth();

  // Smart booking status selector
  const getBookingStatus = () => {
    if (analytics?.bookingStatus?.length) return analytics.bookingStatus;
    if (analytics?.status?.length) return analytics.status;
    return [
      { status: 'PENDING', count: 5 },
      { status: 'APPROVED', count: 8 },
      { status: 'CANCELLED', count: 2 },
      { status: 'COMPLETED', count: 12 },
    ];
  };
  const safeBookingStatus = getBookingStatus();

  const hasRealData =
    (analytics?.bookingTrend?.length > 0) ||
    (analytics?.revenueTrend?.length > 0) ||
    (analytics?.userGrowth?.length > 0) ||
    (analytics?.bookingStatus?.length > 0);

  const colors = ['#6366F1', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  // --- ChartCard component ---
  const ChartCard = ({ title, subtitle, children, height = 320 }) => (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 4,
        border: `1px solid ${COLORS.border}`,
        bgcolor: '#FFFFFF',
        height: '100%',
        minHeight: 380,
        transition: 'all 0.3s ease-in-out',
        '&:hover': { boxShadow: '0 8px 30px rgba(0,0,0,0.08)', transform: 'translateY(-3px)' },
        overflow: 'visible',
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2.5 }}>
        <Box sx={{ width: 4, height: 32, borderRadius: 2, background: 'linear-gradient(180deg, #6366F1, #8B5CF6)' }} />
        <Box>
          <Typography variant="h6" fontWeight={700} sx={{ fontFamily: FONT_DISPLAY, fontSize: '1rem', color: '#1E293B' }}>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 500, letterSpacing: 0.3 }}>
              {subtitle}
            </Typography>
          )}
        </Box>
      </Stack>
      <Box sx={{ width: '100%', height: height, overflow: 'visible' }}>
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </Box>
    </Paper>
  );

  // --- Custom Tooltip ---
  const CustomTooltip = ({ active, payload, label, unit = '' }) => {
    if (active && payload && payload.length) {
      return (
        <Box sx={{ bgcolor: '#1E293B', p: 1.5, borderRadius: 2, boxShadow: '0 8px 24px rgba(0,0,0,0.2)', minWidth: 120 }}>
          <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 500 }}>{label}</Typography>
          {payload.map((item, idx) => (
            <Typography key={idx} variant="body2" sx={{ color: '#fff', fontWeight: 600, mt: 0.5 }}>
              {item.name}: {item.value} {unit}
            </Typography>
          ))}
        </Box>
      );
    }
    return null;
  };

  // --- TopList component ---
  const TopList = ({ items, type }) => {
    const safeItems = items?.length ? items : [];
    const isGuider = type === 'guider';
    const color = isGuider ? '#8B5CF6' : '#EC4899';
    const lightBg = isGuider ? '#F3E8FF' : '#FCE7F3';
    const textColor = isGuider ? '#7C3AED' : '#DB2777';
    const label = isGuider ? '🏆 Top Guiders' : '📸 Top Photographers';

    return (
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 4,
          border: `1px solid ${COLORS.border}`,
          bgcolor: '#FFFFFF',
          height: '100%',
          minHeight: 380,
          transition: 'all 0.3s ease-in-out',
          '&:hover': { boxShadow: '0 8px 30px rgba(0,0,0,0.08)', transform: 'translateY(-3px)' },
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2.5 }}>
          <Box sx={{ width: 4, height: 32, borderRadius: 2, bgcolor: color }} />
          <Typography variant="h6" fontWeight={700} sx={{ fontFamily: FONT_DISPLAY, fontSize: '1rem', color: '#1E293B' }}>
            {label}
          </Typography>
        </Stack>
        {safeItems.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
            <Typography color="textSecondary">No data available</Typography>
          </Box>
        ) : (
          <Stack spacing={2}>
            {safeItems.map((item, index) => (
              <Stack
                key={item.id || index}
                direction="row"
                alignItems="center"
                spacing={2}
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: index === 0 ? '#F8FAFC' : 'transparent',
                  border: index === 0 ? `1px solid ${COLORS.border}` : 'none',
                  transition: 'all 0.2s ease',
                  '&:hover': { bgcolor: '#F1F5F9' },
                }}
              >
                <Typography variant="h6" fontWeight={800} sx={{ color: color, width: 30, fontSize: '1rem' }}>
                  #{index + 1}
                </Typography>
                <Avatar src={item.User?.profileImage} sx={{ width: 44, height: 44, bgcolor: color }}>
                  {item.User?.firstName?.charAt(0) || (isGuider ? 'G' : 'P')}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" fontWeight={600} color="#1E293B">
                    {item.User?.firstName} {item.User?.lastName}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    {item.experience || 0} years experience
                  </Typography>
                </Box>
                <Chip label={`${item.experience || 0} yrs`} size="small" sx={{ bgcolor: lightBg, color: textColor, fontWeight: 600 }} />
              </Stack>
            ))}
          </Stack>
        )}
      </Paper>
    );
  };

  // --- Loading ---
  if (loading) {
    return (
      <Box sx={{ p: 3, bgcolor: '#F8FAFC', minHeight: '100vh' }}>
        <Skeleton variant="text" width={200} height={40} sx={{ mb: 3 }} />
        <Grid container spacing={3}>
          {[1, 2, 3, 4].map(i => (
            <Grid item xs={12} md={6} key={i}>
              <Skeleton variant="rounded" height={380} />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  // --- Error ---
  if (error) {
    return (
      <Box sx={{ p: 3, bgcolor: '#F8FAFC', minHeight: '100vh' }}>
        <PanelHeader eyebrow="Analytics" title="Reports & Analytics" />
        <Alert
          severity="error"
          action={<Button color="inherit" size="small" onClick={handleRetry}>Retry</Button>}
          sx={{ mt: 2 }}
        >
          <strong>Error loading data:</strong> {error}
          <br />
          <Typography variant="caption" color="text.secondary">
            Check console for details. Make sure your backend server is running.
          </Typography>
        </Alert>
        {/* Even on error, show fallback data so user sees something */}
        <Box sx={{ mt: 3 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            ⚠️ Showing sample data because live data couldn't be loaded.
          </Typography>
          {/* We'll render the charts with fallback data below */}
        </Box>
      </Box>
    );
  }

  // --- Main Render ---
  return (
    <Box sx={{ p: { xs: 2, md: 3 }, mt: 0, pt: 1, bgcolor: '#F8FAFC', minHeight: '100vh' }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={2} sx={{ mb: 2 }}>
        <PanelHeader eyebrow="Analytics" title="Reports & Analytics" />
        <Stack direction="row" spacing={2} alignItems="center">
          {/* 🔹 FILTER: Range Selector */}
          <ToggleButtonGroup
            value={range}
            exclusive
            size="small"
            onChange={handleRangeChange}
            sx={{
              bgcolor: '#fff',
              borderRadius: 999,
              p: 0.4,
              border: `1px solid ${COLORS.border}`,
              '& .MuiToggleButton-root': {
                borderRadius: '999px !important',
                border: 'none',
                textTransform: 'none',
                fontSize: 12.5,
                fontWeight: 600,
                px: 2,
                '&.Mui-selected': {
                  bgcolor: '#1E3A6E',
                  color: '#fff',
                  '&:hover': { bgcolor: '#1E3A6E' },
                },
              },
            }}
          >
            {RANGE_OPTIONS.map((opt) => (
              <ToggleButton key={opt.value} value={opt.value}>
                {opt.label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>

          {/* Live/Fallback Indicator */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: hasRealData ? '#10B981' : '#F59E0B' }} />
            <Typography variant="caption" color="text.secondary" fontWeight={500}>
              {hasRealData ? 'Live' : 'Fallback'}
            </Typography>
            {!hasRealData && (
              <Button size="small" onClick={handleRetry} sx={{ ml: 0.5, minWidth: 0, p: 0.5 }}>
                🔄
              </Button>
            )}
          </Box>
        </Stack>
      </Stack>

      <Grid container spacing={3}>
        {/* Row 1: Booking Trend + Revenue Trend */}
        <Grid item xs={12} md={6} sx={{ minWidth: 0 }}>
          <ChartCard title="📊 Booking Trend" subtitle="Monthly bookings" height={320}>
            <BarChart data={safeBookingTrend} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
              <defs>
                <linearGradient id="bookingGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366F1" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#818CF8" stopOpacity={0.6} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
              <XAxis dataKey="month" stroke="#94A3B8" tick={{ fontSize: 12, fontWeight: 500 }} tickMargin={12} axisLine={{ stroke: '#E2E8F0' }} />
              <YAxis stroke="#94A3B8" tick={{ fontSize: 12, fontWeight: 500 }} tickMargin={12} axisLine={{ stroke: '#E2E8F0' }} />
              <Tooltip content={<CustomTooltip unit="bookings" />} />
              <Legend verticalAlign="top" height={36} iconType="circle" iconSize={8} />
              <Bar dataKey="bookings" fill="url(#bookingGradient)" radius={[8, 8, 0, 0]} barSize={40} animationDuration={1500} />
            </BarChart>
          </ChartCard>
        </Grid>

        <Grid item xs={12} md={6} sx={{ minWidth: 0 }}>
          <ChartCard title="💰 Revenue Trend" subtitle="Monthly revenue" height={320}>
            <AreaChart data={safeRevenueTrend} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10B981" stopOpacity={0.7} />
                  <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
              <XAxis dataKey="month" stroke="#94A3B8" tick={{ fontSize: 12, fontWeight: 500 }} tickMargin={12} axisLine={{ stroke: '#E2E8F0' }} />
              <YAxis stroke="#94A3B8" tick={{ fontSize: 12, fontWeight: 500 }} tickMargin={12} axisLine={{ stroke: '#E2E8F0' }} />
              <Tooltip content={<CustomTooltip unit="$" />} />
              <Area type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#revenueGradient)" animationDuration={1500} />
            </AreaChart>
          </ChartCard>
        </Grid>

        {/* Row 2: User Growth + Booking Status */}
        <Grid item xs={12} md={6} sx={{ minWidth: 0 }}>
          <ChartCard title="👥 User Growth" subtitle="New users per month" height={320}>
            <LineChart data={safeUserGrowth} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
              <XAxis dataKey="month" stroke="#94A3B8" tick={{ fontSize: 12, fontWeight: 500 }} tickMargin={12} axisLine={{ stroke: '#E2E8F0' }} />
              <YAxis stroke="#94A3B8" tick={{ fontSize: 12, fontWeight: 500 }} tickMargin={12} axisLine={{ stroke: '#E2E8F0' }} />
              <Tooltip content={<CustomTooltip unit="users" />} />
              <Line type="monotone" dataKey="users" stroke="#8B5CF6" strokeWidth={3} dot={{ r: 6, fill: '#8B5CF6', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 8, fill: '#7C3AED' }} animationDuration={1500} />
            </LineChart>
          </ChartCard>
        </Grid>

        <Grid item xs={12} md={6} sx={{ minWidth: 0 }}>
          <ChartCard title="📈 Booking Status" subtitle="Current status distribution" height={320}>
            <PieChart margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
              <Pie data={safeBookingStatus} dataKey="count" nameKey="status" innerRadius={55} outerRadius={95} paddingAngle={4} strokeWidth={2} stroke="#fff" animationDuration={1500}>
                {safeBookingStatus.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', bgcolor: '#1E293B', color: '#fff' }} formatter={(value, name) => [`${value} bookings`, name]} />
              <Legend verticalAlign="bottom" height={36} iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 12, fontWeight: 500 }} />
            </PieChart>
          </ChartCard>
        </Grid>

        {/* Row 3: Top Guiders + Top Photographers */}
        <Grid item xs={12} md={6} sx={{ minWidth: 0 }}>
          <TopList items={topGuiders} type="guider" />
        </Grid>
        <Grid item xs={12} md={6} sx={{ minWidth: 0 }}>
          <TopList items={topPhotographers} type="photographer" />
        </Grid>
      </Grid>
    </Box>
  );
};

export default Reports;