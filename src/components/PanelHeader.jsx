import { Box, Typography } from '@mui/material';
import { COLORS, FONT_BODY, FONT_DISPLAY } from '../theme/dashboardTheme';

const PanelHeader = ({ eyebrow, title }) => (
  <Box sx={{ mb: 2.5 }}>
    <Typography sx={{ fontFamily: FONT_BODY, fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: COLORS.sky, mb: 0.5 }}>
      {eyebrow}
    </Typography>
    <Typography sx={{ fontFamily: FONT_DISPLAY, fontSize: 17, fontWeight: 700, color: COLORS.textPrimary }}>
      {title}
    </Typography>
  </Box>
);

export default PanelHeader;