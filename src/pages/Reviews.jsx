// src/pages/Reviews.js
import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  Box, Paper, Typography, Button, IconButton, Chip, Avatar, Stack,
  TextField, InputAdornment, Dialog, DialogTitle, DialogActions,
  useMediaQuery, useTheme, Card, CardContent, Tooltip, FormControl, Select, MenuItem, InputLabel,
} from '@mui/material';
import { Search, Delete, Visibility, Star } from '@mui/icons-material';
import { DataGrid, GridToolbarContainer, GridToolbarFilterButton, GridToolbarExport } from '@mui/x-data-grid';
import { fetchReviews, updateReviewStatus, deleteReview, setPage, setLimit } from '../redux/slices/reviewSlice';
import Loader from '../components/Loader';
import PanelHeader from '../components/PanelHeader';
import { COLORS } from '../theme/dashboardTheme';

const CustomToolbar = () => (
  <GridToolbarContainer sx={{ p: 1 }}>
    <GridToolbarFilterButton />
    <GridToolbarExport />
  </GridToolbarContainer>
);

const Reviews = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { items, total, loading, pagination } = useSelector((state) => state.reviews);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');  // ✅ NEW
  const [ratingFilter, setRatingFilter] = useState('ALL');  // ✅ NEW
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // ✅ Fetch with filters
  useEffect(() => {
    const params = {
      page: pagination.page,
      limit: pagination.limit,
      search: searchTerm || undefined,
      status: statusFilter !== 'ALL' ? statusFilter : undefined,
      rating: ratingFilter !== 'ALL' ? ratingFilter : undefined,
    };
    dispatch(fetchReviews(params));
  }, [dispatch, pagination.page, pagination.limit, searchTerm, statusFilter, ratingFilter]);

  const handleDelete = async (id) => {
    try { await dispatch(deleteReview(id)).unwrap(); toast.success('Review deleted successfully'); setDeleteConfirm(null); }
    catch { toast.error('Delete failed'); }
  };

  const handleStatusChange = async (id, status) => {
    try { await dispatch(updateReviewStatus({ id, status })).unwrap(); toast.success('Status updated'); }
    catch (error) { toast.error(error.message || 'Status update failed'); }
  };

  const columns = [
    { field: 'userName', headerName: 'User', flex: 1, renderCell: (params) => <Typography fontWeight={600}>{params.row.userName || 'N/A'}</Typography> },
    { field: 'targetName', headerName: 'Target', flex: 1, renderCell: (params) => params.row.targetName || 'N/A' },
    { field: 'rating', headerName: 'Rating', flex: 0.6, renderCell: (params) => (
      <Stack direction="row" alignItems="center" spacing={0.5}>
        <Star sx={{ fontSize: 16, color: '#F59E0B' }} />
        <Typography variant="body2">{params.row.rating || 0}</Typography>
      </Stack>
    ) },
    { field: 'comment', headerName: 'Comment', flex: 2 },
    { field: 'createdAt', headerName: 'Date', flex: 0.8, renderCell: (params) => new Date(params.row.createdAt).toLocaleDateString() },
    {
      field: 'isActive', headerName: 'Status', flex: 0.6,
      renderCell: (params) => (
        <Chip
          label={params.row.isActive ? 'Active' : 'Inactive'}
          size="small" color={params.row.isActive ? 'success' : 'default'}
          onClick={() => handleStatusChange(params.row.id, !params.row.isActive)}
          sx={{ cursor: 'pointer' }}
        />
      ),
    },
    {
      field: 'actions', headerName: 'Actions', flex: 0.6,
      renderCell: (params) => (
        <Stack direction="row" spacing={0.5}>
          <Tooltip title="View">
            <IconButton onClick={() => navigate(`/reviews/${params.row.id}`)} sx={{ color: COLORS.sky }}><Visibility /></IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton onClick={() => setDeleteConfirm(params.row.id)} sx={{ color: COLORS.rose }}><Delete /></IconButton>
          </Tooltip>
        </Stack>
      ),
    },
  ];

  // Mobile Card View
  const renderMobileCards = () => (
    <Stack spacing={2}>
      {items?.length > 0 ? items.map((review) => (
        <Card key={review.id} sx={{ borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <CardContent>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
              <Star sx={{ fontSize: 16, color: '#F59E0B' }} />
              <Typography fontWeight={600}>{review.rating || 0}</Typography>
              <Chip
                label={review.isActive ? 'Active' : 'Inactive'}
                size="small" color={review.isActive ? 'success' : 'default'}
                onClick={() => handleStatusChange(review.id, !review.isActive)}
                sx={{ cursor: 'pointer', ml: 'auto' }}
              />
            </Stack>
            <Typography variant="subtitle2" fontWeight={600}>{review.userName || 'N/A'} → {review.targetName || 'N/A'}</Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>{review.comment || 'No comment'}</Typography>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="caption">{new Date(review.createdAt).toLocaleDateString()}</Typography>
              <Stack direction="row">
                <IconButton size="small" onClick={() => navigate(`/reviews/${review.id}`)} sx={{ color: COLORS.sky }}><Visibility fontSize="small" /></IconButton>
                <IconButton size="small" onClick={() => setDeleteConfirm(review.id)} sx={{ color: COLORS.rose }}><Delete fontSize="small" /></IconButton>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      )) : <Typography align="center" color="textSecondary" sx={{ py: 4 }}>No reviews found</Typography>}
    </Stack>
  );

  return (
    <Box className="fade-in" sx={{ p: { xs: 2, md: 3 }, mt: 0, pt: 1 }}>
      <PanelHeader eyebrow="Feedback" title="Reviews Management" />
      
      {/* ✅ Search + Status + Rating Filters */}
      <Paper elevation={0} sx={{ p: 2, borderRadius: 4, border: '1px solid #e2e8f0', bgcolor: 'white', mb: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
          <TextField fullWidth placeholder="Search reviews..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} size="small"
            InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }} />
          <FormControl size="small" sx={{ minWidth: 130 }}>
            <InputLabel>Status</InputLabel>
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} label="Status">
              <MenuItem value="ALL">All Status</MenuItem>
              <MenuItem value="true">Active</MenuItem>
              <MenuItem value="false">Inactive</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 130 }}>
            <InputLabel>Rating</InputLabel>
            <Select value={ratingFilter} onChange={(e) => setRatingFilter(e.target.value)} label="Rating">
              <MenuItem value="ALL">All Ratings</MenuItem>
              <MenuItem value="5">5 Stars</MenuItem>
              <MenuItem value="4">4 Stars</MenuItem>
              <MenuItem value="3">3 Stars</MenuItem>
              <MenuItem value="2">2 Stars</MenuItem>
              <MenuItem value="1">1 Star</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </Paper>

      {isMobile ? (
        loading ? <Loader /> : renderMobileCards()
      ) : (
        <Paper elevation={0} sx={{ p: 2, borderRadius: 4, border: '1px solid #e2e8f0', bgcolor: 'white' }}>
          {loading ? <Loader /> : (
            <DataGrid rows={items} columns={columns} pageSize={pagination.limit} rowsPerPageOptions={[5, 10, 25]}
              page={pagination.page - 1} onPageChange={(p) => dispatch(setPage(p + 1))} onPageSizeChange={(s) => dispatch(setLimit(s))}
              components={{ Toolbar: CustomToolbar }} disableSelectionOnClick autoHeight
              sx={{ '& .MuiDataGrid-columnHeaders': { bgcolor: '#F8FAFC', fontWeight: 700 }, '& .MuiDataGrid-row:hover': { bgcolor: '#F0F4FF' } }} />
          )}
        </Paper>
      )}

      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)}>
        <DialogTitle>Delete Review?</DialogTitle>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm(null)}>Cancel</Button>
          <Button onClick={() => handleDelete(deleteConfirm)} color="error" variant="contained">Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Reviews;