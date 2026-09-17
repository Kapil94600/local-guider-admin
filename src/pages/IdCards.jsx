// src/pages/IdCards.jsx
import { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FaIdCard, FaBan, FaSearch, FaDownload, FaEye, FaFilePdf, FaImage } from 'react-icons/fa';
import { toast } from 'react-toastify';
import {
  Box, Paper, Typography, Button, IconButton, Chip, InputAdornment, TextField,
  Card, CardContent, Stack, Dialog, DialogTitle, DialogActions,
  useMediaQuery, useTheme, Avatar, CircularProgress,
  FormControl, InputLabel, Select, MenuItem,
} from '@mui/material';
import { DataGrid, GridToolbarContainer, GridToolbarFilterButton, GridToolbarExport } from '@mui/x-data-grid';
import { fetchIdCards, revokeIdCard, setPage, setLimit } from '../redux/slices/idCardSlice';
import Loader from '../components/Loader';
import PanelHeader from '../components/PanelHeader';
import { COLORS } from '../theme/dashboardTheme';
import html2canvas from 'html2canvas';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';

// ========== HELPER FUNCTIONS ==========
const getFullImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://local-guider-backend.onrender.com/api/v1';
  const baseUrl = API_BASE_URL.replace('/api/v1', '');
  return `${baseUrl}${path.startsWith('/') ? path : '/' + path}`;
};

const getActualName = (idCard) => {
  const fullName = idCard.fullName || '';
  const blockedWords = ['Photographer', 'Guider', 'Photo', 'photographer', 'guider', 'photo', 'Photography', 'photography'];
  const cleanName = blockedWords.some(word => fullName === word) ? '' : fullName;
  if (cleanName) return cleanName;
  if (idCard.user?.firstName) {
    return `${idCard.user.firstName} ${idCard.user.lastName || ''}`.trim();
  }
  return 'Member';
};

const getActualCompany = (idCard) => {
  const company = idCard.companyName || '';
  const blockedWords = ['Photo', 'photo', 'Photographer', 'photographer'];
  const cleanCompany = blockedWords.some(word => company === word) ? '' : company;
  if (cleanCompany) return cleanCompany;
  if (idCard.user?.companyName) return idCard.user.companyName;
  return 'Independent';
};

const getActualLocation = (idCard) => {
  if (idCard.location && idCard.location !== 'N/A') return idCard.location;
  if (idCard.user?.city) return idCard.user.city;
  return 'N/A';
};

// ========== Custom Toolbar ==========
const CustomToolbar = () => (
  <GridToolbarContainer sx={{ p: 1 }}>
    <GridToolbarFilterButton />
    <GridToolbarExport />
  </GridToolbarContainer>
);

// ========== DOWNLOAD-FRIENDLY ID CARD (Pure HTML/CSS) ==========
const DownloadCardDesign = ({ idCard }) => {
  const imageUrl = getFullImageUrl(idCard.profileImage);
  const displayName = getActualName(idCard);
  const displayCompany = getActualCompany(idCard);
  const displayLocation = getActualLocation(idCard);
  const displayRole = idCard.role || 'MEMBER';
  const placeNames = idCard.placeNames || [];
  const roleBg = displayRole === 'GUIDER' ? '#FFD700' : '#EC4899';
  const roleColor = '#1E3A6E';

  return (
    <div style={{
      width: '400px',
      minHeight: '560px',
      background: 'linear-gradient(145deg, #0A1128 0%, #1C3D5A 40%, #2E5A8A 100%)',
      color: '#fff',
      padding: '24px',
      boxSizing: 'border-box',
      fontFamily: 'Arial, sans-serif',
      position: 'relative',
      overflow: 'hidden',
      borderRadius: '16px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, #FFD700, #F5A623)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>🌍</div>
            <span style={{ fontSize: '20px', fontWeight: 'bold', letterSpacing: '1px', color: '#fff' }}>Local Guider</span>
          </div>
          <div style={{ fontSize: '10px', letterSpacing: '2px', opacity: '0.8', marginTop: '4px', color: '#fff' }}>OFFICIAL ID CARD</div>
        </div>
        <div style={{ fontSize: '36px' }}>🪪</div>
      </div>

      {/* Profile */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '24px', textAlign: 'center', width: '100%' }}>
        <div style={{ position: 'relative', marginBottom: '12px' }}>
          {imageUrl ? (
            <img src={imageUrl} alt="" style={{ width: '90px', height: '90px', borderRadius: '50%', border: '3px solid #FFD700', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '90px', height: '90px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', border: '3px solid #FFD700', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px', color: '#fff' }}>
              {displayName.charAt(0)}
            </div>
          )}
          <div style={{ position: 'absolute', bottom: '0', right: '0', width: '24px', height: '24px', borderRadius: '50%', background: roleBg, border: '2px solid #fff' }} />
        </div>
        <div style={{ width: '100%' }}>
          <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#fff', lineHeight: '1.2', marginBottom: '4px', textAlign: 'center' }}>{displayName}</div>
          <div style={{ fontSize: '14px', opacity: '0.9', color: '#fff', marginBottom: '8px', textAlign: 'center' }}>{displayCompany}</div>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div style={{ padding: '5px 14px', borderRadius: '12px', background: roleBg, color: roleColor, fontWeight: 'bold', fontSize: '11px', letterSpacing: '1px', display: 'inline-block' }}>
              {displayRole}
            </div>
          </div>
        </div>
      </div>

      {/* Details Box */}
      <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '12px', padding: '20px', marginBottom: '16px', border: '1px solid rgba(255,255,255,0.15)', width: '90%', marginLeft: 'auto', marginRight: 'auto' }}>
        <div style={{ marginBottom: '12px', textAlign: 'center' }}>
          <div style={{ fontSize: '11px', opacity: '0.7', letterSpacing: '1px', color: '#fff', marginBottom: '4px' }}>LOCATION</div>
          <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#fff' }}>{displayLocation}</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '11px', opacity: '0.7', letterSpacing: '1px', color: '#fff', marginBottom: '4px' }}>CARD NO</div>
          <div style={{ fontSize: '16px', fontWeight: 'bold', fontFamily: 'monospace', letterSpacing: '1px', color: '#fff' }}>{idCard.cardNumber || 'N/A'}</div>
        </div>
      </div>

      {/* Places Covered */}
      {placeNames.length > 0 ? (
        <div style={{ marginBottom: '16px', textAlign: 'center', width: '100%' }}>
          <div style={{ fontSize: '11px', opacity: '0.8', letterSpacing: '1px', marginBottom: '8px', color: '#fff' }}>PLACES COVERED</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
            {placeNames.map((place, idx) => (
              <span key={idx} style={{ background: 'rgba(255,215,0,0.15)', color: '#FFD700', border: '1px solid rgba(255,215,0,0.3)', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}>
                {place}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {/* Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.15)', width: '100%' }}>
        <span style={{ fontSize: '10px', opacity: '0.6', color: '#fff' }}>Authorized by Local Guider</span>
        <span style={{ fontSize: '10px', opacity: '0.6', fontFamily: 'monospace', color: '#fff' }}>www.localguider.com</span>
      </div>
    </div>
  );
};

// ========== PREVIEW CARD (MUI) ==========
const PreviewCardDesign = ({ idCard }) => {
  const imageUrl = getFullImageUrl(idCard.profileImage);
  const displayName = getActualName(idCard);
  const displayCompany = getActualCompany(idCard);
  const displayLocation = getActualLocation(idCard);
  const displayRole = idCard.role || 'MEMBER';
  const placeNames = idCard.placeNames || [];

  return (
    <Card sx={{
      width: '400px', minHeight: '560px', borderRadius: 4,
      background: 'linear-gradient(145deg, #0A1128 0%, #1C3D5A 40%, #2E5A8A 100%)',
      color: '#fff', position: 'relative', overflow: 'hidden',
      boxShadow: '0 20px 60px rgba(0,0,0,0.4)', border: '2px solid rgba(255,215,0,0.3)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
    }}>
      <CardContent sx={{ p: 3, width: '100%' }}>
        {/* Header */}
        <Stack direction="row" justifyContent="space-between" sx={{ mb: 3, width: '100%' }}>
          <Box>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Box sx={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #FFD700, #F5A623)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🌍</Box>
              <Typography variant="h6" fontWeight="bold" letterSpacing={1}>Local Guider</Typography>
            </Stack>
            <Typography variant="caption" sx={{ opacity: 0.8, letterSpacing: 2, fontSize: '10px' }}>OFFICIAL ID CARD</Typography>
          </Box>
          {/* <FaIdCard size={36} style={{ color: '#FFD700' }} /> */}
          <Box sx={{ marginLeft: 'auto', flexShrink: 0 }}>
            <FaIdCard size={36} style={{ color: '#FFD700' }} />
          </Box>
        </Stack>

        {/* Profile */}
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', mb: 3, width: '100%' }}>
          <Box sx={{ position: 'relative', mb: 1.5 }}>
            <Avatar src={imageUrl || 'https://via.placeholder.com/80'} sx={{ width: 90, height: 90, border: '3px solid #FFD700', bgcolor: 'rgba(255,255,255,0.2)' }}>
              {!imageUrl && displayName.charAt(0)}
            </Avatar>
            <Box sx={{ position: 'absolute', bottom: 0, right: 0, width: 24, height: 24, borderRadius: '50%', bgcolor: displayRole === 'GUIDER' ? '#FFD700' : '#EC4899', border: '2px solid #fff' }} />
          </Box>
          <Box>
            <Typography variant="h5" fontWeight="bold" noWrap>{displayName}</Typography>
            <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>{displayCompany}</Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
              <Chip label={displayRole} size="small" sx={{ bgcolor: displayRole === 'GUIDER' ? '#FFD700' : '#EC4899', color: '#1E3A6E', fontWeight: 'bold' }} />
            </Box>
          </Box>
        </Box>

        {/* Details Box */}
        <Box sx={{ bgcolor: 'rgba(255,255,255,0.08)', borderRadius: 3, p: 2.5, mb: 2, border: '1px solid rgba(255,255,255,0.15)', width: '90%', mx: 'auto' }}>
          <Box sx={{ textAlign: 'center', mb: 2 }}>
            <Typography variant="caption" sx={{ opacity: 0.7, fontSize: '11px', display: 'block' }}>LOCATION</Typography>
            <Typography variant="body2" fontWeight="bold" sx={{ fontSize: '16px' }}>{displayLocation}</Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="caption" sx={{ opacity: 0.7, fontSize: '11px', display: 'block' }}>CARD NO</Typography>
            <Typography variant="body2" fontWeight="bold" fontFamily="monospace" sx={{ fontSize: '16px' }}>{idCard.cardNumber || 'N/A'}</Typography>
          </Box>
        </Box>

        {/* Places Covered */}
        {placeNames.length > 0 ? (
          <Box sx={{ mb: 2, textAlign: 'center', width: '100%' }}>
            <Typography variant="caption" sx={{ opacity: 0.8, fontSize: '11px' }}>PLACES COVERED</Typography>
            <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap', gap: 1, justifyContent: 'center' }}>
              {placeNames.map((place, idx) => (
                <Chip key={idx} label={place} size="small" sx={{ bgcolor: 'rgba(255,215,0,0.15)', color: '#FFD700', border: '1px solid rgba(255,215,0,0.3)', fontWeight: 'bold', fontSize: '11px' }} />
              ))}
            </Stack>
          </Box>
        ) : null}

        <Stack direction="row" justifyContent="space-between" sx={{ mt: 2, pt: 2, borderTop: '1px solid rgba(255,255,255,0.15)', width: '100%' }}>
          <Typography variant="caption" sx={{ opacity: 0.6, fontSize: '10px' }}>Authorized by Local Guider</Typography>
          <Typography variant="caption" sx={{ opacity: 0.6, fontFamily: 'monospace', fontSize: '10px' }}>www.localguider.com</Typography>
        </Stack>
      </CardContent>
    </Card>
  );
};

// ========== MODAL ==========
const IdCardModal = ({ idCard, onClose }) => {
  if (!idCard) return null;
  const [downloading, setDownloading] = useState(false);
  const downloadRef = useRef(null);
  const displayName = getActualName(idCard);

  const downloadAsImage = async () => {
    if (!downloadRef.current) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(downloadRef.current, { scale: 2, useCORS: true, backgroundColor: null });
      canvas.toBlob((blob) => {
        saveAs(blob, `ID-Card-${displayName}.png`);
        toast.success('ID Card downloaded!');
        setDownloading(false);
      }, 'image/png');
    } catch (e) {
      console.error(e);
      toast.error('Download failed');
      setDownloading(false);
    }
  };

  const downloadAsPDF = async () => {
    if (!downloadRef.current) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(downloadRef.current, { scale: 2, useCORS: true, backgroundColor: null });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`ID-Card-${displayName}.pdf`);
      toast.success('PDF downloaded!');
      setDownloading(false);
    } catch (e) {
      console.error(e);
      toast.error('PDF download failed');
      setDownloading(false);
    }
  };

  return (
    <Dialog open={!!idCard} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Stack direction="row" alignItems="center" spacing={1}>
          <FaIdCard style={{ color: '#1E3A6E' }} />
          <span>ID Card Preview</span>
        </Stack>
      </DialogTitle>
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', flexDirection: 'column', alignItems: 'center' }}>
        {/* Hidden HTML version for download */}
        <div style={{ position: 'absolute', left: -9999, top: 0 }}>
          <div ref={downloadRef}>
            <DownloadCardDesign idCard={idCard} />
          </div>
        </div>
        <PreviewCardDesign idCard={idCard} />
      </Box>
      <DialogActions sx={{ px: 3, pb: 3, justifyContent: 'center', gap: 1 }}>
        <Button variant="contained" startIcon={downloading ? <CircularProgress size={16} color="inherit" /> : <FaImage />} onClick={downloadAsImage} disabled={downloading} sx={{ bgcolor: '#1E3A6E' }}>Image</Button>
        <Button variant="contained" startIcon={downloading ? <CircularProgress size={16} color="inherit" /> : <FaFilePdf />} onClick={downloadAsPDF} disabled={downloading} sx={{ bgcolor: '#ED1C24' }}>PDF</Button>
        <Button onClick={onClose} color="inherit">Close</Button>
      </DialogActions>
    </Dialog>
  );
};

// ========== MAIN COMPONENT ==========
const IdCards = () => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { items, loading, pagination } = useSelector((state) => state.idCards);
  const [preview, setPreview] = useState(null);
  const [revokeConfirm, setRevokeConfirm] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');  // ✅ NEW
  const [roleFilter, setRoleFilter] = useState('ALL');       // ✅ NEW
  const [downloadingId, setDownloadingId] = useState(null);
  const hiddenCardRefs = useRef({});

  useEffect(() => {
    dispatch(fetchIdCards({ page: pagination.page, limit: pagination.limit }));
  }, [dispatch, pagination.page, pagination.limit]);

  // ✅ Smart filtering: Search + Status + Role (Client-side)
  const filtered = (items || []).filter((item) => {
    const matchesSearch =
      item.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.cardNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.role?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
    const matchesRole = roleFilter === 'ALL' || item.role === roleFilter;

    return matchesSearch && matchesStatus && matchesRole;
  });

  const handleRevoke = async (id) => {
    try {
      await dispatch(revokeIdCard(id)).unwrap();
      toast.success('ID Card revoked');
      setRevokeConfirm(null);
    } catch {
      toast.error('Revoke failed');
    }
  };

  const handleDirectDownload = async (card) => {
    if (!card?.id) return;
    setDownloadingId(card.id);
    const cardRef = hiddenCardRefs.current[card.id];
    if (!cardRef) {
      toast.error('Card ref not found');
      setDownloadingId(null);
      return;
    }
    try {
      const canvas = await html2canvas(cardRef, { scale: 2, useCORS: true, backgroundColor: null });
      canvas.toBlob((blob) => {
        saveAs(blob, `ID-Card-${getActualName(card)}.png`);
        toast.success('ID Card downloaded!');
        setDownloadingId(null);
      }, 'image/png');
    } catch (error) {
      console.error('Direct download error:', error);
      toast.error('Failed to download');
      setDownloadingId(null);
    }
  };

  const columns = [
    { field: 'profileImage', headerName: 'Photo', flex: 0.5, minWidth: 80, renderCell: (params) => (
      <Avatar src={getFullImageUrl(params.row.profileImage)} alt={params.row.fullName || 'User'} sx={{ width: 40, height: 40 }}>
        {(params.row.fullName || 'U').charAt(0)}
      </Avatar>
    )},
    { field: 'cardNumber', headerName: 'Card No', flex: 0.8, minWidth: 120 },
    { field: 'fullName', headerName: 'Name', flex: 1.2, minWidth: 150, renderCell: (params) => <Typography fontWeight={600}>{getActualName(params.row)}</Typography> },
    { field: 'companyName', headerName: 'Company', flex: 0.8, minWidth: 100, renderCell: (params) => getActualCompany(params.row) },
    { field: 'role', headerName: 'Role', flex: 0.6, minWidth: 100, renderCell: (params) => <Chip label={params.row.role} size="small" color={params.row.role === 'GUIDER' ? 'warning' : 'secondary'} /> },
    { field: 'status', headerName: 'Status', flex: 0.6, minWidth: 100, renderCell: (params) => <Chip label={params.row.status} size="small" color={params.row.status === 'ACTIVE' ? 'success' : params.row.status === 'REVOKED' ? 'error' : 'warning'} /> },
    { field: 'actions', headerName: 'Actions', flex: 1.2, minWidth: 140, renderCell: (params) => (
      <Stack direction="row" spacing={0.5}>
        <IconButton onClick={() => setPreview(params.row)} sx={{ color: COLORS.sky }} title="View ID Card"><FaEye /></IconButton>
        <IconButton onClick={() => handleDirectDownload(params.row)} disabled={downloadingId === params.row.id} sx={{ color: '#1E3A6E' }} title="Download ID Card">
          {downloadingId === params.row.id ? <CircularProgress size={16} /> : <FaDownload />}
        </IconButton>
        {params.row.status === 'ACTIVE' && <IconButton onClick={() => setRevokeConfirm(params.row.id)} sx={{ color: COLORS.rose }} title="Revoke"><FaBan /></IconButton>}
      </Stack>
    )},
  ];

  const renderMobileCards = () => (
    <Stack spacing={2}>
      {filtered.length > 0 ? filtered.map((card) => (
        <Card key={card.id} sx={{ borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <CardContent>
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.5 }}>
              <Avatar src={getFullImageUrl(card.profileImage)} sx={{ width: 50, height: 50 }}>{(card.fullName || 'U').charAt(0)}</Avatar>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="subtitle1" fontWeight={600} noWrap>{getActualName(card)}</Typography>
                <Typography variant="caption" color="textSecondary" noWrap>{card.cardNumber || 'N/A'}</Typography>
              </Box>
              <Chip label={card.status} size="small" color={card.status === 'ACTIVE' ? 'success' : card.status === 'REVOKED' ? 'error' : 'warning'} />
            </Stack>
            <Typography variant="body2" color="textSecondary">{card.role} • {getActualCompany(card)} • {getActualLocation(card)}</Typography>
            <Stack direction="row" justifyContent="flex-end" spacing={1} sx={{ mt: 1, borderTop: '1px solid #f1f5f9', pt: 1 }}>
              <IconButton size="small" onClick={() => setPreview(card)} sx={{ color: COLORS.sky }}><FaEye /></IconButton>
              <IconButton size="small" onClick={() => handleDirectDownload(card)} disabled={downloadingId === card.id} sx={{ color: '#1E3A6E' }}>
                {downloadingId === card.id ? <CircularProgress size={14} /> : <FaDownload />}
              </IconButton>
              {card.status === 'ACTIVE' && <IconButton size="small" onClick={() => setRevokeConfirm(card.id)} sx={{ color: COLORS.rose }}><FaBan /></IconButton>}
            </Stack>
          </CardContent>
        </Card>
      )) : <Typography align="center" color="textSecondary" sx={{ py: 4 }}>No ID cards found</Typography>}
    </Stack>
  );

  return (
    <Box className="fade-in" sx={{ p: { xs: 2, md: 3 }, mt: 0, pt: 1 }}>
      {/* Hidden HTML cards for direct download */}
      {filtered.map((card) => (
        <div key={`hidden-${card.id}`} style={{ position: 'absolute', left: -9999, top: 0 }}>
          <div ref={(el) => { if (el) hiddenCardRefs.current[card.id] = el; }}>
            <DownloadCardDesign idCard={card} />
          </div>
        </div>
      ))}

      <PanelHeader eyebrow="Verification" title="ID Cards Management" />
      
      {/* ✅ Search + Status + Role Filter */}
      <Paper elevation={0} sx={{ p: 2, borderRadius: 4, border: '1px solid #e2e8f0', bgcolor: 'white', mb: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
          <TextField 
            fullWidth 
            placeholder="Search by name, card no, role..." 
            size="small" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            slotProps={{ input: { startAdornment: (<InputAdornment position="start"><FaSearch /></InputAdornment>) } }} 
          />
          <FormControl size="small" sx={{ minWidth: 130 }}>
            <InputLabel>Status</InputLabel>
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} label="Status">
              <MenuItem value="ALL">All Status</MenuItem>
              <MenuItem value="ACTIVE">Active</MenuItem>
              <MenuItem value="REVOKED">Revoked</MenuItem>
              <MenuItem value="EXPIRED">Expired</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 130 }}>
            <InputLabel>Role</InputLabel>
            <Select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} label="Role">
              <MenuItem value="ALL">All Roles</MenuItem>
              <MenuItem value="GUIDER">Guider</MenuItem>
              <MenuItem value="PHOTOGRAPHER">Photographer</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </Paper>

      {isMobile ? (loading ? <Loader /> : renderMobileCards()) : (
        <Paper elevation={0} sx={{ p: 2, borderRadius: 4, border: '1px solid #e2e8f0', bgcolor: 'white' }}>
          {loading ? <Loader /> : (
            <DataGrid rows={filtered} columns={columns} pageSize={pagination.limit}
              rowsPerPageOptions={[5, 10, 25]} page={pagination.page - 1}
              onPageChange={(p) => dispatch(setPage(p + 1))} onPageSizeChange={(s) => dispatch(setLimit(s))}
              components={{ Toolbar: CustomToolbar }} disableSelectionOnClick autoHeight
              sx={{ '& .MuiDataGrid-columnHeaders': { bgcolor: '#F8FAFC', fontWeight: 700 }, '& .MuiDataGrid-row:hover': { bgcolor: '#F0F4FF' } }} />
          )}
        </Paper>
      )}

      <IdCardModal idCard={preview} onClose={() => setPreview(null)} />
      <Dialog open={!!revokeConfirm} onClose={() => setRevokeConfirm(null)}>
        <DialogTitle>Revoke ID Card?</DialogTitle>
        <DialogActions>
          <Button onClick={() => setRevokeConfirm(null)}>Cancel</Button>
          <Button onClick={() => handleRevoke(revokeConfirm)} color="error" variant="contained">Revoke</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default IdCards;
