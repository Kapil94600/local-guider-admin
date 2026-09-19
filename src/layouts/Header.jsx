// src/components/Header.jsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { useSelector } from 'react-redux';
import {
  IconButton,
  Badge,
  ClickAwayListener,
  Fade,
  Box,
  Typography,
  Avatar,
  Stack,
  Chip,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Search as SearchIcon,
  NotificationsNone as NotificationsIcon,
  KeyboardArrowDown as ArrowDownIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { getNotifications } from '../api/admin';

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

const getNotifColor = (type) => {
  switch (type) {
    case 'BOOKING': return { bg: '#dbeafe', color: '#1e40af' };
    case 'PAYMENT': return { bg: '#d1fae5', color: '#065f46' };
    case 'ROLE_REQUEST': return { bg: '#fce7f3', color: '#9d174d' };
    case 'CHAT': return { bg: '#ede9fe', color: '#5b21b6' };
    case 'OFFER': return { bg: '#fef3c7', color: '#92400e' };
    default: return { bg: '#f1f5f9', color: '#475569' };
  }
};

const Header = ({ onMenuClick }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [clock, setClock] = useState(new Date());
  const notifRef = useRef(null);

  // Clock tick every 30s
  useEffect(() => {
    const timer = setInterval(() => setClock(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getNotifications({ limit: 5 });
      const data = res.data?.data;
      const list = Array.isArray(data)
        ? data
        : data?.rows || data?.items || [];
      setNotifications(list);
    } catch (err) {
      console.warn('Failed to fetch notifications:', err.message);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const getTimeAgo = (dateStr) => {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  const handleNotifClick = (notif) => {
    setNotifOpen(false);
    if (notif.type === 'BOOKING' && notif.data?.bookingId) {
      navigate(`/bookings/${notif.data.bookingId}`);
    } else if (notif.type === 'ROLE_REQUEST') {
      navigate('/role-requests');
    } else if (notif.type === 'PAYMENT') {
      navigate('/payments');
    } else if (notif.type === 'CHAT') {
      navigate('/chat');
    } else {
      navigate('/notifications');
    }
  };

  const userInitial =
    user?.firstName?.charAt(0)?.toUpperCase() ||
    user?.email?.charAt(0)?.toUpperCase() ||
    'A';
  const userName =
    user?.firstName ||
    user?.name?.split(' ')[0] ||
    'Admin';

  return (
    <Box
      component="header"
      sx={{
        height: 72,
        bgcolor: '#ffffff',
        borderBottom: '1px solid #e8ecf3',
        px: { xs: 2, md: 3 },
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
        position: 'relative',
        zIndex: 10,
        boxShadow: '0 1px 3px rgba(15,23,42,0.03)',
      }}
    >
      {/* ═══════════════════════════════════════════
          LEFT — Menu + Greeting
          ═══════════════════════════════════════════ */}
      <Stack
        direction="row"
        spacing={2}
        alignItems="center"
        sx={{ minWidth: 0, flex: 1 }}
      >
        {isMobile && (
          <IconButton
            onClick={onMenuClick}
            size="small"
            sx={{
              bgcolor: '#f1f5f9',
              '&:hover': { bgcolor: '#e2e8f0' },
            }}
          >
            <MenuIcon sx={{ fontSize: 20, color: '#475569' }} />
          </IconButton>
        )}

        <Box sx={{ minWidth: 0 }}>
          <Typography
            sx={{
              fontSize: { xs: '0.95rem', md: '1.05rem' },
              fontWeight: 700,
              color: '#0f172a',
              lineHeight: 1.2,
              letterSpacing: '-0.01em',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {getGreeting()}, {userName}{' '}
            <span style={{ display: 'inline-block' }}>👋</span>
          </Typography>
          <Typography
            sx={{
              display: { xs: 'none', sm: 'block' },
              fontSize: '0.72rem',
              color: '#94a3b8',
              fontWeight: 500,
              letterSpacing: '0.01em',
              mt: 0.2,
            }}
          >
            {clock.toLocaleDateString('en-IN', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </Typography>
        </Box>
      </Stack>

      {/* ═══════════════════════════════════════════
          CENTER — Search
          ═══════════════════════════════════════════ */}
      <Box
        sx={{
          display: { xs: 'none', md: 'flex' },
          flex: 1,
          maxWidth: 420,
          mx: 3,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            width: '100%',
            bgcolor: '#f8fafc',
            borderRadius: 999,
            px: 2,
            py: 0.9,
            border: '1px solid #e8ecf3',
            transition: 'all 0.2s ease',
            '&:focus-within': {
              bgcolor: '#ffffff',
              borderColor: '#a5b4fc',
              boxShadow: '0 0 0 3px rgba(99,102,241,0.1)',
            },
          }}
        >
          <SearchIcon sx={{ fontSize: 18, color: '#94a3b8', mr: 1 }} />
          <input
            type="text"
            placeholder="Search users, bookings, places..."
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              fontSize: '0.85rem',
              width: '100%',
              color: '#475569',
              fontFamily: 'inherit',
            }}
          />
        </Box>
      </Box>

      {/* ═══════════════════════════════════════════
          RIGHT — Notifications + User
          ═══════════════════════════════════════════ */}
      <Stack
        direction="row"
        spacing={1.5}
        alignItems="center"
        sx={{ flexShrink: 0 }}
      >
        {/* ── Notifications Bell ── */}
        <ClickAwayListener onClickAway={() => setNotifOpen(false)}>
          <Box sx={{ position: 'relative' }} ref={notifRef}>
            <IconButton
              size="small"
              onClick={() => setNotifOpen((prev) => !prev)}
              sx={{
                bgcolor: '#f8fafc',
                border: '1px solid #e8ecf3',
                width: 40,
                height: 40,
                transition: 'all 0.2s ease',
                '&:hover': {
                  bgcolor: '#eef2f9',
                  borderColor: '#c7d2fe',
                },
              }}
            >
              <Badge
                badgeContent={unreadCount}
                color="error"
                sx={{
                  '& .MuiBadge-badge': {
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    minWidth: 18,
                    height: 18,
                    boxShadow: '0 0 0 2px #ffffff',
                  },
                }}
              >
                <NotificationsIcon
                  sx={{ fontSize: 20, color: '#64748b' }}
                />
              </Badge>
            </IconButton>

            {/* Notification dropdown */}
            <Fade in={notifOpen} timeout={200}>
              <Box
                sx={{
                  position: 'absolute',
                  right: 0,
                  top: 'calc(100% + 10px)',
                  width: 360,
                  maxWidth: 'calc(100vw - 24px)',
                  bgcolor: '#ffffff',
                  borderRadius: 3,
                  border: '1px solid #e8ecf3',
                  boxShadow:
                    '0 20px 40px -12px rgba(15,23,42,0.15), 0 8px 16px -8px rgba(15,23,42,0.08)',
                  overflow: 'hidden',
                  zIndex: 1300,
                  display: notifOpen ? 'block' : 'none',
                }}
              >
                {/* Header */}
                <Box
                  sx={{
                    px: 2,
                    py: 1.5,
                    borderBottom: '1px solid #f1f5f9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    bgcolor: '#f8fafc',
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      color: '#0f172a',
                      letterSpacing: '-0.005em',
                    }}
                  >
                    Notifications
                  </Typography>
                  {unreadCount > 0 && (
                    <Chip
                      label={`${unreadCount} new`}
                      size="small"
                      sx={{
                        bgcolor: '#eef2ff',
                        color: '#4f46e5',
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        height: 20,
                        borderRadius: 999,
                      }}
                    />
                  )}
                </Box>

                {/* List */}
                <Box sx={{ maxHeight: 360, overflowY: 'auto' }}>
                  {loading && notifications.length === 0 ? (
                    <Box sx={{ px: 2, py: 5, textAlign: 'center' }}>
                      <Typography
                        sx={{ fontSize: '0.8rem', color: '#94a3b8' }}
                      >
                        Loading...
                      </Typography>
                    </Box>
                  ) : notifications.length === 0 ? (
                    <Box
                      sx={{
                        px: 2,
                        py: 6,
                        textAlign: 'center',
                        color: '#94a3b8',
                      }}
                    >
                      <NotificationsIcon
                        sx={{ fontSize: 40, color: '#cbd5e1', mb: 1 }}
                      />
                      <Typography sx={{ fontSize: '0.8rem', fontWeight: 500 }}>
                        No notifications yet
                      </Typography>
                    </Box>
                  ) : (
                    notifications.map((n) => {
                      const colors = getNotifColor(n.type);
                      return (
                        <Box
                          key={n.id}
                          onClick={() => handleNotifClick(n)}
                          sx={{
                            px: 2,
                            py: 1.5,
                            borderBottom: '1px solid #f8fafc',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                            position: 'relative',
                            bgcolor: !n.isRead
                              ? 'rgba(238,242,255,0.5)'
                              : 'transparent',
                            '&:hover': {
                              bgcolor: '#f8fafc',
                            },
                            '&:last-child': {
                              borderBottom: 'none',
                            },
                          }}
                        >
                          {/* Unread dot */}
                          {!n.isRead && (
                            <Box
                              sx={{
                                position: 'absolute',
                                left: 6,
                                top: '50%',
                                transform: 'translateY(-50%)',
                                width: 6,
                                height: 6,
                                borderRadius: '50%',
                                bgcolor: '#6366f1',
                                boxShadow: '0 0 6px rgba(99,102,241,0.6)',
                              }}
                            />
                          )}

                          <Stack
                            direction="row"
                            spacing={1.5}
                            alignItems="flex-start"
                          >
                            {/* Type badge */}
                            <Box
                              sx={{
                                flexShrink: 0,
                                px: 1,
                                py: 0.4,
                                borderRadius: 1,
                                bgcolor: colors.bg,
                                color: colors.color,
                                fontSize: '0.6rem',
                                fontWeight: 700,
                                letterSpacing: '0.03em',
                                mt: 0.2,
                              }}
                            >
                              {n.type?.slice(0, 4) || 'INFO'}
                            </Box>

                            {/* Content */}
                            <Box sx={{ minWidth: 0, flex: 1 }}>
                              <Typography
                                sx={{
                                  fontSize: '0.8rem',
                                  fontWeight: 600,
                                  color: '#1e293b',
                                  lineHeight: 1.3,
                                  mb: 0.3,
                                }}
                                noWrap
                              >
                                {n.title || 'Notification'}
                              </Typography>
                              <Typography
                                sx={{
                                  fontSize: '0.72rem',
                                  color: '#64748b',
                                  lineHeight: 1.4,
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden',
                                  mb: 0.5,
                                }}
                              >
                                {n.message}
                              </Typography>
                              <Typography
                                sx={{
                                  fontSize: '0.65rem',
                                  color: '#94a3b8',
                                  fontWeight: 500,
                                }}
                              >
                                {getTimeAgo(n.createdAt)}
                              </Typography>
                            </Box>
                          </Stack>
                        </Box>
                      );
                    })
                  )}
                </Box>

                {/* Footer */}
                <Box
                  sx={{
                    px: 2,
                    py: 1.25,
                    borderTop: '1px solid #f1f5f9',
                    textAlign: 'center',
                    bgcolor: '#fafbfd',
                  }}
                >
                  <button
                    onClick={() => {
                      setNotifOpen(false);
                      navigate('/notifications');
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                      color: '#4f46e5',
                      fontWeight: 700,
                      fontFamily: 'inherit',
                      padding: 0,
                    }}
                  >
                    View all notifications →
                  </button>
                </Box>
              </Box>
            </Fade>
          </Box>
        </ClickAwayListener>

        {/* ── User chip ── */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            pl: 1.5,
            ml: 0.5,
            borderLeft: '1px solid #e8ecf3',
          }}
        >
          <Avatar
            sx={{
              width: 36,
              height: 36,
              fontSize: '0.85rem',
              fontWeight: 700,
              background:
                'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              boxShadow: '0 2px 8px rgba(99,102,241,0.3)',
            }}
          >
            {userInitial}
          </Avatar>
          {!isMobile && (
            <Box sx={{ minWidth: 0 }}>
              <Typography
                sx={{
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  color: '#0f172a',
                  lineHeight: 1.2,
                  whiteSpace: 'nowrap',
                }}
              >
                {userName}
              </Typography>
              <Typography
                sx={{
                  fontSize: '0.65rem',
                  color: '#94a3b8',
                  fontWeight: 600,
                  letterSpacing: '0.03em',
                  textTransform: 'uppercase',
                }}
              >
                {user?.role || 'ADMIN'}
              </Typography>
            </Box>
          )}
        </Box>
      </Stack>
    </Box>
  );
};

export default Header;