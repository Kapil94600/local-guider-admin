// src/pages/BookingDetails.jsx
import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchBookingById, clearSelected } from '../redux/slices/bookingSlice';
import {
  ArrowBack, Person, Place, Event, AttachMoney, Badge, Phone, Email,
  Notes, CheckCircle as VerifiedIcon, Schedule,
} from '@mui/icons-material';
import {
  Box, Paper, Typography, Button, Chip, Avatar, Stack,
  CircularProgress, Alert, Divider,
} from '@mui/material';
import {
  FaUser, FaMapMarkerAlt, FaCalendarAlt, FaRupeeSign, FaPhone,
  FaEnvelope, FaStickyNote, FaCamera, FaUserTie, FaKey,
} from 'react-icons/fa';

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

const STATUS_STYLES = {
  PENDING: { bg: T.amberSoft, color: '#b45309', label: 'Pending' },
  APPROVED: { bg: T.skySoft, color: '#0369a1', label: 'Approved' },
  REJECTED: { bg: T.roseSoft, color: '#be123c', label: 'Rejected' },
  COMPLETED: { bg: T.emeraldSoft, color: '#047857', label: 'Completed' },
  CANCELLED: { bg: '#f1f5f9', color: '#475569', label: 'Cancelled' },
};

// ═══════════════════════════════════════════════════════════════
// SECTION HEADER
// ═══════════════════════════════════════════════════════════════
const SectionHeader = ({ icon, title, subtitle, accent = T.indigo }) => (
  <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
    <Box
      sx={{
        width: 36,
        height: 36,
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
        <Typography sx={{ fontSize: '0.7rem', color: T.textFaint, mt: 0.2, fontWeight: 500 }}>
          {subtitle}
        </Typography>
      )}
    </Box>
  </Stack>
);

// ═══════════════════════════════════════════════════════════════
// INFO ROW
// ═══════════════════════════════════════════════════════════════
const InfoRow = ({ icon, label, value }) => (
  <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ py: 1 }}>
    <Box
      sx={{
        width: 32,
        height: 32,
        borderRadius: 1.5,
        bgcolor: T.surfaceSoft,
        color: T.textMuted,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        border: `1px solid ${T.border}`,
      }}
    >
      {icon}
    </Box>
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <Typography
        sx={{
          fontSize: '0.62rem',
          fontWeight: 700,
          color: T.textFaint,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </Typography>
      <Typography
        sx={{
          fontSize: '0.85rem',
          fontWeight: 600,
          color: T.textPrimary,
          mt: 0.2,
          wordBreak: 'break-word',
        }}
      >
        {value || 'N/A'}
      </Typography>
    </Box>
  </Stack>
);

// ═══════════════════════════════════════════════════════════════
// BOOKING DETAILS
// ═══════════════════════════════════════════════════════════════
const BookingDetails = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { selectedItem, loading, error } = useSelector((s) => s.bookings);

  useEffect(() => {
    dispatch(fetchBookingById(id));
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
        <Alert severity="warning" sx={{ borderRadius: 2 }}>
          Booking not found
        </Alert>
      </Box>
    );
  }

  const booking = selectedItem;
  const user = booking.User || {};
  const place = booking.place || {};
  const guiderPlan = booking.guiderPlan || {};
  const guider = guiderPlan.guider || {};
  const guiderUser = guider.User || {};
  const photographerPlan = booking.photographerPlan || {};
  const photographer = photographerPlan.photographer || {};
  const photographerUser = photographer.User || {};

  const statusStyle = STATUS_STYLES[booking.status] || STATUS_STYLES.PENDING;

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1100, mx: 'auto' }}>
      {/* Back */}
      <Button
        onClick={() => navigate('/bookings')}
        startIcon={<ArrowBack sx={{ fontSize: 14 }} />}
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
        Back to Bookings
      </Button>

      {/* ═══ Header Card ═══ */}
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
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', md: 'center' }}
          spacing={2}
        >
          <Stack direction="row" alignItems="center" spacing={2}>
            <Avatar
              sx={{
                width: 56,
                height: 56,
                background: `linear-gradient(135deg, ${T.indigo}, ${T.violet})`,
                color: '#fff',
                fontWeight: 800,
                fontSize: '1.25rem',
                border: '3px solid #fff',
                boxShadow: `0 6px 16px -4px ${T.indigo}55`,
              }}
            >
              <Badge sx={{ fontSize: 24 }} />
            </Avatar>
            <Box>
              <Typography
                sx={{
                  fontFamily: T.fontDisplay,
                  fontWeight: 800,
                  fontSize: '1.35rem',
                  color: T.textPrimary,
                  letterSpacing: '-0.02em',
                }}
              >
                Booking #{booking.id?.slice(0, 8)}
              </Typography>
              <Typography
                sx={{
                  fontSize: '0.72rem',
                  color: T.textMuted,
                  mt: 0.3,
                  fontWeight: 500,
                }}
              >
                Created: {new Date(booking.createdAt).toLocaleString('en-IN')}
              </Typography>
            </Box>
          </Stack>

          <Chip
            label={statusStyle.label}
            sx={{
              bgcolor: statusStyle.bg,
              color: statusStyle.color,
              fontWeight: 700,
              fontSize: '0.78rem',
              height: 32,
              borderRadius: 999,
              px: 1,
            }}
          />
        </Stack>
      </Paper>

      {/* ═══ Grid ═══ */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
          gap: 2.5,
        }}
      >
        {/* Customer Details */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: T.radius,
            border: `1px solid ${T.border}`,
            bgcolor: T.surface,
          }}
        >
          <SectionHeader
            icon={<FaUser size={14} />}
            title="Customer Details"
            subtitle="Who booked this trip"
            accent={T.indigo}
          />
          <InfoRow
            icon={<FaUser size={12} />}
            label="Name"
            value={`${user.firstName || ''} ${user.lastName || ''}`.trim()}
          />
          <InfoRow icon={<FaPhone size={12} />} label="Phone" value={user.phone} />
          <InfoRow icon={<FaEnvelope size={12} />} label="Email" value={user.email} />
        </Paper>

        {/* Booking Info */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: T.radius,
            border: `1px solid ${T.border}`,
            bgcolor: T.surface,
          }}
        >
          <SectionHeader
            icon={<FaCalendarAlt size={14} />}
            title="Booking Information"
            subtitle="Details of the booking"
            accent={T.emerald}
          />
          <InfoRow
            icon={<FaMapMarkerAlt size={12} />}
            label="Place"
            value={place.name}
          />
          <InfoRow
            icon={<FaCalendarAlt size={12} />}
            label="Booking Date"
            value={new Date(booking.bookingDate).toLocaleString('en-IN')}
          />
          <InfoRow
            icon={<FaRupeeSign size={12} />}
            label="Amount"
            value={`₹${booking.totalAmount || 0}`}
          />
          {booking.notes && (
            <InfoRow icon={<FaStickyNote size={12} />} label="Notes" value={booking.notes} />
          )}
        </Paper>

        {/* Guider Details */}
        {booking.guiderPlanId && (
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: T.radius,
              border: `1px solid ${T.border}`,
              bgcolor: T.surface,
            }}
          >
            <SectionHeader
              icon={<FaUserTie size={14} />}
              title="Guider Details"
              subtitle="Assigned tour guide"
              accent={T.violet}
            />
            <InfoRow
              icon={<FaUser size={12} />}
              label="Name"
              value={guider.fullName || guiderUser.firstName}
            />
            <InfoRow icon={<FaPhone size={12} />} label="Phone" value={guiderUser.phone} />
            <InfoRow
              icon={<FaEnvelope size={12} />}
              label="Email"
              value={guiderUser.email}
            />
            <InfoRow
              icon={<FaRupeeSign size={12} />}
              label="Plan Price"
              value={guiderPlan.price ? `₹${guiderPlan.price}` : null}
            />
          </Paper>
        )}

        {/* Photographer Details */}
        {booking.photographerPlanId && (
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: T.radius,
              border: `1px solid ${T.border}`,
              bgcolor: T.surface,
            }}
          >
            <SectionHeader
              icon={<FaCamera size={14} />}
              title="Photographer Details"
              subtitle="Assigned photographer"
              accent={T.rose}
            />
            <InfoRow
              icon={<FaUser size={12} />}
              label="Name"
              value={photographer.fullName || photographerUser.firstName}
            />
            <InfoRow
              icon={<FaPhone size={12} />}
              label="Phone"
              value={photographerUser.phone}
            />
            <InfoRow
              icon={<FaEnvelope size={12} />}
              label="Email"
              value={photographerUser.email}
            />
            <InfoRow
              icon={<FaRupeeSign size={12} />}
              label="Plan Price"
              value={photographerPlan.price ? `₹${photographerPlan.price}` : null}
            />
          </Paper>
        )}

        {/* OTP Info */}
        {booking.completionOtp && (
          <Box sx={{ gridColumn: { xs: 'span 1', md: 'span 2' } }}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: T.radius,
                border: `1px solid ${T.amber}44`,
                bgcolor: T.amberSoft,
              }}
            >
              <SectionHeader
                icon={<FaKey size={14} />}
                title="Completion OTP"
                subtitle="Used to verify trip completion"
                accent={T.amber}
              />
              <Stack direction="row" spacing={3} sx={{ flexWrap: 'wrap', gap: 2 }}>
                <Box>
                  <Typography
                    sx={{
                      fontSize: '0.62rem',
                      fontWeight: 700,
                      color: '#92400e',
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                    }}
                  >
                    OTP
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: '1.5rem',
                      fontWeight: 800,
                      color: '#b45309',
                      fontFamily: 'monospace',
                      letterSpacing: '0.1em',
                      mt: 0.5,
                    }}
                  >
                    {booking.completionOtp}
                  </Typography>
                </Box>
                <Box>
                  <Typography
                    sx={{
                      fontSize: '0.62rem',
                      fontWeight: 700,
                      color: '#92400e',
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                    }}
                  >
                    Expires
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      color: '#b45309',
                      mt: 0.5,
                    }}
                  >
                    {booking.completionOtpExpiresAt
                      ? new Date(booking.completionOtpExpiresAt).toLocaleString('en-IN')
                      : 'N/A'}
                  </Typography>
                </Box>
                <Box>
                  <Typography
                    sx={{
                      fontSize: '0.62rem',
                      fontWeight: 700,
                      color: '#92400e',
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                    }}
                  >
                    Status
                  </Typography>
                  <Chip
                    icon={booking.completionOtpVerified ? <VerifiedIcon sx={{ fontSize: 14 }} /> : undefined}
                    label={booking.completionOtpVerified ? 'Verified' : 'Not Verified'}
                    size="small"
                    sx={{
                      mt: 0.5,
                      bgcolor: booking.completionOtpVerified ? T.emeraldSoft : '#fff',
                      color: booking.completionOtpVerified ? '#047857' : '#b45309',
                      fontWeight: 700,
                      fontSize: '0.65rem',
                      height: 24,
                      borderRadius: 999,
                      '& .MuiChip-icon': {
                        color: '#047857',
                      },
                    }}
                  />
                </Box>
              </Stack>
            </Paper>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default BookingDetails;