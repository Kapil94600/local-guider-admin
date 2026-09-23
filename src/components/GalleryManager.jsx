// src/components/GalleryManager.jsx
// ═══════════════════════════════════════════════════════════════
// ✅ GALLERY MANAGER — Reusable wrapper around MultiImageInput
// Two modes:
//   Mode 1 (Admin full control): canUpload=true, onSave provided
//   Mode 2 (Owner uploads from app): canUpload=false, onDelete provided
// ═══════════════════════════════════════════════════════════════
import { useState, useEffect } from "react";
import {
  Box,
  Stack,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Chip,
} from "@mui/material";
import {
  Save,
  Image as ImageIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import { toast } from "react-toastify";
import MultiImageInput from "./MultiImageInput";

const MAX_IMAGES = 10;

const GalleryManager = ({
  entityId,
  entityType = "PLACE",
  initialImages = [],
  onSave,
  onDelete,
  canUpload = true,
  canDelete = true,
  readOnly = false,
  title = "Gallery",
  folder = null,
}) => {
  const [images, setImages] = useState([]);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [deletingUrls, setDeletingUrls] = useState([]); // ✅ FIX B-3: array instead of single

  // Resolve folder based on entity type if not provided
  const resolvedFolder =
    folder ||
    ({
      PLACE: "local-guider/places/gallery",
      GUIDER: "local-guider/guiders/gallery",
      PHOTOGRAPHER: "local-guider/photographers/gallery",
    }[entityType] || "local-guider/gallery");

  // Sync with parent images
  useEffect(() => {
    setImages(Array.isArray(initialImages) ? initialImages : []);
    setDirty(false);
  }, [initialImages, entityId]);

  const isImmediateDeleteMode = !canUpload && !!onDelete;
  const uploadDisabled = readOnly || !canUpload;
  const deleteDisabled = readOnly || !canDelete;

  // ═══════════════════════════════════════════════════════════════
  // ✅ FIX B-3: Handle multi-delete in immediate mode
  // ═══════════════════════════════════════════════════════════════
  const handleImagesChange = async (newImages) => {
    if (isImmediateDeleteMode && newImages.length < images.length) {
      // Find ALL removed URLs (not just first one)
      const removedUrls = images.filter((url) => !newImages.includes(url));

      if (removedUrls.length > 0 && onDelete) {
        setDeletingUrls(removedUrls); // Track all being deleted
        let successCount = 0;
        let failCount = 0;

        // ✅ Loop over ALL removed URLs (was: only first one)
        for (const removedUrl of removedUrls) {
          try {
            await onDelete(removedUrl);
            successCount++;
          } catch (error) {
            failCount++;
            console.error("Delete error:", error);
            toast.error(
              error?.response?.data?.message ||
                error?.message ||
                `Failed to delete image`
            );
          }
        }

        // Update local state with what actually got deleted
        if (successCount > 0) {
          const successfullyDeleted = removedUrls.slice(0, successCount);
          const updatedImages = images.filter(
            (url) => !successfullyDeleted.includes(url)
          );
          setImages(updatedImages);

          if (failCount === 0) {
            toast.success(
              `${successCount} image${successCount > 1 ? "s" : ""} deleted`
            );
          } else {
            toast.warning(
              `${successCount} deleted, ${failCount} failed. Please try again.`
            );
          }
        }

        setDeletingUrls([]);
        return;
      }
    }

    // Regular mode — just update local state and mark dirty
    setImages(newImages);
    setDirty(true);
  };

  // Save gallery (regular mode)
  const handleSave = async () => {
    if (readOnly) return;
    if (!onSave) {
      toast.error("onSave handler missing");
      return;
    }
    setSaving(true);
    try {
      await onSave(images);
      setDirty(false);
      toast.success("Gallery saved");
    } catch (error) {
      console.error("Save error:", error);
      toast.error(
        error?.response?.data?.message || error?.message || "Save failed"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setImages(Array.isArray(initialImages) ? initialImages : []);
    setDirty(false);
  };

  const isEmpty = images.length === 0;
  const isFull = images.length >= MAX_IMAGES;
  const busy = saving || deletingUrls.length > 0;
  const showSaveButton = canUpload && !readOnly && !isImmediateDeleteMode;

  return (
    <Box>
      {/* Header */}
      <Stack
        direction="row"
        spacing={2}
        sx={{
          mb: 1.5,
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
        }}
      >
        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
          <ImageIcon sx={{ color: "#6366F1", fontSize: 20 }} />
          <Typography
            variant="subtitle2"
            fontWeight={700}
            sx={{ color: "#334155" }}
          >
            {title}
          </Typography>
          <Typography variant="caption" color="textSecondary">
            ({images.length}/{MAX_IMAGES})
          </Typography>
          {!canUpload && (
            <Chip
              label="Owner uploads from app"
              size="small"
              sx={{
                bgcolor: "#EEF2FF",
                color: "#4F46E5",
                fontSize: "0.62rem",
                fontWeight: 700,
                height: 20,
                borderRadius: 999,
              }}
            />
          )}
          {isImmediateDeleteMode && (
            <Chip
              label="Auto-save on delete"
              size="small"
              sx={{
                bgcolor: "#D1FAE5",
                color: "#047857",
                fontSize: "0.62rem",
                fontWeight: 700,
                height: 20,
                borderRadius: 999,
              }}
            />
          )}
        </Stack>

        {showSaveButton && (
          <Stack direction="row" spacing={1}>
            {dirty && (
              <Button
                size="small"
                onClick={handleReset}
                disabled={busy}
                color="inherit"
                sx={{
                  textTransform: "none",
                  fontWeight: 600,
                  fontSize: "0.72rem",
                  color: "#64748B",
                }}
              >
                Reset
              </Button>
            )}
            <Button
              size="small"
              variant="contained"
              startIcon={
                saving ? (
                  <CircularProgress size={14} color="inherit" />
                ) : (
                  <Save sx={{ fontSize: 14 }} />
                )
              }
              onClick={handleSave}
              disabled={busy || !dirty}
              sx={{
                background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
                "&:hover": {
                  background: "linear-gradient(135deg, #4F46E5, #7C3AED)",
                },
                textTransform: "none",
                fontWeight: 700,
                fontSize: "0.72rem",
                borderRadius: 2,
                boxShadow: "none",
                "&.Mui-disabled": {
                  background: "#E2E8F0",
                  color: "#94A3B8",
                },
              }}
            >
              {saving ? "Saving..." : "Save Gallery"}
            </Button>
          </Stack>
        )}
      </Stack>

      {/* Empty states */}
      {isEmpty && !uploadDisabled && (
        <Alert
          severity="info"
          icon={false}
          sx={{
            bgcolor: "#F8FAFC",
            color: "#64748B",
            border: "1px dashed #CBD5E1",
            borderRadius: 2,
            fontSize: "0.78rem",
            mb: 2,
          }}
        >
          No images yet. Click "Upload Images" or "Add via URL" to get started.
        </Alert>
      )}

      {isEmpty && !canUpload && (
        <Alert
          severity="info"
          icon={false}
          sx={{
            bgcolor: "#F8FAFC",
            color: "#64748B",
            border: "1px dashed #CBD5E1",
            borderRadius: 2,
            fontSize: "0.78rem",
          }}
        >
          No images yet. The owner (guider/photographer) will upload from the
          mobile app.
        </Alert>
      )}

      {/* Main MultiImageInput */}
      <MultiImageInput
        label=""
        values={images}
        onChange={handleImagesChange}
        maxImages={MAX_IMAGES}
        folder={resolvedFolder}
        disabled={uploadDisabled || busy}
        helperText={
          canUpload
            ? "First image will be the cover. Max 10 images."
            : ""
        }
      />

      {/* Footer status */}
      {!isImmediateDeleteMode && (
        <Stack
          direction="row"
          spacing={1.5}
          sx={{ mt: 1.5, alignItems: "center", flexWrap: "wrap" }}
        >
          {isFull && !uploadDisabled && (
            <Typography
              variant="caption"
              sx={{ color: "#f59e0b", fontWeight: 600 }}
            >
              ● Max {MAX_IMAGES} images reached
            </Typography>
          )}
          {dirty && !isImmediateDeleteMode && (
            <Typography
              variant="caption"
              sx={{ color: "#f59e0b", fontWeight: 700 }}
            >
              ● Unsaved changes — click Save to persist
            </Typography>
          )}
          {!dirty && !isFull && images.length > 0 && (
            <Typography
              variant="caption"
              sx={{ color: "#10b981", fontWeight: 600 }}
            >
              ✓ All changes saved
            </Typography>
          )}
        </Stack>
      )}

      {/* ✅ FIX B-3: Show deleting state */}
      {deletingUrls.length > 0 && (
        <Stack
          direction="row"
          spacing={1}
          sx={{ mt: 1.5, alignItems: "center" }}
        >
          <CircularProgress size={14} sx={{ color: "#EF4444" }} />
          <Typography
            variant="caption"
            sx={{ color: "#EF4444", fontWeight: 600 }}
          >
            Deleting {deletingUrls.length} image
            {deletingUrls.length > 1 ? "s" : ""}...
          </Typography>
        </Stack>
      )}
    </Box>
  );
};

export default GalleryManager;