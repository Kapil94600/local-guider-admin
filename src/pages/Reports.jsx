// src/pages/Reports.jsx
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Box,
  Paper,
  Typography,
  Avatar,
  Chip,
  Stack,
  Skeleton,
  Alert,
  Button,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip as MuiTooltip,
} from "@mui/material";
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import {
  RefreshRounded,
  TrendingUp,
  TrendingDown,
  EmojiEvents,
  CameraAlt,
  Payments,
  CalendarMonth,
} from "@mui/icons-material";
import PanelHeader from "../components/PanelHeader";
import { fetchAnalyticsData } from "../redux/slices/dashboardSlice";

// ═══════════════════════════════════════════════════════════════
// DESIGN TOKENS
// ═══════════════════════════════════════════════════════════════
const T = {
  border: "#eef1f6",
  borderStrong: "#e2e8f0",
  surface: "#ffffff",
  surfaceSoft: "#fafbfc",
  textPrimary: "#0b1220",
  textMuted: "#64748b",
  textFaint: "#94a3b8",
  indigo: "#6366f1",
  indigoSoft: "#eef2ff",
  violet: "#8b5cf6",
  violetSoft: "#ede9fe",
  emerald: "#10b981",
  emeraldSoft: "#d1fae5",
  rose: "#f43f5e",
  roseSoft: "#ffe4e6",
  amber: "#f59e0b",
  amberSoft: "#fef3c7",
  sky: "#0ea5e9",
  skySoft: "#e0f2fe",
  radius: 3,
  fontDisplay: '"Inter", system-ui, -apple-system, sans-serif',
};

const RANGE_OPTIONS = [
  { value: "7d", label: "7D" },
  { value: "30d", label: "30D" },
  { value: "90d", label: "90D" },
];

const STATUS_COLORS = {
  PENDING: "#f59e0b",
  APPROVED: "#10b981",
  PAID: "#8b5cf6",
  CANCELLED: "#f43f5e",
  COMPLETED: "#6366f1",
  REJECTED: "#ef4444",
};

// ═══════════════════════════════════════════════════════════════
// CUSTOM TOOLTIP
// ═══════════════════════════════════════════════════════════════
const CustomTooltip = ({ active, payload, label, unit = "" }) => {
  if (!active || !payload?.length) return null;
  return (
    <Box
      sx={{
        bgcolor: "#0b1220",
        color: "#fff",
        px: 1.75,
        py: 1.25,
        borderRadius: 2,
        boxShadow: "0 12px 28px rgba(11,18,32,0.4)",
        border: "1px solid rgba(255,255,255,0.08)",
        minWidth: 130,
      }}
    >
      <Typography
        sx={{
          fontSize: "0.65rem",
          color: "#94a3b8",
          mb: 0.5,
          fontWeight: 600,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </Typography>
      {payload.map((item, idx) => (
        <Typography key={idx} sx={{ fontSize: "0.82rem", fontWeight: 700 }}>
          {item.name}: {item.value} {unit}
        </Typography>
      ))}
    </Box>
  );
};

// ═══════════════════════════════════════════════════════════════
// CHART CARD
// ═══════════════════════════════════════════════════════════════
const ChartCard = ({
  title,
  subtitle,
  accent,
  badge,
  children,
  height = 320,
}) => (
  <Paper
    elevation={0}
    sx={{
      p: 3,
      borderRadius: T.radius,
      border: `1px solid ${T.border}`,
      bgcolor: T.surface,
      height: "100%",
      display: "flex",
      flexDirection: "column",
      transition: "all 0.25s ease",
      "&:hover": {
        borderColor: T.borderStrong,
        boxShadow: "0 12px 24px -16px rgba(15,23,42,0.15)",
      },
    }}
  >
    <Stack
      direction="row"
      alignItems="flex-start"
      justifyContent="space-between"
      sx={{ mb: 2.5 }}
    >
      <Stack direction="row" alignItems="center" spacing={1.5}>
        <Box
          sx={{
            width: 4,
            height: 24,
            borderRadius: 1,
            background:
              accent || `linear-gradient(135deg, ${T.indigo}, ${T.violet})`,
          }}
        />
        <Box>
          <Typography
            sx={{
              fontFamily: T.fontDisplay,
              fontWeight: 700,
              fontSize: "0.95rem",
              color: T.textPrimary,
              lineHeight: 1.3,
            }}
          >
            {title}
          </Typography>
          {subtitle && (
            <Typography
              sx={{
                fontSize: "0.72rem",
                color: T.textFaint,
                mt: 0.3,
                fontWeight: 500,
              }}
            >
              {subtitle}
            </Typography>
          )}
        </Box>
      </Stack>
      {badge && (
        <Chip
          label={badge}
          size="small"
          sx={{
            bgcolor: T.surfaceSoft,
            color: T.textMuted,
            border: `1px solid ${T.border}`,
            fontWeight: 600,
            fontSize: "0.68rem",
            height: 24,
            borderRadius: 999,
          }}
        />
      )}
    </Stack>

    <Box sx={{ width: "100%", height, ml: -1, flex: 1 }}>
      <ResponsiveContainer width="100%" height="100%">
        {children}
      </ResponsiveContainer>
    </Box>
  </Paper>
);

// ═══════════════════════════════════════════════════════════════
// EMPTY STATE (no fake data)
// ═══════════════════════════════════════════════════════════════
const EmptyState = ({ message = "No data yet", height = 320 }) => (
  <Box
    sx={{
      width: "100%",
      height,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      color: T.textFaint,
      gap: 1,
    }}
  >
    <Box
      sx={{
        width: 64,
        height: 64,
        borderRadius: "50%",
        bgcolor: T.surfaceSoft,
        border: `1px dashed ${T.border}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Box sx={{ fontSize: "1.75rem", opacity: 0.5 }}>📊</Box>
    </Box>
    <Typography sx={{ fontSize: "0.82rem", fontWeight: 600 }}>
      {message}
    </Typography>
    <Typography sx={{ fontSize: "0.7rem", color: T.textFaint }}>
      Data will appear here once available
    </Typography>
  </Box>
);

// ═══════════════════════════════════════════════════════════════
// TOP LIST CARD
// ═══════════════════════════════════════════════════════════════
const TopList = ({ items, type }) => {
  const safeItems = Array.isArray(items) ? items.slice(0, 5) : [];
  const isGuider = type === "guider";
  const accent = isGuider ? T.violet : T.rose;
  const accentSoft = isGuider ? T.violetSoft : T.roseSoft;

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: T.radius,
        border: `1px solid ${T.border}`,
        bgcolor: T.surface,
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 2.5 }}
      >
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box
            sx={{
              width: 4,
              height: 24,
              borderRadius: 1,
              bgcolor: accent,
            }}
          />
          <Stack direction="row" alignItems="center" spacing={1}>
            {isGuider ? (
              <EmojiEvents sx={{ fontSize: 16, color: accent }} />
            ) : (
              <CameraAlt sx={{ fontSize: 16, color: accent }} />
            )}
            <Typography
              sx={{
                fontFamily: T.fontDisplay,
                fontWeight: 700,
                fontSize: "0.95rem",
                color: T.textPrimary,
              }}
            >
              Top {isGuider ? "Guiders" : "Photographers"}
            </Typography>
          </Stack>
        </Stack>
        {safeItems.length > 0 && (
          <Chip
            label={`Top ${safeItems.length}`}
            size="small"
            sx={{
              bgcolor: accentSoft,
              color: accent,
              fontWeight: 700,
              fontSize: "0.65rem",
              height: 22,
              borderRadius: 999,
            }}
          />
        )}
      </Stack>

      {safeItems.length === 0 ? (
        <EmptyState message="No data available" height={200} />
      ) : (
        <Stack spacing={0.5}>
          {safeItems.map((item, index) => {
            const initials =
              `${item.User?.firstName?.charAt(0) || ""}${
                item.User?.lastName?.charAt(0) || ""
              }`.toUpperCase() || (isGuider ? "G" : "P");
            const name =
              `${item.User?.firstName || ""} ${
                item.User?.lastName || ""
              }`.trim() || "Unknown";

            return (
              <Stack
                key={item.id || index}
                direction="row"
                alignItems="center"
                spacing={2}
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  transition: "all 0.15s ease",
                  position: "relative",
                  ...(index === 0 && {
                    bgcolor: T.surfaceSoft,
                    border: `1px solid ${T.border}`,
                  }),
                  "&:hover": { bgcolor: T.surfaceSoft },
                }}
              >
                <Box
                  sx={{
                    width: 24,
                    height: 24,
                    borderRadius: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    bgcolor:
                      index === 0
                        ? "#fef3c7"
                        : index === 1
                        ? "#f1f5f9"
                        : index === 2
                        ? "#fed7aa"
                        : T.surfaceSoft,
                    color:
                      index === 0
                        ? "#b45309"
                        : index === 1
                        ? "#475569"
                        : index === 2
                        ? "#c2410c"
                        : T.textFaint,
                    fontWeight: 800,
                    fontSize: "0.68rem",
                    flexShrink: 0,
                  }}
                >
                  {index + 1}
                </Box>

                <Avatar
                  src={item.User?.profileImage || undefined}
                  sx={{
                    width: 40,
                    height: 40,
                    background: `linear-gradient(135deg, ${accent}, ${
                      isGuider ? "#a78bfa" : "#f472b6"
                    })`,
                    fontWeight: 700,
                    fontSize: "0.82rem",
                  }}
                >
                  {initials}
                </Avatar>

                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    sx={{
                      fontSize: "0.82rem",
                      fontWeight: 700,
                      color: T.textPrimary,
                      lineHeight: 1.3,
                    }}
                    noWrap
                  >
                    {name}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: "0.68rem",
                      color: T.textFaint,
                      fontWeight: 500,
                    }}
                    noWrap
                  >
                    {item.experience || 0} years experience
                  </Typography>
                </Box>

                <Chip
                  label={`${item.experience || 0} yrs`}
                  size="small"
                  sx={{
                    bgcolor: accentSoft,
                    color: accent,
                    fontWeight: 700,
                    fontSize: "0.62rem",
                    height: 22,
                    borderRadius: 999,
                  }}
                />
              </Stack>
            );
          })}
        </Stack>
      )}
    </Paper>
  );
};

// ═══════════════════════════════════════════════════════════════
// SUMMARY STAT CARD
// ═══════════════════════════════════════════════════════════════
const SummaryStat = ({
  title,
  value,
  icon: Icon,
  accent,
  trend,
  trendValue,
}) => {
  const isUp = trend === "up";
  // ✅ Hide misleading +100% / +0%
  const cleanTrendValue =
    trendValue === "+100%" || trendValue === "+0%" ? null : trendValue;
  const showTrend = cleanTrendValue && trend;

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        borderRadius: T.radius,
        border: `1px solid ${T.border}`,
        bgcolor: T.surface,
        transition: "all 0.25s ease",
        "&:hover": {
          borderColor: T.borderStrong,
          transform: "translateY(-2px)",
          boxShadow: "0 12px 24px -16px rgba(15,23,42,0.15)",
        },
      }}
    >
      <Stack
        direction="row"
        alignItems="flex-start"
        justifyContent="space-between"
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            sx={{
              fontSize: "0.68rem",
              fontWeight: 600,
              color: T.textMuted,
              mb: 0.5,
              letterSpacing: "0.02em",
            }}
          >
            {title}
          </Typography>
          <Typography
            sx={{
              fontSize: "1.5rem",
              fontWeight: 800,
              color: T.textPrimary,
              letterSpacing: "-0.02em",
              lineHeight: 1.1,
              fontFamily: T.fontDisplay,
            }}
          >
            {value}
          </Typography>
          {showTrend && (
            <Stack
              direction="row"
              alignItems="center"
              spacing={0.5}
              sx={{ mt: 1 }}
            >
              <Typography
                sx={{
                  fontSize: "0.65rem",
                  fontWeight: 700,
                  color: isUp ? T.emerald : T.rose,
                  display: "flex",
                  alignItems: "center",
                  gap: 0.2,
                }}
              >
                {isUp ? (
                  <TrendingUp sx={{ fontSize: 12 }} />
                ) : (
                  <TrendingDown sx={{ fontSize: 12 }} />
                )}
                {cleanTrendValue}
              </Typography>
              <Typography
                sx={{
                  fontSize: "0.62rem",
                  color: T.textFaint,
                  fontWeight: 500,
                }}
              >
                vs last period
              </Typography>
            </Stack>
          )}
        </Box>
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: 2,
            bgcolor: `${accent}12`,
            color: accent,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Icon sx={{ fontSize: 16 }} />
        </Box>
      </Stack>
    </Paper>
  );
};

// ═══════════════════════════════════════════════════════════════
// REPORTS
// ═══════════════════════════════════════════════════════════════
const Reports = () => {
  const dispatch = useDispatch();
  const { analytics, loading, error } = useSelector((state) => state.dashboard);
  const [range, setRange] = useState("30d");
  const [retryCount, setRetryCount] = useState(0);
  const [spinning, setSpinning] = useState(false);

  // ✅ FIX: range passed to thunk, slice forwards to API
  useEffect(() => {
    dispatch(fetchAnalyticsData({ range }))
      .unwrap()
      .catch((err) => console.error("❌ Analytics fetch failed:", err));
  }, [dispatch, range, retryCount]);

  const handleRangeChange = (_, newRange) => {
    if (newRange) setRange(newRange);
  };

  const handleRetry = () => {
    setSpinning(true);
    setRetryCount((prev) => prev + 1);
    setTimeout(() => setSpinning(false), 600);
  };

  // ═══════════════════════════════════════════════════════════════
  // ✅ NO FALLBACK DATA — only real backend data
  // ═══════════════════════════════════════════════════════════════
  const safeBookingTrend = Array.isArray(analytics?.bookingTrend)
    ? analytics.bookingTrend
    : [];

  const safeRevenueTrend = (() => {
    const keys = ["revenueTrend", "revenueData", "revenue", "monthlyRevenue"];
    for (const k of keys) {
      if (Array.isArray(analytics?.[k]) && analytics[k].length > 0) {
        return analytics[k];
      }
    }
    return [];
  })();

  const safeUserGrowth = Array.isArray(analytics?.userGrowth)
    ? analytics.userGrowth
    : [];

  const safeBookingStatus = Array.isArray(analytics?.bookingStatus)
    ? analytics.bookingStatus
    : [];

  const topGuiders = Array.isArray(analytics?.topGuiders)
    ? analytics.topGuiders
    : [];
  const topPhotographers = Array.isArray(analytics?.topPhotographers)
    ? analytics.topPhotographers
    : [];

  const hasBookingTrend = safeBookingTrend.length > 0;
  const hasRevenueTrend = safeRevenueTrend.length > 0;
  const hasUserGrowth = safeUserGrowth.length > 0;
  const hasBookingStatus = safeBookingStatus.length > 0;

  const hasAnyData =
    hasBookingTrend || hasRevenueTrend || hasUserGrowth || hasBookingStatus;

  // Summary stats — only from real data
  const totalRevenue = safeRevenueTrend.reduce(
    (a, b) => a + Number(b.revenue || 0),
    0
  );
  const totalBookings = safeBookingTrend.reduce(
    (a, b) => a + Number(b.bookings || 0),
    0
  );
  const totalUsers = safeUserGrowth.reduce(
    (a, b) => a + Number(b.users || 0),
    0
  );
  const totalStatus = safeBookingStatus.reduce(
    (a, b) => a + Number(b.count || 0),
    0
  );

  // ─── LOADING ───
  if (loading && !analytics) {
    return (
      <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1440, mx: "auto" }}>
        <Skeleton
          variant="rounded"
          height={72}
          sx={{ borderRadius: 3, mb: 2.5 }}
        />
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" },
            gap: 2.5,
            mb: 2.5,
          }}
        >
          {[1, 2, 3, 4].map((i) => (
            <Skeleton
              key={i}
              variant="rounded"
              height={110}
              sx={{ borderRadius: 3 }}
            />
          ))}
        </Box>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
            gap: 2.5,
          }}
        >
          {[1, 2, 3, 4].map((i) => (
            <Skeleton
              key={i}
              variant="rounded"
              height={380}
              sx={{ borderRadius: 3 }}
            />
          ))}
        </Box>
      </Box>
    );
  }

  // ─── ERROR ───
  if (error && !analytics) {
    return (
      <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1440, mx: "auto" }}>
        <PanelHeader eyebrow="Analytics" title="Reports" />
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={handleRetry}>
              Retry
            </Button>
          }
          sx={{ mt: 2, borderRadius: 2 }}
        >
          <strong>Error loading data:</strong> {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1440, mx: "auto" }}>
      {/* ═══════ HEADER ROW ═══════ */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ sm: "center" }}
        spacing={2}
        sx={{ mb: 3.5 }}
      >
        <PanelHeader eyebrow="Analytics" title="Reports" />

        <Stack direction="row" spacing={1.5} alignItems="center">
          {/* Live/Fallback indicator */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.75,
              px: 1.5,
              py: 0.6,
              borderRadius: 999,
              bgcolor: "#fff",
              border: `1px solid ${T.border}`,
            }}
          >
            <Box
              sx={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                bgcolor: hasAnyData ? T.emerald : T.amber,
                boxShadow: hasAnyData
                  ? `0 0 0 3px ${T.emerald}30`
                  : `0 0 0 3px ${T.amber}30`,
              }}
            />
            <Typography
              sx={{
                fontSize: "0.7rem",
                fontWeight: 600,
                color: hasAnyData ? T.emerald : "#b45309",
              }}
            >
              {hasAnyData ? "Live Data" : "No Data"}
            </Typography>
          </Box>

          {/* Range selector */}
          <ToggleButtonGroup
            value={range}
            exclusive
            size="small"
            onChange={handleRangeChange}
            sx={{
              bgcolor: "#fff",
              borderRadius: 999,
              p: 0.4,
              border: `1px solid ${T.border}`,
              "& .MuiToggleButton-root": {
                borderRadius: "999px !important",
                border: "none",
                textTransform: "none",
                fontSize: 12,
                fontWeight: 700,
                px: 1.75,
                py: 0.5,
                color: T.textMuted,
                "&.Mui-selected": {
                  bgcolor: T.textPrimary,
                  color: "#fff",
                  "&:hover": { bgcolor: T.textPrimary },
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

          {/* Refresh */}
          <MuiTooltip title="Refresh data">
            <span>
              <Button
                onClick={handleRetry}
                disabled={loading}
                sx={{
                  minWidth: 38,
                  width: 38,
                  height: 38,
                  borderRadius: 999,
                  p: 0,
                  bgcolor: "#fff",
                  border: `1px solid ${T.border}`,
                  color: T.textMuted,
                  "&:hover": {
                    bgcolor: T.surfaceSoft,
                    borderColor: T.borderStrong,
                  },
                }}
              >
                <RefreshRounded
                  sx={{
                    fontSize: 18,
                    transition: "transform 0.6s ease",
                    transform: spinning ? "rotate(360deg)" : "none",
                  }}
                />
              </Button>
            </span>
          </MuiTooltip>
        </Stack>
      </Stack>

      {/* ═══════ SUMMARY STATS ═══════ */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr 1fr",
            sm: "1fr 1fr",
            md: "repeat(4, 1fr)",
          },
          gap: 2.5,
          mb: 2.5,
        }}
      >
        <SummaryStat
          title="Total Revenue"
          value={`₹${totalRevenue.toLocaleString("en-IN")}`}
          icon={Payments}
          accent={T.emerald}
        />
        <SummaryStat
          title="Total Bookings"
          value={totalBookings}
          icon={CalendarMonth}
          accent={T.indigo}
        />
        <SummaryStat
          title="New Users"
          value={totalUsers}
          icon={TrendingUp}
          accent={T.violet}
        />
        <SummaryStat
          title="Total Status"
          value={totalStatus}
          icon={TrendingDown}
          accent={T.amber}
        />
      </Box>

      {/* ═══════ CHARTS ROW 1 ═══════ */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
          gap: 2.5,
          mb: 2.5,
        }}
      >
        {/* Booking Trend */}
        <ChartCard
          title="Booking Trend"
          subtitle="Monthly bookings"
          accent={`linear-gradient(135deg, ${T.indigo}, ${T.violet})`}
          badge={hasBookingTrend ? "Bar" : "No Data"}
        >
          {hasBookingTrend ? (
            <BarChart
              data={safeBookingTrend}
              margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
            >
              <defs>
                <linearGradient
                  id="bookingGrad"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor={T.indigo} stopOpacity={1} />
                  <stop
                    offset="100%"
                    stopColor={T.indigo}
                    stopOpacity={0.6}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#f1f5f9"
                vertical={false}
              />
              <XAxis
                dataKey="month"
                stroke="#cbd5e1"
                tick={{
                  fontSize: 11,
                  fontWeight: 600,
                  fill: T.textFaint,
                }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                stroke="#cbd5e1"
                tick={{
                  fontSize: 11,
                  fontWeight: 600,
                  fill: T.textFaint,
                }}
                axisLine={false}
                tickLine={false}
                width={32}
              />
              <Tooltip
                content={<CustomTooltip unit="bookings" />}
                cursor={{ fill: "rgba(99,102,241,0.04)" }}
              />
              <Bar
                dataKey="bookings"
                fill="url(#bookingGrad)"
                radius={[6, 6, 0, 0]}
                barSize={36}
              />
            </BarChart>
          ) : (
            <EmptyState message="No booking data" />
          )}
        </ChartCard>

        {/* Revenue Trend */}
        <ChartCard
          title="Revenue Trend"
          subtitle="Monthly revenue"
          accent={`linear-gradient(135deg, ${T.emerald}, #34d399)`}
          badge={hasRevenueTrend ? "Area" : "No Data"}
        >
          {hasRevenueTrend ? (
            <AreaChart
              data={safeRevenueTrend}
              margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
            >
              <defs>
                <linearGradient
                  id="revenueGrad"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="0%"
                    stopColor={T.emerald}
                    stopOpacity={0.4}
                  />
                  <stop
                    offset="100%"
                    stopColor={T.emerald}
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#f1f5f9"
                vertical={false}
              />
              <XAxis
                dataKey="month"
                stroke="#cbd5e1"
                tick={{
                  fontSize: 11,
                  fontWeight: 600,
                  fill: T.textFaint,
                }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                stroke="#cbd5e1"
                tick={{
                  fontSize: 11,
                  fontWeight: 600,
                  fill: T.textFaint,
                }}
                axisLine={false}
                tickLine={false}
                width={32}
              />
              <Tooltip content={<CustomTooltip unit="₹" />} />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke={T.emerald}
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#revenueGrad)"
                dot={{
                  fill: T.emerald,
                  r: 3,
                  strokeWidth: 2,
                  stroke: "#fff",
                }}
                activeDot={{
                  r: 5,
                  fill: T.emerald,
                  stroke: "#fff",
                  strokeWidth: 3,
                }}
              />
            </AreaChart>
          ) : (
            <EmptyState message="No revenue data" />
          )}
        </ChartCard>
      </Box>

      {/* ═══════ CHARTS ROW 2 ═══════ */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
          gap: 2.5,
          mb: 2.5,
        }}
      >
        {/* User Growth */}
        <ChartCard
          title="User Growth"
          subtitle="New users per month"
          accent={`linear-gradient(135deg, ${T.violet}, #a78bfa)`}
          badge={hasUserGrowth ? "Line" : "No Data"}
        >
          {hasUserGrowth ? (
            <LineChart
              data={safeUserGrowth}
              margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#f1f5f9"
                vertical={false}
              />
              <XAxis
                dataKey="month"
                stroke="#cbd5e1"
                tick={{
                  fontSize: 11,
                  fontWeight: 600,
                  fill: T.textFaint,
                }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                stroke="#cbd5e1"
                tick={{
                  fontSize: 11,
                  fontWeight: 600,
                  fill: T.textFaint,
                }}
                axisLine={false}
                tickLine={false}
                width={32}
              />
              <Tooltip content={<CustomTooltip unit="users" />} />
              <Line
                type="monotone"
                dataKey="users"
                stroke={T.violet}
                strokeWidth={2.5}
                dot={{
                  r: 4,
                  fill: T.violet,
                  strokeWidth: 2,
                  stroke: "#fff",
                }}
                activeDot={{
                  r: 6,
                  fill: T.violet,
                  stroke: "#fff",
                  strokeWidth: 3,
                }}
              />
            </LineChart>
          ) : (
            <EmptyState message="No user growth data" />
          )}
        </ChartCard>

        {/* Booking Status */}
        <ChartCard
          title="Booking Status"
          subtitle="Current distribution"
          accent={`linear-gradient(135deg, ${T.amber}, ${T.rose})`}
          badge={hasBookingStatus ? "Donut" : "No Data"}
        >
          {hasBookingStatus ? (
            <PieChart margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
              <Pie
                data={safeBookingStatus}
                dataKey="count"
                nameKey="status"
                innerRadius={55}
                outerRadius={90}
                paddingAngle={4}
                strokeWidth={2}
                stroke="#fff"
              >
                {safeBookingStatus.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      STATUS_COLORS[entry.status] ||
                      Object.values(STATUS_COLORS)[index % 6]
                    }
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip unit="bookings" />} />
              <Legend
                verticalAlign="bottom"
                height={36}
                iconType="circle"
                iconSize={10}
                formatter={(value) => (
                  <span
                    style={{
                      color: T.textMuted,
                      fontSize: "0.75rem",
                      fontWeight: 600,
                    }}
                  >
                    {value}
                  </span>
                )}
              />
            </PieChart>
          ) : (
            <EmptyState message="No status data" />
          )}
        </ChartCard>
      </Box>

      {/* ═══════ TOP LISTS ROW ═══════ */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
          gap: 2.5,
        }}
      >
        <TopList items={topGuiders} type="guider" />
        <TopList items={topPhotographers} type="photographer" />
      </Box>
    </Box>
  );
};

export default Reports;