import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUserById, clearSelected } from '../redux/slices/userSlice';
import {
  Box, Paper, Typography, Avatar, Chip, Grid, Divider, Stack, CircularProgress, Alert, Button,
} from '@mui/material';
import { FaArrowLeft, FaEnvelope, FaPhone, FaCalendarAlt, FaMapMarkerAlt, FaGlobe, FaUserCog, FaWallet } from 'react-icons/fa';
import { COLORS, FONT_DISPLAY, FONT_MONO } from '../theme/dashboardTheme';

// ✅ Helper: Relative URL ko absolute banao
const getImageUrl = (path) => {
  if (!path) return 'https://via.placeholder.com/100/1E3A6E/FFFFFF?text=User';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://local-guider-backend.onrender.com/api/v1';
  const baseUrl = API_BASE_URL.replace('/api/v1', '');
  return `${baseUrl}${path.startsWith('/') ? path : '/' + path}`;
};

// ✅ Helper: Full Name
const getFullName = (user) => {
  if (user.fullName) return user.fullName;
  if (user.firstName && user.lastName) return `${user.firstName} ${user.lastName}`;
  if (user.name) return user.name;
  return 'User';
};

const DetailItem = ({ icon, label, value }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, borderRadius: 2, bgcolor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
    <Box sx={{ width: 36, height: 36, borderRadius: '50%', bgcolor: COLORS.skySoft, display: 'flex', alignItems: 'center', justifyContent: 'center', color: COLORS.sky }}>
      {icon}
    </Box>
    <Box>
      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, display: 'block' }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.primary' }}>
        {value || 'N/A'}
      </Typography>
    </Box>
  </Box>
);

const UserDetails = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { selectedItem, loading, error } = useSelector((state) => state.users);

  useEffect(() => {
    dispatch(fetchUserById(id));
    return () => dispatch(clearSelected());
  }, [dispatch, id]);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}><CircularProgress /></Box>;
  if (error) return <Alert severity="error" sx={{ m: 3 }}>{error}</Alert>;
  if (!selectedItem) return <Alert severity="error" sx={{ m: 3 }}>User not found</Alert>;

  const imageUrl = getImageUrl(selectedItem.profileImage || selectedItem.avatar);
  const fullName = getFullName(selectedItem);
  const statusColor = selectedItem.isActive ? 'success' : 'error';
  const statusLabel = selectedItem.isActive ? 'Active' : 'Inactive';

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Back Button */}
      <Button variant="outlined" startIcon={<FaArrowLeft />} onClick={() => navigate(-1)} sx={{ mb: 3 }}>
        Back
      </Button>

      {/* Header Card */}
      <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid #E2E8F0', bgcolor: 'white', mb: 3, background: 'linear-gradient(135deg, #F8FAFC 0%, #ffffff 100%)' }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems={{ md: 'center' }}>
          <Avatar src={imageUrl} alt={fullName} sx={{ width: 100, height: 100, border: '4px solid #E2E8F0', bgcolor: '#1E3A6E', color: '#fff', fontSize: 36, fontWeight: 'bold' }}>
            {!imageUrl && fullName.charAt(0).toUpperCase()}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h4" sx={{ fontFamily: FONT_DISPLAY, fontWeight: 700, color: 'text.primary' }}>
              {fullName}
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 1 }}>
              <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
                <FaEnvelope size={14} /> {selectedItem.email || 'N/A'}
              </Typography>
              <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
                <FaPhone size={14} /> {selectedItem.phone || 'N/A'}
              </Typography>
            </Stack>
            <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
              <Chip label={selectedItem.role || 'USER'} size="small" color="primary" variant="outlined" />
              <Chip label={statusLabel} size="small" color={statusColor} />
              <Chip label={selectedItem.accountStatus || 'ACTIVE'} size="small" variant="outlined" />
              {selectedItem.isVerified && <Chip label="Verified" size="small" color="success" />}
            </Stack>
          </Box>
        </Stack>
      </Paper>

      {/* Details Grid */}
      <Grid container spacing={2.5}>
        <Grid item xs={12} md={6}>
          <DetailItem icon={<FaUserCog size={16} />} label="Role" value={selectedItem.role} />
        </Grid>
        <Grid item xs={12} md={6}>
          <DetailItem icon={<FaEnvelope size={16} />} label="Email Verified" value={selectedItem.emailVerifiedAt ? new Date(selectedItem.emailVerifiedAt).toLocaleDateString() : 'No'} />
        </Grid>
        <Grid item xs={12} md={6}>
          <DetailItem icon={<FaCalendarAlt size={16} />} label="Date of Birth" value={selectedItem.dob ? new Date(selectedItem.dob).toLocaleDateString() : 'N/A'} />
        </Grid>
        <Grid item xs={12} md={6}>
          <DetailItem icon={<FaGlobe size={16} />} label="Language" value={selectedItem.language || 'en'} />
        </Grid>
        <Grid item xs={12} md={6}>
          <DetailItem icon={<FaMapMarkerAlt size={16} />} label="Country" value={selectedItem.country} />
        </Grid>
        <Grid item xs={12} md={6}>
          <DetailItem icon={<FaMapMarkerAlt size={16} />} label="State" value={selectedItem.state} />
        </Grid>
        <Grid item xs={12} md={6}>
          <DetailItem icon={<FaMapMarkerAlt size={16} />} label="City" value={selectedItem.city} />
        </Grid>
        <Grid item xs={12} md={6}>
          <DetailItem icon={<FaWallet size={16} />} label="Wallet Balance" value={`₹${selectedItem.wallet || 0}`} />
        </Grid>
        <Grid item xs={12} md={6}>
          <DetailItem icon={<FaCalendarAlt size={16} />} label="Joined On" value={selectedItem.createdAt ? new Date(selectedItem.createdAt).toLocaleDateString() : 'N/A'} />
        </Grid>
        <Grid item xs={12} md={6}>
          <DetailItem icon={<FaCalendarAlt size={16} />} label="Last Login" value={selectedItem.lastLoginAt ? new Date(selectedItem.lastLoginAt).toLocaleString() : 'N/A'} />
        </Grid>
      </Grid>
    </Box>
  );
};

export default UserDetails;
