// src/pages/PlaceDetails.jsx
import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPlaceById, clearSelected } from '../redux/slices/placeSlice';
import {
  FaArrowLeft, FaStar, FaMapMarkerAlt, FaClock, FaGlobe,
  FaTags, FaAlignLeft, FaCheckCircle, FaTimesCircle,
} from 'react-icons/fa';
import {
  Box, Paper, Typography, Chip, Button, Stack, CircularProgress,
  Alert, Divider,
} from '@mui/material';
import {
  getImageUrlGeneric,
  getFallbackPlaceholder,
} from '../utils/imageFallback';

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

const CATEGORY_STYLES = {
  historical: { bg: '#fef3c7', color: '#b45309' },
  nature: { bg: '#d1fae5', color: '#047857' },
  beach: { bg: '#e0f2fe', color: '#0369a1' },
  adventure: { bg: '#fee2e2', color: '#be123c' },
  religious: { bg: '#ede9fe', color: '#6d28d9' },
  cultural: { bg: '#fce7f3', color: '#be185d' },
  other: { bg: '#f1f5f9', color: '#475569' },
};

// ═══════════════════════════════════════════════════════════════
// SECTION HEADER
// ═══════════════════════════════════════════════════════════════
const SectionHeader = ({ title, subtitle, accent = T.indigo }) => (
  <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
    <Box sx={{ width: 4, height: 22, borderRadius: 1, bgcolor: accent }} />
    <Box>
      <Typography
        sx={{
          fontFamily: T.fontDisplay,
          fontWeight: 700,
          fontSize: '0.95rem',
          color: T.textPrimary,
        }}
      >
        {title}
      </Typography>
      {subtitle && (
        <Typography
          sx={{
            fontSize: '0.7rem',
            color: T.textFaint,
            mt: 0.2,
            fontWeight: 500,
          }}
        >
          {subtitle}
        </Typography>
      )}
    </Box>
  </Stack>
);

// ═══════════════════════════════════════════════════════════════
// DETAIL ITEM
// ═══════════════════════════════════════════════════════════════
const DetailItem = ({ icon, label, value, accent = T.indigo }) => (
  <Paper
    elevation={0}
    sx={{
      display: 'flex',
      alignItems: 'center',
      gap: 1.5,
      p: 1.75,
      borderRadius: 2,
      bgcolor: T.surface,
      border: `1px solid ${T.border}`,
      transition: 'all 0.2s ease',
      '&:hover': {
        borderColor: T.borderStrong,
        transform: 'translateY(-1px)',
        boxShadow: '0 4px 12px -8px rgba(15,23,42,0.1)',
      },
    }}
  >
    <Box
      sx={{
        width: 38,
        height: 38,
        borderRadius: 2,
        bgcolor: `${accent}12`,
        color: accent,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      {icon}
    </Box>
    <Box sx={{ minWidth: 0, flex: 1 }}>
      <Typography
        sx={{
          fontSize: '0.65rem',
          fontWeight: 700,
          color: T.textFaint,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          mb: 0.2,
        }}
      >
        {label}
      </Typography>
      <Typography
        sx={{
          fontSize: '0.85rem',
          fontWeight: 600,
          color: T.textPrimary,
          lineHeight: 1.3,
        }}
      >
        {value || 'N/A'}
      </Typography>
    </Box>
  </Paper>
);

// ═══════════════════════════════════════════════════════════════
// PLACE DETAILS
// ═══════════════════════════════════════════════════════════════
const PlaceDetails = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { selectedItem, loading, error } = useSelector((state) => state.places);

  useEffect(() => {
    dispatch(fetchPlaceById(id));
    return () => dispatch(clearSelected());
  }, [dispatch, id]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress size={32} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <Alert severity="error" sx={{ borderRadius: 2 }}>
          {error}
        </Alert>
      </Box>
    );
  }

  if (!selectedItem) {
    return (
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <Alert severity="error" sx={{ borderRadius: 2 }}>
          Place not found
        </Alert>
      </Box>
    );
  }

  const place = selectedItem;
  const imageUrl = getImageUrlGeneric(place.image, place.name || 'Place');
  const fallback = getFallbackPlaceholder(place.name || 'Place');
  const catStyle = CATEGORY_STYLES[(place.category || '').toLowerCase()] || CATEGORY_STYLES.other;
  const fullAddress = [place.address, place.city, place.state, place.country]
    .filter(Boolean)
    .join(', ');

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1100, mx: 'auto' }}>
      {/* ═══════ Back button ═══════ */}
      <Button
        onClick={() => navigate(-1)}
        startIcon={<FaArrowLeft size={12} />}
        sx={{
          mb: 3,
          textTransform: 'none',
          fontWeight: 700,
          fontSize: '0.78rem',
          color: T.textMuted,
          px: 1.5,
          py: 0.75,
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
        Back
      </Button>

      {/* ═══════ Header Card ═══════ */}
      <Paper
        elevation={0}
        sx={{
          position: 'relative',
          p: 3,
          borderRadius: T.radius,
          border: `1px solid ${T.border}`,
          bgcolor: T.surface,
          mb: 2.5,
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            background: `linear-gradient(135deg, ${T.indigo}, ${T.violet})`,
          },
        }}
      >
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={3}
          alignItems={{ md: 'center' }}
        >
          <Box
            component="img"
            src={imageUrl}
            alt={place.name}
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = fallback;
            }}
            sx={{
              width: 120,
              height: 120,
              borderRadius: 3,
              objectFit: 'cover',
              border: `4px solid #fff`,
              boxShadow: `0 8px 20px -6px ${T.indigo}55`,
              flexShrink: 0,
            }}
          />

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              sx={{
                fontFamily: T.fontDisplay,
                fontWeight: 800,
                fontSize: { xs: '1.35rem', md: '1.6rem' },
                color: T.textPrimary,
                letterSpacing: '-0.02em',
                lineHeight: 1.2,
                mb: 0.5,
              }}
            >
              {place.name}
            </Typography>

            <Stack
              direction="row"
              alignItems="center"
              spacing={0.75}
              sx={{ mb: 1.5 }}
            >
              <FaMapMarkerAlt size={12} style={{ color: T.textFaint }} />
              <Typography sx={{ fontSize: '0.82rem', color: T.textMuted, fontWeight: 500 }}>
                {[place.city, place.state, place.country].filter(Boolean).join(', ') || 'Location not set'}
              </Typography>
            </Stack>

            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 0.75 }}>
              <Chip
                label={
                  place.category
                    ? place.category.charAt(0).toUpperCase() + place.category.slice(1)
                    : 'Uncategorized'
                }
                size="small"
                sx={{
                  bgcolor: catStyle.bg,
                  color: catStyle.color,
                  fontWeight: 700,
                  fontSize: '0.65rem',
                  height: 22,
                  borderRadius: 999,
                }}
              />
              <Chip
                icon={<FaStar size={10} />}
                label={`${place.rating || 0} rating`}
                size="small"
                sx={{
                  bgcolor: T.amberSoft,
                  color: '#b45309',
                  fontWeight: 700,
                  fontSize: '0.65rem',
                  height: 22,
                  borderRadius: 999,
                  '& .MuiChip-icon': { color: '#b45309', fontSize: 10 },
                }}
              />
              <Chip
                icon={place.isActive ? <FaCheckCircle size={10} /> : <FaTimesCircle size={10} />}
                label={place.isActive ? 'Active' : 'Inactive'}
                size="small"
                sx={{
                  bgcolor: place.isActive ? T.emeraldSoft : T.roseSoft,
                  color: place.isActive ? '#047857' : '#be123c',
                  fontWeight: 700,
                  fontSize: '0.65rem',
                  height: 22,
                  borderRadius: 999,
                  '& .MuiChip-icon': {
                    color: place.isActive ? '#047857' : '#be123c',
                    fontSize: 10,
                  },
                }}
              />
              {place.isFeatured && (
                <Chip
                  label="Featured"
                  size="small"
                  sx={{
                    bgcolor: T.violetSoft,
                    color: T.violet,
                    fontWeight: 700,
                    fontSize: '0.65rem',
                    height: 22,
                    borderRadius: 999,
                  }}
                />
              )}
            </Stack>
          </Box>
        </Stack>
      </Paper>

      {/* ═══════ About ═══════ */}
      {place.description && (
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: T.radius,
            border: `1px solid ${T.border}`,
            bgcolor: T.surface,
            mb: 2.5,
          }}
        >
          <SectionHeader
            title="About"
            subtitle="Place description"
            accent={T.violet}
          />
          <Stack direction="row" spacing={1.5} sx={{ mb: 1.5 }}>
            <FaAlignLeft size={14} style={{ color: T.textFaint, marginTop: 4 }} />
            <Typography
              sx={{
                fontSize: '0.85rem',
                color: T.textPrimary,
                lineHeight: 1.7,
                fontWeight: 500,
              }}
            >
              {place.description}
            </Typography>
          </Stack>
        </Paper>
      )}

      {/* ═══════ Location & Details ═══════ */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: T.radius,
          border: `1px solid ${T.border}`,
          bgcolor: T.surface,
          mb: 2.5,
        }}
      >
        <SectionHeader
          title="Location & Details"
          subtitle="Address, timings and coordinates"
          accent={T.indigo}
        />
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: '1fr 1fr',
              md: 'repeat(3, 1fr)',
            },
            gap: 2,
          }}
        >
          <Box sx={{ gridColumn: { xs: 'span 1', sm: 'span 2', md: 'span 3' } }}>
            <DetailItem
              icon={<FaMapMarkerAlt size={14} />}
              label="Full Address"
              value={fullAddress}
              accent={T.rose}
            />
          </Box>
          <DetailItem
            icon={<FaTags size={14} />}
            label="Category"
            value={place.category}
            accent={T.violet}
          />
          <DetailItem
            icon={<FaStar size={14} />}
            label="Rating"
            value={place.rating || 0}
            accent={T.amber}
          />
          <DetailItem
            icon={<FaGlobe size={14} />}
            label="Coordinates"
            value={
              place.latitude && place.longitude
                ? `${place.latitude}, ${place.longitude}`
                : null
            }
            accent={T.sky}
          />
          <DetailItem
            icon={<FaClock size={14} />}
            label="Opening Time"
            value={place.openingTime}
            accent={T.emerald}
          />
          <DetailItem
            icon={<FaClock size={14} />}
            label="Closing Time"
            value={place.closingTime}
            accent={T.emerald}
          />
        </Box>
      </Paper>
    </Box>
  );
};

export default PlaceDetails;