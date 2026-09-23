// src/pages/Bookings.jsx
import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  Box, Paper, Typography, Button, IconButton, Chip, Select, MenuItem,
  FormControl, InputLabel, Dialog, DialogTitle, DialogActions, TextField,
  Stack, Avatar, useMediaQuery, useTheme, InputAdornment,
  Tooltip, Link, Divider, CircularProgress,
} from '@mui/material';
import {
  Search, Visibility, Cancel, Refresh, Inbox,
} from '@mui/icons-material';
import {
  DataGrid, GridToolbarContainer, GridToolbarFilterButton, GridToolbarExport,
} from '@mui/x-data-grid';
import {
  fetchBookings, updateBookingStatus, setPage, setLimit,
} from '../redux/slices/bookingSlice';
import Loader from '../components/Loader';
import PanelHeader from '../components/PanelHeader';

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
  violetSoft: '#ede9fe',
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

// ═══════════════════════════════════════════════════════════════
// ✅ STATUS STYLES — includes PAID + CANCELLED
// ═══════════════════════════════════════════════════════════════
const STATUS_STYLES = {
  PENDING: { bg: T.amberSoft, color: '#b45309', label: 'Pending' },
  APPROVED: { bg: T.skySoft, color: '#0369a1', label: 'Approved' },
  PAID: { bg: '#EDE9FE', color: '#6D28D9', label: 'Paid' },
  REJECTED: { bg: T.roseSoft, color: '#be123c', label: 'Rejected' },
  COMPLETED: { bg: T.emeraldSoft, color: '#047857', label: 'Completed' },
  CANCELLED: { bg: '#F1F5F9', color: '#475569', label: 'Cancelled' },
};

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════
const getUserName = (row) => {
  if (row.userName) return row.userName;
  if (row.User) return `${row.User.firstName || ''} ${row.User.lastName || ''}`.trim();
  if (row.user) return `${row.user.firstName || ''} ${row.user.lastName || ''}`.trim();
  return 'N/A';
};

const getPlaceName = (row) => {
  if (row.placeName) return row.placeName;
  if (row.place) return row.place.name || row.place.city || 'N/A';
  return 'N/A';
};

const getGuiderName = (row) => {
  if (row.guiderName) return row.guiderName;
  if (row.guiderPlan?.guider?.fullName) return row.guiderPlan.guider.fullName;
  return 'N/A';
};

const getPhotographerName = (row) => {
  if (row.photographerName) return row.photographerName;
  if (row.photographerPlan?.photographer?.fullName)
    return row.photographerPlan.photographer.fullName;
  return 'N/A';
};

const CustomToolbar = () => (
  <GridToolbarContainer sx={{ p: 1 }}>
    <GridToolbarFilterButton />
    <GridToolbarExport />
  </GridToolbarContainer>
);

// ═══════════════════════════════════════════════════════════════
// BOOKINGS
// ═══════════════════════════════════════════════════════════════
const Bookings = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { items, loading, pagination } = useSelector((s) => s.bookings);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [cancelConfirm, setCancelConfirm] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [updating, setUpdating] = useState(null);

  const fetchList = () => {
    dispatch(
      fetchBookings({
        page: pagination.page,
        limit: pagination.limit,
        search: searchTerm || undefined,
        status: filterStatus || undefined,
        type: filterType || undefined,
      })
    );
  };

  useEffect(() => {
    fetchList();
  }, [dispatch, pagination.page, pagination.limit, searchTerm, filterStatus, filterType]);

  const filtered = items || [];

  const handleStatusChange = async (id, status) => {
    setUpdating(id);
    try {
      await dispatch(updateBookingStatus({ id, status })).unwrap();
      toast.success('Booking status updated');
      fetchList();
    } catch (error) {
      toast.error(error.message || 'Update failed');
    } finally {
      setUpdating(null);
    }
  };

  const handleCancel = async (id) => {
    setCancelling(true);
    try {
      await dispatch(updateBookingStatus({ id, status: 'CANCELLED' })).unwrap();
      toast.success('Booking cancelled');
      setCancelConfirm(null);
      fetchList();
    } catch {
      toast.error('Cancel failed');
    } finally {
      setCancelling(false);
    }
  };

  const columns = [
    {
      field: 'id',
      headerName: 'Booking ID',
      flex: 1,
      minWidth: 130,
      renderCell: (p) => (
        <Link
          component="button"
          onClick={() => navigate(`/bookings/${p.row.id}`)}
          sx={{
            fontSize: '0.78rem',
            fontWeight: 700,
            color: T.indigo,
            textDecoration: 'none',
            fontFamily: 'monospace',
            '&:hover': { textDecoration: 'underline' },
          }}
        >
          #{p.row.id?.slice(0, 8)}
        </Link>
      ),
    },
    {
      field: 'userName',
      headerName: 'User',
      flex: 1.1,
      minWidth: 150,
      renderCell: (p) => (
        <Stack direction="row" alignItems="center" spacing={1}>
          <Avatar
            sx={{
              width: 32,
              height: 32,
              background: `linear-gradient(135deg, ${T.indigo}, ${T.violet})`,
              fontSize: 12,
              fontWeight: 700,
              border: '2px solid #fff',
            }}
          >
            {getUserName(p.row).charAt(0)}
          </Avatar>
          <Typography
            sx={{ fontSize: '0.82rem', fontWeight: 600, color: T.textPrimary }}
            noWrap
          >
            {getUserName(p.row)}
          </Typography>
        </Stack>
      ),
    },
    {
      field: 'placeName',
      headerName: 'Place',
      flex: 1,
      minWidth: 130,
      renderCell: (p) => (
        <Typography sx={{ fontSize: '0.78rem', color: T.textMuted }} noWrap>
          {getPlaceName(p.row)}
        </Typography>
      ),
    },
    {
      field: 'bookingDate',
      headerName: 'Date',
      flex: 0.8,
      minWidth: 110,
      renderCell: (p) => (
        <Typography sx={{ fontSize: '0.75rem', color: T.textMuted }}>
          {new Date(p.row.bookingDate).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })}
        </Typography>
      ),
    },
    {
      field: 'totalAmount',
      headerName: 'Amount',
      flex: 0.6,
      minWidth: 90,
      renderCell: (p) => (
        <Typography
          sx={{ fontSize: '0.82rem', fontWeight: 700, color: '#047857' }}
        >
          ₹{parseFloat(p.row.totalAmount || 0).toFixed(2)}
        </Typography>
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      flex: 0.9,
      minWidth: 140,
      renderCell: (p) => {
        const statusStyle =
          STATUS_STYLES[p.row.status] || STATUS_STYLES.PENDING;
        return (
          <FormControl size="small" sx={{ minWidth: 130 }}>
            <Select
              value={p.row.status}
              onChange={(e) => handleStatusChange(p.row.id, e.target.value)}
              disabled={updating === p.row.id}
              sx={{
                fontSize: '0.72rem',
                borderRadius: 999,
                bgcolor: statusStyle.bg,
                color: statusStyle.color,
                fontWeight: 700,
                '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  border: `1px solid ${T.borderStrong}`,
                },
              }}
            >
              <MenuItem value="PENDING" sx={{ fontSize: '0.78rem' }}>
                Pending
              </MenuItem>
              <MenuItem value="APPROVED" sx={{ fontSize: '0.78rem' }}>
                Approved
              </MenuItem>
              <MenuItem value="PAID" sx={{ fontSize: '0.78rem' }}>
                Paid
              </MenuItem>
              <MenuItem value="REJECTED" sx={{ fontSize: '0.78rem' }}>
                Rejected
              </MenuItem>
              <MenuItem value="COMPLETED" sx={{ fontSize: '0.78rem' }}>
                Completed
              </MenuItem>
              <MenuItem value="CANCELLED" sx={{ fontSize: '0.78rem' }}>
                Cancelled
              </MenuItem>
            </Select>
          </FormControl>
        );
      },
    },
    {
      field: 'actions',
      headerName: 'Actions',
      flex: 0.6,
      minWidth: 100,
      sortable: false,
      renderCell: (p) => (
        <Stack direction="row" spacing={0.5} alignItems="center">
          <Tooltip title="View details">
            <IconButton
              size="small"
              onClick={() => navigate(`/bookings/${p.row.id}`)}
              sx={{
                bgcolor: T.skySoft,
                color: T.sky,
                '&:hover': { bgcolor: '#bae6fd' },
                width: 32,
                height: 32,
              }}
            >
              <Visibility sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
          {p.row.status !== 'COMPLETED' && p.row.status !== 'CANCELLED' && (
            <Tooltip title="Cancel booking">
              <IconButton
                size="small"
                onClick={() => setCancelConfirm(p.row.id)}
                sx={{
                  bgcolor: T.roseSoft,
                  color: T.rose,
                  '&:hover': { bgcolor: '#fecaca' },
                  width: 32,
                  height: 32,
                }}
              >
                <Cancel sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
      ),
    },
  ];

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1440, mx: 'auto' }}>
      <Box sx={{ mb: 3 }}>
        <PanelHeader eyebrow="Transactions" title="Bookings Management" />
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
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          alignItems="center"
        >
          <TextField
            size="small"
            placeholder="Search by booking ID..."
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
              flex: 1,
              minWidth: 220,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                bgcolor: T.surfaceSoft,
                '& fieldset': { borderColor: T.border },
                '&:hover fieldset': { borderColor: '#c7d2fe' },
                '&.Mui-focused fieldset': {
                  borderColor: T.indigo,
                  borderWidth: 1.5,
                },
              },
            }}
          />
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              label="Status"
              sx={{ borderRadius: 2, bgcolor: T.surfaceSoft }}
            >
              <MenuItem value="">All Status</MenuItem>
              <MenuItem value="PENDING">Pending</MenuItem>
              <MenuItem value="APPROVED">Approved</MenuItem>
              <MenuItem value="PAID">Paid</MenuItem>
              <MenuItem value="REJECTED">Rejected</MenuItem>
              <MenuItem value="COMPLETED">Completed</MenuItem>
              <MenuItem value="CANCELLED">Cancelled</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Type</InputLabel>
            <Select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              label="Type"
              sx={{ borderRadius: 2, bgcolor: T.surfaceSoft }}
            >
              <MenuItem value="">All Types</MenuItem>
              <MenuItem value="GUIDER">Guider</MenuItem>
              <MenuItem value="PHOTOGRAPHER">Photographer</MenuItem>
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
        </Stack>
      </Paper>

      {/* Table */}
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
        {loading ? (
          <Loader />
        ) : (
          <DataGrid
            rows={filtered}
            columns={columns}
            pageSize={pagination.limit}
            rowsPerPageOptions={[5, 10, 25]}
            page={pagination.page - 1}
            onPageChange={(p) => dispatch(setPage(p + 1))}
            onPageSizeChange={(s) => dispatch(setLimit(s))}
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
              '& .MuiDataGrid-footerContainer': {
                borderTop: `1px solid ${T.border}`,
              },
              '& .MuiDataGrid-toolbarContainer': {
                p: 1,
                borderBottom: `1px solid ${T.border}`,
              },
            }}
          />
        )}
      </Paper>

      {/* Cancel Dialog */}
      <Dialog
        open={!!cancelConfirm}
        onClose={() => !cancelling && setCancelConfirm(null)}
        slotProps={{ paper: { sx: { borderRadius: T.radius, p: 0.5 } } }}
      >
        <DialogTitle
          sx={{
            fontWeight: 700,
            fontSize: '1.05rem',
            color: T.textPrimary,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: 1.5,
              bgcolor: T.roseSoft,
              color: T.rose,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Cancel sx={{ fontSize: 18 }} />
          </Box>
          Cancel Booking?
        </DialogTitle>
        <Divider sx={{ borderColor: T.border }} />
        <Box sx={{ px: 3, py: 2 }}>
          <Typography sx={{ fontSize: '0.85rem', color: T.textMuted }}>
            If the customer already paid, the amount will be refunded to their
            wallet automatically.
          </Typography>
        </Box>
        <DialogActions sx={{ p: 2, pt: 0, gap: 1 }}>
          <Button
            onClick={() => setCancelConfirm(null)}
            disabled={cancelling}
            sx={{ textTransform: 'none', fontWeight: 600, color: T.textMuted }}
          >
            Keep
          </Button>
          <Button
            onClick={() => handleCancel(cancelConfirm)}
            disabled={cancelling}
            variant="contained"
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              borderRadius: 2,
              bgcolor: T.rose,
              '&:hover': { bgcolor: '#e11d48' },
              boxShadow: 'none',
            }}
          >
            {cancelling ? (
              <CircularProgress size={16} sx={{ color: '#fff' }} />
            ) : (
              'Cancel Booking'
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Bookings;