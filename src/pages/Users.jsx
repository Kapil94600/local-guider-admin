// src/pages/Users.jsx
import { useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  IconButton,
  Chip,
  Avatar,
  Stack,
  Tooltip,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogActions,
  useMediaQuery,
  useTheme,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  CircularProgress,
  Divider,
} from "@mui/material";
import {
  Search,
  Delete,
  Visibility,
  Block,
  LockOpen,
  Refresh,
  PersonAdd,
} from "@mui/icons-material";
import {
  DataGrid,
  GridToolbarContainer,
  GridToolbarFilterButton,
  GridToolbarExport,
} from "@mui/x-data-grid";
import {
  fetchUsers,
  deleteUser,
  setPage,
  setLimit,
} from "../redux/slices/userSlice";
import { blockUser, unblockUserByUserId, getBlocks } from "../api/admin";
import Loader from "../components/Loader";
import PanelHeader from "../components/PanelHeader";
import ExportButtons from "../components/ExportButtons";
import {
  getFallbackAvatar,
  getImageUrl,
  getDisplayName,
} from "../utils/imageFallback";
import { getIO } from "../socket/socket"; // ✅ Shared socket

// ═══════════════════════════════════════════════════════════════
// DESIGN TOKENS
// ═══════════════════════════════════════════════════════════════
const T = {
  border: "#eef1f6",
  borderStrong: "#e2e8f0",
  surface: "#ffffff",
  surfaceSoft: "#fafbfc",
  bgRowHover: "#fafbfc",
  textPrimary: "#0b1220",
  textMuted: "#64748b",
  textFaint: "#94a3b8",
  indigo: "#6366f1",
  indigoSoft: "#eef2ff",
  violet: "#8b5cf6",
  emerald: "#10b981",
  emeraldSoft: "#d1fae5",
  rose: "#f43f5e",
  roseSoft: "#ffe4e6",
  amber: "#f59e0b",
  amberSoft: "#fef3c7",
  sky: "#0ea5e9",
  radius: 3,
  fontDisplay: '"Inter", system-ui, -apple-system, sans-serif',
};

const ROLE_STYLES = {
  ADMIN: { bg: "#fef3c7", color: "#b45309" },
  GUIDER: { bg: "#ede9fe", color: "#6d28d9" },
  PHOTOGRAPHER: { bg: "#fce7f3", color: "#be185d" },
  USER: { bg: "#eef2ff", color: "#4338ca" },
};

const UserAvatar = ({ user, size = 40 }) => {
  const displayName = getDisplayName(user);
  const fallback = getFallbackAvatar(displayName);
  const role = user?.role || "USER";
  const gradient =
    role === "ADMIN"
      ? "linear-gradient(135deg, #f59e0b, #fbbf24)"
      : role === "GUIDER"
      ? "linear-gradient(135deg, #8b5cf6, #a78bfa)"
      : role === "PHOTOGRAPHER"
      ? "linear-gradient(135deg, #ec4899, #f472b6)"
      : "linear-gradient(135deg, #6366f1, #8b5cf6)";

  return (
    <Avatar
      src={getImageUrl(user.profileImage || user.avatar, displayName)}
      alt={displayName}
      sx={{
        width: size,
        height: size,
        background: gradient,
        fontWeight: 700,
        fontSize: size * 0.4,
        border: "2px solid #fff",
        boxShadow: "0 2px 6px rgba(15,23,42,0.1)",
      }}
      slotProps={{
        img: {
          onError: (e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = fallback;
          },
        },
      }}
    >
      {(displayName[0] || "U").toUpperCase()}
    </Avatar>
  );
};

const getFullName = (user) => {
  if (user.fullName) return user.fullName;
  if (user.firstName && user.lastName)
    return `${user.firstName} ${user.lastName}`;
  if (user.firstName) return user.firstName;
  if (user.name) return user.name;
  return "—";
};

const CustomToolbar = () => (
  <GridToolbarContainer sx={{ p: 1 }}>
    <GridToolbarFilterButton />
    <GridToolbarExport />
  </GridToolbarContainer>
);

const Users = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { items, loading, pagination } = useSelector((state) => state.users);

  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [blockConfirm, setBlockConfirm] = useState(null);
  const [unblockConfirm, setUnblockConfirm] = useState(null);
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [processing, setProcessing] = useState(false);

  const exportHeaders = [
    { key: "profileImage", label: "Photo", isImage: true },
    { key: "firstName", label: "First Name" },
    { key: "lastName", label: "Last Name" },
    { key: "email", label: "Email" },
    { key: "phone", label: "Phone" },
    { key: "role", label: "Role" },
    { key: "isActive", label: "Active" },
    { key: "createdAt", label: "Created At" },
  ];

  const fetchBlockedUsers = useCallback(async () => {
    try {
      const res = await getBlocks();
      setBlockedUsers(res.data?.data || []);
    } catch (error) {
      console.error("Error fetching blocked users:", error);
      setBlockedUsers([]);
    }
  }, []);

  const fetchUsersList = useCallback(() => {
    const params = {
      page: pagination.page,
      limit: pagination.limit,
      search: searchTerm || undefined,
      role: roleFilter !== "ALL" ? roleFilter : undefined,
      status: statusFilter !== "ALL" ? statusFilter : undefined,
    };
    dispatch(fetchUsers(params));
  }, [dispatch, pagination.page, pagination.limit, searchTerm, roleFilter, statusFilter]);

  // Initial fetch
  useEffect(() => {
    fetchBlockedUsers();
  }, [fetchBlockedUsers]);

  useEffect(() => {
    fetchUsersList();
  }, [fetchUsersList]);

  // ═══════════════════════════════════════════════════════════════
  // ✅ NEW: Socket listener — real-time block/unblock updates
  // ═══════════════════════════════════════════════════════════════
  useEffect(() => {
    const socket = getIO();
    if (!socket) return;

    const handleUserBlocked = (data) => {
      console.log("📩 Admin: user:blocked", data);
      fetchBlockedUsers();
      fetchUsersList();
    };

    const handleUserUnblocked = (data) => {
      console.log("📩 Admin: user:unblocked", data);
      fetchBlockedUsers();
      fetchUsersList();
    };

    socket.on("user:blocked", handleUserBlocked);
    socket.on("user:unblocked", handleUserUnblocked);

    return () => {
      socket.off("user:blocked", handleUserBlocked);
      socket.off("user:unblocked", handleUserUnblocked);
    };
  }, [fetchBlockedUsers, fetchUsersList]);

  const handleDelete = async (id) => {
    try {
      setProcessing(true);
      await dispatch(deleteUser(id)).unwrap();
      toast.success("User deleted successfully");
      setDeleteConfirm(null);
      fetchUsersList();
    } catch (error) {
      toast.error(error?.message || error || "Delete failed");
    } finally {
      setProcessing(false);
    }
  };

  const handleBlock = async (id) => {
    try {
      setProcessing(true);
      await blockUser(id, "Blocked by admin");
      toast.success("User blocked successfully");
      setBlockConfirm(null);
      fetchBlockedUsers();
      fetchUsersList();
    } catch (error) {
      toast.error(error.response?.data?.message || "Block failed");
    } finally {
      setProcessing(false);
    }
  };

  const handleUnblock = async (userId) => {
    try {
      setProcessing(true);
      await unblockUserByUserId(userId);
      toast.success("User unblocked successfully");
      setUnblockConfirm(null);
      fetchBlockedUsers();
      fetchUsersList();
    } catch (error) {
      toast.error(error.response?.data?.message || "Unblock failed");
    } finally {
      setProcessing(false);
    }
  };

  const isUserBlocked = (userId) =>
    blockedUsers.some((b) => b.blockedUserId === userId);

  const columns = [
    {
      field: "profileImage",
      headerName: "Profile",
      flex: 0.5,
      minWidth: 80,
      renderCell: (params) => <UserAvatar user={params.row} size={38} />,
    },
    {
      field: "name",
      headerName: "Name",
      flex: 1.2,
      minWidth: 140,
      renderCell: (params) => (
        <Typography
          sx={{
            fontSize: "0.82rem",
            fontWeight: 700,
            color: T.textPrimary,
            lineHeight: 1.2,
          }}
          noWrap
        >
          {getFullName(params.row)}
        </Typography>
      ),
    },
    {
      field: "email",
      headerName: "Email",
      flex: 1.5,
      minWidth: 180,
      renderCell: (params) => (
        <Typography sx={{ fontSize: "0.78rem", color: T.textMuted }} noWrap>
          {params.row.email || "—"}
        </Typography>
      ),
    },
    {
      field: "phone",
      headerName: "Phone",
      flex: 1,
      minWidth: 120,
      renderCell: (params) => (
        <Typography sx={{ fontSize: "0.78rem", color: T.textMuted }} noWrap>
          {params.row.phone || "—"}
        </Typography>
      ),
    },
    {
      field: "role",
      headerName: "Role",
      flex: 0.7,
      minWidth: 110,
      renderCell: (params) => {
        const style = ROLE_STYLES[params.row.role] || ROLE_STYLES.USER;
        return (
          <Chip
            label={params.row.role}
            size="small"
            sx={{
              bgcolor: style.bg,
              color: style.color,
              fontWeight: 700,
              fontSize: "0.65rem",
              height: 22,
              borderRadius: 999,
            }}
          />
        );
      },
    },
    {
      field: "status",
      headerName: "Status",
      flex: 0.7,
      minWidth: 100,
      renderCell: (params) => {
        const isBlocked = isUserBlocked(params.row.id);
        const label = isBlocked
          ? "Blocked"
          : params.row.isActive
          ? "Active"
          : "Inactive";
        const bg = isBlocked
          ? "#fee2e2"
          : params.row.isActive
          ? T.emeraldSoft
          : "#f1f5f9";
        const color = isBlocked
          ? "#dc2626"
          : params.row.isActive
          ? "#059669"
          : "#64748b";
        return (
          <Chip
            label={label}
            size="small"
            sx={{
              bgcolor: bg,
              color,
              fontWeight: 700,
              fontSize: "0.65rem",
              height: 22,
              borderRadius: 999,
            }}
          />
        );
      },
    },
    {
      field: "createdAt",
      headerName: "Joined",
      flex: 0.8,
      minWidth: 100,
      renderCell: (params) => (
        <Typography sx={{ fontSize: "0.75rem", color: T.textMuted }}>
          {new Date(params.row.createdAt).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}
        </Typography>
      ),
    },
    {
      field: "actions",
      headerName: "Actions",
      flex: 1,
      minWidth: 160,
      sortable: false,
      renderCell: (params) => {
        const isBlocked = isUserBlocked(params.row.id);
        return (
          <Stack direction="row" spacing={0.5} alignItems="center">
            <Tooltip title="View details">
              <IconButton
                size="small"
                onClick={() => navigate(`/users/${params.row.id}`)}
                sx={{
                  bgcolor: T.indigoSoft,
                  color: T.indigo,
                  "&:hover": { bgcolor: "#e0e7ff" },
                  width: 32,
                  height: 32,
                }}
              >
                <Visibility sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>

            {!isBlocked ? (
              <Tooltip title="Block user">
                <IconButton
                  size="small"
                  onClick={() => setBlockConfirm(params.row.id)}
                  sx={{
                    bgcolor: T.amberSoft,
                    color: "#b45309",
                    "&:hover": { bgcolor: "#fde68a" },
                    width: 32,
                    height: 32,
                  }}
                >
                  <Block sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>
            ) : (
              <Tooltip title="Unblock user">
                <IconButton
                  size="small"
                  onClick={() => setUnblockConfirm(params.row.id)}
                  sx={{
                    bgcolor: T.emeraldSoft,
                    color: "#059669",
                    "&:hover": { bgcolor: "#a7f3d0" },
                    width: 32,
                    height: 32,
                  }}
                >
                  <LockOpen sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>
            )}

            <Tooltip title="Delete user">
              <IconButton
                size="small"
                onClick={() => setDeleteConfirm(params.row.id)}
                sx={{
                  bgcolor: T.roseSoft,
                  color: T.rose,
                  "&:hover": { bgcolor: "#fecaca" },
                  width: 32,
                  height: 32,
                }}
              >
                <Delete sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>
          </Stack>
        );
      },
    },
  ];

  const renderMobileCards = () => (
    <Stack spacing={2}>
      {items?.length > 0 ? (
        items.map((user) => {
          const isBlocked = isUserBlocked(user.id);
          const roleStyle = ROLE_STYLES[user.role] || ROLE_STYLES.USER;
          return (
            <Paper
              key={user.id}
              elevation={0}
              sx={{
                borderRadius: T.radius,
                border: `1px solid ${T.border}`,
                bgcolor: T.surface,
                p: 2,
                transition: "all 0.2s ease",
                "&:hover": {
                  boxShadow: "0 12px 24px -16px rgba(15,23,42,0.15)",
                  borderColor: T.borderStrong,
                },
              }}
            >
              <Stack
                direction="row"
                alignItems="center"
                spacing={1.5}
                sx={{ mb: 1.5 }}
              >
                <UserAvatar user={user} size={44} />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    sx={{
                      fontSize: "0.88rem",
                      fontWeight: 700,
                      color: T.textPrimary,
                      lineHeight: 1.2,
                    }}
                    noWrap
                  >
                    {getFullName(user)}
                  </Typography>
                  <Typography
                    sx={{ fontSize: "0.72rem", color: T.textMuted, mt: 0.2 }}
                    noWrap
                  >
                    {user.email || "—"}
                  </Typography>
                </Box>
                <Chip
                  label={user.role || "USER"}
                  size="small"
                  sx={{
                    bgcolor: roleStyle.bg,
                    color: roleStyle.color,
                    fontWeight: 700,
                    fontSize: "0.62rem",
                    height: 22,
                    borderRadius: 999,
                  }}
                />
              </Stack>

              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                sx={{ pt: 1.5, borderTop: `1px solid ${T.border}` }}
              >
                <Chip
                  label={
                    isBlocked ? "Blocked" : user.isActive ? "Active" : "Inactive"
                  }
                  size="small"
                  sx={{
                    bgcolor: isBlocked
                      ? "#fee2e2"
                      : user.isActive
                      ? T.emeraldSoft
                      : "#f1f5f9",
                    color: isBlocked
                      ? "#dc2626"
                      : user.isActive
                      ? "#059669"
                      : "#64748b",
                    fontWeight: 700,
                    fontSize: "0.62rem",
                    height: 22,
                    borderRadius: 999,
                  }}
                />
                <Stack direction="row" spacing={0.5}>
                  <IconButton
                    size="small"
                    onClick={() => navigate(`/users/${user.id}`)}
                    sx={{
                      bgcolor: T.indigoSoft,
                      color: T.indigo,
                      width: 30,
                      height: 30,
                    }}
                  >
                    <Visibility sx={{ fontSize: 15 }} />
                  </IconButton>
                  {!isBlocked ? (
                    <IconButton
                      size="small"
                      onClick={() => setBlockConfirm(user.id)}
                      sx={{
                        bgcolor: T.amberSoft,
                        color: "#b45309",
                        width: 30,
                        height: 30,
                      }}
                    >
                      <Block sx={{ fontSize: 15 }} />
                    </IconButton>
                  ) : (
                    <IconButton
                      size="small"
                      onClick={() => setUnblockConfirm(user.id)}
                      sx={{
                        bgcolor: T.emeraldSoft,
                        color: "#059669",
                        width: 30,
                        height: 30,
                      }}
                    >
                      <LockOpen sx={{ fontSize: 15 }} />
                    </IconButton>
                  )}
                  <IconButton
                    size="small"
                    onClick={() => setDeleteConfirm(user.id)}
                    sx={{
                      bgcolor: T.roseSoft,
                      color: T.rose,
                      width: 30,
                      height: 30,
                    }}
                  >
                    <Delete sx={{ fontSize: 15 }} />
                  </IconButton>
                </Stack>
              </Stack>
            </Paper>
          );
        })
      ) : (
        <Paper
          elevation={0}
          sx={{
            p: 4,
            borderRadius: T.radius,
            border: `1px dashed ${T.border}`,
            textAlign: "center",
          }}
        >
          <PersonAdd sx={{ fontSize: 40, color: T.textFaint, mb: 1 }} />
          <Typography sx={{ color: T.textFaint, fontWeight: 500 }}>
            No users found
          </Typography>
        </Paper>
      )}
    </Stack>
  );

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1440, mx: "auto" }}>
      <Box sx={{ mb: 3 }}>
        <PanelHeader eyebrow="User Management" title="All Users" />
      </Box>

      <Paper
        elevation={0}
        sx={{
          p: 2,
          borderRadius: T.radius,
          border: `1px solid ${T.border}`,
          bgcolor: T.surface,
          mb: 2.5,
        }}
      >
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          alignItems="center"
        >
          <TextField
            fullWidth
            placeholder="Search by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            size="small"
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ fontSize: 18, color: T.textFaint }} />
                  </InputAdornment>
                ),
              },
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
                bgcolor: T.surfaceSoft,
                "& fieldset": { borderColor: T.border },
                "&:hover fieldset": { borderColor: "#c7d2fe" },
                "&.Mui-focused fieldset": {
                  borderColor: T.indigo,
                  borderWidth: 1.5,
                },
              },
            }}
          />

          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Role</InputLabel>
            <Select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              label="Role"
              sx={{ borderRadius: 2, bgcolor: T.surfaceSoft }}
            >
              <MenuItem value="ALL">All Roles</MenuItem>
              <MenuItem value="USER">User</MenuItem>
              <MenuItem value="GUIDER">Guider</MenuItem>
              <MenuItem value="PHOTOGRAPHER">Photographer</MenuItem>
              <MenuItem value="ADMIN">Admin</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 130 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              label="Status"
              sx={{ borderRadius: 2, bgcolor: T.surfaceSoft }}
            >
              <MenuItem value="ALL">All Status</MenuItem>
              <MenuItem value="true">Active</MenuItem>
              <MenuItem value="false">Inactive</MenuItem>
            </Select>
          </FormControl>

          <Tooltip title="Refresh">
            <IconButton
              onClick={() => {
                fetchUsersList();
                fetchBlockedUsers();
              }}
              sx={{
                bgcolor: T.indigoSoft,
                color: T.indigo,
                width: 40,
                height: 40,
                "&:hover": { bgcolor: "#e0e7ff" },
              }}
            >
              <Refresh sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>

          <ExportButtons
            data={items}
            headers={exportHeaders}
            filename="users"
          />
        </Stack>
      </Paper>

      {isMobile ? (
        loading ? (
          <Loader />
        ) : (
          renderMobileCards()
        )
      ) : (
        <Paper
          elevation={0}
          sx={{
            p: 1,
            borderRadius: T.radius,
            border: `1px solid ${T.border}`,
            bgcolor: T.surface,
            overflow: "hidden",
          }}
        >
          {loading ? (
            <Loader />
          ) : (
            <DataGrid
              rows={items}
              columns={columns}
              pageSize={pagination.limit}
              rowsPerPageOptions={[5, 10, 25]}
              page={pagination.page - 1}
              onPageChange={(p) => dispatch(setPage(p + 1))}
              onPageSizeChange={(s) => dispatch(setLimit(s))}
              components={{ Toolbar: CustomToolbar }}
              disableSelectionOnClick
              autoHeight
              rowHeight={64}
              sx={{
                border: "none",
                "& .MuiDataGrid-columnHeaders": {
                  bgcolor: T.surfaceSoft,
                  fontWeight: 700,
                  color: T.textMuted,
                  fontSize: "0.72rem",
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                  borderBottom: `1px solid ${T.border}`,
                  minHeight: "48px !important",
                },
                "& .MuiDataGrid-columnHeaderTitle": { fontWeight: 700 },
                "& .MuiDataGrid-row": {
                  borderBottom: `1px solid ${T.border}`,
                  transition: "background-color 0.15s ease",
                },
                "& .MuiDataGrid-row:hover": { bgcolor: T.bgRowHover },
                "& .MuiDataGrid-cell": {
                  borderBottom: "none",
                  display: "flex",
                  alignItems: "center",
                  py: 0,
                },
                "& .MuiDataGrid-cell:focus": { outline: "none" },
                "& .MuiDataGrid-columnSeparator": { display: "none" },
                "& .MuiDataGrid-footerContainer": {
                  borderTop: `1px solid ${T.border}`,
                },
                "& .MuiDataGrid-toolbarContainer": {
                  p: 1,
                  borderBottom: `1px solid ${T.border}`,
                },
              }}
            />
          )}
        </Paper>
      )}

      {/* Dialogs — same as before (Delete, Block, Unblock) */}
      <Dialog
        open={!!deleteConfirm}
        onClose={() => !processing && setDeleteConfirm(null)}
        PaperProps={{ sx: { borderRadius: T.radius, p: 0.5 } }}
      >
        <DialogTitle
          sx={{
            fontWeight: 700,
            color: T.textPrimary,
            fontSize: "1.05rem",
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: 1.5,
              bgcolor: T.roseSoft,
              color: T.rose,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Delete sx={{ fontSize: 18 }} />
          </Box>
          Delete User?
        </DialogTitle>
        <Divider />
        <Box sx={{ px: 3, py: 2 }}>
          <Typography sx={{ fontSize: "0.85rem", color: T.textMuted }}>
            This will permanently delete the user and all associated data
            (profile, wallet, bookings, reviews, chats). This action cannot be
            undone.
          </Typography>
        </Box>
        <DialogActions sx={{ p: 2, pt: 0, gap: 1 }}>
          <Button
            onClick={() => setDeleteConfirm(null)}
            disabled={processing}
            sx={{ textTransform: "none", fontWeight: 600, color: T.textMuted }}
          >
            Cancel
          </Button>
          <Button
            onClick={() => handleDelete(deleteConfirm)}
            disabled={processing}
            variant="contained"
            sx={{
              textTransform: "none",
              fontWeight: 700,
              borderRadius: 2,
              bgcolor: T.rose,
              "&:hover": { bgcolor: "#e11d48" },
              boxShadow: "none",
            }}
          >
            {processing ? (
              <CircularProgress size={16} sx={{ color: "#fff" }} />
            ) : (
              "Delete User"
            )}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={!!blockConfirm}
        onClose={() => !processing && setBlockConfirm(null)}
        PaperProps={{ sx: { borderRadius: T.radius, p: 0.5 } }}
      >
        <DialogTitle
          sx={{
            fontWeight: 700,
            color: T.textPrimary,
            fontSize: "1.05rem",
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: 1.5,
              bgcolor: T.amberSoft,
              color: "#b45309",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Block sx={{ fontSize: 18 }} />
          </Box>
          Block User?
        </DialogTitle>
        <Divider />
        <Box sx={{ px: 3, py: 2 }}>
          <Typography sx={{ fontSize: "0.85rem", color: T.textMuted }}>
            The user won't be able to log in or access the platform.
          </Typography>
        </Box>
        <DialogActions sx={{ p: 2, pt: 0, gap: 1 }}>
          <Button
            onClick={() => setBlockConfirm(null)}
            disabled={processing}
            sx={{ textTransform: "none", fontWeight: 600, color: T.textMuted }}
          >
            Cancel
          </Button>
          <Button
            onClick={() => handleBlock(blockConfirm)}
            disabled={processing}
            variant="contained"
            sx={{
              textTransform: "none",
              fontWeight: 700,
              borderRadius: 2,
              bgcolor: T.amber,
              "&:hover": { bgcolor: "#d97706" },
              boxShadow: "none",
            }}
          >
            {processing ? (
              <CircularProgress size={16} sx={{ color: "#fff" }} />
            ) : (
              "Block"
            )}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={!!unblockConfirm}
        onClose={() => !processing && setUnblockConfirm(null)}
        PaperProps={{ sx: { borderRadius: T.radius, p: 0.5 } }}
      >
        <DialogTitle
          sx={{
            fontWeight: 700,
            color: T.textPrimary,
            fontSize: "1.05rem",
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: 1.5,
              bgcolor: T.emeraldSoft,
              color: "#059669",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <LockOpen sx={{ fontSize: 18 }} />
          </Box>
          Unblock User?
        </DialogTitle>
        <Divider />
        <Box sx={{ px: 3, py: 2 }}>
          <Typography sx={{ fontSize: "0.85rem", color: T.textMuted }}>
            The user will be able to access the platform again.
          </Typography>
        </Box>
        <DialogActions sx={{ p: 2, pt: 0, gap: 1 }}>
          <Button
            onClick={() => setUnblockConfirm(null)}
            disabled={processing}
            sx={{ textTransform: "none", fontWeight: 600, color: T.textMuted }}
          >
            Cancel
          </Button>
          <Button
            onClick={() => handleUnblock(unblockConfirm)}
            disabled={processing}
            variant="contained"
            sx={{
              textTransform: "none",
              fontWeight: 700,
              borderRadius: 2,
              bgcolor: T.emerald,
              "&:hover": { bgcolor: "#059669" },
              boxShadow: "none",
            }}
          >
            {processing ? (
              <CircularProgress size={16} sx={{ color: "#fff" }} />
            ) : (
              "Unblock"
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Users;