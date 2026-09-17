import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchDashboardStats, fetchAnalyticsData, clearDashboardError } from '../redux/slices/dashboardSlice';
import {
    FaUsers, FaUserTie, FaCamera, FaMapMarkerAlt, FaBook, FaDollarSign, FaStar, FaUserCog,
} from 'react-icons/fa';
import { RefreshRounded } from '@mui/icons-material';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area,
    PieChart, Pie, Cell, Legend,
} from 'recharts';
import {
    Box, Paper, Typography, Alert, Button, Skeleton, Chip,
    Stack, ToggleButton, ToggleButtonGroup, IconButton, Tooltip as MuiTooltip,
    Card, CardContent, Avatar, LinearProgress, useTheme,
    Grid,   // <-- Grid imported from @mui/material
} from '@mui/material';
import PanelHeader from '../components/PanelHeader';
import { COLORS, FONT_DISPLAY } from '../theme/dashboardTheme';

const RANGE_OPTIONS = [
    { value: '7d', label: '7D' },
    { value: '30d', label: '30D' },
    { value: '90d', label: '90D' },
];

const StatsCard = ({ title, value, icon, color, gradient, trend, trendValue }) => {
    const theme = useTheme();

    return (
        <Card
            elevation={2}
            sx={{
                borderRadius: 4,
                position: 'relative',
                overflow: 'hidden',
                transition: 'all 0.25s ease-in-out',
                '&:hover': { transform: 'translateY(-4px)', boxShadow: theme.shadows[8] },
                borderLeft: `6px solid ${color}`,
                bgcolor: '#FFFFFF',
                height: '100%',
            }}
        >
            <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box>
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500, letterSpacing: 0.5 }}>
                            {title}
                        </Typography>
                        <Typography variant="h5" sx={{ fontWeight: 700, mt: 0.5, color: 'text.primary' }}>
                            {value}
                        </Typography>
                    </Box>
                    <Avatar
                        sx={{
                            bgcolor: gradient ? `url(${gradient})` : color,
                            width: 48,
                            height: 48,
                            borderRadius: 2,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fff',
                        }}
                    >
                        {icon}
                    </Avatar>
                </Box>
                {trend && (
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1.5 }}>
                        <Chip
                            label={`${trend === 'up' ? '▲' : '▼'} ${trendValue}`}
                            size="small"
                            sx={{
                                bgcolor: trend === 'up' ? '#E8F5E9' : '#FFEBEE',
                                color: trend === 'up' ? '#2E7D32' : '#C62828',
                                fontWeight: 600,
                                fontSize: '0.7rem',
                            }}
                        />
                        <Typography variant="caption" sx={{ ml: 1, color: 'text.secondary' }}>
                            vs previous period
                        </Typography>
                    </Box>
                )}
            </CardContent>
            <LinearProgress
                variant="determinate"
                value={Math.min(100, (value / (value + 10)) * 100)}
                sx={{
                    height: 3,
                    bgcolor: 'transparent',
                    '& .MuiLinearProgress-bar': { bgcolor: color },
                }}
            />
        </Card>
    );
};

const ChartHeader = ({ title, gradient, badge }) => (
    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
            <span style={{ display: 'inline-block', width: 4, height: 24, background: gradient, borderRadius: 2 }} />
            <Typography variant="h6" sx={{ fontFamily: FONT_DISPLAY, fontWeight: 600 }}>
                {title}
            </Typography>
        </Stack>
        {badge && (
            <Chip
                label={badge}
                size="small"
                sx={{
                    bgcolor: '#F1F5F9',
                    color: '#475569',
                    fontWeight: 600,
                    fontSize: '0.7rem',
                    borderRadius: 999,
                }}
            />
        )}
    </Stack>
);

const Dashboard = () => {
    const dispatch = useDispatch();
    const { stats, analytics, loading, error } = useSelector((state) => state.dashboard);
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
        dispatch(fetchDashboardStats(range)).finally(() => {
            setTimeout(() => setSpinning(false), 600);
        });
        dispatch(fetchAnalyticsData());
    };

    const pageBackground = {
        background: 'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)',
        backgroundAttachment: 'fixed',
    };

    if (loading && !stats) {
        return (
            <Box sx={{ ...pageBackground, minHeight: '100vh', p: 3 }}>
                <Grid container spacing={2.5}>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
                        <Grid item xs={12} sm={6} md={4} lg={3} key={item}>
                            <Skeleton variant="rounded" height={150} />
                        </Grid>
                    ))}
                </Grid>
            </Box>
        );
    }

    if (error && !stats) {
        return (
            <Box sx={{ ...pageBackground, minHeight: '100vh', p: 3 }}>
                <Alert severity="error" action={<Button color="inherit" onClick={handleRetry}>Retry</Button>}>
                    {error}
                </Alert>
            </Box>
        );
    }

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
        recentUsers: [],
        recentRoleRequests: [],
    };

    const data = { ...defaultStats, ...stats };

    const statCards = [
        { key: 'totalUsers', title: 'Total Users', icon: <FaUsers size={24} />, color: '#0EA5E9', gradient: 'linear-gradient(135deg, #0EA5E9, #38BDF8)', trend: 'up', trendValue: '+12%' },
        { key: 'totalGuiders', title: 'Guiders', icon: <FaUserTie size={24} />, color: '#8B5CF6', gradient: 'linear-gradient(135deg, #8B5CF6, #A78BFA)', trend: 'up', trendValue: '+4%' },
        { key: 'totalPhotographers', title: 'Photographers', icon: <FaCamera size={24} />, color: '#EC4899', gradient: 'linear-gradient(135deg, #EC4899, #F472B6)', trend: 'down', trendValue: '-2%' },
        { key: 'totalPlaces', title: 'Places', icon: <FaMapMarkerAlt size={24} />, color: '#F59E0B', gradient: 'linear-gradient(135deg, #F59E0B, #FBBF24)', trend: 'up', trendValue: '+8%' },
        { key: 'totalBookings', title: 'Bookings', icon: <FaBook size={24} />, color: '#10B981', gradient: 'linear-gradient(135deg, #10B981, #34D399)', trend: 'up', trendValue: '+15%' },
        { key: 'totalRevenue', title: 'Revenue', icon: <FaDollarSign size={24} />, color: '#3B82F6', gradient: 'linear-gradient(135deg, #3B82F6, #60A5FA)', trend: 'up', trendValue: '+9%' },
        { key: 'totalReviews', title: 'Reviews', icon: <FaStar size={24} />, color: '#F472B6', gradient: 'linear-gradient(135deg, #F472B6, #FB7185)', trend: 'up', trendValue: '+3%' },
        { key: 'pendingRoleRequests', title: 'Pending Requests', icon: <FaUserCog size={24} />, color: '#F43F5E', gradient: 'linear-gradient(135deg, #F43F5E, #FB7185)', trend: 'down', trendValue: '-1%' },
    ];

    const roleDistributionData = [
        { name: 'Users', value: data.totalUsers },
        { name: 'Guiders', value: data.totalGuiders },
        { name: 'Photographers', value: data.totalPhotographers },
    ];
    const roleDistributionColors = ['#0EA5E9', '#8B5CF6', '#EC4899'];
    const hasRoleDistributionData = roleDistributionData.some((d) => d.value > 0);

    const analyticsBookingTrend = analytics?.bookingTrend || [];
    const analyticsUserGrowth = analytics?.userGrowth || [];

    return (
        <Box className="fade-in" sx={{ ...pageBackground, minHeight: '100vh', p: { xs: 2, md: 3 }, mt: 0, pt: 1 }}>
            {/* Header */}
            <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={1.5} sx={{ mb: 2 }}>
                <PanelHeader eyebrow="Overview" title="Admin Dashboard" />
                <Stack direction="row" spacing={1.5} alignItems="center">
                    <ToggleButtonGroup
                        value={range}
                        exclusive
                        size="small"
                        onChange={(e, val) => val && setRange(val)}
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
                    <MuiTooltip title="Refresh data">
                        <IconButton
                            onClick={handleRefresh}
                            sx={{
                                bgcolor: '#fff',
                                border: `1px solid ${COLORS.border}`,
                                '& svg': {
                                    transition: 'transform 0.6s ease',
                                    transform: spinning ? 'rotate(360deg)' : 'none',
                                },
                            }}
                        >
                            <RefreshRounded fontSize="small" />
                        </IconButton>
                    </MuiTooltip>
                </Stack>
            </Stack>

            {/* Stats Cards */}
            <Grid container spacing={2.5} sx={{ mb: 3 }}>
                {statCards.map((card) => (
                    <Grid item xs={12} sm={6} md={4} lg={3} key={card.key}>
                        <StatsCard
                            title={card.title}
                            value={data[card.key] ?? 0}
                            icon={card.icon}
                            color={card.color}
                            gradient={card.gradient}
                            trend={card.trend}
                            trendValue={card.trendValue}
                        />
                    </Grid>
                ))}
            </Grid>

            {/* Charts Row */}
            <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
                <Grid item xs={12} lg={6}>
                    <Paper elevation={2} sx={{ p: 3, borderRadius: 4, border: `1px solid ${COLORS.border}`, bgcolor: '#FFFFFF', height: '100%' }}>
                        <ChartHeader title="User Growth" gradient="linear-gradient(135deg, #6366F1, #8B5CF6)" />
                        <Box sx={{ width: '100%' }}>
                            <ResponsiveContainer width="100%" height={300}>
                                <AreaChart data={analyticsUserGrowth.length ? analyticsUserGrowth : [{ month: 'Jan', users: 0 }]}>
                                    <XAxis dataKey="month" stroke="#94A3B8" tick={{ fontSize: 12 }} />
                                    <YAxis stroke="#94A3B8" tick={{ fontSize: 12 }} />
                                    <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                    <Area
                                        type="monotone"
                                        dataKey="users"
                                        stroke="#6366F1"
                                        strokeWidth={2.5}
                                        fillOpacity={0.35}
                                        fill="url(#userGrowthGradient)"
                                    />
                                    <defs>
                                        <linearGradient id="userGrowthGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#6366F1" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#6366F1" stopOpacity={0.05} />
                                        </linearGradient>
                                    </defs>
                                </AreaChart>
                            </ResponsiveContainer>
                        </Box>
                    </Paper>
                </Grid>
                <Grid item xs={12} lg={6}>
                    <Paper elevation={2} sx={{ p: 3, borderRadius: 4, border: `1px solid ${COLORS.border}`, bgcolor: '#FFFFFF', height: '100%' }}>
                        <ChartHeader title="Booking Trend" gradient="linear-gradient(135deg, #F59E0B, #EF4444)" />
                        <Box sx={{ width: '100%' }}>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={analyticsBookingTrend.length ? analyticsBookingTrend : [{ month: 'Jan', bookings: 0 }]}>
                                    <XAxis dataKey="month" stroke="#94A3B8" tick={{ fontSize: 12 }} />
                                    <YAxis stroke="#94A3B8" tick={{ fontSize: 12 }} />
                                    <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                    <Bar
                                        dataKey="bookings"
                                        fill="#F59E0B"
                                        radius={[6, 6, 0, 0]}
                                        barSize={32}
                                        background={{ fill: '#F1F5F9', radius: [6, 6, 0, 0] }}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </Box>
                    </Paper>
                </Grid>
            </Grid>

            {/* Role Distribution */}
            <Paper elevation={2} sx={{ p: 3, borderRadius: 4, border: `1px solid ${COLORS.border}`, bgcolor: '#FFFFFF', mb: 3 }}>
                <ChartHeader
                    title="Role Distribution"
                    gradient="linear-gradient(135deg, #0EA5E9, #EC4899)"
                    badge={`${data.totalUsers + data.totalGuiders + data.totalPhotographers} total`}
                />
                {hasRoleDistributionData ? (
                    <Box sx={{ width: '100%' }}>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={roleDistributionData}
                                    dataKey="value"
                                    nameKey="name"
                                    innerRadius={75}
                                    outerRadius={115}
                                    paddingAngle={5}
                                    stroke="none"
                                >
                                    {roleDistributionData.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={roleDistributionColors[index % roleDistributionColors.length]}
                                        />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" iconSize={10} />
                            </PieChart>
                        </ResponsiveContainer>
                    </Box>
                ) : (
                    <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Typography color="textSecondary">No data available</Typography>
                    </Box>
                )}
            </Paper>

            {/* Recent Users & Role Requests */}
            <Grid container spacing={2.5}>
                <Grid item xs={12} md={6}>
                    <Paper elevation={2} sx={{ p: 2.5, borderRadius: 4, border: `1px solid ${COLORS.border}`, bgcolor: '#FFFFFF', height: '100%' }}>
                        <ChartHeader
                            title="Recent Users"
                            gradient="linear-gradient(135deg, #0EA5E9, #38BDF8)"
                            badge={data.recentUsers?.length ? `${data.recentUsers.length}` : null}
                        />
                        {data.recentUsers?.length ? (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                {data.recentUsers.map((user) => (
                                    <Box key={user.id} sx={{ display: 'flex', alignItems: 'center', gap: 2, borderBottom: `1px solid ${COLORS.border}`, pb: 1.5 }}>
                                        <Avatar src={user.profileImage || 'https://via.placeholder.com/32'} sx={{ width: 40, height: 40 }} />
                                        <Box>
                                            <Typography variant="body2" fontWeight={600}>{user.firstName} {user.lastName}</Typography>
                                            <Typography variant="caption" color="textSecondary">{user.email}</Typography>
                                        </Box>
                                        <Chip label={user.role || 'User'} size="small" sx={{ ml: 'auto', bgcolor: '#E8F0FE', color: '#1E3A6E', borderRadius: 999 }} />
                                    </Box>
                                ))}
                            </Box>
                        ) : (
                            <Typography color="textSecondary">No recent users</Typography>
                        )}
                    </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                    <Paper elevation={2} sx={{ p: 2.5, borderRadius: 4, border: `1px solid ${COLORS.border}`, bgcolor: '#FFFFFF', height: '100%' }}>
                        <ChartHeader
                            title="Recent Role Requests"
                            gradient="linear-gradient(135deg, #F43F5E, #FB7185)"
                            badge={data.recentRoleRequests?.length ? `${data.recentRoleRequests.length}` : null}
                        />
                        {data.recentRoleRequests?.length ? (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                {data.recentRoleRequests.map((req) => (
                                    <Box key={req.id} sx={{ display: 'flex', alignItems: 'center', gap: 2, borderBottom: `1px solid ${COLORS.border}`, pb: 1.5 }}>
                                        <Avatar sx={{ bgcolor: req.requestedRole === 'GUIDER' ? '#8B5CF6' : '#EC4899', width: 40, height: 40 }}>
                                            <FaUserCog size={18} />
                                        </Avatar>
                                        <Box>
                                            <Typography variant="body2" fontWeight={600}>{req.fullName}</Typography>
                                            <Typography variant="caption" color="textSecondary">{req.requestedRole}</Typography>
                                        </Box>
                                        <Chip
                                            label={req.status}
                                            size="small"
                                            sx={{
                                                ml: 'auto',
                                                bgcolor: req.status === 'PENDING' ? '#FEF3C7' : req.status === 'APPROVED' ? '#D1FAE5' : '#FFE4E6',
                                                color: req.status === 'PENDING' ? '#D97706' : req.status === 'APPROVED' ? '#059669' : '#DC2626',
                                                borderRadius: 999,
                                            }}
                                        />
                                    </Box>
                                ))}
                            </Box>
                        ) : (
                            <Typography color="textSecondary">No role requests</Typography>
                        )}
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default Dashboard;