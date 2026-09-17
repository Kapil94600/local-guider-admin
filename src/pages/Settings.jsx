import { useState } from 'react';
import { toast } from 'react-toastify';
import {
  Box, Paper, Typography, TextField, Button, Switch, Stack,
  Grid, InputAdornment, IconButton, useMediaQuery, useTheme,
} from '@mui/material';
import { Save, Email, Phone, Public, Photo, Description } from '@mui/icons-material';
import PanelHeader from '../components/PanelHeader';
import { COLORS, FONT_DISPLAY } from '../theme/dashboardTheme';

const Settings = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [siteName, setSiteName] = useState('Local Guider');
  const [supportEmail, setSupportEmail] = useState('support@localguider.com');
  const [supportPhone, setSupportPhone] = useState('+91-XXXXXXXXXX');
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [logo, setLogo] = useState(null);
  const [favicon, setFavicon] = useState(null);

  const handleSave = (e) => {
    e.preventDefault();
    toast.success('Settings saved successfully');
  };

  return (
    <Box className="fade-in" sx={{ p: { xs: 2, md: 3 }, mt: 0, pt: 1 }}>
      <PanelHeader eyebrow="Configuration" title="Settings" />

      <Grid container spacing={3}>
        {/* Site Details */}
        <Grid item xs={12} md={6}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid #e2e8f0', bgcolor: 'white' }}>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 3 }}>General</Typography>
            <Stack spacing={2.5}>
              <TextField
                fullWidth
                label="Site Name"
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
                size="small"
                InputProps={{ startAdornment: <InputAdornment position="start"><Public /></InputAdornment> }}
              />
              <TextField
                fullWidth
                label="Support Email"
                type="email"
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
                size="small"
                InputProps={{ startAdornment: <InputAdornment position="start"><Email /></InputAdornment> }}
              />
              <TextField
                fullWidth
                label="Support Phone"
                value={supportPhone}
                onChange={(e) => setSupportPhone(e.target.value)}
                size="small"
                InputProps={{ startAdornment: <InputAdornment position="start"><Phone /></InputAdornment> }}
              />
            </Stack>
          </Paper>
        </Grid>

        {/* Branding */}
        <Grid item xs={12} md={6}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid #e2e8f0', bgcolor: 'white' }}>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 3 }}>Branding</Typography>
            <Stack spacing={2.5}>
              <Box>
                <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>Logo</Typography>
                <Button variant="outlined" component="label" startIcon={<Photo />} fullWidth>
                  Upload Logo
                  <input type="file" hidden onChange={(e) => setLogo(e.target.files[0])} />
                </Button>
                {logo && <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>{logo.name}</Typography>}
              </Box>
              <Box>
                <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>Favicon</Typography>
                <Button variant="outlined" component="label" startIcon={<Description />} fullWidth>
                  Upload Favicon
                  <input type="file" hidden onChange={(e) => setFavicon(e.target.files[0])} />
                </Button>
                {favicon && <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>{favicon.name}</Typography>}
              </Box>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Typography variant="body2">Maintenance Mode</Typography>
                <Switch checked={maintenanceMode} onChange={(e) => setMaintenanceMode(e.target.checked)} />
              </Stack>
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      <Paper elevation={0} sx={{ mt: 3, p: 2, borderRadius: 4, border: '1px solid #e2e8f0', bgcolor: 'white', display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          startIcon={<Save />}
          onClick={handleSave}
          sx={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', '&:hover': { background: 'linear-gradient(135deg, #4F46E5, #7C3AED)' }, px: 4, py: 1.2 }}
        >
          Save Settings
        </Button>
      </Paper>
    </Box>
  );
};

export default Settings;