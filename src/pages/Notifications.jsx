// src/pages/Notifications.jsx
import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  FaBell, FaPaperPlane, FaEye, FaUserCircle,
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import {
  Box, Paper, Typography, TextField, Select, MenuItem, FormControl,
  InputLabel, Button, CircularProgress, Chip, Stack, Alert,
  useMediaQuery, useTheme, Avatar, Dialog, DialogTitle,
  DialogContent, DialogActions, IconButton, Divider, Tooltip,
  InputAdornment,
} from '@mui/material';
import {
  Search as SearchIcon, Refresh, Inbox,
} from '@mui/icons-material';
import {
  DataGrid, GridToolbarContainer, GridToolbarExport, GridToolbarFilterButton,
} from '@mui/x-data-grid';
import {
  fetchNotifications, sendBroadcast, clearError, setPage, setLimit,
} from '../redux/slices/notificationSlice';
import Loader from '../components/Loader';
import PanelHeader from '../components/PanelHeader';

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

const CustomToolbar = () => (
  <GridToolbarContainer sx={{ p: 1 }}>
    <GridToolbarFilterButton />
    <GridToolbarExport />
  </GridToolbarContainer>
);

const getRoleColor = (role) => {
  switch (role) {
    case 'GUIDER': return { bg: T.violetSoft, color: '#6d28d9' };
    case 'PHOTOGRAPHER': return { bg: T.roseSoft, color: '#be185d' };
    case 'ADMIN': return { bg: T.amberSoft, color: '#b45309' };
    default: return { bg: T.skySoft, color: '#0369a1' };
  }
};

const getTypeStyle = (type) => {
  switch (type) {
    case 'OFFER': return { bg: T.emeraldSoft, color: '#047857' };
    case 'BOOKING': return { bg: T.skySoft, color: '#0369a1' };
    case 'CHAT': return { bg: T.violetSoft, color: '#6d28d9' };
    case 'PAYMENT': return { bg: '#fce7f3', color: '#be185d' };
    default: return { bg: '#f1f5f9', color: '#475569' };
  }
};

const Notifications = () => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { items, loading, sending, error, pagination } = useSelector(
    (s) => s.notifications
  );

  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState('SYSTEM');
  const [targetRole, setTargetRole] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewNotification, setViewNotification] = useState(null);

  const fetchList = () => {
    dispatch(
      fetchNotifications({ page: pagination.page, limit: pagination.limit })
    );
  };

  useEffect(() => {
    fetchList();
    return () => dispatch(clearError());
  }, [dispatch, pagination.page, pagination.limit]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      toast.error('Title and Message are required');
      return;
    }
    try {
      const result = await dispatch(
        sendBroadcast({ title, message, type, targetRole })
      ).unwrap();
      toast.success(`Notification sent to ${result.count || 'users'} successfully`);
      setTitle('');
      setMessage('');
      fetchList();
    } catch (err) {
      toast.error(err || 'Failed to send notification');
    }
  };

  const filtered = (items || []).filter((item) =>
    item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.message?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.user?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.user?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.user?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getUserName = (user) => {
    if (!user) return 'Broadcast';
    if (user.firstName && user.lastName) return `${user.firstName} ${user.lastName}`;
    if (user.firstName) return user.firstName;
    if (user.email) return user.email;
    return 'Unknown';
  };

  const columns = [
    {
      field: 'user',
      headerName: 'Recipient',
      flex: 1.4,
      minWidth: 190,
      sortable: false,
      renderCell: (params) => {
        const user = params.row.user;
        if (!user) {
          return (
            <Stack direction="row" alignItems="center" spacing={1}>
              <Avatar
                sx={{
                  width: 34, height: 34,
                  bgcolor: T.surfaceSoft,
                  color: T.textFaint,
                  border: `1px solid ${T.border}`,
                }}
              >
                <FaUserCircle size={18} />
              </Avatar>
              <Typography sx={{ fontSize: '0.78rem', color: T.textFaint, fontWeight: 600 }}>
                Broadcast
              </Typography>
            </Stack>
          );
        }
        const roleColors = getRoleColor(user.role);
        return (
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Avatar
              src={user.profileImage}
              sx={{
                width: 34, height: 34, fontSize: 13,
                background: `linear-gradient(135deg, ${T.indigo}, ${T.violet})`,
                fontWeight: 700,
                border: '2px solid #fff',
              }}
            >
              {user.firstName?.charAt(0) || 'U'}
            </Avatar>
            <Stack spacing={0.2} sx={{ minWidth: 0 }}>
              <Typography
                sx={{
                  fontSize: '0.8rem', fontWeight: 700, color: T.textPrimary,
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  maxWidth: 130,
                }}
              >
                {getUserName(user)}
              </Typography>
              <Chip
                label={user.role || 'USER'}
                size="small"
                sx={{
                  bgcolor: roleColors.bg, color: roleColors.color,
                  fontWeight: 700, height: 18, fontSize: '0.58rem',
                  borderRadius: 999, width: 'fit-content',
                }}
              />
            </Stack>
          </Stack>
        );
      },
    },
    {
      field: 'title',
      headerName: 'Title',
      flex: 1.2,
      minWidth: 140,
      renderCell: (params) => (
        <Typography
          sx={{ fontSize: '0.8rem', fontWeight: 700, color: T.textPrimary }}
          noWrap
        >
          {params.row.title}
        </Typography>
      ),
    },
    {
      field: 'message',
      headerName: 'Message',
      flex: 2.2,
      minWidth: 220,
      renderCell: (params) => (
        <Typography
          sx={{
            fontSize: '0.78rem', color: T.textMuted,
            lineHeight: 1.4,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {params.row.message}
        </Typography>
      ),
    },
    {
      field: 'type',
      headerName: 'Type',
      flex: 0.6,
      minWidth: 100,
      renderCell: (params) => {
        const style = getTypeStyle(params.row.type);
        return (
          <Chip
            label={params.row.type}
            size="small"
            sx={{
              bgcolor: style.bg, color: style.color,
              fontWeight: 700, fontSize: '0.65rem',
              height: 22, borderRadius: 999,
            }}
          />
        );
      },
    },
    {
      field: 'isRead',
      headerName: 'Status',
      flex: 0.5,
      minWidth: 90,
      renderCell: (params) => (
        <Chip
          label={params.row.isRead ? 'Read' : 'Unread'}
          size="small"
          sx={{
            bgcolor: params.row.isRead ? '#f1f5f9' : T.amberSoft,
            color: params.row.isRead ? '#475569' : '#b45309',
            fontWeight: 700, fontSize: '0.65rem',
            height: 22, borderRadius: 999,
          }}
        />
      ),
    },
    {
      field: 'createdAt',
      headerName: 'Date',
      flex: 1,
      minWidth: 140,
      renderCell: (params) => (
        <Typography sx={{ fontSize: '0.72rem', color: T.textMuted }}>
          {new Date(params.row.createdAt).toLocaleDateString('en-IN', {
            day: '2-digit', month: 'short', year: 'numeric',
          })}{' '}
          <span style={{ color: T.textFaint }}>
            {new Date(params.row.createdAt).toLocaleTimeString([], {
              hour: '2-digit', minute: '2-digit',
            })}
          </span>
        </Typography>
      ),
    },
    {
      field: 'actions',
      headerName: 'View',
      flex: 0.4,
      minWidth: 70,
      sortable: false,
      renderCell: (params) => (
        <Tooltip title="View details">
          <IconButton
            size="small"
            onClick={() => setViewNotification(params.row)}
            sx={{
              bgcolor: T.skySoft, color: T.sky,
              '&:hover': { bgcolor: '#bae6fd' },
              width: 32, height: 32,
            }}
          >
            <FaEye size={13} />
          </IconButton>
        </Tooltip>
      ),
    },
  ];

  const renderMobileCards = () => (
    <Stack spacing={2}>
      {filtered.length > 0 ? (
        filtered.map((notif) => {
          const user = notif.user;
          const roleColors = getRoleColor(user?.role);
          const typeStyle = getTypeStyle(notif.type);
          return (
            <Paper
              key={notif.id}
              elevation={0}
              sx={{
                borderRadius: T.radius,
                border: `1px solid ${T.border}`,
                bgcolor: T.surface,
                p: 2,
                '&:hover': {
                  boxShadow: '0 12px 24px -16px rgba(15,23,42,0.15)',
                  borderColor: T.borderStrong,
                },
              }}
            >
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.5 }}>
                <Avatar
                  src={user?.profileImage}
                  sx={{
                    width: 40, height: 40,
                    background: `linear-gradient(135deg, ${T.indigo}, ${T.violet})`,
                    fontWeight: 700, fontSize: '0.85rem',
                  }}
                >
                  {user?.firstName?.charAt(0) || 'U'}
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: T.textPrimary }} noWrap>
                    {getUserName(user)}
                  </Typography>
                  {user?.role && (
                    <Chip
                      label={user.role}
                      size="small"
                      sx={{
                        bgcolor: roleColors.bg, color: roleColors.color,
                        fontWeight: 700, fontSize: '0.58rem',
                        height: 18, borderRadius: 999, mt: 0.3,
                      }}
                    />
                  )}
                </Box>
                <Chip
                  label={notif.type}
                  size="small"
                  sx={{
                    bgcolor: typeStyle.bg, color: typeStyle.color,
                    fontWeight: 700, fontSize: '0.62rem',
                    height: 22, borderRadius: 999,
                  }}
                />
              </Stack>

              <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: T.textPrimary, mb: 0.3 }}>
                {notif.title}
              </Typography>
              <Typography sx={{ fontSize: '0.75rem', color: T.textMuted, mb: 1.5 }}>
                {notif.message}
              </Typography>

              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                sx={{ pt: 1.5, borderTop: `1px solid ${T.border}` }}
              >
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Chip
                    label={notif.isRead ? 'Read' : 'Unread'}
                    size="small"
                    sx={{
                      bgcolor: notif.isRead ? '#f1f5f9' : T.amberSoft,
                      color: notif.isRead ? '#475569' : '#b45309',
                      fontWeight: 700, fontSize: '0.6rem',
                      height: 20, borderRadius: 999,
                    }}
                  />
                  <Typography sx={{ fontSize: '0.65rem', color: T.textFaint }}>
                    {new Date(notif.createdAt).toLocaleDateString('en-IN')}
                  </Typography>
                </Stack>
                <IconButton
                  size="small"
                  onClick={() => setViewNotification(notif)}
                  sx={{ bgcolor: T.skySoft, color: T.sky, width: 30, height: 30 }}
                >
                  <FaEye size={13} />
                </IconButton>
              </Stack>
            </Paper>
          );
        })
      ) : (
        <Paper
          elevation={0}
          sx={{
            p: 4, borderRadius: T.radius,
            border: `1px dashed ${T.border}`, textAlign: 'center',
          }}
        >
          <Inbox sx={{ fontSize: 40, color: T.textFaint, mb: 1 }} />
          <Typography sx={{ color: T.textFaint, fontWeight: 500 }}>
            No notifications found
          </Typography>
        </Paper>
      )}
    </Stack>
  );

  const inputSx = {
    '& .MuiOutlinedInput-root': {
      borderRadius: 2,
      bgcolor: T.surfaceSoft,
      '& fieldset': { borderColor: T.border },
      '&:hover fieldset': { borderColor: '#c7d2fe' },
      '&.Mui-focused fieldset': { borderColor: T.indigo, borderWidth: 1.5 },
    },
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1440, mx: 'auto' }}>
      <Box sx={{ mb: 3 }}>
        <PanelHeader eyebrow="Communication" title="Notifications & Broadcast" />
      </Box>

      {/* ═══════ Broadcast Form ═══════ */}
      <Paper
        elevation={0}
        sx={{
          p: 3, borderRadius: T.radius,
          border: `1px solid ${T.border}`,
          bgcolor: T.surface, mb: 2.5,
        }}
      >
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
          <Box
            sx={{
              width: 44, height: 44, borderRadius: 2,
              background: `linear-gradient(135deg, ${T.indigo}, ${T.violet})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white',
              boxShadow: `0 4px 12px ${T.indigo}40`,
            }}
          >
            <FaBell size={20} />
          </Box>
          <Box>
            <Typography
              sx={{
                fontFamily: T.fontDisplay, fontWeight: 700,
                fontSize: '1rem', color: T.textPrimary,
              }}
            >
              Send Broadcast
            </Typography>
            <Typography sx={{ fontSize: '0.72rem', color: T.textFaint, mt: 0.2, fontWeight: 500 }}>
              Send a push notification to all users or a specific role
            </Typography>
          </Box>
        </Stack>

        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr', sm: '1fr 1fr',
              lg: '1.4fr 1fr 1fr 2fr 1.2fr',
            },
            gap: 2,
            alignItems: 'flex-start',
          }}
        >
          <TextField
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            fullWidth
            required
            sx={inputSx}
          />
          <FormControl fullWidth sx={inputSx}>
            <InputLabel>Notification Type</InputLabel>
            <Select
              value={type}
              onChange={(e) => setType(e.target.value)}
              label="Notification Type"
            >
              <MenuItem value="SYSTEM">System</MenuItem>
              <MenuItem value="BOOKING">Booking</MenuItem>
              <MenuItem value="PAYMENT">Payment</MenuItem>
              <MenuItem value="OFFER">Offer</MenuItem>
              <MenuItem value="CHAT">Chat</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth sx={inputSx}>
            <InputLabel>Audience</InputLabel>
            <Select
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              label="Audience"
            >
              <MenuItem value="ALL">All Users</MenuItem>
              <MenuItem value="USER">Regular Users</MenuItem>
              <MenuItem value="GUIDER">Guiders</MenuItem>
              <MenuItem value="PHOTOGRAPHER">Photographers</MenuItem>
            </Select>
          </FormControl>
          <TextField
            label="Message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            fullWidth
            required
            sx={inputSx}
          />
          <Button
            variant="contained"
            startIcon={
              sending ? (
                <CircularProgress size={16} sx={{ color: '#fff' }} />
              ) : (
                <FaPaperPlane size={12} />
              )
            }
            onClick={handleSend}
            disabled={sending}
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '0.82rem',
              bgcolor: T.indigo,
              py: 1.5,
              borderRadius: 2,
              boxShadow: 'none',
              whiteSpace: 'nowrap',
              '&:hover': { bgcolor: '#4f46e5' },
            }}
          >
            Send Broadcast
          </Button>
        </Box>
      </Paper>

      {/* ═══════ All Notifications ═══════ */}
      <Paper
        elevation={0}
        sx={{
          p: 2, borderRadius: T.radius,
          border: `1px solid ${T.border}`,
          bgcolor: T.surface,
        }}
      >
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          justifyContent="space-between"
          alignItems={{ md: 'center' }}
          spacing={2}
          sx={{ mb: 2 }}
        >
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Box
              sx={{
                width: 4, height: 22, borderRadius: 1,
                background: `linear-gradient(135deg, ${T.indigo}, ${T.violet})`,
              }}
            />
            <Typography
              sx={{
                fontFamily: T.fontDisplay, fontWeight: 700,
                fontSize: '0.95rem', color: T.textPrimary,
              }}
            >
              All Notifications
            </Typography>
            <Chip
              label={filtered.length}
              size="small"
              sx={{
                bgcolor: T.skySoft, color: '#0369a1',
                fontWeight: 700, fontSize: '0.68rem',
                height: 22, borderRadius: 999,
              }}
            />
          </Stack>
          <TextField
            size="small"
            placeholder="Search by user, title, message..."
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
              width: { xs: '100%', md: 320 },
              '& .MuiOutlinedInput-root': {
                borderRadius: 2, bgcolor: T.surfaceSoft,
                '& fieldset': { borderColor: T.border },
                '&:hover fieldset': { borderColor: '#c7d2fe' },
                '&.Mui-focused fieldset': { borderColor: T.indigo, borderWidth: 1.5 },
              },
            }}
          />
        </Stack>

        {loading ? (
          <Loader />
        ) : isMobile ? (
          renderMobileCards()
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
                bgcolor: T.surfaceSoft, fontWeight: 700,
                color: T.textMuted, fontSize: '0.72rem',
                letterSpacing: '0.05em', textTransform: 'uppercase',
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
                display: 'flex', alignItems: 'center', py: 0,
              },
              '& .MuiDataGrid-cell:focus': { outline: 'none' },
              '& .MuiDataGrid-columnSeparator': { display: 'none' },
              '& .MuiDataGrid-footerContainer': { borderTop: `1px solid ${T.border}` },
              '& .MuiDataGrid-toolbarContainer': {
                p: 1, borderBottom: `1px solid ${T.border}`,
              },
            }}
          />
        )}
      </Paper>

      {/* ═══════ View Modal ═══════ */}
      <Dialog
        open={!!viewNotification}
        onClose={() => setViewNotification(null)}
        maxWidth="sm"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: T.radius } } }}
      >
        <DialogTitle
          sx={{
            fontWeight: 700, fontSize: '1.05rem', color: T.textPrimary,
            display: 'flex', alignItems: 'center', gap: 1,
            borderBottom: `1px solid ${T.border}`,
          }}
        >
          <Box
            sx={{
              width: 32, height: 32, borderRadius: 1.5,
              bgcolor: T.skySoft, color: '#0369a1',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <FaBell size={14} />
          </Box>
          Notification Details
        </DialogTitle>
        <DialogContent dividers sx={{ p: 3, borderColor: T.border }}>
          {viewNotification && (
            <Stack spacing={2.5}>
              <Box>
                <Typography
                  sx={{
                    fontSize: '0.62rem', color: T.textFaint,
                    fontWeight: 700, letterSpacing: '0.06em',
                    textTransform: 'uppercase', mb: 0.75,
                  }}
                >
                  Recipient
                </Typography>
                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <Avatar
                    src={viewNotification.user?.profileImage}
                    sx={{
                      width: 40, height: 40, fontSize: 14,
                      background: `linear-gradient(135deg, ${T.indigo}, ${T.violet})`,
                      fontWeight: 700,
                    }}
                  >
                    {viewNotification.user?.firstName?.charAt(0) || 'U'}
                  </Avatar>
                  <Typography sx={{ fontSize: '0.9rem', fontWeight: 700, color: T.textPrimary }}>
                    {getUserName(viewNotification.user)}
                  </Typography>
                  {viewNotification.user?.role && (
                    <Chip
                      label={viewNotification.user.role}
                      size="small"
                      sx={{
                        bgcolor: getRoleColor(viewNotification.user.role).bg,
                        color: getRoleColor(viewNotification.user.role).color,
                        fontWeight: 700, fontSize: '0.65rem',
                        height: 22, borderRadius: 999,
                      }}
                    />
                  )}
                </Stack>
              </Box>
              <Divider sx={{ borderColor: T.border }} />
              <Box>
                <Typography
                  sx={{
                    fontSize: '0.62rem', color: T.textFaint,
                    fontWeight: 700, letterSpacing: '0.06em',
                    textTransform: 'uppercase', mb: 0.5,
                  }}
                >
                  Title
                </Typography>
                <Typography sx={{ fontSize: '0.9rem', fontWeight: 700, color: T.textPrimary }}>
                  {viewNotification.title}
                </Typography>
              </Box>
              <Box>
                <Typography
                  sx={{
                    fontSize: '0.62rem', color: T.textFaint,
                    fontWeight: 700, letterSpacing: '0.06em',
                    textTransform: 'uppercase', mb: 0.5,
                  }}
                >
                  Message
                </Typography>
                <Typography sx={{ fontSize: '0.85rem', color: T.textPrimary, lineHeight: 1.6 }}>
                  {viewNotification.message}
                </Typography>
              </Box>
              <Divider sx={{ borderColor: T.border }} />
              <Stack direction="row" spacing={3} sx={{ flexWrap: 'wrap', gap: 2 }}>
                <Box>
                  <Typography
                    sx={{
                      fontSize: '0.62rem', color: T.textFaint,
                      fontWeight: 700, letterSpacing: '0.06em',
                      textTransform: 'uppercase', mb: 0.5,
                    }}
                  >
                    Type
                  </Typography>
                  <Chip
                    label={viewNotification.type}
                    size="small"
                    sx={{
                      bgcolor: getTypeStyle(viewNotification.type).bg,
                      color: getTypeStyle(viewNotification.type).color,
                      fontWeight: 700, fontSize: '0.65rem',
                      height: 22, borderRadius: 999,
                    }}
                  />
                </Box>
                <Box>
                  <Typography
                    sx={{
                      fontSize: '0.62rem', color: T.textFaint,
                      fontWeight: 700, letterSpacing: '0.06em',
                      textTransform: 'uppercase', mb: 0.5,
                    }}
                  >
                    Status
                  </Typography>
                  <Chip
                    label={viewNotification.isRead ? 'Read' : 'Unread'}
                    size="small"
                    sx={{
                      bgcolor: viewNotification.isRead ? '#f1f5f9' : T.amberSoft,
                      color: viewNotification.isRead ? '#475569' : '#b45309',
                      fontWeight: 700, fontSize: '0.65rem',
                      height: 22, borderRadius: 999,
                    }}
                  />
                </Box>
                <Box>
                  <Typography
                    sx={{
                      fontSize: '0.62rem', color: T.textFaint,
                      fontWeight: 700, letterSpacing: '0.06em',
                      textTransform: 'uppercase', mb: 0.5,
                    }}
                  >
                    Date
                  </Typography>
                  <Typography sx={{ fontSize: '0.8rem', color: T.textPrimary, fontWeight: 600 }}>
                    {new Date(viewNotification.createdAt).toLocaleString('en-IN')}
                  </Typography>
                </Box>
              </Stack>
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setViewNotification(null)}
            sx={{ textTransform: 'none', fontWeight: 600, color: T.textMuted }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Notifications;