// src/pages/WalletManagement.jsx
import { useEffect, useState } from 'react';
import {
  Box, Paper, Typography, TextField, InputAdornment, Stack, Chip, Avatar,
  IconButton, Tooltip, FormControl, InputLabel, Select, MenuItem,
} from '@mui/material';
import {
  Search, AccountBalanceWallet, TrendingUp, Wallet, Refresh, Inbox,
} from '@mui/icons-material';
import {
  DataGrid, GridToolbarContainer, GridToolbarFilterButton, GridToolbarExport,
} from '@mui/x-data-grid';
import apiClient from '../api/axios';
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

// ═══════════════════════════════════════════════════════════════
// SUMMARY CARD
// ═══════════════════════════════════════════════════════════════
const SummaryCard = ({ title, value, icon: Icon, accent, gradient }) => (
  <Paper
    elevation={0}
    sx={{
      p: 2.5,
      borderRadius: T.radius,
      border: `1px solid ${T.border}`,
      bgcolor: T.surface,
      position: 'relative',
      overflow: 'hidden',
      transition: 'all 0.2s ease',
      '&:hover': {
        borderColor: T.borderStrong,
        transform: 'translateY(-2px)',
        boxShadow: '0 12px 24px -16px rgba(15,23,42,0.15)',
      },
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        bottom: 0,
        width: 4,
        background: gradient || accent,
      },
    }}
  >
    <Stack direction="row" alignItems="center" spacing={1.5}>
      <Box
        sx={{
          width: 44,
          height: 44,
          borderRadius: 2,
          background: gradient || `${accent}12`,
          color: gradient ? '#fff' : accent,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon sx={{ fontSize: 20 }} />
      </Box>
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography
          sx={{
            fontSize: '0.68rem',
            fontWeight: 700,
            color: T.textFaint,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            mb: 0.25,
          }}
        >
          {title}
        </Typography>
        <Typography
          sx={{
            fontSize: '1.35rem',
            fontWeight: 800,
            color: T.textPrimary,
            letterSpacing: '-0.02em',
            fontFamily: T.fontDisplay,
            lineHeight: 1.1,
          }}
        >
          {value}
        </Typography>
      </Box>
    </Stack>
  </Paper>
);

// ═══════════════════════════════════════════════════════════════
// WALLET MANAGEMENT
// ═══════════════════════════════════════════════════════════════
const WalletManagement = () => {
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const fetchWallets = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/wallet/all', { params: { limit: 100 } });
      const data = res.data?.data || res.data;
      setWallets(Array.isArray(data) ? data : data.rows || []);
    } catch (error) {
      console.error('Error fetching wallets:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWallets();
  }, []);

  const filteredWallets = wallets.filter((w) => {
    const userName = `${w.User?.firstName || ''} ${w.User?.lastName || ''}`;
    const userEmail = w.User?.email || '';
    const search = searchTerm.toLowerCase();
    const matchesSearch =
      userName.toLowerCase().includes(search) ||
      userEmail.toLowerCase().includes(search);
    const matchesStatus =
      statusFilter === 'ALL' || (w.status || 'ACTIVE') === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalBalance = wallets.reduce((sum, w) => sum + (parseFloat(w.balance) || 0), 0);
  const activeWallets = wallets.filter((w) => (w.status || 'ACTIVE') === 'ACTIVE').length;
  const totalUsers = wallets.length;

  const columns = [
    {
      field: 'User',
      headerName: 'User',
      flex: 1.5,
      minWidth: 220,
      renderCell: (params) => {
        const name = `${params.row.User?.firstName || ''} ${params.row.User?.lastName || ''}`.trim();
        const initial = (params.row.User?.firstName || 'U').charAt(0);
        return (
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Avatar
              sx={{
                width: 38,
                height: 38,
                background: `linear-gradient(135deg, ${T.indigo}, ${T.violet})`,
                fontSize: 14,
                fontWeight: 700,
                border: '2px solid #fff',
                boxShadow: '0 2px 6px rgba(15,23,42,0.1)',
              }}
            >
              {initial}
            </Avatar>
            <Box sx={{ minWidth: 0 }}>
              <Typography
                sx={{
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  color: T.textPrimary,
                  lineHeight: 1.2,
                }}
                noWrap
              >
                {name || 'Unknown'}
              </Typography>
              <Typography sx={{ fontSize: '0.7rem', color: T.textFaint }} noWrap>
                {params.row.User?.email || 'N/A'}
              </Typography>
            </Box>
          </Stack>
        );
      },
    },
    {
      field: 'balance',
      headerName: 'Balance',
      flex: 0.8,
      minWidth: 130,
      renderCell: (params) => (
        <Typography
          sx={{
            fontWeight: 800,
            color: '#047857',
            fontFamily: 'monospace',
            fontSize: '0.85rem',
          }}
        >
          ₹{parseFloat(params.row.balance || 0).toFixed(2)}
        </Typography>
      ),
    },
    {
      field: 'currency',
      headerName: 'Currency',
      flex: 0.5,
      minWidth: 90,
      renderCell: (params) => (
        <Chip
          label={params.row.currency || 'INR'}
          size="small"
          sx={{
            bgcolor: T.skySoft,
            color: '#0369a1',
            fontWeight: 700,
            fontSize: '0.65rem',
            height: 22,
            borderRadius: 999,
          }}
        />
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      flex: 0.6,
      minWidth: 100,
      renderCell: (params) => {
        const isActive = (params.row.status || 'ACTIVE') === 'ACTIVE';
        return (
          <Chip
            label={params.row.status || 'ACTIVE'}
            size="small"
            sx={{
              bgcolor: isActive ? T.emeraldSoft : T.roseSoft,
              color: isActive ? '#047857' : '#be123c',
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
      headerName: 'Created',
      flex: 1,
      minWidth: 140,
      renderCell: (params) => (
        <Typography sx={{ fontSize: '0.75rem', color: T.textMuted }}>
          {new Date(params.row.createdAt).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })}
        </Typography>
      ),
    },
  ];

  const renderMobileCards = () => (
    <Stack spacing={2}>
      {filteredWallets.length > 0 ? (
        filteredWallets.map((wallet) => {
          const name = `${wallet.User?.firstName || ''} ${wallet.User?.lastName || ''}`.trim();
          const isActive = (wallet.status || 'ACTIVE') === 'ACTIVE';
          return (
            <Paper
              key={wallet.id}
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
                  sx={{
                    width: 44,
                    height: 44,
                    background: `linear-gradient(135deg, ${T.indigo}, ${T.violet})`,
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    border: '2px solid #fff',
                  }}
                >
                  {(wallet.User?.firstName || 'U').charAt(0)}
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    sx={{ fontSize: '0.88rem', fontWeight: 700, color: T.textPrimary }}
                    noWrap
                  >
                    {name || 'Unknown'}
                  </Typography>
                  <Typography
                    sx={{ fontSize: '0.72rem', color: T.textMuted, mt: 0.2 }}
                    noWrap
                  >
                    {wallet.User?.email || 'N/A'}
                  </Typography>
                </Box>
                <Chip
                  label={wallet.status || 'ACTIVE'}
                  size="small"
                  sx={{
                    bgcolor: isActive ? T.emeraldSoft : T.roseSoft,
                    color: isActive ? '#047857' : '#be123c',
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
                <Typography
                  sx={{
                    fontSize: '1.15rem',
                    fontWeight: 800,
                    color: '#047857',
                    fontFamily: 'monospace',
                  }}
                >
                  ₹{parseFloat(wallet.balance || 0).toFixed(2)}
                </Typography>
                <Chip
                  label={wallet.currency || 'INR'}
                  size="small"
                  sx={{
                    bgcolor: T.skySoft,
                    color: '#0369a1',
                    fontWeight: 700,
                    fontSize: '0.6rem',
                    height: 20,
                    borderRadius: 999,
                  }}
                />
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
          <Inbox sx={{ fontSize: 40, color: T.textFaint, mb: 1 }} />
          <Typography sx={{ color: T.textFaint, fontWeight: 500 }}>
            No wallets found
          </Typography>
        </Paper>
      )}
    </Stack>
  );

  const isMobile = window.innerWidth < 900;

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1440, mx: 'auto' }}>
      <Box sx={{ mb: 3 }}>
        <PanelHeader eyebrow="Finance" title="Wallet Management" />
      </Box>

      {/* Summary */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
          gap: 2.5,
          mb: 2.5,
        }}
      >
        <SummaryCard
          title="Total Wallets"
          value={totalUsers}
          icon={AccountBalanceWallet}
          gradient={`linear-gradient(135deg, ${T.indigo}, ${T.violet})`}
        />
        <SummaryCard
          title="Total Balance"
          value={`₹${totalBalance.toFixed(2)}`}
          icon={TrendingUp}
          accent={T.emerald}
        />
        <SummaryCard
          title="Active Wallets"
          value={activeWallets}
          icon={Wallet}
          accent={T.amber}
        />
      </Box>

      {/* Filters */}
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
            placeholder="Search by user name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ fontSize: 18, color: T.textFaint }} />
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
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              label="Status"
              sx={{ borderRadius: 2, bgcolor: T.surfaceSoft }}
            >
              <MenuItem value="ALL">All Status</MenuItem>
              <MenuItem value="ACTIVE">Active</MenuItem>
              <MenuItem value="INACTIVE">Inactive</MenuItem>
            </Select>
          </FormControl>
          <Tooltip title="Refresh">
            <IconButton
              onClick={fetchWallets}
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
        </Stack>
      </Paper>

      {/* Table / Mobile */}
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
    </Box>
  );
};

export default WalletManagement;