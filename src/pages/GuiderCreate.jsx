// src/pages/GuiderCreate.jsx
// ═══════════════════════════════════════════════════════════════
// CREATE GUIDER — with ImageInput for profile photo
// ═══════════════════════════════════════════════════════════════
import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { toast } from "react-toastify";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Stack,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  CircularProgress,
  InputAdornment,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  Person as PersonIcon,
} from "@mui/icons-material";
import { createGuider } from "../redux/slices/guiderSlice";
import { fetchUsers } from "../redux/slices/userSlice";
import { fetchPlaces } from "../redux/slices/placeSlice";
import { ImageInput, PanelHeader } from "../components";

// ═══════════════════════════════════════════════════════════════
// DESIGN TOKENS
// ═══════════════════════════════════════════════════════════════
const T = {
  border: "#eef1f6",
  borderStrong: "#e2e8f0",
  surface: "#ffffff",
  surfaceSoft: "#fafbfc",
  textPrimary: "#0b1220",
  textMuted: "#64748b",
  textFaint: "#94a3b8",
  indigo: "#6366f1",
  rose: "#f43f5e",
  radius: 3,
  fontDisplay: '"Inter", system-ui, -apple-system, sans-serif',
};

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: 2,
    bgcolor: T.surfaceSoft,
    "& fieldset": { borderColor: T.border },
    "&:hover fieldset": { borderColor: "#c7d2fe" },
    "&.Mui-focused fieldset": { borderColor: T.indigo, borderWidth: 1.5 },
  },
  "& .MuiInputLabel-root.Mui-focused": { color: T.indigo },
};

const GuiderCreate = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const { items: users = [], loading: usersLoading } = useSelector(
    (s) => s.users
  );
  const { items: places = [], loading: placesLoading } = useSelector(
    (s) => s.places
  );

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      userId: "",
      placeIds: [],
      experience: 0,
      languages: "",
      bio: "",
      fullName: "",
      companyName: "",
      location: "",
      profilePhotoUrl: "",
    },
  });

  const profilePhotoUrl = watch("profilePhotoUrl");

  useEffect(() => {
    dispatch(fetchUsers({ role: "USER", limit: 200 }));
    dispatch(fetchPlaces({ limit: 200 }));
  }, [dispatch]);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const payload = {
        userId: data.userId,
        fullName: data.fullName,
        companyName: data.companyName || null,
        location: data.location || null,
        experience: parseInt(data.experience) || 0,
        languages: data.languages
          ? data.languages.split(",").map((l) => l.trim()).filter(Boolean)
          : [],
        bio: data.bio || "",
        placeIds: Array.isArray(data.placeIds) ? data.placeIds : [],
        profilePhotoUrl: data.profilePhotoUrl || null,
        isActive: true,
      };

      const result = await dispatch(createGuider(payload));
      if (createGuider.fulfilled.match(result)) {
        toast.success("Guider created successfully!");
        navigate("/guiders");
      } else {
        toast.error(result.payload || "Failed to create guider");
      }
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 900, mx: "auto" }}>
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
        <Button
          onClick={() => navigate("/guiders")}
          sx={{
            minWidth: 40,
            width: 40,
            height: 40,
            borderRadius: 2,
            border: `1px solid ${T.border}`,
            bgcolor: T.surface,
            color: T.textMuted,
            p: 0,
            "&:hover": {
              bgcolor: T.surfaceSoft,
              borderColor: T.borderStrong,
            },
          }}
        >
          <ArrowBackIcon sx={{ fontSize: 18 }} />
        </Button>
        <PanelHeader eyebrow="Guiders" title="Add New Guider" />
      </Stack>

      <Paper
        component="form"
        onSubmit={handleSubmit(onSubmit)}
        elevation={0}
        sx={{
          p: 3,
          borderRadius: T.radius,
          border: `1px solid ${T.border}`,
          bgcolor: T.surface,
        }}
      >
        <Stack spacing={2.5}>
          {/* User Select */}
          <Controller
            name="userId"
            control={control}
            rules={{ required: "User is required" }}
            render={({ field }) => (
              <FormControl fullWidth error={!!errors.userId} sx={fieldSx}>
                <InputLabel>Select User *</InputLabel>
                <Select
                  {...field}
                  label="Select User *"
                  disabled={usersLoading}
                  startAdornment={
                    <InputAdornment position="start" sx={{ ml: 0.5 }}>
                      <PersonIcon sx={{ fontSize: 18, color: T.textFaint }} />
                    </InputAdornment>
                  }
                >
                  {users.map((u) => (
                    <MenuItem key={u.id} value={u.id}>
                      {`${u.firstName || ""} ${u.lastName || ""}`.trim() ||
                        u.email}{" "}
                      ({u.email})
                    </MenuItem>
                  ))}
                </Select>
                {errors.userId && (
                  <Typography
                    sx={{ fontSize: "0.7rem", color: T.rose, mt: 0.5, ml: 1.5 }}
                  >
                    {errors.userId.message}
                  </Typography>
                )}
              </FormControl>
            )}
          />

          {/* Profile Photo — dual mode */}
          <ImageInput
            label="Profile Photo"
            value={profilePhotoUrl}
            onChange={(url) =>
              setValue("profilePhotoUrl", url, { shouldValidate: false })
            }
            folder="local-guider/guiders"
            aspect="square"
            helperText="Recommended: 400x400px, JPG/PNG, under 10MB"
          />

          {/* Full Name */}
          <Controller
            name="fullName"
            control={control}
            rules={{ required: "Full name is required" }}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label="Full Name *"
                placeholder="e.g. Rahul Sharma"
                error={!!errors.fullName}
                helperText={errors.fullName?.message}
                sx={fieldSx}
              />
            )}
          />

          {/* Company + Location */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
              gap: 2,
            }}
          >
            <Controller
              name="companyName"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Company Name"
                  placeholder="Optional"
                  sx={fieldSx}
                />
              )}
            />
            <Controller
              name="location"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Location"
                  placeholder="City / area"
                  sx={fieldSx}
                />
              )}
            />
          </Box>

          {/* Experience + Languages */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
              gap: 2,
            }}
          >
            <Controller
              name="experience"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  type="number"
                  label="Experience (years)"
                  placeholder="e.g. 5"
                  sx={fieldSx}
                />
              )}
            />
            <Controller
              name="languages"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Languages"
                  placeholder="Comma-separated: English, Hindi"
                  sx={fieldSx}
                />
              )}
            />
          </Box>

          {/* Place Select */}
          <Controller
            name="placeIds"
            control={control}
            render={({ field }) => (
              <FormControl fullWidth sx={fieldSx}>
                <InputLabel>Places Covered (max 3)</InputLabel>
                <Select
                  {...field}
                  multiple
                  label="Places Covered (max 3)"
                  disabled={placesLoading}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value.length <= 3) field.onChange(value);
                    else toast.warning("Maximum 3 places allowed");
                  }}
                  renderValue={(selected) =>
                    selected
                      .map((id) => places.find((p) => p.id === id)?.name || id)
                      .join(", ")
                  }
                >
                  {places.map((p) => (
                    <MenuItem key={p.id} value={p.id}>
                      {p.name} {p.city ? `(${p.city})` : ""}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          />

          {/* Bio */}
          <Controller
            name="bio"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                multiline
                rows={3}
                label="Bio / About"
                placeholder="Brief description about the guider..."
                sx={fieldSx}
              />
            )}
          />

          {/* Actions */}
          <Stack
            direction="row"
            justifyContent="flex-end"
            spacing={1.5}
            sx={{ mt: 3, pt: 2.5, borderTop: `1px solid ${T.border}` }}
          >
            <Button
              type="button"
              onClick={() => navigate("/guiders")}
              sx={{
                textTransform: "none",
                fontWeight: 600,
                fontSize: "0.82rem",
                color: T.textMuted,
                px: 2,
                py: 1,
                borderRadius: 2,
                border: `1px solid ${T.border}`,
                bgcolor: T.surface,
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              startIcon={
                loading ? (
                  <CircularProgress size={14} sx={{ color: "#fff" }} />
                ) : (
                  <SaveIcon sx={{ fontSize: 16 }} />
                )
              }
              sx={{
                textTransform: "none",
                fontWeight: 700,
                fontSize: "0.82rem",
                bgcolor: T.indigo,
                color: "#fff",
                px: 3,
                py: 1,
                borderRadius: 2,
                boxShadow: "none",
                "&:hover": { bgcolor: "#4f46e5" },
                "&.Mui-disabled": {
                  bgcolor: T.indigo,
                  opacity: 0.6,
                  color: "#fff",
                },
              }}
            >
              {loading ? "Creating..." : "Create Guider"}
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </Box>
  );
};

export default GuiderCreate;