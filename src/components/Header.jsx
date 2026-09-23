// src/components/Header.jsx
import { useState, useEffect, useRef, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
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
  Divider,
} from "@mui/material";
import {
  Menu as MenuIcon,
  NotificationsNone as NotificationsIcon,
  Logout as LogoutIcon,
  PersonOutlineOutlined as PersonIcon,
  SettingsOutlined as SettingsIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { logout } from "../redux/slices/authSlice";
import { getNotifications } from "../api/admin";
import { initSocket } from "../socket/socket";

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
};

const getNotifColor = (type) => {
  switch (type) {
    case "BOOKING":
      return { bg: "#dbeafe", color: "#1e40af" };
    case "PAYMENT":
      return { bg: "#d1fae5", color: "#065f46" };
    case "ROLE_REQUEST":
      return { bg: "#fce7f3", color: "#9d174d" };
    case "CHAT":
      return { bg: "#ede9fe", color: "#5b21b6" };
    case "OFFER":
      return { bg: "#fef3c7", color: "#92400e" };
    case "WITHDRAWAL":
      return { bg: "#fef3c7", color: "#b45309" };
    default:
      return { bg: "#f1f5f9", color: "#475569" };
  }
};

const Header = ({ onMenuClick }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [notifOpen, setNotifOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [clock, setClock] = useState(new Date());
  const [socketConnected, setSocketConnected] = useState(false);

  const notifRef = useRef(null);
  const userMenuRef = useRef(null);
  const socketRef = useRef(null);
  const pollTimerRef = useRef(null);

  // Clock — updates every 60s
  useEffect(() => {
    const timer = setInterval(() => setClock(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getNotifications({ limit: 5 });
      const data = res.data?.data;
      const list = Array.isArray(data) ? data : data?.rows || data?.items || [];
      setNotifications(list);
    } catch (err) {
      console.warn("Failed to fetch notifications:", err.message);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // ═══════════════════════════════════════════════════════════════
  // ✅ FIX: Socket listeners — NO double register
  // Uses named handlers stored in refs, cleanup properly
  // ═══════════════════════════════════════════════════════════════
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    // ✅ Reuse existing socket if available
    let socket = socketRef.current;
    if (!socket) {
      socket = initSocket(token);
      socketRef.current = socket;
    }

    if (!socket) return;

    const handleBookingUpdated = () => fetchNotifications();
    const handleBookingPaid = () => fetchNotifications();
    const handleRoleUpdated = () => fetchNotifications();
    const handleNotificationNew = () => fetchNotifications();

    const handleConnect = () => {
      console.log("✅ Header: socket connected");
      setSocketConnected(true);
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    };

    const handleDisconnect = () => {
      console.log("❌ Header: socket disconnected");
      setSocketConnected(false);
    };

    // ✅ Attach listeners (idempotent — MUI doesn't duplicate on re-render)
    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("booking:updated", handleBookingUpdated);
    socket.on("booking:paid", handleBookingPaid);
    socket.on("role:updated", handleRoleUpdated);
    socket.on("notification:new", handleNotificationNew);

    if (socket.connected) setSocketConnected(true);

    return () => {
      // ✅ Detach listeners on unmount — no duplicates
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("booking:updated", handleBookingUpdated);
      socket.off("booking:paid", handleBookingPaid);
      socket.off("role:updated", handleRoleUpdated);
      socket.off("notification:new", handleNotificationNew);

      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    };
  }, [fetchNotifications]);

  // Initial fetch
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // ═══════════════════════════════════════════════════════════════
  // ✅ Conditional polling — only when socket offline
  // ═══════════════════════════════════════════════════════════════
  useEffect(() => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }

    if (!socketConnected) {
      console.log("⏱️ Header: polling (socket offline)");
      pollTimerRef.current = setInterval(() => {
        if (document.hidden) return;
        fetchNotifications();
      }, 60000);
    }

    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    };
  }, [socketConnected, fetchNotifications]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const getTimeAgo = (dateStr) => {
    if (!dateStr) return "";
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  const handleNotifClick = (notif) => {
    setNotifOpen(false);
    if (notif.type === "BOOKING" && notif.data?.bookingId) {
      navigate(`/bookings/${notif.data.bookingId}`);
    } else if (notif.type === "ROLE_REQUEST") {
      navigate("/role-requests");
    } else if (notif.type === "PAYMENT") {
      navigate("/payments");
    } else if (notif.type === "CHAT") {
      navigate("/chat");
    } else if (notif.type === "WITHDRAWAL") {
      navigate("/withdrawals");
    } else {
      navigate("/notifications");
    }
  };

  const handleLogout = () => {
    if (socketRef.current) {
      try {
        socketRef.current.off("booking:updated");
        socketRef.current.off("booking:paid");
        socketRef.current.off("role:updated");
        socketRef.current.off("notification:new");
        socketRef.current.off("connect");
        socketRef.current.off("disconnect");
      } catch (e) {
        // ignore
      }
    }

    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }

    dispatch(logout());
    navigate("/login");
  };

  const userInitial =
    user?.firstName?.charAt(0)?.toUpperCase() ||
    user?.email?.charAt(0)?.toUpperCase() ||
    "A";
  const userName =
    user?.firstName || user?.name?.split(" ")[0] || "Admin";
  const fullName = user?.firstName
    ? `${user.firstName} ${user.lastName || ""}`.trim()
    : "Admin";

  return (
    <Box
      component="header"
      sx={{
        height: 72,
        bgcolor: "rgba(255,255,255,0.85)",
        backdropFilter: "blur(14px)",
        borderBottom: "1px solid #e8ecf3",
        px: { xs: 2, md: 3 },
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexShrink: 0,
        position: "relative",
        zIndex: 10,
        boxShadow: "0 1px 3px rgba(15,23,42,0.03)",
      }}
    >
      {/* LEFT */}
      <Stack
        direction="row"
        spacing={2}
        sx={{ alignItems: "center", minWidth: 0, flex: 1 }}
      >
        {isMobile && (
          <IconButton
            onClick={onMenuClick}
            size="small"
            sx={{
              bgcolor: "#f1f5f9",
              "&:hover": { bgcolor: "#e2e8f0" },
              width: 38,
              height: 38,
            }}
          >
            <MenuIcon sx={{ fontSize: 20, color: "#475569" }} />
          </IconButton>
        )}

        <Box sx={{ minWidth: 0 }}>
          <Typography
            sx={{
              fontSize: { xs: "0.9rem", md: "1rem" },
              fontWeight: 700,
              color: "#0f172a",
              lineHeight: 1.2,
              letterSpacing: "-0.015em",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {getGreeting()}, {userName}{" "}
            <span style={{ display: "inline-block" }}>👋</span>
          </Typography>
          <Typography
            sx={{
              display: { xs: "none", sm: "block" },
              fontSize: "0.7rem",
              color: "#94a3b8",
              fontWeight: 500,
              letterSpacing: "0.01em",
              mt: 0.15,
            }}
          >
            {clock.toLocaleDateString("en-IN", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </Typography>
        </Box>
      </Stack>

      {/* RIGHT */}
      <Stack
        direction="row"
        spacing={1.25}
        sx={{ alignItems: "center", flexShrink: 0 }}
      >
        {/* Notifications */}
        <ClickAwayListener onClickAway={() => setNotifOpen(false)}>
          <Box sx={{ position: "relative" }} ref={notifRef}>
            <IconButton
              size="small"
              onClick={() => setNotifOpen((prev) => !prev)}
              sx={{
                bgcolor: notifOpen ? "#eef2ff" : "#f8fafc",
                border: "1px solid",
                borderColor: notifOpen ? "#c7d2fe" : "#e8ecf3",
                width: 40,
                height: 40,
                transition: "all 0.2s ease",
                "&:hover": {
                  bgcolor: "#eef2f9",
                  borderColor: "#c7d2fe",
                },
              }}
            >
              <Badge
                badgeContent={unreadCount}
                color="error"
                sx={{
                  "& .MuiBadge-badge": {
                    fontSize: "0.6rem",
                    fontWeight: 700,
                    minWidth: 17,
                    height: 17,
                    boxShadow: "0 0 0 2px #ffffff",
                  },
                }}
              >
                <NotificationsIcon sx={{ fontSize: 19, color: "#64748b" }} />
              </Badge>
            </IconButton>

            <Fade in={notifOpen} timeout={200}>
              <Box
                sx={{
                  position: "absolute",
                  right: 0,
                  top: "calc(100% + 10px)",
                  width: 380,
                  maxWidth: "calc(100vw - 24px)",
                  bgcolor: "#ffffff",
                  borderRadius: 3,
                  border: "1px solid #e8ecf3",
                  boxShadow:
                    "0 20px 40px -12px rgba(15,23,42,0.15), 0 8px 16px -8px rgba(15,23,42,0.08)",
                  overflow: "hidden",
                  zIndex: 1300,
                  display: notifOpen ? "block" : "none",
                }}
              >
                <Box
                  sx={{
                    px: 2,
                    py: 1.5,
                    borderBottom: "1px solid #f1f5f9",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    bgcolor: "#fafbfd",
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: "0.85rem",
                      fontWeight: 700,
                      color: "#0f172a",
                    }}
                  >
                    Notifications
                  </Typography>
                  {unreadCount > 0 && (
                    <Chip
                      label={`${unreadCount} new`}
                      size="small"
                      sx={{
                        bgcolor: "#eef2ff",
                        color: "#4f46e5",
                        fontSize: "0.65rem",
                        fontWeight: 700,
                        height: 20,
                        borderRadius: 999,
                      }}
                    />
                  )}
                </Box>

                <Box sx={{ maxHeight: 360, overflowY: "auto" }}>
                  {loading && notifications.length === 0 ? (
                    <Box sx={{ px: 2, py: 5, textAlign: "center" }}>
                      <Typography
                        sx={{ fontSize: "0.8rem", color: "#94a3b8" }}
                      >
                        Loading...
                      </Typography>
                    </Box>
                  ) : notifications.length === 0 ? (
                    <Box
                      sx={{
                        px: 2,
                        py: 6,
                        textAlign: "center",
                        color: "#94a3b8",
                      }}
                    >
                      <NotificationsIcon
                        sx={{ fontSize: 40, color: "#cbd5e1", mb: 1 }}
                      />
                      <Typography
                        sx={{ fontSize: "0.8rem", fontWeight: 500 }}
                      >
                        You're all caught up
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
                            borderBottom: "1px solid #f8fafc",
                            cursor: "pointer",
                            transition: "all 0.15s ease",
                            position: "relative",
                            bgcolor: !n.isRead
                              ? "rgba(238,242,255,0.5)"
                              : "transparent",
                            "&:hover": { bgcolor: "#f8fafc" },
                            "&:last-child": { borderBottom: "none" },
                          }}
                        >
                          {!n.isRead && (
                            <Box
                              sx={{
                                position: "absolute",
                                left: 6,
                                top: "50%",
                                transform: "translateY(-50%)",
                                width: 6,
                                height: 6,
                                borderRadius: "50%",
                                bgcolor: "#6366f1",
                                boxShadow:
                                  "0 0 6px rgba(99,102,241,0.6)",
                              }}
                            />
                          )}
                          <Stack
                            direction="row"
                            spacing={1.5}
                            sx={{ alignItems: "flex-start" }}
                          >
                            <Box
                              sx={{
                                flexShrink: 0,
                                px: 1,
                                py: 0.4,
                                borderRadius: 1,
                                bgcolor: colors.bg,
                                color: colors.color,
                                fontSize: "0.6rem",
                                fontWeight: 700,
                                letterSpacing: "0.03em",
                                mt: 0.2,
                              }}
                            >
                              {n.type?.slice(0, 4) || "INFO"}
                            </Box>
                            <Box sx={{ minWidth: 0, flex: 1 }}>
                              <Typography
                                sx={{
                                  fontSize: "0.8rem",
                                  fontWeight: 600,
                                  color: "#1e293b",
                                  lineHeight: 1.3,
                                  mb: 0.3,
                                }}
                                noWrap
                              >
                                {n.title || "Notification"}
                              </Typography>
                              <Typography
                                sx={{
                                  fontSize: "0.72rem",
                                  color: "#64748b",
                                  lineHeight: 1.4,
                                  display: "-webkit-box",
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: "vertical",
                                  overflow: "hidden",
                                  mb: 0.5,
                                }}
                              >
                                {n.message}
                              </Typography>
                              <Typography
                                sx={{
                                  fontSize: "0.65rem",
                                  color: "#94a3b8",
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

                <Box
                  sx={{
                    px: 2,
                    py: 1.25,
                    borderTop: "1px solid #f1f5f9",
                    textAlign: "center",
                    bgcolor: "#fafbfd",
                  }}
                >
                  <button
                    onClick={() => {
                      setNotifOpen(false);
                      navigate("/notifications");
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "0.75rem",
                      color: "#4f46e5",
                      fontWeight: 700,
                      fontFamily: "inherit",
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

        {/* User Menu */}
        <ClickAwayListener onClickAway={() => setUserMenuOpen(false)}>
          <Box sx={{ position: "relative" }} ref={userMenuRef}>
            <Box
              onClick={() => setUserMenuOpen((prev) => !prev)}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                pl: { xs: 0.5, md: 1.5 },
                pr: 0.5,
                py: 0.5,
                ml: 0.5,
                borderLeft: { xs: "none", md: "1px solid #e8ecf3" },
                borderRadius: 999,
                cursor: "pointer",
                transition: "all 0.2s ease",
                "&:hover": { bgcolor: "#f8fafc" },
              }}
            >
              <Avatar
                sx={{
                  width: 36,
                  height: 36,
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  background:
                    "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                  boxShadow: "0 2px 8px rgba(99,102,241,0.3)",
                }}
              >
                {userInitial}
              </Avatar>
              {!isMobile && (
                <Box sx={{ minWidth: 0, pr: 0.5 }}>
                  <Typography
                    sx={{
                      fontSize: "0.8rem",
                      fontWeight: 700,
                      color: "#0f172a",
                      lineHeight: 1.2,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {userName}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: "0.62rem",
                      color: "#94a3b8",
                      fontWeight: 700,
                      letterSpacing: "0.05em",
                      textTransform: "uppercase",
                    }}
                  >
                    {user?.role || "ADMIN"}
                  </Typography>
                </Box>
              )}
            </Box>

            <Fade in={userMenuOpen} timeout={200}>
              <Box
                sx={{
                  position: "absolute",
                  right: 0,
                  top: "calc(100% + 10px)",
                  width: 240,
                  bgcolor: "#ffffff",
                  borderRadius: 3,
                  border: "1px solid #e8ecf3",
                  boxShadow:
                    "0 20px 40px -12px rgba(15,23,42,0.15), 0 8px 16px -8px rgba(15,23,42,0.08)",
                  overflow: "hidden",
                  zIndex: 1300,
                  display: userMenuOpen ? "block" : "none",
                }}
              >
                <Box
                  sx={{
                    px: 2,
                    py: 2,
                    background:
                      "linear-gradient(135deg, #f8fafc, #eef2ff)",
                    borderBottom: "1px solid #f1f5f9",
                  }}
                >
                  <Stack
                    direction="row"
                    spacing={1.5}
                    sx={{ alignItems: "center" }}
                  >
                    <Avatar
                      sx={{
                        width: 40,
                        height: 40,
                        fontSize: "0.9rem",
                        fontWeight: 700,
                        background:
                          "linear-gradient(135deg, #6366f1, #8b5cf6)",
                      }}
                    >
                      {userInitial}
                    </Avatar>
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography
                        sx={{
                          fontSize: "0.82rem",
                          fontWeight: 700,
                          color: "#0f172a",
                          lineHeight: 1.2,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {fullName}
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: "0.68rem",
                          color: "#64748b",
                          fontWeight: 500,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {user?.email || "admin@localguider.com"}
                      </Typography>
                    </Box>
                  </Stack>
                </Box>

                <Box sx={{ p: 1 }}>
                  {[
                    {
                      icon: <PersonIcon sx={{ fontSize: 18 }} />,
                      label: "My Profile",
                      path: "/profile",
                    },
                    {
                      icon: <SettingsIcon sx={{ fontSize: 18 }} />,
                      label: "Settings",
                      path: "/settings",
                    },
                  ].map((item) => (
                    <Box
                      key={item.label}
                      onClick={() => {
                        setUserMenuOpen(false);
                        navigate(item.path);
                      }}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1.5,
                        px: 1.5,
                        py: 1,
                        borderRadius: 1.5,
                        cursor: "pointer",
                        color: "#334155",
                        transition: "all 0.15s ease",
                        "&:hover": {
                          bgcolor: "#f1f5f9",
                          color: "#0f172a",
                        },
                      }}
                    >
                      {item.icon}
                      <Typography
                        sx={{ fontSize: "0.82rem", fontWeight: 600 }}
                      >
                        {item.label}
                      </Typography>
                    </Box>
                  ))}
                </Box>

                <Divider sx={{ borderColor: "#f1f5f9" }} />

                <Box sx={{ p: 1 }}>
                  <Box
                    onClick={handleLogout}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1.5,
                      px: 1.5,
                      py: 1,
                      borderRadius: 1.5,
                      cursor: "pointer",
                      color: "#dc2626",
                      transition: "all 0.15s ease",
                      "&:hover": { bgcolor: "#fef2f2" },
                    }}
                  >
                    <LogoutIcon sx={{ fontSize: 18 }} />
                    <Typography
                      sx={{ fontSize: "0.82rem", fontWeight: 600 }}
                    >
                      Sign Out
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Fade>
          </Box>
        </ClickAwayListener>
      </Stack>
    </Box>
  );
};

export default Header;