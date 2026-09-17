// src/components/Sidebar.jsx
import { NavLink, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { logout } from '../redux/slices/authSlice';
import {
  FaTachometerAlt, FaUsers, FaUserTie, FaCamera, FaMapMarkerAlt,
  FaBook, FaCreditCard, FaStar, FaBell, FaUserCog,
  FaCog, FaSignOutAlt, FaImages, FaPercentage, FaIdCard,
  FaComments, FaChartLine, FaWallet, FaMoneyCheckAlt,
} from 'react-icons/fa';   // ✅ FaHeart removed
import { Box, IconButton, Typography, Drawer, useMediaQuery, useTheme } from '@mui/material';
import { Close } from '@mui/icons-material';

const menuItems = [
  { to: '/', icon: FaTachometerAlt, label: 'Dashboard' },
  { to: '/reports', icon: FaChartLine, label: 'Reports' },
  { to: '/users', icon: FaUsers, label: 'Users' },
  { to: '/guiders', icon: FaUserTie, label: 'Guiders' },
  { to: '/photographers', icon: FaCamera, label: 'Photographers' },
  { to: '/places', icon: FaMapMarkerAlt, label: 'Places' },
  { to: '/sliders', icon: FaImages, label: 'Sliders' },
  { to: '/offers', icon: FaPercentage, label: 'Offers' },
  { to: '/id-cards', icon: FaIdCard, label: 'ID Cards' },
  { to: '/bookings', icon: FaBook, label: 'Bookings' },
  { to: '/payments', icon: FaCreditCard, label: 'Payments' },
  { to: '/wallets', icon: FaWallet, label: 'Wallet Management' },
  { to: '/withdrawals', icon: FaMoneyCheckAlt, label: 'Withdrawals' },
  { to: '/reviews', icon: FaStar, label: 'Reviews' },
  // ✅ Favorites REMOVED
  { to: '/role-requests', icon: FaUserCog, label: 'Role Requests' },
  { to: '/notifications', icon: FaBell, label: 'Notifications' },
  { to: '/chat', icon: FaComments, label: 'Chat Management' },
  { to: '/settings', icon: FaCog, label: 'Settings' },
];

const Sidebar = ({ mobileOpen, onClose }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
    if (onClose) onClose();
  };

  const content = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#1e1b4b' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <Typography variant="h6" sx={{ color: 'white', fontWeight: 700, fontSize: '1.1rem' }}>🧭 Local Guider</Typography>
        {isMobile && onClose && (
          <IconButton onClick={onClose} sx={{ color: 'white' }}><Close /></IconButton>
        )}
      </Box>
      <nav className="flex-1 overflow-y-auto px-4 py-3 space-y-1">
        {menuItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                isActive ? 'bg-white/20 text-white shadow-lg' : 'text-indigo-200 hover:bg-white/10 hover:text-white'
              }`
            }
          >
            <item.icon size={20} />
            <span className="font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <Box sx={{ p: 2, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <button onClick={handleLogout} className="flex items-center gap-3 text-indigo-200 hover:text-white hover:bg-white/10 w-full px-4 py-3 rounded-xl transition-all">
          <FaSignOutAlt size={20} />
          <span className="font-medium">Logout</span>
        </button>
      </Box>
    </Box>
  );

  if (isMobile) {
    return (
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onClose}
        ModalProps={{ keepMounted: true }}
        sx={{ '& .MuiDrawer-paper': { width: 260, boxSizing: 'border-box' } }}
      >
        {content}
      </Drawer>
    );
  }

  return (
    <Box sx={{ width: 260, flexShrink: 0, height: '100vh' }}>{content}</Box>
  );
};

export default Sidebar;