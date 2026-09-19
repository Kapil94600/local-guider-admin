// src/pages/Photographers.jsx
import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  Box, Paper, Typography, TextField, Button, IconButton, Chip, Avatar,
  Stack, Tooltip, InputAdornment, Dialog, DialogTitle, DialogContent, DialogActions,
  useMediaQuery, useTheme, Card, CardContent, FormControl, Select, MenuItem, InputLabel,
} from '@mui/material';
import { Search, Delete, Visibility, Star, Block, PhotoLibrary } from '@mui/icons-material';
import { DataGrid, GridToolbarContainer, GridToolbarFilterButton, GridToolbarExport } from '@mui/x-data-grid';
import { fetchPhotographers, updatePhotographerStatus, deletePhotographer, setPage, setLimit } from '../redux/slices/photographerSlice';
import Loader from '../components/Loader';
import PanelHeader from '../components/PanelHeader';
import ExportButtons from '../components/ExportButtons';
import GalleryManager from '../components/GalleryManager';
import { removePhotographerGalleryImage } from '../api/admin';
import { COLORS } from '../theme/dashboardTheme';
import apiClient from '../api/axios';

const getImageUrl = (path) => {
  if (!path) return 'https://via.placeholder.com/40';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://local-guider-backend.onrender.com/api/v1';
  const baseUrl = API_BASE_URL.replace('/api/v1', '');
  return `${baseUrl}${path.startsWith('/') ? path : '/' + path}`;
};

const getFullName = (photographer) => {
  if (photographer.fullName) return photographer.fullName;
  if (photographer.firstName && photographer.lastName) return `${photographer.firstName} ${photographer.lastName}`;
  if (photographer.user?.firstName && photographer.user?.lastName) return `${photographer.user.firstName} ${photographer.user.lastName}`;
  if (photographer.name) return photographer.name;
  return '—';
};

const getEmail = (photographer) => photographer.user?.email || photographer.email || '—';
const getPhone = (photographer) => photographer.user?.phone || photographer.phone || '—';

const CustomToolbar = () => (
  <GridToolbarContainer sx={{ p: 1 }}>
    <GridToolbarFilterButton />
    <GridToolbarExport />
  </GridToolbarContainer>
);

const Photographers = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { items, total, loading, pagination } = useSelector((state) => state.photographers);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [blockConfirm, setBlockConfirm] = useState(null);
  const [galleryDialog, setGalleryDialog] = useState({ open: false, photographer: null });

  const exportHeaders = [
    { key: 'profileImage', label: 'Photo', isImage: true },
    { key: 'fullName', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    { key: 'experience', label: 'Experience' },
    { key: 'cameraDetails', label: 'Camera' },
    { key: 'companyName', label: 'Company' },
    { key: 'location', label: 'Location' },
    { key: 'isActive', label: 'Status' },
  ];

  useEffect(() => {
    const params = {
      page: pagination.page,
      limit: pagination.limit,
      search: searchTerm || undefined,
      status: statusFilter !== 'ALL' ? statusFilter : undefined,
    };
    dispatch(fetchPhotographers(params));
  }, [dispatch, pagination.page, pagination.limit, searchTerm, statusFilter]);

  const handleDelete = async (id) => {
    try {
      await dispatch(deletePhotographer(id)).unwrap();
      toast.success('Photographer deleted successfully');
      setDeleteConfirm(null);
    } catch {
      toast.error('Delete failed');
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      await dispatch(updatePhotographerStatus({ id, status: !currentStatus })).unwrap();
      toast.success('Status updated');
    } catch (error) {
      toast.error(error.message || 'Status update failed');
    }
  };

  const handleBlock = async (photographerId) => {
    try {
      const photographer = items.find(p => p.id === photographerId);
      await apiClient.post('/blocks', { blockedUserId: photographer?.userId || photographerId, reason: 'Admin block' });
      toast.success('Photographer blocked successfully');
      setBlockConfirm(null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to block photographer');
    }
  };

  const columns = [
    {
      field: 'profileImage',
      headerName: 'Image',
      flex: 0.5,
      minWidth: 80,
      renderCell: (params) => (
        <Avatar src={getImageUrl(params.row.profileImage || params.row.user?.profileImage)} alt={getFullName(params.row)} />
      ),
    },
    { field: 'fullName', headerName: 'Name', flex: 1.2, minWidth: 150, renderCell: (params) => <Typography fontWeight={600}>{getFullName(params.row)}</Typography> },
    { field: 'email', headerName: 'Email', flex: 1.5, minWidth: 180, renderCell: (params) => <Typography variant="body2">{getEmail(params.row)}</Typography> },
    { field: 'phone', headerName: 'Phone', flex: 1, minWidth: 120, renderCell: (params) => <Typography variant="body2">{getPhone(params.row)}</Typography> },
    { field: 'experience', headerName: 'Experience', flex: 0.7, minWidth: 100, renderCell: (params) => `${params.row.experience || 0} yrs` },
    { field: 'cameraDetails', headerName: 'Camera', flex: 1, minWidth: 120, renderCell: (params) => params.row.cameraDetails || 'N/A' },
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
      flex: 1.2,
      minWidth: 180,
      renderCell: (params) => (
        <Stack direction="row" spacing={0.5}>
          <Tooltip title="View">
            <IconButton onClick={() => navigate(`/photographers/${params.row.id}`)} sx={{ color: COLORS.sky }}>
              <Visibility />
            </IconButton>
          </Tooltip>
          <Tooltip title="Gallery">
            <IconButton
              onClick={() => setGalleryDialog({ open: true, photographer: params.row })}
              sx={{ color: '#8B5CF6' }}
            >
              <PhotoLibrary />
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

  const renderMobileCards = () => (
    <Stack spacing={2}>
      {items?.length > 0 ? items.map((photographer) => (
        <Card key={photographer.id} sx={{ borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
              <Avatar src={getImageUrl(photographer.profileImage || photographer.user?.profileImage)} alt={getFullName(photographer)} />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="subtitle1" fontWeight={600} noWrap>{getFullName(photographer)}</Typography>
                <Typography variant="caption" color="textSecondary" noWrap>{getEmail(photographer)}</Typography>
              </Box>
              <Chip
                label={photographer.isActive ? 'Active' : 'Inactive'}
                size="small"
                color={photographer.isActive ? 'success' : 'error'}
                onClick={() => handleToggleStatus(photographer.id, photographer.isActive)}
                sx={{ cursor: 'pointer' }}
              />
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
              <Box>
                <Typography variant="caption" color="textSecondary">Phone</Typography>
                <Typography variant="body2" fontWeight={500}>{getPhone(photographer)}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="textSecondary">Experience</Typography>
                <Typography variant="body2" fontWeight={500}>{photographer.experience || 0} yrs</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="textSecondary">Camera</Typography>
                <Typography variant="body2" fontWeight={500}>{photographer.cameraDetails || 'N/A'}</Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 1.5, borderTop: '1px solid #f1f5f9', pt: 1 }}>
              <IconButton size="small" onClick={() => navigate(`/photographers/${photographer.id}`)} sx={{ color: COLORS.sky }}>
                <Visibility fontSize="small" />
              </IconButton>
              <IconButton size="small" onClick={() => setGalleryDialog({ open: true, photographer })} sx={{ color: '#8B5CF6' }}>
                <PhotoLibrary fontSize="small" />
              </IconButton>
              <IconButton size="small" onClick={() => setBlockConfirm(photographer.id)} sx={{ color: '#EF4444' }}>
                <Block fontSize="small" />
              </IconButton>
              <IconButton size="small" onClick={() => setDeleteConfirm(photographer.id)} sx={{ color: COLORS.rose }}>
                <Delete fontSize="small" />
              </IconButton>
            </Box>
          </CardContent>
        </Card>
      )) : (
        <Typography align="center" color="textSecondary" sx={{ py: 4 }}>No photographers found</Typography>
      )}
    </Stack>
  );

  return (
    <Box className="fade-in" sx={{ p: { xs: 2, md: 3 }, mt: 0, pt: 1 }}>
      <PanelHeader eyebrow="Photographers Management" title="All Photographers" />

      <Paper elevation={0} sx={{ p: 2, borderRadius: 4, border: '1px solid #e2e8f0', bgcolor: 'white', mb: 2 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center" justifyContent="space-between">
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center" sx={{ flex: 1 }}>
            <TextField
              fullWidth
              placeholder="Search photographers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              size="small"
              sx={{ width: { xs: '100%', md: 300 } }}
              InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }}
            />
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Status</InputLabel>
              <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} label="Status">
                <MenuItem value="ALL">All Status</MenuItem>
                <MenuItem value="true">Active</MenuItem>
                <MenuItem value="false">Inactive</MenuItem>
              </Select>
            </FormControl>
          </Stack>
          <ExportButtons data={items} headers={exportHeaders} filename="photographers" />
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

      {/* ✅ Gallery Dialog — Delete-only mode */}
      <Dialog
        open={galleryDialog.open}
        onClose={() => setGalleryDialog({ open: false, photographer: null })}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700, borderBottom: '1px solid #E2E8F0' }}>
          📷 Gallery — {getFullName(galleryDialog.photographer || {})}
        </DialogTitle>
        <DialogContent dividers sx={{ p: 3 }}>
          {galleryDialog.photographer && (
            <GalleryManager
              entityId={galleryDialog.photographer.id}
              entityType="PHOTOGRAPHER"
              initialImages={galleryDialog.photographer.gallery || []}
              canUpload={false}
              canDelete={true}
              onDelete={async (imageUrl) => {
                await removePhotographerGalleryImage(galleryDialog.photographer.id, imageUrl);
              }}
              title="Portfolio Gallery"
            />
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setGalleryDialog({ open: false, photographer: null })} color="inherit">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)}>
        <DialogTitle>Delete Photographer?</DialogTitle>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm(null)}>Cancel</Button>
          <Button onClick={() => handleDelete(deleteConfirm)} color="error" variant="contained">Delete</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!blockConfirm} onClose={() => setBlockConfirm(null)}>
        <DialogTitle>Block Photographer?</DialogTitle>
        <DialogActions>
          <Button onClick={() => setBlockConfirm(null)}>Cancel</Button>
          <Button onClick={() => handleBlock(blockConfirm)} color="error" variant="contained">Block Photographer</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Photographers;