// src/pages/RoleRequests.jsx
import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import {
  CheckCircle, Cancel, Visibility, Search as SearchIcon,
  Refresh, Inbox as InboxIcon,
} from '@mui/icons-material';
import {
  Box, Paper, Typography, Button, IconButton, Chip, Dialog, DialogTitle,
  DialogContent, DialogActions, Avatar, Stack, Divider, TextField,
  Select, MenuItem, FormControl, InputLabel, useMediaQuery, useTheme,
  InputAdornment, CircularProgress, Tooltip,
} from '@mui/material';
import {
  DataGrid,
  GridToolbarContainer,
  GridToolbarFilterButton,
  GridToolbarExport,
} from '@mui/x-data-grid';
import {
  fetchRoleRequests,
  approveRoleRequest,
  rejectRoleRequest,
  setPage,
  setLimit,
} from '../redux/slices/roleRequestSlice';
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
  sky: '#0ea5e9',
  skySoft: '#e0f2fe',
  radius: 3,
  fontDisplay: '"Inter", system-ui, -apple-system, sans-serif',
};

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  'https://local-guider-backend.onrender.com/api/v1';
const SERVER_BASE = API_BASE_URL.replace('/api/v1', '');

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════
const getImageUrl = (path) => {
  if (!path) return null;
  if (typeof path !== 'string') return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  if (path.includes('/uploads/')) return null;
  return `${SERVER_BASE}${path.startsWith('/') ? path : '/' + path}`;
};

const ID_TYPE_LABELS = {
  AADHAAR: 'Aadhaar Card',
  PAN: 'PAN Card',
  DRIVING_LICENSE: 'Driving License',
  VOTER_ID: 'Voter ID',
  PASSPORT: 'Passport',
  OTHER: 'Other',
};

const ROLE_STYLES = {
  GUIDER: { bg: T.violetSoft, color: T.violet },
  PHOTOGRAPHER: { bg: T.roseSoft, color: '#be185d' },
};

const STATUS_STYLES = {
  PENDING: { bg: T.amberSoft, color: '#b45309' },
  APPROVED: { bg: T.emeraldSoft, color: '#047857' },
  REJECTED: { bg: T.roseSoft, color: '#be123c' },
};

const CustomToolbar = () => (
  <GridToolbarContainer sx={{ p: 1 }}>
    <GridToolbarFilterButton />
    <GridToolbarExport />
  </GridToolbarContainer>
);

// ═══════════════════════════════════════════════════════════════
// USER AVATAR — reusable, with gradient fallback
// ═══════════════════════════════════════════════════════════════
const UserAvatar = ({ row, size = 38 }) => {
  const url = getImageUrl(row?.profilePhotoUrl || row?.profileImage);
  const initial = (row?.fullName?.[0] || 'R').toUpperCase();
  const role = row?.requestedRole || 'GUIDER';

  const gradient =
    role === 'GUIDER'
      ? `linear-gradient(135deg, ${T.violet}, #a78bfa)`
      : `linear-gradient(135deg, ${T.rose}, #f472b6)`;

  return (
    <Avatar
      src={url || undefined}
      alt={row?.fullName}
      sx={{
        width: size,
        height: size,
        background: gradient,
        color: '#fff',
        fontWeight: 700,
        fontSize: size * 0.42,
        border: '2px solid #fff',
        boxShadow: '0 2px 6px rgba(15,23,42,0.1)',
      }}
      slotProps={{
        img: {
          onError: (e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = '';
            e.currentTarget.style.display = 'none';
          },
        },
      }}
    >
      {initial}
    </Avatar>
  );
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
// IMAGE CARD (for documents)
// ═══════════════════════════════════════════════════════════════
const ImageCard = ({ label, url }) => {
  const [errored, setErrored] = useState(false);
  const imageUrl = getImageUrl(url);

  return (
    <Box sx={{ textAlign: 'center' }}>
      <Typography
        sx={{
          fontSize: '0.65rem',
          color: T.textFaint,
          display: 'block',
          mb: 1,
          fontWeight: 700,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </Typography>
      {imageUrl && !errored ? (
        <Box
          component="img"
          src={imageUrl}
          alt={label}
          onError={() => setErrored(true)}
          onClick={() => window.open(imageUrl, '_blank')}
          sx={{
            width: 120,
            height: 120,
            borderRadius: 2,
            objectFit: 'cover',
            border: `1px solid ${T.border}`,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            '&:hover': {
              borderColor: T.indigo,
              transform: 'translateY(-2px)',
              boxShadow: `0 8px 20px -8px ${T.indigo}55`,
            },
          }}
        />
      ) : (
        <Box
          sx={{
            width: 120,
            height: 120,
            bgcolor: T.surfaceSoft,
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: `1px dashed ${T.border}`,
          }}
        >
          <Typography sx={{ fontSize: '0.7rem', color: T.textFaint }}>
            {!url ? 'No Image' : 'Load Failed'}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

// ═══════════════════════════════════════════════════════════════
// REQUEST DETAILS MODAL
// ═══════════════════════════════════════════════════════════════
const RequestDetailsModal = ({ request, onClose }) => {
  const [placeNames, setPlaceNames] = useState([]);

  useEffect(() => {
    const fetchPlaceNames = async () => {
      if (!request?.placeIds || request.placeIds.length === 0) {
        setPlaceNames([]);
        return;
      }
      try {
        const names = await Promise.all(
          request.placeIds.map(async (placeId) => {
            try {
              const res = await apiClient.get(`/places/${placeId}`);
              return res.data?.data?.name || placeId;
            } catch {
              return placeId;
            }
          })
        );
        setPlaceNames(names);
      } catch (error) {
        console.error('Error fetching place names:', error);
      }
    };
    fetchPlaceNames();
  }, [request]);

  if (!request) return null;

  const statusStyle = STATUS_STYLES[request.status] || STATUS_STYLES.PENDING;
  const roleStyle = ROLE_STYLES[request.requestedRole] || ROLE_STYLES.GUIDER;

  return (
    <Dialog
      open={!!request}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      slotProps={{ paper: { sx: { borderRadius: T.radius } } }}
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
          justifyContent: 'space-between',
          gap: 1,
        }}
      >
        <span>Request Details</span>
        <Chip
          label={request.status}
          size="small"
          sx={{
            bgcolor: statusStyle.bg,
            color: statusStyle.color,
            fontWeight: 700,
            fontSize: '0.65rem',
            height: 22,
            borderRadius: 999,
          }}
        />
      </DialogTitle>
      <DialogContent dividers sx={{ borderColor: T.border, p: 3 }}>
        {/* ═══════ Applicant Header ═══════ */}
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
          <UserAvatar row={request} size={56} />
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography
              sx={{ fontSize: '1rem', fontWeight: 700, color: T.textPrimary }}
            >
              {request.fullName || 'N/A'}
            </Typography>
            <Typography
              sx={{ fontSize: '0.78rem', color: T.textMuted, mt: 0.2 }}
            >
              {request.companyName || 'N/A'} • {request.location || 'N/A'}
            </Typography>
          </Box>
          <Chip
            label={request.requestedRole}
            size="small"
            sx={{
              bgcolor: roleStyle.bg,
              color: roleStyle.color,
              fontWeight: 700,
              fontSize: '0.65rem',
              height: 22,
              borderRadius: 999,
            }}
          />
        </Stack>

        {/* ═══════ Info Grid ═══════ */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
            gap: 2.5,
            mb: 3,
          }}
        >
          <Box>
            <Typography
              sx={{
                fontSize: '0.62rem',
                color: T.textFaint,
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                mb: 0.5,
              }}
            >
              Full Name
            </Typography>
            <Typography
              sx={{ fontSize: '0.88rem', fontWeight: 700, color: T.textPrimary }}
            >
              {request.fullName || 'N/A'}
            </Typography>
          </Box>
          <Box>
            <Typography
              sx={{
                fontSize: '0.62rem',
                color: T.textFaint,
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                mb: 0.5,
              }}
            >
              Company
            </Typography>
            <Typography
              sx={{ fontSize: '0.88rem', fontWeight: 600, color: T.textPrimary }}
            >
              {request.companyName || 'N/A'}
            </Typography>
          </Box>
          <Box>
            <Typography
              sx={{
                fontSize: '0.62rem',
                color: T.textFaint,
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                mb: 0.5,
              }}
            >
              Location
            </Typography>
            <Typography
              sx={{ fontSize: '0.88rem', fontWeight: 600, color: T.textPrimary }}
            >
              {request.location || 'N/A'}
            </Typography>
          </Box>
          <Box>
            <Typography
              sx={{
                fontSize: '0.62rem',
                color: T.textFaint,
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                mb: 0.5,
              }}
            >
              ID Type
            </Typography>
            <Chip
              label={ID_TYPE_LABELS[request.idType] || request.idType || 'N/A'}
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
          </Box>
          <Box>
            <Typography
              sx={{
                fontSize: '0.62rem',
                color: T.textFaint,
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                mb: 0.5,
              }}
            >
              Submitted On
            </Typography>
            <Typography
              sx={{ fontSize: '0.82rem', fontWeight: 600, color: T.textPrimary }}
            >
              {request.createdAt
                ? new Date(request.createdAt).toLocaleString('en-IN')
                : 'N/A'}
            </Typography>
          </Box>
        </Box>

        {/* ═══════ Places ═══════ */}
        <Box sx={{ mb: 3 }}>
          <SectionHeader
            title={`Selected Places (${placeNames.length})`}
            subtitle="Locations the applicant wants to cover"
            accent={T.emerald}
          />
          {placeNames.length > 0 ? (
            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
              {placeNames.map((place, idx) => (
                <Chip
                  key={idx}
                  label={place}
                  sx={{
                    bgcolor: T.emeraldSoft,
                    color: '#047857',
                    fontWeight: 700,
                    fontSize: '0.72rem',
                    height: 26,
                    borderRadius: 999,
                  }}
                />
              ))}
            </Stack>
          ) : (
            <Typography sx={{ fontSize: '0.82rem', color: T.textFaint }}>
              No places selected
            </Typography>
          )}
        </Box>

        {/* ═══════ Documents ═══════ */}
        <Box sx={{ mb: 3 }}>
          <SectionHeader
            title="Verification Documents"
            subtitle="Click any image to preview"
            accent={T.sky}
          />
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(4, 1fr)' },
              gap: 2,
            }}
          >
            <ImageCard label="Selfie (Live)" url={request.selfieUrl} />
            <ImageCard label="Profile Photo" url={request.profilePhotoUrl} />
            <ImageCard label="ID Front" url={request.idFrontUrl} />
            <ImageCard label="ID Back" url={request.idBackUrl} />
          </Box>
        </Box>

        {/* ═══════ Message ═══════ */}
        <Box>
          <SectionHeader title="Message" subtitle="Applicant's note" accent={T.violet} />
          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: 2,
              bgcolor: T.surfaceSoft,
              border: `1px solid ${T.border}`,
            }}
          >
            <Typography
              sx={{
                fontSize: '0.82rem',
                color: T.textPrimary,
                lineHeight: 1.6,
                fontWeight: 500,
              }}
            >
              {request.message || 'No message provided'}
            </Typography>
          </Paper>
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2, borderTop: `1px solid ${T.border}` }}>
        <Button
          onClick={onClose}
          sx={{ textTransform: 'none', fontWeight: 600, color: T.textMuted }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ═══════════════════════════════════════════════════════════════
// ROLE REQUESTS
// ═══════════════════════════════════════════════════════════════
const RoleRequests = () => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { items, total, loading, pagination } = useSelector(
    (state) => state.roleRequests
  );

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [processing, setProcessing] = useState(null);
  const [rejectDialog, setRejectDialog] = useState({ open: false, id: null });
  const [rejectReason, setRejectReason] = useState('');

  const fetchList = () => {
    dispatch(
      fetchRoleRequests({
        page: pagination.page,
        limit: pagination.limit,
      })
    );
  };

  useEffect(() => {
    fetchList();
  }, [dispatch, pagination.page, pagination.limit]);

  const filtered = (items || []).filter((item) => {
    const matchesSearch =
      !searchTerm ||
      item.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.idType?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !filterStatus || item.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleApprove = async (id) => {
    setProcessing(id);
    try {
      await dispatch(approveRoleRequest(id)).unwrap();
      toast.success('Approved! User role & profile updated');
      fetchList();
    } catch (error) {
      toast.error(error.message || 'Approve failed');
    } finally {
      setProcessing(null);
    }
  };

  const openRejectDialog = (id) => {
    setRejectDialog({ open: true, id });
    setRejectReason('');
  };

  const handleReject = async () => {
    const id = rejectDialog.id;
    if (!id) return;
    setProcessing(id);
    try {
      await dispatch(
        rejectRoleRequest({ id, adminMessage: rejectReason })
      ).unwrap();
      toast.success('Request rejected');
      setRejectDialog({ open: false, id: null });
      setRejectReason('');
      fetchList();
    } catch (error) {
      toast.error(error.message || 'Reject failed');
    } finally {
      setProcessing(null);
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // DataGrid Columns
  // ═══════════════════════════════════════════════════════════════
  const columns = [
    // ═══════ Profile Image Column ═══════
    {
      field: 'profilePhotoUrl',
      headerName: 'Profile',
      flex: 0.5,
      minWidth: 80,
      sortable: false,
      renderCell: (p) => <UserAvatar row={p.row} size={38} />,
    },
    {
      field: 'fullName',
      headerName: 'Full Name',
      flex: 1.2,
      minWidth: 140,
      renderCell: (p) => (
        <Typography
          sx={{ fontSize: '0.82rem', fontWeight: 700, color: T.textPrimary }}
          noWrap
        >
          {p.row.fullName || '—'}
        </Typography>
      ),
    },
    {
      field: 'companyName',
      headerName: 'Company',
      flex: 1,
      minWidth: 140,
      renderCell: (p) => (
        <Typography sx={{ fontSize: '0.78rem', color: T.textMuted }} noWrap>
          {p.row.companyName || 'N/A'}
        </Typography>
      ),
    },
    {
      field: 'location',
      headerName: 'Location',
      flex: 0.9,
      minWidth: 110,
      renderCell: (p) => (
        <Typography sx={{ fontSize: '0.78rem', color: T.textMuted }} noWrap>
          {p.row.location || '—'}
        </Typography>
      ),
    },
    {
      field: 'idType',
      headerName: 'ID Type',
      flex: 0.9,
      minWidth: 130,
      renderCell: (p) => (
        <Chip
          label={ID_TYPE_LABELS[p.row.idType] || p.row.idType || 'N/A'}
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
      ),
    },
    {
      field: 'requestedRole',
      headerName: 'Role',
      flex: 0.7,
      minWidth: 110,
      renderCell: (p) => {
        const style = ROLE_STYLES[p.row.requestedRole] || ROLE_STYLES.GUIDER;
        return (
          <Chip
            label={p.row.requestedRole}
            size="small"
            sx={{
              bgcolor: style.bg,
              color: style.color,
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
      field: 'status',
      headerName: 'Status',
      flex: 0.7,
      minWidth: 100,
      renderCell: (p) => {
        const style = STATUS_STYLES[p.row.status] || STATUS_STYLES.PENDING;
        return (
          <Chip
            label={p.row.status}
            size="small"
            sx={{
              bgcolor: style.bg,
              color: style.color,
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
      field: 'createdAt',
      headerName: 'Date',
      flex: 0.7,
      minWidth: 100,
      renderCell: (p) => (
        <Typography sx={{ fontSize: '0.75rem', color: T.textMuted }}>
          {new Date(p.row.createdAt).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })}
        </Typography>
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      flex: 1.2,
      minWidth: 170,
      sortable: false,
      renderCell: (p) => (
        <Stack direction="row" spacing={0.5} alignItems="center">
          <Tooltip title="View details">
            <IconButton
              size="small"
              onClick={() => setSelectedRequest(p.row)}
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
          {p.row.status === 'PENDING' && (
            <>
              <Tooltip title="Approve">
                <span>
                  <IconButton
                    size="small"
                    onClick={() => handleApprove(p.row.id)}
                    disabled={processing === p.row.id}
                    sx={{
                      bgcolor: T.emeraldSoft,
                      color: '#059669',
                      '&:hover': { bgcolor: '#a7f3d0' },
                      width: 32,
                      height: 32,
                    }}
                  >
                    {processing === p.row.id ? (
                      <CircularProgress size={14} sx={{ color: '#059669' }} />
                    ) : (
                      <CheckCircle sx={{ fontSize: 16 }} />
                    )}
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title="Reject">
                <span>
                  <IconButton
                    size="small"
                    onClick={() => openRejectDialog(p.row.id)}
                    disabled={processing === p.row.id}
                    sx={{
                      bgcolor: T.roseSoft,
                      color: T.rose,
                      '&:hover': { bgcolor: '#fecaca' },
                      width: 32,
                      height: 32,
                    }}
                  >
                    <Cancel sx={{ fontSize: 16 }} />
                  </IconButton>
                </span>
              </Tooltip>
            </>
          )}
        </Stack>
      ),
    },
  ];

  // ═══════════════════════════════════════════════════════════════
  // Mobile cards
  // ═══════════════════════════════════════════════════════════════
  const renderMobileCards = () => (
    <Stack spacing={2}>
      {filtered.length > 0 ? (
        filtered.map((req) => {
          const roleStyle = ROLE_STYLES[req.requestedRole] || ROLE_STYLES.GUIDER;
          const statusStyle = STATUS_STYLES[req.status] || STATUS_STYLES.PENDING;
          return (
            <Paper
              key={req.id}
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
                <UserAvatar row={req} size={44} />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    sx={{ fontSize: '0.88rem', fontWeight: 700, color: T.textPrimary }}
                    noWrap
                  >
                    {req.fullName}
                  </Typography>
                  <Typography
                    sx={{ fontSize: '0.72rem', color: T.textMuted, mt: 0.2 }}
                    noWrap
                  >
                    {req.companyName || 'N/A'} • {req.location || 'N/A'}
                  </Typography>
                </Box>
                <Chip
                  label={req.requestedRole}
                  size="small"
                  sx={{
                    bgcolor: roleStyle.bg,
                    color: roleStyle.color,
                    fontWeight: 700,
                    fontSize: '0.62rem',
                    height: 22,
                    borderRadius: 999,
                  }}
                />
              </Stack>

              <Stack direction="row" spacing={1} sx={{ mb: 1.5 }}>
                <Chip
                  label={ID_TYPE_LABELS[req.idType] || 'AADHAAR'}
                  size="small"
                  sx={{
                    bgcolor: T.indigoSoft,
                    color: T.indigo,
                    fontWeight: 700,
                    fontSize: '0.62rem',
                    height: 22,
                    borderRadius: 999,
                  }}
                />
              </Stack>

              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                sx={{ pt: 1.5, borderTop: `1px solid ${T.border}` }}
              >
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Chip
                    label={req.status}
                    size="small"
                    sx={{
                      bgcolor: statusStyle.bg,
                      color: statusStyle.color,
                      fontWeight: 700,
                      fontSize: '0.62rem',
                      height: 22,
                      borderRadius: 999,
                    }}
                  />
                  <Typography sx={{ fontSize: '0.68rem', color: T.textFaint }}>
                    {new Date(req.createdAt).toLocaleDateString('en-IN')}
                  </Typography>
                </Stack>
                <Stack direction="row" spacing={0.5}>
                  <IconButton
                    size="small"
                    onClick={() => setSelectedRequest(req)}
                    sx={{ bgcolor: T.indigoSoft, color: T.indigo, width: 30, height: 30 }}
                  >
                    <Visibility sx={{ fontSize: 15 }} />
                  </IconButton>
                  {req.status === 'PENDING' && (
                    <>
                      <IconButton
                        size="small"
                        onClick={() => handleApprove(req.id)}
                        disabled={processing === req.id}
                        sx={{ bgcolor: T.emeraldSoft, color: '#059669', width: 30, height: 30 }}
                      >
                        <CheckCircle sx={{ fontSize: 15 }} />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => openRejectDialog(req.id)}
                        disabled={processing === req.id}
                        sx={{ bgcolor: T.roseSoft, color: T.rose, width: 30, height: 30 }}
                      >
                        <Cancel sx={{ fontSize: 15 }} />
                      </IconButton>
                    </>
                  )}
                </Stack>
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
          <InboxIcon sx={{ fontSize: 40, color: T.textFaint, mb: 1 }} />
          <Typography sx={{ color: T.textFaint, fontWeight: 500 }}>
            No requests found
          </Typography>
        </Paper>
      )}
    </Stack>
  );

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1440, mx: 'auto' }}>
      <Box sx={{ mb: 3 }}>
        <PanelHeader eyebrow="Verification" title="Role Requests" />
      </Box>

      {/* ═══════ Filters ═══════ */}
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
            placeholder="Search by name, company, location, ID type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ fontSize: 18, color: T.textFaint }} />
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
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              label="Status"
              sx={{ borderRadius: 2, bgcolor: T.surfaceSoft }}
            >
              <MenuItem value="">All Status</MenuItem>
              <MenuItem value="PENDING">Pending</MenuItem>
              <MenuItem value="APPROVED">Approved</MenuItem>
              <MenuItem value="REJECTED">Rejected</MenuItem>
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
          <Chip
            label={`${total} total`}
            sx={{
              bgcolor: T.surfaceSoft,
              color: T.textMuted,
              border: `1px solid ${T.border}`,
              fontWeight: 700,
              fontSize: '0.72rem',
              height: 32,
              borderRadius: 999,
            }}
          />
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
              rows={filtered}
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

      {/* ═══════ Details Modal ═══════ */}
      <RequestDetailsModal
        request={selectedRequest}
        onClose={() => setSelectedRequest(null)}
      />

      {/* ═══════ Reject Reason Dialog ═══════ */}
      <Dialog
        open={rejectDialog.open}
        onClose={() => !processing && setRejectDialog({ open: false, id: null })}
        maxWidth="sm"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: T.radius, p: 0.5 } } }}
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
            <Cancel sx={{ fontSize: 18 }} />
          </Box>
          Reject Role Request?
        </DialogTitle>
        <Divider sx={{ borderColor: T.border }} />
        <Box sx={{ px: 3, py: 2.5 }}>
          <Typography sx={{ fontSize: '0.82rem', color: T.textMuted, mb: 2 }}>
            Please provide a reason for rejection. This will be sent to the applicant.
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            placeholder="e.g. Documents unclear, please re-upload a valid ID"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                bgcolor: T.surfaceSoft,
                '& fieldset': { borderColor: T.border },
                '&:hover fieldset': { borderColor: '#fecaca' },
                '&.Mui-focused fieldset': { borderColor: T.rose, borderWidth: 1.5 },
              },
            }}
          />
        </Box>
        <DialogActions sx={{ p: 2, pt: 0, gap: 1 }}>
          <Button
            onClick={() => setRejectDialog({ open: false, id: null })}
            disabled={!!processing}
            sx={{ textTransform: 'none', fontWeight: 600, color: T.textMuted }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleReject}
            disabled={!!processing}
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
            {processing ? (
              <CircularProgress size={16} sx={{ color: '#fff' }} />
            ) : (
              'Reject'
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RoleRequests;