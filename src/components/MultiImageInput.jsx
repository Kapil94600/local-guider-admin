// src/components/MultiImageInput.jsx
// ═══════════════════════════════════════════════════════════════
// ✅ MULTI-IMAGE INPUT — for galleries (URL paste + Upload)
// ═══════════════════════════════════════════════════════════════
import { useState, useRef } from "react";
import {
  Box,
  Stack,
  TextField,
  Button,
  IconButton,
  Typography,
  CircularProgress,
  InputAdornment,
  LinearProgress,
  Tooltip,
} from "@mui/material";
import {
  CloudUpload as UploadIcon,
  Link as LinkIcon,
  Close as CloseIcon,
  Add as AddIcon,
} from "@mui/icons-material";
import { toast } from "react-toastify";
import apiClient from "../api/axios";

const resolvePreviewUrl = (url) => {
  if (!url) return "";
  if (url.startsWith("data:")) return url;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  const base =
    (apiClient.defaults.baseURL || "").replace(/\/api\/v1\/?$/, "") || "";
  return `${base}${url.startsWith("/") ? url : "/" + url}`;
};

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ITEM_SIZE = 100;

const MultiImageInput = ({
  label = "Gallery",
  values = [],
  onChange,
  maxImages = 10,
  folder = "local-guider/gallery",
  disabled = false,
  helperText = "",
}) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [urlInput, setUrlInput] = useState("");
  const [showUrlField, setShowUrlField] = useState(false);
  const fileInputRef = useRef(null);
  const safeValues = Array.isArray(values) ? values : [];

  const isFull = safeValues.length >= maxImages;

  const handleFilesChange = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (!files.length) return;

    const remaining = maxImages - safeValues.length;
    if (files.length > remaining) {
      toast.error(`Max ${maxImages} images. You can add ${remaining} more.`);
      return;
    }

    const invalid = files.find((f) => !f.type.startsWith("image/"));
    if (invalid) {
      toast.error("Only image files are allowed");
      return;
    }
    const tooBig = files.find((f) => f.size > MAX_FILE_SIZE);
    if (tooBig) {
      toast.error(`Each file must be under ${MAX_FILE_SIZE / 1024 / 1024}MB`);
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      const formData = new FormData();
      files.forEach((f) => formData.append("files", f));
      formData.append("folder", folder);

      const { data } = await apiClient.post("/uploads/multiple", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (evt) => {
          if (evt.total) {
            setProgress(Math.round((evt.loaded * 100) / evt.total));
          }
        },
        timeout: 120000,
      });

      const urls =
        data?.data?.urls ||
        data?.urls ||
        data?.data?.files?.map((f) => f.url) ||
        [];

      if (!urls.length) throw new Error("Upload returned no URLs");

      onChange([...safeValues, ...urls].slice(0, maxImages));
      toast.success(`${urls.length} image(s) uploaded`);
    } catch (error) {
      console.error("Multi upload error:", error);
      toast.error(
        error?.response?.data?.message || error?.message || "Upload failed"
      );
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const handleAddUrl = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) {
      toast.error("Please enter an image URL");
      return;
    }
    if (
      !trimmed.startsWith("http://") &&
      !trimmed.startsWith("https://") &&
      !trimmed.startsWith("/")
    ) {
      toast.error("URL must start with http://, https://, or /");
      return;
    }
    if (safeValues.includes(trimmed)) {
      toast.error("This URL is already in the gallery");
      return;
    }
    onChange([...safeValues, trimmed].slice(0, maxImages));
    setUrlInput("");
    setShowUrlField(false);
    toast.success("URL added to gallery");
  };

  const handleRemove = (index) => {
    onChange(safeValues.filter((_, i) => i !== index));
  };

  return (
    <Box>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 1.5 }}
      >
        <Typography
          sx={{
            fontSize: "0.72rem",
            fontWeight: 700,
            color: "#64748b",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}
        >
          {label} ({safeValues.length}/{maxImages})
        </Typography>
        {isFull && (
          <Typography sx={{ fontSize: "0.65rem", color: "#f59e0b", fontWeight: 700 }}>
            Max reached
          </Typography>
        )}
      </Stack>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: `repeat(auto-fill, minmax(${ITEM_SIZE}px, 1fr))`,
          gap: 1.25,
          mb: 1.5,
        }}
      >
        {safeValues.map((url, idx) => (
          <Box
            key={`${url}-${idx}`}
            sx={{
              position: "relative",
              paddingTop: "75%",
              borderRadius: 2,
              overflow: "hidden",
              border: "1px solid #eef1f6",
              bgcolor: "#fafbfc",
              transition: "all 0.2s",
              "&:hover": {
                transform: "translateY(-2px)",
                boxShadow: "0 6px 16px rgba(0,0,0,0.1)",
              },
              "&:hover .remove-btn": { opacity: 1 },
            }}
          >
            <Box
              component="img"
              src={resolvePreviewUrl(url)}
              alt={`gallery-${idx}`}
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src =
                  "data:image/svg+xml;utf8," +
                  encodeURIComponent(
                    `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="75"><rect width="100" height="75" fill="#e2e8f0"/><text x="50" y="40" text-anchor="middle" font-size="10" fill="#94a3b8">Failed</text></svg>`
                  );
              }}
              sx={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
            <Box
              sx={{
                position: "absolute",
                top: 4,
                left: 4,
                bgcolor: "rgba(11,18,32,0.7)",
                color: "#fff",
                px: 0.75,
                py: 0.15,
                borderRadius: 1,
                fontSize: 10,
                fontWeight: 700,
              }}
            >
              {idx + 1}
            </Box>
            {!disabled && (
              <Tooltip title="Remove">
                <IconButton
                  className="remove-btn"
                  size="small"
                  onClick={() => handleRemove(idx)}
                  sx={{
                    position: "absolute",
                    top: 4,
                    right: 4,
                    width: 24,
                    height: 24,
                    bgcolor: "rgba(239,68,68,0.95)",
                    color: "#fff",
                    opacity: 0,
                    transition: "opacity 0.2s",
                    "&:hover": { bgcolor: "#dc2626" },
                  }}
                >
                  <CloseIcon sx={{ fontSize: 14 }} />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        ))}

        {!disabled && !isFull && !uploading && (
          <Box
            onClick={() => fileInputRef.current?.click()}
            sx={{
              paddingTop: "75%",
              position: "relative",
              borderRadius: 2,
              border: "2px dashed #c7d2fe",
              bgcolor: "#eef2ff",
              cursor: "pointer",
              transition: "all 0.2s",
              "&:hover": {
                borderColor: "#6366f1",
                bgcolor: "#e0e7ff",
              },
            }}
          >
            <Stack
              alignItems="center"
              justifyContent="center"
              spacing={0.5}
              sx={{
                position: "absolute",
                inset: 0,
                color: "#6366f1",
              }}
            >
              <AddIcon sx={{ fontSize: 20 }} />
              <Typography sx={{ fontSize: "0.65rem", fontWeight: 700 }}>
                Upload
              </Typography>
            </Stack>
          </Box>
        )}
      </Box>

      {uploading && (
        <Box sx={{ mb: 1.5 }}>
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{
              height: 4,
              borderRadius: 2,
              bgcolor: "#eef1f6",
              "& .MuiLinearProgress-bar": {
                bgcolor: "#6366f1",
                borderRadius: 2,
              },
            }}
          />
          <Typography
            sx={{
              fontSize: "0.65rem",
              color: "#6366f1",
              fontWeight: 600,
              mt: 0.5,
            }}
          >
            Uploading… {progress}%
          </Typography>
        </Box>
      )}

      {!disabled && !isFull && (
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1}
          sx={{ mb: 1 }}
        >
          <Button
            component="label"
            variant="outlined"
            size="small"
            disabled={uploading}
            startIcon={
              uploading ? (
                <CircularProgress size={14} color="inherit" />
              ) : (
                <UploadIcon sx={{ fontSize: 16 }} />
              )
            }
            sx={{
              textTransform: "none",
              fontWeight: 700,
              fontSize: "0.75rem",
              borderRadius: 2,
              borderColor: "#c7d2fe",
              color: "#4f46e5",
              bgcolor: "#fff",
              "&:hover": {
                borderColor: "#6366f1",
                bgcolor: "#eef2ff",
              },
            }}
          >
            {uploading ? "Uploading…" : "Upload Images"}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              hidden
              disabled={uploading}
              onChange={handleFilesChange}
            />
          </Button>
          <Button
            variant="outlined"
            size="small"
            onClick={() => setShowUrlField((v) => !v)}
            disabled={uploading}
            startIcon={<LinkIcon sx={{ fontSize: 16 }} />}
            sx={{
              textTransform: "none",
              fontWeight: 700,
              fontSize: "0.75rem",
              borderRadius: 2,
              borderColor: "#eef1f6",
              color: "#475569",
              bgcolor: "#fff",
              "&:hover": {
                borderColor: "#6366f1",
                bgcolor: "#eef2ff",
              },
            }}
          >
            {showUrlField ? "Hide URL field" : "Add via URL"}
          </Button>
        </Stack>
      )}

      {showUrlField && !isFull && !disabled && (
        <TextField
          fullWidth
          size="small"
          placeholder="https://example.com/image.jpg"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAddUrl();
            }
          }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <LinkIcon sx={{ fontSize: 16, color: "#94a3b8" }} />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <Button
                    size="small"
                    onClick={handleAddUrl}
                    sx={{
                      textTransform: "none",
                      fontWeight: 700,
                      fontSize: "0.7rem",
                      minWidth: 0,
                      px: 1,
                      color: "#6366f1",
                    }}
                  >
                    Add
                  </Button>
                </InputAdornment>
              ),
            },
          }}
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: 2,
              bgcolor: "#fafbfc",
              "& fieldset": { borderColor: "#eef1f6" },
              "&:hover fieldset": { borderColor: "#c7d2fe" },
              "&.Mui-focused fieldset": {
                borderColor: "#6366f1",
                borderWidth: 1.5,
              },
            },
          }}
        />
      )}

      {helperText && (
        <Typography sx={{ fontSize: "0.68rem", color: "#94a3b8", mt: 1 }}>
          {helperText}
        </Typography>
      )}
    </Box>
  );
};

export default MultiImageInput;