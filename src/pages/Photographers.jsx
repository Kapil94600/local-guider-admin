// src/pages/Photographers.jsx
import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  Box, Paper, Typography, TextField, Button, IconButton, Chip, Avatar,
  Stack, Tooltip, InputAdornment, Dialog, DialogTitle, DialogContent,
  DialogActions, useMediaQuery, useTheme, FormControl, Select, MenuItem,
  InputLabel, CircularProgress, Divider,
} from '@mui/material';
import {
  Search, Delete, Visibility, Block, PhotoLibrary,
  Refresh, PersonAdd,
} from '@mui/icons-material';
import { DataGrid, GridToolbarContainer, GridToolbarFilterButton, GridToolbarExport } from '@mui/x-data-grid';
import { fetchPhotographers, updatePhotographerStatus, deletePhotographer, setPage, setLimit } from '../redux/slices/photographerSlice';
import Loader from '../components/Loader';
import PanelHeader from '../components/PanelHeader';
import ExportButtons from '../components/ExportButtons';
import GalleryManager from '../components/GalleryManager';
import { removePhotographerGalleryImage } from '../api/admin';
import apiClient from '../api/axios';
import { getImageUrl } from '../utils/imageFallback';

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
  radius: 3,
};

const getFullName = (p) => {
  if (p.fullName) return p.fullName;
  if (p.firstName && p.lastName) return `${p.firstName} ${p.lastName}`;
  if (p.user?.firstName && p.user?.lastName) return `${p.user.firstName} ${p.user.lastName}`;
  if (p.name) return p.name;
  return '—';
};

const getEmail = (p) => p.user?.email || p.email || '—';
const getPhone = (p) => p.user?.phone || p.phone || '—';

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
  const { items, loading, pagination } = useSelector((s) => s.photographers);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [blockConfirm, setBlockConfirm] = useState(null);
  const [galleryDialog, setGalleryDialog] = useState({ open: false, photographer: null });
  const [processing, setProcessing] = useState(false);

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

  const fetchList = () => {
    dispatch(fetchPhotographers({
      page: pagination.page,
      limit: pagination.limit,
      search: searchTerm || undefined,
      status: statusFilter !== 'ALL' ? statusFilter : undefined,
    }));
  };

  useEffect(() => {
    fetchList();
  }, [dispatch, pagination.page, pagination.limit, searchTerm, statusFilter]);

  const handleDelete = async (id) => {
    try {
      setProcessing(true);
      await dispatch(deletePhotographer(id)).unwrap();
      toast.success('Photographer deleted successfully');
      setDeleteConfirm(null);
      fetchList();
    } catch {
      toast.error('Delete failed');
    } finally {
      setProcessing(false);
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      await dispatch(updatePhotographerStatus({ id, status: !currentStatus })).unwrap();
      toast.success('Status updated');
      fetchList();
    } catch (error) {
      toast.error(error.message || 'Status update failed');
    }
  };

  const handleBlock = async (photographerId) => {
    try {
      setProcessing(true);
      const photographer = items.find((p) => p.id === photographerId);
      await apiClient.post('/blocks', {
        blockedUserId: photographer?.userId || photographerId,
        reason: 'Admin block',
      });
      toast.success('Photographer blocked successfully');
      setBlockConfirm(null);
      fetchList();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to block photographer');
    } finally {
      setProcessing(false);
    }
  };

  const columns = [
    {
      field: 'profileImage',
      headerName: 'Profile',
      flex: 0.5,
      minWidth: 80,
      renderCell: (params) => {
        const name = getFullName(params.row);
        return (
          <Avatar
            src={getImageUrl(
              params.row.profileImage || params.row.user?.profileImage,
              name
            )}
            alt={name}
            sx={{
              width: 38,
              height: 38,
              background: 'linear-gradient(135deg, #ec4899, #f472b6)',
              fontWeight: 700,
              fontSize: '0.85rem',
              border: '2px solid #fff',
              boxShadow: '0 2px 6px rgba(15,23,42,0.1)',
            }}
          >
            {(name[0] || 'P').toUpperCase()}
          </Avatar>
        );
      },
    },
    {
      field: 'fullName',
      headerName: 'Name',
      flex: 1.2,
      minWidth: 140,
      renderCell: (params) => (
        <Typography
          sx={{ fontSize: '0.82rem', fontWeight: 700, color: T.textPrimary }}
          noWrap
        >
          {getFullName(params.row)}
        </Typography>
      ),
    },
    {
      field: 'email',
      headerName: 'Email',
      flex: 1.5,
      minWidth: 180,
      renderCell: (params) => (
        <Typography sx={{ fontSize: '0.78rem', color: T.textMuted }} noWrap>
          {getEmail(params.row)}
        </Typography>
      ),
    },
    {
      field: 'phone',
      headerName: 'Phone',
      flex: 1,
      minWidth: 120,
      renderCell: (params) => (
        <Typography sx={{ fontSize: '0.78rem', color: T.textMuted }} noWrap>
          {getPhone(params.row)}
        </Typography>
      ),
    },
    {
      field: 'experience',
      headerName: 'Exp.',
      flex: 0.6,
      minWidth: 80,
      renderCell: (params) => (
        <Typography sx={{ fontSize: '0.78rem', color: T.textMuted }}>
          {params.row.experience || 0} yrs
        </Typography>
      ),
    },
    {
      field: 'cameraDetails',
      headerName: 'Camera',
      flex: 1,
      minWidth: 120,
      renderCell: (params) => (
        <Typography sx={{ fontSize: '0.78rem', color: T.textMuted }} noWrap>
          {params.row.cameraDetails || 'N/A'}
        </Typography>
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
          onClick={() => handleToggleStatus(params.row.id, params.row.isActive)}
          sx={{
            bgcolor: params.row.isActive ? T.emeraldSoft : '#f1f5f9',
            color: params.row.isActive ? '#059669' : '#64748b',
            fontWeight: 700,
            fontSize: '0.65rem',
            height: 22,
            borderRadius: 999,
            cursor: 'pointer',
          }}
        />
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      flex: 1,
      minWidth: 160,
      sortable: false,
      renderCell: (params) => (
        <Stack direction="row" spacing={0.5} alignItems="center">
          <Tooltip title="View details">
            <IconButton
              size="small"
              onClick={() => navigate(`/photographers/${params.row.id}`)}
              sx={{
                bgcolor: T.indigoSoft,
                color: T.indigo,
                '&:hover': { bgcolor: '#e0e7ff' },
                width: 32,
                height: 32,
              }}
            >
              <Visibility sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Gallery">
            <IconButton
              size="small"
              onClick={() => setGalleryDialog({ open: true, photographer: params.row })}
              sx={{
                bgcolor: T.violetSoft,
                color: T.violet,
                '&:hover': { bgcolor: '#ddd6fe' },
                width: 32,
                height: 32,
              }}
            >
              <PhotoLibrary sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Block photographer">
            <IconButton
              size="small"
              onClick={() => setBlockConfirm(params.row.id)}
              sx={{
                bgcolor: T.amberSoft,
                color: '#b45309',
                '&:hover': { bgcolor: '#fde68a' },
                width: 32,
                height: 32,
              }}
            >
              <Block sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete photographer">
            <IconButton
              size="small"
              onClick={() => setDeleteConfirm(params.row.id)}
              sx={{
                bgcolor: T.roseSoft,
                color: T.rose,
                '&:hover': { bgcolor: '#fecaca' },
                width: 32,
                height: 32,
              }}
            >
              <Delete sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
        </Stack>
      ),
    },
  ];

  const renderMobileCards = () => (
    <Stack spacing={2}>
      {items?.length > 0 ? (
        items.map((photographer) => {
          const name = getFullName(photographer);
          return (
            <Paper
              key={photographer.id}
              elevation={0}
              sx={{
                borderRadius: T.radius,
                border: `1px solid ${T.border}`,
                bgcolor: T.surface,
                p: 2,
                transition: 'all 0.2s ease',
                '&:hover': {
                  boxShadow: '0 12px 24px -16px rgba(15,23,42,0.15)',
                  borderColor: T.borderStrong,
                },
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1.5 }}>
                <Avatar
                  src={getImageUrl(
                    photographer.profileImage || photographer.user?.profileImage,
                    name
                  )}
                  alt={name}
                  sx={{
                    width: 44,
                    height: 44,
                    background: 'linear-gradient(135deg, #ec4899, #f472b6)',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    border: '2px solid #fff',
                  }}
                >
                  {(name[0] || 'P').toUpperCase()}
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    sx={{ fontSize: '0.88rem', fontWeight: 700, color: T.textPrimary }}
                    noWrap
                  >
                    {name}
                  </Typography>
                  <Typography
                    sx={{ fontSize: '0.72rem', color: T.textMuted, mt: 0.2 }}
                    noWrap
                  >
                    {getEmail(photographer)}
                  </Typography>
                </Box>
                <Chip
                  label={photographer.isActive ? 'Active' : 'Inactive'}
                  size="small"
                  onClick={() => handleToggleStatus(photographer.id, photographer.isActive)}
                  sx={{
                    bgcolor: photographer.isActive ? T.emeraldSoft : '#f1f5f9',
                    color: photographer.isActive ? '#059669' : '#64748b',
                    fontWeight: 700,
                    fontSize: '0.62rem',
                    height: 22,
                    borderRadius: 999,
                    cursor: 'pointer',
                  }}
                />
              </Stack>

              <Stack direction="row" spacing={2.5} sx={{ mb: 1.5 }}>
                <Box>
                  <Typography sx={{ fontSize: '0.6rem', color: T.textFaint, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Phone
                  </Typography>
                  <Typography sx={{ fontSize: '0.78rem', color: T.textPrimary, fontWeight: 600, mt: 0.2 }}>
                    {getPhone(photographer)}
                  </Typography>
                </Box>
                <Box>
                  <Typography sx={{ fontSize: '0.6rem', color: T.textFaint, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Exp.
                  </Typography>
                  <Typography sx={{ fontSize: '0.78rem', color: T.textPrimary, fontWeight: 600, mt: 0.2 }}>
                    {photographer.experience || 0} yrs
                  </Typography>
                </Box>
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontSize: '0.6rem', color: T.textFaint, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Camera
                  </Typography>
                  <Typography sx={{ fontSize: '0.78rem', color: T.textPrimary, fontWeight: 600, mt: 0.2 }} noWrap>
                    {photographer.cameraDetails || 'N/A'}
                  </Typography>
                </Box>
              </Stack>

              <Stack
                direction="row"
                justifyContent="flex-end"
                spacing={0.5}
                sx={{ pt: 1.5, borderTop: `1px solid ${T.border}` }}
              >
                <IconButton
                  size="small"
                  onClick={() => navigate(`/photographers/${photographer.id}`)}
                  sx={{ bgcolor: T.indigoSoft, color: T.indigo, width: 30, height: 30 }}
                >
                  <Visibility sx={{ fontSize: 15 }} />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => setGalleryDialog({ open: true, photographer })}
                  sx={{ bgcolor: T.violetSoft, color: T.violet, width: 30, height: 30 }}
                >
                  <PhotoLibrary sx={{ fontSize: 15 }} />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => setBlockConfirm(photographer.id)}
                  sx={{ bgcolor: T.amberSoft, color: '#b45309', width: 30, height: 30 }}
                >
                  <Block sx={{ fontSize: 15 }} />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => setDeleteConfirm(photographer.id)}
                  sx={{ bgcolor: T.roseSoft, color: T.rose, width: 30, height: 30 }}
                >
                  <Delete sx={{ fontSize: 15 }} />
                </IconButton>
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
          <PersonAdd sx={{ fontSize: 40, color: T.textFaint, mb: 1 }} />
          <Typography sx={{ color: T.textFaint, fontWeight: 500 }}>
            No photographers found
          </Typography>
        </Paper>
      )}
    </Stack>
  );

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1440, mx: 'auto' }}>
      <Box sx={{ mb: 3 }}>
        <PanelHeader eyebrow="Photographers Management" title="All Photographers" />
      </Box>

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
            placeholder="Search photographers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            size="small"
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
                '&:hover fieldset': { borderColor: '#fbcfe8' },
                '&.Mui-focused fieldset': { borderColor: T.rose, borderWidth: 1.5 },
              },
            }}
          />

          <FormControl size="small" sx={{ minWidth: 130 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              label="Status"
              sx={{ borderRadius: 2, bgcolor: T.surfaceSoft }}
            >
              <MenuItem value="ALL">All Status</MenuItem>
              <MenuItem value="true">Active</MenuItem>
              <MenuItem value="false">Inactive</MenuItem>
            </Select>
          </FormControl>

          <Tooltip title="Refresh">
            <IconButton
              onClick={fetchList}
              sx={{
                bgcolor: T.roseSoft,
                color: T.rose,
                width: 40,
                height: 40,
                '&:hover': { bgcolor: '#fecdd3' },
              }}
            >
              <Refresh sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>

          <ExportButtons data={items} headers={exportHeaders} filename="photographers" />
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

      {/* ═══════ Gallery Dialog ═══════ */}
      <Dialog
        open={galleryDialog.open}
        onClose={() => setGalleryDialog({ open: false, photographer: null })}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: T.radius } }}
      >
        <DialogTitle
          sx={{
            fontWeight: 700,
            fontSize: '1.05rem',
            color: T.textPrimary,
            borderBottom: `1px solid ${T.border}`,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <PhotoLibrary sx={{ fontSize: 18, color: T.violet }} />
          Gallery — {getFullName(galleryDialog.photographer || {})}
        </DialogTitle>
        <DialogContent dividers sx={{ p: 3, borderColor: T.border }}>
          {galleryDialog.photographer && (
            <GalleryManager
              entityId={galleryDialog.photographer.id}
              entityType="PHOTOGRAPHER"
              initialImages={galleryDialog.photographer.gallery || []}
              canUpload={false}
              canDelete={true}
              onDelete={async (imageUrl) => {
                await removePhotographerGalleryImage(
                  galleryDialog.photographer.id,
                  imageUrl
                );
              }}
              title="Portfolio Gallery"
            />
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            onClick={() => setGalleryDialog({ open: false, photographer: null })}
            sx={{ textTransform: 'none', fontWeight: 600, color: T.textMuted }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* ═══════ Delete Dialog ═══════ */}
      <Dialog
        open={!!deleteConfirm}
        onClose={() => !processing && setDeleteConfirm(null)}
        PaperProps={{ sx: { borderRadius: T.radius, p: 0.5 } }}
      >
        <DialogTitle
          sx={{
            fontWeight: 700,
            color: T.textPrimary,
            fontSize: '1.05rem',
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
            <Delete sx={{ fontSize: 18 }} />
          </Box>
          Delete Photographer?
        </DialogTitle>
        <Divider />
        <Box sx={{ px: 3, py: 2 }}>
          <Typography sx={{ fontSize: '0.85rem', color: T.textMuted }}>
            This will permanently delete the photographer and all associated data.
            This action cannot be undone.
          </Typography>
        </Box>
        <DialogActions sx={{ p: 2, pt: 0, gap: 1 }}>
          <Button
            onClick={() => setDeleteConfirm(null)}
            disabled={processing}
            sx={{ textTransform: 'none', fontWeight: 600, color: T.textMuted }}
          >
            Cancel
          </Button>
          <Button
            onClick={() => handleDelete(deleteConfirm)}
            disabled={processing}
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
            {processing ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ═══════ Block Dialog ═══════ */}
      <Dialog
        open={!!blockConfirm}
        onClose={() => !processing && setBlockConfirm(null)}
        PaperProps={{ sx: { borderRadius: T.radius, p: 0.5 } }}
      >
        <DialogTitle
          sx={{
            fontWeight: 700,
            color: T.textPrimary,
            fontSize: '1.05rem',
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
              bgcolor: T.amberSoft,
              color: '#b45309',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Block sx={{ fontSize: 18 }} />
          </Box>
          Block Photographer?
        </DialogTitle>
        <Divider />
        <Box sx={{ px: 3, py: 2 }}>
          <Typography sx={{ fontSize: '0.85rem', color: T.textMuted }}>
            The photographer won't be able to log in or access the platform.
          </Typography>
        </Box>
        <DialogActions sx={{ p: 2, pt: 0, gap: 1 }}>
          <Button
            onClick={() => setBlockConfirm(null)}
            disabled={processing}
            sx={{ textTransform: 'none', fontWeight: 600, color: T.textMuted }}
          >
            Cancel
          </Button>
          <Button
            onClick={() => handleBlock(blockConfirm)}
            disabled={processing}
            variant="contained"
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              borderRadius: 2,
              bgcolor: T.amber,
              '&:hover': { bgcolor: '#d97706' },
              boxShadow: 'none',
            }}
          >
            {processing ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : 'Block'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Photographers;