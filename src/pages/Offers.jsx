// src/pages/Offers.js
import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FaPlus, FaEdit, FaTrash } from 'react-icons/fa';
import { toast } from 'react-toastify';
import {
  Box, Paper, Typography, TextField, Button, IconButton, Chip, Switch,
  Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress, Grid, Stack,
  useMediaQuery, useTheme, Card, CardContent, Tooltip, InputAdornment,
  FormControl, InputLabel, Select, MenuItem,
} from '@mui/material';
import { Search, CloudUpload, Close } from '@mui/icons-material';
import { DataGrid, GridToolbarContainer, GridToolbarFilterButton, GridToolbarExport } from '@mui/x-data-grid';
import { fetchOffers, createOffer, updateOffer, deleteOffer, setPage, setLimit } from '../redux/slices/offerSlice';
import Loader from '../components/Loader';
import PanelHeader from '../components/PanelHeader';
import { COLORS, FONT_DISPLAY } from '../theme/dashboardTheme';
import apiClient from '../api/axios';

const CustomToolbar = () => (
  <GridToolbarContainer sx={{ p: 1 }}>
    <GridToolbarFilterButton />
    <GridToolbarExport />
  </GridToolbarContainer>
);

// ---------- OfferModal with Image Upload ----------
const OfferModal = ({ open, onClose, offer, onSave, saving }) => {
  const [formData, setFormData] = useState({
    title: '', description: '', image: '', discountPercentage: 0, startDate: '', endDate: '', isActive: true,
  });
  const [uploading, setUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState('');

  useEffect(() => {
    if (offer) {
      const formatDateForInput = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return '';
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
      };

      setFormData({
        title: offer.title || '', description: offer.description || '', image: offer.image || '',
        discountPercentage: offer.discountPercentage || 0,
        startDate: formatDateForInput(offer.startDate),
        endDate: formatDateForInput(offer.endDate),
        isActive: offer.isActive ?? true,
      });
      setPreviewImage(offer.image || '');
    } else {
      setFormData({ title: '', description: '', image: '', discountPercentage: 0, startDate: '', endDate: '', isActive: true });
      setPreviewImage('');
    }
  }, [offer, open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    const formData = new FormData();
    formData.append('image', file);

    try {
      setUploading(true);
      const response = await apiClient.post('/uploads', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const imageUrl = response.data.url;
      setPreviewImage(imageUrl);
      setFormData(prev => ({ ...prev, image: imageUrl }));
      toast.success('Image uploaded');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const handleRemoveImage = () => {
    setPreviewImage('');
    setFormData(prev => ({ ...prev, image: '' }));
  };

  const handleSubmit = () => {
    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }

    const toISOOrNull = (value) => {
      if (!value) return null;
      const d = new Date(value);
      return isNaN(d.getTime()) ? null : d.toISOString();
    };

    const payload = {
      ...formData,
      startDate: toISOOrNull(formData.startDate),
      endDate: toISOOrNull(formData.endDate),
      discountPercentage: Number(formData.discountPercentage) || 0,
    };
    onSave(payload);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontFamily: FONT_DISPLAY, fontWeight: 700, borderBottom: '1px solid #E2E8F0' }}>
        {offer ? '✏️ Edit Offer' : '➕ Create New Offer'}
      </DialogTitle>
      <DialogContent dividers sx={{ p: 3 }}>
        <Grid container spacing={2.5}>
          <Grid item xs={12}>
            <TextField fullWidth label="Offer Title" name="title" value={formData.title} onChange={handleChange} required />
          </Grid>
          <Grid item xs={12}>
            <TextField fullWidth label="Description" multiline rows={2} name="description" value={formData.description} onChange={handleChange} />
          </Grid>
          <Grid item xs={12}>
            <Typography variant="subtitle2" gutterBottom>Offer Image</Typography>
            <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
              <Button component="label" variant="outlined" startIcon={<CloudUpload />} disabled={uploading} sx={{ mb: 1 }}>
                Upload Image
                <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
              </Button>
              {uploading && <CircularProgress size={24} sx={{ mb: 1 }} />}
              {previewImage && (
                <Box sx={{ position: 'relative', width: 80, height: 80, borderRadius: 2, overflow: 'hidden', mb: 1 }}>
                  <img src={previewImage} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <IconButton size="small" sx={{ position: 'absolute', top: 0, right: 0, bgcolor: 'rgba(0,0,0,0.5)', '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' } }} onClick={handleRemoveImage}>
                    <Close fontSize="small" sx={{ color: '#fff' }} />
                  </IconButton>
                </Box>
              )}
            </Stack>
            <TextField fullWidth label="Image URL (auto-filled)" value={formData.image} onChange={handleChange} name="image" sx={{ mt: 1 }} InputProps={{ readOnly: true }} variant="outlined" size="small" />
          </Grid>
          <Grid item xs={12}>
            <TextField fullWidth type="number" label="Discount (%)" name="discountPercentage" value={formData.discountPercentage} onChange={handleChange} InputProps={{ inputProps: { min: 0, max: 100 } }} />
          </Grid>
          <Grid item xs={6}>
            <TextField fullWidth label="Start Date" type="datetime-local" name="startDate" value={formData.startDate} onChange={handleChange} InputLabelProps={{ shrink: true }} />
          </Grid>
          <Grid item xs={6}>
            <TextField fullWidth label="End Date" type="datetime-local" name="endDate" value={formData.endDate} onChange={handleChange} InputLabelProps={{ shrink: true }} />
          </Grid>
          <Grid item xs={6}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography variant="body2">Active</Typography>
              <Switch checked={formData.isActive} onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))} />
            </Stack>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ padding: 2, borderTop: '1px solid #E2E8F0' }}>
        <Button onClick={onClose} color="inherit">Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={saving}
          sx={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', '&:hover': { background: 'linear-gradient(135deg, #4F46E5, #7C3AED)' }, px: 4 }}>
          {saving ? <CircularProgress size={20} /> : 'Save Offer'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ---------- Main Offers Component ----------
const Offers = () => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { items, total, loading, pagination } = useSelector((state) => state.offers);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');  // ✅ NEW
  const [modalOpen, setModalOpen] = useState(false);
  const [editOffer, setEditOffer] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // ✅ Fetch with status filter
  useEffect(() => {
    dispatch(fetchOffers({ page: pagination.page, limit: pagination.limit, search: searchTerm, status: statusFilter !== 'ALL' ? statusFilter : undefined }));
  }, [dispatch, pagination.page, pagination.limit, searchTerm, statusFilter]);

  const handleSave = async (data) => {
    setSaving(true);
    try {
      if (editOffer) {
        await dispatch(updateOffer({ id: editOffer.id, data })).unwrap();
        toast.success('Offer updated');
      } else {
        await dispatch(createOffer(data)).unwrap();
        toast.success('Offer created');
      }
      setModalOpen(false);
      dispatch(fetchOffers({ page: pagination.page, limit: pagination.limit }));
    } catch (error) {
      toast.error(error.message || 'Failed to save offer');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await dispatch(deleteOffer(id)).unwrap();
      toast.success('Offer deleted');
      setDeleteConfirm(null);
    } catch {
      toast.error('Delete failed');
    }
  };

  const columns = [
    { field: 'image', headerName: 'Image', flex: 0.6, minWidth: 100, renderCell: (params) => (
      <img src={params.row.image || 'https://via.placeholder.com/80'} alt="offer" style={{ width: 60, height: 60, borderRadius: 8, objectFit: 'cover' }} />
    ) },
    { field: 'title', headerName: 'Title', flex: 1.5, minWidth: 150, renderCell: (params) => <Typography fontWeight={600}>{params.row.title}</Typography> },
    { field: 'description', headerName: 'Description', flex: 2, minWidth: 200 },
    { field: 'discountPercentage', headerName: 'Discount', flex: 0.5, minWidth: 80, renderCell: (params) => <Chip label={`${params.row.discountPercentage}%`} color="success" size="small" /> },
    { field: 'startDate', headerName: 'Start', flex: 0.7, minWidth: 100, renderCell: (params) => { if (!params.row.startDate) return <Typography variant="caption" color="textSecondary">N/A</Typography>; return new Date(params.row.startDate).toLocaleDateString(); } },
    { field: 'endDate', headerName: 'End', flex: 0.7, minWidth: 100, renderCell: (params) => { if (!params.row.endDate) return <Typography variant="caption" color="textSecondary">N/A</Typography>; return new Date(params.row.endDate).toLocaleDateString(); } },
    { field: 'isActive', headerName: 'Active', flex: 0.5, minWidth: 80, renderCell: (params) => <Chip label={params.row.isActive ? 'Yes' : 'No'} size="small" color={params.row.isActive ? 'success' : 'default'} /> },
    { field: 'actions', headerName: 'Actions', flex: 0.8, minWidth: 120, renderCell: (params) => (
      <Stack direction="row" spacing={0.5}>
        <Tooltip title="Edit">
          <IconButton onClick={() => { setEditOffer(params.row); setModalOpen(true); }} sx={{ color: COLORS.sky }}><FaEdit /></IconButton>
        </Tooltip>
        <Tooltip title="Delete">
          <IconButton onClick={() => setDeleteConfirm(params.row.id)} sx={{ color: COLORS.rose }}><FaTrash /></IconButton>
        </Tooltip>
      </Stack>
    ) },
  ];

  const renderMobileCards = () => (
    <Stack spacing={2}>
      {items?.length > 0 ? items.map((offer) => (
        <Card key={offer.id} sx={{ borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <CardContent>
            <Box sx={{ display: 'flex', gap: 1.5, mb: 1.5 }}>
              <img src={offer.image || 'https://via.placeholder.com/80'} alt="offer" style={{ width: 80, height: 60, borderRadius: 8, objectFit: 'cover' }} />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="subtitle1" fontWeight={600} noWrap>{offer.title}</Typography>
                <Typography variant="caption" color="textSecondary" noWrap>{offer.description || 'No description'}</Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
              <Box>
                <Typography variant="caption" color="textSecondary">Discount</Typography>
                <Typography variant="body2" fontWeight={500}>{offer.discountPercentage}%</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="textSecondary">Active</Typography>
                <Chip label={offer.isActive ? 'Yes' : 'No'} size="small" color={offer.isActive ? 'success' : 'default'} />
              </Box>
              <Box>
                <Typography variant="caption" color="textSecondary">Start</Typography>
                <Typography variant="body2" fontWeight={500}>{offer.startDate ? new Date(offer.startDate).toLocaleDateString() : 'N/A'}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="textSecondary">End</Typography>
                <Typography variant="body2" fontWeight={500}>{offer.endDate ? new Date(offer.endDate).toLocaleDateString() : 'N/A'}</Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 1.5, borderTop: '1px solid #f1f5f9', pt: 1 }}>
              <IconButton size="small" onClick={() => { setEditOffer(offer); setModalOpen(true); }} sx={{ color: COLORS.sky }}><FaEdit fontSize="small" /></IconButton>
              <IconButton size="small" onClick={() => setDeleteConfirm(offer.id)} sx={{ color: COLORS.rose }}><FaTrash fontSize="small" /></IconButton>
            </Box>
          </CardContent>
        </Card>
      )) : (
        <Typography align="center" color="textSecondary" sx={{ py: 4 }}>No offers found</Typography>
      )}
    </Stack>
  );

  return (
    <Box className="fade-in" sx={{ p: { xs: 2, md: 3 }, mt: 0, pt: 1 }}>
      <PanelHeader eyebrow="Promotions" title="Offers Management" />

      {/* ✅ Search + Status Filter */}
      <Paper elevation={0} sx={{ p: 2, borderRadius: 4, border: '1px solid #e2e8f0', bgcolor: 'white', mb: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
          <TextField fullWidth placeholder="Search offers..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} size="small"
            InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }} />
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Status</InputLabel>
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} label="Status">
              <MenuItem value="ALL">All Status</MenuItem>
              <MenuItem value="true">Active</MenuItem>
              <MenuItem value="false">Inactive</MenuItem>
            </Select>
          </FormControl>
          <Button variant="contained" startIcon={<FaPlus />} onClick={() => { setEditOffer(null); setModalOpen(true); }}
            sx={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', '&:hover': { background: 'linear-gradient(135deg, #4F46E5, #7C3AED)' }, px: 3, whiteSpace: 'nowrap' }}>
            Create Offer
          </Button>
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
              sx={{ '& .MuiDataGrid-columnHeaders': { bgcolor: '#F8FAFC', fontWeight: 700, color: '#475569' }, '& .MuiDataGrid-row:hover': { bgcolor: '#F0F4FF' }, '& .MuiDataGrid-cell': { borderBottom: '1px solid #F1F5F9', padding: '8px' }, '& .MuiDataGrid-columnSeparator': { display: 'none' } }} />
          )}
        </Paper>
      )}

      <OfferModal open={modalOpen} onClose={() => setModalOpen(false)} offer={editOffer} onSave={handleSave} saving={saving} />
      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)}>
        <DialogTitle>Delete Offer?</DialogTitle>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm(null)}>Cancel</Button>
          <Button onClick={() => handleDelete(deleteConfirm)} color="error" variant="contained">Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Offers;