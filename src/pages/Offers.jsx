// src/pages/Offers.jsx
// ═══════════════════════════════════════════════════════════════
// OFFERS MANAGEMENT — with ImageInput
// ═══════════════════════════════════════════════════════════════
import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { FaPlus, FaEdit, FaTrash } from "react-icons/fa";
import { toast } from "react-toastify";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  IconButton,
  Chip,
  Switch,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Stack,
  useMediaQuery,
  useTheme,
  Tooltip,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
} from "@mui/material";
import {
  Search,
  Refresh,
  LocalOffer as OfferIcon,
} from "@mui/icons-material";
import {
  DataGrid,
  GridToolbarContainer,
  GridToolbarFilterButton,
  GridToolbarExport,
} from "@mui/x-data-grid";
import {
  fetchOffers,
  createOffer,
  updateOffer,
  deleteOffer,
  setPage,
  setLimit,
} from "../redux/slices/offerSlice";
import { ImageInput, PanelHeader, Loader } from "../components";
import { getImageUrlGeneric } from "../utils/imageFallback";

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
  emerald: "#10b981",
  emeraldSoft: "#d1fae5",
  rose: "#f43f5e",
  roseSoft: "#ffe4e6",
  amber: "#f59e0b",
  radius: 3,
  fontDisplay: '"Inter", system-ui, -apple-system, sans-serif',
};

const CustomToolbar = () => (
  <GridToolbarContainer sx={{ p: 1 }}>
    <GridToolbarFilterButton />
    <GridToolbarExport />
  </GridToolbarContainer>
);

const inputSx = {
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
};

// ═══════════════════════════════════════════════════════════════
// OFFER MODAL
// ═══════════════════════════════════════════════════════════════
const OfferModal = ({ open, onClose, offer, onSave, saving }) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    image: "",
    discountPercentage: 0,
    startDate: "",
    endDate: "",
    isActive: true,
  });

  useEffect(() => {
    const formatDateForInput = (dateStr) => {
      if (!dateStr) return "";
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return "";
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      const hours = String(d.getHours()).padStart(2, "0");
      const minutes = String(d.getMinutes()).padStart(2, "0");
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    if (offer) {
      setFormData({
        title: offer.title || "",
        description: offer.description || "",
        image: offer.image || "",
        discountPercentage: offer.discountPercentage || 0,
        startDate: formatDateForInput(offer.startDate),
        endDate: formatDateForInput(offer.endDate),
        isActive: offer.isActive ?? true,
      });
    } else {
      setFormData({
        title: "",
        description: "",
        image: "",
        discountPercentage: 0,
        startDate: "",
        endDate: "",
        isActive: true,
      });
    }
  }, [offer, open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    if (!formData.title.trim()) {
      toast.error("Title is required");
      return;
    }
    const toISOOrNull = (value) => {
      if (!value) return null;
      const d = new Date(value);
      return isNaN(d.getTime()) ? null : d.toISOString();
    };
    onSave({
      ...formData,
      startDate: toISOOrNull(formData.startDate),
      endDate: toISOOrNull(formData.endDate),
      discountPercentage: Number(formData.discountPercentage) || 0,
    });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      slotProps={{ paper: { sx: { borderRadius: T.radius } } }}
    >
      <DialogTitle
        sx={{
          fontFamily: T.fontDisplay,
          fontWeight: 700,
          fontSize: "1.05rem",
          color: T.textPrimary,
          borderBottom: `1px solid ${T.border}`,
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
            bgcolor: T.indigoSoft,
            color: T.indigo,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <OfferIcon sx={{ fontSize: 18 }} />
        </Box>
        {offer ? "Edit Offer" : "Create New Offer"}
      </DialogTitle>
      <DialogContent dividers sx={{ p: 3, borderColor: T.border }}>
        <Stack spacing={2.5}>
          <TextField
            fullWidth
            label="Offer Title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            sx={inputSx}
          />
          <TextField
            fullWidth
            label="Description"
            multiline
            rows={2}
            name="description"
            value={formData.description}
            onChange={handleChange}
            sx={inputSx}
          />

          {/* ═══════ IMAGE — dual mode ═══════ */}
          <ImageInput
            label="Offer Image"
            value={formData.image}
            onChange={(url) =>
              setFormData((prev) => ({ ...prev, image: url }))
            }
            folder="local-guider/offers"
            aspect="wide"
            helperText="Recommended: 800x600px, JPG/PNG, under 10MB"
          />

          <TextField
            fullWidth
            type="number"
            label="Discount (%)"
            name="discountPercentage"
            value={formData.discountPercentage}
            onChange={handleChange}
            slotProps={{ htmlInput: { min: 0, max: 100 } }}
            sx={inputSx}
          />

          <Stack direction="row" spacing={2}>
            <TextField
              fullWidth
              label="Start Date"
              type="datetime-local"
              name="startDate"
              value={formData.startDate}
              onChange={handleChange}
              slotProps={{ inputLabel: { shrink: true } }}
              sx={inputSx}
            />
            <TextField
              fullWidth
              label="End Date"
              type="datetime-local"
              name="endDate"
              value={formData.endDate}
              onChange={handleChange}
              slotProps={{ inputLabel: { shrink: true } }}
              sx={inputSx}
            />
          </Stack>

          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography
              sx={{
                fontSize: "0.82rem",
                fontWeight: 600,
                color: T.textPrimary,
              }}
            >
              Active
            </Typography>
            <Switch
              checked={formData.isActive}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  isActive: e.target.checked,
                }))
              }
              sx={{
                "& .MuiSwitch-switchBase.Mui-checked": { color: T.emerald },
                "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                  bgcolor: T.emerald,
                },
              }}
            />
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions
        sx={{ p: 2, borderTop: `1px solid ${T.border}`, gap: 1 }}
      >
        <Button
          onClick={onClose}
          sx={{
            textTransform: "none",
            fontWeight: 600,
            color: T.textMuted,
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={saving}
          sx={{
            textTransform: "none",
            fontWeight: 700,
            borderRadius: 2,
            bgcolor: T.indigo,
            px: 3,
            boxShadow: "none",
            "&:hover": { bgcolor: "#4f46e5" },
          }}
        >
          {saving ? (
            <CircularProgress size={16} sx={{ color: "#fff" }} />
          ) : (
            "Save Offer"
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ═══════════════════════════════════════════════════════════════
// MAIN OFFERS PAGE
// ═══════════════════════════════════════════════════════════════
const Offers = () => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { items, loading, pagination } = useSelector((s) => s.offers);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [modalOpen, setModalOpen] = useState(false);
  const [editOffer, setEditOffer] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchList = () => {
    dispatch(
      fetchOffers({
        page: pagination.page,
        limit: pagination.limit,
        search: searchTerm || undefined,
        status: statusFilter !== "ALL" ? statusFilter : undefined,
      })
    );
  };

  useEffect(() => {
    fetchList();
  }, [dispatch, pagination.page, pagination.limit, searchTerm, statusFilter]);

  const handleSave = async (data) => {
    setSaving(true);
    try {
      if (editOffer) {
        await dispatch(updateOffer({ id: editOffer.id, data })).unwrap();
        toast.success("Offer updated");
      } else {
        await dispatch(createOffer(data)).unwrap();
        toast.success("Offer created");
      }
      setModalOpen(false);
      fetchList();
    } catch (error) {
      toast.error(error.message || "Failed to save offer");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    setDeleting(true);
    try {
      await dispatch(deleteOffer(id)).unwrap();
      toast.success("Offer deleted");
      setDeleteConfirm(null);
      fetchList();
    } catch {
      toast.error("Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    {
      field: "image",
      headerName: "Image",
      flex: 0.5,
      minWidth: 90,
      sortable: false,
      renderCell: (params) => (
        <Box
          component="img"
          src={getImageUrlGeneric(params.row.image, "Offer")}
          alt="offer"
          sx={{
            width: 56,
            height: 44,
            borderRadius: 1.5,
            objectFit: "cover",
            border: `1px solid ${T.border}`,
            bgcolor: T.surfaceSoft,
          }}
        />
      ),
    },
    {
      field: "title",
      headerName: "Title",
      flex: 1.4,
      minWidth: 160,
      renderCell: (params) => (
        <Typography
          sx={{ fontSize: "0.82rem", fontWeight: 700, color: T.textPrimary }}
          noWrap
        >
          {params.row.title}
        </Typography>
      ),
    },
    {
      field: "description",
      headerName: "Description",
      flex: 2,
      minWidth: 200,
      renderCell: (params) => (
        <Typography sx={{ fontSize: "0.78rem", color: T.textMuted }} noWrap>
          {params.row.description || "—"}
        </Typography>
      ),
    },
    {
      field: "discountPercentage",
      headerName: "Discount",
      flex: 0.5,
      minWidth: 90,
      renderCell: (params) => (
        <Chip
          label={`${params.row.discountPercentage || 0}%`}
          size="small"
          sx={{
            bgcolor: T.emeraldSoft,
            color: "#047857",
            fontWeight: 700,
            fontSize: "0.65rem",
            height: 22,
            borderRadius: 999,
          }}
        />
      ),
    },
    {
      field: "startDate",
      headerName: "Start",
      flex: 0.7,
      minWidth: 110,
      renderCell: (params) =>
        params.row.startDate ? (
          <Typography sx={{ fontSize: "0.75rem", color: T.textMuted }}>
            {new Date(params.row.startDate).toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </Typography>
        ) : (
          <Typography sx={{ fontSize: "0.75rem", color: T.textFaint }}>
            N/A
          </Typography>
        ),
    },
    {
      field: "endDate",
      headerName: "End",
      flex: 0.7,
      minWidth: 110,
      renderCell: (params) =>
        params.row.endDate ? (
          <Typography sx={{ fontSize: "0.75rem", color: T.textMuted }}>
            {new Date(params.row.endDate).toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </Typography>
        ) : (
          <Typography sx={{ fontSize: "0.75rem", color: T.textFaint }}>
            N/A
          </Typography>
        ),
    },
    {
      field: "isActive",
      headerName: "Status",
      flex: 0.5,
      minWidth: 90,
      renderCell: (params) => (
        <Chip
          label={params.row.isActive ? "Active" : "Inactive"}
          size="small"
          sx={{
            bgcolor: params.row.isActive ? T.emeraldSoft : "#f1f5f9",
            color: params.row.isActive ? "#059669" : "#64748b",
            fontWeight: 700,
            fontSize: "0.65rem",
            height: 22,
            borderRadius: 999,
          }}
        />
      ),
    },
    {
      field: "actions",
      headerName: "Actions",
      flex: 0.7,
      minWidth: 110,
      sortable: false,
      renderCell: (params) => (
        <Stack direction="row" spacing={0.5} alignItems="center">
          <Tooltip title="Edit offer">
            <IconButton
              size="small"
              onClick={() => {
                setEditOffer(params.row);
                setModalOpen(true);
              }}
              sx={{
                bgcolor: T.indigoSoft,
                color: T.indigo,
                "&:hover": { bgcolor: "#e0e7ff" },
                width: 32,
                height: 32,
              }}
            >
              <FaEdit size={13} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete offer">
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
              <FaTrash size={13} />
            </IconButton>
          </Tooltip>
        </Stack>
      ),
    },
  ];

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1440, mx: "auto" }}>
      <Box sx={{ mb: 3 }}>
        <PanelHeader eyebrow="Promotions" title="Offers Management" />
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
            size="small"
            placeholder="Search offers..."
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
          <FormControl size="small" sx={{ minWidth: 140 }}>
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
          <Button
            variant="contained"
            startIcon={<FaPlus size={12} />}
            onClick={() => {
              setEditOffer(null);
              setModalOpen(true);
            }}
            sx={{
              textTransform: "none",
              fontWeight: 700,
              fontSize: "0.78rem",
              borderRadius: 2,
              bgcolor: T.indigo,
              px: 2.5,
              py: 1,
              boxShadow: "none",
              whiteSpace: "nowrap",
              "&:hover": { bgcolor: "#4f46e5" },
            }}
          >
            Create Offer
          </Button>
        </Stack>
      </Paper>

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

      <OfferModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        offer={editOffer}
        onSave={handleSave}
        saving={saving}
      />

      <Dialog
        open={!!deleteConfirm}
        onClose={() => !deleting && setDeleteConfirm(null)}
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
            <FaTrash size={14} />
          </Box>
          Delete Offer?
        </DialogTitle>
        <Divider sx={{ borderColor: T.border }} />
        <Box sx={{ px: 3, py: 2 }}>
          <Typography sx={{ fontSize: "0.85rem", color: T.textMuted }}>
            This will permanently delete the offer. This action cannot be
            undone.
          </Typography>
        </Box>
        <DialogActions sx={{ p: 2, pt: 0, gap: 1 }}>
          <Button
            onClick={() => setDeleteConfirm(null)}
            disabled={deleting}
            sx={{
              textTransform: "none",
              fontWeight: 600,
              color: T.textMuted,
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={() => handleDelete(deleteConfirm)}
            disabled={deleting}
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
            {deleting ? (
              <CircularProgress size={16} sx={{ color: "#fff" }} />
            ) : (
              "Delete"
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Offers;