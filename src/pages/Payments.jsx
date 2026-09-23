// src/pages/Payments.jsx
import { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  DataGrid,
  GridToolbarContainer,
  GridToolbarExport,
} from "@mui/x-data-grid";
import {
  Typography,
  Paper,
  Box,
  TextField,
  InputAdornment,
  Stack,
  Chip,
  useMediaQuery,
  useTheme,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  IconButton,
  Button,
  Collapse,
} from "@mui/material";
import {
  Search,
  Payment,
  TrendingUp,
  ReceiptLong,
  Refresh,
  CheckCircle,
  Schedule,
  Inbox,
  FilterList,
  Close,
} from "@mui/icons-material";
import { fetchPayments } from "../redux/slices/paymentSlice";
import Loader from "../components/Loader";
import PanelHeader from "../components/PanelHeader";
import ErrorAlert from "../components/ErrorAlert";
import ExportButtons from "../components/ExportButtons";

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
  skySoft: "#e0f2fe",
  radius: 3,
  fontDisplay: '"Inter", system-ui, -apple-system, sans-serif',
};

const safeNumber = (val) => {
  if (val === null || val === undefined) return 0;
  if (typeof val === "number") return isNaN(val) ? 0 : val;
  const num = parseFloat(val);
  return isNaN(num) ? 0 : num;
};

const formatCurrency = (val) => {
  const num = safeNumber(val);
  return `₹${num.toFixed(2)}`;
};

const TXN_TYPE_STYLES = {
  CREDIT: { bg: "#D1FAE5", color: "#047857", label: "Credit" },
  DEBIT: { bg: "#FEE2E2", color: "#BE123C", label: "Debit" },
  REFUND: { bg: "#EDE9FE", color: "#6D28D9", label: "Refund" },
  COMMISSION: { bg: "#FEF3C7", color: "#B45309", label: "Commission" },
  BONUS: { bg: "#DBEAFE", color: "#1D4ED8", label: "Bonus" },
  WITHDRAWAL: { bg: "#FCE7F3", color: "#BE185D", label: "Withdrawal" },
};

const CustomToolbar = () => (
  <GridToolbarContainer sx={{ p: 1 }}>
    <GridToolbarExport />
  </GridToolbarContainer>
);

// ═══════════════════════════════════════════════════════════════
// SUMMARY STAT CARD
// ═══════════════════════════════════════════════════════════════
const SummaryCard = ({ title, value, icon: Icon, accent }) => (
  <Paper
    elevation={0}
    sx={{
      p: 2.5,
      borderRadius: T.radius,
      border: `1px solid ${T.border}`,
      bgcolor: T.surface,
      transition: "all 0.2s ease",
      "&:hover": {
        borderColor: T.borderStrong,
        transform: "translateY(-2px)",
        boxShadow: "0 12px 24px -16px rgba(15,23,42,0.15)",
      },
    }}
  >
    <Stack direction="row" alignItems="center" spacing={1.5}>
      <Box
        sx={{
          width: 44,
          height: 44,
          borderRadius: 2,
          bgcolor: `${accent}12`,
          color: accent,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon sx={{ fontSize: 20 }} />
      </Box>
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography
          sx={{
            fontSize: "0.7rem",
            fontWeight: 700,
            color: T.textFaint,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            mb: 0.25,
          }}
        >
          {title}
        </Typography>
        <Typography
          sx={{
            fontSize: "1.35rem",
            fontWeight: 800,
            color: T.textPrimary,
            letterSpacing: "-0.02em",
            fontFamily: T.fontDisplay,
            lineHeight: 1.1,
          }}
        >
          {value}
        </Typography>
      </Box>
    </Stack>
  </Paper>
);

// ═══════════════════════════════════════════════════════════════
// PAYMENTS
// ═══════════════════════════════════════════════════════════════
const Payments = () => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const { items, loading, error } = useSelector((s) => s.payments);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("");
  // ✅ NEW: Advanced filters
  const [filterStatus, setFilterStatus] = useState("");
  const [filterUserId, setFilterUserId] = useState("");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);

  const paymentsList = Array.isArray(items) ? items : [];

  const fetchList = () => dispatch(fetchPayments());

  useEffect(() => {
    fetchList();
  }, [dispatch]);

  // ═══════════════════════════════════════════════════════════════
  // Safe numeric aggregation
  // ═══════════════════════════════════════════════════════════════
  const { totalVolume, creditCount, debitCount, refundCount } = useMemo(() => {
    let volume = 0;
    let credits = 0;
    let debits = 0;
    let refunds = 0;

    paymentsList.forEach((p) => {
      const amt = safeNumber(p.amount);
      const type = String(p.transactionType || "").toUpperCase();

      if (type === "CREDIT" || type === "BONUS") {
        volume += amt;
        credits++;
      } else if (type === "DEBIT") {
        debits++;
      } else if (type === "REFUND") {
        refunds++;
      } else {
        volume += amt;
      }
    });

    return {
      totalVolume: volume,
      creditCount: credits,
      debitCount: debits,
      refundCount: refunds,
    };
  }, [paymentsList]);

  // ═══════════════════════════════════════════════════════════════
  // ✅ ENHANCED FILTERS
  // ═══════════════════════════════════════════════════════════════
  const filtered = useMemo(() => {
    return paymentsList.filter((p) => {
      // Search filter
      const matchesSearch =
        !searchTerm ||
        p.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.bookingId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.referenceId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchTerm.toLowerCase());

      // Type filter
      const matchesType = !filterType || p.transactionType === filterType;

      // Status filter (based on transaction type grouping)
      let matchesStatus = true;
      if (filterStatus === "credit") {
        matchesStatus = ["CREDIT", "BONUS"].includes(
          String(p.transactionType || "").toUpperCase()
        );
      } else if (filterStatus === "debit") {
        matchesStatus = String(p.transactionType || "").toUpperCase() === "DEBIT";
      } else if (filterStatus === "refund") {
        matchesStatus =
          String(p.transactionType || "").toUpperCase() === "REFUND";
      }

      // User ID filter
      const matchesUserId =
        !filterUserId ||
        p.userId?.toLowerCase().includes(filterUserId.toLowerCase()) ||
        p.walletId?.toLowerCase().includes(filterUserId.toLowerCase());

      // Amount range
      const amount = safeNumber(p.amount);
      const matchesMin = !minAmount || amount >= safeNumber(minAmount);
      const matchesMax = !maxAmount || amount <= safeNumber(maxAmount);

      return (
        matchesSearch &&
        matchesType &&
        matchesStatus &&
        matchesUserId &&
        matchesMin &&
        matchesMax
      );
    });
  }, [
    paymentsList,
    searchTerm,
    filterType,
    filterStatus,
    filterUserId,
    minAmount,
    maxAmount,
  ]);

  const clearFilters = () => {
    setSearchTerm("");
    setFilterType("");
    setFilterStatus("");
    setFilterUserId("");
    setMinAmount("");
    setMaxAmount("");
  };

  const activeFilterCount = [
    filterType,
    filterStatus,
    filterUserId,
    minAmount,
    maxAmount,
  ].filter(Boolean).length;

  const exportHeaders = [
    { key: "id", label: "Txn ID" },
    { key: "transactionType", label: "Type" },
    { key: "referenceId", label: "Reference" },
    { key: "amount", label: "Amount" },
    { key: "balanceAfter", label: "Balance After" },
    { key: "description", label: "Description" },
    { key: "createdAt", label: "Date" },
  ];

  const columns = [
    {
      field: "id",
      headerName: "Txn ID",
      flex: 0.9,
      minWidth: 140,
      renderCell: (p) => (
        <Typography
          sx={{
            fontSize: "0.72rem",
            fontWeight: 700,
            color: T.textPrimary,
            fontFamily: "monospace",
          }}
          noWrap
        >
          {p.row.id?.slice(0, 12) || "—"}
        </Typography>
      ),
    },
    {
      field: "transactionType",
      headerName: "Type",
      flex: 0.7,
      minWidth: 110,
      renderCell: (p) => {
        const style =
          TXN_TYPE_STYLES[p.row.transactionType] || TXN_TYPE_STYLES.CREDIT;
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
      field: "referenceId",
      headerName: "Reference",
      flex: 1,
      minWidth: 140,
      renderCell: (p) => (
        <Typography
          sx={{
            fontSize: "0.72rem",
            color: T.textMuted,
            fontFamily: "monospace",
          }}
          noWrap
        >
          {p.row.referenceId?.slice(0, 16) || "—"}
        </Typography>
      ),
    },
    {
      field: "amount",
      headerName: "Amount",
      flex: 0.6,
      minWidth: 100,
      renderCell: (p) => {
        const amt = safeNumber(p.row.amount);
        const type = String(p.row.transactionType || "").toUpperCase();
        const isCredit =
          type === "CREDIT" || type === "REFUND" || type === "BONUS";
        return (
          <Typography
            sx={{
              fontSize: "0.82rem",
              fontWeight: 700,
              color: isCredit ? "#047857" : "#be123c",
            }}
          >
            {isCredit ? "+" : "-"}
            {formatCurrency(amt)}
          </Typography>
        );
      },
    },
    {
      field: "balanceAfter",
      headerName: "Balance",
      flex: 0.6,
      minWidth: 100,
      renderCell: (p) => (
        <Typography sx={{ fontSize: "0.78rem", color: T.textMuted }}>
          {formatCurrency(p.row.balanceAfter)}
        </Typography>
      ),
    },
    {
      field: "description",
      headerName: "Description",
      flex: 1.5,
      minWidth: 200,
      renderCell: (p) => (
        <Typography
          sx={{
            fontSize: "0.75rem",
            color: T.textMuted,
            lineHeight: 1.4,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {p.row.description || "—"}
        </Typography>
      ),
    },
    {
      field: "createdAt",
      headerName: "Date",
      flex: 0.8,
      minWidth: 130,
      renderCell: (p) => (
        <Typography sx={{ fontSize: "0.72rem", color: T.textMuted }}>
          {new Date(p.row.createdAt).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}
          {" · "}
          {new Date(p.row.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Typography>
      ),
    },
  ];

  if (loading && paymentsList.length === 0) return <Loader />;
  if (error) return <ErrorAlert error={error} />;

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1440, mx: "auto" }}>
      <Box sx={{ mb: 3 }}>
        <PanelHeader eyebrow="Financials" title="Payments Management" />
      </Box>

      {/* Summary Cards */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" },
          gap: 2.5,
          mb: 2.5,
        }}
      >
        <SummaryCard
          title="Total Volume"
          value={formatCurrency(totalVolume)}
          icon={TrendingUp}
          accent={T.emerald}
        />
        <SummaryCard
          title="Credits"
          value={creditCount}
          icon={CheckCircle}
          accent={T.emerald}
        />
        <SummaryCard
          title="Debits"
          value={debitCount}
          icon={ReceiptLong}
          accent={T.rose}
        />
        <SummaryCard
          title="Refunds"
          value={refundCount}
          icon={Schedule}
          accent={T.amber}
        />
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
        {/* Primary filters row */}
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          alignItems="center"
        >
          <TextField
            fullWidth
            size="small"
            placeholder="Search by ID, reference, description..."
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
            <InputLabel>Type</InputLabel>
            <Select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              label="Type"
              sx={{ borderRadius: 2, bgcolor: T.surfaceSoft }}
            >
              <MenuItem value="">All Types</MenuItem>
              <MenuItem value="CREDIT">Credit</MenuItem>
              <MenuItem value="DEBIT">Debit</MenuItem>
              <MenuItem value="REFUND">Refund</MenuItem>
              <MenuItem value="COMMISSION">Commission</MenuItem>
              <MenuItem value="BONUS">Bonus</MenuItem>
              <MenuItem value="WITHDRAWAL">Withdrawal</MenuItem>
            </Select>
          </FormControl>

          {/* ✅ NEW: Status quick filter */}
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              label="Status"
              sx={{ borderRadius: 2, bgcolor: T.surfaceSoft }}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="credit">Credit Only</MenuItem>
              <MenuItem value="debit">Debit Only</MenuItem>
              <MenuItem value="refund">Refund Only</MenuItem>
            </Select>
          </FormControl>

          {/* ✅ NEW: Advanced filters toggle */}
          <Button
            variant={showAdvanced ? "contained" : "outlined"}
            startIcon={
              showAdvanced ? <Close sx={{ fontSize: 16 }} /> : <FilterList sx={{ fontSize: 16 }} />
            }
            onClick={() => setShowAdvanced(!showAdvanced)}
            sx={{
              textTransform: "none",
              fontWeight: 700,
              fontSize: "0.78rem",
              borderRadius: 2,
              whiteSpace: "nowrap",
              bgcolor: showAdvanced ? T.indigo : "transparent",
              borderColor: T.border,
              color: showAdvanced ? "#fff" : T.textMuted,
              "&:hover": {
                bgcolor: showAdvanced ? "#4f46e5" : T.surfaceSoft,
                borderColor: T.indigo,
                color: showAdvanced ? "#fff" : T.indigo,
              },
            }}
          >
            Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
          </Button>

          <Tooltip title="Refresh">
            <IconButton
              onClick={fetchList}
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
            data={filtered}
            headers={exportHeaders}
            filename="payments"
          />
        </Stack>

        {/* ✅ NEW: Advanced filters (collapsible) */}
        <Collapse in={showAdvanced} timeout={300}>
          <Box
            sx={{
              mt: 2,
              pt: 2,
              borderTop: `1px dashed ${T.border}`,
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "repeat(4, 1fr)" },
              gap: 2,
            }}
          >
            <TextField
              size="small"
              label="User ID / Wallet ID"
              placeholder="Paste ID..."
              value={filterUserId}
              onChange={(e) => setFilterUserId(e.target.value)}
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
            <TextField
              size="small"
              label="Min Amount (₹)"
              type="number"
              value={minAmount}
              onChange={(e) => setMinAmount(e.target.value)}
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
            <TextField
              size="small"
              label="Max Amount (₹)"
              type="number"
              value={maxAmount}
              onChange={(e) => setMaxAmount(e.target.value)}
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
            <Button
              variant="outlined"
              onClick={clearFilters}
              disabled={activeFilterCount === 0}
              sx={{
                textTransform: "none",
                fontWeight: 700,
                fontSize: "0.78rem",
                borderRadius: 2,
                borderColor: T.rose,
                color: T.rose,
                "&:hover": {
                  bgcolor: T.roseSoft,
                  borderColor: T.rose,
                },
                "&.Mui-disabled": {
                  borderColor: T.border,
                  color: T.textFaint,
                },
              }}
            >
              Clear All Filters
            </Button>
          </Box>
        </Collapse>
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
        <DataGrid
          rows={filtered}
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
      </Paper>
    </Box>
  );
};

export default Payments;