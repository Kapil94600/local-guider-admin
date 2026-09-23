// src/components/ImageInput.jsx
// ═══════════════════════════════════════════════════════════════
// ✅ REUSABLE IMAGE INPUT — URL paste OR Upload button
// Usage:
//   <ImageInput
//     label="Place Image"
//     value={formData.image}
//     onChange={(url) => setFormData({ ...formData, image: url })}
//     folder="local-guider/places"
//   />
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
  Alert,
  LinearProgress,
} from "@mui/material";
import {
  CloudUpload as UploadIcon,
  Link as LinkIcon,
  Close as CloseIcon,
  Image as ImageIcon,
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

const ImageInput = ({
  label = "Image",
  value = "",
  onChange,
  folder = "local-guider/uploads",
  required = false,
  helperText = "",
  disabled = false,
  aspect = "wide",
}) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [urlInput, setUrlInput] = useState("");
  const [previewError, setPreviewError] = useState(false);
  const fileInputRef = useRef(null);

  const aspectSize = {
    square: { w: 120, h: 120 },
    wide: { w: 160, h: 100 },
    tall: { w: 100, h: 140 },
  }[aspect] || { w: 160, h: 100 };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Only image files are allowed");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error(`File too large. Max ${MAX_FILE_SIZE / 1024 / 1024}MB`);
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append("image", file);
      formData.append("folder", folder);

      const { data } = await apiClient.post("/uploads", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (evt) => {
          if (evt.total) {
            setProgress(Math.round((evt.loaded * 100) / evt.total));
          }
        },
        timeout: 60000,
      });

      const url = data?.url || data?.data?.url;
      if (!url) throw new Error("Upload returned no URL");

      onChange(url);
      setPreviewError(false);
      toast.success("Image uploaded");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(
        error?.response?.data?.message || error?.message || "Upload failed"
      );
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const handleUrlSubmit = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) {
      toast.error("Please enter an image URL");
      return;
    }
    if (
      !trimmed.startsWith("http://") &&
      !trimmed.startsWith("https://") &&
      !trimmed.startsWith("data:") &&
      !trimmed.startsWith("/")
    ) {
      toast.error("URL must start with http://, https://, or /");
      return;
    }
    onChange(trimmed);
    setUrlInput("");
    setPreviewError(false);
    toast.success("Image URL set");
  };

  const handleClear = () => {
    onChange("");
    setPreviewError(false);
  };

  const previewUrl = resolvePreviewUrl(value);
  const hasImage = !!value;
  const showPreview = hasImage && !previewError;

  return (
    <Box>
      <Typography
        sx={{
          fontSize: "0.72rem",
          fontWeight: 700,
          color: "#64748b",
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          mb: 1,
        }}
      >
        {label} {required && <span style={{ color: "#f43f5e" }}>*</span>}
      </Typography>

      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        alignItems="flex-start"
      >
        <Box
          sx={{
            width: aspectSize.w,
            height: aspectSize.h,
            borderRadius: 2,
            border: "1px solid #eef1f6",
            bgcolor: "#fafbfc",
            overflow: "hidden",
            position: "relative",
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {showPreview ? (
            <>
              <Box
                component="img"
                src={previewUrl}
                alt="preview"
                onError={() => setPreviewError(true)}
                sx={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
              {!disabled && (
                <IconButton
                  size="small"
                  onClick={handleClear}
                  sx={{
                    position: "absolute",
                    top: 4,
                    right: 4,
                    width: 24,
                    height: 24,
                    bgcolor: "rgba(239,68,68,0.9)",
                    color: "#fff",
                    "&:hover": { bgcolor: "#dc2626" },
                  }}
                >
                  <CloseIcon sx={{ fontSize: 14 }} />
                </IconButton>
              )}
            </>
          ) : (
            <Stack alignItems="center" spacing={0.5}>
              <ImageIcon sx={{ fontSize: 28, color: "#cbd5e1" }} />
              <Typography sx={{ fontSize: "0.65rem", color: "#94a3b8" }}>
                No image
              </Typography>
            </Stack>
          )}

          {uploading && (
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                bgcolor: "rgba(255,255,255,0.9)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 1,
              }}
            >
              <CircularProgress size={28} sx={{ color: "#6366f1" }} />
              <Typography
                sx={{ fontSize: "0.7rem", fontWeight: 700, color: "#6366f1" }}
              >
                {progress}%
              </Typography>
            </Box>
          )}
        </Box>

        <Stack spacing={1.5} sx={{ flex: 1, minWidth: 0, width: "100%" }}>
          <Box>
            <Stack
              direction="row"
              alignItems="center"
              spacing={0.75}
              sx={{ mb: 0.5 }}
            >
              <Typography
                sx={{
                  fontSize: "0.62rem",
                  fontWeight: 700,
                  color: "#94a3b8",
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                }}
              >
                Option 1 — Upload
              </Typography>
            </Stack>
            <Button
              component="label"
              variant="outlined"
              fullWidth
              disabled={disabled || uploading}
              startIcon={
                uploading ? (
                  <CircularProgress size={14} color="inherit" />
                ) : (
                  <UploadIcon sx={{ fontSize: 16 }} />
                )
              }
              sx={{
                textTransform: "none",
                fontWeight: 600,
                fontSize: "0.78rem",
                borderRadius: 2,
                borderColor: "#eef1f6",
                color: "#0b1220",
                bgcolor: "#fff",
                justifyContent: "flex-start",
                py: 1,
                pl: 2,
                "&:hover": {
                  borderColor: "#6366f1",
                  bgcolor: "#eef2ff",
                },
              }}
            >
              {uploading ? `Uploading… ${progress}%` : "Choose file"}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                hidden
                disabled={disabled || uploading}
                onChange={handleFileChange}
              />
            </Button>
          </Box>

          {uploading && (
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
          )}

          <Stack
            direction="row"
            alignItems="center"
            spacing={1}
            sx={{ mt: 0.5 }}
          >
            <Box sx={{ flex: 1, height: 1, bgcolor: "#eef1f6" }} />
            <Typography
              sx={{
                fontSize: "0.6rem",
                color: "#94a3b8",
                fontWeight: 700,
                letterSpacing: "0.1em",
              }}
            >
              OR
            </Typography>
            <Box sx={{ flex: 1, height: 1, bgcolor: "#eef1f6" }} />
          </Stack>

          <Box>
            <Stack
              direction="row"
              alignItems="center"
              spacing={0.75}
              sx={{ mb: 0.5 }}
            >
              <Typography
                sx={{
                  fontSize: "0.62rem",
                  fontWeight: 700,
                  color: "#94a3b8",
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                }}
              >
                Option 2 — Paste URL
              </Typography>
            </Stack>
            <TextField
              fullWidth
              size="small"
              placeholder="https://example.com/image.jpg"
              value={urlInput}
              disabled={disabled || uploading}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleUrlSubmit();
                }
              }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <LinkIcon sx={{ fontSize: 16, color: "#94a3b8" }} />
                    </InputAdornment>
                  ),
                  endAdornment: urlInput && (
                    <InputAdornment position="end">
                      <Button
                        size="small"
                        onClick={handleUrlSubmit}
                        disabled={disabled || uploading}
                        sx={{
                          textTransform: "none",
                          fontWeight: 700,
                          fontSize: "0.7rem",
                          minWidth: 0,
                          px: 1,
                          color: "#6366f1",
                        }}
                      >
                        Set
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
          </Box>

          {hasImage && !uploading && (
            <Alert
              severity={previewError ? "warning" : "success"}
              icon={false}
              sx={{
                py: 0.5,
                px: 1.5,
                borderRadius: 1.5,
                fontSize: "0.7rem",
                bgcolor: previewError ? "#fef3c7" : "#d1fae5",
                color: previewError ? "#b45309" : "#047857",
                "& .MuiAlert-message": {
                  fontSize: "0.7rem",
                  fontWeight: 600,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  width: "100%",
                },
              }}
            >
              {previewError ? "⚠️ " : "✓ "}
              {value.slice(0, 60)}
              {value.length > 60 ? "…" : ""}
            </Alert>
          )}
        </Stack>
      </Stack>

      {helperText && (
        <Typography
          sx={{
            fontSize: "0.68rem",
            color: "#94a3b8",
            mt: 1,
            ml: 0.5,
          }}
        >
          {helperText}
        </Typography>
      )}
    </Box>
  );
};

export default ImageInput;