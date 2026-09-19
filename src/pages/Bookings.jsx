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

const STATUS_STYLES = {
  PENDING: { bg: T.amberSoft, color: '#b45309', label: 'Pending' },
  APPROVED: { bg: T.skySoft, color: '#0369a1', label: 'Approved' },
  REJECTED: { bg: T.roseSoft, color: '#be123c', label: 'Rejected' },
  COMPLETED: { bg: T.emeraldSoft, color: '#047857', label: 'Completed' },
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
  if (row.guiderPlan?.guider?.firstName && row.guiderPlan?.guider?.lastName)
    return `${row.guiderPlan.guider.firstName} ${row.guiderPlan.guider.lastName}`.trim();
  return 'N/A';
};

const getPhotographerName = (row) => {
  if (row.photographerName) return row.photographerName;
  if (row.photographerPlan?.photographer?.fullName)
    return row.photographerPlan.photographer.fullName;
  if (
    row.photographerPlan?.photographer?.firstName &&
    row.photographerPlan?.photographer?.lastName
  )
    return `${row.photographerPlan.photographer.firstName} ${row.photographerPlan.photographer.lastName}`.trim();
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
    dispatch(fetchBookings({ page: pagination.page, limit: pagination.limit }));
  };

  useEffect(() => {
    fetchList();
  }, [dispatch, pagination.page, pagination.limit]);

  const filtered = (items || []).filter((item) => {
    const userName = getUserName(item).toLowerCase();
    const placeName = getPlaceName(item).toLowerCase();
    const guiderName = getGuiderName(item).toLowerCase();
    const photographerName = getPhotographerName(item).toLowerCase();

    const matchesSearch =
      !searchTerm ||
      item.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      userName.includes(searchTerm.toLowerCase()) ||
      placeName.includes(searchTerm.toLowerCase()) ||
      guiderName.includes(searchTerm.toLowerCase()) ||
      photographerName.includes(searchTerm.toLowerCase());

    const matchesStatus = !filterStatus || item.status === filterStatus;
    const matchesType =
      !filterType ||
      (filterType === 'GUIDER' && item.guiderPlanId) ||
      (filterType === 'PHOTOGRAPHER' && item.photographerPlanId);

    return matchesSearch && matchesStatus && matchesType;
  });

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
      await dispatch(updateBookingStatus({ id, status: 'REJECTED' })).unwrap();
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
      field: 'guiderName',
      headerName: 'Guider',
      flex: 0.8,
      minWidth: 120,
      renderCell: (p) =>
        getGuiderName(p.row) !== 'N/A' ? (
          <Chip
            label={getGuiderName(p.row)}
            size="small"
            sx={{
              bgcolor: T.violetSoft,
              color: '#6d28d9',
              fontWeight: 700,
              fontSize: '0.62rem',
              height: 22,
              borderRadius: 999,
              maxWidth: 130,
            }}
          />
        ) : (
          <Typography sx={{ fontSize: '0.75rem', color: T.textFaint }}>—</Typography>
        ),
    },
    {
      field: 'photographerName',
      headerName: 'Photographer',
      flex: 0.8,
      minWidth: 120,
      renderCell: (p) =>
        getPhotographerName(p.row) !== 'N/A' ? (
          <Chip
            label={getPhotographerName(p.row)}
            size="small"
            sx={{
              bgcolor: T.roseSoft,
              color: '#be185d',
              fontWeight: 700,
              fontSize: '0.62rem',
              height: 22,
              borderRadius: 999,
              maxWidth: 130,
            }}
          />
        ) : (
          <Typography sx={{ fontSize: '0.75rem', color: T.textFaint }}>—</Typography>
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
          ₹{p.row.totalAmount || 0}
        </Typography>
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      flex: 0.9,
      minWidth: 140,
      renderCell: (p) => (
        <FormControl size="small" sx={{ minWidth: 130 }}>
          <Select
            value={p.row.status}
            onChange={(e) => handleStatusChange(p.row.id, e.target.value)}
            disabled={updating === p.row.id}
            sx={{
              fontSize: '0.72rem',
              borderRadius: 999,
              bgcolor: (STATUS_STYLES[p.row.status] || STATUS_STYLES.PENDING).bg,
              color: (STATUS_STYLES[p.row.status] || STATUS_STYLES.PENDING).color,
              fontWeight: 700,
              '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                border: `1px solid ${T.borderStrong}`,
              },
            }}
          >
            <MenuItem value="PENDING" sx={{ fontSize: '0.78rem' }}>Pending</MenuItem>
            <MenuItem value="APPROVED" sx={{ fontSize: '0.78rem' }}>Approved</MenuItem>
            <MenuItem value="REJECTED" sx={{ fontSize: '0.78rem' }}>Rejected</MenuItem>
            <MenuItem value="COMPLETED" sx={{ fontSize: '0.78rem' }}>Completed</MenuItem>
          </Select>
        </FormControl>
      ),
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
          {p.row.status === 'PENDING' && (
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

  const renderMobileCards = () => (
    <Stack spacing={2}>
      {filtered.length > 0 ? (
        filtered.map((booking) => {
          const statusStyle =
            STATUS_STYLES[booking.status] || STATUS_STYLES.PENDING;
          return (
            <Paper
              key={booking.id}
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
                <Box>
                  <Typography
                    component="button"
                    onClick={() => navigate(`/bookings/${booking.id}`)}
                    sx={{
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      color: T.indigo,
                      fontFamily: 'monospace',
                      background: 'none',
                      border: 'none',
                      p: 0,
                      cursor: 'pointer',
                    }}
                  >
                    #{booking.id?.slice(0, 8)}
                  </Typography>
                  <Typography
                    sx={{ fontSize: '0.68rem', color: T.textFaint, display: 'block', mt: 0.2 }}
                  >
                    {new Date(booking.bookingDate).toLocaleString('en-IN')}
                  </Typography>
                </Box>
                <Chip
                  label={statusStyle.label}
                  size="small"
                  sx={{
                    bgcolor: statusStyle.bg,
                    color: statusStyle.color,
                    fontWeight: 700,
                    fontSize: '0.62rem',
                    height: 22,
                    borderRadius: 999,
                  }}
                />
              </Stack>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                <Avatar
                  sx={{
                    width: 28,
                    height: 28,
                    background: `linear-gradient(135deg, ${T.indigo}, ${T.violet})`,
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  {getUserName(booking).charAt(0)}
                </Avatar>
                <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: T.textPrimary }}>
                  {getUserName(booking)}
                </Typography>
                <Typography sx={{ fontSize: '0.75rem', color: T.textFaint }}>•</Typography>
                <Typography sx={{ fontSize: '0.75rem', color: T.textMuted }}>
                  {getPlaceName(booking)}
                </Typography>
              </Stack>
              {(getGuiderName(booking) !== 'N/A' ||
                getPhotographerName(booking) !== 'N/A') && (
                <Stack direction="row" spacing={0.5} sx={{ mb: 1.5, flexWrap: 'wrap', gap: 0.5 }}>
                  {getGuiderName(booking) !== 'N/A' && (
                    <Chip
                      label={`Guider: ${getGuiderName(booking)}`}
                      size="small"
                      sx={{
                        bgcolor: T.violetSoft,
                        color: '#6d28d9',
                        fontWeight: 700,
                        fontSize: '0.6rem',
                        height: 20,
                        borderRadius: 999,
                      }}
                    />
                  )}
                  {getPhotographerName(booking) !== 'N/A' && (
                    <Chip
                      label={`Photo: ${getPhotographerName(booking)}`}
                      size="small"
                      sx={{
                        bgcolor: T.roseSoft,
                        color: '#be185d',
                        fontWeight: 700,
                        fontSize: '0.6rem',
                        height: 20,
                        borderRadius: 999,
                      }}
                    />
                  )}
                </Stack>
              )}
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                sx={{ pt: 1.5, borderTop: `1px solid ${T.border}` }}
              >
                <Typography sx={{ fontSize: '1rem', color: '#047857', fontWeight: 800 }}>
                  ₹{booking.totalAmount || 0}
                </Typography>
                <Stack direction="row" spacing={0.5}>
                  <IconButton
                    size="small"
                    onClick={() => navigate(`/bookings/${booking.id}`)}
                    sx={{ bgcolor: T.skySoft, color: T.sky, width: 30, height: 30 }}
                  >
                    <Visibility sx={{ fontSize: 15 }} />
                  </IconButton>
                  {booking.status === 'PENDING' && (
                    <IconButton
                      size="small"
                      onClick={() => setCancelConfirm(booking.id)}
                      sx={{ bgcolor: T.roseSoft, color: T.rose, width: 30, height: 30 }}
                    >
                      <Cancel sx={{ fontSize: 15 }} />
                    </IconButton>
                  )}
                </Stack>
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
            No bookings found
          </Typography>
        </Paper>
      )}
    </Stack>
  );

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
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
          <TextField
            size="small"
            placeholder="Search by booking ID, user, place..."
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
                '&.Mui-focused fieldset': { borderColor: T.indigo, borderWidth: 1.5 },
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
              <MenuItem value="REJECTED">Rejected</MenuItem>
              <MenuItem value="COMPLETED">Completed</MenuItem>
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
          <Chip
            label={`${filtered.length} total`}
            sx={{
              bgcolor: T.surfaceSoft,
              color: T.textMuted,
              border: `1px solid ${T.border}`,
              fontWeight: 700,
              fontSize: '0.72rem',
              height: 32,
              borderRadius: 999,
            }}
          />
        </Stack>
      </Paper>

      {isMobile ? (
        loading ? <Loader /> : renderMobileCards()
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
          )}
        </Paper>
      )}

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
            This will reject the booking. The user will be notified. This action
            cannot be undone.
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