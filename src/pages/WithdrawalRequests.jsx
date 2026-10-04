// src/pages/WithdrawalRequests.jsx
// ═══════════════════════════════════════════════════════════════
// WITHDRAWAL REQUESTS — Admin panel with commission breakdown
// Shows: Gross | Commission | Net
// ═══════════════════════════════════════════════════════════════
import { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  IconButton,
  Chip,
  Avatar,
  Stack,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  Divider,
  CircularProgress,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  Search,
  Check,
  Close,
  Visibility,
  Refresh,
  Inbox,
  AccountBalance,
  Person,
  Percent as PercentIcon,
  TrendingDown,
} from "@mui/icons-material";
import {
  DataGrid,
  GridToolbarContainer,
  GridToolbarFilterButton,
  GridToolbarExport,
} from "@mui/x-data-grid";
import { toast } from "react-toastify";
import apiClient from "../api/axios";
import Loader from "../components/Loader";
import PanelHeader from "../components/PanelHeader";

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
  violetSoft: "#ede9fe",
  emerald: "#10b981",
  emeraldSoft: "#d1fae5",
  rose: "#f43f5e",
  roseSoft: "#ffe4e6",
  amber: "#f59e0b",
  amberSoft: "#fef3c7",
  sky: "#0ea5e9",
  skySoft: "#e0f2fe",
  radius: 3,
  fontDisplay: '"Inter", system-ui, -apple-system, sans-serif',
};

const STATUS_STYLES = {
  PENDING: { bg: T.amberSoft, color: "#b45309", label: "Pending" },
  APPROVED: { bg: T.emeraldSoft, color: "#047857", label: "Approved" },
  REJECTED: { bg: T.roseSoft, color: "#be123c", label: "Rejected" },
};

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════
const safeNumber = (val) => {
  if (val === null || val === undefined || val === "") return 0;
  const n = parseFloat(val);
  return isNaN(n) ? 0 : n;
};

const formatMoney = (val) => `₹${safeNumber(val).toFixed(2)}`;

const CustomToolbar = () => (
  <GridToolbarContainer sx={{ p: 1 }}>
    <GridToolbarFilterButton />
    <GridToolbarExport />
  </GridToolbarContainer>
);

// ═══════════════════════════════════════════════════════════════
// SECTION HEADER
// ═══════════════════════════════════════════════════════════════
const SectionHeader = ({ icon, title, accent = T.indigo }) => (
  <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
    <Box
      sx={{
        width: 32,
        height: 32,
        borderRadius: 1.5,
        bgcolor: `${accent}12`,
        color: accent,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      {icon}
    </Box>
    <Typography
      sx={{
        fontFamily: T.fontDisplay,
        fontWeight: 700,
        fontSize: "0.9rem",
        color: T.textPrimary,
      }}
    >
      {title}
    </Typography>
  </Stack>
);

// ═══════════════════════════════════════════════════════════════
// INFO ROW
// ═══════════════════════════════════════════════════════════════
const InfoRow = ({ label, value }) => (
  <Box sx={{ py: 1 }}>
    <Typography
      sx={{
        fontSize: "0.62rem",
        fontWeight: 700,
        color: T.textFaint,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
      }}
    >
      {label}
    </Typography>
    <Typography
      sx={{
        fontSize: "0.85rem",
        fontWeight: 600,
        color: T.textPrimary,
        mt: 0.3,
        wordBreak: "break-word",
      }}
    >
      {value || "N/A"}
    </Typography>
  </Box>
);

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
const WithdrawalRequests = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [viewModal, setViewModal] = useState(null);
  const [processing, setProcessing] = useState(null);
  const [rejectDialog, setRejectDialog] = useState({ open: false, id: null });
  const [rejectReason, setRejectReason] = useState("");

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/withdrawal/all");
      const data = res.data?.data || res.data;
      setRequests(Array.isArray(data) ? data : data.rows || []);
    } catch (error) {
      toast.error("Failed to fetch withdrawal requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleApprove = async (id) => {
    setProcessing(id);
    try {
      await apiClient.put(`/withdrawal/${id}/status`, { status: "APPROVED" });
      toast.success("Withdrawal approved");
      setViewModal(null);
      fetchRequests();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to approve");
    } finally {
      setProcessing(null);
    }
  };

  const openRejectDialog = (id) => {
    setRejectDialog({ open: true, id });
    setRejectReason("");
  };

  const handleReject = async () => {
    const id = rejectDialog.id;
    if (!id) return;
    setProcessing(id);
    try {
      await apiClient.put(`/withdrawal/${id}/status`, {
        status: "REJECTED",
        adminMessage: rejectReason,
      });
      toast.success("Withdrawal rejected");
      setRejectDialog({ open: false, id: null });
      setRejectReason("");
      setViewModal(null);
      fetchRequests();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to reject");
    } finally {
      setProcessing(null);
    }
  };

  const filteredRequests = requests.filter((r) => {
    const search = searchTerm.toLowerCase();
    const matchesSearch =
      r.User?.firstName?.toLowerCase().includes(search) ||
      r.User?.lastName?.toLowerCase().includes(search) ||
      r.User?.email?.toLowerCase().includes(search) ||
      r.bankName?.toLowerCase().includes(search);
    const matchesStatus = statusFilter === "ALL" || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // ═══════════════════════════════════════════════════════════════
  // TABLE COLUMNS
  // ═══════════════════════════════════════════════════════════════
  const columns = [
    {
      field: "User",
      headerName: "User",
      flex: 1.3,
      minWidth: 200,
      renderCell: (params) => {
        const name = `${params.row.User?.firstName || ""} ${
          params.row.User?.lastName || ""
        }`.trim();
        const initial = (params.row.User?.firstName || "U").charAt(0);
        return (
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Avatar
              sx={{
                width: 38,
                height: 38,
                background: `linear-gradient(135deg, ${T.indigo}, ${T.violet})`,
                fontSize: 14,
                fontWeight: 700,
                border: "2px solid #fff",
                boxShadow: "0 2px 6px rgba(15,23,42,0.1)",
              }}
            >
              {initial}
            </Avatar>
            <Box sx={{ minWidth: 0 }}>
              <Typography
                sx={{
                  fontSize: "0.82rem",
                  fontWeight: 700,
                  color: T.textPrimary,
                  lineHeight: 1.2,
                }}
                noWrap
              >
                {name || "Unknown"}
              </Typography>
              <Typography
                sx={{ fontSize: "0.7rem", color: T.textFaint }}
                noWrap
              >
                {params.row.User?.email || "N/A"}
              </Typography>
            </Box>
          </Stack>
        );
      },
    },
    // ✅ NEW: Gross amount
    {
      field: "amount",
      headerName: "Gross",
      flex: 0.7,
      minWidth: 110,
      renderCell: (params) => (
        <Typography
          sx={{
            fontWeight: 700,
            color: T.textPrimary,
            fontFamily: "monospace",
            fontSize: "0.82rem",
          }}
        >
          {formatMoney(params.row.amount)}
        </Typography>
      ),
    },
    // ✅ NEW: Commission %
    {
      field: "commissionPercentage",
      headerName: "Comm %",
      flex: 0.5,
      minWidth: 90,
      renderCell: (params) => {
        const pct = safeNumber(params.row.commissionPercentage);
        return (
          <Chip
            label={`${pct}%`}
            size="small"
            sx={{
              bgcolor: pct > 0 ? T.amberSoft : "#f1f5f9",
              color: pct > 0 ? "#b45309" : T.textMuted,
              fontWeight: 700,
              fontSize: "0.65rem",
              height: 22,
              borderRadius: 999,
            }}
          />
        );
      },
    },
    // ✅ NEW: Commission amount
    {
      field: "commissionAmount",
      headerName: "Comm ₹",
      flex: 0.7,
      minWidth: 110,
      renderCell: (params) => {
        const amt = safeNumber(params.row.commissionAmount);
        return (
          <Typography
            sx={{
              fontWeight: 700,
              color: amt > 0 ? "#b45309" : T.textFaint,
              fontFamily: "monospace",
              fontSize: "0.8rem",
            }}
          >
            {formatMoney(amt)}
          </Typography>
        );
      },
    },
    // ✅ NEW: Net amount (highlighted — this is what user gets)
    {
      field: "netAmount",
      headerName: "Net",
      flex: 0.8,
      minWidth: 120,
      renderCell: (params) => {
        const net = safeNumber(params.row.netAmount);
        const gross = safeNumber(params.row.amount);
        // Fallback: if net is 0 but amount exists, use gross
        const display = net > 0 ? net : gross;
        return (
          <Typography
            sx={{
              fontWeight: 800,
              color: "#047857",
              fontFamily: "monospace",
              fontSize: "0.85rem",
            }}
          >
            {formatMoney(display)}
          </Typography>
        );
      },
    },
    {
      field: "bankName",
      headerName: "Bank",
      flex: 0.8,
      minWidth: 120,
      renderCell: (params) => (
        <Typography sx={{ fontSize: "0.78rem", color: T.textMuted }} noWrap>
          {params.row.bankName || "—"}
        </Typography>
      ),
    },
    {
      field: "status",
      headerName: "Status",
      flex: 0.7,
      minWidth: 110,
      renderCell: (params) => {
        const style =
          STATUS_STYLES[params.row.status] || STATUS_STYLES.PENDING;
        return (
          <Chip
            label={style.label}
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
      field: "createdAt",
      headerName: "Requested",
      flex: 0.9,
      minWidth: 130,
      renderCell: (params) => (
        <Typography sx={{ fontSize: "0.72rem", color: T.textMuted }}>
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
      flex: 1.2,
      minWidth: 160,
      sortable: false,
      renderCell: (params) => (
        <Stack direction="row" spacing={0.5} alignItems="center">
          <Tooltip title="View details">
            <IconButton
              size="small"
              onClick={() => setViewModal(params.row)}
              sx={{
                bgcolor: T.skySoft,
                color: T.sky,
                "&:hover": { bgcolor: "#bae6fd" },
                width: 32,
                height: 32,
              }}
            >
              <Visibility sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
          {params.row.status === "PENDING" && (
            <>
              <Tooltip title="Approve">
                <span>
                  <IconButton
                    size="small"
                    onClick={() => handleApprove(params.row.id)}
                    disabled={processing === params.row.id}
                    sx={{
                      bgcolor: T.emeraldSoft,
                      color: "#059669",
                      "&:hover": { bgcolor: "#a7f3d0" },
                      width: 32,
                      height: 32,
                    }}
                  >
                    {processing === params.row.id ? (
                      <CircularProgress size={14} sx={{ color: "#059669" }} />
                    ) : (
                      <Check sx={{ fontSize: 16 }} />
                    )}
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title="Reject">
                <span>
                  <IconButton
                    size="small"
                    onClick={() => openRejectDialog(params.row.id)}
                    disabled={processing === params.row.id}
                    sx={{
                      bgcolor: T.roseSoft,
                      color: T.rose,
                      "&:hover": { bgcolor: "#fecaca" },
                      width: 32,
                      height: 32,
                    }}
                  >
                    <Close sx={{ fontSize: 16 }} />
                  </IconButton>
                </span>
              </Tooltip>
            </>
          )}
        </Stack>
      ),
    },
  ];

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1440, mx: "auto" }}>
      <Box sx={{ mb: 3 }}>
        <PanelHeader eyebrow="Wallet" title="Withdrawal Requests" />
      </Box>

      {/* Filters */}
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
            size="small"
            placeholder="Search by user, bank, account..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
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
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              label="Status"
              sx={{ borderRadius: 2, bgcolor: T.surfaceSoft }}
            >
              <MenuItem value="ALL">All Status</MenuItem>
              <MenuItem value="PENDING">Pending</MenuItem>
              <MenuItem value="APPROVED">Approved</MenuItem>
              <MenuItem value="REJECTED">Rejected</MenuItem>
            </Select>
          </FormControl>
          <Tooltip title="Refresh">
            <IconButton
              onClick={fetchRequests}
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
        </Stack>
      </Paper>

      {/* Table */}
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
            rows={filteredRequests}
            columns={columns}
            pageSize={10}
            rowsPerPageOptions={[10, 25, 50]}
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

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* VIEW DETAILS MODAL — with commission breakdown             */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <Dialog
        open={!!viewModal}
        onClose={() => setViewModal(null)}
        maxWidth="sm"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: T.radius } } }}
      >
        <DialogTitle
          sx={{
            fontWeight: 700,
            fontSize: "1.05rem",
            color: T.textPrimary,
            borderBottom: `1px solid ${T.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1,
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1}>
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: 1.5,
                bgcolor: T.indigoSoft,
                color: T.indigo,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <AccountBalance sx={{ fontSize: 18 }} />
            </Box>
            Withdrawal Details
          </Stack>
          {viewModal?.status && (
            <Chip
              label={STATUS_STYLES[viewModal.status]?.label || viewModal.status}
              size="small"
              sx={{
                bgcolor: STATUS_STYLES[viewModal.status]?.bg || T.surfaceSoft,
                color: STATUS_STYLES[viewModal.status]?.color || T.textMuted,
                fontWeight: 700,
                fontSize: "0.65rem",
                height: 22,
                borderRadius: 999,
              }}
            />
          )}
        </DialogTitle>

        <DialogContent dividers sx={{ p: 3, borderColor: T.border }}>
          {viewModal && (
            <Stack spacing={2.5}>
              {/* ═══ USER ═══ */}
              <Box>
                <SectionHeader
                  icon={<Person sx={{ fontSize: 16 }} />}
                  title="User"
                />
                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <Avatar
                    sx={{
                      width: 44,
                      height: 44,
                      background: `linear-gradient(135deg, ${T.indigo}, ${T.violet})`,
                      fontWeight: 700,
                      fontSize: 16,
                    }}
                  >
                    {(viewModal.User?.firstName || "U").charAt(0)}
                  </Avatar>
                  <Box>
                    <Typography
                      sx={{
                        fontSize: "0.88rem",
                        fontWeight: 700,
                        color: T.textPrimary,
                      }}
                    >
                      {viewModal.User?.firstName} {viewModal.User?.lastName}
                    </Typography>
                    <Typography
                      sx={{ fontSize: "0.72rem", color: T.textMuted }}
                    >
                      {viewModal.User?.email}
                    </Typography>
                    {viewModal.User?.phone && (
                      <Typography
                        sx={{ fontSize: "0.72rem", color: T.textMuted }}
                      >
                        {viewModal.User.phone}
                      </Typography>
                    )}
                  </Box>
                </Stack>
              </Box>

              <Divider sx={{ borderColor: T.border }} />

              {/* ═══ COMMISSION BREAKDOWN ═══ */}
              <Box>
                <SectionHeader
                  icon={<PercentIcon sx={{ fontSize: 16 }} />}
                  title="Amount Breakdown"
                  accent={T.emerald}
                />

                {/* Gross */}
                <Paper
                  elevation={0}
                  sx={{
                    p: 1.75,
                    borderRadius: 2,
                    bgcolor: T.surfaceSoft,
                    border: `1px solid ${T.border}`,
                    mb: 1,
                  }}
                >
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <Box>
                      <Typography
                        sx={{
                          fontSize: "0.62rem",
                          fontWeight: 700,
                          color: T.textFaint,
                          letterSpacing: "0.06em",
                          textTransform: "uppercase",
                        }}
                      >
                        Gross Amount
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: "0.7rem",
                          color: T.textMuted,
                          mt: 0.2,
                        }}
                      >
                        Requested by user
                      </Typography>
                    </Box>
                    <Typography
                      sx={{
                        fontSize: "1.15rem",
                        fontWeight: 800,
                        color: T.textPrimary,
                        fontFamily: "monospace",
                      }}
                    >
                      {formatMoney(viewModal.amount)}
                    </Typography>
                  </Stack>
                </Paper>

                {/* Commission */}
                <Paper
                  elevation={0}
                  sx={{
                    p: 1.75,
                    borderRadius: 2,
                    bgcolor: T.amberSoft,
                    border: `1px solid ${T.amber}40`,
                    mb: 1,
                  }}
                >
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <Stack
                      direction="row"
                      alignItems="center"
                      spacing={1}
                    >
                      <TrendingDown
                        sx={{ fontSize: 18, color: "#b45309" }}
                      />
                      <Box>
                        <Typography
                          sx={{
                            fontSize: "0.62rem",
                            fontWeight: 700,
                            color: "#92400e",
                            letterSpacing: "0.06em",
                            textTransform: "uppercase",
                          }}
                        >
                          Commission (
                          {safeNumber(viewModal.commissionPercentage)}%)
                        </Typography>
                        <Typography
                          sx={{
                            fontSize: "0.7rem",
                            color: "#b45309",
                            mt: 0.2,
                          }}
                        >
                          Deducted by platform
                        </Typography>
                      </Box>
                    </Stack>
                    <Typography
                      sx={{
                        fontSize: "1.15rem",
                        fontWeight: 800,
                        color: "#b45309",
                        fontFamily: "monospace",
                      }}
                    >
                      −{formatMoney(viewModal.commissionAmount)}
                    </Typography>
                  </Stack>
                </Paper>

                {/* Net — Highlighted */}
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    bgcolor: T.emeraldSoft,
                    border: `1px solid ${T.emerald}40`,
                  }}
                >
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <Box>
                      <Typography
                        sx={{
                          fontSize: "0.62rem",
                          fontWeight: 700,
                          color: "#065f46",
                          letterSpacing: "0.06em",
                          textTransform: "uppercase",
                        }}
                      >
                        Net Payout
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: "0.7rem",
                          color: "#047857",
                          mt: 0.2,
                        }}
                      >
                        User will receive this amount
                      </Typography>
                    </Box>
                    <Typography
                      sx={{
                        fontSize: "1.4rem",
                        fontWeight: 800,
                        color: "#047857",
                        fontFamily: "monospace",
                      }}
                    >
                      {formatMoney(
                        safeNumber(viewModal.netAmount) > 0
                          ? viewModal.netAmount
                          : viewModal.amount
                      )}
                    </Typography>
                  </Stack>
                </Paper>
              </Box>

              <Divider sx={{ borderColor: T.border }} />

              {/* ═══ BANK DETAILS ═══ */}
              <Box>
                <SectionHeader
                  icon={<AccountBalance sx={{ fontSize: 16 }} />}
                  title="Bank Details"
                  accent={T.sky}
                />
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                    gap: 1.5,
                  }}
                >
                  <InfoRow
                    label="Account Name"
                    value={viewModal.accountName}
                  />
                  <InfoRow
                    label="Account Number"
                    value={viewModal.accountNumber}
                  />
                  <InfoRow label="Bank Name" value={viewModal.bankName} />
                  <InfoRow label="IFSC Code" value={viewModal.ifscCode} />
                  {viewModal.upiId && (
                    <InfoRow label="UPI ID" value={viewModal.upiId} />
                  )}
                </Box>
              </Box>

              {/* ═══ ADMIN MESSAGE (if any) ═══ */}
              {viewModal.adminMessage && (
                <>
                  <Divider sx={{ borderColor: T.border }} />
                  <Box>
                    <SectionHeader
                      icon={<PercentIcon sx={{ fontSize: 16 }} />}
                      title="Admin Message"
                      accent={T.rose}
                    />
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        bgcolor: T.surfaceSoft,
                        border: `1px solid ${T.border}`,
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: "0.82rem",
                          color: T.textPrimary,
                          lineHeight: 1.5,
                        }}
                      >
                        {viewModal.adminMessage}
                      </Typography>
                    </Paper>
                  </Box>
                </>
              )}
            </Stack>
          )}
        </DialogContent>

        <DialogActions
          sx={{ p: 2, gap: 1, borderTop: `1px solid ${T.border}` }}
        >
          {viewModal?.status === "PENDING" && (
            <>
              <Button
                onClick={() => handleApprove(viewModal.id)}
                disabled={processing === viewModal.id}
                variant="contained"
                startIcon={
                  processing === viewModal.id ? (
                    <CircularProgress size={14} sx={{ color: "#fff" }} />
                  ) : (
                    <Check sx={{ fontSize: 16 }} />
                  )
                }
                sx={{
                  textTransform: "none",
                  fontWeight: 700,
                  borderRadius: 2,
                  bgcolor: T.emerald,
                  boxShadow: "none",
                  "&:hover": { bgcolor: "#059669" },
                }}
              >
                Approve
              </Button>
              <Button
                onClick={() => openRejectDialog(viewModal.id)}
                disabled={processing === viewModal.id}
                variant="contained"
                startIcon={<Close sx={{ fontSize: 16 }} />}
                sx={{
                  textTransform: "none",
                  fontWeight: 700,
                  borderRadius: 2,
                  bgcolor: T.rose,
                  boxShadow: "none",
                  "&:hover": { bgcolor: "#e11d48" },
                }}
              >
                Reject
              </Button>
            </>
          )}
          <Button
            onClick={() => setViewModal(null)}
            sx={{ textTransform: "none", fontWeight: 600, color: T.textMuted }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* ═══════════ REJECT DIALOG ═══════════ */}
      <Dialog
        open={rejectDialog.open}
        onClose={() =>
          !processing && setRejectDialog({ open: false, id: null })
        }
        maxWidth="sm"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: T.radius, p: 0.5 } } }}
      >
        <DialogTitle
          sx={{
            fontWeight: 700,
            fontSize: "1.05rem",
            color: T.textPrimary,
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
            <Close sx={{ fontSize: 18 }} />
          </Box>
          Reject Withdrawal?
        </DialogTitle>
        <Divider sx={{ borderColor: T.border }} />
        <Box sx={{ px: 3, py: 2.5 }}>
          <Typography
            sx={{ fontSize: "0.82rem", color: T.textMuted, mb: 2 }}
          >
            Please provide a reason for rejection. The full amount (including
            commission) will be refunded to the user's wallet.
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            placeholder="e.g. Bank details incorrect, please verify"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
                bgcolor: T.surfaceSoft,
                "& fieldset": { borderColor: T.border },
                "&:hover fieldset": { borderColor: "#fecaca" },
                "&.Mui-focused fieldset": {
                  borderColor: T.rose,
                  borderWidth: 1.5,
                },
              },
            }}
          />
        </Box>
        <DialogActions sx={{ p: 2, pt: 0, gap: 1 }}>
          <Button
            onClick={() => setRejectDialog({ open: false, id: null })}
            disabled={!!processing}
            sx={{
              textTransform: "none",
              fontWeight: 600,
              color: T.textMuted,
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleReject}
            disabled={!!processing}
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
              "Reject"
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default WithdrawalRequests;