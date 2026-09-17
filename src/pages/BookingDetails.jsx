import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchBookingById, clearSelected } from '../redux/slices/bookingSlice';
import {
  Box, Paper, Typography, Button, Chip, Avatar, Stack,
  CircularProgress, Grid, Alert,
} from '@mui/material';
import {
  ArrowBack, Person, Place, Event, AttachMoney, Badge, Phone, Email, Notes,
} from '@mui/icons-material'; // ✅ Correct icons
import { COLORS } from '../theme/dashboardTheme';

const BookingDetails = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { selectedItem, loading, error } = useSelector((state) => state.bookings);

  useEffect(() => {
    dispatch(fetchBookingById(id));
    return () => dispatch(clearSelected());
  }, [dispatch, id]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error" sx={{ m: 3 }}>{error}</Alert>;
  }

  if (!selectedItem) {
    return <Alert severity="warning" sx={{ m: 3 }}>Booking not found</Alert>;
  }

  const booking = selectedItem;

  // Extract data safely
  const user = booking.User || {};
  const place = booking.place || {};
  const guiderPlan = booking.guiderPlan || {};
  const guider = guiderPlan.guider || {};
  const guiderUser = guider.User || {};
  const photographerPlan = booking.photographerPlan || {};
  const photographer = photographerPlan.photographer || {};
  const photographerUser = photographer.User || {};

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING': return '#F59E0B';
      case 'APPROVED': return '#3B82F6';
      case 'REJECTED': return '#EF4444';
      case 'COMPLETED': return '#10B981';
      case 'CANCELLED': return '#FF6B6B';
      default: return '#6B7280';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Button
        variant="outlined"
        startIcon={<ArrowBack />}
        onClick={() => navigate('/bookings')}
        sx={{ mb: 3 }}
      >
        Back to Bookings
      </Button>

      {/* Header Card */}
      <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid #E2E8F0', bgcolor: 'white', mb: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Avatar sx={{ bgcolor: '#1E3A6E', width: 50, height: 50 }}>
              <Badge />
            </Avatar>
            <Box>
              <Typography variant="h5" fontWeight={700} color="#1E3A6E">
                Booking #{booking.id?.slice(0, 8)}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Created: {new Date(booking.createdAt).toLocaleString()}
              </Typography>
            </Box>
          </Stack>
          <Chip
            label={booking.status}
            size="medium"
            sx={{
              bgcolor: `${getStatusColor(booking.status)}20`,
              color: getStatusColor(booking.status),
              fontWeight: 700,
              fontSize: '1rem',
              px: 2,
              py: 1,
            }}
          />
        </Stack>
      </Paper>

      <Grid container spacing={3}>
        {/* Customer Details */}
        <Grid item xs={12} md={6}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid #E2E8F0', bgcolor: 'white', height: '100%' }}>
            <Typography variant="h6" fontWeight={700} color="#1E3A6E" sx={{ mb: 2 }}>
              <Person sx={{ mr: 1, verticalAlign: 'middle' }} /> Customer Details
            </Typography>
            <Stack spacing={2}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Person sx={{ color: '#64748B' }} />
                <Typography variant="body1">
                  <strong>Name:</strong> {user.firstName} {user.lastName || ''}
                </Typography>
              </Stack>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Phone sx={{ color: '#64748B' }} />
                <Typography variant="body1">
                  <strong>Phone:</strong> {user.phone || 'N/A'}
                </Typography>
              </Stack>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Email sx={{ color: '#64748B' }} />
                <Typography variant="body1">
                  <strong>Email:</strong> {user.email || 'N/A'}
                </Typography>
              </Stack>
            </Stack>
          </Paper>
        </Grid>

        {/* Booking Info */}
        <Grid item xs={12} md={6}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid #E2E8F0', bgcolor: 'white', height: '100%' }}>
            <Typography variant="h6" fontWeight={700} color="#1E3A6E" sx={{ mb: 2 }}>
              <Event sx={{ mr: 1, verticalAlign: 'middle' }} /> Booking Information
            </Typography>
            <Stack spacing={2}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Place sx={{ color: '#64748B' }} />
                <Typography variant="body1">
                  <strong>Place:</strong> {place.name || 'N/A'}
                </Typography>
              </Stack>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Event sx={{ color: '#64748B' }} />
                <Typography variant="body1">
                  <strong>Date:</strong> {new Date(booking.bookingDate).toLocaleString()}
                </Typography>
              </Stack>
              <Stack direction="row" alignItems="center" spacing={1}>
                <AttachMoney sx={{ color: '#64748B' }} />
                <Typography variant="body1">
                  <strong>Amount:</strong> ₹{booking.totalAmount || 0}
                </Typography>
              </Stack>
              {booking.notes && (
                <Stack direction="row" alignItems="flex-start" spacing={1}>
                  <Notes sx={{ color: '#64748B' }} />
                  <Typography variant="body1">
                    <strong>Notes:</strong> {booking.notes}
                  </Typography>
                </Stack>
              )}
            </Stack>
          </Paper>
        </Grid>

        {/* Guider Details */}
        {booking.guiderPlanId && (
          <Grid item xs={12} md={6}>
            <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid #E2E8F0', bgcolor: 'white', height: '100%' }}>
              <Typography variant="h6" fontWeight={700} color="#1E3A6E" sx={{ mb: 2 }}>
                👤 Guider Details
              </Typography>
              <Stack spacing={2}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Person sx={{ color: '#64748B' }} />
                  <Typography variant="body1">
                    <strong>Name:</strong> {guider.fullName || guiderUser.firstName || 'N/A'}
                  </Typography>
                </Stack>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Phone sx={{ color: '#64748B' }} />
                  <Typography variant="body1">
                    <strong>Phone:</strong> {guiderUser.phone || 'N/A'}
                  </Typography>
                </Stack>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Email sx={{ color: '#64748B' }} />
                  <Typography variant="body1">
                    <strong>Email:</strong> {guiderUser.email || 'N/A'}
                  </Typography>
                </Stack>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <AttachMoney sx={{ color: '#64748B' }} />
                  <Typography variant="body1">
                    <strong>Plan Price:</strong> ₹{guiderPlan.price || 'N/A'}
                  </Typography>
                </Stack>
              </Stack>
            </Paper>
          </Grid>
        )}

        {/* Photographer Details */}
        {booking.photographerPlanId && (
          <Grid item xs={12} md={6}>
            <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid #E2E8F0', bgcolor: 'white', height: '100%' }}>
              <Typography variant="h6" fontWeight={700} color="#1E3A6E" sx={{ mb: 2 }}>
                📸 Photographer Details
              </Typography>
              <Stack spacing={2}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Person sx={{ color: '#64748B' }} />
                  <Typography variant="body1">
                    <strong>Name:</strong> {photographer.fullName || photographerUser.firstName || 'N/A'}
                  </Typography>
                </Stack>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Phone sx={{ color: '#64748B' }} />
                  <Typography variant="body1">
                    <strong>Phone:</strong> {photographerUser.phone || 'N/A'}
                  </Typography>
                </Stack>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Email sx={{ color: '#64748B' }} />
                  <Typography variant="body1">
                    <strong>Email:</strong> {photographerUser.email || 'N/A'}
                  </Typography>
                </Stack>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <AttachMoney sx={{ color: '#64748B' }} />
                  <Typography variant="body1">
                    <strong>Plan Price:</strong> ₹{photographerPlan.price || 'N/A'}
                  </Typography>
                </Stack>
              </Stack>
            </Paper>
          </Grid>
        )}

        {/* Completion OTP Info */}
        {booking.completionOtp && (
          <Grid item xs={12}>
            <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid #E2E8F0', bgcolor: '#FEF3C7' }}>
              <Typography variant="h6" fontWeight={700} color="#B45309" sx={{ mb: 1 }}>
                🔑 Completion OTP
              </Typography>
              <Typography variant="body1">
                <strong>OTP:</strong> {booking.completionOtp}
              </Typography>
              <Typography variant="body2" color="#92400E" sx={{ mt: 1 }}>
                Expires: {booking.completionOtpExpiresAt ? new Date(booking.completionOtpExpiresAt).toLocaleString() : 'N/A'}
              </Typography>
              {booking.completionOtpVerified && (
                <Chip label="✅ Verified" color="success" size="small" sx={{ mt: 1 }} />
              )}
            </Paper>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default BookingDetails;