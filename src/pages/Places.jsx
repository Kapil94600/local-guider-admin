// src/pages/Places.jsx
// ═══════════════════════════════════════════════════════════════
// PLACES MANAGEMENT — with ImageInput + MultiImageInput
// ═══════════════════════════════════════════════════════════════
import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  IconButton,
  Chip,
  Switch,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  InputAdornment,
  Stack,
  Tooltip,
  Divider,
} from "@mui/material";
import {
  Search,
  Add,
  Edit,
  Delete,
  Visibility,
  Star,
  LocationOn,
  Place as PlaceIcon,
  PhotoLibrary,
  Refresh,
} from "@mui/icons-material";
import {
  DataGrid,
  GridToolbarContainer,
  GridToolbarFilterButton,
  GridToolbarExport,
} from "@mui/x-data-grid";
import {
  fetchPlaces,
  createPlace,
  updatePlace,
  deletePlace,
  setPage,
  setLimit,
} from "../redux/slices/placeSlice";
import {
  ImageInput,
  MultiImageInput,
  PanelHeader,
  Loader,
} from "../components";
import { replacePlaceGallery } from "../api/admin";
import {
  getImageUrlGeneric,
  getFallbackPlaceholder,
} from "../utils/imageFallback";

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
};

const CATEGORY_STYLES = {
  historical: { bg: "#fef3c7", color: "#b45309" },
  nature: { bg: "#d1fae5", color: "#047857" },
  beach: { bg: "#e0f2fe", color: "#0369a1" },
  adventure: { bg: "#fee2e2", color: "#be123c" },
  religious: { bg: "#ede9fe", color: "#6d28d9" },
  cultural: { bg: "#fce7f3", color: "#be185d" },
  other: { bg: "#f1f5f9", color: "#475569" },
};

const CustomToolbar = () => (
  <GridToolbarContainer sx={{ p: 1 }}>
    <GridToolbarFilterButton />
    <GridToolbarExport />
  </GridToolbarContainer>
);

const CategorySelect = ({ value, onChange, size = "small" }) => (
  <FormControl fullWidth size={size}>
    <Select
      value={value || ""}
      onChange={onChange}
      displayEmpty
      renderValue={(selected) => {
        if (selected === "" || selected === null)
          return <span style={{ color: T.textFaint }}>Select Category</span>;
        return selected.charAt(0).toUpperCase() + selected.slice(1);
      }}
      sx={{
        borderRadius: 2,
        bgcolor: T.surfaceSoft,
        "& .MuiSelect-select": { py: 1.25 },
      }}
    >
      <MenuItem value="">All</MenuItem>
      <MenuItem value="historical">Historical</MenuItem>
      <MenuItem value="nature">Nature</MenuItem>
      <MenuItem value="beach">Beach</MenuItem>
      <MenuItem value="adventure">Adventure</MenuItem>
      <MenuItem value="religious">Religious</MenuItem>
      <MenuItem value="cultural">Cultural</MenuItem>
      <MenuItem value="other">Other</MenuItem>
    </Select>
  </FormControl>
);

// ═══════════════════════════════════════════════════════════════
// PLACE MODAL — with ImageInput + MultiImageInput
// ═══════════════════════════════════════════════════════════════
const PlaceModal = ({ open, onClose, place, onSave, saving }) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    address: "",
    city: "",
    state: "",
    country: "",
    latitude: "",
    longitude: "",
    image: "",
    gallery: [],
    openingTime: "",
    closingTime: "",
    isFeatured: false,
    isActive: true,
  });

  useEffect(() => {
    if (place) {
      setFormData({
        name: place.name || "",
        description: place.description || "",
        category: place.category || "",
        address: place.address || "",
        city: place.city || "",
        state: place.state || "",
        country: place.country || "",
        latitude: place.latitude || "",
        longitude: place.longitude || "",
        image: place.image || "",
        gallery: Array.isArray(place.gallery) ? place.gallery : [],
        openingTime: place.openingTime || "",
        closingTime: place.closingTime || "",
        isFeatured: place.isFeatured || false,
        isActive: place.isActive ?? true,
      });
    } else {
      setFormData({
        name: "",
        description: "",
        category: "",
        address: "",
        city: "",
        state: "",
        country: "",
        latitude: "",
        longitude: "",
        image: "",
        gallery: [],
        openingTime: "",
        closingTime: "",
        isFeatured: false,
        isActive: true,
      });
    }
  }, [place, open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    if (!formData.name.trim() || !formData.city.trim()) {
      toast.error("Name and City are required");
      return;
    }
    onSave(formData);
  };

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

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      slotProps={{ paper: { sx: { borderRadius: T.radius } } }}
    >
      <DialogTitle
        sx={{
          fontFamily: '"Inter", system-ui, sans-serif',
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
          <PlaceIcon sx={{ fontSize: 18 }} />
        </Box>
        {place ? "Edit Place" : "Add New Place"}
      </DialogTitle>

      <DialogContent
        dividers
        sx={{
          p: 3,
          borderColor: T.border,
          maxHeight: "70vh",
          overflowY: "auto",
        }}
      >
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
            gap: 2.5,
          }}
        >
          <TextField
            fullWidth
            label="Place Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            sx={inputSx}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <PlaceIcon sx={{ fontSize: 18, color: T.textFaint }} />
                  </InputAdornment>
                ),
              },
            }}
          />
          <CategorySelect
            value={formData.category}
            onChange={(e) =>
              handleChange({
                target: { name: "category", value: e.target.value },
              })
            }
          />
          <Box sx={{ gridColumn: { md: "span 2" } }}>
            <TextField
              fullWidth
              label="Description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              multiline
              rows={3}
              sx={inputSx}
            />
          </Box>
          <Box sx={{ gridColumn: { md: "span 2" } }}>
            <TextField
              fullWidth
              label="Address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              sx={inputSx}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <LocationOn sx={{ fontSize: 18, color: T.textFaint }} />
                    </InputAdornment>
                  ),
                },
              }}
            />
          </Box>
          <TextField
            fullWidth
            label="City"
            name="city"
            value={formData.city}
            onChange={handleChange}
            required
            sx={inputSx}
          />
          <TextField
            fullWidth
            label="State"
            name="state"
            value={formData.state}
            onChange={handleChange}
            sx={inputSx}
          />
          <TextField
            fullWidth
            label="Country"
            name="country"
            value={formData.country}
            onChange={handleChange}
            sx={inputSx}
          />
          <TextField
            fullWidth
            label="Latitude"
            name="latitude"
            type="number"
            value={formData.latitude}
            onChange={handleChange}
            sx={inputSx}
          />
          <TextField
            fullWidth
            label="Longitude"
            name="longitude"
            type="number"
            value={formData.longitude}
            onChange={handleChange}
            sx={inputSx}
          />
          <TextField
            fullWidth
            label="Opening Time"
            name="openingTime"
            value={formData.openingTime}
            onChange={handleChange}
            placeholder="09:00 AM"
            sx={inputSx}
          />
          <TextField
            fullWidth
            label="Closing Time"
            name="closingTime"
            value={formData.closingTime}
            onChange={handleChange}
            placeholder="06:00 PM"
            sx={inputSx}
          />

          {/* ═══════ MAIN IMAGE — dual mode ═══════ */}
          <Box sx={{ gridColumn: { md: "span 2" } }}>
            <ImageInput
              label="Main Image"
              value={formData.image}
              onChange={(url) =>
                setFormData((prev) => ({ ...prev, image: url }))
              }
              folder="local-guider/places"
              aspect="wide"
              helperText="Recommended: 1200x800px, JPG/PNG, under 10MB"
            />
          </Box>

          {/* ═══════ GALLERY — multi image ═══════ */}
          <Box sx={{ gridColumn: { md: "span 2" } }}>
            <MultiImageInput
              label="Photo Gallery"
              values={formData.gallery}
              onChange={(urls) =>
                setFormData((prev) => ({ ...prev, gallery: urls }))
              }
              maxImages={10}
              folder="local-guider/places/gallery"
              helperText="Add up to 10 photos. First image will be the cover."
            />
          </Box>

          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography
              sx={{
                fontSize: "0.82rem",
                fontWeight: 600,
                color: T.textPrimary,
              }}
            >
              Featured
            </Typography>
            <Switch
              checked={formData.isFeatured}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  isFeatured: e.target.checked,
                }))
              }
              sx={{
                "& .MuiSwitch-switchBase.Mui-checked": { color: T.amber },
                "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                  bgcolor: T.amber,
                },
              }}
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
        </Box>
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
            "Save Place"
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ═══════════════════════════════════════════════════════════════
// MAIN PLACES PAGE
// ═══════════════════════════════════════════════════════════════
const Places = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items, loading, pagination } = useSelector((state) => state.places);

  const [modalOpen, setModalOpen] = useState(false);
  const [editPlace, setEditPlace] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCity, setFilterCity] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [galleryDialog, setGalleryDialog] = useState({
    open: false,
    place: null,
  });

  const fetchList = () => {
    dispatch(
      fetchPlaces({ page: pagination.page, limit: pagination.limit })
    );
  };

  useEffect(() => {
    fetchList();
  }, [dispatch, pagination.page, pagination.limit]);

  const filteredPlaces = (items || []).filter((item) => {
    const matchesSearch =
      !searchTerm ||
      item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCity =
      !filterCity || item.city?.toLowerCase() === filterCity.toLowerCase();
    const matchesCategory =
      !filterCategory ||
      item.category?.toLowerCase() === filterCategory.toLowerCase();
    const matchesStatus =
      filterStatus === "" ||
      (filterStatus === "true"
        ? item.isActive === true
        : item.isActive === false);
    return matchesSearch && matchesCity && matchesCategory && matchesStatus;
  });

  const uniqueCities = [
    ...new Set((items || []).map((item) => item.city).filter(Boolean)),
  ];

  const handleSave = async (data) => {
    setSaving(true);
    try {
      if (editPlace) {
        await dispatch(updatePlace({ id: editPlace.id, data })).unwrap();
        toast.success("Place updated successfully");
      } else {
        await dispatch(createPlace(data)).unwrap();
        toast.success("Place created successfully");
      }
      setModalOpen(false);
      fetchList();
    } catch (error) {
      toast.error(error.message || "Operation failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    setDeleting(true);
    try {
      await dispatch(deletePlace(id)).unwrap();
      toast.success("Place deleted successfully");
      setDeleteConfirm(null);
      fetchList();
    } catch {
      toast.error("Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  const handleGallerySave = async (images) => {
    if (!galleryDialog.place) return;
    await replacePlaceGallery(galleryDialog.place.id, images);
    fetchList();
    setGalleryDialog((prev) => ({
      ...prev,
      place: { ...prev.place, gallery: images },
    }));
  };

  const columns = [
    {
      field: "image",
      headerName: "Image",
      flex: 0.5,
      minWidth: 80,
      sortable: false,
      renderCell: (params) => (
        <Box
          component="img"
          src={getImageUrlGeneric(
            params.row.image,
            params.row.name || "No Image"
          )}
          alt={params.row.name || ""}
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = getFallbackPlaceholder("No Image");
          }}
          sx={{
            width: 56,
            height: 40,
            borderRadius: 1.5,
            objectFit: "cover",
            bgcolor: T.surfaceSoft,
            border: `1px solid ${T.border}`,
          }}
        />
      ),
    },
    {
      field: "name",
      headerName: "Name",
      flex: 1.4,
      minWidth: 160,
      renderCell: (params) => (
        <Typography
          sx={{ fontSize: "0.82rem", fontWeight: 700, color: T.textPrimary }}
          noWrap
        >
          {params.row.name}
        </Typography>
      ),
    },
    {
      field: "city",
      headerName: "City",
      flex: 0.9,
      minWidth: 110,
      renderCell: (params) => (
        <Typography sx={{ fontSize: "0.78rem", color: T.textMuted }} noWrap>
          {params.row.city || "—"}
        </Typography>
      ),
    },
    {
      field: "category",
      headerName: "Category",
      flex: 0.9,
      minWidth: 120,
      renderCell: (params) => {
        const cat = (params.row.category || "").toLowerCase();
        const style = CATEGORY_STYLES[cat] || CATEGORY_STYLES.other;
        return (
          <Chip
            label={
              params.row.category
                ? params.row.category.charAt(0).toUpperCase() +
                  params.row.category.slice(1)
                : "N/A"
            }
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
      field: "rating",
      headerName: "Rating",
      flex: 0.6,
      minWidth: 90,
      renderCell: (params) => (
        <Stack direction="row" alignItems="center" spacing={0.5}>
          <Star sx={{ fontSize: 14, color: T.amber }} />
          <Typography sx={{ fontSize: "0.78rem", fontWeight: 600 }}>
            {params.row.rating || 0}
          </Typography>
        </Stack>
      ),
    },
    {
      field: "gallery",
      headerName: "Gallery",
      flex: 0.6,
      minWidth: 90,
      sortable: false,
      renderCell: (params) => {
        const count = (params.row.gallery || []).length;
        return (
          <Chip
            label={`${count} img`}
            size="small"
            onClick={() =>
              setGalleryDialog({ open: true, place: params.row })
            }
            sx={{
              bgcolor: count > 0 ? T.emeraldSoft : T.surfaceSoft,
              color: count > 0 ? "#047857" : T.textMuted,
              border: count > 0 ? "none" : `1px solid ${T.border}`,
              fontWeight: 700,
              fontSize: "0.65rem",
              height: 22,
              borderRadius: 999,
              cursor: "pointer",
            }}
          />
        );
      },
    },
    {
      field: "isActive",
      headerName: "Status",
      flex: 0.6,
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
      flex: 1.3,
      minWidth: 190,
      sortable: false,
      renderCell: (params) => (
        <Stack direction="row" spacing={0.5} alignItems="center">
          <Tooltip title="View details">
            <IconButton
              size="small"
              onClick={() => navigate(`/places/${params.row.id}`)}
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
          <Tooltip title="Gallery">
            <IconButton
              size="small"
              onClick={() =>
                setGalleryDialog({ open: true, place: params.row })
              }
              sx={{
                bgcolor: T.violetSoft,
                color: T.violet,
                "&:hover": { bgcolor: "#ddd6fe" },
                width: 32,
                height: 32,
              }}
            >
              <PhotoLibrary sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit place">
            <IconButton
              size="small"
              onClick={() => {
                setEditPlace(params.row);
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
              <Edit sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete place">
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
      ),
    },
  ];

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1440, mx: "auto" }}>
      <Box sx={{ mb: 3 }}>
        <PanelHeader eyebrow="Places" title="Places Management" />
      </Box>

      {/* ═══════ Filters ═══════ */}
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
          sx={{ flexWrap: "wrap" }}
        >
          <TextField
            placeholder="Search places..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            size="small"
            sx={{
              flex: 1,
              minWidth: 220,
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
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ fontSize: 18, color: T.textFaint }} />
                  </InputAdornment>
                ),
              },
            }}
          />

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>City</InputLabel>
            <Select
              value={filterCity}
              onChange={(e) => setFilterCity(e.target.value)}
              label="City"
              sx={{ borderRadius: 2, bgcolor: T.surfaceSoft }}
            >
              <MenuItem value="">All Cities</MenuItem>
              {uniqueCities.map((city) => (
                <MenuItem key={city} value={city}>
                  {city}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box sx={{ minWidth: 170 }}>
            <CategorySelect
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              size="small"
            />
          </Box>

          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              label="Status"
              sx={{ borderRadius: 2, bgcolor: T.surfaceSoft }}
            >
              <MenuItem value="">All Status</MenuItem>
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
            startIcon={<Add sx={{ fontSize: 16 }} />}
            onClick={() => {
              setEditPlace(null);
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
            Add Place
          </Button>
        </Stack>
      </Paper>

      {/* ═══════ Table ═══════ */}
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
            rows={filteredPlaces}
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

      {/* ═══════ Gallery Dialog ═══════ */}
      <Dialog
        open={galleryDialog.open}
        onClose={() => setGalleryDialog({ open: false, place: null })}
        maxWidth="md"
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
            gap: 1,
          }}
        >
          <PhotoLibrary sx={{ fontSize: 18, color: T.violet }} />
          Gallery — {galleryDialog.place?.name || ""}
        </DialogTitle>
        <DialogContent dividers sx={{ p: 3, borderColor: T.border }}>
          {galleryDialog.place && (
            <MultiImageInput
              label="Photo Gallery"
              values={galleryDialog.place.gallery || []}
              onChange={handleGallerySave}
              maxImages={10}
              folder="local-guider/places/gallery"
              helperText="Changes are saved automatically."
            />
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            onClick={() => setGalleryDialog({ open: false, place: null })}
            sx={{
              textTransform: "none",
              fontWeight: 600,
              color: T.textMuted,
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* ═══════ Edit/Add Modal ═══════ */}
      <PlaceModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        place={editPlace}
        onSave={handleSave}
        saving={saving}
      />

      {/* ═══════ Delete Confirm ═══════ */}
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
            <Delete sx={{ fontSize: 18 }} />
          </Box>
          Delete Place?
        </DialogTitle>
        <Divider sx={{ borderColor: T.border }} />
        <Box sx={{ px: 3, py: 2 }}>
          <Typography sx={{ fontSize: "0.85rem", color: T.textMuted }}>
            This will permanently delete the place and all associated data.
            This action cannot be undone.
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

export default Places;