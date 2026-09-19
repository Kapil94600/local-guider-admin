// src/components/GalleryManager.jsx
import { useState, useEffect, useRef } from 'react';
import {
  Box, Typography, Button, IconButton, Stack, CircularProgress,
  Tooltip, Alert, LinearProgress,
} from '@mui/material';
import { CloudUpload, Delete, Save, Image as ImageIcon } from '@mui/icons-material';
import { toast } from 'react-toastify';
import apiClient from '../api/axios';

const MAX_IMAGES = 10;

// ═══════════════════════════════════════════
// ✅ Inline SVG fallback — no network calls
// ═══════════════════════════════════════════
const getFallbackPlaceholder = (text = 'No Image') => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="150" viewBox="0 0 200 150"><rect width="200" height="150" fill="#E2E8F0"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#94A3B8" font-size="14" font-family="Arial, sans-serif">${text}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

const getImageUrl = (path) => {
  if (!path) return getFallbackPlaceholder();
  if (path.startsWith('data:')) return path;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const API_BASE_URL =
    import.meta.env.VITE_API_URL ||
    'https://local-guider-backend.onrender.com/api/v1';
  const baseUrl = API_BASE_URL.replace('/api/v1', '');
  return `${baseUrl}${path.startsWith('/') ? path : '/' + path}`;
};

/**
 * GalleryManager — Reusable gallery component
 *
 * Mode 1 (Admin full control — Place):
 *   <GalleryManager canUpload canDelete onSave={...} />
 *
 * Mode 2 (Delete-only — Guider/Photographer):
 *   <GalleryManager canUpload={false} canDelete onDelete={...} />
 */
const GalleryManager = ({
  entityId,
  entityType = 'PLACE',
  initialImages = [],
  onSave,
  onDelete,
  canUpload = true,
  canDelete = true,
  readOnly = false,
  title = 'Gallery',
}) => {
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dirty, setDirty] = useState(false);
  const [deletingUrl, setDeletingUrl] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    setImages(Array.isArray(initialImages) ? initialImages : []);
    setDirty(false);
  }, [initialImages, entityId]);

  const isImmediateDeleteMode = !canUpload && !!onDelete;
  const uploadDisabled = readOnly || !canUpload;
  const deleteDisabled = readOnly || !canDelete;

  const handlePickFiles = () => {
    if (uploadDisabled) return;
    fileInputRef.current?.click();
  };

  const handleFilesSelected = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const remaining = MAX_IMAGES - images.length;
    if (files.length > remaining) {
      toast.error(`Max ${MAX_IMAGES} images allowed. You can add ${remaining} more.`);
      e.target.value = '';
      return;
    }

    const invalid = files.find((f) => !f.type.startsWith('image/'));
    if (invalid) {
      toast.error('Only image files are allowed');
      e.target.value = '';
      return;
    }

    const tooBig = files.find((f) => f.size > 5 * 1024 * 1024);
    if (tooBig) {
      toast.error('Each image must be under 5 MB');
      e.target.value = '';
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      const formData = new FormData();
      files.forEach((file) => formData.append('files', file));

      const { data } = await apiClient.post('/uploads/multiple', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (evt) => {
          if (evt.total) setProgress(Math.round((evt.loaded * 100) / evt.total));
        },
      });

      const uploadedUrls =
        data?.data?.urls ||
        data?.data?.files?.map((f) => f.url) ||
        data?.urls ||
        data?.files?.map((f) => f.url) ||
        [];

      if (!uploadedUrls.length) throw new Error('No URLs returned from upload');

      setImages((prev) => [...prev, ...uploadedUrls].slice(0, MAX_IMAGES));
      setDirty(true);
      toast.success(`${uploadedUrls.length} image(s) uploaded`);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error?.response?.data?.message || error.message || 'Upload failed');
    } finally {
      setUploading(false);
      setProgress(0);
      e.target.value = '';
    }
  };

  const handleRemove = async (url) => {
    if (deleteDisabled) return;

    if (isImmediateDeleteMode) {
      setDeletingUrl(url);
      try {
        await onDelete(url);
        setImages((prev) => prev.filter((u) => u !== url));
        toast.success('Image deleted');
      } catch (error) {
        console.error('Delete error:', error);
        toast.error(error?.response?.data?.message || error.message || 'Delete failed');
      } finally {
        setDeletingUrl(null);
      }
      return;
    }

    setImages((prev) => prev.filter((u) => u !== url));
    setDirty(true);
  };

  const handleSave = async () => {
    if (readOnly) return;
    if (!onSave) {
      toast.error('onSave handler missing');
      return;
    }
    setSaving(true);
    try {
      await onSave(images);
      setDirty(false);
      toast.success('Gallery saved');
    } catch (error) {
      console.error('Save error:', error);
      toast.error(error?.response?.data?.message || error.message || 'Save failed');
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
  const busy = uploading || saving || !!deletingUrl;
  const showSaveButton = canUpload && !readOnly;

  return (
    <Box>
      {/* Header */}
      <Stack
        direction="row"
        spacing={2}
        sx={{ mb: 1.5, alignItems: 'center', justifyContent: 'space-between' }}
      >
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <ImageIcon sx={{ color: '#6366F1' }} />
          <Typography variant="subtitle2" fontWeight={700} sx={{ color: '#334155' }}>
            {title}
          </Typography>
          <Typography variant="caption" color="textSecondary">
            ({images.length}/{MAX_IMAGES})
          </Typography>
          {!canUpload && (
            <Typography
              variant="caption"
              sx={{
                bgcolor: '#EEF2FF',
                color: '#4F46E5',
                px: 1,
                py: 0.2,
                borderRadius: 1,
                fontWeight: 600,
              }}
            >
              Owner uploads from app
            </Typography>
          )}
        </Stack>

        {showSaveButton && (
          <Stack direction="row" spacing={1}>
            {dirty && (
              <Button size="small" onClick={handleReset} disabled={busy} color="inherit">
                Reset
              </Button>
            )}
            <Button
              size="small"
              variant="contained"
              startIcon={saving ? <CircularProgress size={14} color="inherit" /> : <Save />}
              onClick={handleSave}
              disabled={busy || !dirty}
              sx={{
                background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                '&:hover': { background: 'linear-gradient(135deg, #4F46E5, #7C3AED)' },
                textTransform: 'none',
                fontWeight: 600,
              }}
            >
              {saving ? 'Saving...' : 'Save Gallery'}
            </Button>
          </Stack>
        )}
      </Stack>

      {/* Upload progress */}
      {uploading && (
        <Box sx={{ mb: 1.5 }}>
          <LinearProgress
            variant={progress ? 'determinate' : 'indeterminate'}
            value={progress}
            sx={{ borderRadius: 2, height: 6 }}
          />
          <Typography variant="caption" color="textSecondary" sx={{ mt: 0.5, display: 'block' }}>
            Uploading… {progress}%
          </Typography>
        </Box>
      )}

      {/* Empty state */}
      {isEmpty && !uploading && (
        <Alert
          severity="info"
          icon={false}
          sx={{
            bgcolor: '#F8FAFC',
            color: '#64748B',
            border: '1px dashed #CBD5E1',
            borderRadius: 2,
          }}
        >
          {canUpload
            ? 'No images yet. Click "Add Images" to upload.'
            : 'No images yet. Guider/Photographer will upload from the mobile app.'}
        </Alert>
      )}

      {/* Image grid */}
      {!isEmpty && (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
            gap: 1.25,
          }}
        >
          {images.map((url, idx) => {
            const isDeleting = deletingUrl === url;
            return (
              <Box
                key={`${url}-${idx}`}
                sx={{
                  position: 'relative',
                  paddingTop: '75%',
                  borderRadius: 2,
                  overflow: 'hidden',
                  border: '1px solid #E2E8F0',
                  bgcolor: '#F1F5F9',
                  opacity: isDeleting ? 0.5 : 1,
                  transition: 'transform 0.15s, box-shadow 0.15s, opacity 0.2s',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 6px 16px rgba(0,0,0,0.08)',
                  },
                  '&:hover .gm-remove': { opacity: 1 },
                }}
              >
                <Box
                  component="img"
                  src={getImageUrl(url)}
                  alt={`gallery-${idx}`}
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = getFallbackPlaceholder();
                  }}
                  sx={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />

                <Box
                  sx={{
                    position: 'absolute',
                    top: 4,
                    left: 4,
                    bgcolor: 'rgba(15,23,42,0.7)',
                    color: '#fff',
                    px: 0.75,
                    py: 0.15,
                    borderRadius: 1,
                    fontSize: 10,
                    fontWeight: 700,
                  }}
                >
                  {idx + 1}
                </Box>

                {!deleteDisabled && (
                  <Tooltip title="Delete">
                    <IconButton
                      className="gm-remove"
                      size="small"
                      onClick={() => handleRemove(url)}
                      disabled={busy}
                      sx={{
                        position: 'absolute',
                        top: 4,
                        right: 4,
                        bgcolor: 'rgba(239,68,68,0.95)',
                        color: '#fff',
                        opacity: 0,
                        transition: 'opacity 0.15s',
                        width: 26,
                        height: 26,
                        '&:hover': { bgcolor: '#DC2626' },
                      }}
                    >
                      {isDeleting ? (
                        <CircularProgress size={12} color="inherit" />
                      ) : (
                        <Delete sx={{ fontSize: 14 }} />
                      )}
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            );
          })}

          {/* Add tile */}
          {!uploadDisabled && !isFull && !uploading && (
            <Box
              onClick={handlePickFiles}
              sx={{
                paddingTop: '75%',
                position: 'relative',
                borderRadius: 2,
                border: '2px dashed #C7D2FE',
                bgcolor: '#EEF2FF',
                cursor: 'pointer',
                transition: 'all 0.15s',
                '&:hover': { borderColor: '#6366F1', bgcolor: '#E0E7FF' },
              }}
            >
              <Stack
                spacing={0.5}
                sx={{
                  position: 'absolute',
                  inset: 0,
                  color: '#6366F1',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <CloudUpload fontSize="small" />
                <Typography variant="caption" fontWeight={600}>Add</Typography>
              </Stack>
            </Box>
          )}
        </Box>
      )}

      {/* Footer controls */}
      {!uploadDisabled && (
        <Stack
          direction="row"
          spacing={1.5}
          sx={{ mt: 1.5, alignItems: 'center' }}
        >
          <Button
            size="small"
            variant="outlined"
            startIcon={<CloudUpload />}
            onClick={handlePickFiles}
            disabled={busy || isFull}
            sx={{
              borderColor: '#C7D2FE',
              color: '#4F46E5',
              textTransform: 'none',
              fontWeight: 600,
              '&:hover': { borderColor: '#6366F1', bgcolor: '#EEF2FF' },
            }}
          >
            {uploading ? 'Uploading…' : 'Add Images'}
          </Button>

          {isFull && (
            <Typography variant="caption" color="warning.main">
              Max {MAX_IMAGES} images reached
            </Typography>
          )}

          {dirty && (
            <Typography variant="caption" color="warning.main" fontWeight={600}>
              ● Unsaved changes
            </Typography>
          )}
        </Stack>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={handleFilesSelected}
      />
    </Box>
  );
};

export default GalleryManager;