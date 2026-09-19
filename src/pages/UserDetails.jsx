// src/pages/UserDetails.jsx
import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUserById, clearSelected } from '../redux/slices/userSlice';
import {
  Box, Paper, Typography, Avatar, Chip, Stack, Divider,
  CircularProgress, Alert, Button,
} from '@mui/material';
import {
  FaArrowLeft, FaEnvelope, FaPhone, FaCalendarAlt,
  FaMapMarkerAlt, FaGlobe, FaUserCog, FaWallet,
  FaCheckCircle, FaTimesCircle,
} from 'react-icons/fa';
import { getImageUrl, getFallbackAvatar, getDisplayName } from '../utils/imageFallback';

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

const getFullName = (user) => {
  if (user.fullName) return user.fullName;
  if (user.firstName && user.lastName) return `${user.firstName} ${user.lastName}`;
  if (user.name) return user.name;
  return 'User';
};

// ═══════════════════════════════════════════════════════════════
// DETAIL ITEM
// ═══════════════════════════════════════════════════════════════
const DetailItem = ({ icon, label, value, accent = T.sky }) => (
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
        noWrap
      >
        {value || 'N/A'}
      </Typography>
    </Box>
  </Paper>
);

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
          lineHeight: 1.3,
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
// USER DETAILS
// ═══════════════════════════════════════════════════════════════
const UserDetails = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { selectedItem, loading, error } = useSelector((state) => state.users);

  useEffect(() => {
    dispatch(fetchUserById(id));
    return () => dispatch(clearSelected());
  }, [dispatch, id]);

  if (loading)
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress size={32} />
      </Box>
    );

  if (error)
    return (
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <Alert severity="error" sx={{ borderRadius: 2 }}>
          {error}
        </Alert>
      </Box>
    );

  if (!selectedItem)
    return (
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <Alert severity="error" sx={{ borderRadius: 2 }}>
          User not found
        </Alert>
      </Box>
    );

  const displayName = getDisplayName(selectedItem);
  const fallback = getFallbackAvatar(displayName);
  const imageUrl = getImageUrl(
    selectedItem.profileImage || selectedItem.avatar,
    displayName
  );
  const fullName = getFullName(selectedItem);

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

      {/* ═══════ Header card ═══════ */}
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
          <Box sx={{ position: 'relative' }}>
            <Avatar
              src={imageUrl}
              alt={displayName}
              sx={{
                width: 96,
                height: 96,
                border: '4px solid #fff',
                background: `linear-gradient(135deg, ${T.indigo}, ${T.violet})`,
                color: '#fff',
                fontSize: 32,
                fontWeight: 700,
                boxShadow: `0 8px 20px -6px ${T.indigo}55`,
              }}
              slotProps={{
                img: {
                  onError: (e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = fallback;
                  },
                },
              }}
            >
              {(displayName[0] || 'U').toUpperCase()}
            </Avatar>
            <Box
              sx={{
                position: 'absolute',
                bottom: 2,
                right: 2,
                width: 18,
                height: 18,
                borderRadius: '50%',
                bgcolor: selectedItem.isActive ? T.emerald : T.rose,
                border: '3px solid #fff',
              }}
            />
          </Box>

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              sx={{
                fontFamily: T.fontDisplay,
                fontWeight: 800,
                fontSize: { xs: '1.35rem', md: '1.5rem' },
                color: T.textPrimary,
                letterSpacing: '-0.02em',
                lineHeight: 1.2,
                mb: 0.5,
              }}
            >
              {fullName}
            </Typography>

            <Stack direction="row" spacing={2} sx={{ mt: 1, flexWrap: 'wrap', gap: 1 }}>
              <Stack direction="row" alignItems="center" spacing={0.75}>
                <FaEnvelope size={12} style={{ color: T.textFaint }} />
                <Typography sx={{ fontSize: '0.8rem', color: T.textMuted, fontWeight: 500 }}>
                  {selectedItem.email || 'N/A'}
                </Typography>
              </Stack>
              <Stack direction="row" alignItems="center" spacing={0.75}>
                <FaPhone size={12} style={{ color: T.textFaint }} />
                <Typography sx={{ fontSize: '0.8rem', color: T.textMuted, fontWeight: 500 }}>
                  {selectedItem.phone || 'N/A'}
                </Typography>
              </Stack>
            </Stack>

            <Stack direction="row" spacing={1} sx={{ mt: 1.75, flexWrap: 'wrap', gap: 0.75 }}>
              <Chip
                label={selectedItem.role || 'USER'}
                size="small"
                sx={{
                  bgcolor: T.indigoSoft,
                  color: T.indigo,
                  fontWeight: 700,
                  fontSize: '0.65rem',
                  height: 22,
                  borderRadius: 999,
                }}
              />
              <Chip
                label={selectedItem.isActive ? 'Active' : 'Inactive'}
                size="small"
                sx={{
                  bgcolor: selectedItem.isActive ? T.emeraldSoft : T.roseSoft,
                  color: selectedItem.isActive ? '#059669' : '#be123c',
                  fontWeight: 700,
                  fontSize: '0.65rem',
                  height: 22,
                  borderRadius: 999,
                }}
              />
              {selectedItem.isVerified && (
                <Chip
                  icon={<FaCheckCircle size={10} />}
                  label="Verified"
                  size="small"
                  sx={{
                    bgcolor: T.skySoft,
                    color: T.sky,
                    fontWeight: 700,
                    fontSize: '0.65rem',
                    height: 22,
                    borderRadius: 999,
                    '& .MuiChip-icon': { color: T.sky, fontSize: 10 },
                  }}
                />
              )}
            </Stack>
          </Box>
        </Stack>
      </Paper>

      {/* ═══════ Personal info ═══════ */}
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
        <SectionHeader title="Personal Information" subtitle="Basic profile details" accent={T.indigo} />
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(3, 1fr)' },
            gap: 2,
          }}
        >
          <DetailItem
            icon={<FaUserCog size={14} />}
            label="Role"
            value={selectedItem.role}
            accent={T.indigo}
          />
          <DetailItem
            icon={selectedItem.emailVerifiedAt ? <FaCheckCircle size={14} /> : <FaTimesCircle size={14} />}
            label="Email Verified"
            value={
              selectedItem.emailVerifiedAt
                ? new Date(selectedItem.emailVerifiedAt).toLocaleDateString('en-IN')
                : 'Not verified'
            }
            accent={selectedItem.emailVerifiedAt ? T.emerald : T.rose}
          />
          <DetailItem
            icon={<FaCalendarAlt size={14} />}
            label="Date of Birth"
            value={
              selectedItem.dob
                ? new Date(selectedItem.dob).toLocaleDateString('en-IN')
                : null
            }
            accent={T.violet}
          />
          <DetailItem
            icon={<FaGlobe size={14} />}
            label="Language"
            value={selectedItem.language || 'en'}
            accent={T.sky}
          />
          <DetailItem
            icon={<FaWallet size={14} />}
            label="Wallet Balance"
            value={`₹${selectedItem.wallet || 0}`}
            accent={T.emerald}
          />
          <DetailItem
            icon={<FaCalendarAlt size={14} />}
            label="Last Login"
            value={
              selectedItem.lastLoginAt
                ? new Date(selectedItem.lastLoginAt).toLocaleString('en-IN')
                : null
            }
            accent={T.amber}
          />
        </Box>
      </Paper>

      {/* ═══════ Location ═══════ */}
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
        <SectionHeader title="Location" subtitle="Where the user is based" accent={T.violet} />
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(3, 1fr)' },
            gap: 2,
          }}
        >
          <DetailItem
            icon={<FaMapMarkerAlt size={14} />}
            label="Country"
            value={selectedItem.country}
            accent={T.violet}
          />
          <DetailItem
            icon={<FaMapMarkerAlt size={14} />}
            label="State"
            value={selectedItem.state}
            accent={T.violet}
          />
          <DetailItem
            icon={<FaMapMarkerAlt size={14} />}
            label="City"
            value={selectedItem.city}
            accent={T.violet}
          />
        </Box>
      </Paper>

      {/* ═══════ Account ═══════ */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: T.radius,
          border: `1px solid ${T.border}`,
          bgcolor: T.surface,
        }}
      >
        <SectionHeader title="Account Details" subtitle="Registration info" accent={T.emerald} />
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
            gap: 2,
          }}
        >
          <DetailItem
            icon={<FaCalendarAlt size={14} />}
            label="Joined On"
            value={
              selectedItem.createdAt
                ? new Date(selectedItem.createdAt).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                  })
                : null
            }
            accent={T.emerald}
          />
          <DetailItem
            icon={<FaUserCog size={14} />}
            label="Account Status"
            value={selectedItem.accountStatus || 'ACTIVE'}
            accent={T.sky}
          />
        </Box>
      </Paper>
    </Box>
  );
};

export default UserDetails;