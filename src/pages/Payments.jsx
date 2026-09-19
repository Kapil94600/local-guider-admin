// src/pages/Payments.jsx
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  DataGrid, GridToolbarContainer, GridToolbarExport,
} from '@mui/x-data-grid';
import {
  Typography, Paper, Box, TextField, InputAdornment, Stack,
  Chip, useMediaQuery, useTheme, FormControl, InputLabel,
  Select, MenuItem, Tooltip, IconButton,
} from '@mui/material';
import {
  Search, Payment, TrendingUp, ReceiptLong, Refresh,
  CheckCircle, Schedule, Inbox,
} from '@mui/icons-material';
import { fetchPayments } from '../redux/slices/paymentSlice';
import Loader from '../components/Loader';
import PanelHeader from '../components/PanelHeader';
import ErrorAlert from '../components/ErrorAlert';
import ExportButtons from '../components/ExportButtons';

// ═══════════════════════════════════════════════════════════════
// DESIGN TOKENS
// ═══════════════════════════════════════════════════════════════
const T = {
  border: '#eef1f6',
  borderStrong: '#e2e8f0',
  surface: '#ffffff',
  surfaceSoft: '#fafbfc',
  bgRowHover: '#fafbfc',
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
  amberSoft: '#fef3c7',
  sky: '#0ea5e9',
  skySoft: '#e0f2fe',
  radius: 3,
  fontDisplay: '"Inter", system-ui, -apple-system, sans-serif',
};

const STATUS_STYLES = {
  SUCCESS: { bg: T.emeraldSoft, color: '#047857' },
  PENDING: { bg: T.amberSoft, color: '#b45309' },
  FAILED: { bg: T.roseSoft, color: '#be123c' },
};

const CustomToolbar = () => (
  <GridToolbarContainer sx={{ p: 1 }}>
    <GridToolbarExport />
  </GridToolbarContainer>
);

// ═══════════════════════════════════════════════════════════════
// SUMMARY STAT CARD
// ═══════════════════════════════════════════════════════════════
const SummaryCard = ({ title, value, icon: Icon, accent }) => (
  <Paper
    elevation={0}
    sx={{
      p: 2.5,
      borderRadius: T.radius,
      border: `1px solid ${T.border}`,
      bgcolor: T.surface,
      transition: 'all 0.2s ease',
      '&:hover': {
        borderColor: T.borderStrong,
        transform: 'translateY(-2px)',
        boxShadow: '0 12px 24px -16px rgba(15,23,42,0.15)',
      },
    }}
  >
    <Stack direction="row" alignItems="center" spacing={1.5}>
      <Box
        sx={{
          width: 44,
          height: 44,
          borderRadius: 2,
          bgcolor: `${accent}12`,
          color: accent,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon sx={{ fontSize: 20 }} />
      </Box>
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography
          sx={{
            fontSize: '0.7rem',
            fontWeight: 700,
            color: T.textFaint,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            mb: 0.25,
          }}
        >
          {title}
        </Typography>
        <Typography
          sx={{
            fontSize: '1.35rem',
            fontWeight: 800,
            color: T.textPrimary,
            letterSpacing: '-0.02em',
            fontFamily: T.fontDisplay,
            lineHeight: 1.1,
          }}
        >
          {value}
        </Typography>
      </Box>
    </Stack>
  </Paper>
);

// ═══════════════════════════════════════════════════════════════
// PAYMENTS
// ═══════════════════════════════════════════════════════════════
const Payments = () => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { payments, isLoading, error } = useSelector((s) => s.payments);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const paymentsList = Array.isArray(payments) ? payments : [];

  const fetchList = () => dispatch(fetchPayments());

  useEffect(() => {
    fetchList();
  }, [dispatch]);

  const totalRevenue = paymentsList.reduce((sum, p) => sum + (p.amount || 0), 0);
  const totalTransactions = paymentsList.length;
  const completedCount = paymentsList.filter((p) => p.status === 'SUCCESS').length;
  const pendingCount = paymentsList.filter((p) => p.status === 'PENDING').length;

  const filtered = paymentsList.filter((p) => {
    const matchesSearch =
      !searchTerm ||
      p.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.bookingId?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !filterStatus || p.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const exportHeaders = [
    { key: 'id', label: 'Payment ID' },
    { key: 'bookingId', label: 'Booking ID' },
    { key: 'userName', label: 'User' },
    { key: 'amount', label: 'Amount' },
    { key: 'method', label: 'Method' },
    { key: 'status', label: 'Status' },
    { key: 'createdAt', label: 'Date' },
  ];

  const columns = [
    {
      field: 'id',
      headerName: 'Payment ID',
      flex: 1,
      minWidth: 150,
      renderCell: (p) => (
        <Typography
          sx={{
            fontSize: '0.72rem',
            fontWeight: 700,
            color: T.textPrimary,
            fontFamily: 'monospace',
          }}
          noWrap
        >
          {p.row.id?.slice(0, 12) || '—'}
        </Typography>
      ),
    },
    {
      field: 'bookingId',
      headerName: 'Booking ID',
      flex: 1,
      minWidth: 150,
      renderCell: (p) => (
        <Typography
          sx={{
            fontSize: '0.72rem',
            color: T.textMuted,
            fontFamily: 'monospace',
          }}
          noWrap
        >
          {p.row.bookingId?.slice(0, 12) || '—'}
        </Typography>
      ),
    },
    {
      field: 'userName',
      headerName: 'User',
      flex: 1,
      minWidth: 130,
      renderCell: (p) => (
        <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, color: T.textPrimary }} noWrap>
          {p.row.userName || '—'}
        </Typography>
      ),
    },
    {
      field: 'amount',
      headerName: 'Amount',
      flex: 0.6,
      minWidth: 100,
      renderCell: (p) => (
        <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: '#047857' }}>
          ₹{p.row.amount?.toFixed(2) || '0.00'}
        </Typography>
      ),
    },
    {
      field: 'method',
      headerName: 'Method',
      flex: 0.6,
      minWidth: 100,
      renderCell: (p) => (
        <Typography sx={{ fontSize: '0.78rem', color: T.textMuted }}>
          {p.row.method || '—'}
        </Typography>
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      flex: 0.6,
      minWidth: 100,
      renderCell: (p) => {
        const style = STATUS_STYLES[p.row.status] || STATUS_STYLES.PENDING;
        return (
          <Chip
            label={p.row.status}
            size="small"
            sx={{
              bgcolor: style.bg,
              color: style.color,
              fontWeight: 700,
              fontSize: '0.65rem',
              height: 22,
              borderRadius: 999,
            }}
          />
        );
      },
    },
    {
      field: 'createdAt',
      headerName: 'Date',
      flex: 0.8,
      minWidth: 110,
      renderCell: (p) => (
        <Typography sx={{ fontSize: '0.75rem', color: T.textMuted }}>
          {new Date(p.row.createdAt).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })}
        </Typography>
      ),
    },
  ];

  const renderMobileCards = () => (
    <Stack spacing={2}>
      {filtered.length > 0 ? (
        filtered.map((payment) => {
          const style = STATUS_STYLES[payment.status] || STATUS_STYLES.PENDING;
          return (
            <Paper
              key={payment.id}
              elevation={0}
              sx={{
                borderRadius: T.radius,
                border: `1px solid ${T.border}`,
                bgcolor: T.surface,
                p: 2,
                '&:hover': {
                  boxShadow: '0 12px 24px -16px rgba(15,23,42,0.15)',
                  borderColor: T.borderStrong,
                },
              }}
            >
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: 1.5,
                      bgcolor: T.skySoft,
                      color: T.sky,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Payment sx={{ fontSize: 16 }} />
                  </Box>
                  <Typography
                    sx={{
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      fontFamily: 'monospace',
                      color: T.textPrimary,
                    }}
                  >
                    {payment.id?.slice(0, 10)}
                  </Typography>
                </Stack>
                <Chip
                  label={payment.status}
                  size="small"
                  sx={{
                    bgcolor: style.bg,
                    color: style.color,
                    fontWeight: 700,
                    fontSize: '0.62rem',
                    height: 22,
                    borderRadius: 999,
                  }}
                />
              </Stack>

              <Stack direction="row" spacing={2} sx={{ mb: 1.5 }}>
                <Box>
                  <Typography sx={{ fontSize: '0.6rem', color: T.textFaint, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    User
                  </Typography>
                  <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: T.textPrimary, mt: 0.2 }}>
                    {payment.userName || '—'}
                  </Typography>
                </Box>
                <Box>
                  <Typography sx={{ fontSize: '0.6rem', color: T.textFaint, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Booking
                  </Typography>
                  <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: T.textPrimary, mt: 0.2, fontFamily: 'monospace' }}>
                    {payment.bookingId?.slice(0, 8) || '—'}
                  </Typography>
                </Box>
                <Box>
                  <Typography sx={{ fontSize: '0.6rem', color: T.textFaint, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Method
                  </Typography>
                  <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: T.textPrimary, mt: 0.2 }}>
                    {payment.method || '—'}
                  </Typography>
                </Box>
              </Stack>

              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                sx={{ pt: 1.5, borderTop: `1px solid ${T.border}` }}
              >
                <Typography sx={{ fontSize: '1rem', fontWeight: 800, color: '#047857' }}>
                  ₹{payment.amount?.toFixed(2) || '0.00'}
                </Typography>
                <Typography sx={{ fontSize: '0.7rem', color: T.textFaint }}>
                  {new Date(payment.createdAt).toLocaleDateString('en-IN')}
                </Typography>
              </Stack>
            </Paper>
          );
        })
      ) : (
        <Paper
          elevation={0}
          sx={{
            p: 4,
            borderRadius: T.radius,
            border: `1px dashed ${T.border}`,
            textAlign: 'center',
          }}
        >
          <Inbox sx={{ fontSize: 40, color: T.textFaint, mb: 1 }} />
          <Typography sx={{ color: T.textFaint, fontWeight: 500 }}>
            No payments found
          </Typography>
        </Paper>
      )}
    </Stack>
  );

  if (isLoading && paymentsList.length === 0) return <Loader />;
  if (error) return <ErrorAlert error={error} />;

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1440, mx: 'auto' }}>
      <Box sx={{ mb: 3 }}>
        <PanelHeader eyebrow="Financials" title="Payments Management" />
      </Box>

      {/* Summary Cards */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' },
          gap: 2.5,
          mb: 2.5,
        }}
      >
        <SummaryCard
          title="Total Revenue"
          value={`₹${totalRevenue.toFixed(2)}`}
          icon={TrendingUp}
          accent={T.emerald}
        />
        <SummaryCard
          title="Transactions"
          value={totalTransactions}
          icon={ReceiptLong}
          accent={T.sky}
        />
        <SummaryCard
          title="Successful"
          value={completedCount}
          icon={CheckCircle}
          accent={T.emerald}
        />
        <SummaryCard
          title="Pending"
          value={pendingCount}
          icon={Schedule}
          accent={T.amber}
        />
      </Box>

      {/* Filters */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          borderRadius: T.radius,
          border: `1px solid ${T.border}`,
          bgcolor: T.surface,
          mb: 2.5,
        }}
      >
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
          <TextField
            fullWidth
            size="small"
            placeholder="Search by user, payment ID, booking ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ fontSize: 18, color: T.textFaint }} />
                  </InputAdornment>
                ),
              },
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                bgcolor: T.surfaceSoft,
                '& fieldset': { borderColor: T.border },
                '&:hover fieldset': { borderColor: '#c7d2fe' },
                '&.Mui-focused fieldset': { borderColor: T.indigo, borderWidth: 1.5 },
              },
            }}
          />
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              label="Status"
              sx={{ borderRadius: 2, bgcolor: T.surfaceSoft }}
            >
              <MenuItem value="">All Status</MenuItem>
              <MenuItem value="SUCCESS">Success</MenuItem>
              <MenuItem value="PENDING">Pending</MenuItem>
              <MenuItem value="FAILED">Failed</MenuItem>
            </Select>
          </FormControl>
          <Tooltip title="Refresh">
            <IconButton
              onClick={fetchList}
              sx={{
                bgcolor: T.indigoSoft,
                color: T.indigo,
                width: 40,
                height: 40,
                '&:hover': { bgcolor: '#e0e7ff' },
              }}
            >
              <Refresh sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
          <ExportButtons data={filtered} headers={exportHeaders} filename="payments" />
        </Stack>
      </Paper>

      {/* Table / Mobile Cards */}
      {isMobile ? (
        renderMobileCards()
      ) : (
        <Paper
          elevation={0}
          sx={{
            p: 1,
            borderRadius: T.radius,
            border: `1px solid ${T.border}`,
            bgcolor: T.surface,
            overflow: 'hidden',
          }}
        >
          <DataGrid
            rows={filtered}
            columns={columns}
            pageSize={10}
            rowsPerPageOptions={[10, 25, 50]}
            components={{ Toolbar: CustomToolbar }}
            disableSelectionOnClick
            autoHeight
            rowHeight={64}
            sx={{
              border: 'none',
              '& .MuiDataGrid-columnHeaders': {
                bgcolor: T.surfaceSoft,
                fontWeight: 700,
                color: T.textMuted,
                fontSize: '0.72rem',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                borderBottom: `1px solid ${T.border}`,
                minHeight: '48px !important',
              },
              '& .MuiDataGrid-columnHeaderTitle': { fontWeight: 700 },
              '& .MuiDataGrid-row': {
                borderBottom: `1px solid ${T.border}`,
                transition: 'background-color 0.15s ease',
              },
              '& .MuiDataGrid-row:hover': { bgcolor: T.bgRowHover },
              '& .MuiDataGrid-cell': {
                borderBottom: 'none',
                display: 'flex',
                alignItems: 'center',
                py: 0,
              },
              '& .MuiDataGrid-cell:focus': { outline: 'none' },
              '& .MuiDataGrid-columnSeparator': { display: 'none' },
              '& .MuiDataGrid-footerContainer': { borderTop: `1px solid ${T.border}` },
              '& .MuiDataGrid-toolbarContainer': {
                p: 1,
                borderBottom: `1px solid ${T.border}`,
              },
            }}
          />
        </Paper>
      )}
    </Box>
  );
};

export default Payments;