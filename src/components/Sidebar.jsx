// src/components/Sidebar.jsx
import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../redux/slices/authSlice';
import {
  FaTachometerAlt, FaUsers, FaUserTie, FaCamera, FaMapMarkerAlt,
  FaBook, FaCreditCard, FaStar, FaBell, FaUserCog,
  FaCog, FaSignOutAlt, FaImages, FaPercentage, FaIdCard,
  FaComments, FaChartLine, FaWallet, FaMoneyCheckAlt,
  FaChevronDown,
} from 'react-icons/fa';
import {
  Box, IconButton, Typography, Drawer, useMediaQuery, useTheme,
  Avatar, Tooltip, Chip,
} from '@mui/material';
import { Close, Verified } from '@mui/icons-material';

const menuSections = [
  {
    label: 'Overview',
    items: [
      { to: '/', icon: FaTachometerAlt, label: 'Dashboard' },
      { to: '/reports', icon: FaChartLine, label: 'Reports' },
    ],
  },
  {
    label: 'People',
    items: [
      { to: '/users', icon: FaUsers, label: 'Users' },
      { to: '/guiders', icon: FaUserTie, label: 'Guiders' },
      { to: '/photographers', icon: FaCamera, label: 'Photographers' },
      { to: '/role-requests', icon: FaUserCog, label: 'Role Requests', badge: 3 },
    ],
  },
  {
    label: 'Content',
    items: [
      { to: '/places', icon: FaMapMarkerAlt, label: 'Places' },
      { to: '/sliders', icon: FaImages, label: 'Sliders' },
      { to: '/offers', icon: FaPercentage, label: 'Offers' },
      { to: '/reviews', icon: FaStar, label: 'Reviews' },
    ],
  },
  {
    label: 'Transactions',
    items: [
      { to: '/bookings', icon: FaBook, label: 'Bookings' },
      { to: '/payments', icon: FaCreditCard, label: 'Payments' },
      { to: '/wallets', icon: FaWallet, label: 'Wallets' },
      { to: '/withdrawals', icon: FaMoneyCheckAlt, label: 'Withdrawals' },
    ],
  },
  {
    label: 'System',
    items: [
      { to: '/id-cards', icon: FaIdCard, label: 'ID Cards' },
      { to: '/notifications', icon: FaBell, label: 'Notifications' },
      { to: '/chat', icon: FaComments, label: 'Chat' },
      { to: '/settings', icon: FaCog, label: 'Settings' },
    ],
  },
];

const Sidebar = ({ mobileOpen, onClose }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  // Track collapsed sections (default all open)
  const [collapsed, setCollapsed] = useState({});
  const toggleSection = (label) =>
    setCollapsed((prev) => ({ ...prev, [label]: !prev[label] }));

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
    if (onClose) onClose();
  };

  const userInitial =
    user?.firstName?.charAt(0)?.toUpperCase() ||
    user?.email?.charAt(0)?.toUpperCase() ||
    'A';
  const userName = user?.firstName
    ? `${user.firstName} ${user.lastName || ''}`.trim()
    : 'Admin';

  const content = (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(180deg, #0a0e27 0%, #141033 55%, #0a0e27 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Decorative orbs */}
      <Box
        sx={{
          position: 'absolute', top: -100, right: -100, width: 240, height: 240,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.28), transparent 70%)',
          filter: 'blur(50px)', pointerEvents: 'none',
        }}
      />
      <Box
        sx={{
          position: 'absolute', bottom: -80, left: -80, width: 220, height: 220,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(139,92,246,0.22), transparent 70%)',
          filter: 'blur(50px)', pointerEvents: 'none',
        }}
      />
      {/* Grid overlay */}
      <Box
        sx={{
          position: 'absolute', inset: 0, opacity: 0.03,
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)',
          backgroundSize: '40px 40px', pointerEvents: 'none',
        }}
      />

      {/* ═══════ HEADER ═══════ */}
      <Box
        sx={{
          p: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          position: 'relative', zIndex: 1,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {/* Logo with WHITE circle like Login */}
          <Box sx={{ position: 'relative', width: 44, height: 44, flexShrink: 0 }}>
            <Box
              sx={{
                position: 'absolute', inset: -3, borderRadius: '50%',
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                opacity: 0.5, filter: 'blur(8px)',
              }}
            />
            <Box
              sx={{
                position: 'absolute', inset: -5, borderRadius: '50%',
                border: '1px solid rgba(255,255,255,0.15)',
              }}
            />
            <Box
              sx={{
                position: 'relative', width: 44, height: 44, borderRadius: '50%',
                overflow: 'hidden', bgcolor: '#ffffff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 0 2px rgba(255,255,255,0.15), 0 6px 20px -4px rgba(139,92,246,0.6)',
              }}
            >
              <img
                src="/assets/images/logo21.jpg"
                alt="Local Guider"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  const fb = e.currentTarget.nextElementSibling;
                  if (fb) fb.style.display = 'flex';
                }}
              />
              <Box
                sx={{
                  position: 'absolute', inset: 0, display: 'none',
                  alignItems: 'center', justifyContent: 'center', fontSize: 20,
                }}
              >
                🌍
              </Box>
            </Box>
          </Box>

          {/* Brand */}
          <Box sx={{ minWidth: 0 }}>
            <Typography
              sx={{
                color: '#ffffff', fontWeight: 800, fontSize: '1rem',
                letterSpacing: '-0.02em', lineHeight: 1.15,
              }}
            >
              Local Guider
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.2 }}>
              <Verified sx={{ fontSize: 11, color: '#a78bfa' }} />
              <Typography
                sx={{
                  color: 'rgba(165,180,252,0.75)', fontSize: '0.65rem',
                  fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
                }}
              >
                Admin Panel
              </Typography>
            </Box>
          </Box>
        </Box>

        {isMobile && onClose && (
          <IconButton
            onClick={onClose}
            size="small"
            sx={{
              color: 'white', bgcolor: 'rgba(255,255,255,0.08)',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.15)' },
            }}
          >
            <Close fontSize="small" />
          </IconButton>
        )}
      </Box>

      {/* ═══════ NAVIGATION ═══════ */}
      <Box
        component="nav"
        sx={{
          flex: 1, overflowY: 'auto', px: 1.5, py: 2,
          position: 'relative', zIndex: 1,
          '&::-webkit-scrollbar': { width: 5 },
          '&::-webkit-scrollbar-track': { background: 'transparent' },
          '&::-webkit-scrollbar-thumb': {
            background: 'rgba(255,255,255,0.1)', borderRadius: 3,
          },
          '&::-webkit-scrollbar-thumb:hover': { background: 'rgba(255,255,255,0.2)' },
        }}
      >
        {menuSections.map((section) => {
          const isCollapsed = collapsed[section.label];
          return (
            <Box key={section.label} sx={{ mb: 1.5 }}>
              {/* Section header — clickable to collapse */}
              <Box
                onClick={() => toggleSection(section.label)}
                sx={{
                  px: 2, py: 1, display: 'flex', alignItems: 'center',
                  justifyContent: 'space-between', cursor: 'pointer',
                  borderRadius: 1.5,
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.03)' },
                  '&:hover .section-label': { color: 'rgba(165,180,252,0.9)' },
                }}
              >
                <Typography
                  className="section-label"
                  sx={{
                    fontSize: '0.65rem', fontWeight: 700,
                    color: 'rgba(165,180,252,0.5)',
                    letterSpacing: '0.12em', textTransform: 'uppercase',
                    transition: 'color 0.2s',
                  }}
                >
                  {section.label}
                </Typography>
                <FaChevronDown
                  size={9}
                  style={{
                    color: 'rgba(165,180,252,0.4)',
                    transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
                    transition: 'transform 0.25s ease',
                  }}
                />
              </Box>

              {/* Section items */}
              <Box
                sx={{
                  maxHeight: isCollapsed ? 0 : 500,
                  overflow: 'hidden',
                  transition: 'max-height 0.35s ease',
                }}
              >
                {section.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={onClose}
                      style={{ textDecoration: 'none' }}
                    >
                      {({ isActive }) => (
                        <Box
                          sx={{
                            display: 'flex', alignItems: 'center', gap: 1.5,
                            px: 2, py: 1.15, mb: 0.4, borderRadius: '10px',
                            position: 'relative', transition: 'all 0.2s ease',
                            bgcolor: isActive ? 'rgba(99,102,241,0.18)' : 'transparent',
                            color: isActive ? '#ffffff' : 'rgba(199,210,254,0.75)',
                            '&:hover': {
                              bgcolor: isActive
                                ? 'rgba(99,102,241,0.26)'
                                : 'rgba(255,255,255,0.05)',
                              color: '#ffffff',
                              transform: 'translateX(2px)',
                            },
                            ...(isActive && {
                              boxShadow:
                                'inset 0 0 0 1px rgba(139,92,246,0.28), 0 4px 14px rgba(99,102,241,0.18)',
                              '&::before': {
                                content: '""', position: 'absolute',
                                left: 0, top: '22%', bottom: '22%',
                                width: 3, borderRadius: '0 3px 3px 0',
                                background: 'linear-gradient(180deg, #818cf8, #a78bfa)',
                              },
                            }),
                          }}
                        >
                          <Box
                            sx={{
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              width: 28, height: 28, borderRadius: '8px', flexShrink: 0,
                              bgcolor: isActive
                                ? 'rgba(139,92,246,0.25)'
                                : 'rgba(255,255,255,0.04)',
                              transition: 'all 0.2s ease',
                            }}
                          >
                            <Icon size={13} />
                          </Box>
                          <Typography
                            sx={{
                              fontSize: '0.85rem',
                              fontWeight: isActive ? 700 : 500,
                              letterSpacing: '-0.005em',
                              flex: 1,
                            }}
                          >
                            {item.label}
                          </Typography>

                          {/* Badge */}
                          {item.badge && (
                            <Chip
                              label={item.badge}
                              size="small"
                              sx={{
                                height: 18, minWidth: 18, borderRadius: '9px',
                                bgcolor: '#f43f5e', color: '#fff',
                                fontSize: '0.6rem', fontWeight: 700,
                                '& .MuiChip-label': { px: 0.75 },
                              }}
                            />
                          )}

                          {/* Active dot */}
                          {isActive && !item.badge && (
                            <Box
                              sx={{
                                width: 6, height: 6, borderRadius: '50%',
                                bgcolor: '#a78bfa',
                                boxShadow: '0 0 8px rgba(167,139,250,0.9)',
                              }}
                            />
                          )}
                        </Box>
                      )}
                    </NavLink>
                  );
                })}
              </Box>
            </Box>
          );
        })}
      </Box>

      {/* ═══════ FOOTER ═══════ */}
      <Box
        sx={{
          p: 1.5,
          borderTop: '1px solid rgba(255,255,255,0.06)',
          position: 'relative', zIndex: 1,
          bgcolor: 'rgba(0,0,0,0.2)',
        }}
      >
        <Box
          sx={{
            display: 'flex', alignItems: 'center', gap: 1.5,
            px: 1.5, py: 1.2, mb: 1, borderRadius: '10px',
            bgcolor: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.05)',
          }}
        >
          <Box sx={{ position: 'relative' }}>
            <Avatar
              sx={{
                width: 34, height: 34, fontSize: '0.85rem', fontWeight: 700,
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                boxShadow: '0 2px 8px rgba(99,102,241,0.4)',
              }}
            >
              {userInitial}
            </Avatar>
            {/* Online dot */}
            <Box
              sx={{
                position: 'absolute', bottom: -1, right: -1,
                width: 10, height: 10, borderRadius: '50%',
                bgcolor: '#10b981', border: '2px solid #0a0e27',
              }}
            />
          </Box>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography
              sx={{
                color: '#ffffff', fontSize: '0.78rem', fontWeight: 700,
                lineHeight: 1.2, overflow: 'hidden',
                textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}
            >
              {userName}
            </Typography>
            <Typography
              sx={{
                color: 'rgba(165,180,252,0.6)', fontSize: '0.62rem',
                fontWeight: 700, letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}
            >
              {user?.role || 'ADMIN'}
            </Typography>
          </Box>
        </Box>

        <Tooltip title="Sign out" placement="right" arrow>
          <Box
            onClick={handleLogout}
            sx={{
              display: 'flex', alignItems: 'center', gap: 1.5,
              px: 2, py: 1.15, borderRadius: '10px', cursor: 'pointer',
              color: 'rgba(252,165,165,0.85)',
              bgcolor: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.15)',
              transition: 'all 0.2s ease',
              '&:hover': {
                bgcolor: 'rgba(239,68,68,0.18)',
                color: '#fca5a5',
                borderColor: 'rgba(239,68,68,0.3)',
                transform: 'translateY(-1px)',
                boxShadow: '0 4px 12px rgba(239,68,68,0.2)',
              },
            }}
          >
            <FaSignOutAlt size={14} />
            <Typography sx={{ fontSize: '0.82rem', fontWeight: 600 }}>
              Sign Out
            </Typography>
          </Box>
        </Tooltip>
      </Box>
    </Box>
  );

  // ═══════ RENDER ═══════
  if (isMobile) {
    return (
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          '& .MuiDrawer-paper': {
            width: 272, boxSizing: 'border-box',
            border: 'none', background: 'transparent',
          },
        }}
      >
        {content}
      </Drawer>
    );
  }

  return (
    <Box sx={{ width: 272, flexShrink: 0, height: '100vh' }}>
      {content}
    </Box>
  );
};

export default Sidebar;