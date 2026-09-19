// src/pages/Users.jsx
import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  Box, Paper, Typography, TextField, Button, IconButton, Chip, Avatar,
  Stack, Tooltip, InputAdornment, Dialog, DialogTitle, DialogActions,
  useMediaQuery, useTheme, FormControl, Select, MenuItem, InputLabel,
  CircularProgress, Divider,
} from '@mui/material';
import {
  Search, Delete, Visibility, Block, LockOpen, Refresh,
  PersonAdd, VerifiedUser,
} from '@mui/icons-material';
import { DataGrid, GridToolbarContainer, GridToolbarFilterButton, GridToolbarExport } from '@mui/x-data-grid';
import { fetchUsers, updateUserStatus, deleteUser, setPage, setLimit } from '../redux/slices/userSlice';
import { blockUser, unblockUserByUserId, getBlocks } from '../api/admin';
import Loader from '../components/Loader';
import PanelHeader from '../components/PanelHeader';
import ExportButtons from '../components/ExportButtons';
import { getFallbackAvatar, getImageUrl, getDisplayName } from '../utils/imageFallback';

// ═══════════════════════════════════════════════════════════════
// Theme tokens — consistent with Dashboard/Header/Sidebar
// ═══════════════════════════════════════════════════════════════
const COLORS = {
  border: '#e8ecf3',
  bgSurface: '#ffffff',
  bgSoft: '#fafbfd',
  bgRowHover: '#f5f7fb',
  textPrimary: '#0f172a',
  textMuted: '#64748b',
  textFaint: '#94a3b8',
  indigo: '#6366f1',
  purple: '#8b5cf6',
  emerald: '#10b981',
  rose: '#f43f5e',
  amber: '#f59e0b',
};

const ROLE_STYLES = {
  ADMIN: { bg: '#fef3c7', color: '#b45309' },
  GUIDER: { bg: '#ede9fe', color: '#6d28d9' },
  PHOTOGRAPHER: { bg: '#fce7f3', color: '#be185d' },
  USER: { bg: '#eef2ff', color: '#4338ca' },
};

// ═══════════════════════════════════════════════════════════════
// UserAvatar — gradient fallback
// ═══════════════════════════════════════════════════════════════
const UserAvatar = ({ user, size = 40 }) => {
  const displayName = getDisplayName(user);
  const fallback = getFallbackAvatar(displayName);
  const role = user?.role || 'USER';
  const gradient =
    role === 'ADMIN'
      ? 'linear-gradient(135deg, #f59e0b, #fbbf24)'
      : role === 'GUIDER'
      ? 'linear-gradient(135deg, #8b5cf6, #a78bfa)'
      : role === 'PHOTOGRAPHER'
      ? 'linear-gradient(135deg, #ec4899, #f472b6)'
      : 'linear-gradient(135deg, #6366f1, #8b5cf6)';

  return (
    <Avatar
      src={getImageUrl(user.profileImage || user.avatar, displayName)}
      alt={displayName}
      sx={{
        width: size,
        height: size,
        background: gradient,
        fontWeight: 700,
        fontSize: size * 0.4,
        border: '2px solid #fff',
        boxShadow: '0 2px 6px rgba(15,23,42,0.1)',
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
  );
};

const getFullName = (user) => {
  if (user.fullName) return user.fullName;
  if (user.firstName && user.lastName)
    return `${user.firstName} ${user.lastName}`;
  if (user.firstName) return user.firstName;
  if (user.name) return user.name;
  return '—';
};

const CustomToolbar = () => (
  <GridToolbarContainer sx={{ p: 1 }}>
    <GridToolbarFilterButton />
    <GridToolbarExport />
  </GridToolbarContainer>
);

const Users = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { items, total, loading, pagination } = useSelector(
    (state) => state.users
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [blockConfirm, setBlockConfirm] = useState(null);
  const [unblockConfirm, setUnblockConfirm] = useState(null);
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [processing, setProcessing] = useState(false);

  const exportHeaders = [
    { key: 'profileImage', label: 'Photo', isImage: true },
    { key: 'firstName', label: 'First Name' },
    { key: 'lastName', label: 'Last Name' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    { key: 'role', label: 'Role' },
    { key: 'isActive', label: 'Active' },
    { key: 'createdAt', label: 'Created At' },
  ];

  const fetchBlockedUsers = async () => {
    try {
      const res = await getBlocks();
      setBlockedUsers(res.data?.data || []);
    } catch (error) {
      console.error('Error fetching blocked users:', error);
      setBlockedUsers([]);
    }
  };

  const fetchUsersList = () => {
    const params = {
      page: pagination.page,
      limit: pagination.limit,
      search: searchTerm || undefined,
      role: roleFilter !== 'ALL' ? roleFilter : undefined,
      status: statusFilter !== 'ALL' ? statusFilter : undefined,
    };
    dispatch(fetchUsers(params));
  };

  useEffect(() => {
    fetchBlockedUsers();
  }, []);

  useEffect(() => {
    fetchUsersList();
  }, [dispatch, pagination.page, pagination.limit, searchTerm, roleFilter, statusFilter]);

  // Auto-refresh every 20 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchUsersList();
    }, 20000);
    return () => clearInterval(interval);
  }, [pagination.page, pagination.limit, searchTerm, roleFilter, statusFilter]);

  const handleDelete = async (id) => {
    try {
      setProcessing(true);
      await dispatch(deleteUser(id)).unwrap();
      toast.success('User deleted successfully');
      setDeleteConfirm(null);
      fetchUsersList();
    } catch (error) {
      toast.error(error?.message || error || 'Delete failed');
    } finally {
      setProcessing(false);
    }
  };

  const handleBlock = async (id) => {
    try {
      setProcessing(true);
      await blockUser(id, 'Blocked by admin');
      toast.success('User blocked successfully');
      setBlockConfirm(null);
      fetchBlockedUsers();
      fetchUsersList();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Block failed');
    } finally {
      setProcessing(false);
    }
  };

  const handleUnblock = async (userId) => {
    try {
      setProcessing(true);
      await unblockUserByUserId(userId);
      toast.success('User unblocked successfully');
      setUnblockConfirm(null);
      fetchBlockedUsers();
      fetchUsersList();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unblock failed');
    } finally {
      setProcessing(false);
    }
  };

  const isUserBlocked = (userId) =>
    blockedUsers.some((b) => b.blockedUserId === userId);

  // ═══════════════════════════════════════════════════════════════
  // DataGrid columns
  // ═══════════════════════════════════════════════════════════════
  const columns = [
    {
      field: 'profileImage',
      headerName: 'Profile',
      flex: 0.5,
      minWidth: 80,
      renderCell: (params) => <UserAvatar user={params.row} size={38} />,
    },
    {
      field: 'name',
      headerName: 'Name',
      flex: 1.2,
      minWidth: 140,
      renderCell: (params) => (
        <Box sx={{ minWidth: 0 }}>
          <Typography
            sx={{
              fontSize: '0.85rem',
              fontWeight: 700,
              color: COLORS.textPrimary,
              lineHeight: 1.2,
            }}
            noWrap
          >
            {getFullName(params.row)}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'email',
      headerName: 'Email',
      flex: 1.5,
      minWidth: 180,
      renderCell: (params) => (
        <Typography
          sx={{ fontSize: '0.78rem', color: COLORS.textMuted }}
          noWrap
        >
          {params.row.email || '—'}
        </Typography>
      ),
    },
    {
      field: 'phone',
      headerName: 'Phone',
      flex: 1,
      minWidth: 120,
      renderCell: (params) => (
        <Typography
          sx={{ fontSize: '0.78rem', color: COLORS.textMuted }}
          noWrap
        >
          {params.row.phone || '—'}
        </Typography>
      ),
    },
    {
      field: 'role',
      headerName: 'Role',
      flex: 0.7,
      minWidth: 110,
      renderCell: (params) => {
        const style = ROLE_STYLES[params.row.role] || ROLE_STYLES.USER;
        return (
          <Chip
            label={params.row.role}
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
      renderCell: (params) => {
        const isBlocked = isUserBlocked(params.row.id);
        const label = isBlocked
          ? 'Blocked'
          : params.row.isActive
          ? 'Active'
          : 'Inactive';
        const bg = isBlocked
          ? '#fee2e2'
          : params.row.isActive
          ? '#d1fae5'
          : '#f1f5f9';
        const color = isBlocked
          ? '#dc2626'
          : params.row.isActive
          ? '#059669'
          : '#64748b';
        return (
          <Chip
            label={label}
            size="small"
            sx={{
              bgcolor: bg,
              color,
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
      headerName: 'Joined',
      flex: 0.8,
      minWidth: 100,
      renderCell: (params) => (
        <Typography sx={{ fontSize: '0.75rem', color: COLORS.textMuted }}>
          {new Date(params.row.createdAt).toLocaleDateString('en-IN', {
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
      flex: 1,
      minWidth: 160,
      sortable: false,
      renderCell: (params) => {
        const isBlocked = isUserBlocked(params.row.id);
        return (
          <Stack direction="row" spacing={0.5} alignItems="center">
            <Tooltip title="View details">
              <IconButton
                size="small"
                onClick={() => navigate(`/users/${params.row.id}`)}
                sx={{
                  bgcolor: '#eef2ff',
                  color: COLORS.indigo,
                  '&:hover': { bgcolor: '#e0e7ff' },
                  width: 32,
                  height: 32,
                }}
              >
                <Visibility sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>

            {!isBlocked ? (
              <Tooltip title="Block user">
                <IconButton
                  size="small"
                  onClick={() => setBlockConfirm(params.row.id)}
                  sx={{
                    bgcolor: '#fef3c7',
                    color: '#b45309',
                    '&:hover': { bgcolor: '#fde68a' },
                    width: 32,
                    height: 32,
                  }}
                >
                  <Block sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>
            ) : (
              <Tooltip title="Unblock user">
                <IconButton
                  size="small"
                  onClick={() => setUnblockConfirm(params.row.id)}
                  sx={{
                    bgcolor: '#d1fae5',
                    color: '#059669',
                    '&:hover': { bgcolor: '#a7f3d0' },
                    width: 32,
                    height: 32,
                  }}
                >
                  <LockOpen sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>
            )}

            <Tooltip title="Delete user">
              <IconButton
                size="small"
                onClick={() => setDeleteConfirm(params.row.id)}
                sx={{
                  bgcolor: '#fee2e2',
                  color: COLORS.rose,
                  '&:hover': { bgcolor: '#fecaca' },
                  width: 32,
                  height: 32,
                }}
              >
                <Delete sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>
          </Stack>
        );
      },
    },
  ];

  // ═══════════════════════════════════════════════════════════════
  // Mobile cards
  // ═══════════════════════════════════════════════════════════════
  const renderMobileCards = () => (
    <Stack spacing={2}>
      {items?.length > 0 ? (
        items.map((user) => {
          const isBlocked = isUserBlocked(user.id);
          const roleStyle = ROLE_STYLES[user.role] || ROLE_STYLES.USER;
          return (
            <Paper
              key={user.id}
              elevation={0}
              sx={{
                borderRadius: 3,
                border: `1px solid ${COLORS.border}`,
                bgcolor: COLORS.bgSurface,
                p: 2,
                transition: 'all 0.2s ease',
                '&:hover': {
                  boxShadow: '0 8px 20px -8px rgba(15,23,42,0.12)',
                  borderColor: 'transparent',
                },
              }}
            >
              <Stack
                direction="row"
                alignItems="center"
                spacing={1.5}
                sx={{ mb: 1.5 }}
              >
                <UserAvatar user={user} size={44} />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    sx={{
                      fontSize: '0.9rem',
                      fontWeight: 700,
                      color: COLORS.textPrimary,
                      lineHeight: 1.2,
                    }}
                    noWrap
                  >
                    {getFullName(user)}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: '0.72rem',
                      color: COLORS.textMuted,
                      mt: 0.2,
                    }}
                    noWrap
                  >
                    {user.email || '—'}
                  </Typography>
                </Box>
                <Chip
                  label={user.role || 'USER'}
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

              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                sx={{
                  pt: 1.5,
                  borderTop: `1px solid ${COLORS.border}`,
                }}
              >
                <Chip
                  label={
                    isBlocked
                      ? 'Blocked'
                      : user.isActive
                      ? 'Active'
                      : 'Inactive'
                  }
                  size="small"
                  sx={{
                    bgcolor: isBlocked
                      ? '#fee2e2'
                      : user.isActive
                      ? '#d1fae5'
                      : '#f1f5f9',
                    color: isBlocked
                      ? '#dc2626'
                      : user.isActive
                      ? '#059669'
                      : '#64748b',
                    fontWeight: 700,
                    fontSize: '0.62rem',
                    height: 22,
                    borderRadius: 999,
                  }}
                />
                <Stack direction="row" spacing={0.5}>
                  <IconButton
                    size="small"
                    onClick={() => navigate(`/users/${user.id}`)}
                    sx={{
                      bgcolor: '#eef2ff',
                      color: COLORS.indigo,
                      width: 30,
                      height: 30,
                    }}
                  >
                    <Visibility sx={{ fontSize: 15 }} />
                  </IconButton>
                  {!isBlocked ? (
                    <IconButton
                      size="small"
                      onClick={() => setBlockConfirm(user.id)}
                      sx={{
                        bgcolor: '#fef3c7',
                        color: '#b45309',
                        width: 30,
                        height: 30,
                      }}
                    >
                      <Block sx={{ fontSize: 15 }} />
                    </IconButton>
                  ) : (
                    <IconButton
                      size="small"
                      onClick={() => setUnblockConfirm(user.id)}
                      sx={{
                        bgcolor: '#d1fae5',
                        color: '#059669',
                        width: 30,
                        height: 30,
                      }}
                    >
                      <LockOpen sx={{ fontSize: 15 }} />
                    </IconButton>
                  )}
                  <IconButton
                    size="small"
                    onClick={() => setDeleteConfirm(user.id)}
                    sx={{
                      bgcolor: '#fee2e2',
                      color: COLORS.rose,
                      width: 30,
                      height: 30,
                    }}
                  >
                    <Delete sx={{ fontSize: 15 }} />
                  </IconButton>
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
            borderRadius: 3,
            border: `1px dashed ${COLORS.border}`,
            textAlign: 'center',
          }}
        >
          <PersonAdd sx={{ fontSize: 40, color: COLORS.textFaint, mb: 1 }} />
          <Typography sx={{ color: COLORS.textFaint, fontWeight: 500 }}>
            No users found
          </Typography>
        </Paper>
      )}
    </Stack>
  );

  return (
    <Box className="fade-in" sx={{ p: { xs: 2, md: 3 } }}>
      <PanelHeader eyebrow="User Management" title="All Users" />

      {/* ═══════════════════════════════════════════
          Filters
          ═══════════════════════════════════════════ */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          borderRadius: 3,
          border: `1px solid ${COLORS.border}`,
          bgcolor: COLORS.bgSurface,
          mb: 2,
        }}
      >
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          alignItems="center"
        >
          <TextField
            fullWidth
            placeholder="Search by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            size="small"
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ fontSize: 18, color: COLORS.textFaint }} />
                  </InputAdornment>
                ),
              },
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                bgcolor: COLORS.bgSoft,
                '& fieldset': { borderColor: COLORS.border },
                '&:hover fieldset': { borderColor: '#c7d2fe' },
                '&.Mui-focused fieldset': {
                  borderColor: COLORS.indigo,
                  borderWidth: 1.5,
                },
              },
            }}
          />

          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Role</InputLabel>
            <Select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              label="Role"
              sx={{ borderRadius: 2, bgcolor: COLORS.bgSoft }}
            >
              <MenuItem value="ALL">All Roles</MenuItem>
              <MenuItem value="USER">User</MenuItem>
              <MenuItem value="GUIDER">Guider</MenuItem>
              <MenuItem value="PHOTOGRAPHER">Photographer</MenuItem>
              <MenuItem value="ADMIN">Admin</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 130 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              label="Status"
              sx={{ borderRadius: 2, bgcolor: COLORS.bgSoft }}
            >
              <MenuItem value="ALL">All Status</MenuItem>
              <MenuItem value="true">Active</MenuItem>
              <MenuItem value="false">Inactive</MenuItem>
            </Select>
          </FormControl>

          <Tooltip title="Refresh">
            <IconButton
              onClick={fetchUsersList}
              sx={{
                bgcolor: '#eef2ff',
                color: COLORS.indigo,
                width: 40,
                height: 40,
                '&:hover': { bgcolor: '#e0e7ff' },
              }}
            >
              <Refresh sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>

          <ExportButtons data={items} headers={exportHeaders} filename="users" />
        </Stack>
      </Paper>

      {/* ═══════════════════════════════════════════
          Table / Cards
          ═══════════════════════════════════════════ */}
      {isMobile ? (
        loading ? <Loader /> : renderMobileCards()
      ) : (
        <Paper
          elevation={0}
          sx={{
            p: 1,
            borderRadius: 3,
            border: `1px solid ${COLORS.border}`,
            bgcolor: COLORS.bgSurface,
            overflow: 'hidden',
          }}
        >
          {loading ? (
            <Loader />
          ) : (
            <DataGrid
              rows={items}
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
                  bgcolor: COLORS.bgSoft,
                  fontWeight: 700,
                  color: COLORS.textMuted,
                  fontSize: '0.72rem',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  borderBottom: `1px solid ${COLORS.border}`,
                  minHeight: '48px !important',
                },
                '& .MuiDataGrid-columnHeaderTitle': {
                  fontWeight: 700,
                },
                '& .MuiDataGrid-row': {
                  borderBottom: `1px solid ${COLORS.border}`,
                  transition: 'background-color 0.15s ease',
                },
                '& .MuiDataGrid-row:hover': {
                  bgcolor: COLORS.bgRowHover,
                },
                '& .MuiDataGrid-cell': {
                  borderBottom: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  py: 0,
                },
                '& .MuiDataGrid-cell:focus': { outline: 'none' },
                '& .MuiDataGrid-columnSeparator': { display: 'none' },
                '& .MuiDataGrid-footerContainer': {
                  borderTop: `1px solid ${COLORS.border}`,
                },
                '& .MuiDataGrid-toolbarContainer': {
                  p: 1,
                  borderBottom: `1px solid ${COLORS.border}`,
                },
              }}
            />
          )}
        </Paper>
      )}

      {/* ═══════════════════════════════════════════
          Dialogs
          ═══════════════════════════════════════════ */}
      <Dialog
        open={!!deleteConfirm}
        onClose={() => !processing && setDeleteConfirm(null)}
        PaperProps={{
          sx: { borderRadius: 3, p: 0.5 },
        }}
      >
        <DialogTitle
          sx={{
            fontWeight: 700,
            color: COLORS.textPrimary,
            fontSize: '1.05rem',
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
              bgcolor: '#fee2e2',
              color: COLORS.rose,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Delete sx={{ fontSize: 18 }} />
          </Box>
          Delete User?
        </DialogTitle>
        <Divider />
        <Box sx={{ px: 3, py: 2 }}>
          <Typography sx={{ fontSize: '0.85rem', color: COLORS.textMuted }}>
            This will permanently delete the user and all associated data
            (profile, wallet, bookings, reviews, chats). This action cannot be
            undone.
          </Typography>
        </Box>
        <DialogActions sx={{ p: 2, pt: 0, gap: 1 }}>
          <Button
            onClick={() => setDeleteConfirm(null)}
            disabled={processing}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              color: COLORS.textMuted,
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={() => handleDelete(deleteConfirm)}
            disabled={processing}
            variant="contained"
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              borderRadius: 2,
              bgcolor: COLORS.rose,
              '&:hover': { bgcolor: '#e11d48' },
              boxShadow: 'none',
            }}
          >
            {processing ? (
              <CircularProgress size={16} sx={{ color: '#fff' }} />
            ) : (
              'Delete User'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={!!blockConfirm}
        onClose={() => !processing && setBlockConfirm(null)}
        PaperProps={{ sx: { borderRadius: 3, p: 0.5 } }}
      >
        <DialogTitle
          sx={{
            fontWeight: 700,
            color: COLORS.textPrimary,
            fontSize: '1.05rem',
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
              bgcolor: '#fef3c7',
              color: '#b45309',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Block sx={{ fontSize: 18 }} />
          </Box>
          Block User?
        </DialogTitle>
        <Divider />
        <Box sx={{ px: 3, py: 2 }}>
          <Typography sx={{ fontSize: '0.85rem', color: COLORS.textMuted }}>
            The user won't be able to log in or access the platform.
          </Typography>
        </Box>
        <DialogActions sx={{ p: 2, pt: 0, gap: 1 }}>
          <Button
            onClick={() => setBlockConfirm(null)}
            disabled={processing}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              color: COLORS.textMuted,
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={() => handleBlock(blockConfirm)}
            disabled={processing}
            variant="contained"
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              borderRadius: 2,
              bgcolor: COLORS.amber,
              '&:hover': { bgcolor: '#d97706' },
              boxShadow: 'none',
            }}
          >
            {processing ? (
              <CircularProgress size={16} sx={{ color: '#fff' }} />
            ) : (
              'Block'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={!!unblockConfirm}
        onClose={() => !processing && setUnblockConfirm(null)}
        PaperProps={{ sx: { borderRadius: 3, p: 0.5 } }}
      >
        <DialogTitle
          sx={{
            fontWeight: 700,
            color: COLORS.textPrimary,
            fontSize: '1.05rem',
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
              bgcolor: '#d1fae5',
              color: '#059669',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <LockOpen sx={{ fontSize: 18 }} />
          </Box>
          Unblock User?
        </DialogTitle>
        <Divider />
        <Box sx={{ px: 3, py: 2 }}>
          <Typography sx={{ fontSize: '0.85rem', color: COLORS.textMuted }}>
            The user will be able to access the platform again.
          </Typography>
        </Box>
        <DialogActions sx={{ p: 2, pt: 0, gap: 1 }}>
          <Button
            onClick={() => setUnblockConfirm(null)}
            disabled={processing}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              color: COLORS.textMuted,
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={() => handleUnblock(unblockConfirm)}
            disabled={processing}
            variant="contained"
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              borderRadius: 2,
              bgcolor: COLORS.emerald,
              '&:hover': { bgcolor: '#059669' },
              boxShadow: 'none',
            }}
          >
            {processing ? (
              <CircularProgress size={16} sx={{ color: '#fff' }} />
            ) : (
              'Unblock'
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Users;