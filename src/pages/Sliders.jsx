// src/pages/Sliders.jsx
import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FaPlus, FaEdit, FaTrash } from 'react-icons/fa';
import { toast } from 'react-toastify';
import {
  Box, Paper, Typography, TextField, Button, IconButton, Chip, Switch,
  Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress,
  Stack, useMediaQuery, useTheme, Tooltip, InputAdornment,
  FormControl, InputLabel, Select, MenuItem, Divider,
} from '@mui/material';
import {
  Search, CloudUpload, Close, Refresh,
  Slideshow as SlideshowIcon,
} from '@mui/icons-material';
import { DataGrid, GridToolbarContainer, GridToolbarFilterButton, GridToolbarExport } from '@mui/x-data-grid';
import { fetchSliders, createSlider, updateSlider, deleteSlider, setPage, setLimit } from '../redux/slices/sliderSlice';
import Loader from '../components/Loader';
import PanelHeader from '../components/PanelHeader';
import apiClient from '../api/axios';

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
  radius: 3,
  fontDisplay: '"Inter", system-ui, -apple-system, sans-serif',
};

const CustomToolbar = () => (
  <GridToolbarContainer sx={{ p: 1 }}>
    <GridToolbarFilterButton />
    <GridToolbarExport />
  </GridToolbarContainer>
);

const SectionHeader = ({ title, subtitle, accent = T.indigo }) => (
  <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
    <Box sx={{ width: 4, height: 22, borderRadius: 1, bgcolor: accent }} />
    <Box>
      <Typography sx={{ fontFamily: T.fontDisplay, fontWeight: 700, fontSize: '0.95rem', color: T.textPrimary }}>
        {title}
      </Typography>
      {subtitle && (
        <Typography sx={{ fontSize: '0.7rem', color: T.textFaint, mt: 0.2, fontWeight: 500 }}>
          {subtitle}
        </Typography>
      )}
    </Box>
  </Stack>
);

// ═══════════════════════════════════════════════════════════════
// SLIDER MODAL
// ═══════════════════════════════════════════════════════════════
const SliderModal = ({ open, onClose, slider, onSave, saving }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image: '',
    linkType: 'NONE',
    linkId: '',
    order: 0,
    isActive: true,
  });
  const [uploading, setUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState('');

  useEffect(() => {
    if (slider) {
      setFormData({
        title: slider.title || '',
        description: slider.description || '',
        image: slider.image || '',
        linkType: slider.linkType || 'NONE',
        linkId: slider.linkId || '',
        order: slider.order || 0,
        isActive: slider.isActive ?? true,
      });
      setPreviewImage(slider.image || '');
    } else {
      setFormData({
        title: '',
        description: '',
        image: '',
        linkType: 'NONE',
        linkId: '',
        order: 0,
        isActive: true,
      });
      setPreviewImage('');
    }
  }, [slider, open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    const fd = new FormData();
    fd.append('image', file);
    try {
      setUploading(true);
      const response = await apiClient.post('/uploads', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const imageUrl = response.data.url;
      setPreviewImage(imageUrl);
      setFormData((prev) => ({ ...prev, image: imageUrl }));
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
    setFormData((prev) => ({ ...prev, image: '' }));
  };

  const handleSubmit = () => {
    if (!formData.title.trim() || !formData.image.trim()) {
      toast.error('Title and Image are required');
      return;
    }
    onSave(formData);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: T.radius } }}
    >
      <DialogTitle
        sx={{
          fontFamily: T.fontDisplay,
          fontWeight: 700,
          fontSize: '1.05rem',
          color: T.textPrimary,
          borderBottom: `1px solid ${T.border}`,
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
            bgcolor: T.indigoSoft,
            color: T.indigo,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <SlideshowIcon sx={{ fontSize: 18 }} />
        </Box>
        {slider ? 'Edit Slider' : 'Add New Slider'}
      </DialogTitle>
      <DialogContent dividers sx={{ p: 3, borderColor: T.border }}>
        <Stack spacing={2.5}>
          <TextField
            fullWidth
            label="Title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                bgcolor: T.surfaceSoft,
                '& fieldset': { borderColor: T.border },
                '&.Mui-focused fieldset': { borderColor: T.indigo, borderWidth: 1.5 },
              },
            }}
          />
          <TextField
            fullWidth
            label="Description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            multiline
            rows={2}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                bgcolor: T.surfaceSoft,
                '& fieldset': { borderColor: T.border },
                '&.Mui-focused fieldset': { borderColor: T.indigo, borderWidth: 1.5 },
              },
            }}
          />

          {/* Image upload */}
          <Box>
            <Typography
              sx={{
                fontSize: '0.7rem',
                fontWeight: 700,
                color: T.textFaint,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                mb: 1,
              }}
            >
              Slider Image
            </Typography>
            <Stack direction="row" spacing={2} alignItems="center" sx={{ flexWrap: 'wrap', gap: 1.5 }}>
              <Button
                component="label"
                variant="outlined"
                startIcon={<CloudUpload />}
                disabled={uploading}
                sx={{
                  textTransform: 'none',
                  fontWeight: 700,
                  fontSize: '0.78rem',
                  borderRadius: 2,
                  borderColor: T.border,
                  color: T.textPrimary,
                  bgcolor: T.surface,
                  px: 2,
                  '&:hover': {
                    borderColor: T.indigo,
                    bgcolor: T.indigoSoft,
                  },
                }}
              >
                Upload Image
                <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
              </Button>
              {uploading && <CircularProgress size={20} sx={{ color: T.indigo }} />}
              {previewImage && (
                <Box
                  sx={{
                    position: 'relative',
                    width: 80,
                    height: 80,
                    borderRadius: 2,
                    overflow: 'hidden',
                    border: `1px solid ${T.border}`,
                  }}
                >
                  <Box
                    component="img"
                    src={previewImage}
                    alt="preview"
                    sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <IconButton
                    size="small"
                    onClick={handleRemoveImage}
                    sx={{
                      position: 'absolute',
                      top: 2,
                      right: 2,
                      width: 24,
                      height: 24,
                      bgcolor: 'rgba(11,18,32,0.7)',
                      color: '#fff',
                      '&:hover': { bgcolor: 'rgba(11,18,32,0.9)' },
                    }}
                  >
                    <Close sx={{ fontSize: 14 }} />
                  </IconButton>
                </Box>
              )}
            </Stack>
            <TextField
              fullWidth
              label="Image URL"
              value={formData.image}
              name="image"
              sx={{ mt: 1.5 }}
              slotProps={{ input: { readOnly: true } }}
              variant="outlined"
              size="small"
            />
          </Box>

          <Stack direction="row" spacing={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Link Type</InputLabel>
              <Select
                name="linkType"
                value={formData.linkType}
                onChange={handleChange}
                label="Link Type"
                sx={{ borderRadius: 2, bgcolor: T.surfaceSoft }}
              >
                <MenuItem value="NONE">None</MenuItem>
                <MenuItem value="PLACE">Place</MenuItem>
                <MenuItem value="GUIDER">Guider</MenuItem>
                <MenuItem value="PHOTOGRAPHER">Photographer</MenuItem>
                <MenuItem value="URL">URL</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              size="small"
              label="Link ID / URL"
              name="linkId"
              value={formData.linkId}
              onChange={handleChange}
              placeholder="UUID or URL"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  bgcolor: T.surfaceSoft,
                  '& fieldset': { borderColor: T.border },
                  '&.Mui-focused fieldset': { borderColor: T.indigo, borderWidth: 1.5 },
                },
              }}
            />
          </Stack>

          <Stack direction="row" spacing={2} alignItems="center">
            <TextField
              size="small"
              label="Order"
              name="order"
              type="number"
              value={formData.order}
              onChange={handleChange}
              sx={{
                width: 140,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  bgcolor: T.surfaceSoft,
                  '& fieldset': { borderColor: T.border },
                  '&.Mui-focused fieldset': { borderColor: T.indigo, borderWidth: 1.5 },
                },
              }}
            />
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, color: T.textPrimary }}>
                Active
              </Typography>
              <Switch
                checked={formData.isActive}
                onChange={(e) => setFormData((prev) => ({ ...prev, isActive: e.target.checked }))}
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': { color: T.emerald },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                    bgcolor: T.emerald,
                  },
                }}
              />
            </Stack>
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2, borderTop: `1px solid ${T.border}`, gap: 1 }}>
        <Button
          onClick={onClose}
          sx={{ textTransform: 'none', fontWeight: 600, color: T.textMuted }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={saving}
          sx={{
            textTransform: 'none',
            fontWeight: 700,
            borderRadius: 2,
            bgcolor: T.indigo,
            px: 3,
            boxShadow: 'none',
            '&:hover': { bgcolor: '#4f46e5' },
          }}
        >
          {saving ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : 'Save Slider'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ═══════════════════════════════════════════════════════════════
// SLIDERS
// ═══════════════════════════════════════════════════════════════
const Sliders = () => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { items, loading, pagination } = useSelector((state) => state.sliders);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [modalOpen, setModalOpen] = useState(false);
  const [editSlider, setEditSlider] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchList = () => {
    dispatch(fetchSliders({
      page: pagination.page,
      limit: pagination.limit,
      search: searchTerm || undefined,
      status: statusFilter !== 'ALL' ? statusFilter : undefined,
    }));
  };

  useEffect(() => {
    fetchList();
  }, [dispatch, pagination.page, pagination.limit, searchTerm, statusFilter]);

  const handleSave = async (data) => {
    setSaving(true);
    try {
      if (editSlider) {
        await dispatch(updateSlider({ id: editSlider.id, data })).unwrap();
        toast.success('Slider updated successfully');
      } else {
        await dispatch(createSlider(data)).unwrap();
        toast.success('Slider created successfully');
      }
      setModalOpen(false);
      fetchList();
    } catch (error) {
      toast.error(error.message || 'Operation failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    setDeleting(true);
    try {
      await dispatch(deleteSlider(id)).unwrap();
      toast.success('Slider deleted successfully');
      setDeleteConfirm(null);
      fetchList();
    } catch {
      toast.error('Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    {
      field: 'image',
      headerName: 'Image',
      flex: 0.6,
      minWidth: 100,
      renderCell: (params) => (
        <Box
          component="img"
          src={params.row.image || 'https://via.placeholder.com/80x40'}
          alt="slider"
          sx={{
            width: 72,
            height: 40,
            borderRadius: 1.5,
            objectFit: 'cover',
            border: `1px solid ${T.border}`,
          }}
        />
      ),
    },
    {
      field: 'title',
      headerName: 'Title',
      flex: 1.5,
      minWidth: 160,
      renderCell: (params) => (
        <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: T.textPrimary }} noWrap>
          {params.row.title}
        </Typography>
      ),
    },
    {
      field: 'description',
      headerName: 'Description',
      flex: 2,
      minWidth: 200,
      renderCell: (params) => (
        <Typography sx={{ fontSize: '0.78rem', color: T.textMuted }} noWrap>
          {params.row.description || '—'}
        </Typography>
      ),
    },
    {
      field: 'linkType',
      headerName: 'Link Type',
      flex: 0.8,
      minWidth: 120,
      renderCell: (params) => {
        const isNone = params.row.linkType === 'NONE';
        return (
          <Chip
            label={params.row.linkType || 'NONE'}
            size="small"
            sx={{
              bgcolor: isNone ? T.surfaceSoft : T.indigoSoft,
              color: isNone ? T.textMuted : T.indigo,
              border: isNone ? `1px solid ${T.border}` : 'none',
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
      field: 'order',
      headerName: 'Order',
      flex: 0.4,
      minWidth: 80,
      renderCell: (params) => (
        <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, color: T.textPrimary }}>
          {params.row.order || 0}
        </Typography>
      ),
    },
    {
      field: 'isActive',
      headerName: 'Active',
      flex: 0.5,
      minWidth: 90,
      renderCell: (params) => (
        <Chip
          label={params.row.isActive ? 'Active' : 'Inactive'}
          size="small"
          sx={{
            bgcolor: params.row.isActive ? T.emeraldSoft : '#f1f5f9',
            color: params.row.isActive ? '#059669' : '#64748b',
            fontWeight: 700,
            fontSize: '0.65rem',
            height: 22,
            borderRadius: 999,
          }}
        />
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      flex: 0.7,
      minWidth: 110,
      sortable: false,
      renderCell: (params) => (
        <Stack direction="row" spacing={0.5} alignItems="center">
          <Tooltip title="Edit slider">
            <IconButton
              size="small"
              onClick={() => {
                setEditSlider(params.row);
                setModalOpen(true);
              }}
              sx={{
                bgcolor: T.indigoSoft,
                color: T.indigo,
                '&:hover': { bgcolor: '#e0e7ff' },
                width: 32,
                height: 32,
              }}
            >
              <FaEdit size={14} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete slider">
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
              <FaTrash size={14} />
            </IconButton>
          </Tooltip>
        </Stack>
      ),
    },
  ];

  const renderMobileCards = () => (
    <Stack spacing={2}>
      {items?.length > 0 ? (
        items.map((slider) => (
          <Paper
            key={slider.id}
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
            <Stack direction="row" spacing={1.5} sx={{ mb: 1.5 }}>
              <Box
                component="img"
                src={slider.image || 'https://via.placeholder.com/100x60'}
                alt="slider"
                sx={{
                  width: 100,
                  height: 60,
                  borderRadius: 2,
                  objectFit: 'cover',
                  border: `1px solid ${T.border}`,
                  flexShrink: 0,
                }}
              />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  sx={{ fontSize: '0.88rem', fontWeight: 700, color: T.textPrimary }}
                  noWrap
                >
                  {slider.title}
                </Typography>
                <Typography
                  sx={{ fontSize: '0.72rem', color: T.textMuted, mt: 0.3 }}
                  noWrap
                >
                  {slider.description || 'No description'}
                </Typography>
              </Box>
            </Stack>

            <Stack direction="row" spacing={2} sx={{ mb: 1.5 }}>
              <Box>
                <Typography sx={{ fontSize: '0.6rem', color: T.textFaint, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Link
                </Typography>
                <Typography sx={{ fontSize: '0.78rem', color: T.textPrimary, fontWeight: 600, mt: 0.2 }}>
                  {slider.linkType || 'NONE'}
                </Typography>
              </Box>
              <Box>
                <Typography sx={{ fontSize: '0.6rem', color: T.textFaint, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Order
                </Typography>
                <Typography sx={{ fontSize: '0.78rem', color: T.textPrimary, fontWeight: 600, mt: 0.2 }}>
                  {slider.order || 0}
                </Typography>
              </Box>
              <Box>
                <Typography sx={{ fontSize: '0.6rem', color: T.textFaint, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Status
                </Typography>
                <Chip
                  label={slider.isActive ? 'Active' : 'Inactive'}
                  size="small"
                  sx={{
                    mt: 0.2,
                    bgcolor: slider.isActive ? T.emeraldSoft : '#f1f5f9',
                    color: slider.isActive ? '#059669' : '#64748b',
                    fontWeight: 700,
                    fontSize: '0.6rem',
                    height: 20,
                    borderRadius: 999,
                  }}
                />
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
                onClick={() => {
                  setEditSlider(slider);
                  setModalOpen(true);
                }}
                sx={{ bgcolor: T.indigoSoft, color: T.indigo, width: 30, height: 30 }}
              >
                <FaEdit size={13} />
              </IconButton>
              <IconButton
                size="small"
                onClick={() => setDeleteConfirm(slider.id)}
                sx={{ bgcolor: T.roseSoft, color: T.rose, width: 30, height: 30 }}
              >
                <FaTrash size={13} />
              </IconButton>
            </Stack>
          </Paper>
        ))
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
          <SlideshowIcon sx={{ fontSize: 40, color: T.textFaint, mb: 1 }} />
          <Typography sx={{ color: T.textFaint, fontWeight: 500 }}>
            No sliders found
          </Typography>
        </Paper>
      )}
    </Stack>
  );

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1440, mx: 'auto' }}>
      <Box sx={{ mb: 3 }}>
        <PanelHeader eyebrow="Content" title="Slider Management" />
      </Box>

      {/* ═══════ Filters + Add Button ═══════ */}
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
            placeholder="Search sliders..."
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
          <FormControl size="small" sx={{ minWidth: 140 }}>
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
          <Button
            variant="contained"
            startIcon={<FaPlus size={12} />}
            onClick={() => {
              setEditSlider(null);
              setModalOpen(true);
            }}
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '0.78rem',
              borderRadius: 2,
              bgcolor: T.indigo,
              px: 2.5,
              py: 1,
              boxShadow: 'none',
              whiteSpace: 'nowrap',
              '&:hover': { bgcolor: '#4f46e5' },
            }}
          >
            Add New Slider
          </Button>
        </Stack>
      </Paper>

      {/* ═══════ Table / Cards ═══════ */}
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

      {/* ═══════ Modals ═══════ */}
      <SliderModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        slider={editSlider}
        onSave={handleSave}
        saving={saving}
      />

      {/* Delete Dialog */}
      <Dialog
        open={!!deleteConfirm}
        onClose={() => !deleting && setDeleteConfirm(null)}
        PaperProps={{ sx: { borderRadius: T.radius, p: 0.5 } }}
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
            <FaTrash size={14} />
          </Box>
          Delete Slider?
        </DialogTitle>
        <Divider sx={{ borderColor: T.border }} />
        <Box sx={{ px: 3, py: 2 }}>
          <Typography sx={{ fontSize: '0.85rem', color: T.textMuted }}>
            This will permanently delete the slider. This action cannot be undone.
          </Typography>
        </Box>
        <DialogActions sx={{ p: 2, pt: 0, gap: 1 }}>
          <Button
            onClick={() => setDeleteConfirm(null)}
            disabled={deleting}
            sx={{ textTransform: 'none', fontWeight: 600, color: T.textMuted }}
          >
            Cancel
          </Button>
          <Button
            onClick={() => handleDelete(deleteConfirm)}
            disabled={deleting}
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
            {deleting ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Sliders;