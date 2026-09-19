// src/pages/PlaceCreate.jsx
import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { FaArrowLeft, FaSave, FaImage } from 'react-icons/fa';
import {
  Box, Paper, Typography, Button, TextField, Stack, InputAdornment,
  FormControl, Select, MenuItem, InputLabel, CircularProgress,
} from '@mui/material';
import { createPlace } from '../redux/slices/placeSlice';

// ═══════════════════════════════════════════════════════════════
// DESIGN TOKENS
// ═══════════════════════════════════════════════════════════════
const T = {
  border: '#eef1f6',
  borderStrong: '#e2e8f0',
  surface: '#ffffff',
  surfaceSoft: '#fafbfc',
  textPrimary: '#0b1220',
  textMuted: '#64748b',
  textFaint: '#94a3b8',
  indigo: '#6366f1',
  indigoSoft: '#eef2ff',
  rose: '#f43f5e',
  radius: 3,
  fontDisplay: '"Inter", system-ui, -apple-system, sans-serif',
};

// ═══════════════════════════════════════════════════════════════
// FORM FIELD STYLE
// ═══════════════════════════════════════════════════════════════
const fieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: 2,
    bgcolor: T.surfaceSoft,
    '& fieldset': { borderColor: T.border },
    '&:hover fieldset': { borderColor: '#c7d2fe' },
    '&.Mui-focused fieldset': { borderColor: T.indigo, borderWidth: 1.5 },
  },
  '& .MuiInputLabel-root.Mui-focused': { color: T.indigo },
};

const PlaceCreate = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const result = await dispatch(createPlace(data));
      if (createPlace.fulfilled.match(result)) {
        toast.success('Place created successfully!');
        navigate('/places');
      } else {
        toast.error(result.payload || 'Failed to create place');
      }
    } catch (error) {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 900, mx: 'auto' }}>
      {/* ═══════ Header ═══════ */}
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
        <Button
          onClick={() => navigate('/places')}
          sx={{
            minWidth: 40,
            width: 40,
            height: 40,
            borderRadius: 2,
            border: `1px solid ${T.border}`,
            bgcolor: T.surface,
            color: T.textMuted,
            p: 0,
            '&:hover': {
              bgcolor: T.surfaceSoft,
              borderColor: T.borderStrong,
              color: T.textPrimary,
            },
          }}
        >
          <FaArrowLeft size={14} />
        </Button>
        <Box>
          <Typography
            sx={{
              fontFamily: T.fontDisplay,
              fontWeight: 800,
              fontSize: '1.35rem',
              color: T.textPrimary,
              letterSpacing: '-0.02em',
              lineHeight: 1.2,
            }}
          >
            Add New Place
          </Typography>
          <Typography
            sx={{
              fontSize: '0.78rem',
              color: T.textMuted,
              mt: 0.3,
              fontWeight: 500,
            }}
          >
            Fill in the details to create a new place
          </Typography>
        </Box>
      </Stack>

      {/* ═══════ Form ═══════ */}
      <Paper
        component="form"
        onSubmit={handleSubmit(onSubmit)}
        elevation={0}
        sx={{
          p: 3,
          borderRadius: T.radius,
          border: `1px solid ${T.border}`,
          bgcolor: T.surface,
        }}
      >
        <Stack spacing={2.5}>
          {/* Name */}
          <TextField
            fullWidth
            label="Place Name *"
            placeholder="Enter place name"
            {...register('name', { required: 'Name is required' })}
            error={!!errors.name}
            helperText={errors.name?.message}
            sx={fieldSx}
          />

          {/* Category */}
          <FormControl fullWidth error={!!errors.category} sx={fieldSx}>
            <InputLabel>Category *</InputLabel>
            <Select
              label="Category *"
              defaultValue=""
              {...register('category', { required: 'Category is required' })}
            >
              <MenuItem value="">Select category</MenuItem>
              <MenuItem value="historical">Historical</MenuItem>
              <MenuItem value="nature">Nature</MenuItem>
              <MenuItem value="beach">Beach</MenuItem>
              <MenuItem value="adventure">Adventure</MenuItem>
              <MenuItem value="religious">Religious</MenuItem>
              <MenuItem value="cultural">Cultural</MenuItem>
              <MenuItem value="other">Other</MenuItem>
            </Select>
            {errors.category && (
              <Typography
                sx={{ fontSize: '0.7rem', color: T.rose, mt: 0.5, ml: 1.5 }}
              >
                {errors.category.message}
              </Typography>
            )}
          </FormControl>

          {/* Location Row */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
              gap: 2,
            }}
          >
            <TextField
              fullWidth
              label="Country *"
              placeholder="Country"
              {...register('country', { required: 'Country is required' })}
              error={!!errors.country}
              helperText={errors.country?.message}
              sx={fieldSx}
            />
            <TextField
              fullWidth
              label="State *"
              placeholder="State"
              {...register('state', { required: 'State is required' })}
              error={!!errors.state}
              helperText={errors.state?.message}
              sx={fieldSx}
            />
            <TextField
              fullWidth
              label="City *"
              placeholder="City"
              {...register('city', { required: 'City is required' })}
              error={!!errors.city}
              helperText={errors.city?.message}
              sx={fieldSx}
            />
          </Box>

          {/* Address */}
          <TextField
            fullWidth
            label="Address"
            placeholder="Street address"
            {...register('address')}
            sx={fieldSx}
          />

          {/* Lat/Lng */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
              gap: 2,
            }}
          >
            <TextField
              fullWidth
              label="Latitude"
              placeholder="e.g. 26.9124"
              type="number"
              inputProps={{ step: 'any' }}
              {...register('latitude')}
              sx={fieldSx}
            />
            <TextField
              fullWidth
              label="Longitude"
              placeholder="e.g. 75.7873"
              type="number"
              inputProps={{ step: 'any' }}
              {...register('longitude')}
              sx={fieldSx}
            />
          </Box>

          {/* Description */}
          <TextField
            fullWidth
            label="Description *"
            placeholder="Describe the place..."
            multiline
            rows={4}
            {...register('description', { required: 'Description is required' })}
            error={!!errors.description}
            helperText={errors.description?.message}
            sx={fieldSx}
          />

          {/* Image URL */}
          <TextField
            fullWidth
            label="Image URL"
            placeholder="https://example.com/image.jpg"
            {...register('image')}
            sx={fieldSx}
            helperText="Enter a valid image URL (optional)"
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <FaImage size={14} style={{ color: T.textFaint }} />
                  </InputAdornment>
                ),
              },
            }}
          />
        </Stack>

        {/* ═══════ Actions ═══════ */}
        <Stack
          direction="row"
          justifyContent="flex-end"
          spacing={1.5}
          sx={{
            mt: 3,
            pt: 2.5,
            borderTop: `1px solid ${T.border}`,
          }}
        >
          <Button
            type="button"
            onClick={() => navigate('/places')}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.82rem',
              color: T.textMuted,
              px: 2,
              py: 1,
              borderRadius: 2,
              border: `1px solid ${T.border}`,
              bgcolor: T.surface,
              '&:hover': {
                bgcolor: T.surfaceSoft,
                borderColor: T.borderStrong,
                color: T.textPrimary,
              },
            }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading}
            startIcon={
              loading ? (
                <CircularProgress size={14} sx={{ color: '#fff' }} />
              ) : (
                <FaSave size={12} />
              )
            }
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '0.82rem',
              bgcolor: T.indigo,
              color: '#fff',
              px: 2.5,
              py: 1,
              borderRadius: 2,
              boxShadow: 'none',
              '&:hover': { bgcolor: '#4f46e5' },
              '&.Mui-disabled': {
                bgcolor: T.indigo,
                opacity: 0.6,
                color: '#fff',
              },
            }}
          >
            {loading ? 'Creating...' : 'Create Place'}
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
};

export default PlaceCreate;