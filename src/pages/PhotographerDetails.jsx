// src/pages/PhotographerDetails.jsx
import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPhotographerById, clearSelected } from '../redux/slices/photographerSlice';
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

const getFullName = (photographer) => {
  if (photographer.fullName) return photographer.fullName;
  if (photographer.firstName && photographer.lastName) return `${photographer.firstName} ${photographer.lastName}`;
  if (photographer.user?.firstName && photographer.user?.lastName) return `${photographer.user.firstName} ${photographer.user.lastName}`;
  if (photographer.name) return photographer.name;
  return '—';
};

const getEmail = (photographer) => photographer.user?.email || photographer.email || '—';
const getPhone = (photographer) => photographer.user?.phone || photographer.phone || '—';

const PhotographerDetails = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { selectedItem, loading, items } = useSelector((state) => state.photographers);
  const [previewImage, setPreviewImage] = useState(null);
  const [placeNames, setPlaceNames] = useState([]);
  const [downloading, setDownloading] = useState(false);
  const downloadRef = useRef(null);

  useEffect(() => {
    dispatch(fetchPhotographerById(id));
    return () => dispatch(clearSelected());
  }, [dispatch, id]);

  // ✅ Fetch place names from placeIds
  useEffect(() => {
    const fetchPlaceNames = async () => {
      const photographer = selectedItem || items.find(item => item.id === id);
      if (!photographer?.placeIds || photographer.placeIds.length === 0) return;

      try {
        const names = await Promise.all(
          photographer.placeIds.map(async (placeId) => {
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

  let photographer = selectedItem;
  if (!photographer) {
    const fallback = items.find(item => item.id === id);
    if (fallback) photographer = fallback;
  }

  if (!photographer) return <div className="p-4 text-center text-red-500">Photographer not found</div>;

  const fullName = getFullName(photographer);
  const email = getEmail(photographer);
  const phone = getPhone(photographer);

  const imageUrls = {
    profilePhotoUrl: getImageUrl(photographer.profilePhotoUrl || photographer.profileImage),
    selfieUrl: getImageUrl(photographer.selfieUrl),
    idFrontUrl: getImageUrl(photographer.idFrontUrl),
    idBackUrl: getImageUrl(photographer.idBackUrl),
  };

  const imagePreviewStyle = { width: 150, height: 150, objectFit: 'cover', borderRadius: 8, cursor: 'pointer' };

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
      
      pdf.save(`Photographer-Details-${fullName}.pdf`);
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
            <Chip label={photographer.isActive ? 'Active' : 'Inactive'} color={photographer.isActive ? 'success' : 'error'} size="small" sx={{ mt: 1 }} />
          </Box>
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="textSecondary">About</Typography>
            <Typography variant="body1">{photographer.about || photographer.bio || 'No bio provided'}</Typography>
          </Grid>
          <Grid item xs={6} md={3}>
            <Typography variant="subtitle2" color="textSecondary">Experience</Typography>
            <Typography variant="body1">{photographer.experience || 0} years</Typography>
          </Grid>
          <Grid item xs={6} md={3}>
            <Typography variant="subtitle2" color="textSecondary">Rating</Typography>
            <Box display="flex" alignItems="center" gap={0.5}>
              <Star sx={{ color: '#F59E0B' }} />
              <Typography variant="body1">{photographer.rating || 0}</Typography>
            </Box>
          </Grid>
          <Grid item xs={6} md={3}>
            <Typography variant="subtitle2" color="textSecondary">Company</Typography>
            <Typography variant="body1">{photographer.companyName || 'N/A'}</Typography>
          </Grid>
          <Grid item xs={6} md={3}>
            <Typography variant="subtitle2" color="textSecondary">Location</Typography>
            <Typography variant="body1">{photographer.location || photographer.city || 'N/A'}</Typography>
          </Grid>
          <Grid item xs={6} md={3}>
            <Typography variant="subtitle2" color="textSecondary">Camera</Typography>
            <Typography variant="body1">{photographer.cameraDetails || 'N/A'}</Typography>
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
              <div style={{ textAlign: 'center', borderBottom: '4px solid #1E3A6E', paddingBottom: '20px', marginBottom: '20px' }}>
                <h1 style={{ color: '#1E3A6E', fontSize: '32px', margin: '0' }}>Local Guider</h1>
                <h2 style={{ color: '#666', fontSize: '18px', margin: '10px 0 0' }}>Photographer Profile</h2>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px', borderBottom: '2px solid #eee', paddingBottom: '20px' }}>
                {imageUrls.profilePhotoUrl && (
                  <img src={imageUrls.profilePhotoUrl} alt="Profile" style={{ width: '120px', height: '120px', borderRadius: '50%', marginRight: '20px', objectFit: 'cover', border: '4px solid #1E3A6E' }} />
                )}
                <div>
                  <h2 style={{ margin: '0 0 5px', fontSize: '28px' }}>{fullName}</h2>
                  <p style={{ margin: '4px 0', fontSize: '14px' }}><strong>Company:</strong> {photographer.companyName || 'N/A'}</p>
                  <p style={{ margin: '4px 0', fontSize: '14px' }}><strong>Location:</strong> {photographer.location || photographer.city || 'N/A'}</p>
                  <p style={{ margin: '4px 0', fontSize: '14px' }}><strong>Status:</strong> {photographer.isActive ? 'Active' : 'Inactive'}</p>
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ color: '#1E3A6E', borderBottom: '2px solid #1E3A6E', paddingBottom: '5px', fontSize: '20px' }}>Contact Information</h3>
                <p style={{ margin: '8px 0', fontSize: '14px' }}><strong>Email:</strong> {email}</p>
                <p style={{ margin: '8px 0', fontSize: '14px' }}><strong>Phone:</strong> {phone}</p>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ color: '#1E3A6E', borderBottom: '2px solid #1E3A6E', paddingBottom: '5px', fontSize: '20px' }}>Professional Information</h3>
                <p style={{ margin: '8px 0', fontSize: '14px' }}><strong>Experience:</strong> {photographer.experience || 0} years</p>
                <p style={{ margin: '8px 0', fontSize: '14px' }}><strong>Rating:</strong> {photographer.rating || 0}</p>
                <p style={{ margin: '8px 0', fontSize: '14px' }}><strong>Camera:</strong> {photographer.cameraDetails || 'N/A'}</p>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ color: '#1E3A6E', borderBottom: '2px solid #1E3A6E', paddingBottom: '5px', fontSize: '20px' }}>About</h3>
                <p style={{ fontSize: '14px', lineHeight: '1.6' }}>{photographer.about || photographer.bio || 'No bio provided'}</p>
              </div>

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

              <div style={{ textAlign: 'center', borderTop: '2px solid #1E3A6E', paddingTop: '10px', marginTop: '20px' }}>
                <p style={{ color: '#888', fontSize: '12px' }}>© 2026 Local Guider. All rights reserved.</p>
              </div>
            </div>
          </div>
        </div>

        <Dialog open={!!previewImage} onClose={() => setPreviewImage(null)} maxWidth="md">
          <DialogContent>
            <img src={previewImage} alt="Preview" style={{ width: '100%', maxHeight: 600, objectFit: 'contain' }} />
          </DialogContent>
        </Dialog>
      </Paper>
    </div>
  );
};

export default PhotographerDetails;
