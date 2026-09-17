import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FaBell, FaPaperPlane, FaEye, FaUserCircle } from 'react-icons/fa';
import { toast } from 'react-toastify';
import {
  Box, Paper, Typography, TextField, Select, MenuItem, FormControl,
  InputLabel, Button, CircularProgress, Chip, Stack, Alert,
  useMediaQuery, useTheme, Card, CardContent, Avatar, Dialog, DialogTitle,
  DialogContent, DialogActions, IconButton, Divider, Tooltip,
} from '@mui/material';
import { DataGrid, GridToolbarContainer, GridToolbarExport, GridToolbarFilterButton } from '@mui/x-data-grid';
import { fetchNotifications, sendBroadcast, clearError, setPage, setLimit } from '../redux/slices/notificationSlice';
import Loader from '../components/Loader';
import PanelHeader from '../components/PanelHeader';
import SearchIcon from '@mui/icons-material/Search';
import { COLORS, FONT_DISPLAY } from '../theme/dashboardTheme';

const CustomToolbar = () => (
  <GridToolbarContainer sx={{ p: 1 }}>
    <GridToolbarFilterButton />
    <GridToolbarExport />
  </GridToolbarContainer>
);

const FIELD_HEIGHT = 52;

const Notifications = () => {
  const dispatch = useDispatch();
  const isMobile = useMediaQuery(useTheme().breakpoints.down('md'));
  const { items, loading, sending, error, pagination } = useSelector((state) => state.notifications);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState('SYSTEM');
  const [targetRole, setTargetRole] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewNotification, setViewNotification] = useState(null);

  useEffect(() => {
    dispatch(fetchNotifications({ page: pagination.page, limit: pagination.limit }));
    return () => dispatch(clearError());
  }, [dispatch, pagination.page, pagination.limit]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      toast.error('Title and Message are required');
      return;
    }
    try {
      const result = await dispatch(sendBroadcast({ title, message, type, targetRole })).unwrap();
      toast.success(`Notification sent to ${result.count || 'users'} successfully`);
      setTitle('');
      setMessage('');
      dispatch(fetchNotifications({ page: pagination.page, limit: pagination.limit }));
    } catch (err) {
      toast.error(err || 'Failed to send notification');
    }
  };

  const filtered = (items || []).filter(item =>
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

  const getRoleColor = (role) => {
    switch (role) {
      case 'GUIDER': return { bg: '#F3E8FF', color: '#7C3AED' };
      case 'PHOTOGRAPHER': return { bg: '#FCE7F3', color: '#DB2777' };
      case 'ADMIN': return { bg: '#FEF3C7', color: '#D97706' };
      default: return { bg: '#DBEAFE', color: '#2563EB' };
    }
  };

  const columns = [
    {
      field: 'user',
      headerName: 'User',
      flex: 1.3,
      minWidth: 190,
      renderCell: (params) => {
        const user = params.row.user;
        if (!user) return (
          <Stack direction="row" alignItems="center" spacing={1}>
            <Avatar sx={{ width: 32, height: 32, bgcolor: '#F1F5F9', color: '#94A3B8' }}>
              <FaUserCircle size={20} />
            </Avatar>
            <Typography variant="body2" sx={{ color: '#94A3B8', fontWeight: 500 }}>Broadcast</Typography>
          </Stack>
        );
        const roleColors = getRoleColor(user.role);
        return (
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Avatar src={user.profileImage} sx={{ width: 36, height: 36, fontSize: 14, bgcolor: '#E2E8F0' }}>
              {user.firstName?.charAt(0) || 'U'}
            </Avatar>
            <Stack spacing={0.2}>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#1E293B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 120 }}>
                {getUserName(user)}
              </Typography>
              <Chip label={user.role || 'USER'} size="small" sx={{
                bgcolor: roleColors.bg,
                color: roleColors.color,
                fontWeight: 700,
                height: 18,
                fontSize: '0.6rem',
              }} />
            </Stack>
          </Stack>
        );
      }
    },
    {
      field: 'title',
      headerName: 'Title',
      flex: 1.3,
      minWidth: 140,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontWeight: 600, color: '#1E293B' }}>{params.row.title}</Typography>
      )
    },
    {
      field: 'message',
      headerName: 'Message',
      flex: 2.2,
      minWidth: 220,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ color: '#475569', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {params.row.message}
        </Typography>
      )
    },
    {
      field: 'type',
      headerName: 'Type',
      flex: 0.7,
      minWidth: 90,
      renderCell: (params) => (
        <Chip label={params.row.type} size="small" sx={{
          bgcolor: params.row.type === 'OFFER' ? '#D1FAE5' :
                   params.row.type === 'BOOKING' ? '#DBEAFE' :
                   params.row.type === 'CHAT' ? '#F3E8FF' : '#F1F5F9',
          color: params.row.type === 'OFFER' ? '#047857' :
                 params.row.type === 'BOOKING' ? '#1D4ED8' :
                 params.row.type === 'CHAT' ? '#7C3AED' : '#334155',
          fontWeight: 600,
          fontSize: '0.7rem'
        }} />
      )
    },
    {
      field: 'isRead',
      headerName: 'Status',
      flex: 0.6,
      minWidth: 85,
      renderCell: (params) => (
        <Chip label={params.row.isRead ? 'Read' : 'Unread'} size="small" sx={{
          bgcolor: params.row.isRead ? '#F1F5F9' : '#FEF3C7',
          color: params.row.isRead ? '#475569' : '#B45309',
          fontWeight: 600
        }} />
      )
    },
    {
      field: 'createdAt',
      headerName: 'Date',
      flex: 1,
      minWidth: 140,
      renderCell: (params) => (
        <Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.75rem' }}>
          {new Date(params.row.createdAt).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
          })}{' '}
          <span style={{ color: '#94A3B8' }}>
            {new Date(params.row.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </Typography>
      )
    },
    {
      field: 'actions',
      headerName: 'Actions',
      flex: 0.4,
      minWidth: 65,
      sortable: false,
      renderCell: (params) => (
        <Tooltip title="View Details">
          <IconButton size="small" onClick={() => setViewNotification(params.row)} sx={{ color: COLORS.sky, '&:hover': { bgcolor: '#E0F2FE' } }}>
            <FaEye size={14} />
          </IconButton>
        </Tooltip>
      )
    },
  ];

  const renderMobileCards = () => (
    <Stack spacing={2}>
      {filtered.length > 0 ? filtered.map((notif) => {
        const user = notif.user;
        const roleColors = getRoleColor(user?.role);
        return (
          <Card key={notif.id} sx={{ borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Avatar src={user?.profileImage} sx={{ width: 32, height: 32, fontSize: 14 }}>
                    {user?.firstName?.charAt(0) || 'U'}
                  </Avatar>
                  <Typography variant="subtitle2" fontWeight={600}>
                    {getUserName(user)}
                  </Typography>
                </Stack>
                <Chip label={notif.type} size="small" color={notif.type === 'OFFER' ? 'success' : notif.type === 'BOOKING' ? 'info' : 'default'} />
              </Stack>
              <Typography variant="body2" fontWeight={600}>{notif.title}</Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>{notif.message}</Typography>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Chip label={notif.isRead ? 'Read' : 'Unread'} size="small" color={notif.isRead ? 'default' : 'warning'} />
                <Typography variant="caption">{new Date(notif.createdAt).toLocaleString()}</Typography>
              </Stack>
              <Stack direction="row" justifyContent="flex-end" sx={{ mt: 1 }}>
                <Tooltip title="View Details">
                  <IconButton size="small" onClick={() => setViewNotification(notif)} sx={{ color: COLORS.sky }}>
                    <FaEye />
                  </IconButton>
                </Tooltip>
              </Stack>
            </CardContent>
          </Card>
        );
      }) : <Typography align="center" color="textSecondary" sx={{ py: 4 }}>No notifications found</Typography>}
    </Stack>
  );

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: '#F8FAFC', minHeight: '100vh' }}>
      <PanelHeader eyebrow="Communication" title="Notifications & Broadcast" />

      {/* ✅ Flat single-row Send Broadcast form */}
      <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid #E2E8F0', bgcolor: 'white', mb: 3 }}>
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
          <Box sx={{ width: 48, height: 48, borderRadius: '14px', background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: '0 4px 12px rgba(99,102,241,0.3)' }}>
            <FaBell size={22} />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={700} sx={{ fontFamily: FONT_DISPLAY, fontSize: '1.1rem' }}>Send Broadcast</Typography>
            <Typography variant="body2" color="textSecondary">Send push notification to all users or specific role</Typography>
          </Box>
        </Stack>

        {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}

        <Box
          sx={{
            display: 'flex',
            flexWrap: { xs: 'wrap', lg: 'nowrap' },
            gap: 2,
            width: '100%',
            alignItems: 'flex-start',
          }}
        >
          {/* Title */}
          <Box sx={{ flex: '1.4 1 0', minWidth: { xs: '100%', sm: 180 } }}>
            <TextField
              label="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              fullWidth
              required
              InputLabelProps={{ shrink: true, style: { fontWeight: 600, fontSize: '0.85rem' } }}
              sx={{
                '& .MuiOutlinedInput-root': { borderRadius: '12px', height: FIELD_HEIGHT },
              }}
            />
          </Box>

          {/* Notification Type */}
          <Box sx={{ flex: '1 1 0', minWidth: { xs: '100%', sm: 150 } }}>
            <FormControl fullWidth sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px', height: FIELD_HEIGHT } }}>
              <InputLabel shrink style={{ fontWeight: 600, fontSize: '0.85rem', background: '#fff', paddingRight: 4 }}>
                Notification Type
              </InputLabel>
              <Select value={type} onChange={(e) => setType(e.target.value)} notched label="Notification Type">
                <MenuItem value="SYSTEM">System</MenuItem>
                <MenuItem value="BOOKING">Booking</MenuItem>
                <MenuItem value="PAYMENT">Payment</MenuItem>
                <MenuItem value="OFFER">Offer</MenuItem>
                <MenuItem value="CHAT">Chat</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {/* Audience */}
          <Box sx={{ flex: '1 1 0', minWidth: { xs: '100%', sm: 150 } }}>
            <FormControl fullWidth sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px', height: FIELD_HEIGHT } }}>
              <InputLabel shrink style={{ fontWeight: 600, fontSize: '0.85rem', background: '#fff', paddingRight: 4 }}>
                Audience
              </InputLabel>
              <Select value={targetRole} onChange={(e) => setTargetRole(e.target.value)} notched label="Audience">
                <MenuItem value="ALL">All Users</MenuItem>
                <MenuItem value="USER">Regular Users</MenuItem>
                <MenuItem value="GUIDER">Guiders</MenuItem>
                <MenuItem value="PHOTOGRAPHER">Photographers</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {/* Message */}
          <Box sx={{ flex: '2 1 0', minWidth: { xs: '100%', sm: 220 } }}>
            <TextField
              label="Message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              fullWidth
              required
              InputLabelProps={{ shrink: true, style: { fontWeight: 600, fontSize: '0.85rem' } }}
              sx={{
                '& .MuiOutlinedInput-root': { borderRadius: '12px', height: FIELD_HEIGHT },
              }}
            />
          </Box>

          {/* Send Button */}
          <Box sx={{ flex: '1.1 1 0', minWidth: { xs: '100%', sm: 170 } }}>
            <Button
              variant="contained"
              startIcon={sending ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : <FaPaperPlane size={14} />}
              onClick={handleSend}
              disabled={sending}
              fullWidth
              sx={{
                height: FIELD_HEIGHT,
                background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                '&:hover': { background: 'linear-gradient(135deg, #4F46E5, #7C3AED)' },
                borderRadius: '12px',
                fontWeight: 700,
                textTransform: 'none',
                fontSize: '0.9rem',
                whiteSpace: 'nowrap',
                boxShadow: '0 4px 12px rgba(99,102,241,0.3)',
              }}
            >
              Send Broadcast
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* All Notifications Table */}
      <Paper elevation={0} sx={{ p: 2, borderRadius: 4, border: '1px solid #E2E8F0', bgcolor: 'white' }}>
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography variant="h6" fontWeight={700} sx={{ fontFamily: FONT_DISPLAY }}>All Notifications</Typography>
            <Chip label={filtered.length} size="small" sx={{ bgcolor: '#E0F2FE', color: '#0284C7', fontWeight: 700 }} />
          </Stack>
          <TextField
            size="small"
            placeholder="Search by user, title, message..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ width: { xs: '100%', sm: 320 }, '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
            InputProps={{ startAdornment: (<SearchIcon sx={{ mr: 1, color: '#94A3B8' }} />) }}
          />
        </Box>

        {loading ? <Loader /> : isMobile ? renderMobileCards() : (
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
            sx={{
              '& .MuiDataGrid-columnHeaders': {
                bgcolor: '#F8FAFC',
                fontWeight: 700,
                color: '#475569',
                fontSize: '0.85rem',
                borderBottom: '2px solid #E2E8F0',
              },
              '& .MuiDataGrid-row:hover': { bgcolor: '#F8FAFC' },
              '& .MuiDataGrid-cell': { borderBottom: '1px solid #F1F5F9', py: 1.5 },
              '& .MuiDataGrid-columnSeparator': { display: 'none' },
              '& .MuiDataGrid-footerContainer': { borderTop: '1px solid #E2E8F0' },
              borderRadius: 2,
            }}
          />
        )}
      </Paper>

      {/* View Notification Modal */}
      <Dialog open={!!viewNotification} onClose={() => setViewNotification(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 700 }}>
          <Box sx={{ width: 32, height: 32, borderRadius: '8px', bgcolor: '#E0F2FE', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284C7' }}>
            <FaBell size={16} />
          </Box>
          Notification Details
        </DialogTitle>
        <DialogContent dividers>
          {viewNotification && (
            <Stack spacing={2.5}>
              <Box>
                <Typography variant="caption" color="textSecondary" fontWeight={600}>To User</Typography>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 0.5 }}>
                  <Avatar src={viewNotification.user?.profileImage} sx={{ width: 36, height: 36, fontSize: 14 }}>
                    {viewNotification.user?.firstName?.charAt(0) || 'U'}
                  </Avatar>
                  <Typography variant="body1" fontWeight={600}>
                    {getUserName(viewNotification.user)}
                  </Typography>
                  {viewNotification.user?.role && (
                    <Chip label={viewNotification.user.role} size="small" sx={{ bgcolor: getRoleColor(viewNotification.user.role).bg, color: getRoleColor(viewNotification.user.role).color, fontWeight: 700 }} />
                  )}
                </Stack>
              </Box>
              <Divider />
              <Box>
                <Typography variant="caption" color="textSecondary" fontWeight={600}>Title</Typography>
                <Typography variant="body1" fontWeight={600} sx={{ mt: 0.5 }}>{viewNotification.title}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="textSecondary" fontWeight={600}>Message</Typography>
                <Typography variant="body1" sx={{ mt: 0.5, whiteSpace: 'pre-wrap', color: '#475569' }}>{viewNotification.message}</Typography>
              </Box>
              <Divider />
              <Stack direction="row" spacing={3}>
                <Box>
                  <Typography variant="caption" color="textSecondary" fontWeight={600}>Type</Typography>
                  <Chip label={viewNotification.type} size="small" color={viewNotification.type === 'OFFER' ? 'success' : viewNotification.type === 'BOOKING' ? 'info' : 'default'} sx={{ mt: 0.5 }} />
                </Box>
                <Box>
                  <Typography variant="caption" color="textSecondary" fontWeight={600}>Status</Typography>
                  <Chip label={viewNotification.isRead ? 'Read' : 'Unread'} size="small" color={viewNotification.isRead ? 'default' : 'warning'} sx={{ mt: 0.5 }} />
                </Box>
                <Box>
                  <Typography variant="caption" color="textSecondary" fontWeight={600}>Date</Typography>
                  <Typography variant="body2" sx={{ mt: 0.5 }}>{new Date(viewNotification.createdAt).toLocaleString()}</Typography>
                </Box>
              </Stack>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewNotification(null)} sx={{ color: '#64748B' }}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Notifications;