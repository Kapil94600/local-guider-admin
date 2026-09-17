// src/pages/WalletManagement.jsx
import { useEffect, useState } from 'react';
import {
  Box, Paper, Typography, TextField, InputAdornment, Stack, Chip, Avatar,
  Card, CardContent, Grid, IconButton, Tooltip, FormControl, InputLabel, Select, MenuItem,
} from '@mui/material';
import { Search, AccountBalanceWallet, TrendingUp, TrendingDown, Refresh } from '@mui/icons-material';
import { DataGrid, GridToolbarContainer, GridToolbarFilterButton, GridToolbarExport } from '@mui/x-data-grid';
import apiClient from '../api/axios';
import Loader from '../components/Loader';
import PanelHeader from '../components/PanelHeader';
import { COLORS, FONT_BODY, FONT_MONO, FONT_DISPLAY } from '../theme/dashboardTheme';

const CustomToolbar = () => (
  <GridToolbarContainer sx={{ p: 1 }}>
    <GridToolbarFilterButton />
    <GridToolbarExport />
  </GridToolbarContainer>
);

const WalletManagement = () => {
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // ✅ NEW
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    fetchWallets();
  }, []);

  const fetchWallets = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/wallet/all', { params: { limit: 100 } });
      const data = res.data?.data || res.data;
      setWallets(Array.isArray(data) ? data : (data.rows || []));
    } catch (error) {
      console.error('Error fetching wallets:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredWallets = wallets.filter((w) => {
    const userName = w.User?.firstName || w.User?.lastName || '';
    const userEmail = w.User?.email || '';
    const search = searchTerm.toLowerCase();
    const matchesSearch = userName.toLowerCase().includes(search) || userEmail.toLowerCase().includes(search);
    const matchesStatus = statusFilter === 'ALL' || (w.status || 'ACTIVE') === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Stats
  const totalBalance = wallets.reduce((sum, w) => sum + (parseFloat(w.balance) || 0), 0);
  const activeWallets = wallets.filter((w) => w.status === 'ACTIVE').length;
  const totalUsers = wallets.length;

  const columns = [
    {
      field: 'User',
      headerName: 'User',
      flex: 1.5,
      minWidth: 220,
      renderCell: (params) => (
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Avatar sx={{ width: 40, height: 40, bgcolor: '#1E3A6E', fontSize: 18 }}>{(params.row.User?.firstName || 'U').charAt(0)}</Avatar>
          <Box>
            <Typography variant="body2" fontWeight={600} sx={{ color: COLORS.textPrimary, fontSize: '0.85rem' }}>{params.row.User?.firstName} {params.row.User?.lastName}</Typography>
            <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.7rem' }}>{params.row.User?.email || 'N/A'}</Typography>
          </Box>
        </Stack>
      ),
    },
    {
      field: 'balance',
      headerName: 'Balance',
      flex: 0.8,
      minWidth: 120,
      renderCell: (params) => (
        <Typography fontWeight={700} sx={{ color: COLORS.emerald, fontFamily: FONT_MONO, fontSize: '0.9rem' }}>₹{parseFloat(params.row.balance).toFixed(2)}</Typography>
      ),
    },
    {
      field: 'currency',
      headerName: 'Currency',
      flex: 0.5,
      minWidth: 90,
      renderCell: (params) => <Chip label={params.row.currency || 'INR'} size="small" sx={{ fontWeight: 600 }} />,
    },
    {
      field: 'status',
      headerName: 'Status',
      flex: 0.6,
      minWidth: 100,
      renderCell: (params) => (
        <Chip label={params.row.status || 'ACTIVE'} size="small" sx={{ bgcolor: (params.row.status || 'ACTIVE') === 'ACTIVE' ? COLORS.emeraldSoft : COLORS.roseSoft, color: (params.row.status || 'ACTIVE') === 'ACTIVE' ? COLORS.emerald : COLORS.rose, fontWeight: 600 }} />
      ),
    },
    {
      field: 'createdAt',
      headerName: 'Created At',
      flex: 1,
      minWidth: 140,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontSize: '0.8rem', color: COLORS.textMuted }}>{new Date(params.row.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</Typography>
      ),
    },
  ];

  return (
    <Box className="fade-in" sx={{ p: { xs: 2, md: 3 }, mt: 0, pt: 1, bgcolor: '#F8FAFC', minHeight: '100vh' }}>
      <PanelHeader eyebrow="Finance" title="Wallet Management" />

      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid #E2E8F0', bgcolor: 'white', borderLeft: '4px solid #1E3A6E' }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <Box sx={{ width: 48, height: 48, borderRadius: 2, bgcolor: '#1E3A6E', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}><AccountBalanceWallet /></Box>
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>Total Wallets</Typography>
                  <Typography variant="h6" fontWeight={700} sx={{ fontFamily: FONT_MONO }}>{totalUsers}</Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid #E2E8F0', bgcolor: 'white', borderLeft: '4px solid #10B981' }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <Box sx={{ width: 48, height: 48, borderRadius: 2, bgcolor: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}><TrendingUp /></Box>
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>Total Balance</Typography>
                  <Typography variant="h6" fontWeight={700} sx={{ fontFamily: FONT_MONO, color: COLORS.emerald }}>₹{totalBalance.toFixed(2)}</Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid #E2E8F0', bgcolor: 'white', borderLeft: '4px solid #F59E0B' }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <Box sx={{ width: 48, height: 48, borderRadius: 2, bgcolor: '#F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}><TrendingDown /></Box>
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>Active Wallets</Typography>
                  <Typography variant="h6" fontWeight={700} sx={{ fontFamily: FONT_MONO }}>{activeWallets}</Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* ✅ Search + Status Filter */}
      <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: '1px solid #E2E8F0', bgcolor: 'white', mb: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
          <TextField fullWidth placeholder="Search by user name or email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} size="small"
            InputProps={{ startAdornment: (<InputAdornment position="start"><Search sx={{ color: COLORS.textFaint }} /></InputAdornment>) }}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: '#F8FAFC', '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#1E3A6E' }, '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#1E3A6E', borderWidth: 2 } } }} />
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Status</InputLabel>
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} label="Status">
              <MenuItem value="ALL">All Status</MenuItem>
              <MenuItem value="ACTIVE">Active</MenuItem>
              <MenuItem value="INACTIVE">Inactive</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </Paper>

      <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: '1px solid #E2E8F0', bgcolor: 'white' }}>
        {loading ? <Loader /> : (
          <DataGrid
            rows={filteredWallets}
            columns={columns}
            pageSize={rowsPerPage}
            rowsPerPageOptions={[10, 25, 50]}
            page={page}
            onPageChange={(p) => setPage(p)}
            onPageSizeChange={(s) => setRowsPerPage(s)}
            components={{ Toolbar: CustomToolbar }}
            disableSelectionOnClick
            autoHeight
            sx={{
              '& .MuiDataGrid-columnHeaders': { bgcolor: '#F8FAFC', fontWeight: 700, color: '#475569', borderBottom: '2px solid #E2E8F0' },
              '& .MuiDataGrid-row:hover': { bgcolor: '#F0F4FF' },
              '& .MuiDataGrid-cell': { borderBottom: '1px solid #F1F5F9', py: 1.5 },
              '& .MuiDataGrid-columnSeparator': { display: 'none' },
            }}
          />
        )}
      </Paper>
    </Box>
  );
};

export default WalletManagement;