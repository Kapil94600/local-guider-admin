// src/layouts/MainLayout.jsx
import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Box, useMediaQuery, useTheme } from '@mui/material';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';

const MainLayout = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  // Auto-close drawer on route change (mobile)
  useEffect(() => {
    if (isMobile) setMobileOpen(false);
  }, [location.pathname, isMobile]);

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);

  return (
    <Box
      sx={{
        display: 'flex',
        height: '100vh',
        overflow: 'hidden',
        background: '#f5f7fb',
      }}
    >
      {/* Desktop Sidebar */}
      {!isMobile && <Sidebar />}

      {/* Mobile Drawer */}
      {isMobile && (
        <Sidebar mobileOpen={mobileOpen} onClose={handleDrawerToggle} />
      )}

      {/* Main content area */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          height: '100vh',
        }}
      >
        <Header onMenuClick={handleDrawerToggle} />

        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: { xs: 2, md: 3 },
            overflowY: 'auto',
            background:
              'radial-gradient(ellipse at top left, #eef2ff 0%, transparent 40%), radial-gradient(ellipse at bottom right, #fce7f3 0%, transparent 40%), linear-gradient(180deg, #f5f7fb 0%, #eef2f9 100%)',
            '&::-webkit-scrollbar': { width: 8 },
            '&::-webkit-scrollbar-track': { background: 'transparent' },
            '&::-webkit-scrollbar-thumb': {
              background: 'rgba(99,102,241,0.2)',
              borderRadius: 4,
            },
            '&::-webkit-scrollbar-thumb:hover': {
              background: 'rgba(99,102,241,0.35)',
            },
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

export default MainLayout;