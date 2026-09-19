// src/pages/IdCards.jsx
import { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  FaIdCard, FaBan, FaDownload, FaEye, FaFilePdf, FaImage,
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import {
  Box, Paper, Typography, Button, IconButton, Chip, InputAdornment,
  TextField, Stack, Dialog, DialogTitle, DialogActions,
  DialogContent, useMediaQuery, useTheme, Avatar, CircularProgress,
  FormControl, InputLabel, Select, MenuItem, Tooltip, Divider,
} from '@mui/material';
import {
  Search as SearchIcon, Refresh, Inbox,
} from '@mui/icons-material';
import {
  DataGrid, GridToolbarContainer, GridToolbarFilterButton, GridToolbarExport,
} from '@mui/x-data-grid';
import {
  fetchIdCards, revokeIdCard, setPage, setLimit,
} from '../redux/slices/idCardSlice';
import Loader from '../components/Loader';
import PanelHeader from '../components/PanelHeader';
import html2canvas from 'html2canvas';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';

// ═══════════════════════════════════════════════════════════════
// LOGO PATH — public/ folder se serve hota hai
// File: public/assets/images/logo21.jpg
// Browser URL: /assets/images/logo21.jpg
// ═══════════════════════════════════════════════════════════════
const LOGO_SRC = '/assets/images/logo21.jpg';

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
  gold: '#FFD700',
  goldDark: '#F5A623',
  radius: 3,
  fontDisplay: '"Inter", system-ui, -apple-system, sans-serif',
};

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════
const getFullImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const API_BASE_URL =
    import.meta.env.VITE_API_URL ||
    'https://local-guider-backend.onrender.com/api/v1';
  const baseUrl = API_BASE_URL.replace('/api/v1', '');
  return `${baseUrl}${path.startsWith('/') ? path : '/' + path}`;
};

const getActualName = (idCard) => {
  const fullName = idCard.fullName || '';
  const blockedWords = [
    'Photographer', 'Guider', 'Photo',
    'photographer', 'guider', 'photo',
    'Photography', 'photography',
  ];
  const cleanName = blockedWords.some((w) => fullName === w) ? '' : fullName;
  if (cleanName) return cleanName;
  if (idCard.user?.firstName) {
    return `${idCard.user.firstName} ${idCard.user.lastName || ''}`.trim();
  }
  return 'Member';
};

const getActualCompany = (idCard) => {
  const company = idCard.companyName || '';
  const blockedWords = ['Photo', 'photo', 'Photographer', 'photographer'];
  const cleanCompany = blockedWords.some((w) => company === w) ? '' : company;
  if (cleanCompany) return cleanCompany;
  if (idCard.user?.companyName) return idCard.user.companyName;
  return 'Independent';
};

const getActualLocation = (idCard) => {
  if (idCard.location && idCard.location !== 'N/A') return idCard.location;
  if (idCard.user?.city) return idCard.user.city;
  return 'N/A';
};

const STATUS_STYLES = {
  ACTIVE: { bg: T.emeraldSoft, color: '#047857' },
  REVOKED: { bg: T.roseSoft, color: '#be123c' },
  EXPIRED: { bg: T.amberSoft, color: '#b45309' },
};

const ROLE_STYLES = {
  GUIDER: { bg: T.violetSoft, color: '#6d28d9' },
  PHOTOGRAPHER: { bg: T.roseSoft, color: '#be185d' },
  USER: { bg: T.skySoft, color: '#0369a1' },
};

const CustomToolbar = () => (
  <GridToolbarContainer sx={{ p: 1 }}>
    <GridToolbarFilterButton />
    <GridToolbarExport />
  </GridToolbarContainer>
);

// ═══════════════════════════════════════════════════════════════
// DOWNLOAD CARD DESIGN — Light premium card (for html2canvas)
// ═══════════════════════════════════════════════════════════════
const DownloadCardDesign = ({ idCard }) => {
  const imageUrl = getFullImageUrl(idCard.profileImage);
  const displayName = getActualName(idCard);
  const displayCompany = getActualCompany(idCard);
  const displayLocation = getActualLocation(idCard);
  const displayRole = idCard.role || 'MEMBER';
  const placeNames = idCard.placeNames || [];
  const isGuider = displayRole === 'GUIDER';
  const accentColor = isGuider ? '#8b5cf6' : '#ec4899';
  const accentColorDark = isGuider ? '#6d28d9' : '#be185d';

  return (
    <div
      style={{
        width: '400px',
        minHeight: '580px',
        background: '#ffffff',
        color: '#0b1220',
        padding: '0',
        boxSizing: 'border-box',
        fontFamily: 'Inter, Arial, sans-serif',
        position: 'relative',
        overflow: 'hidden',
        borderRadius: '20px',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 20px 60px rgba(99,102,241,0.15)',
      }}
    >
      {/* Top rainbow strip */}
      <div
        style={{
          height: '6px',
          background: 'linear-gradient(90deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)',
          flexShrink: 0,
        }}
      />

      {/* Decorative mesh background */}
      <div
        style={{
          position: 'absolute',
          top: '-100px',
          right: '-100px',
          width: '320px',
          height: '320px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(139,92,246,0.15), transparent 70%)',
          filter: 'blur(40px)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-100px',
          left: '-100px',
          width: '320px',
          height: '320px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.12), transparent 70%)',
          filter: 'blur(40px)',
          pointerEvents: 'none',
        }}
      />

      {/* Content wrapper */}
      <div
        style={{
          padding: '28px',
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '26px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ position: 'relative', width: '48px', height: '48px', flexShrink: 0 }}>
              <div
                style={{
                  position: 'absolute',
                  inset: '-4px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #FFD700, #F5A623)',
                  opacity: 0.35,
                  filter: 'blur(6px)',
                }}
              />
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  background: '#ffffff',
                  overflow: 'hidden',
                  boxShadow:
                    '0 0 0 2px rgba(255,215,0,0.5), 0 4px 12px rgba(99,102,241,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <img
                  src={LOGO_SRC}
                  alt="Local Guider"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
            </div>
            <div>
              <div
                style={{
                  fontSize: '18px',
                  fontWeight: 800,
                  letterSpacing: '-0.01em',
                  color: '#0b1220',
                  lineHeight: 1.15,
                }}
              >
                Local Guider
              </div>
              <div
                style={{
                  fontSize: '9px',
                  letterSpacing: '2.5px',
                  color: '#6366f1',
                  marginTop: '3px',
                  fontWeight: 700,
                }}
              >
                OFFICIAL ID CARD
              </div>
            </div>
          </div>
          <div
            style={{
              fontSize: '32px',
              opacity: 0.15,
              fontWeight: 'bold',
              color: '#0b1220',
            }}
          >
            🪪
          </div>
        </div>

        {/* Profile */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            marginBottom: '24px',
            textAlign: 'center',
          }}
        >
          <div style={{ position: 'relative', marginBottom: '14px' }}>
            {imageUrl ? (
              <img
                src={imageUrl}
                alt=""
                style={{
                  width: '100px',
                  height: '100px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '4px solid #ffffff',
                  boxShadow: `0 0 0 3px ${accentColor}40, 0 8px 24px ${accentColor}30`,
                }}
              />
            ) : (
              <div
                style={{
                  width: '100px',
                  height: '100px',
                  borderRadius: '50%',
                  background: `linear-gradient(135deg, ${accentColor}, ${accentColorDark})`,
                  border: '4px solid #ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '40px',
                  color: '#ffffff',
                  fontWeight: 'bold',
                  boxShadow: `0 0 0 3px ${accentColor}40, 0 8px 24px ${accentColor}30`,
                }}
              >
                {displayName.charAt(0)}
              </div>
            )}
            <div
              style={{
                position: 'absolute',
                bottom: '4px',
                right: '4px',
                width: '22px',
                height: '22px',
                borderRadius: '50%',
                background: accentColor,
                border: '3px solid #ffffff',
                boxShadow: `0 2px 8px ${accentColor}60`,
              }}
            />
          </div>

          <div
            style={{
              fontSize: '24px',
              fontWeight: 800,
              color: '#0b1220',
              lineHeight: 1.15,
              marginBottom: '5px',
              letterSpacing: '-0.01em',
            }}
          >
            {displayName}
          </div>
          <div
            style={{
              fontSize: '13px',
              color: '#64748b',
              marginBottom: '12px',
              fontWeight: 500,
            }}
          >
            {displayCompany}
          </div>
          <div
            style={{
              padding: '6px 18px',
              borderRadius: '999px',
              background: `linear-gradient(135deg, ${accentColor}, ${accentColorDark})`,
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '11px',
              letterSpacing: '1.5px',
              display: 'inline-block',
              boxShadow: `0 4px 14px ${accentColor}50`,
            }}
          >
            {displayRole}
          </div>
        </div>

        {/* Details Box */}
        <div
          style={{
            background: 'linear-gradient(135deg, #fafbff 0%, #f5f3ff 100%)',
            borderRadius: '14px',
            padding: '20px',
            marginBottom: '18px',
            border: '1px solid #eef1f6',
          }}
        >
          <div
            style={{
              textAlign: 'center',
              paddingBottom: '14px',
              borderBottom: '1px solid #eef1f6',
            }}
          >
            <div
              style={{
                fontSize: '10px',
                color: '#6366f1',
                letterSpacing: '1.5px',
                marginBottom: '6px',
                fontWeight: 700,
                textTransform: 'uppercase',
              }}
            >
              Location
            </div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#0b1220' }}>
              {displayLocation}
            </div>
          </div>
          <div style={{ textAlign: 'center', paddingTop: '14px' }}>
            <div
              style={{
                fontSize: '10px',
                color: '#6366f1',
                letterSpacing: '1.5px',
                marginBottom: '6px',
                fontWeight: 700,
                textTransform: 'uppercase',
              }}
            >
              Card Number
            </div>
            <div
              style={{
                fontSize: '16px',
                fontWeight: 800,
                fontFamily: 'Courier New, monospace',
                letterSpacing: '1.5px',
                color: '#0b1220',
              }}
            >
              {idCard.cardNumber || 'N/A'}
            </div>
          </div>
        </div>

        {/* Places */}
        {placeNames.length > 0 && (
          <div style={{ marginBottom: '18px', textAlign: 'center' }}>
            <div
              style={{
                fontSize: '10px',
                color: '#6366f1',
                letterSpacing: '1.5px',
                marginBottom: '10px',
                fontWeight: 700,
                textTransform: 'uppercase',
              }}
            >
              Places Covered
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
              {placeNames.map((place, idx) => (
                <span
                  key={idx}
                  style={{
                    background: 'rgba(99,102,241,0.08)',
                    color: '#4f46e5',
                    border: '1px solid rgba(99,102,241,0.2)',
                    padding: '5px 12px',
                    borderRadius: '999px',
                    fontSize: '10px',
                    fontWeight: 700,
                    letterSpacing: '0.03em',
                  }}
                >
                  {place}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: 'auto',
            paddingTop: '18px',
            borderTop: '1px solid #eef1f6',
          }}
        >
          <span style={{ fontSize: '9px', color: '#94a3b8', letterSpacing: '0.03em', fontWeight: 500 }}>
            Authorized by Local Guider
          </span>
          <span
            style={{
              fontSize: '9px',
              color: '#94a3b8',
              fontFamily: 'Courier New, monospace',
              letterSpacing: '0.03em',
              fontWeight: 500,
            }}
          >
            www.localguider.com
          </span>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// PREVIEW CARD (MUI) — mirrors DownloadCardDesign
// ═══════════════════════════════════════════════════════════════
const PreviewCardDesign = ({ idCard }) => {
  const imageUrl = getFullImageUrl(idCard.profileImage);
  const displayName = getActualName(idCard);
  const displayCompany = getActualCompany(idCard);
  const displayLocation = getActualLocation(idCard);
  const displayRole = idCard.role || 'MEMBER';
  const placeNames = idCard.placeNames || [];
  const isGuider = displayRole === 'GUIDER';
  const accentColor = isGuider ? '#8b5cf6' : '#ec4899';
  const accentColorDark = isGuider ? '#6d28d9' : '#be185d';

  return (
    <Paper
      elevation={0}
      sx={{
        width: '100%',
        maxWidth: 400,
        minHeight: 580,
        borderRadius: 3,
        background: '#ffffff',
        color: T.textPrimary,
        position: 'relative',
        overflow: 'hidden',
        boxShadow: `0 20px 60px ${accentColor}25, 0 8px 20px rgba(15,23,42,0.08)`,
        display: 'flex',
        flexDirection: 'column',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 6,
          background: 'linear-gradient(90deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)',
          zIndex: 2,
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          top: -100,
          right: -100,
          width: 320,
          height: 320,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(139,92,246,0.15), transparent 70%)',
          filter: 'blur(40px)',
          pointerEvents: 'none',
        },
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          bottom: -100,
          left: -100,
          width: 320,
          height: 320,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.12), transparent 70%)',
          filter: 'blur(40px)',
          pointerEvents: 'none',
        }}
      />

      <Box
        sx={{
          p: 3.5,
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
        }}
      >
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 3.25,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ position: 'relative', width: 48, height: 48, flexShrink: 0 }}>
              <Box
                sx={{
                  position: 'absolute',
                  inset: -4,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #FFD700, #F5A623)',
                  opacity: 0.35,
                  filter: 'blur(6px)',
                }}
              />
              <Box
                sx={{
                  position: 'relative',
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  bgcolor: '#ffffff',
                  overflow: 'hidden',
                  boxShadow:
                    '0 0 0 2px rgba(255,215,0,0.5), 0 4px 12px rgba(99,102,241,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Box
                  component="img"
                  src={LOGO_SRC}
                  alt="Local Guider"
                  sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </Box>
            </Box>
            <Box>
              <Typography
                sx={{
                  fontFamily: T.fontDisplay,
                  fontWeight: 800,
                  fontSize: '1.05rem',
                  color: T.textPrimary,
                  lineHeight: 1.15,
                  letterSpacing: '-0.01em',
                }}
              >
                Local Guider
              </Typography>
              <Typography
                sx={{
                  fontSize: '0.6rem',
                  color: T.indigo,
                  letterSpacing: '0.15em',
                  fontWeight: 700,
                  mt: 0.3,
                }}
              >
                OFFICIAL ID CARD
              </Typography>
            </Box>
          </Box>
          <Typography sx={{ fontSize: '1.75rem', opacity: 0.15, fontWeight: 'bold' }}>
            🪪
          </Typography>
        </Box>

        {/* Profile */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            mb: 3,
          }}
        >
          <Box sx={{ position: 'relative', mb: 1.75 }}>
            <Avatar
              src={imageUrl || undefined}
              sx={{
                width: 100,
                height: 100,
                border: '4px solid #ffffff',
                bgcolor: accentColor,
                fontSize: '2.5rem',
                fontWeight: 700,
                color: '#fff',
                boxShadow: `0 0 0 3px ${accentColor}40, 0 8px 24px ${accentColor}30`,
              }}
            >
              {!imageUrl && displayName.charAt(0)}
            </Avatar>
            <Box
              sx={{
                position: 'absolute',
                bottom: 4,
                right: 4,
                width: 22,
                height: 22,
                borderRadius: '50%',
                bgcolor: accentColor,
                border: '3px solid #ffffff',
                boxShadow: `0 2px 8px ${accentColor}60`,
              }}
            />
          </Box>

          <Typography
            sx={{
              fontFamily: T.fontDisplay,
              fontWeight: 800,
              fontSize: '1.5rem',
              color: T.textPrimary,
              lineHeight: 1.15,
              letterSpacing: '-0.01em',
            }}
            noWrap
          >
            {displayName}
          </Typography>
          <Typography
            sx={{ fontSize: '0.8rem', color: T.textMuted, mt: 0.5, fontWeight: 500 }}
          >
            {displayCompany}
          </Typography>

          <Box
            sx={{
              mt: 1.5,
              px: 2.25,
              py: 0.75,
              borderRadius: 999,
              background: `linear-gradient(135deg, ${accentColor}, ${accentColorDark})`,
              color: '#fff',
              fontWeight: 700,
              fontSize: '0.68rem',
              letterSpacing: '0.1em',
              boxShadow: `0 4px 14px ${accentColor}50`,
            }}
          >
            {displayRole}
          </Box>
        </Box>

        {/* Details Box */}
        <Box
          sx={{
            background: 'linear-gradient(135deg, #fafbff 0%, #f5f3ff 100%)',
            borderRadius: 2,
            p: 2.5,
            mb: 2.25,
            border: `1px solid ${T.border}`,
          }}
        >
          <Box
            sx={{
              textAlign: 'center',
              pb: 1.75,
              borderBottom: `1px solid ${T.border}`,
            }}
          >
            <Typography
              sx={{
                fontSize: '0.6rem',
                color: T.indigo,
                letterSpacing: '0.15em',
                fontWeight: 700,
                mb: 0.75,
                textTransform: 'uppercase',
              }}
            >
              Location
            </Typography>
            <Typography sx={{ fontSize: '0.95rem', fontWeight: 700, color: T.textPrimary }}>
              {displayLocation}
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center', pt: 1.75 }}>
            <Typography
              sx={{
                fontSize: '0.6rem',
                color: T.indigo,
                letterSpacing: '0.15em',
                fontWeight: 700,
                mb: 0.75,
                textTransform: 'uppercase',
              }}
            >
              Card Number
            </Typography>
            <Typography
              sx={{
                fontSize: '1rem',
                fontWeight: 800,
                color: T.textPrimary,
                fontFamily: 'monospace',
                letterSpacing: '0.12em',
              }}
            >
              {idCard.cardNumber || 'N/A'}
            </Typography>
          </Box>
        </Box>

        {/* Places */}
        {placeNames.length > 0 && (
          <Box sx={{ mb: 2.25, textAlign: 'center' }}>
            <Typography
              sx={{
                fontSize: '0.6rem',
                color: T.indigo,
                letterSpacing: '0.15em',
                fontWeight: 700,
                mb: 1.25,
                textTransform: 'uppercase',
              }}
            >
              Places Covered
            </Typography>
            <Stack
              direction="row"
              spacing={0.75}
              sx={{ flexWrap: 'wrap', gap: 0.75, justifyContent: 'center' }}
            >
              {placeNames.map((place, idx) => (
                <Chip
                  key={idx}
                  label={place}
                  size="small"
                  sx={{
                    bgcolor: 'rgba(99,102,241,0.08)',
                    color: '#4f46e5',
                    border: '1px solid rgba(99,102,241,0.2)',
                    fontWeight: 700,
                    fontSize: '0.65rem',
                    height: 22,
                    borderRadius: 999,
                    letterSpacing: '0.02em',
                  }}
                />
              ))}
            </Stack>
          </Box>
        )}

        {/* Footer */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mt: 'auto',
            pt: 2.25,
            borderTop: `1px solid ${T.border}`,
          }}
        >
          <Typography
            sx={{
              fontSize: '0.6rem',
              color: T.textFaint,
              letterSpacing: '0.03em',
              fontWeight: 500,
            }}
          >
            Authorized by Local Guider
          </Typography>
          <Typography
            sx={{
              fontSize: '0.6rem',
              color: T.textFaint,
              fontFamily: 'monospace',
              letterSpacing: '0.03em',
              fontWeight: 500,
            }}
          >
            www.localguider.com
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
};

// ═══════════════════════════════════════════════════════════════
// ID CARD MODAL
// ═══════════════════════════════════════════════════════════════
const IdCardModal = ({ idCard, onClose }) => {
  const [downloading, setDownloading] = useState(false);
  const downloadRef = useRef(null);
  if (!idCard) return null;
  const displayName = getActualName(idCard);

  const downloadAsImage = async () => {
    if (!downloadRef.current) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(downloadRef.current, {
        scale: 2, useCORS: true, backgroundColor: null,
      });
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
      const canvas = await html2canvas(downloadRef.current, {
        scale: 2, useCORS: true, backgroundColor: null,
      });
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
    <Dialog
      open={!!idCard}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      slotProps={{ paper: { sx: { borderRadius: T.radius } } }}
    >
      <DialogTitle
        sx={{
          fontWeight: 700,
          fontSize: '1.05rem',
          color: T.textPrimary,
          borderBottom: `1px solid ${T.border}`,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <Box
          sx={{
            width: 32, height: 32, borderRadius: 1.5,
            bgcolor: T.indigoSoft, color: T.indigo,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <FaIdCard size={16} />
        </Box>
        ID Card Preview
      </DialogTitle>
      <DialogContent
        dividers
        sx={{ p: 3, borderColor: T.border, bgcolor: T.surfaceSoft }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <div style={{ position: 'absolute', left: -9999, top: 0 }}>
            <div ref={downloadRef}>
              <DownloadCardDesign idCard={idCard} />
            </div>
          </div>
          <PreviewCardDesign idCard={idCard} />
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2, gap: 1, justifyContent: 'center', borderTop: `1px solid ${T.border}` }}>
        <Button
          variant="contained"
          startIcon={
            downloading ? (
              <CircularProgress size={14} sx={{ color: '#fff' }} />
            ) : (
              <FaImage size={12} />
            )
          }
          onClick={downloadAsImage}
          disabled={downloading}
          sx={{
            textTransform: 'none', fontWeight: 700, fontSize: '0.78rem',
            borderRadius: 2, bgcolor: T.indigo, px: 2.5,
            boxShadow: 'none',
            '&:hover': { bgcolor: '#4f46e5' },
          }}
        >
          Download Image
        </Button>
        <Button
          variant="contained"
          startIcon={
            downloading ? (
              <CircularProgress size={14} sx={{ color: '#fff' }} />
            ) : (
              <FaFilePdf size={12} />
            )
          }
          onClick={downloadAsPDF}
          disabled={downloading}
          sx={{
            textTransform: 'none', fontWeight: 700, fontSize: '0.78rem',
            borderRadius: 2, bgcolor: T.rose, px: 2.5,
            boxShadow: 'none',
            '&:hover': { bgcolor: '#e11d48' },
          }}
        >
          Download PDF
        </Button>
        <Button
          onClick={onClose}
          sx={{ textTransform: 'none', fontWeight: 600, color: T.textMuted }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
const IdCards = () => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { items, loading, pagination } = useSelector((s) => s.idCards);

  const [preview, setPreview] = useState(null);
  const [revokeConfirm, setRevokeConfirm] = useState(null);
  const [revoking, setRevoking] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [downloadingId, setDownloadingId] = useState(null);
  const hiddenCardRefs = useRef({});

  const fetchList = () => {
    dispatch(fetchIdCards({ page: pagination.page, limit: pagination.limit }));
  };

  useEffect(() => {
    fetchList();
  }, [dispatch, pagination.page, pagination.limit]);

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
    setRevoking(true);
    try {
      await dispatch(revokeIdCard(id)).unwrap();
      toast.success('ID Card revoked');
      setRevokeConfirm(null);
      fetchList();
    } catch {
      toast.error('Revoke failed');
    } finally {
      setRevoking(false);
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
      const canvas = await html2canvas(cardRef, {
        scale: 2, useCORS: true, backgroundColor: null,
      });
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
    {
      field: 'profileImage',
      headerName: 'Photo',
      flex: 0.5,
      minWidth: 80,
      sortable: false,
      renderCell: (params) => (
        <Avatar
          src={getFullImageUrl(params.row.profileImage)}
          alt={params.row.fullName || 'User'}
          sx={{
            width: 38, height: 38,
            border: '2px solid #fff',
            boxShadow: '0 2px 6px rgba(15,23,42,0.1)',
            background: `linear-gradient(135deg, ${T.indigo}, ${T.violet})`,
            fontWeight: 700,
            fontSize: '0.82rem',
          }}
        >
          {getActualName(params.row).charAt(0)}
        </Avatar>
      ),
    },
    {
      field: 'cardNumber',
      headerName: 'Card No',
      flex: 0.9,
      minWidth: 140,
      renderCell: (params) => (
        <Box
          sx={{
            px: 1, py: 0.4, borderRadius: 1,
            bgcolor: T.surfaceSoft,
            border: `1px solid ${T.border}`,
          }}
        >
          <Typography
            sx={{
              fontSize: '0.72rem', fontWeight: 700,
              color: T.textPrimary, fontFamily: 'monospace',
              letterSpacing: '0.05em',
            }}
          >
            {params.row.cardNumber || '—'}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'fullName',
      headerName: 'Name',
      flex: 1.2,
      minWidth: 140,
      renderCell: (params) => (
        <Typography
          sx={{ fontSize: '0.82rem', fontWeight: 700, color: T.textPrimary }}
          noWrap
        >
          {getActualName(params.row)}
        </Typography>
      ),
    },
    {
      field: 'companyName',
      headerName: 'Company',
      flex: 0.9,
      minWidth: 120,
      renderCell: (params) => (
        <Typography sx={{ fontSize: '0.78rem', color: T.textMuted }} noWrap>
          {getActualCompany(params.row)}
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
            label={params.row.role || 'USER'}
            size="small"
            sx={{
              bgcolor: style.bg, color: style.color,
              fontWeight: 700, fontSize: '0.65rem',
              height: 22, borderRadius: 999,
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
        const style = STATUS_STYLES[params.row.status] || STATUS_STYLES.ACTIVE;
        return (
          <Chip
            label={params.row.status}
            size="small"
            sx={{
              bgcolor: style.bg, color: style.color,
              fontWeight: 700, fontSize: '0.65rem',
              height: 22, borderRadius: 999,
            }}
          />
        );
      },
    },
    {
      field: 'actions',
      headerName: 'Actions',
      flex: 1.1,
      minWidth: 150,
      sortable: false,
      renderCell: (params) => (
        <Stack direction="row" spacing={0.5} alignItems="center">
          <Tooltip title="View ID card">
            <IconButton
              size="small"
              onClick={() => setPreview(params.row)}
              sx={{
                bgcolor: T.skySoft, color: T.sky,
                '&:hover': { bgcolor: '#bae6fd' },
                width: 32, height: 32,
              }}
            >
              <FaEye size={14} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Download ID card">
            <span>
              <IconButton
                size="small"
                onClick={() => handleDirectDownload(params.row)}
                disabled={downloadingId === params.row.id}
                sx={{
                  bgcolor: T.indigoSoft, color: T.indigo,
                  '&:hover': { bgcolor: '#e0e7ff' },
                  width: 32, height: 32,
                }}
              >
                {downloadingId === params.row.id ? (
                  <CircularProgress size={14} sx={{ color: T.indigo }} />
                ) : (
                  <FaDownload size={13} />
                )}
              </IconButton>
            </span>
          </Tooltip>
          {params.row.status === 'ACTIVE' && (
            <Tooltip title="Revoke ID card">
              <IconButton
                size="small"
                onClick={() => setRevokeConfirm(params.row.id)}
                sx={{
                  bgcolor: T.roseSoft, color: T.rose,
                  '&:hover': { bgcolor: '#fecaca' },
                  width: 32, height: 32,
                }}
              >
                <FaBan size={13} />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
      ),
    },
  ];

  const renderMobileCards = () => (
    <Stack spacing={2}>
      {filtered.length > 0 ? (
        filtered.map((card) => {
          const statusStyle = STATUS_STYLES[card.status] || STATUS_STYLES.ACTIVE;
          return (
            <Paper
              key={card.id}
              elevation={0}
              sx={{
                borderRadius: T.radius,
                border: `1px solid ${T.border}`,
                bgcolor: T.surface,
                p: 2,
                transition: 'all 0.2s ease',
                '&:hover': {
                  boxShadow: '0 12px 24px -16px rgba(15,23,42,0.15)',
                  borderColor: T.borderStrong,
                },
              }}
            >
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.5 }}>
                <Avatar
                  src={getFullImageUrl(card.profileImage)}
                  sx={{
                    width: 44, height: 44,
                    background: `linear-gradient(135deg, ${T.indigo}, ${T.violet})`,
                    fontWeight: 700,
                  }}
                >
                  {getActualName(card).charAt(0)}
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    sx={{ fontSize: '0.88rem', fontWeight: 700, color: T.textPrimary }}
                    noWrap
                  >
                    {getActualName(card)}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: '0.72rem', color: T.textMuted,
                      fontFamily: 'monospace',
                    }}
                    noWrap
                  >
                    {card.cardNumber || 'N/A'}
                  </Typography>
                </Box>
                <Chip
                  label={card.status}
                  size="small"
                  sx={{
                    bgcolor: statusStyle.bg, color: statusStyle.color,
                    fontWeight: 700, fontSize: '0.62rem',
                    height: 22, borderRadius: 999,
                  }}
                />
              </Stack>
              <Typography sx={{ fontSize: '0.72rem', color: T.textMuted, mb: 1.5 }}>
                {card.role} • {getActualCompany(card)} • {getActualLocation(card)}
              </Typography>
              <Stack
                direction="row"
                justifyContent="flex-end"
                spacing={0.5}
                sx={{ pt: 1.5, borderTop: `1px solid ${T.border}` }}
              >
                <IconButton
                  size="small"
                  onClick={() => setPreview(card)}
                  sx={{ bgcolor: T.skySoft, color: T.sky, width: 30, height: 30 }}
                >
                  <FaEye size={13} />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => handleDirectDownload(card)}
                  disabled={downloadingId === card.id}
                  sx={{ bgcolor: T.indigoSoft, color: T.indigo, width: 30, height: 30 }}
                >
                  {downloadingId === card.id ? (
                    <CircularProgress size={13} sx={{ color: T.indigo }} />
                  ) : (
                    <FaDownload size={12} />
                  )}
                </IconButton>
                {card.status === 'ACTIVE' && (
                  <IconButton
                    size="small"
                    onClick={() => setRevokeConfirm(card.id)}
                    sx={{ bgcolor: T.roseSoft, color: T.rose, width: 30, height: 30 }}
                  >
                    <FaBan size={12} />
                  </IconButton>
                )}
              </Stack>
            </Paper>
          );
        })
      ) : (
        <Paper
          elevation={0}
          sx={{
            p: 4, borderRadius: T.radius,
            border: `1px dashed ${T.border}`, textAlign: 'center',
          }}
        >
          <Inbox sx={{ fontSize: 40, color: T.textFaint, mb: 1 }} />
          <Typography sx={{ color: T.textFaint, fontWeight: 500 }}>
            No ID cards found
          </Typography>
        </Paper>
      )}
    </Stack>
  );

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1440, mx: 'auto' }}>
      {/* Hidden HTML cards for direct download */}
      {filtered.map((card) => (
        <div
          key={`hidden-${card.id}`}
          style={{ position: 'absolute', left: -9999, top: 0 }}
        >
          <div ref={(el) => { if (el) hiddenCardRefs.current[card.id] = el; }}>
            <DownloadCardDesign idCard={card} />
          </div>
        </div>
      ))}

      <Box sx={{ mb: 3 }}>
        <PanelHeader eyebrow="Verification" title="ID Cards Management" />
      </Box>

      {/* Filters */}
      <Paper
        elevation={0}
        sx={{
          p: 2, borderRadius: T.radius,
          border: `1px solid ${T.border}`,
          bgcolor: T.surface, mb: 2.5,
        }}
      >
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
          <TextField
            fullWidth
            size="small"
            placeholder="Search by name, card no, role..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ fontSize: 18, color: T.textFaint }} />
                  </InputAdornment>
                ),
              },
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2, bgcolor: T.surfaceSoft,
                '& fieldset': { borderColor: T.border },
                '&:hover fieldset': { borderColor: '#c7d2fe' },
                '&.Mui-focused fieldset': { borderColor: T.indigo, borderWidth: 1.5 },
              },
            }}
          />
          <FormControl size="small" sx={{ minWidth: 130 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              label="Status"
              sx={{ borderRadius: 2, bgcolor: T.surfaceSoft }}
            >
              <MenuItem value="ALL">All Status</MenuItem>
              <MenuItem value="ACTIVE">Active</MenuItem>
              <MenuItem value="REVOKED">Revoked</MenuItem>
              <MenuItem value="EXPIRED">Expired</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 130 }}>
            <InputLabel>Role</InputLabel>
            <Select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              label="Role"
              sx={{ borderRadius: 2, bgcolor: T.surfaceSoft }}
            >
              <MenuItem value="ALL">All Roles</MenuItem>
              <MenuItem value="GUIDER">Guider</MenuItem>
              <MenuItem value="PHOTOGRAPHER">Photographer</MenuItem>
            </Select>
          </FormControl>
          <Tooltip title="Refresh">
            <IconButton
              onClick={fetchList}
              sx={{
                bgcolor: T.indigoSoft, color: T.indigo,
                width: 40, height: 40,
                '&:hover': { bgcolor: '#e0e7ff' },
              }}
            >
              <Refresh sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
        </Stack>
      </Paper>

      {isMobile ? (
        loading ? <Loader /> : renderMobileCards()
      ) : (
        <Paper
          elevation={0}
          sx={{
            p: 1, borderRadius: T.radius,
            border: `1px solid ${T.border}`,
            bgcolor: T.surface, overflow: 'hidden',
          }}
        >
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
              rowHeight={64}
              sx={{
                border: 'none',
                '& .MuiDataGrid-columnHeaders': {
                  bgcolor: T.surfaceSoft, fontWeight: 700,
                  color: T.textMuted, fontSize: '0.72rem',
                  letterSpacing: '0.05em', textTransform: 'uppercase',
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
                  display: 'flex', alignItems: 'center', py: 0,
                },
                '& .MuiDataGrid-cell:focus': { outline: 'none' },
                '& .MuiDataGrid-columnSeparator': { display: 'none' },
                '& .MuiDataGrid-footerContainer': { borderTop: `1px solid ${T.border}` },
                '& .MuiDataGrid-toolbarContainer': {
                  p: 1, borderBottom: `1px solid ${T.border}`,
                },
              }}
            />
          )}
        </Paper>
      )}

      <IdCardModal idCard={preview} onClose={() => setPreview(null)} />

      {/* Revoke Dialog */}
      <Dialog
        open={!!revokeConfirm}
        onClose={() => !revoking && setRevokeConfirm(null)}
        slotProps={{ paper: { sx: { borderRadius: T.radius, p: 0.5 } } }}
      >
        <DialogTitle
          sx={{
            fontWeight: 700, fontSize: '1.05rem', color: T.textPrimary,
            display: 'flex', alignItems: 'center', gap: 1,
          }}
        >
          <Box
            sx={{
              width: 32, height: 32, borderRadius: 1.5,
              bgcolor: T.roseSoft, color: T.rose,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <FaBan size={14} />
          </Box>
          Revoke ID Card?
        </DialogTitle>
        <Divider sx={{ borderColor: T.border }} />
        <Box sx={{ px: 3, py: 2 }}>
          <Typography sx={{ fontSize: '0.85rem', color: T.textMuted }}>
            This will permanently revoke the ID card. The user won't be able to
            use it for verification.
          </Typography>
        </Box>
        <DialogActions sx={{ p: 2, pt: 0, gap: 1 }}>
          <Button
            onClick={() => setRevokeConfirm(null)}
            disabled={revoking}
            sx={{ textTransform: 'none', fontWeight: 600, color: T.textMuted }}
          >
            Cancel
          </Button>
          <Button
            onClick={() => handleRevoke(revokeConfirm)}
            disabled={revoking}
            variant="contained"
            sx={{
              textTransform: 'none', fontWeight: 700,
              borderRadius: 2, bgcolor: T.rose,
              '&:hover': { bgcolor: '#e11d48' },
              boxShadow: 'none',
            }}
          >
            {revoking ? (
              <CircularProgress size={16} sx={{ color: '#fff' }} />
            ) : (
              'Revoke'
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default IdCards;