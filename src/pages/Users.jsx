import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  Box, Paper, Typography, TextField, Button, IconButton, Chip, Avatar,
  Stack, Tooltip, InputAdornment, Dialog, DialogTitle, DialogActions,
  useMediaQuery, useTheme, Card, CardContent, FormControl, Select, MenuItem, InputLabel,
} from '@mui/material';
import { Search, Delete, Visibility, Block, LockOpen } from '@mui/icons-material';
import { DataGrid, GridToolbarContainer, GridToolbarFilterButton, GridToolbarExport } from '@mui/x-data-grid';
import { fetchUsers, updateUserStatus, deleteUser, setPage, setLimit } from '../redux/slices/userSlice';
import { blockUser, unblockUserByUserId, getBlocks } from '../api/admin'; // ✅ new import
import Loader from '../components/Loader';
import PanelHeader from '../components/PanelHeader';
import ExportButtons from '../components/ExportButtons';
import { COLORS } from '../theme/dashboardTheme';

const getImageUrl = (path) => {
  if (!path) return 'https://via.placeholder.com/40';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://local-guider-backend.onrender.com/api/v1';
  const baseUrl = API_BASE_URL.replace('/api/v1', '');
  return `${baseUrl}${path.startsWith('/') ? path : '/' + path}`;
};

const getFullName = (user) => {
  if (user.fullName) return user.fullName;
  if (user.firstName && user.lastName) return `${user.firstName} ${user.lastName}`;
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
  const { items, total, loading, pagination } = useSelector((state) => state.users);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [blockConfirm, setBlockConfirm] = useState(null);
  const [unblockConfirm, setUnblockConfirm] = useState(null);
  const [blockedUsers, setBlockedUsers] = useState([]);

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
      const data = res.data?.data || [];
      setBlockedUsers(data);
    } catch (error) {
      console.error('Error fetching blocked users:', error);
      setBlockedUsers([]);
    }
  };

  useEffect(() => {
    fetchBlockedUsers();
  }, []);

  useEffect(() => {
    const params = {
      page: pagination.page,
      limit: pagination.limit,
      search: searchTerm || undefined,
      role: roleFilter !== 'ALL' ? roleFilter : undefined,
      status: statusFilter !== 'ALL' ? statusFilter : undefined,
    };
    dispatch(fetchUsers(params));
  }, [dispatch, pagination.page, pagination.limit, searchTerm, roleFilter, statusFilter]);

  const handleDelete = async (id) => {
    try {
      await dispatch(deleteUser(id)).unwrap();
      toast.success('User deleted successfully');
      setDeleteConfirm(null);
    } catch {
      toast.error('Delete failed');
    }
  };

  const handleBlock = async (id) => {
    try {
      await blockUser(id, 'Blocked by admin');
      toast.success('User blocked successfully');
      setBlockConfirm(null);
      fetchBlockedUsers();
      dispatch(fetchUsers({ page: pagination.page, limit: pagination.limit, search: searchTerm, role: roleFilter !== 'ALL' ? roleFilter : undefined, status: statusFilter !== 'ALL' ? statusFilter : undefined }));
    } catch (error) {
      toast.error(error.response?.data?.message || 'Block failed');
    }
  };

  // ✅ Unblock by userId (saare blocks delete)
  const handleUnblock = async (userId) => {
    try {
      await unblockUserByUserId(userId);
      toast.success('User unblocked successfully');
      setUnblockConfirm(null);
      fetchBlockedUsers();
      dispatch(fetchUsers({ page: pagination.page, limit: pagination.limit, search: searchTerm, role: roleFilter !== 'ALL' ? roleFilter : undefined, status: statusFilter !== 'ALL' ? statusFilter : undefined }));
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unblock failed');
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await dispatch(updateUserStatus({ id, status })).unwrap();
      toast.success('User status updated');
    } catch (error) {
      toast.error(error.message || 'Update failed');
    }
  };

  const isUserBlocked = (userId) => blockedUsers.some(b => b.blockedUserId === userId);

  const columns = [
    { field: 'profileImage', headerName: 'Profile', flex: 0.5, minWidth: 80, renderCell: (params) => (
      <Avatar src={getImageUrl(params.row.profileImage || params.row.avatar)} alt={getFullName(params.row)} />
    )},
    { field: 'name', headerName: 'Name', flex: 1.2, minWidth: 120, renderCell: (params) => <Typography fontWeight={600}>{getFullName(params.row)}</Typography> },
    { field: 'email', headerName: 'Email', flex: 1.5, minWidth: 180, renderCell: (params) => <Typography variant="body2">{params.row.email || '—'}</Typography> },
    { field: 'phone', headerName: 'Phone', flex: 1, minWidth: 120, renderCell: (params) => <Typography variant="body2">{params.row.phone || '—'}</Typography> },
    { field: 'role', headerName: 'Role', flex: 0.7, minWidth: 100, renderCell: (params) => <Chip label={params.row.role} size="small" color={params.row.role === 'ADMIN' ? 'warning' : 'default'} /> },
    { field: 'status', headerName: 'Status', flex: 0.7, minWidth: 100, renderCell: (params) => {
      const isBlocked = isUserBlocked(params.row.id);
      return (
        <Chip
          label={isBlocked ? 'Blocked' : (params.row.isActive ? 'Active' : 'Inactive')}
          size="small"
          color={isBlocked ? 'error' : (params.row.isActive ? 'success' : 'default')}
          sx={{ fontWeight: 600 }}
        />
      );
    }},
    { field: 'createdAt', headerName: 'Created', flex: 0.8, minWidth: 100, renderCell: (params) => new Date(params.row.createdAt).toLocaleDateString() },
    { field: 'actions', headerName: 'Actions', flex: 1, minWidth: 150, renderCell: (params) => {
      const isBlocked = isUserBlocked(params.row.id);
      return (
        <Stack direction="row" spacing={0.5}>
          <Tooltip title="View">
            <IconButton onClick={() => navigate(`/users/${params.row.id}`)} sx={{ color: COLORS.sky }}>
              <Visibility />
            </IconButton>
          </Tooltip>
          {!isBlocked ? (
            <Tooltip title="Block User">
              <IconButton onClick={() => setBlockConfirm(params.row.id)} sx={{ color: '#F59E0B', bgcolor: '#FEF3C7', '&:hover': { bgcolor: '#FDE68A' } }}>
                <Block />
              </IconButton>
            </Tooltip>
          ) : (
            <Tooltip title="Unblock User">
              <IconButton onClick={() => setUnblockConfirm(params.row.id)} sx={{ color: '#10B981', bgcolor: '#D1FAE5', '&:hover': { bgcolor: '#A7F3D0' } }}>
                <LockOpen />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title="Delete">
            <IconButton onClick={() => setDeleteConfirm(params.row.id)} sx={{ color: COLORS.rose }}>
              <Delete />
            </IconButton>
          </Tooltip>
        </Stack>
      );
    }},
  ];

  const renderMobileCards = () => (
    <Stack spacing={2}>
      {items?.length > 0 ? items.map((user) => {
        const isBlocked = isUserBlocked(user.id);
        return (
          <Card key={user.id} sx={{ borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                <Avatar src={getImageUrl(user.profileImage || user.avatar)} alt={getFullName(user)} />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="subtitle1" fontWeight={600} noWrap>{getFullName(user)}</Typography>
                  <Typography variant="caption" color="textSecondary" noWrap>{user.email || '—'}</Typography>
                </Box>
                <Chip label={isBlocked ? 'Blocked' : user.role} size="small" color={isBlocked ? 'error' : 'default'} />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 1.5, borderTop: '1px solid #f1f5f9', pt: 1 }}>
                <Tooltip title="View">
                  <IconButton size="small" onClick={() => navigate(`/users/${user.id}`)} sx={{ color: COLORS.sky }}>
                    <Visibility fontSize="small" />
                  </IconButton>
                </Tooltip>
                {!isBlocked ? (
                  <Tooltip title="Block User">
                    <IconButton size="small" onClick={() => setBlockConfirm(user.id)} sx={{ color: '#F59E0B', bgcolor: '#FEF3C7' }}>
                      <Block fontSize="small" />
                    </IconButton>
                  </Tooltip>
                ) : (
                  <Tooltip title="Unblock User">
                    <IconButton size="small" onClick={() => setUnblockConfirm(user.id)} sx={{ color: '#10B981', bgcolor: '#D1FAE5' }}>
                      <LockOpen fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
                <Tooltip title="Delete">
                  <IconButton size="small" onClick={() => setDeleteConfirm(user.id)} sx={{ color: COLORS.rose }}>
                    <Delete fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            </CardContent>
          </Card>
        );
      }) : <Typography align="center" color="textSecondary" sx={{ py: 4 }}>No users found</Typography>}
    </Stack>
  );

  return (
    <Box className="fade-in" sx={{ p: { xs: 2, md: 3 }, mt: 0, pt: 1 }}>
      <PanelHeader eyebrow="User Management" title="All Users" />
      <Paper elevation={0} sx={{ p: 2, borderRadius: 4, border: '1px solid #e2e8f0', bgcolor: 'white', mb: 2 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
          <TextField fullWidth placeholder="Search users..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} size="small" InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }} />
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Role</InputLabel>
            <Select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} label="Role">
              <MenuItem value="ALL">All Roles</MenuItem>
              <MenuItem value="USER">User</MenuItem>
              <MenuItem value="GUIDER">Guider</MenuItem>
              <MenuItem value="PHOTOGRAPHER">Photographer</MenuItem>
              <MenuItem value="ADMIN">Admin</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Status</InputLabel>
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} label="Status">
              <MenuItem value="ALL">All Status</MenuItem>
              <MenuItem value="true">Active</MenuItem>
              <MenuItem value="false">Inactive</MenuItem>
            </Select>
          </FormControl>
          <ExportButtons data={items} headers={exportHeaders} filename="users" />
        </Stack>
      </Paper>

      {isMobile ? (loading ? <Loader /> : renderMobileCards()) : (
        <Paper elevation={0} sx={{ p: 2, borderRadius: 4, border: '1px solid #e2e8f0', bgcolor: 'white' }}>
          {loading ? <Loader /> : (
            <DataGrid rows={items} columns={columns} pageSize={pagination.limit} rowsPerPageOptions={[5, 10, 25]} page={pagination.page - 1} onPageChange={(p) => dispatch(setPage(p + 1))} onPageSizeChange={(s) => dispatch(setLimit(s))} components={{ Toolbar: CustomToolbar }} disableSelectionOnClick autoHeight sx={{ '& .MuiDataGrid-columnHeaders': { bgcolor: '#F8FAFC', fontWeight: 700, color: '#475569' }, '& .MuiDataGrid-row:hover': { bgcolor: '#F0F4FF' }, '& .MuiDataGrid-cell': { borderBottom: '1px solid #F1F5F9', padding: '8px' }, '& .MuiDataGrid-columnSeparator': { display: 'none' } }} />
          )}
        </Paper>
      )}

      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)}>
        <DialogTitle>Delete User?</DialogTitle>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm(null)}>Cancel</Button>
          <Button onClick={() => handleDelete(deleteConfirm)} color="error" variant="contained">Delete</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!blockConfirm} onClose={() => setBlockConfirm(null)}>
        <DialogTitle>Block User?</DialogTitle>
        <DialogActions>
          <Button onClick={() => setBlockConfirm(null)}>Cancel</Button>
          <Button onClick={() => handleBlock(blockConfirm)} color="warning" variant="contained">Block</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!unblockConfirm} onClose={() => setUnblockConfirm(null)}>
        <DialogTitle>Unblock User?</DialogTitle>
        <DialogActions>
          <Button onClick={() => setUnblockConfirm(null)}>Cancel</Button>
          <Button onClick={() => handleUnblock(unblockConfirm)} color="success" variant="contained">Unblock</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Users;
