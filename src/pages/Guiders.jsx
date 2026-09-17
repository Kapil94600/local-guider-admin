// src/pages/Guiders.js
import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  Box, Paper, Typography, TextField, Button, IconButton, Chip, Avatar,
  Stack, Tooltip, InputAdornment, Dialog, DialogTitle, DialogActions,
  useMediaQuery, useTheme, Card, CardContent, FormControl, Select, MenuItem, InputLabel,
} from '@mui/material';
import { Search, Delete, Visibility, Star, Block } from '@mui/icons-material';
import { DataGrid, GridToolbarContainer, GridToolbarFilterButton, GridToolbarExport } from '@mui/x-data-grid';
import { fetchGuiders, updateGuider, deleteGuider, setPage, setLimit } from '../redux/slices/guiderSlice';
import Loader from '../components/Loader';
import PanelHeader from '../components/PanelHeader';
import ExportButtons from '../components/ExportButtons'; // ✅ Add this
import { COLORS } from '../theme/dashboardTheme';
import apiClient from '../api/axios'; // ✅ API client for block

// ----- Helpers with nested user support -----
const getImageUrl = (path) => {
  if (!path) return 'https://via.placeholder.com/40';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://local-guider-backend.onrender.com/api/v1';
  const baseUrl = API_BASE_URL.replace('/api/v1', '');
  return `${baseUrl}${path.startsWith('/') ? path : '/' + path}`;
};

const getFullName = (guider) => {
  if (guider.fullName) return guider.fullName;
  if (guider.firstName && guider.lastName) return `${guider.firstName} ${guider.lastName}`;
  if (guider.user?.firstName && guider.user?.lastName) return `${guider.user.firstName} ${guider.user.lastName}`;
  if (guider.name) return guider.name;
  return '—';
};

const getEmail = (guider) => {
  const email = guider.user?.email || guider.email || guider.User?.email || '';
  return email || '—';
};

const getPhone = (guider) => {
  const phone = guider.user?.phone || guider.phone || guider.User?.phone || '';
  return phone || '—';
};

// ----- Toolbar -----
const CustomToolbar = () => (
  <GridToolbarContainer sx={{ p: 1 }}>
    <GridToolbarFilterButton />
    <GridToolbarExport />
  </GridToolbarContainer>
);

// ----- Main Component -----
const Guiders = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { items, total, loading, pagination } = useSelector((state) => state.guiders);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [blockConfirm, setBlockConfirm] = useState(null);

  // ✅ Export headers
const exportHeaders = [
  { key: 'profilePhotoUrl', label: 'Photo', isImage: true },
  { key: 'fullName', label: 'Name' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
  { key: 'experience', label: 'Experience' },
  { key: 'rating', label: 'Rating' },
  { key: 'companyName', label: 'Company' },
  { key: 'location', label: 'Location' },
  { key: 'isActive', label: 'Status' },
];


  // ✅ Fetch with status filter
  useEffect(() => {
    const params = {
      page: pagination.page,
      limit: pagination.limit,
      search: searchTerm || undefined,
      status: statusFilter !== 'ALL' ? statusFilter : undefined,
    };
    dispatch(fetchGuiders(params));
  }, [dispatch, pagination.page, pagination.limit, searchTerm, statusFilter]);

  const handleDelete = async (id) => {
    try {
      await dispatch(deleteGuider(id)).unwrap();
      toast.success('Guider deleted successfully');
      setDeleteConfirm(null);
    } catch {
      toast.error('Delete failed');
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      await dispatch(updateGuider({ id, data: { isActive: !currentStatus } })).unwrap();
      toast.success('Status updated');
    } catch (error) {
      toast.error(error.message || 'Status update failed');
    }
  };

  // ✅ Block Guider
  const handleBlock = async (guiderId) => {
    try {
      const guider = items.find(g => g.id === guiderId);
      await apiClient.post('/blocks', { blockedUserId: guider?.userId || guiderId, reason: 'Admin block' });
      toast.success('Guider blocked successfully');
      setBlockConfirm(null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to block guider');
    }
  };

  // ----- Columns -----
  const columns = [
    {
      field: 'profilePhotoUrl',
      headerName: 'Image',
      flex: 0.5,
      minWidth: 80,
      renderCell: (params) => (
        <Avatar
          src={getImageUrl(params.row.profilePhotoUrl || params.row.profileImage)}
          alt={getFullName(params.row)}
        />
      ),
    },
    {
      field: 'fullName',
      headerName: 'Name',
      flex: 1.2,
      minWidth: 150,
      renderCell: (params) => (
        <Typography fontWeight={600}>{getFullName(params.row)}</Typography>
      ),
    },
    {
      field: 'email',
      headerName: 'Email',
      flex: 1.5,
      minWidth: 180,
      renderCell: (params) => (
        <Typography variant="body2">{getEmail(params.row)}</Typography>
      ),
    },
    {
      field: 'phone',
      headerName: 'Phone',
      flex: 1,
      minWidth: 120,
      renderCell: (params) => (
        <Typography variant="body2">{getPhone(params.row)}</Typography>
      ),
    },
    {
      field: 'experience',
      headerName: 'Experience',
      flex: 0.7,
      minWidth: 100,
      renderCell: (params) => `${params.row.experience || 0} yrs`,
    },
    {
      field: 'rating',
      headerName: 'Rating',
      flex: 0.6,
      minWidth: 80,
      renderCell: (params) => (
        <Stack direction="row" alignItems="center" spacing={0.5}>
          <Star sx={{ fontSize: 16, color: '#F59E0B' }} />
          <Typography variant="body2">{params.row.rating || 0}</Typography>
        </Stack>
      ),
    },
    {
      field: 'isActive',
      headerName: 'Status',
      flex: 0.7,
      minWidth: 100,
      renderCell: (params) => (
        <Chip
          label={params.row.isActive ? 'Active' : 'Inactive'}
          size="small"
          color={params.row.isActive ? 'success' : 'error'}
          onClick={() => handleToggleStatus(params.row.id, params.row.isActive)}
          sx={{ cursor: 'pointer' }}
        />
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      flex: 1,
      minWidth: 150,
      renderCell: (params) => (
        <Stack direction="row" spacing={0.5}>
          <Tooltip title="View">
            <IconButton onClick={() => navigate(`/guiders/${params.row.id}`)} sx={{ color: COLORS.sky }}>
              <Visibility />
            </IconButton>
          </Tooltip>
          <Tooltip title="Block">
            <IconButton onClick={() => setBlockConfirm(params.row.id)} sx={{ color: '#EF4444' }}>
              <Block />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton onClick={() => setDeleteConfirm(params.row.id)} sx={{ color: COLORS.rose }}>
              <Delete />
            </IconButton>
          </Tooltip>
        </Stack>
      ),
    },
  ];

  // ----- Mobile Cards -----
  const renderMobileCards = () => (
    <Stack spacing={2}>
      {items?.length > 0 ? items.map((guider) => (
        <Card key={guider.id} sx={{ borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
              <Avatar
                src={getImageUrl(guider.profilePhotoUrl || guider.profileImage)}
                alt={getFullName(guider)}
              />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="subtitle1" fontWeight={600} noWrap>
                  {getFullName(guider)}
                </Typography>
                <Typography variant="caption" color="textSecondary" noWrap>
                  {getEmail(guider)}
                </Typography>
              </Box>
              <Chip
                label={guider.isActive ? 'Active' : 'Inactive'}
                size="small"
                color={guider.isActive ? 'success' : 'error'}
                onClick={() => handleToggleStatus(guider.id, guider.isActive)}
                sx={{ cursor: 'pointer' }}
              />
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
              <Box>
                <Typography variant="caption" color="textSecondary">Phone</Typography>
                <Typography variant="body2" fontWeight={500}>{getPhone(guider)}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="textSecondary">Experience</Typography>
                <Typography variant="body2" fontWeight={500}>{guider.experience || 0} yrs</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="textSecondary">Rating</Typography>
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  <Star sx={{ fontSize: 14, color: '#F59E0B' }} />
                  <Typography variant="body2">{guider.rating || 0}</Typography>
                </Stack>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 1.5, borderTop: '1px solid #f1f5f9', pt: 1 }}>
              <IconButton size="small" onClick={() => navigate(`/guiders/${guider.id}`)} sx={{ color: COLORS.sky }}>
                <Visibility fontSize="small" />
              </IconButton>
              <IconButton size="small" onClick={() => setBlockConfirm(guider.id)} sx={{ color: '#EF4444' }}>
                <Block fontSize="small" />
              </IconButton>
              <IconButton size="small" onClick={() => setDeleteConfirm(guider.id)} sx={{ color: COLORS.rose }}>
                <Delete fontSize="small" />
              </IconButton>
            </Box>
          </CardContent>
        </Card>
      )) : (
        <Typography align="center" color="textSecondary" sx={{ py: 4 }}>
          No guiders found
        </Typography>
      )}
    </Stack>
  );

  return (
    <Box className="fade-in" sx={{ p: { xs: 2, md: 3 }, mt: 0, pt: 1 }}>
      <PanelHeader eyebrow="Guiders Management" title="All Guiders" />

      {/* ✅ Search + Status Filter + Export */}
      <Paper elevation={0} sx={{ p: 2, borderRadius: 4, border: '1px solid #e2e8f0', bgcolor: 'white', mb: 2 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center" justifyContent="space-between">
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center" sx={{ flex: 1 }}>
            <TextField
              fullWidth
              placeholder="Search guiders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              size="small"
              sx={{ width: { xs: '100%', md: 300 } }}
              InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }}
            />
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                label="Status"
              >
                <MenuItem value="ALL">All Status</MenuItem>
                <MenuItem value="true">Active</MenuItem>
                <MenuItem value="false">Inactive</MenuItem>
              </Select>
            </FormControl>
          </Stack>
          {/* ✅ PDF + Excel Export */}
          <ExportButtons data={items} headers={exportHeaders} filename="guiders" />
        </Stack>
      </Paper>

      {isMobile ? (
        loading ? <Loader /> : renderMobileCards()
      ) : (
        <Paper elevation={0} sx={{ p: 2, borderRadius: 4, border: '1px solid #e2e8f0', bgcolor: 'white' }}>
          {loading ? <Loader /> : (
            <DataGrid
              rows={items}
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
                '& .MuiDataGrid-cell': { borderBottom: '1px solid #F1F5F9', padding: '8px' },
                '& .MuiDataGrid-columnSeparator': { display: 'none' },
              }}
            />
          )}
        </Paper>
      )}

      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)}>
        <DialogTitle>Delete Guider?</DialogTitle>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm(null)}>Cancel</Button>
          <Button onClick={() => handleDelete(deleteConfirm)} color="error" variant="contained">Delete</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!blockConfirm} onClose={() => setBlockConfirm(null)}>
        <DialogTitle>Block Guider?</DialogTitle>
        <DialogActions>
          <Button onClick={() => setBlockConfirm(null)}>Cancel</Button>
          <Button onClick={() => handleBlock(blockConfirm)} color="error" variant="contained">Block Guider</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Guiders;
