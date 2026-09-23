// src/components/Sidebar.jsx
import { useState, useEffect, useRef } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../redux/slices/authSlice";
import apiClient from "../api/axios";
import {
  FaTachometerAlt,
  FaUsers,
  FaUserTie,
  FaCamera,
  FaMapMarkerAlt,
  FaBook,
  FaCreditCard,
  FaStar,
  FaBell,
  FaUserCog,
  FaCog,
  FaSignOutAlt,
  FaImages,
  FaPercentage,
  FaIdCard,
  FaComments,
  FaChartLine,
  FaWallet,
  FaMoneyCheckAlt,
  FaChevronDown,
  FaHeartbeat,
} from "react-icons/fa";
import {
  Box,
  IconButton,
  Typography,
  Drawer,
  useMediaQuery,
  useTheme,
  Avatar,
  Tooltip,
  Chip,
} from "@mui/material";
import { Close, Verified } from "@mui/icons-material";

// ═══════════════════════════════════════════════════════════════
// MENU CONFIG
// ═══════════════════════════════════════════════════════════════
const menuSections = [
  {
    label: "Overview",
    items: [
      { to: "/", icon: FaTachometerAlt, label: "Dashboard" },
      { to: "/reports", icon: FaChartLine, label: "Reports" },
    ],
  },
  {
    label: "People",
    items: [
      { to: "/users", icon: FaUsers, label: "Users" },
      { to: "/guiders", icon: FaUserTie, label: "Guiders" },
      { to: "/photographers", icon: FaCamera, label: "Photographers" },
      {
        to: "/role-requests",
        icon: FaUserCog,
        label: "Role Requests",
        badgeKey: "pendingRoleRequests",
      },
    ],
  },
  {
    label: "Content",
    items: [
      { to: "/places", icon: FaMapMarkerAlt, label: "Places" },
      { to: "/sliders", icon: FaImages, label: "Sliders" },
      { to: "/offers", icon: FaPercentage, label: "Offers" },
      { to: "/reviews", icon: FaStar, label: "Reviews" },
    ],
  },
  {
    label: "Transactions",
    items: [
      { to: "/bookings", icon: FaBook, label: "Bookings" },
      { to: "/payments", icon: FaCreditCard, label: "Payments" },
      { to: "/wallets", icon: FaWallet, label: "Wallets" },
      { to: "/withdrawals", icon: FaMoneyCheckAlt, label: "Withdrawals" },
    ],
  },
  {
    label: "System",
    items: [
      { to: "/id-cards", icon: FaIdCard, label: "ID Cards" },
      { to: "/notifications", icon: FaBell, label: "Notifications" },
      { to: "/chat", icon: FaComments, label: "Chat" },
      { to: "/health", icon: FaHeartbeat, label: "Health Check" },
      { to: "/settings", icon: FaCog, label: "Settings" },
    ],
  },
];

// ═══════════════════════════════════════════════════════════════
// ✅ FIX B-2: Reduced polling: 5 min (was 60s)
// + Pause when tab hidden
// ═══════════════════════════════════════════════════════════════
const POLL_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

// ═══════════════════════════════════════════════════════════════
// SIDEBAR
// ═══════════════════════════════════════════════════════════════
const Sidebar = ({ mobileOpen, onClose }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { user } = useSelector((state) => state.auth);
  const [pendingRoleRequests, setPendingRoleRequests] = useState(0);

  const cancelRef = useRef(false);
  const intervalRef = useRef(null);

  // ═══════════════════════════════════════════════════════════════
  // ✅ FIX B-2 + A-5: Fetch with 5 min interval + visibility pause
  // + Listen for "roleRequests:seen" event to instantly clear badge
  // ═══════════════════════════════════════════════════════════════
  useEffect(() => {
    cancelRef.current = false;

    const fetchPending = async () => {
      try {
        const res = await apiClient.get("/admin/role-requests", {
          params: { status: "PENDING", limit: 200 },
        });

        if (cancelRef.current) return;

        const payload = res.data?.data ?? res.data;
        const arr = Array.isArray(payload)
          ? payload
          : payload?.rows || payload?.items || [];

        const pendingOnly = arr.filter((r) => r.status === "PENDING");

        // ✅ Safe parse of "seen" timestamp
        const rawSeen = localStorage.getItem("roleRequestsSeenAt");
        const lastSeen = parseInt(rawSeen || "0", 10) || 0;

        // ✅ Guard against invalid createdAt
        const unseen = pendingOnly.filter((r) => {
          if (!r.createdAt) return false;
          const createdTs = new Date(r.createdAt).getTime();
          if (isNaN(createdTs)) return false;
          return createdTs > lastSeen;
        });

        // ✅ Check cancelRef before setState (prevent memory leak)
        if (cancelRef.current) return;
        setPendingRoleRequests(unseen.length);
      } catch (e) {
        if (!cancelRef.current) {
          setPendingRoleRequests(0);
        }
      }
    };

    fetchPending();

    // ✅ Start interval with pause when tab hidden
    const startInterval = () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(fetchPending, POLL_INTERVAL_MS);
    };

    const stopInterval = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    startInterval();

    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopInterval();
      } else {
        fetchPending();
        startInterval();
      }
    };

    // ═══════════════════════════════════════════════════════════════
    // ✅ FIX A-5: Listen for "roleRequests:seen" event
    // Jab admin RoleRequests page kholta hai, woh event fire karta hai
    // aur sidebar turant badge count 0 kar deta hai (5 min wait nahi)
    // ═══════════════════════════════════════════════════════════════
    const handleSeen = () => {
      console.log("✅ Sidebar: role requests marked as seen");
      setPendingRoleRequests(0);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("roleRequests:seen", handleSeen);

    return () => {
      cancelRef.current = true;
      stopInterval();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("roleRequests:seen", handleSeen);
    };
  }, []);

  // Collapse state per section
  const [collapsed, setCollapsed] = useState({});
  const toggleSection = (label) =>
    setCollapsed((prev) => ({ ...prev, [label]: !prev[label] }));

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
    if (onClose) onClose();
  };

  const userInitial =
    user?.firstName?.charAt(0)?.toUpperCase() ||
    user?.email?.charAt(0)?.toUpperCase() ||
    "A";
  const userName = user?.firstName
    ? `${user.firstName} ${user.lastName || ""}`.trim()
    : "Admin";

  const content = (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background:
          "linear-gradient(180deg, #0a0e27 0%, #141033 55%, #0a0e27 100%)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Decorative orbs */}
      <Box
        sx={{
          position: "absolute",
          top: -100,
          right: -100,
          width: 240,
          height: 240,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(99,102,241,0.28), transparent 70%)",
          filter: "blur(50px)",
          pointerEvents: "none",
        }}
      />
      <Box
        sx={{
          position: "absolute",
          bottom: -80,
          left: -80,
          width: 220,
          height: 220,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(139,92,246,0.22), transparent 70%)",
          filter: "blur(50px)",
          pointerEvents: "none",
        }}
      />

      {/* HEADER */}
      <Box
        sx={{
          p: 2.5,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          position: "relative",
          zIndex: 1,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box
            sx={{ position: "relative", width: 44, height: 44, flexShrink: 0 }}
          >
            <Box
              sx={{
                position: "relative",
                width: 44,
                height: 44,
                borderRadius: "50%",
                overflow: "hidden",
                bgcolor: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <img
                src="/assets/images/logo21.jpg"
                alt="Local Guider"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            </Box>
          </Box>

          <Box sx={{ minWidth: 0 }}>
            <Typography
              sx={{
                color: "#ffffff",
                fontWeight: 800,
                fontSize: "1rem",
                letterSpacing: "-0.02em",
                lineHeight: 1.15,
              }}
            >
              Local Guider
            </Typography>
            <Box
              sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.2 }}
            >
              <Verified sx={{ fontSize: 11, color: "#a78bfa" }} />
              <Typography
                sx={{
                  color: "rgba(165,180,252,0.75)",
                  fontSize: "0.65rem",
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
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
              color: "white",
              bgcolor: "rgba(255,255,255,0.08)",
              "&:hover": { bgcolor: "rgba(255,255,255,0.15)" },
            }}
          >
            <Close fontSize="small" />
          </IconButton>
        )}
      </Box>

      {/* NAVIGATION */}
      <Box
        component="nav"
        sx={{
          flex: 1,
          overflowY: "auto",
          px: 1.5,
          py: 2,
          position: "relative",
          zIndex: 1,
          "&::-webkit-scrollbar": { width: 5 },
          "&::-webkit-scrollbar-thumb": {
            background: "rgba(255,255,255,0.1)",
            borderRadius: 3,
          },
        }}
      >
        {menuSections.map((section) => {
          const isCollapsed = collapsed[section.label];
          return (
            <Box key={section.label} sx={{ mb: 1.5 }}>
              <Box
                onClick={() => toggleSection(section.label)}
                sx={{
                  px: 2,
                  py: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  cursor: "pointer",
                  borderRadius: 1.5,
                  "&:hover": { bgcolor: "rgba(255,255,255,0.03)" },
                }}
              >
                <Typography
                  sx={{
                    fontSize: "0.65rem",
                    fontWeight: 700,
                    color: "rgba(165,180,252,0.5)",
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                  }}
                >
                  {section.label}
                </Typography>
                <FaChevronDown
                  size={9}
                  style={{
                    color: "rgba(165,180,252,0.4)",
                    transform: isCollapsed ? "rotate(-90deg)" : "rotate(0deg)",
                    transition: "transform 0.25s ease",
                  }}
                />
              </Box>

              <Box
                sx={{
                  maxHeight: isCollapsed ? 0 : 500,
                  overflow: "hidden",
                  transition: "max-height 0.35s ease",
                }}
              >
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const badgeValue =
                    item.badgeKey === "pendingRoleRequests"
                      ? pendingRoleRequests
                      : item.badge;

                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={onClose}
                      style={{ textDecoration: "none" }}
                    >
                      {({ isActive }) => (
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1.5,
                            px: 2,
                            py: 1.15,
                            mb: 0.4,
                            borderRadius: "10px",
                            position: "relative",
                            transition: "all 0.2s ease",
                            bgcolor: isActive
                              ? "rgba(99,102,241,0.18)"
                              : "transparent",
                            color: isActive
                              ? "#ffffff"
                              : "rgba(199,210,254,0.75)",
                            "&:hover": {
                              bgcolor: isActive
                                ? "rgba(99,102,241,0.26)"
                                : "rgba(255,255,255,0.05)",
                              color: "#ffffff",
                              transform: "translateX(2px)",
                            },
                          }}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              width: 28,
                              height: 28,
                              borderRadius: "8px",
                              flexShrink: 0,
                              bgcolor: isActive
                                ? "rgba(139,92,246,0.25)"
                                : "rgba(255,255,255,0.04)",
                            }}
                          >
                            <Icon size={13} />
                          </Box>
                          <Typography
                            sx={{
                              fontSize: "0.85rem",
                              fontWeight: isActive ? 700 : 500,
                              flex: 1,
                            }}
                          >
                            {item.label}
                          </Typography>

                          {badgeValue > 0 && (
                            <Chip
                              label={badgeValue}
                              size="small"
                              sx={{
                                height: 18,
                                minWidth: 18,
                                borderRadius: "9px",
                                bgcolor: "#f43f5e",
                                color: "#fff",
                                fontSize: "0.6rem",
                                fontWeight: 700,
                                "& .MuiChip-label": { px: 0.75 },
                              }}
                            />
                          )}

                          {isActive && !badgeValue && (
                            <Box
                              sx={{
                                width: 6,
                                height: 6,
                                borderRadius: "50%",
                                bgcolor: "#a78bfa",
                                boxShadow: "0 0 8px rgba(167,139,250,0.9)",
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

      {/* FOOTER */}
      <Box
        sx={{
          p: 1.5,
          borderTop: "1px solid rgba(255,255,255,0.06)",
          position: "relative",
          zIndex: 1,
          bgcolor: "rgba(0,0,0,0.2)",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            px: 1.5,
            py: 1.2,
            mb: 1,
            borderRadius: "10px",
            bgcolor: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.05)",
          }}
        >
          <Box sx={{ position: "relative" }}>
            <Avatar
              sx={{
                width: 34,
                height: 34,
                fontSize: "0.85rem",
                fontWeight: 700,
                background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              }}
            >
              {userInitial}
            </Avatar>
            <Box
              sx={{
                position: "absolute",
                bottom: -1,
                right: -1,
                width: 10,
                height: 10,
                borderRadius: "50%",
                bgcolor: "#10b981",
                border: "2px solid #0a0e27",
              }}
            />
          </Box>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography
              sx={{
                color: "#ffffff",
                fontSize: "0.78rem",
                fontWeight: 700,
                lineHeight: 1.2,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {userName}
            </Typography>
            <Typography
              sx={{
                color: "rgba(165,180,252,0.6)",
                fontSize: "0.62rem",
                fontWeight: 700,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}
            >
              {user?.role || "ADMIN"}
            </Typography>
          </Box>
        </Box>

        <Tooltip title="Sign out" placement="right" arrow>
          <Box
            onClick={handleLogout}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              px: 2,
              py: 1.15,
              borderRadius: "10px",
              cursor: "pointer",
              color: "rgba(252,165,165,0.85)",
              bgcolor: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.15)",
              transition: "all 0.2s ease",
              "&:hover": {
                bgcolor: "rgba(239,68,68,0.18)",
                color: "#fca5a5",
              },
            }}
          >
            <FaSignOutAlt size={14} />
            <Typography sx={{ fontSize: "0.82rem", fontWeight: 600 }}>
              Sign Out
            </Typography>
          </Box>
        </Tooltip>
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
        sx={{
          "& .MuiDrawer-paper": {
            width: 272,
            boxSizing: "border-box",
            border: "none",
            background: "transparent",
          },
        }}
      >
        {content}
      </Drawer>
    );
  }

  return (
    <Box sx={{ width: 272, flexShrink: 0, height: "100vh" }}>{content}</Box>
  );
};

export default Sidebar;