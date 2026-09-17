import { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  Box, Paper, Typography, TextField, Select, MenuItem, FormControl,
  InputLabel, Button, IconButton, Chip, Switch, Dialog, DialogTitle,
  DialogContent, DialogActions, CircularProgress, Grid, Alert,
  InputAdornment, Stack, Tooltip,
} from '@mui/material';
import { Search, Add, Edit, Delete, Visibility, Star, LocationOn, Place as PlaceIcon } from '@mui/icons-material';
import { DataGrid, GridToolbarContainer, GridToolbarFilterButton, GridToolbarExport } from '@mui/x-data-grid';
import { fetchPlaces, createPlace, updatePlace, deletePlace, setPage, setLimit } from '../redux/slices/placeSlice';
import Loader from '../components/Loader';
import PanelHeader from '../components/PanelHeader';
import { COLORS, FONT_BODY, FONT_DISPLAY } from '../theme/dashboardTheme';

const CustomToolbar = () => (
  <GridToolbarContainer sx={{ p: 1 }}>
    <GridToolbarFilterButton />
    <GridToolbarExport />
  </GridToolbarContainer>
);

const CategorySelect = ({ value, onChange, size = 'small' }) => (
  <FormControl fullWidth size={size}>
    <Select
      value={value || ''}
      onChange={onChange}
      displayEmpty
      renderValue={(selected) => {
        if (selected === '' || selected === null) return <span style={{ color: '#9CA3AF' }}>Select Category</span>;
        return selected.charAt(0).toUpperCase() + selected.slice(1);
      }}
      sx={{ '& .MuiSelect-select': { py: 1.5 } }}
    >
      <MenuItem value="">All</MenuItem>
      <MenuItem value="historical">Historical</MenuItem>
      <MenuItem value="nature">Nature</MenuItem>
      <MenuItem value="beach">Beach</MenuItem>
      <MenuItem value="adventure">Adventure</MenuItem>
      <MenuItem value="religious">Religious</MenuItem>
      <MenuItem value="cultural">Cultural</MenuItem>
      <MenuItem value="other">Other</MenuItem>
    </Select>
  </FormControl>
);

const PlaceModal = ({ open, onClose, place, onSave, saving }) => {
  const [formData, setFormData] = useState({
    name: '', description: '', category: '', address: '', city: '',
    state: '', country: '', latitude: '', longitude: '', image: '',
    gallery: [], openingTime: '', closingTime: '', isFeatured: false, isActive: true,
  });

  useEffect(() => {
    if (place) {
      setFormData({
        name: place.name || '', description: place.description || '',
        category: place.category || '', address: place.address || '',
        city: place.city || '', state: place.state || '', country: place.country || '',
        latitude: place.latitude || '', longitude: place.longitude || '',
        image: place.image || '', gallery: place.gallery || [],
        openingTime: place.openingTime || '', closingTime: place.closingTime || '',
        isFeatured: place.isFeatured || false, isActive: place.isActive ?? true,
      });
    } else {
      setFormData({
        name: '', description: '', category: '', address: '', city: '',
        state: '', country: '', latitude: '', longitude: '', image: '',
        gallery: [], openingTime: '', closingTime: '', isFeatured: false, isActive: true,
      });
    }
  }, [place, open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    if (!formData.name.trim() || !formData.city.trim()) {
      toast.error('Name and City are required');
      return;
    }
    onSave(formData);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontFamily: FONT_DISPLAY, fontWeight: 700, borderBottom: '1px solid #E2E8F0' }}>
        {place ? '✏️ Edit Place' : '➕ Add New Place'}
      </DialogTitle>
      <DialogContent dividers sx={{ p: 3 }}>
        <Grid container spacing={2.5}>
          <Grid item xs={12} md={6}>
            <TextField fullWidth label="Place Name" name="name" value={formData.name} onChange={handleChange} required
              InputProps={{ startAdornment: <InputAdornment position="start"><PlaceIcon fontSize="small" /></InputAdornment> }} />
          </Grid>
          <Grid item xs={12} md={6}>
            <CategorySelect value={formData.category} onChange={(e) => handleChange({ target: { name: 'category', value: e.target.value } })} />
          </Grid>
          <Grid item xs={12}>
            <TextField fullWidth label="Description" name="description" value={formData.description} onChange={handleChange} multiline rows={3} />
          </Grid>
          <Grid item xs={12}>
            <TextField fullWidth label="Address" name="address" value={formData.address} onChange={handleChange}
              InputProps={{ startAdornment: <InputAdornment position="start"><LocationOn fontSize="small" /></InputAdornment> }} />
          </Grid>
          <Grid item xs={4}>
            <TextField fullWidth label="City" name="city" value={formData.city} onChange={handleChange} required />
          </Grid>
          <Grid item xs={4}>
            <TextField fullWidth label="State" name="state" value={formData.state} onChange={handleChange} />
          </Grid>
          <Grid item xs={4}>
            <TextField fullWidth label="Country" name="country" value={formData.country} onChange={handleChange} />
          </Grid>
          <Grid item xs={6}>
            <TextField fullWidth label="Latitude" name="latitude" type="number" value={formData.latitude} onChange={handleChange} />
          </Grid>
          <Grid item xs={6}>
            <TextField fullWidth label="Longitude" name="longitude" type="number" value={formData.longitude} onChange={handleChange} />
          </Grid>
          <Grid item xs={12}>
            <TextField fullWidth label="Image URL" name="image" value={formData.image} onChange={handleChange} placeholder="https://example.com/image.jpg" />
          </Grid>
          <Grid item xs={6}>
            <TextField fullWidth label="Opening Time" name="openingTime" value={formData.openingTime} onChange={handleChange} placeholder="09:00 AM" />
          </Grid>
          <Grid item xs={6}>
            <TextField fullWidth label="Closing Time" name="closingTime" value={formData.closingTime} onChange={handleChange} placeholder="06:00 PM" />
          </Grid>
          <Grid item xs={6}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography variant="body2">Featured</Typography>
              <Switch checked={formData.isFeatured} onChange={(e) => setFormData(prev => ({ ...prev, isFeatured: e.target.checked }))} />
            </Stack>
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
          {saving ? <CircularProgress size={20} /> : 'Save Place'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const Places = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items, total, loading, pagination } = useSelector((state) => state.places);
  const [modalOpen, setModalOpen] = useState(false);
  const [editPlace, setEditPlace] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCity, setFilterCity] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    dispatch(fetchPlaces({ page: pagination.page, limit: pagination.limit }));
  }, [dispatch, pagination.page, pagination.limit]);

  // ✅ Client-side filtering
  const filteredPlaces = (items || []).filter((item) => {
    const matchesSearch = !searchTerm || item.name?.toLowerCase().includes(searchTerm.toLowerCase()) || item.city?.toLowerCase().includes(searchTerm.toLowerCase()) || item.category?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCity = !filterCity || item.city?.toLowerCase() === filterCity.toLowerCase();
    const matchesCategory = !filterCategory || item.category?.toLowerCase() === filterCategory.toLowerCase();
    const matchesStatus = filterStatus === '' || (filterStatus === 'true' ? item.isActive === true : item.isActive === false);
    return matchesSearch && matchesCity && matchesCategory && matchesStatus;
  });

  // ✅ Unique cities for dropdown
  const uniqueCities = [...new Set((items || []).map(item => item.city).filter(Boolean))];

  const handleSave = async (data) => {
    setSaving(true);
    try {
      if (editPlace) {
        await dispatch(updatePlace({ id: editPlace.id, data })).unwrap();
        toast.success('Place updated successfully');
      } else {
        await dispatch(createPlace(data)).unwrap();
        toast.success('Place created successfully');
      }
      setModalOpen(false);
      dispatch(fetchPlaces({ page: pagination.page, limit: pagination.limit }));
    } catch (error) {
      toast.error(error.message || 'Operation failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await dispatch(deletePlace(id)).unwrap();
      toast.success('Place deleted successfully');
      setDeleteConfirm(null);
    } catch {
      toast.error('Delete failed');
    }
  };

  const columns = [
    {
      field: 'image',
      headerName: 'Image',
      flex: 0.6,
      minWidth: 80,
      renderCell: (params) => (
        <img src={params.row.image || 'https://via.placeholder.com/60'} alt="" style={{ width: 50, height: 40, borderRadius: 8, objectFit: 'cover' }} />
      ),
    },
    { field: 'name', headerName: 'Name', flex: 1.5, minWidth: 150, renderCell: (params) => <Typography fontWeight={600}>{params.row.name}</Typography> },
    {
      field: 'category',
      headerName: 'Category',
      flex: 1,
      minWidth: 120,
      renderCell: (params) => <Chip label={params.row.category ? params.row.category.charAt(0).toUpperCase() + params.row.category.slice(1) : 'N/A'} size="small" color="primary" variant="outlined" />,
    },
    {
      field: 'rating',
      headerName: 'Rating',
      flex: 0.8,
      minWidth: 100,
      renderCell: (params) => (
        <Stack direction="row" alignItems="center" spacing={0.5}>
          <Star sx={{ fontSize: 16, color: '#F59E0B' }} />
          <Typography variant="body2">{params.row.rating || 0}</Typography>
        </Stack>
      ),
    },
    {
      field: 'isActive',
      headerName: 'Active',
      flex: 0.6,
      minWidth: 80,
      renderCell: (params) => <Chip label={params.row.isActive ? 'Yes' : 'No'} size="small" color={params.row.isActive ? 'success' : 'default'} />,
    },
    {
      field: 'actions',
      headerName: 'Actions',
      flex: 0.8,
      minWidth: 120,
      renderCell: (params) => (
        <Stack direction="row" spacing={0.5}>
          <Tooltip title="View">
            <IconButton onClick={() => navigate(`/places/${params.row.id}`)} sx={{ color: COLORS.sky }}><Visibility /></IconButton>
          </Tooltip>
          <Tooltip title="Edit">
            <IconButton onClick={() => { setEditPlace(params.row); setModalOpen(true); }} sx={{ color: COLORS.skyDark }}><Edit /></IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton onClick={() => setDeleteConfirm(params.row.id)} sx={{ color: COLORS.rose }}><Delete /></IconButton>
          </Tooltip>
        </Stack>
      ),
    },
  ];

  return (
    <Box className="fade-in" sx={{ bgcolor: COLORS.bgBase, p: { xs: 2, md: 3 }, mt: 0, pt: 1 }}>
      <PanelHeader eyebrow="Places" title="Places Management" />

      {/* ✅ Filters UI – FIXED WIDTH input boxes */}
      <Paper elevation={0} sx={{ p: 2, borderRadius: 4, border: `1px solid ${COLORS.border}`, bgcolor: COLORS.bgSurface, mb: 2 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center" flexWrap="wrap">
          {/* Search Box – Fixed Width 300px */}
          <TextField 
            placeholder="Search places..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            size="small"
            sx={{ width: '300px' }}  // ✅ FIXED WIDTH
            InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }} 
          />

          {/* City Dropdown – Fixed Width 180px */}
          <FormControl size="small" sx={{ width: '180px' }}>  {/* ✅ FIXED WIDTH */}
            <InputLabel>City</InputLabel>
            <Select value={filterCity} onChange={(e) => setFilterCity(e.target.value)} label="City">
              <MenuItem value="">All Cities</MenuItem>
              {uniqueCities.map((city) => (
                <MenuItem key={city} value={city}>{city}</MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Category Dropdown – Fixed Width 180px */}
          <Box sx={{ width: '180px' }}>  {/* ✅ FIXED WIDTH */}
            <CategorySelect value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} size="small" />
          </Box>

          {/* Status Dropdown – Fixed Width 180px */}
          <FormControl size="small" sx={{ width: '180px' }}>  {/* ✅ FIXED WIDTH */}
            <InputLabel>Status</InputLabel>
            <Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} label="Status">
              <MenuItem value="">All Status</MenuItem>
              <MenuItem value="true">Active</MenuItem>
              <MenuItem value="false">Inactive</MenuItem>
            </Select>
          </FormControl>

          {/* Add Place Button – Fixed Width 150px */}
          <Button 
            variant="contained" 
            startIcon={<Add />} 
            onClick={() => { setEditPlace(null); setModalOpen(true); }}
            sx={{ 
              width: '150px',  // ✅ FIXED WIDTH
              background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', 
              '&:hover': { background: 'linear-gradient(135deg, #4F46E5, #7C3AED)' }, 
              py: 1, 
              borderRadius: 2, 
              fontWeight: 700, 
              fontSize: '0.85rem', 
              whiteSpace: 'nowrap' 
            }}
          >
            Add Place
          </Button>
        </Stack>
      </Paper>

      <Paper elevation={0} sx={{ p: 2, borderRadius: 4, border: `1px solid ${COLORS.border}`, bgcolor: COLORS.bgSurface }}>
        {loading ? <Loader /> : (
          <DataGrid
            rows={filteredPlaces}
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

      <PlaceModal open={modalOpen} onClose={() => setModalOpen(false)} place={editPlace} onSave={handleSave} saving={saving} />

      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)}>
        <DialogTitle>Delete Place?</DialogTitle>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm(null)}>Cancel</Button>
          <Button onClick={() => handleDelete(deleteConfirm)} color="error" variant="contained">Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Places;