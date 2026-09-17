// src/pages/GuiderDetails.jsx
import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchGuiderById, clearSelected } from '../redux/slices/guiderSlice';
import { FaArrowLeft, FaFilePdf } from 'react-icons/fa';
import { Avatar, Box, Typography, Paper, Grid, Chip, Button, Stack, Divider, CircularProgress, Dialog, DialogContent } from '@mui/material';
import { Star } from '@mui/icons-material';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import apiClient from '../api/axios';

const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://local-guider-backend.onrender.com/api/v1';
  const baseUrl = API_BASE_URL.replace('/api/v1', '');
  return `${baseUrl}${path.startsWith('/') ? path : '/' + path}`;
};

const getFullName = (guider) => {
  if (guider.fullName) return guider.fullName;
  if (guider.firstName && guider.lastName) return `${guider.firstName} ${guider.lastName}`;
  if (guider.user?.firstName && guider.user?.lastName) return `${guider.user.firstName} ${guider.user.lastName}`;
  if (guider.name) return guider.name;
  return '—';
};

const getEmail = (guider) => guider.user?.email || guider.email || guider.User?.email || '—';
const getPhone = (guider) => guider.user?.phone || guider.phone || guider.User?.phone || '—';

const GuiderDetails = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { selectedItem, loading, items } = useSelector((state) => state.guiders);
  const [previewImage, setPreviewImage] = useState(null);
  const [placeNames, setPlaceNames] = useState([]);
  const [downloading, setDownloading] = useState(false);
  const downloadRef = useRef(null);

  useEffect(() => {
    dispatch(fetchGuiderById(id));
    return () => dispatch(clearSelected());
  }, [dispatch, id]);

  // ✅ Fetch place names from placeIds
  useEffect(() => {
    const fetchPlaceNames = async () => {
      const guider = selectedItem || items.find(item => item.id === id);
      if (!guider?.placeIds || guider.placeIds.length === 0) return;

      try {
        const names = await Promise.all(
          guider.placeIds.map(async (placeId) => {
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
  }, [selectedItem, items, id]);

  if (loading) return <div className="flex justify-center py-10">Loading...</div>;

  let guider = selectedItem;
  if (!guider) {
    const fallback = items.find(item => item.id === id);
    if (fallback) guider = fallback;
  }

  if (!guider) return <div className="p-4 text-center text-red-500">Guider not found</div>;

  const fullName = getFullName(guider);
  const email = getEmail(guider);
  const phone = getPhone(guider);

  const imageUrls = {
    profilePhotoUrl: getImageUrl(guider.profilePhotoUrl || guider.profileImage),
    selfieUrl: getImageUrl(guider.selfieUrl),
    idFrontUrl: getImageUrl(guider.idFrontUrl),
    idBackUrl: getImageUrl(guider.idBackUrl),
  };

  const imagePreviewStyle = { width: 150, height: 150, objectFit: 'cover', borderRadius: 8, cursor: 'pointer' };

  // ✅ PDF Download
  const downloadAsPDF = async () => {
    if (!downloadRef.current) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(downloadRef.current, { scale: 3, useCORS: true, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Agar image lambi hai to multiple pages me split karo
      let heightLeft = imgHeight;
      let position = 0;
      
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;
      
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }
      
      pdf.save(`Guider-Details-${fullName}.pdf`);
    } catch (e) {
      console.error('PDF Error:', e);
      alert('PDF download failed');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="p-4">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-indigo-600 mb-4 hover:underline">
        <FaArrowLeft /> Back
      </button>

      <Paper elevation={3} className="p-6 rounded-xl">
        <Box display="flex" alignItems="center" gap={3} mb={4}>
          <Avatar src={imageUrls.profilePhotoUrl} alt={fullName} sx={{ width: 100, height: 100 }} />
          <Box>
            <Typography variant="h4" fontWeight="bold">{fullName}</Typography>
            <Typography variant="body2" color="textSecondary">{email}</Typography>
            <Typography variant="body2" color="textSecondary">Phone: {phone}</Typography>
            <Chip label={guider.isActive ? 'Active' : 'Inactive'} color={guider.isActive ? 'success' : 'error'} size="small" sx={{ mt: 1 }} />
          </Box>
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="textSecondary">About</Typography>
            <Typography variant="body1">{guider.about || guider.bio || 'No bio provided'}</Typography>
          </Grid>
          <Grid item xs={6} md={3}>
            <Typography variant="subtitle2" color="textSecondary">Experience</Typography>
            <Typography variant="body1">{guider.experience || 0} years</Typography>
          </Grid>
          <Grid item xs={6} md={3}>
            <Typography variant="subtitle2" color="textSecondary">Rating</Typography>
            <Box display="flex" alignItems="center" gap={0.5}>
              <Star sx={{ color: '#F59E0B' }} />
              <Typography variant="body1">{guider.rating || 0}</Typography>
            </Box>
          </Grid>
          <Grid item xs={6} md={3}>
            <Typography variant="subtitle2" color="textSecondary">Company</Typography>
            <Typography variant="body1">{guider.companyName || 'N/A'}</Typography>
          </Grid>
          <Grid item xs={6} md={3}>
            <Typography variant="subtitle2" color="textSecondary">Location</Typography>
            <Typography variant="body1">{guider.location || guider.city || 'N/A'}</Typography>
          </Grid>
          <Grid item xs={6} md={3}>
            <Typography variant="subtitle2" color="textSecondary">Languages</Typography>
            <Typography variant="body1">{guider.languages?.join(', ') || 'N/A'}</Typography>
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        {/* Documents Section */}
        <Typography variant="h6" gutterBottom>Documents</Typography>
        <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
          {imageUrls.profilePhotoUrl && (
            <Box onClick={() => setPreviewImage(imageUrls.profilePhotoUrl)} sx={{ textAlign: 'center' }}>
              <img src={imageUrls.profilePhotoUrl} alt="Profile" style={imagePreviewStyle} />
              <Typography variant="caption">Profile Photo</Typography>
            </Box>
          )}
          {imageUrls.selfieUrl && (
            <Box onClick={() => setPreviewImage(imageUrls.selfieUrl)} sx={{ textAlign: 'center' }}>
              <img src={imageUrls.selfieUrl} alt="Selfie" style={imagePreviewStyle} />
              <Typography variant="caption">Selfie</Typography>
            </Box>
          )}
          {imageUrls.idFrontUrl && (
            <Box onClick={() => setPreviewImage(imageUrls.idFrontUrl)} sx={{ textAlign: 'center' }}>
              <img src={imageUrls.idFrontUrl} alt="ID Front" style={imagePreviewStyle} />
              <Typography variant="caption">ID Front</Typography>
            </Box>
          )}
          {imageUrls.idBackUrl && (
            <Box onClick={() => setPreviewImage(imageUrls.idBackUrl)} sx={{ textAlign: 'center' }}>
              <img src={imageUrls.idBackUrl} alt="ID Back" style={imagePreviewStyle} />
              <Typography variant="caption">ID Back</Typography>
            </Box>
          )}
        </Stack>

        {/* Places */}
        {placeNames.length > 0 && (
          <>
            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Places</Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {placeNames.map((place, idx) => (
                <Chip key={idx} label={place} variant="outlined" color="primary" />
              ))}
            </Stack>
          </>
        )}

        {/* Download PDF Button */}
        <Button
          variant="contained"
          color="primary"
          startIcon={downloading ? <CircularProgress size={16} color="inherit" /> : <FaFilePdf />}
          onClick={downloadAsPDF}
          disabled={downloading}
          sx={{ mt: 3, bgcolor: '#1E3A6E', '&:hover': { bgcolor: '#0B1A30' } }}
        >
          {downloading ? 'Downloading...' : 'Download PDF'}
        </Button>

        {/* Hidden PDF Design */}
        <div style={{ position: 'absolute', left: -9999, top: 0 }}>
          <div ref={downloadRef}>
            <div style={{ width: '794px', minHeight: '1123px', padding: '40px', fontFamily: 'Arial, sans-serif', background: '#ffffff', color: '#000000' }}>
              {/* Header */}
              <div style={{ textAlign: 'center', borderBottom: '4px solid #1E3A6E', paddingBottom: '20px', marginBottom: '20px' }}>
                <h1 style={{ color: '#1E3A6E', fontSize: '32px', margin: '0' }}>Local Guider</h1>
                <h2 style={{ color: '#666', fontSize: '18px', margin: '10px 0 0' }}>Guider Profile</h2>
              </div>

              {/* Profile Section */}
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px', borderBottom: '2px solid #eee', paddingBottom: '20px' }}>
                {imageUrls.profilePhotoUrl && (
                  <img src={imageUrls.profilePhotoUrl} alt="Profile" style={{ width: '120px', height: '120px', borderRadius: '50%', marginRight: '20px', objectFit: 'cover', border: '4px solid #1E3A6E' }} />
                )}
                <div>
                  <h2 style={{ margin: '0 0 5px', fontSize: '28px' }}>{fullName}</h2>
                  <p style={{ margin: '4px 0', fontSize: '14px' }}><strong>Company:</strong> {guider.companyName || 'N/A'}</p>
                  <p style={{ margin: '4px 0', fontSize: '14px' }}><strong>Location:</strong> {guider.location || guider.city || 'N/A'}</p>
                  <p style={{ margin: '4px 0', fontSize: '14px' }}><strong>Status:</strong> {guider.isActive ? 'Active' : 'Inactive'}</p>
                </div>
              </div>

              {/* Contact Info */}
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ color: '#1E3A6E', borderBottom: '2px solid #1E3A6E', paddingBottom: '5px', fontSize: '20px' }}>Contact Information</h3>
                <p style={{ margin: '8px 0', fontSize: '14px' }}><strong>Email:</strong> {email}</p>
                <p style={{ margin: '8px 0', fontSize: '14px' }}><strong>Phone:</strong> {phone}</p>
              </div>

              {/* Professional Info */}
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ color: '#1E3A6E', borderBottom: '2px solid #1E3A6E', paddingBottom: '5px', fontSize: '20px' }}>Professional Information</h3>
                <p style={{ margin: '8px 0', fontSize: '14px' }}><strong>Experience:</strong> {guider.experience || 0} years</p>
                <p style={{ margin: '8px 0', fontSize: '14px' }}><strong>Rating:</strong> {guider.rating || 0}</p>
                <p style={{ margin: '8px 0', fontSize: '14px' }}><strong>Languages:</strong> {guider.languages?.join(', ') || 'N/A'}</p>
              </div>

              {/* Bio */}
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ color: '#1E3A6E', borderBottom: '2px solid #1E3A6E', paddingBottom: '5px', fontSize: '20px' }}>About</h3>
                <p style={{ fontSize: '14px', lineHeight: '1.6' }}>{guider.about || guider.bio || 'No bio provided'}</p>
              </div>

              {/* Documents */}
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ color: '#1E3A6E', borderBottom: '2px solid #1E3A6E', paddingBottom: '5px', fontSize: '20px' }}>Documents</h3>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {imageUrls.profilePhotoUrl && (
                    <div style={{ textAlign: 'center' }}>
                      <img src={imageUrls.profilePhotoUrl} alt="Profile" style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '5px' }} />
                      <p style={{ fontSize: '12px', margin: '5px 0' }}>Profile</p>
                    </div>
                  )}
                  {imageUrls.selfieUrl && (
                    <div style={{ textAlign: 'center' }}>
                      <img src={imageUrls.selfieUrl} alt="Selfie" style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '5px' }} />
                      <p style={{ fontSize: '12px', margin: '5px 0' }}>Selfie</p>
                    </div>
                  )}
                  {imageUrls.idFrontUrl && (
                    <div style={{ textAlign: 'center' }}>
                      <img src={imageUrls.idFrontUrl} alt="ID Front" style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '5px' }} />
                      <p style={{ fontSize: '12px', margin: '5px 0' }}>ID Front</p>
                    </div>
                  )}
                  {imageUrls.idBackUrl && (
                    <div style={{ textAlign: 'center' }}>
                      <img src={imageUrls.idBackUrl} alt="ID Back" style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '5px' }} />
                      <p style={{ fontSize: '12px', margin: '5px 0' }}>ID Back</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Places */}
              {placeNames.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                  <h3 style={{ color: '#1E3A6E', borderBottom: '2px solid #1E3A6E', paddingBottom: '5px', fontSize: '20px' }}>Places</h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {placeNames.map((place, idx) => (
                      <span key={idx} style={{ background: '#F0F4FF', color: '#1E3A6E', padding: '6px 12px', borderRadius: '15px', fontSize: '13px', fontWeight: '600' }}>
                        {place}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Footer */}
              <div style={{ textAlign: 'center', borderTop: '2px solid #1E3A6E', paddingTop: '10px', marginTop: '20px' }}>
                <p style={{ color: '#888', fontSize: '12px' }}>© 2026 Local Guider. All rights reserved.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Image Preview Dialog */}
        <Dialog open={!!previewImage} onClose={() => setPreviewImage(null)} maxWidth="md">
          <DialogContent>
            <img src={previewImage} alt="Preview" style={{ width: '100%', maxHeight: 600, objectFit: 'contain' }} />
          </DialogContent>
        </Dialog>
      </Paper>
    </div>
  );
};

export default GuiderDetails;
