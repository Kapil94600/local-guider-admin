// src/pages/RoleRequests.jsx
import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { CheckCircle, Cancel, Visibility } from '@mui/icons-material';
import SearchIcon from '@mui/icons-material/Search';
import {
  Box, Paper, Typography, Button, IconButton, Chip, Dialog, DialogTitle,
  DialogContent, DialogActions, Grid, Avatar, Stack, Divider, TextField,
  Select, MenuItem, FormControl, InputLabel, useMediaQuery, useTheme, Card, CardContent,
  InputAdornment,
} from '@mui/material';
import { DataGrid, GridToolbarContainer, GridToolbarFilterButton, GridToolbarExport } from '@mui/x-data-grid';
import { fetchRoleRequests, approveRoleRequest, rejectRoleRequest, setPage, setLimit } from '../redux/slices/roleRequestSlice';
import Loader from '../components/Loader';
import PanelHeader from '../components/PanelHeader';
import { COLORS, FONT_DISPLAY } from '../theme/dashboardTheme';
import apiClient from '../api/axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://local-guider-backend.onrender.com/api/v1';
const SERVER_BASE = API_BASE_URL.replace('/api/v1', '');

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

const CustomToolbar = () => (
  <GridToolbarContainer sx={{ p: 1 }}>
    <GridToolbarFilterButton />
    <GridToolbarExport />
  </GridToolbarContainer>
);

const ImageCard = ({ label, url }) => {
  const [errored, setErrored] = useState(false);
  const imageUrl = getImageUrl(url);

  return (
    <Box sx={{ textAlign: 'center' }}>
      <Typography variant="caption" sx={{ color: COLORS.textMuted, display: 'block', mb: 1, fontWeight: 600 }}>
        {label}
      </Typography>
      {imageUrl && !errored ? (
        <img
          src={imageUrl}
          alt={label}
          onError={() => setErrored(true)}
          onClick={() => window.open(imageUrl, '_blank')}
          style={{
            width: 100, height: 100, borderRadius: 8, objectFit: 'cover',
            border: '1px solid #eee', cursor: 'pointer',
          }}
        />
      ) : (
        <Box sx={{
          width: 100, height: 100, bgcolor: '#f5f5f5', borderRadius: 2,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '1px dashed #ccc',
        }}>
          <Typography variant="caption" color="textSecondary">
            {!url ? 'No Image' : 'Load Failed'}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

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

  return (
    <Dialog open={!!request} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontFamily: FONT_DISPLAY, fontWeight: 700 }}>
        Request Details
      </DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="textSecondary">Full Name</Typography>
            <Typography variant="body1" fontWeight="bold">{request.fullName || 'N/A'}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="textSecondary">Company</Typography>
            <Typography variant="body1">{request.companyName || 'N/A'}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="textSecondary">Location</Typography>
            <Typography variant="body1">{request.location || 'N/A'}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="textSecondary">Requested Role</Typography>
            <Chip
              label={request.requestedRole}
              color={request.requestedRole === 'GUIDER' ? 'info' : 'secondary'}
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="textSecondary">ID Type Submitted</Typography>
            <Chip
              label={ID_TYPE_LABELS[request.idType] || request.idType || 'N/A'}
              color="primary" size="small" sx={{ fontWeight: 700 }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="textSecondary">Status</Typography>
            <Chip
              label={request.status}
              color={request.status === 'APPROVED' ? 'success' : request.status === 'REJECTED' ? 'error' : 'warning'}
              size="small"
            />
          </Grid>
          <Grid item xs={12}>
            <Typography variant="body2" color="textSecondary">Submitted On</Typography>
            <Typography variant="body1">
              {request.createdAt ? new Date(request.createdAt).toLocaleString() : 'N/A'}
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <Typography variant="subtitle2" color="textSecondary" sx={{ mb: 1 }}>
              Selected Places ({placeNames.length})
            </Typography>
            {placeNames.length > 0 ? (
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {placeNames.map((place, idx) => (
                  <Chip key={idx} label={place} variant="outlined" color="primary" size="small" />
                ))}
              </Stack>
            ) : (
              <Typography variant="body2" color="textSecondary">No places selected</Typography>
            )}
          </Grid>

          <Grid item xs={12}>
            <Divider sx={{ my: 1 }} />
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
              <Typography variant="h6">Documents</Typography>
              <Chip
                label={ID_TYPE_LABELS[request.idType] || 'AADHAAR'}
                size="small" color="primary" sx={{ fontWeight: 700 }}
              />
            </Stack>
            <Grid container spacing={2}>
              <Grid item xs={6} sm={3}><ImageCard label="Selfie (Live)" url={request.selfieUrl} /></Grid>
              <Grid item xs={6} sm={3}><ImageCard label="Profile Photo" url={request.profilePhotoUrl} /></Grid>
              <Grid item xs={6} sm={3}><ImageCard label="ID Front" url={request.idFrontUrl} /></Grid>
              <Grid item xs={6} sm={3}><ImageCard label="ID Back" url={request.idBackUrl} /></Grid>
            </Grid>
          </Grid>

          <Grid item xs={12}>
            <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>Message</Typography>
            <Typography variant="body1">{request.message || 'No message provided'}</Typography>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">Close</Button>
      </DialogActions>
    </Dialog>
  );
};

const RoleRequests = () => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { items, total, loading, pagination } = useSelector((state) => state.roleRequests);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [processing, setProcessing] = useState(null);

  useEffect(() => {
    dispatch(fetchRoleRequests({ page: pagination.page, limit: pagination.limit }));
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
      dispatch(fetchRoleRequests({ page: pagination.page, limit: pagination.limit }));
    } catch (error) {
      toast.error(error.message || 'Approve failed');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (id) => {
    const adminMessage = window.prompt('Reason for rejection:');
    if (adminMessage === null) return;
    setProcessing(id);
    try {
      await dispatch(rejectRoleRequest({ id, adminMessage })).unwrap();
      toast.success('Request rejected');
      dispatch(fetchRoleRequests({ page: pagination.page, limit: pagination.limit }));
    } catch (error) {
      toast.error(error.message || 'Reject failed');
    } finally {
      setProcessing(null);
    }
  };

  const columns = [
    { field: 'fullName', headerName: 'Full Name', flex: 1.2 },
    { field: 'companyName', headerName: 'Company', flex: 1, renderCell: (p) => p.row.companyName || 'N/A' },
    { field: 'location', headerName: 'Location', flex: 0.8 },
    {
      field: 'idType', headerName: 'ID Type', flex: 0.8,
      renderCell: (p) => (
        <Chip label={ID_TYPE_LABELS[p.row.idType] || p.row.idType || 'N/A'}
          size="small" color="primary" variant="outlined" sx={{ fontWeight: 600 }} />
      ),
    },
    {
      field: 'requestedRole', headerName: 'Role', flex: 0.7,
      renderCell: (p) => (
        <Chip label={p.row.requestedRole}
          color={p.row.requestedRole === 'GUIDER' ? 'info' : 'secondary'} size="small" />
      ),
    },
    {
      field: 'status', headerName: 'Status', flex: 0.7,
      renderCell: (p) => (
        <Chip label={p.row.status}
          color={p.row.status === 'APPROVED' ? 'success' : p.row.status === 'REJECTED' ? 'error' : 'warning'}
          size="small" />
      ),
    },
    {
      field: 'createdAt', headerName: 'Date', flex: 0.7,
      renderCell: (p) => new Date(p.row.createdAt).toLocaleDateString(),
    },
    {
      field: 'actions', headerName: 'Actions', flex: 1.2,
      renderCell: (p) => (
        <Stack direction="row" spacing={0.5}>
          <IconButton onClick={() => setSelectedRequest(p.row)} sx={{ color: COLORS.sky }}>
            <Visibility />
          </IconButton>
          {p.row.status === 'PENDING' && (
            <>
              <IconButton
                onClick={() => handleApprove(p.row.id)}
                disabled={processing === p.row.id}
                sx={{ color: 'success.main' }}
              >
                <CheckCircle />
              </IconButton>
              <IconButton
                onClick={() => handleReject(p.row.id)}
                disabled={processing === p.row.id}
                sx={{ color: 'error.main' }}
              >
                <Cancel />
              </IconButton>
            </>
          )}
        </Stack>
      ),
    },
  ];

  const renderMobileCards = () => (
    <Stack spacing={2}>
      {filtered.length > 0 ? (
        filtered.map((req) => (
          <Card key={req.id} sx={{ borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                <Typography variant="subtitle1" fontWeight={600}>{req.fullName}</Typography>
                <Chip label={req.requestedRole} size="small"
                  color={req.requestedRole === 'GUIDER' ? 'info' : 'secondary'} />
              </Box>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>
                {req.companyName || 'N/A'} • {req.location || 'N/A'}
              </Typography>
              <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                <Chip label={ID_TYPE_LABELS[req.idType] || 'AADHAAR'} size="small" color="primary" variant="outlined" />
              </Stack>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                <Chip label={req.status} size="small"
                  color={req.status === 'APPROVED' ? 'success' : req.status === 'REJECTED' ? 'error' : 'warning'} />
                <Typography variant="caption">{new Date(req.createdAt).toLocaleDateString()}</Typography>
              </Stack>
              <Stack direction="row" justifyContent="flex-end" spacing={1} sx={{ borderTop: '1px solid #f1f5f9', pt: 1 }}>
                <IconButton size="small" onClick={() => setSelectedRequest(req)} sx={{ color: COLORS.sky }}>
                  <Visibility fontSize="small" />
                </IconButton>
                {req.status === 'PENDING' && (
                  <>
                    <IconButton size="small" onClick={() => handleApprove(req.id)}
                      disabled={processing === req.id} sx={{ color: 'success.main' }}>
                      <CheckCircle fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleReject(req.id)}
                      disabled={processing === req.id} sx={{ color: 'error.main' }}>
                      <Cancel fontSize="small" />
                    </IconButton>
                  </>
                )}
              </Stack>
            </CardContent>
          </Card>
        ))
      ) : (
        <Typography align="center" color="textSecondary" sx={{ py: 4 }}>No requests found</Typography>
      )}
    </Stack>
  );

  return (
    <Box className="fade-in" sx={{ p: { xs: 2, md: 3 }, mt: 0, pt: 1 }}>
      <PanelHeader eyebrow="Verification" title="Role Requests" />

      <Paper elevation={0} sx={{ p: 2, borderRadius: 4, border: '1px solid #e2e8f0', bgcolor: 'white', mb: 2 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
          <TextField
            size="small"
            placeholder="Search by name, company, location, ID type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ width: { xs: '100%', md: 350 } }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: '#94a3b8' }} />
                </InputAdornment>
              ),
            }}
          />
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Status</InputLabel>
            <Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} label="Status">
              <MenuItem value="">All</MenuItem>
              <MenuItem value="PENDING">Pending</MenuItem>
              <MenuItem value="APPROVED">Approved</MenuItem>
              <MenuItem value="REJECTED">Rejected</MenuItem>
            </Select>
          </FormControl>
          <Chip label={`Total: ${total}`} color="primary" variant="outlined" />
        </Stack>
      </Paper>

      {isMobile ? (
        loading ? <Loader /> : renderMobileCards()
      ) : (
        <Paper elevation={0} sx={{ p: 2, borderRadius: 4, border: '1px solid #e2e8f0', bgcolor: 'white' }}>
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
              sx={{
                '& .MuiDataGrid-columnHeaders': { bgcolor: '#F8FAFC', fontWeight: 700 },
                '& .MuiDataGrid-row:hover': { bgcolor: '#F0F4FF' },
              }}
            />
          )}
        </Paper>
      )}

      <RequestDetailsModal request={selectedRequest} onClose={() => setSelectedRequest(null)} />
    </Box>
  );
};

export default RoleRequests;