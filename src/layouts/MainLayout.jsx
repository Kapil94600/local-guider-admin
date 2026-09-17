import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import {
  Box, AppBar, Toolbar, Typography, IconButton, Drawer, useMediaQuery, useTheme,
} from '@mui/material';
import { Menu as MenuIcon } from '@mui/icons-material';
import { FaBell, FaUserCircle } from 'react-icons/fa';
import { useSelector } from 'react-redux';
import Sidebar from './Sidebar';

const drawerWidth = 260;

const MainLayout = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);

  // ✅ Auto close drawer whenever route changes (on mobile)
  useEffect(() => {
    if (isMobile) {
      setMobileOpen(false);
    }
  }, [location.pathname, isMobile]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Desktop Sidebar */}
      {!isMobile && (
        <Box sx={{ width: drawerWidth, flexShrink: 0, height: '100vh' }}>
          <Sidebar />
        </Box>
      )}

      {/* Mobile Drawer */}
      {isMobile && (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{ '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box' } }}
        >
          <Sidebar mobileOpen={mobileOpen} onClose={handleDrawerToggle} />
        </Drawer>
      )}

      {/* Main Content */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <AppBar position="static" sx={{ bgcolor: 'white', color: '#1e293b', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', zIndex: 10 }}>
          <Toolbar sx={{ minHeight: 64, px: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
              {isMobile && (
                <IconButton onClick={handleDrawerToggle} size="small" edge="start">
                  <MenuIcon />
                </IconButton>
              )}
              <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
                Admin Panel
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <FaBell className="text-gray-500 text-xl" />
              <FaUserCircle className="text-gray-400 text-3xl" />
              {!isMobile && (
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {user?.name || 'Admin'}
                </Typography>
              )}
            </Box>
          </Toolbar>
        </AppBar>

        <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, md: 3 }, overflowY: 'auto', bgcolor: '#f6f9fc' }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

export default MainLayout;