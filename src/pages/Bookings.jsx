// src/pages/Bookings.jsx
import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  Box, Paper, Typography, Button, IconButton, Chip, Select, MenuItem,
  FormControl, InputLabel, Dialog, DialogTitle, DialogActions, TextField,
  Stack, Avatar, useMediaQuery, useTheme, Card, CardContent, InputAdornment,
  Tooltip, Link, // ✅ Added Link
} from '@mui/material';
import { Search, Visibility, Cancel } from '@mui/icons-material';
import { DataGrid, GridToolbarContainer, GridToolbarFilterButton, GridToolbarExport } from '@mui/x-data-grid';
import { fetchBookings, updateBookingStatus, setPage, setLimit } from '../redux/slices/bookingSlice';
import Loader from '../components/Loader';
import PanelHeader from '../components/PanelHeader';
import { COLORS } from '../theme/dashboardTheme';

// ✅ Helper functions to extract nested data
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
  if (row.photographerPlan?.photographer?.fullName) return row.photographerPlan.photographer.fullName;
  if (row.photographerPlan?.photographer?.firstName && row.photographerPlan?.photographer?.lastName) 
    return `${row.photographerPlan.photographer.firstName} ${row.photographerPlan.photographer.lastName}`.trim();
  return 'N/A';
};

const CustomToolbar = () => (
  <GridToolbarContainer sx={{ p: 1 }}>
    <GridToolbarFilterButton />
    <GridToolbarExport />
  </GridToolbarContainer>
);

const Bookings = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { items, total, loading, pagination } = useSelector((state) => state.bookings);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [cancelConfirm, setCancelConfirm] = useState(null);

  useEffect(() => {
    dispatch(fetchBookings({ page: pagination.page, limit: pagination.limit }));
  }, [dispatch, pagination.page, pagination.limit]);

  // ✅ Client-side filtering with extracted data
  const filtered = (items || []).filter((item) => {
    const userName = getUserName(item).toLowerCase();
    const placeName = getPlaceName(item).toLowerCase();
    const guiderName = getGuiderName(item).toLowerCase();
    const photographerName = getPhotographerName(item).toLowerCase();

    const matchesSearch = !searchTerm || 
      item.id?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      userName.includes(searchTerm.toLowerCase()) ||
      placeName.includes(searchTerm.toLowerCase()) ||
      guiderName.includes(searchTerm.toLowerCase()) ||
      photographerName.includes(searchTerm.toLowerCase());

    const matchesStatus = !filterStatus || item.status === filterStatus;
    const matchesType = !filterType || 
      (filterType === 'GUIDER' && item.guiderPlanId) || 
      (filterType === 'PHOTOGRAPHER' && item.photographerPlanId);

    return matchesSearch && matchesStatus && matchesType;
  });

  const handleStatusChange = async (id, status) => {
    try { 
      await dispatch(updateBookingStatus({ id, status })).unwrap(); 
      toast.success('Booking status updated'); 
      dispatch(fetchBookings({ page: pagination.page, limit: pagination.limit })); 
    }
    catch (error) { toast.error(error.message || 'Update failed'); }
  };

  const handleCancel = async (id) => {
    try { 
      await dispatch(updateBookingStatus({ id, status: 'REJECTED' })).unwrap(); 
      toast.success('Booking cancelled'); 
      setCancelConfirm(null); 
      dispatch(fetchBookings({ page: pagination.page, limit: pagination.limit })); 
    }
    catch { toast.error('Cancel failed'); }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING': return 'warning';
      case 'APPROVED': return 'success';
      case 'REJECTED': return 'error';
      case 'COMPLETED': return 'info';
      default: return 'default';
    }
  };

  // ✅ Better UI Columns (with clickable ID & Date)
  const columns = [
    { field: 'id', headerName: 'Booking ID', flex: 1, minWidth: 120, renderCell: (p) => (
      <Link
        component="button"
        variant="body2"
        onClick={() => navigate(`/bookings/${p.row.id}`)}
        sx={{ fontWeight: 600, color: '#1E3A6E', textDecoration: 'underline', cursor: 'pointer' }}
      >
        #{p.row.id?.slice(0, 8)}
      </Link>
    )},
    { field: 'userName', headerName: 'User', flex: 1, minWidth: 130, renderCell: (p) => (
      <Stack direction="row" alignItems="center" spacing={1}>
        <Avatar sx={{ width: 32, height: 32, bgcolor: '#1E3A6E', fontSize: 14 }}>
          {getUserName(p.row).charAt(0)}
        </Avatar>
        <Typography variant="body2" fontWeight={500}>{getUserName(p.row)}</Typography>
      </Stack>
    )},
    { field: 'placeName', headerName: 'Place', flex: 1, minWidth: 120, renderCell: (p) => (
      <Typography variant="body2" color="textSecondary">{getPlaceName(p.row)}</Typography>
    )},
    { field: 'guiderName', headerName: 'Guider', flex: 0.8, minWidth: 100, renderCell: (p) => (
      <Chip label={getGuiderName(p.row)} size="small" variant="outlined" color="info" />
    )},
    { field: 'photographerName', headerName: 'Photographer', flex: 0.8, minWidth: 100, renderCell: (p) => (
      <Chip label={getPhotographerName(p.row)} size="small" variant="outlined" color="secondary" />
    )},
    { field: 'bookingDate', headerName: 'Date', flex: 0.8, minWidth: 110, renderCell: (p) => (
      <Link
        component="button"
        variant="body2"
        onClick={() => navigate(`/bookings/${p.row.id}`)}
        sx={{ color: '#64748B', textDecoration: 'underline', cursor: 'pointer' }}
      >
        {new Date(p.row.bookingDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
      </Link>
    )},
    { field: 'totalAmount', headerName: 'Amount', flex: 0.6, minWidth: 90, renderCell: (p) => (
      <Typography fontWeight="bold" sx={{ color: '#10B981' }}>₹{p.row.totalAmount || 0}</Typography>
    )},
    { field: 'status', headerName: 'Status', flex: 0.8, minWidth: 130, renderCell: (p) => (
      <FormControl size="small" sx={{ minWidth: 120 }}>
        <Select value={p.row.status} onChange={(e) => handleStatusChange(p.row.id, e.target.value)} sx={{ fontSize: 12, borderRadius: 2 }}>
          <MenuItem value="PENDING" sx={{ fontSize: 12 }}>⏳ Pending</MenuItem>
          <MenuItem value="APPROVED" sx={{ fontSize: 12 }}>✅ Approved</MenuItem>
          <MenuItem value="REJECTED" sx={{ fontSize: 12 }}>❌ Rejected</MenuItem>
          <MenuItem value="COMPLETED" sx={{ fontSize: 12 }}>🏁 Completed</MenuItem>
        </Select>
      </FormControl>
    )},
    { field: 'actions', headerName: 'Actions', flex: 0.6, minWidth: 100, renderCell: (p) => (
      <Stack direction="row" spacing={0.5}>
        <Tooltip title="View Booking Details">
          <IconButton onClick={() => navigate(`/bookings/${p.row.id}`)} sx={{ color: '#0EA5E9', '&:hover': { bgcolor: '#E0F2FE' } }}>
            <Visibility />
          </IconButton>
        </Tooltip>
        {p.row.status === 'PENDING' && (
          <Tooltip title="Cancel Booking">
            <IconButton onClick={() => setCancelConfirm(p.row.id)} sx={{ color: '#F43F5E', '&:hover': { bgcolor: '#FFE4E6' } }}>
              <Cancel />
            </IconButton>
          </Tooltip>
        )}
      </Stack>
    )},
  ];

  // ✅ Better Mobile Card View (with clickable ID & Date)
  const renderMobileCards = () => (
    <Stack spacing={2}>
      {filtered.length > 0 ? filtered.map((booking) => (
        <Card key={booking.id} sx={{ borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.08)', border: '1px solid #E2E8F0' }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
              <Box>
                <Link
                  component="button"
                  variant="subtitle2"
                  onClick={() => navigate(`/bookings/${booking.id}`)}
                  sx={{ fontWeight: 700, color: '#1E3A6E', textDecoration: 'underline', cursor: 'pointer' }}
                >
                  Booking #{booking.id?.slice(0, 8)}
                </Link>
                <Link
                  component="button"
                  variant="caption"
                  onClick={() => navigate(`/bookings/${booking.id}`)}
                  sx={{ color: 'textSecondary', textDecoration: 'underline', cursor: 'pointer', display: 'block' }}
                >
                  {new Date(booking.bookingDate).toLocaleString()}
                </Link>
              </Box>
              <Chip label={booking.status} size="small" color={getStatusColor(booking.status)} />
            </Box>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
              <Avatar sx={{ width: 28, height: 28, bgcolor: '#1E3A6E', fontSize: 12 }}>
                {getUserName(booking).charAt(0)}
              </Avatar>
              <Typography variant="body2" fontWeight={600}>{getUserName(booking)}</Typography>
              <Typography variant="body2" color="textSecondary">•</Typography>
              <Typography variant="body2" color="textSecondary">{getPlaceName(booking)}</Typography>
            </Stack>
            {(getGuiderName(booking) !== 'N/A' || getPhotographerName(booking) !== 'N/A') && (
              <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                {getGuiderName(booking) !== 'N/A' && <Chip label={`Guider: ${getGuiderName(booking)}`} size="small" variant="outlined" color="info" />}
                {getPhotographerName(booking) !== 'N/A' && <Chip label={`Photo: ${getPhotographerName(booking)}`} size="small" variant="outlined" color="secondary" />}
              </Stack>
            )}
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ borderTop: '1px solid #F1F5F9', pt: 1.5, mt: 1 }}>
              <Typography variant="h6" sx={{ color: '#10B981', fontWeight: 700 }}>₹{booking.totalAmount || 0}</Typography>
              <Stack direction="row">
                <Tooltip title="View Details">
                  <IconButton size="small" onClick={() => navigate(`/bookings/${booking.id}`)} sx={{ color: '#0EA5E9' }}>
                    <Visibility fontSize="small" />
                  </IconButton>
                </Tooltip>
                {booking.status === 'PENDING' && (
                  <Tooltip title="Cancel Booking">
                    <IconButton size="small" onClick={() => setCancelConfirm(booking.id)} sx={{ color: '#F43F5E' }}>
                      <Cancel fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      )) : (
        <Paper elevation={0} sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}>
          <Typography color="textSecondary">No bookings found</Typography>
        </Paper>
      )}
    </Stack>
  );

  return (
    <Box className="fade-in" sx={{ p: { xs: 2, md: 3 }, mt: 0, pt: 1 }}>
      <PanelHeader eyebrow="Transactions" title="Bookings Management" />

      {/* ✅ Filters - Fixed width, no Grid */}
      <Paper elevation={0} sx={{ p: 2, borderRadius: 4, border: '1px solid #e2e8f0', bgcolor: 'white', mb: 2 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center" justifyContent="space-between">
          <TextField 
            size="small" 
            placeholder="Search by booking ID, user, place..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }}
            sx={{ width: { xs: '100%', md: 300 } }}
          />
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Status</InputLabel>
            <Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} label="Status">
              <MenuItem value="">All</MenuItem>
              <MenuItem value="PENDING">Pending</MenuItem>
              <MenuItem value="APPROVED">Approved</MenuItem>
              <MenuItem value="REJECTED">Rejected</MenuItem>
              <MenuItem value="COMPLETED">Completed</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Type</InputLabel>
            <Select value={filterType} onChange={(e) => setFilterType(e.target.value)} label="Type">
              <MenuItem value="">All Types</MenuItem>
              <MenuItem value="GUIDER">Guider</MenuItem>
              <MenuItem value="PHOTOGRAPHER">Photographer</MenuItem>
            </Select>
          </FormControl>
          <Chip label={`Total: ${filtered.length}`} color="primary" variant="outlined" />
        </Stack>
      </Paper>

      {isMobile ? (
        loading ? <Loader /> : renderMobileCards()
      ) : (
        <Paper elevation={0} sx={{ p: 2, borderRadius: 4, border: '1px solid #e2e8f0', bgcolor: 'white' }}>
          {loading ? <Loader /> : (
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
              sx={{
                '& .MuiDataGrid-columnHeaders': { bgcolor: '#F8FAFC', fontWeight: 700, color: '#475569' },
                '& .MuiDataGrid-row:hover': { bgcolor: '#F0F4FF' },
                '& .MuiDataGrid-cell': { borderBottom: '1px solid #F1F5F9' },
                '& .MuiDataGrid-columnSeparator': { display: 'none' },
              }} 
            />
          )}
        </Paper>
      )}

      <Dialog open={!!cancelConfirm} onClose={() => setCancelConfirm(null)}>
        <DialogTitle>Cancel Booking?</DialogTitle>
        <DialogActions>
          <Button onClick={() => setCancelConfirm(null)}>No</Button>
          <Button onClick={() => handleCancel(cancelConfirm)} color="error" variant="contained">Yes, Cancel</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Bookings;