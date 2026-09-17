import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { DataGrid, GridToolbarContainer, GridToolbarExport } from '@mui/x-data-grid';
import {
  Typography, Paper, Grid, Box, TextField, InputAdornment, Stack,
  Card, CardContent, Chip, useMediaQuery, useTheme, Button,
  Dialog, DialogTitle, DialogActions,
} from '@mui/material';
import { Search, Payment, TrendingUp, ReceiptLong } from '@mui/icons-material';
import { fetchPayments } from '../redux/slices/paymentSlice';
import Loader from '../components/Loader';
import PanelHeader from '../components/PanelHeader';
import ErrorAlert from '../components/ErrorAlert';
import ExportButtons from '../components/ExportButtons';
import { COLORS, FONT_DISPLAY, FONT_MONO } from '../theme/dashboardTheme';

const CustomToolbar = () => (
  <GridToolbarContainer sx={{ p: 1 }}>
    <GridToolbarExport />
  </GridToolbarContainer>
);

const Payments = () => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { payments, isLoading, error } = useSelector((state) => state.payments);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const paymentsList = Array.isArray(payments) ? payments : [];

  useEffect(() => {
    dispatch(fetchPayments());
  }, [dispatch]);

  const totalRevenue = paymentsList.reduce((sum, p) => sum + (p.amount || 0), 0);
  const totalTransactions = paymentsList.length;
  const completedCount = paymentsList.filter(p => p.status === 'SUCCESS').length;
  const pendingCount = paymentsList.filter(p => p.status === 'PENDING').length;

  const filtered = paymentsList.filter((p) => {
    const matchesSearch = !searchTerm || 
      p.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.bookingId?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !filterStatus || p.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const exportHeaders = [
    { key: 'id', label: 'Payment ID' },
    { key: 'bookingId', label: 'Booking ID' },
    { key: 'userName', label: 'User' },
    { key: 'amount', label: 'Amount' },
    { key: 'method', label: 'Method' },
    { key: 'status', label: 'Status' },
    { key: 'createdAt', label: 'Date' },
  ];

  const columns = [
    { field: 'id', headerName: 'Payment ID', flex: 1, minWidth: 150 },
    { field: 'bookingId', headerName: 'Booking ID', flex: 1, minWidth: 150 },
    { field: 'userName', headerName: 'User', flex: 1, minWidth: 120 },
    {
      field: 'amount',
      headerName: 'Amount',
      flex: 0.5,
      minWidth: 100,
      renderCell: (params) => (
        <Typography fontWeight={600} sx={{ color: COLORS.emerald }}>
          ₹{params.row.amount?.toFixed(2) || '0.00'}
        </Typography>
      ),
    },
    { field: 'method', headerName: 'Method', flex: 0.5, minWidth: 80 },
    {
      field: 'status',
      headerName: 'Status',
      flex: 0.5,
      minWidth: 100,
      renderCell: (params) => (
        <Chip
          label={params.row.status}
          size="small"
          color={params.row.status === 'SUCCESS' ? 'success' : params.row.status === 'FAILED' ? 'error' : 'warning'}
        />
      ),
    },
    {
      field: 'createdAt',
      headerName: 'Date',
      flex: 1,
      minWidth: 120,
      renderCell: (params) => new Date(params.row.createdAt).toLocaleDateString(),
    },
  ];

  if (isLoading) return <Loader />;
  if (error) return <ErrorAlert error={error} />;

  return (
    <Box className="fade-in" sx={{ p: { xs: 2, md: 3 }, mt: 0, pt: 1 }}>
      <PanelHeader eyebrow="Financials" title="Payments Management" />

      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={0} sx={{ p: 2, borderRadius: 4, border: '1px solid #e2e8f0', bgcolor: 'white', textAlign: 'center' }}>
            <Stack direction="row" alignItems="center" justifyContent="center" spacing={1}>
              <TrendingUp sx={{ color: COLORS.emerald }} />
              <Typography variant="subtitle1" sx={{ color: COLORS.textMuted }}>Total Revenue</Typography>
            </Stack>
            <Typography variant="h4" sx={{ fontFamily: FONT_MONO, fontWeight: 700, color: COLORS.textPrimary }}>
              ₹{totalRevenue.toFixed(2)}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={0} sx={{ p: 2, borderRadius: 4, border: '1px solid #e2e8f0', bgcolor: 'white', textAlign: 'center' }}>
            <Stack direction="row" alignItems="center" justifyContent="center" spacing={1}>
              <ReceiptLong sx={{ color: COLORS.sky }} />
              <Typography variant="subtitle1" sx={{ color: COLORS.textMuted }}>Total Transactions</Typography>
            </Stack>
            <Typography variant="h4" sx={{ fontFamily: FONT_MONO, fontWeight: 700, color: COLORS.textPrimary }}>
              {totalTransactions}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={0} sx={{ p: 2, borderRadius: 4, border: '1px solid #e2e8f0', bgcolor: 'white', textAlign: 'center' }}>
            <Stack direction="row" alignItems="center" justifyContent="center" spacing={1}>
              <Payment sx={{ color: COLORS.success }} />
              <Typography variant="subtitle1" sx={{ color: COLORS.textMuted }}>Successful</Typography>
            </Stack>
            <Typography variant="h4" sx={{ fontFamily: FONT_MONO, fontWeight: 700, color: COLORS.success }}>
              {completedCount}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={0} sx={{ p: 2, borderRadius: 4, border: '1px solid #e2e8f0', bgcolor: 'white', textAlign: 'center' }}>
            <Stack direction="row" alignItems="center" justifyContent="center" spacing={1}>
              <Payment sx={{ color: COLORS.warning }} />
              <Typography variant="subtitle1" sx={{ color: COLORS.textMuted }}>Pending</Typography>
            </Stack>
            <Typography variant="h4" sx={{ fontFamily: FONT_MONO, fontWeight: 700, color: COLORS.warning }}>
              {pendingCount}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Search & Export */}
      <Paper elevation={0} sx={{ p: 2, borderRadius: 4, border: '1px solid #e2e8f0', bgcolor: 'white', mb: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
          <TextField
            fullWidth
            placeholder="Search by user, payment ID, booking ID..."
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{ startAdornment: (<InputAdornment position="start"><Search /></InputAdornment>) }}
          />
          <TextField
            select
            size="small"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            sx={{ minWidth: 150 }}
            SelectProps={{ native: true }}
          >
            <option value="">All Status</option>
            <option value="SUCCESS">Success</option>
            <option value="PENDING">Pending</option>
            <option value="FAILED">Failed</option>
          </TextField>
          <ExportButtons data={filtered} headers={exportHeaders} filename="payments" />
        </Stack>
      </Paper>

      {/* Table */}
      <Paper elevation={0} sx={{ p: 2, borderRadius: 4, border: '1px solid #e2e8f0', bgcolor: 'white' }}>
        {isMobile ? (
          <Stack spacing={2}>
            {filtered.length > 0 ? filtered.map((payment) => (
              <Card key={payment.id} sx={{ borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Payment sx={{ color: COLORS.sky }} />
                      <Typography variant="subtitle2" fontWeight={600}>{payment.id?.slice(0, 8)}</Typography>
                    </Stack>
                    <Chip label={payment.status} size="small" color={payment.status === 'SUCCESS' ? 'success' : payment.status === 'FAILED' ? 'error' : 'warning'} />
                  </Stack>
                  <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                    <Box>
                      <Typography variant="caption" color="textSecondary">User</Typography>
                      <Typography variant="body2" fontWeight={500}>{payment.userName || '—'}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="textSecondary">Booking</Typography>
                      <Typography variant="body2" fontWeight={500}>{payment.bookingId?.slice(0, 8) || '—'}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="textSecondary">Method</Typography>
                      <Typography variant="body2" fontWeight={500}>{payment.method || '—'}</Typography>
                    </Box>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6" sx={{ color: COLORS.emerald, fontWeight: 700 }}>₹{payment.amount?.toFixed(2) || '0.00'}</Typography>
                    <Typography variant="caption">{new Date(payment.createdAt).toLocaleDateString()}</Typography>
                  </Stack>
                </CardContent>
              </Card>
            )) : <Typography align="center" color="textSecondary" sx={{ py: 4 }}>No payments found</Typography>}
          </Stack>
        ) : (
          <DataGrid
            rows={filtered}
            columns={columns}
            pageSize={10}
            rowsPerPageOptions={[10, 25, 50]}
            components={{ Toolbar: CustomToolbar }}
            disableSelectionOnClick
            autoHeight
            sx={{
              '& .MuiDataGrid-columnHeaders': { bgcolor: '#F8FAFC', fontWeight: 700, color: '#475569' },
              '& .MuiDataGrid-row:hover': { bgcolor: '#F0F4FF' },
              '& .MuiDataGrid-cell': { borderBottom: '1px solid #F1F5F9', padding: '8px' },
              '& .MuiDataGrid-columnSeparator': { display: 'none' },
            }}
          />
        )}
      </Paper>
    </Box>
  );
};

export default Payments;