import { useEffect, useState, useRef } from 'react';
import { Card, Typography, Box, Stack } from '@mui/material';
import { styled } from '@mui/material/styles';
import { TrendingUp, TrendingDown } from '@mui/icons-material';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { COLORS, FONT_BODY, FONT_MONO } from '../theme/dashboardTheme';

const StyledCard = styled(Card)(({ accent, tint }) => ({
  position: 'relative',
  overflow: 'hidden',
  padding: '20px 22px',
  borderRadius: 16,
  cursor: 'pointer',
  background: `linear-gradient(135deg, ${tint} 0%, ${COLORS.bgSurface} 60%, #ffffff 100%)`,
  border: `1px solid ${COLORS.border}`,
  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
  '&:hover': {
    transform: 'translateY(-6px) scale(1.01)',
    boxShadow: `0 16px 28px -8px ${accent}45, 0 4px 12px rgba(0,0,0,0.1)`,
  },
  '&:hover .stat-icon-badge': {
    transform: 'rotate(-6deg) scale(1.08)',
  },
  '&::before': {
    content: '""',
    position: 'absolute',
    top: -40,
    right: -40,
    width: 120,
    height: 120,
    borderRadius: '50%',
    background: `radial-gradient(circle, ${accent}30 0%, transparent 70%)`,
    opacity: 0.6,
  },
}));

const IconBadge = styled(Box)(({ accent, tint }) => ({
  width: 48,
  height: 48,
  borderRadius: 14,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: `linear-gradient(135deg, ${accent} 0%, ${tint} 100%)`,
  color: '#ffffff',
  boxShadow: `0 4px 12px ${accent}40`,
  transition: 'transform 0.3s ease',
  '& svg': { fontSize: 22 },
}));

// Count-up hook — animates from 0 to target whenever value changes
const useCountUp = (target, duration = 900) => {
  const [display, setDisplay] = useState(0);
  const rafRef = useRef(null);
  const startRef = useRef(null);
  const fromRef = useRef(0);

  useEffect(() => {
    const numericTarget = Number(target) || 0;
    fromRef.current = display;
    startRef.current = null;

    const step = (timestamp) => {
      if (!startRef.current) startRef.current = timestamp;
      const progress = Math.min((timestamp - startRef.current) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      const current = fromRef.current + (numericTarget - fromRef.current) * eased;
      setDisplay(current);
      if (progress < 1) rafRef.current = requestAnimationFrame(step);
    };

    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  return display;
};

const formatValue = (val, isMoney) => {
  const rounded = Math.round(val);
  if (isMoney) return `₹${rounded.toLocaleString('en-IN')}`;
  return rounded.toLocaleString('en-IN');
};

const StatsCard = ({ title, value, icon, color, tint, trend, trendValue, sparkline }) => {
  const accent = color || COLORS.sky;
  const softTint = tint || COLORS.skySoft;
  const isUp = trend === 'up';
  const isMoney = title?.toLowerCase().includes('revenue');
  const animatedValue = useCountUp(value);

  // fallback mini sparkline data if none passed, so the chart never looks empty
  const sparkData = (sparkline?.length ? sparkline : [4, 6, 5, 8, 7, 9, 10]).map((v, i) => ({ i, v }));

  return (
    <StyledCard accent={accent} tint={softTint}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography
            sx={{ fontFamily: FONT_BODY, fontSize: 13, fontWeight: 600, color: COLORS.textMuted, mb: 1 }}
          >
            {title}
          </Typography>
          <Typography
            sx={{ fontFamily: FONT_MONO, fontSize: 28, fontWeight: 700, color: COLORS.textPrimary, lineHeight: 1.1 }}
          >
            {formatValue(animatedValue, isMoney)}
          </Typography>

          <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 1.2, minHeight: 22 }}>
            {trend && (
              <>
                <Box
                  sx={{
                    display: 'flex', alignItems: 'center', gap: 0.3,
                    bgcolor: isUp ? COLORS.emeraldSoft : COLORS.roseSoft,
                    color: isUp ? COLORS.emerald : COLORS.rose,
                    borderRadius: 999, px: 1, py: 0.25,
                  }}
                >
                  {isUp ? <TrendingUp sx={{ fontSize: 14 }} /> : <TrendingDown sx={{ fontSize: 14 }} />}
                  <Typography sx={{ fontFamily: FONT_MONO, fontSize: 12, fontWeight: 600 }}>
                    {trendValue}
                  </Typography>
                </Box>
                <Typography sx={{ fontFamily: FONT_BODY, fontSize: 11.5, color: COLORS.textFaint }}>
                  vs last month
                </Typography>
              </>
            )}
          </Stack>
        </Box>

        <Stack alignItems="flex-end" spacing={1}>
          <IconBadge className="stat-icon-badge" accent={accent} tint={softTint}>
            {icon}
          </IconBadge>
          {/* mini sparkline for a quick visual trend, purely decorative */}
          <Box sx={{ width: 64, height: 28 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sparkData}>
                <Line
                  type="monotone"
                  dataKey="v"
                  stroke={accent}
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive
                />
              </LineChart>
            </ResponsiveContainer>
          </Box>
        </Stack>
      </Stack>
    </StyledCard>
  );
};

export default StatsCard;