// src/pages/Settings.jsx
import { useState } from 'react';
import { toast } from 'react-toastify';
import {
  Box, Paper, Typography, TextField, Button, Switch, Stack,
  InputAdornment, useMediaQuery, useTheme, Divider, Chip,
  Tooltip,
} from '@mui/material';
import {
  Save, Email, Phone, Public, Photo, Description,
  Settings as SettingsIcon, Palette, Tune, CloudUpload,
  CheckCircle, Warning as WarningIcon,
} from '@mui/icons-material';
import PanelHeader from '../components/PanelHeader';

// ═══════════════════════════════════════════════════════════════
// DESIGN TOKENS
// ═══════════════════════════════════════════════════════════════
const T = {
  border: '#eef1f6',
  borderStrong: '#e2e8f0',
  surface: '#ffffff',
  surfaceSoft: '#fafbfc',
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

const LOGO_SRC = '/assets/images/logo21.jpg';

// ═══════════════════════════════════════════════════════════════
// SECTION CARD
// ═══════════════════════════════════════════════════════════════
const SectionCard = ({ icon, title, subtitle, accent = T.indigo, children }) => (
  <Paper
    elevation={0}
    sx={{
      p: 3,
      borderRadius: T.radius,
      border: `1px solid ${T.border}`,
      bgcolor: T.surface,
      height: '100%',
      position: 'relative',
      overflow: 'hidden',
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 3,
        background: `linear-gradient(135deg, ${accent}, ${accent}bb)`,
      },
    }}
  >
    <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2.5 }}>
      <Box
        sx={{
          width: 40,
          height: 40,
          borderRadius: 2,
          bgcolor: `${accent}12`,
          color: accent,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {icon}
      </Box>
      <Box>
        <Typography
          sx={{
            fontFamily: T.fontDisplay,
            fontWeight: 700,
            fontSize: '0.95rem',
            color: T.textPrimary,
            lineHeight: 1.3,
          }}
        >
          {title}
        </Typography>
        {subtitle && (
          <Typography sx={{ fontSize: '0.72rem', color: T.textFaint, mt: 0.2, fontWeight: 500 }}>
            {subtitle}
          </Typography>
        )}
      </Box>
    </Stack>
    {children}
  </Paper>
);

// ═══════════════════════════════════════════════════════════════
// UPLOAD BUTTON
// ═══════════════════════════════════════════════════════════════
const UploadButton = ({ label, file, onFileChange, accept = 'image/*' }) => (
  <Box>
    <Typography
      sx={{
        fontSize: '0.7rem',
        fontWeight: 700,
        color: T.textFaint,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        mb: 1,
      }}
    >
      {label}
    </Typography>
    <Button
      component="label"
      variant="outlined"
      startIcon={<CloudUpload sx={{ fontSize: 16 }} />}
      fullWidth
      disabled
      sx={{
        textTransform: 'none',
        fontWeight: 700,
        fontSize: '0.78rem',
        borderRadius: 2,
        borderColor: T.border,
        color: T.textMuted,
        bgcolor: T.surfaceSoft,
        py: 1.25,
        justifyContent: 'flex-start',
        pl: 2,
        '&.Mui-disabled': {
          bgcolor: T.surfaceSoft,
          color: T.textFaint,
          borderColor: T.border,
        },
      }}
    >
      {file ? file.name : 'Coming soon'}
      <input
        type="file"
        hidden
        accept={accept}
        disabled
        onChange={(e) => onFileChange(e.target.files[0])}
      />
    </Button>
  </Box>
);

// ═══════════════════════════════════════════════════════════════
// SETTINGS
// ═══════════════════════════════════════════════════════════════
const Settings = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [siteName, setSiteName] = useState('Local Guider');
  const [supportEmail, setSupportEmail] = useState('support@localguider.com');
  const [supportPhone, setSupportPhone] = useState('+91-XXXXXXXXXX');
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [logo, setLogo] = useState(null);
  const [favicon, setFavicon] = useState(null);

  // ═══════════════════════════════════════════════════════════════
  // ✅ FIX: Fake save removed — show "Coming Soon" instead
  // (Settings backend API not implemented yet)
  // ═══════════════════════════════════════════════════════════════
  const handleSave = (e) => {
    e.preventDefault();
    toast.info('Settings save is coming soon. Backend API is not yet implemented.');
  };

  const inputSx = {
    '& .MuiOutlinedInput-root': {
      borderRadius: 2,
      bgcolor: T.surfaceSoft,
      '& fieldset': { borderColor: T.border },
      '&:hover fieldset': { borderColor: '#c7d2fe' },
      '&.Mui-focused fieldset': { borderColor: T.indigo, borderWidth: 1.5 },
    },
    '& .MuiInputLabel-root.Mui-focused': { color: T.indigo },
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1200, mx: 'auto' }}>
      <Box sx={{ mb: 3 }}>
        <PanelHeader eyebrow="Configuration" title="Settings" />
      </Box>

      {/* ═══════ Info Banner ═══════ */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 2.5,
          borderRadius: T.radius,
          border: `1px solid ${T.amber}44`,
          bgcolor: T.amberSoft,
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <WarningIcon sx={{ color: '#b45309', fontSize: 20 }} />
          <Typography sx={{ fontSize: '0.82rem', color: '#b45309', fontWeight: 600 }}>
            Settings page is read-only. Backend API for saving settings is not yet implemented.
          </Typography>
        </Stack>
      </Paper>

      {/* ═══════ Grid ═══════ */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
          gap: 2.5,
          mb: 2.5,
        }}
      >
        {/* ═══ General Section ═══ */}
        <SectionCard
          icon={<Tune sx={{ fontSize: 20 }} />}
          title="General"
          subtitle="Basic site information"
          accent={T.indigo}
        >
          <Stack spacing={2.25}>
            <TextField
              fullWidth
              label="Site Name"
              value={siteName}
              onChange={(e) => setSiteName(e.target.value)}
              size="small"
              disabled
              sx={inputSx}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Public sx={{ fontSize: 16, color: T.textFaint }} />
                    </InputAdornment>
                  ),
                },
              }}
            />
            <TextField
              fullWidth
              label="Support Email"
              type="email"
              value={supportEmail}
              onChange={(e) => setSupportEmail(e.target.value)}
              size="small"
              disabled
              sx={inputSx}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email sx={{ fontSize: 16, color: T.textFaint }} />
                    </InputAdornment>
                  ),
                },
              }}
            />
            <TextField
              fullWidth
              label="Support Phone"
              value={supportPhone}
              onChange={(e) => setSupportPhone(e.target.value)}
              size="small"
              disabled
              sx={inputSx}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Phone sx={{ fontSize: 16, color: T.textFaint }} />
                    </InputAdornment>
                  ),
                },
              }}
            />
          </Stack>
        </SectionCard>

        {/* ═══ Branding Section ═══ */}
        <SectionCard
          icon={<Palette sx={{ fontSize: 20 }} />}
          title="Branding"
          subtitle="Logo, favicon and appearance"
          accent={T.violet}
        >
          {/* Current logo preview */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              p: 2,
              borderRadius: 2,
              bgcolor: T.surfaceSoft,
              border: `1px solid ${T.border}`,
              mb: 2.5,
            }}
          >
            <Box
              sx={{
                width: 52,
                height: 52,
                borderRadius: '50%',
                bgcolor: '#fff',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 0 0 2px rgba(255,215,0,0.4), 0 4px 12px rgba(99,102,241,0.15)`,
                flexShrink: 0,
              }}
            >
              <Box
                component="img"
                src={LOGO_SRC}
                alt="Local Guider"
                sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </Box>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: T.textPrimary }}>
                Current Logo
              </Typography>
              <Typography sx={{ fontSize: '0.7rem', color: T.textFaint, mt: 0.2 }}>
                logo21.jpg • 512×512
              </Typography>
            </Box>
            <Chip
              label="Active"
              size="small"
              sx={{
                bgcolor: T.emeraldSoft,
                color: '#047857',
                fontWeight: 700,
                fontSize: '0.62rem',
                height: 22,
                borderRadius: 999,
              }}
            />
          </Box>

          <Stack spacing={2.25}>
            <UploadButton
              label="Update Logo"
              file={logo}
              onFileChange={setLogo}
              accept="image/*"
            />
            <UploadButton
              label="Update Favicon"
              file={favicon}
              onFileChange={setFavicon}
              accept="image/x-icon,image/png"
            />

            <Divider sx={{ borderColor: T.border }} />

            {/* Maintenance mode */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 2,
                p: 2,
                borderRadius: 2,
                bgcolor: maintenanceMode ? T.amberSoft : T.surfaceSoft,
                border: `1px solid ${maintenanceMode ? T.amber + '55' : T.border}`,
                transition: 'all 0.2s ease',
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1.25}>
                <WarningIcon
                  sx={{
                    fontSize: 18,
                    color: maintenanceMode ? '#b45309' : T.textFaint,
                  }}
                />
                <Box>
                  <Typography
                    sx={{
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      color: T.textPrimary,
                    }}
                  >
                    Maintenance Mode
                  </Typography>
                  <Typography sx={{ fontSize: '0.68rem', color: T.textMuted, mt: 0.2 }}>
                    {maintenanceMode
                      ? 'Site is currently under maintenance'
                      : 'Site is live for all users'}
                  </Typography>
                </Box>
              </Stack>
              <Switch
                checked={maintenanceMode}
                onChange={(e) => setMaintenanceMode(e.target.checked)}
                disabled
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': { color: T.amber },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                    bgcolor: T.amber,
                  },
                }}
              />
            </Box>
          </Stack>
        </SectionCard>
      </Box>

      {/* ═══════ Save Bar ═══════ */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          borderRadius: T.radius,
          border: `1px solid ${T.border}`,
          bgcolor: T.surface,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 2,
          flexWrap: 'wrap',
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1.25}>
          <SettingsIcon sx={{ fontSize: 18, color: T.textFaint }} />
          <Typography sx={{ fontSize: '0.78rem', color: T.textMuted, fontWeight: 500 }}>
            Settings are read-only until backend API is implemented
          </Typography>
        </Stack>
        <Tooltip title="Coming soon — backend API not implemented">
          <span>
            <Button
              variant="contained"
              startIcon={<Save sx={{ fontSize: 16 }} />}
              onClick={handleSave}
              sx={{
                textTransform: 'none',
                fontWeight: 700,
                fontSize: '0.82rem',
                borderRadius: 2,
                bgcolor: T.indigo,
                px: 3,
                py: 1.2,
                boxShadow: 'none',
                '&:hover': { bgcolor: '#4f46e5' },
              }}
            >
              Save Settings
            </Button>
          </span>
        </Tooltip>
      </Paper>
    </Box>
  );
};

export default Settings;