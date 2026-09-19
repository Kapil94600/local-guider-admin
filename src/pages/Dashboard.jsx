// src/pages/Dashboard.jsx
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchDashboardStats,
  fetchAnalyticsData,
  clearDashboardError,
} from '../redux/slices/dashboardSlice';
import {
  FaUsers, FaUserTie, FaCamera, FaMapMarkerAlt, FaBook,
  FaStar, FaUserCog, FaArrowUp, FaArrowDown, FaWallet,
} from 'react-icons/fa';
import { RefreshRounded } from '@mui/icons-material';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip as ReTooltip,
  ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell,
  CartesianGrid,
} from 'recharts';
import {
  Box, Paper, Typography, Alert, Button, Skeleton, Chip,
  Stack, ToggleButton, ToggleButtonGroup, IconButton,
  Tooltip as MuiTooltip, Avatar, LinearProgress,
} from '@mui/material';
import PanelHeader from '../components/PanelHeader';

// ═══════════════════════════════════════════════════════════════
// DESIGN TOKENS
// ═══════════════════════════════════════════════════════════════
const T = {
  border: '#eef1f6',
  borderStrong: '#e2e8f0',
  surface: '#ffffff',
  surfaceSoft: '#fafbfc',
  textPrimary: '#0b1220',
  textMuted: '#64748b',
  textFaint: '#94a3b8',
  indigo: '#6366f1',
  indigoSoft: '#eef2ff',
  violet: '#8b5cf6',
  emerald: '#10b981',
  emeraldSoft: '#d1fae5',
  rose: '#f43f5e',
  roseSoft: '#ffe4e6',
  amber: '#f59e0b',
  sky: '#0ea5e9',
  radius: 3,
  fontDisplay: '"Inter", system-ui, -apple-system, sans-serif',
};

const RANGE_OPTIONS = [
  { value: '7d', label: '7d' },
  { value: '30d', label: '30d' },
  { value: '90d', label: '90d' },
];

// ═══════════════════════════════════════════════════════════════
// SPARKLINE
// ═══════════════════════════════════════════════════════════════
const Sparkline = ({ data, color, width = 60, height = 22 }) => {
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const step = width / (data.length - 1 || 1);
  const path = data
    .map((v, i) => {
      const x = i * step;
      const y = height - ((v - min) / range) * height;
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');
  const area = `${path} L ${width} ${height} L 0 ${height} Z`;
  const gid = `sp-${color.replace('#', '')}-${width}-${height}`;
  return (
    <Box sx={{ width, height, flexShrink: 0 }}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.35" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill={`url(#${gid})`} />
        <path
          d={path}
          fill="none"
          stroke={color}
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </Box>
  );
};

// ═══════════════════════════════════════════════════════════════
// HERO CARD
// ═══════════════════════════════════════════════════════════════
const HeroCard = ({ value, trend, trendValue, sparklineData }) => {
  const isUp = trend === 'up';
  return (
    <Paper
      elevation={0}
      sx={{
        position: 'relative',
        borderRadius: T.radius,
        overflow: 'hidden',
        p: 3,
        height: '100%',
        width: '100%',
        background:
          'linear-gradient(135deg, #1e1b4b 0%, #312e81 55%, #4c1d95 100%)',
        color: '#fff',
        border: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: -80,
          right: -80,
          width: 280,
          height: 280,
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(139,92,246,0.5), transparent 70%)',
          filter: 'blur(40px)',
          pointerEvents: 'none',
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          bottom: -60,
          left: -60,
          width: 220,
          height: 220,
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(99,102,241,0.35), transparent 70%)',
          filter: 'blur(40px)',
          pointerEvents: 'none',
        },
      }}
    >
      <Box sx={{ position: 'relative', zIndex: 1 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack direction="row" alignItems="center" spacing={1}>
            <Box
              sx={{
                width: 34,
                height: 34,
                borderRadius: 1.5,
                bgcolor: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <FaWallet size={14} />
            </Box>
            <Typography
              sx={{
                fontSize: '0.78rem',
                fontWeight: 600,
                color: 'rgba(255,255,255,0.75)',
              }}
            >
              Total Revenue
            </Typography>
          </Stack>
          <Chip
            label="This month"
            size="small"
            sx={{
              bgcolor: 'rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.9)',
              border: '1px solid rgba(255,255,255,0.15)',
              fontSize: '0.65rem',
              fontWeight: 600,
              height: 22,
              borderRadius: 999,
            }}
          />
        </Stack>
      </Box>

      <Box sx={{ position: 'relative', zIndex: 1, my: 2 }}>
        <Typography
          sx={{
            fontSize: { xs: '2.5rem', md: '2.75rem', lg: '3.25rem' },
            fontWeight: 800,
            letterSpacing: '-0.03em',
            lineHeight: 1,
            fontFamily: T.fontDisplay,
          }}
        >
          ₹{Number(value || 0).toLocaleString('en-IN')}
        </Typography>
        <Typography
          sx={{
            fontSize: '0.72rem',
            color: 'rgba(255,255,255,0.55)',
            mt: 1.5,
            fontWeight: 500,
          }}
        >
          Total earnings from all bookings
        </Typography>
      </Box>

      <Stack
        direction="row"
        alignItems="flex-end"
        justifyContent="space-between"
        sx={{ position: 'relative', zIndex: 1 }}
      >
        <Stack direction="row" alignItems="center" spacing={1}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.4,
              px: 1,
              py: 0.4,
              borderRadius: 999,
              bgcolor: isUp
                ? 'rgba(16,185,129,0.2)'
                : 'rgba(244,63,94,0.2)',
              color: isUp ? '#6ee7b7' : '#fda4af',
              fontSize: '0.72rem',
              fontWeight: 700,
              border: `1px solid ${
                isUp ? 'rgba(16,185,129,0.3)' : 'rgba(244,63,94,0.3)'
              }`,
            }}
          >
            {isUp ? <FaArrowUp size={8} /> : <FaArrowDown size={8} />}
            {trendValue}
          </Box>
          <Typography
            sx={{
              fontSize: '0.7rem',
              color: 'rgba(255,255,255,0.5)',
              fontWeight: 500,
            }}
          >
            vs last month
          </Typography>
        </Stack>
        <Box sx={{ opacity: 0.9 }}>
          <Sparkline
            data={sparklineData}
            color="#a78bfa"
            width={72}
            height={28}
          />
        </Box>
      </Stack>
    </Paper>
  );
};

// ═══════════════════════════════════════════════════════════════
// COMPACT STAT CARD
// ═══════════════════════════════════════════════════════════════
const CompactStatCard = ({
  title,
  value,
  icon: Icon,
  accent,
  trend,
  trendValue,
  sparkline,
}) => {
  const isUp = trend === 'up';
  return (
    <Paper
      elevation={0}
      sx={{
        position: 'relative',
        borderRadius: T.radius,
        bgcolor: T.surface,
        border: `1px solid ${T.border}`,
        p: 2,
        height: '100%',
        minHeight: 148,
        transition: 'all 0.25s ease',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        '&:hover': {
          borderColor: T.borderStrong,
          transform: 'translateY(-2px)',
          boxShadow: '0 12px 24px -16px rgba(15,23,42,0.15)',
        },
      }}
    >
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="flex-start"
        sx={{ mb: 1.5 }}
      >
        <Box
          sx={{
            width: 30,
            height: 30,
            borderRadius: 1.5,
            bgcolor: `${accent}12`,
            color: accent,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Icon size={13} />
        </Box>
        {sparkline && <Sparkline data={sparkline} color={accent} />}
      </Stack>

      <Box>
        <Typography
          sx={{
            fontSize: '0.68rem',
            fontWeight: 600,
            color: T.textMuted,
            mb: 0.5,
          }}
        >
          {title}
        </Typography>
        <Stack
          direction="row"
          alignItems="baseline"
          justifyContent="space-between"
        >
          <Typography
            sx={{
              fontSize: '1.35rem',
              fontWeight: 800,
              color: T.textPrimary,
              letterSpacing: '-0.02em',
              lineHeight: 1.1,
              fontFamily: T.fontDisplay,
            }}
          >
            {value}
          </Typography>
          {trend && (
            <Typography
              sx={{
                fontSize: '0.65rem',
                fontWeight: 700,
                color: isUp ? T.emerald : T.rose,
                display: 'flex',
                alignItems: 'center',
                gap: 0.2,
              }}
            >
              {isUp ? <FaArrowUp size={7} /> : <FaArrowDown size={7} />}
              {trendValue}
            </Typography>
          )}
        </Stack>
      </Box>
    </Paper>
  );
};

// ═══════════════════════════════════════════════════════════════
// PENDING REQUESTS CARD
// ═══════════════════════════════════════════════════════════════
const PendingCard = ({ value }) => (
  <Paper
    elevation={0}
    sx={{
      position: 'relative',
      borderRadius: T.radius,
      bgcolor: T.surface,
      border: `1px solid ${T.border}`,
      p: 2,
      height: '100%',
      minHeight: 148,
      transition: 'all 0.25s ease',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      '&:hover': {
        borderColor: T.borderStrong,
        transform: 'translateY(-2px)',
        boxShadow: '0 12px 24px -16px rgba(15,23,42,0.15)',
      },
    }}
  >
    <Stack
      direction="row"
      justifyContent="space-between"
      alignItems="flex-start"
      sx={{ mb: 1.5 }}
    >
      <Box
        sx={{
          width: 30,
          height: 30,
          borderRadius: 1.5,
          bgcolor: `${T.rose}12`,
          color: T.rose,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <FaUserCog size={13} />
      </Box>
      <Chip
        label="Action"
        size="small"
        sx={{
          bgcolor: T.roseSoft,
          color: T.rose,
          fontWeight: 700,
          fontSize: '0.58rem',
          height: 18,
          borderRadius: 999,
        }}
      />
    </Stack>

    <Box>
      <Typography
        sx={{
          fontSize: '0.68rem',
          fontWeight: 600,
          color: T.textMuted,
          mb: 0.5,
        }}
      >
        Pending Req.
      </Typography>
      <Stack
        direction="row"
        alignItems="baseline"
        justifyContent="space-between"
      >
        <Typography
          sx={{
            fontSize: '1.35rem',
            fontWeight: 800,
            color: T.textPrimary,
            letterSpacing: '-0.02em',
            lineHeight: 1.1,
            fontFamily: T.fontDisplay,
          }}
        >
          {value}
        </Typography>
        <Button
          size="small"
          href="/role-requests"
          sx={{
            textTransform: 'none',
            fontSize: '0.65rem',
            fontWeight: 700,
            color: T.indigo,
            minWidth: 'auto',
            px: 0.5,
            '&:hover': { bgcolor: T.indigoSoft },
          }}
        >
          View →
        </Button>
      </Stack>
    </Box>
  </Paper>
);

// ═══════════════════════════════════════════════════════════════
// SECTION HEADER
// ═══════════════════════════════════════════════════════════════
const SectionHeader = ({ title, subtitle, action }) => (
  <Stack
    direction="row"
    alignItems="flex-start"
    justifyContent="space-between"
    sx={{ mb: 2.5 }}
  >
    <Box>
      <Typography
        sx={{
          fontFamily: T.fontDisplay,
          fontWeight: 700,
          fontSize: '0.95rem',
          color: T.textPrimary,
          lineHeight: 1.3,
        }}
      >
        {title}
      </Typography>
      {subtitle && (
        <Typography
          sx={{
            fontSize: '0.72rem',
            color: T.textFaint,
            mt: 0.3,
            fontWeight: 500,
          }}
        >
          {subtitle}
        </Typography>
      )}
    </Box>
    {action}
  </Stack>
);

// ═══════════════════════════════════════════════════════════════
// CUSTOM TOOLTIP
// ═══════════════════════════════════════════════════════════════
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <Box
      sx={{
        bgcolor: '#0b1220',
        color: '#fff',
        px: 1.5,
        py: 1,
        borderRadius: 1.5,
        boxShadow: '0 12px 28px rgba(11,18,32,0.4)',
      }}
    >
      <Typography
        sx={{
          fontSize: '0.65rem',
          color: '#94a3b8',
          mb: 0.4,
          fontWeight: 600,
          textTransform: 'uppercase',
        }}
      >
        {label}
      </Typography>
      {payload.map((p, i) => (
        <Typography key={i} sx={{ fontSize: '0.8rem', fontWeight: 700 }}>
          {p.name || p.dataKey}: {p.value}
        </Typography>
      ))}
    </Box>
  );
};

// ═══════════════════════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════════════════════
const Dashboard = () => {
  const dispatch = useDispatch();
  const { stats, analytics, loading, error } = useSelector((s) => s.dashboard);
  const [range, setRange] = useState('30d');
  const [spinning, setSpinning] = useState(false);

  useEffect(() => {
    dispatch(fetchDashboardStats(range));
    dispatch(fetchAnalyticsData());
    return () => dispatch(clearDashboardError());
  }, [dispatch, range]);

  const handleRetry = () => {
    dispatch(clearDashboardError());
    dispatch(fetchDashboardStats(range));
    dispatch(fetchAnalyticsData());
  };

  const handleRefresh = () => {
    setSpinning(true);
    dispatch(fetchDashboardStats(range)).finally(() =>
      setTimeout(() => setSpinning(false), 600)
    );
    dispatch(fetchAnalyticsData());
  };

  // ─── LOADING ───
  if (loading && !stats) {
    return (
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <Skeleton variant="rounded" height={340} sx={{ borderRadius: 3, mb: 2.5 }} />
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: 'repeat(2, 1fr)',
              sm: 'repeat(4, 1fr)',
            },
            gap: 2.5,
          }}
        >
          {[1, 2, 3, 4].map((i) => (
            <Skeleton
              key={i}
              variant="rounded"
              height={148}
              sx={{ borderRadius: 3 }}
            />
          ))}
        </Box>
      </Box>
    );
  }

  // ─── ERROR ───
  if (error && !stats) {
    return (
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <Alert
          severity="error"
          action={
            <Button color="inherit" onClick={handleRetry}>
              Retry
            </Button>
          }
          sx={{ borderRadius: 2 }}
        >
          {error}
        </Alert>
      </Box>
    );
  }

  const d = {
    totalUsers: 0, totalGuiders: 0, totalPhotographers: 0,
    totalPlaces: 0, totalBookings: 0, totalRevenue: 0,
    totalReviews: 0, pendingRoleRequests: 0,
    recentUsers: [], recentRoleRequests: [],
    ...stats,
  };

  const sparkline = (seed) =>
    Array.from({ length: 8 }, (_, i) =>
      Math.max(2, Math.round((Math.sin(i + seed) + 1.2) * 40 + seed * 8))
    );

  const compactStats = [
    { key: 'totalUsers', title: 'Total Users', icon: FaUsers, accent: T.sky, trend: 'up', trendValue: '+12%' },
    { key: 'totalGuiders', title: 'Guiders', icon: FaUserTie, accent: T.violet, trend: 'up', trendValue: '+4%' },
    { key: 'totalBookings', title: 'Bookings', icon: FaBook, accent: T.emerald, trend: 'up', trendValue: '+15%' },
    { key: 'totalPlaces', title: 'Places', icon: FaMapMarkerAlt, accent: T.amber, trend: 'up', trendValue: '+8%' },
    { key: 'totalReviews', title: 'Reviews', icon: FaStar, accent: T.rose, trend: 'up', trendValue: '+3%' },
    { key: 'totalPhotographers', title: 'Photographers', icon: FaCamera, accent: T.indigo, trend: 'down', trendValue: '-2%' },
  ];

  const roleDist = [
    { name: 'Users', value: d.totalUsers, color: T.sky },
    { name: 'Guiders', value: d.totalGuiders, color: T.violet },
    { name: 'Photographers', value: d.totalPhotographers, color: T.rose },
  ];
  const totalRoleCount = roleDist.reduce((a, b) => a + b.value, 0);

  const bookingTrend = analytics?.bookingTrend?.length
    ? analytics.bookingTrend
    : Array.from({ length: 8 }, (_, i) => ({
        month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'][i],
        bookings: 0,
      }));

  const userGrowth = analytics?.userGrowth?.length
    ? analytics.userGrowth
    : Array.from({ length: 8 }, (_, i) => ({
        month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'][i],
        users: 0,
      }));

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1440, mx: 'auto' }}>
      {/* ═══════ HEADER ROW ═══════ */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ sm: 'center' }}
        spacing={2}
        sx={{ mb: 3.5 }}
      >
        <PanelHeader eyebrow="Overview" title="Dashboard" />
        <Stack direction="row" spacing={1.5} alignItems="center">
          <ToggleButtonGroup
            value={range}
            exclusive
            size="small"
            onChange={(_, v) => v && setRange(v)}
            sx={{
              bgcolor: '#fff',
              borderRadius: 999,
              p: 0.4,
              border: `1px solid ${T.border}`,
              '& .MuiToggleButton-root': {
                borderRadius: '999px !important',
                border: 'none',
                textTransform: 'none',
                fontSize: 12,
                fontWeight: 700,
                px: 1.75,
                py: 0.5,
                color: T.textMuted,
                '&.Mui-selected': {
                  bgcolor: T.textPrimary,
                  color: '#fff',
                  '&:hover': { bgcolor: T.textPrimary },
                },
              },
            }}
          >
            {RANGE_OPTIONS.map((o) => (
              <ToggleButton key={o.value} value={o.value}>
                {o.label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
          <MuiTooltip title="Refresh">
            <IconButton
              onClick={handleRefresh}
              sx={{
                bgcolor: '#fff',
                border: `1px solid ${T.border}`,
                width: 38,
                height: 38,
                '& svg': {
                  transition: 'transform 0.6s ease',
                  transform: spinning ? 'rotate(360deg)' : 'none',
                  color: T.textMuted,
                  fontSize: 18,
                },
                '&:hover': { borderColor: T.borderStrong, bgcolor: T.surfaceSoft },
              }}
            >
              <RefreshRounded />
            </IconButton>
          </MuiTooltip>
        </Stack>
      </Stack>

      {/* ═══════ ROW 1 — HERO + 8 COMPACT STATS (2×4 grid) ═══════ */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          gap: 2.5,
          mb: 2.5,
          alignItems: 'stretch',
        }}
      >
        {/* HERO */}
        <Box
          sx={{
            width: { xs: '100%', md: 'calc(33.333% - 13px)' },
            flexShrink: 0,
            display: 'flex',
            minHeight: { xs: 260, md: 340 },
          }}
        >
          <HeroCard
            value={d.totalRevenue}
            trend="up"
            trendValue="+9.2%"
            sparklineData={sparkline(3)}
          />
        </Box>

        {/* 8 compact stats — 2 rows × 4 cols */}
        <Box
          sx={{
            flex: 1,
            minWidth: 0,
            display: 'grid',
            gridTemplateColumns: {
              xs: 'repeat(2, 1fr)',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(4, 1fr)',
            },
            gap: 2.5,
            alignContent: 'stretch',
          }}
        >
          {compactStats.map((s, i) => (
            <CompactStatCard
              key={s.key}
              title={s.title}
              value={d[s.key] ?? 0}
              icon={s.icon}
              accent={s.accent}
              trend={s.trend}
              trendValue={s.trendValue}
              sparkline={sparkline(i + 1)}
            />
          ))}

          <PendingCard value={d.pendingRoleRequests} />

          <CompactStatCard
            title="Total Revenue"
            value={`₹${Number(d.totalRevenue || 0).toLocaleString('en-IN')}`}
            icon={FaWallet}
            accent={T.emerald}
            trend="up"
            trendValue="+9.2%"
            sparkline={sparkline(8)}
          />
        </Box>
      </Box>

      {/* ═══════ ROW 2 — User Growth + User Roles ═══════ */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' },
          gap: 2.5,
          mb: 2.5,
        }}
      >
        {/* User Growth */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: T.radius,
            border: `1px solid ${T.border}`,
            bgcolor: T.surface,
            minHeight: 380,
          }}
        >
          <SectionHeader
            title="User Growth"
            subtitle="New sign-ups trend"
            action={
              <Chip
                label="Last 8 months"
                size="small"
                sx={{
                  bgcolor: T.surfaceSoft,
                  color: T.textMuted,
                  border: `1px solid ${T.border}`,
                  fontWeight: 600,
                  fontSize: '0.68rem',
                  height: 24,
                  borderRadius: 999,
                }}
              />
            }
          />
          <Box sx={{ width: '100%', ml: -1 }}>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={userGrowth}>
                <defs>
                  <linearGradient id="growthGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={T.indigo} stopOpacity={0.28} />
                    <stop offset="100%" stopColor={T.indigo} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="month"
                  stroke="#cbd5e1"
                  tick={{ fontSize: 11, fontWeight: 600, fill: T.textFaint }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  stroke="#cbd5e1"
                  tick={{ fontSize: 11, fontWeight: 600, fill: T.textFaint }}
                  axisLine={false}
                  tickLine={false}
                  width={32}
                />
                <ReTooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="users"
                  stroke={T.indigo}
                  strokeWidth={2.5}
                  fill="url(#growthGrad)"
                  dot={{ fill: T.indigo, r: 3, strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 5, fill: T.indigo, stroke: '#fff', strokeWidth: 3 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </Box>
        </Paper>

        {/* User Roles */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: T.radius,
            border: `1px solid ${T.border}`,
            bgcolor: T.surface,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <SectionHeader
            title="User Roles"
            subtitle={`${totalRoleCount} total accounts`}
          />

          {totalRoleCount > 0 ? (
            <Stack direction="row" spacing={2.5} alignItems="center" sx={{ flex: 1 }}>
              <Box sx={{ position: 'relative', width: 140, height: 140, flexShrink: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={roleDist}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={46}
                      outerRadius={66}
                      paddingAngle={3}
                      stroke="none"
                    >
                      {roleDist.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <ReTooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <Box
                  sx={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    pointerEvents: 'none',
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: '1.35rem',
                      fontWeight: 800,
                      color: T.textPrimary,
                      lineHeight: 1,
                      fontFamily: T.fontDisplay,
                    }}
                  >
                    {totalRoleCount}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: '0.58rem',
                      color: T.textFaint,
                      fontWeight: 700,
                      letterSpacing: '0.1em',
                      mt: 0.4,
                      textTransform: 'uppercase',
                    }}
                  >
                    Total
                  </Typography>
                </Box>
              </Box>

              <Stack spacing={2} sx={{ flex: 1, minWidth: 0 }}>
                {roleDist.map((r) => {
                  const pct =
                    totalRoleCount > 0
                      ? Math.round((r.value / totalRoleCount) * 100)
                      : 0;
                  return (
                    <Box key={r.name}>
                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                        sx={{ mb: 0.6 }}
                      >
                        <Stack
                          direction="row"
                          alignItems="center"
                          spacing={0.75}
                          sx={{ minWidth: 0 }}
                        >
                          <Box
                            sx={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              bgcolor: r.color,
                              flexShrink: 0,
                            }}
                          />
                          <Typography
                            sx={{
                              fontSize: '0.72rem',
                              fontWeight: 600,
                              color: T.textPrimary,
                            }}
                            noWrap
                          >
                            {r.name}
                          </Typography>
                        </Stack>
                        <Stack direction="row" alignItems="baseline" spacing={0.75}>
                          <Typography
                            sx={{
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              color: T.textPrimary,
                            }}
                          >
                            {r.value}
                          </Typography>
                          <Typography
                            sx={{
                              fontSize: '0.62rem',
                              fontWeight: 700,
                              color: T.textFaint,
                              minWidth: 26,
                              textAlign: 'right',
                            }}
                          >
                            {pct}%
                          </Typography>
                        </Stack>
                      </Stack>
                      <LinearProgress
                        variant="determinate"
                        value={pct}
                        sx={{
                          height: 4,
                          borderRadius: 999,
                          bgcolor: '#f1f5f9',
                          '& .MuiLinearProgress-bar': {
                            bgcolor: r.color,
                            borderRadius: 999,
                          },
                        }}
                      />
                    </Box>
                  );
                })}
              </Stack>
            </Stack>
          ) : (
            <Box
              sx={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 200,
              }}
            >
              <Typography sx={{ color: T.textFaint, fontSize: '0.82rem' }}>
                No data available
              </Typography>
            </Box>
          )}
        </Paper>
      </Box>

      {/* ═══════ ROW 3 — Booking Trend ═══════ */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: T.radius,
          border: `1px solid ${T.border}`,
          bgcolor: T.surface,
          mb: 2.5,
        }}
      >
        <SectionHeader
          title="Booking Trend"
          subtitle="Monthly bookings overview"
          action={
            <Stack direction="row" alignItems="center" spacing={0.75}>
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  bgcolor: T.amber,
                }}
              />
              <Typography
                sx={{
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  color: T.textMuted,
                }}
              >
                Bookings
              </Typography>
            </Stack>
          }
        />
        <Box sx={{ width: '100%', ml: -1 }}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={bookingTrend}>
              <defs>
                <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={T.amber} stopOpacity={1} />
                  <stop offset="100%" stopColor={T.amber} stopOpacity={0.6} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="month"
                stroke="#cbd5e1"
                tick={{ fontSize: 11, fontWeight: 600, fill: T.textFaint }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                stroke="#cbd5e1"
                tick={{ fontSize: 11, fontWeight: 600, fill: T.textFaint }}
                axisLine={false}
                tickLine={false}
                width={32}
              />
              <ReTooltip
                content={<CustomTooltip />}
                cursor={{ fill: 'rgba(99,102,241,0.04)' }}
              />
              <Bar
                dataKey="bookings"
                fill="url(#barGrad)"
                radius={[6, 6, 0, 0]}
                barSize={36}
              />
            </BarChart>
          </ResponsiveContainer>
        </Box>
      </Paper>

      {/* ═══════ ROW 4 — Recent Activity ═══════ */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
          gap: 2.5,
        }}
      >
        {/* New Users */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: T.radius,
            border: `1px solid ${T.border}`,
            bgcolor: T.surface,
          }}
        >
          <SectionHeader
            title="New Users"
            subtitle="Recently joined"
            action={
              <Button
                size="small"
                href="/users"
                sx={{
                  textTransform: 'none',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: T.indigo,
                  minWidth: 'auto',
                }}
              >
                View all →
              </Button>
            }
          />
          {d.recentUsers?.length ? (
            <Stack spacing={0.5}>
              {d.recentUsers.slice(0, 5).map((user) => {
                const name =
                  `${user.firstName || ''} ${user.lastName || ''}`.trim() ||
                  'User';
                const initial = user.firstName?.charAt(0)?.toUpperCase() || 'U';
                return (
                  <Stack
                    key={user.id}
                    direction="row"
                    alignItems="center"
                    spacing={2}
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      '&:hover': { bgcolor: T.surfaceSoft },
                    }}
                  >
                    <Avatar
                      src={user.profileImage || undefined}
                      sx={{
                        width: 38,
                        height: 38,
                        background: `linear-gradient(135deg, ${T.indigo}, ${T.violet})`,
                        fontWeight: 700,
                        fontSize: '0.82rem',
                      }}
                    >
                      {initial}
                    </Avatar>
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography
                        sx={{
                          fontSize: '0.82rem',
                          fontWeight: 700,
                          color: T.textPrimary,
                        }}
                        noWrap
                      >
                        {name}
                      </Typography>
                      <Typography
                        sx={{ fontSize: '0.7rem', color: T.textFaint }}
                        noWrap
                      >
                        {user.email || '—'}
                      </Typography>
                    </Box>
                    <Chip
                      label={user.role || 'USER'}
                      size="small"
                      sx={{
                        bgcolor: T.surfaceSoft,
                        color: T.textMuted,
                        border: `1px solid ${T.border}`,
                        fontWeight: 700,
                        fontSize: '0.6rem',
                        height: 20,
                        borderRadius: 999,
                      }}
                    />
                  </Stack>
                );
              })}
            </Stack>
          ) : (
            <Box sx={{ py: 4, textAlign: 'center' }}>
              <Typography sx={{ color: T.textFaint, fontSize: '0.82rem' }}>
                No recent users
              </Typography>
            </Box>
          )}
        </Paper>

        {/* Role Requests */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: T.radius,
            border: `1px solid ${T.border}`,
            bgcolor: T.surface,
          }}
        >
          <SectionHeader
            title="Role Requests"
            subtitle="Awaiting your approval"
            action={
              <Button
                size="small"
                href="/role-requests"
                sx={{
                  textTransform: 'none',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: T.indigo,
                  minWidth: 'auto',
                }}
              >
                View all →
              </Button>
            }
          />
          {d.recentRoleRequests?.length ? (
            <Stack spacing={0.5}>
              {d.recentRoleRequests.slice(0, 5).map((req) => {
                const isGuider = req.requestedRole === 'GUIDER';
                return (
                  <Stack
                    key={req.id}
                    direction="row"
                    alignItems="center"
                    spacing={2}
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      '&:hover': { bgcolor: T.surfaceSoft },
                    }}
                  >
                    <Box
                      sx={{
                        width: 38,
                        height: 38,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: isGuider ? '#ede9fe' : '#fce7f3',
                        color: isGuider ? T.violet : T.rose,
                        flexShrink: 0,
                      }}
                    >
                      <FaUserCog size={14} />
                    </Box>
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography
                        sx={{
                          fontSize: '0.82rem',
                          fontWeight: 700,
                          color: T.textPrimary,
                        }}
                        noWrap
                      >
                        {req.fullName || 'Unknown'}
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: '0.68rem',
                          color: T.textFaint,
                          textTransform: 'uppercase',
                          fontWeight: 700,
                        }}
                        noWrap
                      >
                        → {req.requestedRole}
                      </Typography>
                    </Box>
                    <Chip
                      label={req.status}
                      size="small"
                      sx={{
                        bgcolor:
                          req.status === 'PENDING'
                            ? '#fef3c7'
                            : req.status === 'APPROVED'
                            ? T.emeraldSoft
                            : T.roseSoft,
                        color:
                          req.status === 'PENDING'
                            ? '#b45309'
                            : req.status === 'APPROVED'
                            ? '#047857'
                            : '#be123c',
                        fontWeight: 700,
                        fontSize: '0.6rem',
                        height: 20,
                        borderRadius: 999,
                      }}
                    />
                  </Stack>
                );
              })}
            </Stack>
          ) : (
            <Box sx={{ py: 4, textAlign: 'center' }}>
              <Typography sx={{ color: T.textFaint, fontSize: '0.82rem' }}>
                No role requests
              </Typography>
            </Box>
          )}
        </Paper>
      </Box>
    </Box>
  );
};

export default Dashboard;