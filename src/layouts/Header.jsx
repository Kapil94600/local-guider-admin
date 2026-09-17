// src/components/Header.jsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useMediaQuery, useTheme, IconButton, Badge, ClickAwayListener, Fade } from '@mui/material';
import { Menu as MenuIcon, Search as SearchIcon } from '@mui/icons-material';
import { FaBell, FaUserCircle } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { getNotifications } from '../api/admin';

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
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

  useEffect(() => {
    const timer = setInterval(() => setClock(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  // ✅ Real API — fetch notifications
  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getNotifications({ limit: 5 });
      const data = res.data?.data;
      const list = Array.isArray(data) ? data : (data?.rows || data?.items || []);
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
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  const handleNotifClick = (notif) => {
    setNotifOpen(false);
    // deep link based on type
    if (notif.type === 'BOOKING' && notif.data?.bookingId) {
      navigate(`/bookings/${notif.data.bookingId}`);
    } else if (notif.type === 'ROLE_REQUEST') {
      navigate('/role-requests');
    } else if (notif.type === 'PAYMENT') {
      navigate('/payments');
    } else {
      navigate('/notifications');
    }
  };

  return (
    <header className="h-16 bg-white/80 backdrop-blur-md border-b border-gray-200/50 px-4 md:px-6 flex items-center justify-between flex-shrink-0 z-10 shadow-sm">
      <div className="flex items-center gap-3 min-w-0">
        {isMobile && (
          <IconButton onClick={onMenuClick} size="small">
            <MenuIcon />
          </IconButton>
        )}
        <div className="min-w-0">
          <span className="text-lg font-semibold text-gray-700 block leading-tight truncate">
            {getGreeting()}, {user?.firstName || user?.name?.split(' ')[0] || 'Admin'} 👋
          </span>
          <span className="hidden sm:block text-xs text-gray-400">
            {clock.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
          </span>
        </div>
      </div>

      <div className="hidden md:flex flex-1 max-w-sm mx-6">
        <div className="flex items-center w-full bg-gray-100 rounded-full px-3 py-1.5 focus-within:ring-2 focus-within:ring-indigo-300 transition-all">
          <SearchIcon sx={{ fontSize: 18, color: '#9CA3AF', mr: 1 }} />
          <input
            type="text"
            placeholder="Search users, bookings, places..."
            className="bg-transparent outline-none text-sm w-full text-gray-600 placeholder:text-gray-400"
          />
        </div>
      </div>

      <div className="flex items-center gap-3 relative">
        <ClickAwayListener onClickAway={() => setNotifOpen(false)}>
          <div className="relative" ref={notifRef}>
            <IconButton size="small" onClick={() => setNotifOpen((prev) => !prev)}>
              <Badge badgeContent={unreadCount} color="error">
                <FaBell className="text-gray-500 text-xl" />
              </Badge>
            </IconButton>

            <Fade in={notifOpen}>
              <div
                className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-20"
                style={{ display: notifOpen ? 'block' : 'none' }}
              >
                <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-700">Notifications</span>
                  <span className="text-xs text-indigo-500 font-medium">
                    {unreadCount} unread
                  </span>
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {loading && notifications.length === 0 ? (
                    <div className="px-4 py-6 text-center text-sm text-gray-400">
                      Loading...
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="px-4 py-6 text-center text-sm text-gray-400">
                      No notifications
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => handleNotifClick(n)}
                        className={`px-4 py-3 text-sm border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors ${
                          !n.isRead ? 'bg-indigo-50/40' : ''
                        }`}
                      >
                        <p className="text-gray-700 font-medium leading-snug truncate">
                          {n.title || 'Notification'}
                        </p>
                        <p className="text-gray-500 text-xs mt-0.5 line-clamp-2">
                          {n.message}
                        </p>
                        <span className="text-xs text-gray-400 mt-1 block">
                          {getTimeAgo(n.createdAt)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
                <div className="px-4 py-2 border-t border-gray-100 text-center">
                  <button
                    onClick={() => { setNotifOpen(false); navigate('/notifications'); }}
                    className="text-xs text-indigo-600 font-semibold hover:underline"
                  >
                    View all →
                  </button>
                </div>
              </div>
            </Fade>
          </div>
        </ClickAwayListener>

        <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
          <FaUserCircle className="text-gray-400 text-3xl" />
          <span className="hidden sm:block text-sm font-medium text-gray-700">
            {user?.firstName || user?.name || 'Admin'}
          </span>
        </div>
      </div>
    </header>
  );
};

export default Header;