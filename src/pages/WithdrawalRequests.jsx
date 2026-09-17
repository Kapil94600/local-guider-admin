// src/pages/WithdrawalRequests.jsx
import { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Button, IconButton, Chip, Avatar,
  Stack, TextField, InputAdornment, Dialog, DialogTitle, DialogContent, DialogActions,
  FormControl, InputLabel, Select, MenuItem,
} from '@mui/material';
import { Search, Check, Close, Visibility } from '@mui/icons-material';
import { DataGrid, GridToolbarContainer, GridToolbarFilterButton, GridToolbarExport } from '@mui/x-data-grid';
import { toast } from 'react-toastify';
import apiClient from '../api/axios';
import Loader from '../components/Loader';
import PanelHeader from '../components/PanelHeader';
import { COLORS } from '../theme/dashboardTheme';

const CustomToolbar = () => (
  <GridToolbarContainer sx={{ p: 1 }}>
    <GridToolbarFilterButton />
    <GridToolbarExport />
  </GridToolbarContainer>
);

const WithdrawalRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // ✅ NEW
  const [viewModal, setViewModal] = useState(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/withdrawal/all');
      const data = res.data?.data || res.data;
      setRequests(Array.isArray(data) ? data : (data.rows || []));
    } catch (error) {
      toast.error('Failed to fetch withdrawal requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await apiClient.put(`/withdrawal/${id}/status`, { status: 'APPROVED' });
      toast.success('Withdrawal approved');
      setViewModal(null);
      fetchRequests();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to approve');
    }
  };

  const handleReject = async (id) => {
    const adminMessage = window.prompt('Reason for rejection:');
    if (adminMessage === null) return;
    try {
      await apiClient.put(`/withdrawal/${id}/status`, { status: 'REJECTED', adminMessage });
      toast.success('Withdrawal rejected');
      setViewModal(null);
      fetchRequests();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reject');
    }
  };

  const filteredRequests = requests.filter((r) => {
    const matchesSearch = r.User?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.User?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.User?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.bankName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const columns = [
    { field: 'User', headerName: 'User', flex: 1.2, minWidth: 180, renderCell: (params) => (
      <Stack direction="row" alignItems="center" spacing={1}>
        <Avatar sx={{ width: 32, height: 32, bgcolor: '#1E3A6E' }}>{(params.row.User?.firstName || 'U').charAt(0)}</Avatar>
        <Box>
          <Typography variant="body2" fontWeight={600}>{params.row.User?.firstName} {params.row.User?.lastName}</Typography>
          <Typography variant="caption" color="textSecondary">{params.row.User?.email || 'N/A'}</Typography>
        </Box>
      </Stack>
    ) },
    { field: 'amount', headerName: 'Amount', flex: 0.7, minWidth: 100, renderCell: (params) => (
      <Typography fontWeight={700} sx={{ color: COLORS.emerald }}>₹{parseFloat(params.row.amount).toFixed(2)}</Typography>
    ) },
    { field: 'bankName', headerName: 'Bank', flex: 0.8, minWidth: 110 },
    { field: 'accountNumber', headerName: 'Account No', flex: 1, minWidth: 140 },
    { field: 'ifscCode', headerName: 'IFSC', flex: 0.7, minWidth: 100 },
    { field: 'status', headerName: 'Status', flex: 0.7, minWidth: 100, renderCell: (params) => (
      <Chip label={params.row.status} size="small" color={params.row.status === 'PENDING' ? 'warning' : params.row.status === 'APPROVED' ? 'success' : 'error'} />
    ) },
    { field: 'createdAt', headerName: 'Requested At', flex: 1, minWidth: 140, renderCell: (params) => new Date(params.row.createdAt).toLocaleString() },
    { field: 'actions', headerName: 'Actions', flex: 1.2, minWidth: 160, renderCell: (params) => (
      <Stack direction="row" spacing={0.5}>
        <IconButton onClick={() => setViewModal(params.row)} sx={{ color: COLORS.sky }} title="View Details"><Visibility /></IconButton>
        {params.row.status === 'PENDING' && (
          <>
            <IconButton onClick={() => handleApprove(params.row.id)} sx={{ color: 'success.main' }} title="Approve"><Check /></IconButton>
            <IconButton onClick={() => handleReject(params.row.id)} sx={{ color: 'error.main' }} title="Reject"><Close /></IconButton>
          </>
        )}
      </Stack>
    ) },
  ];

  return (
    <Box className="fade-in" sx={{ p: { xs: 2, md: 3 }, mt: 0, pt: 1 }}>
      <PanelHeader eyebrow="Wallet" title="Withdrawal Requests" />

      {/* ✅ Search + Status Filter */}
      <Paper elevation={0} sx={{ p: 2, borderRadius: 4, border: '1px solid #e2e8f0', bgcolor: 'white', mb: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
          <TextField fullWidth placeholder="Search by user, bank, account..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} size="small"
            InputProps={{ startAdornment: (<InputAdornment position="start"><Search /></InputAdornment>) }} />
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Status</InputLabel>
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} label="Status">
              <MenuItem value="ALL">All Status</MenuItem>
              <MenuItem value="PENDING">Pending</MenuItem>
              <MenuItem value="APPROVED">Approved</MenuItem>
              <MenuItem value="REJECTED">Rejected</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </Paper>

      <Paper elevation={0} sx={{ p: 2, borderRadius: 4, border: '1px solid #e2e8f0', bgcolor: 'white' }}>
        {loading ? <Loader /> : (
          <DataGrid
            rows={filteredRequests}
            columns={columns}
            pageSize={10}
            rowsPerPageOptions={[10, 25, 50]}
            components={{ Toolbar: CustomToolbar }}
            disableSelectionOnClick
            autoHeight
            sx={{ '& .MuiDataGrid-columnHeaders': { bgcolor: '#F8FAFC', fontWeight: 700 }, '& .MuiDataGrid-row:hover': { bgcolor: '#F0F4FF' } }}
          />
        )}
      </Paper>

      <Dialog open={!!viewModal} onClose={() => setViewModal(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Withdrawal Request Details</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography variant="body2"><strong>User:</strong> {viewModal?.User?.firstName} {viewModal?.User?.lastName}</Typography>
            <Typography variant="body2"><strong>Email:</strong> {viewModal?.User?.email}</Typography>
            <Typography variant="body2"><strong>Amount:</strong> ₹{parseFloat(viewModal?.amount).toFixed(2)}</Typography>
            <Typography variant="body2"><strong>Account Name:</strong> {viewModal?.accountName}</Typography>
            <Typography variant="body2"><strong>Account Number:</strong> {viewModal?.accountNumber}</Typography>
            <Typography variant="body2"><strong>Bank:</strong> {viewModal?.bankName}</Typography>
            <Typography variant="body2"><strong>IFSC:</strong> {viewModal?.ifscCode}</Typography>
            {viewModal?.upiId && <Typography variant="body2"><strong>UPI:</strong> {viewModal?.upiId}</Typography>}
          </Stack>
        </DialogContent>
        <DialogActions>
          {viewModal?.status === 'PENDING' && (
            <>
              <Button onClick={() => handleApprove(viewModal.id)} color="success" variant="contained">Approve</Button>
              <Button onClick={() => handleReject(viewModal.id)} color="error" variant="contained">Reject</Button>
            </>
          )}
          <Button onClick={() => setViewModal(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default WithdrawalRequests;