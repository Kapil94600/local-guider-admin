// src/pages/GuiderDetails.jsx
// ═══════════════════════════════════════════════════════════════
// GUIDER DETAILS — with MultiImageInput for gallery
// ═══════════════════════════════════════════════════════════════
import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchGuiderById,
  clearSelected,
  updateGuider,
} from "../redux/slices/guiderSlice";
import {
  FaArrowLeft,
  FaFilePdf,
  FaEnvelope,
  FaPhone,
  FaStar,
  FaBriefcase,
  FaMapMarkerAlt,
  FaLanguage,
  FaCamera,
  FaBuilding,
  FaSave,
} from "react-icons/fa";
import {
  Avatar,
  Box,
  Typography,
  Paper,
  Chip,
  Button,
  Stack,
  Divider,
  CircularProgress,
  Dialog,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  Close as CloseIcon,
  CheckCircle as VerifiedIcon,
  Edit as EditIcon,
} from "@mui/icons-material";
import { toast } from "react-toastify";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import apiClient from "../api/axios";
import { getImageUrl, getFallbackAvatar } from "../utils/imageFallback";
import { MultiImageInput, ImageInput } from "../components";

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
  indigoSoft: "#eef2ff",
  violet: "#8b5cf6",
  rose: "#f43f5e",
  roseSoft: "#ffe4e6",
  emerald: "#10b981",
  emeraldSoft: "#d1fae5",
  amber: "#f59e0b",
  amberSoft: "#fef3c7",
  sky: "#0ea5e9",
  radius: 3,
  fontDisplay: '"Inter", system-ui, -apple-system, sans-serif',
};

const getFullName = (g) => {
  if (g.fullName) return g.fullName;
  if (g.firstName && g.lastName) return `${g.firstName} ${g.lastName}`;
  if (g.user?.firstName && g.user?.lastName)
    return `${g.user.firstName} ${g.user.lastName}`;
  if (g.name) return g.name;
  return "—";
};

const getEmail = (g) => g.user?.email || g.email || g.User?.email || "—";
const getPhone = (g) => g.user?.phone || g.phone || g.User?.phone || "—";

// ═══════════════════════════════════════════════════════════════
// DETAIL ITEM
// ═══════════════════════════════════════════════════════════════
const DetailItem = ({ icon, label, value, accent = T.violet }) => (
  <Paper
    elevation={0}
    sx={{
      display: "flex",
      alignItems: "center",
      gap: 1.5,
      p: 1.75,
      borderRadius: 2,
      bgcolor: T.surface,
      border: `1px solid ${T.border}`,
      transition: "all 0.2s ease",
      "&:hover": {
        borderColor: T.borderStrong,
        transform: "translateY(-1px)",
        boxShadow: "0 4px 12px -8px rgba(15,23,42,0.1)",
      },
    }}
  >
    <Box
      sx={{
        width: 38,
        height: 38,
        borderRadius: 2,
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
    <Box sx={{ minWidth: 0, flex: 1 }}>
      <Typography
        sx={{
          fontSize: "0.65rem",
          fontWeight: 700,
          color: T.textFaint,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          mb: 0.2,
        }}
      >
        {label}
      </Typography>
      <Typography
        sx={{
          fontSize: "0.85rem",
          fontWeight: 600,
          color: T.textPrimary,
          lineHeight: 1.3,
        }}
        noWrap
      >
        {value || "N/A"}
      </Typography>
    </Box>
  </Paper>
);

// ═══════════════════════════════════════════════════════════════
// SECTION HEADER
// ═══════════════════════════════════════════════════════════════
const SectionHeader = ({ title, subtitle, accent = T.violet }) => (
  <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
    <Box sx={{ width: 4, height: 22, borderRadius: 1, bgcolor: accent }} />
    <Box>
      <Typography
        sx={{
          fontFamily: T.fontDisplay,
          fontWeight: 700,
          fontSize: "0.95rem",
          color: T.textPrimary,
        }}
      >
        {title}
      </Typography>
      {subtitle && (
        <Typography
          sx={{
            fontSize: "0.7rem",
            color: T.textFaint,
            mt: 0.2,
            fontWeight: 500,
          }}
        >
          {subtitle}
        </Typography>
      )}
    </Box>
  </Stack>
);

// ═══════════════════════════════════════════════════════════════
// DOC THUMB
// ═══════════════════════════════════════════════════════════════
const DocThumb = ({ src, label, onClick }) => (
  <Box
    onClick={onClick}
    sx={{
      position: "relative",
      borderRadius: 2,
      overflow: "hidden",
      cursor: "pointer",
      border: `1px solid ${T.border}`,
      transition: "all 0.2s ease",
      "&:hover": {
        borderColor: T.violet,
        transform: "translateY(-2px)",
        boxShadow: `0 8px 20px -8px ${T.violet}55`,
      },
    }}
  >
    <Box
      component="img"
      src={src}
      alt={label}
      sx={{
        width: 140,
        height: 140,
        objectFit: "cover",
        display: "block",
      }}
    />
    <Box
      sx={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        p: 0.75,
        background: "linear-gradient(to top, rgba(11,18,32,0.9), transparent)",
      }}
    >
      <Typography
        sx={{
          fontSize: "0.65rem",
          fontWeight: 700,
          color: "#fff",
          textAlign: "center",
        }}
      >
        {label}
      </Typography>
    </Box>
  </Box>
);

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
const GuiderDetails = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { selectedItem, loading, items } = useSelector(
    (state) => state.guiders
  );
  const [previewImage, setPreviewImage] = useState(null);
  const [placeNames, setPlaceNames] = useState([]);
  const [downloading, setDownloading] = useState(false);
  const [galleryDialog, setGalleryDialog] = useState(false);
  const [gallery, setGallery] = useState([]);
  const [savingGallery, setSavingGallery] = useState(false);
  const [editPhotoDialog, setEditPhotoDialog] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState("");
  const [savingPhoto, setSavingPhoto] = useState(false);
  const downloadRef = useRef(null);

  useEffect(() => {
    dispatch(fetchGuiderById(id));
    return () => dispatch(clearSelected());
  }, [dispatch, id]);

  useEffect(() => {
    const fetchPlaceNames = async () => {
      const guider = selectedItem || items.find((item) => item.id === id);
      if (!guider?.placeIds || guider.placeIds.length === 0) return;
      try {
        const names = await Promise.all(
          guider.placeIds.map(async (placeId) => {
            try {
              const res = await apiClient.get(`/places/${placeId}`);
              return res.data?.data?.name || placeId;
            } catch {
              return placeId;
            }
          })
        );
        setPlaceNames(names);
      } catch (error) {
        console.error("Error fetching place names:", error);
      }
    };
    fetchPlaceNames();
  }, [selectedItem, items, id]);

  // Sync gallery + profile photo when item loads
  useEffect(() => {
    if (selectedItem?.gallery) {
      setGallery(
        Array.isArray(selectedItem.gallery) ? selectedItem.gallery : []
      );
    }
    if (selectedItem?.profilePhotoUrl || selectedItem?.profileImage) {
      setProfilePhoto(
        selectedItem.profilePhotoUrl || selectedItem.profileImage || ""
      );
    }
  }, [selectedItem]);

  if (loading)
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress size={32} />
      </Box>
    );

  let guider = selectedItem;
  if (!guider) {
    const fallback = items.find((item) => item.id === id);
    if (fallback) guider = fallback;
  }

  if (!guider)
    return (
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <Typography sx={{ color: T.rose, fontWeight: 600 }}>
          Guider not found
        </Typography>
      </Box>
    );

  const fullName = getFullName(guider);
  const email = getEmail(guider);
  const phone = getPhone(guider);
  const fallback = getFallbackAvatar(fullName);

  const imageUrls = {
    profilePhotoUrl: getImageUrl(
      guider.profilePhotoUrl || guider.profileImage,
      fullName
    ),
    selfieUrl: getImageUrl(guider.selfieUrl),
    idFrontUrl: getImageUrl(guider.idFrontUrl),
    idBackUrl: getImageUrl(guider.idBackUrl),
  };

  // ═══════════════════════════════════════════════════════════════
  // SAVE GALLERY
  // ═══════════════════════════════════════════════════════════════
  const handleSaveGallery = async () => {
    setSavingGallery(true);
    try {
      await apiClient.put(`/guiders/${id}/gallery`, { images: gallery });
      toast.success("Gallery saved successfully");
      dispatch(fetchGuiderById(id));
      setGalleryDialog(false);
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to save gallery"
      );
    } finally {
      setSavingGallery(false);
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // SAVE PROFILE PHOTO
  // ═══════════════════════════════════════════════════════════════
  const handleSaveProfilePhoto = async () => {
    setSavingPhoto(true);
    try {
      await apiClient.put(`/guiders/${id}`, {
        profilePhotoUrl: profilePhoto,
      });
      toast.success("Profile photo updated");
      dispatch(fetchGuiderById(id));
      setEditPhotoDialog(false);
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to update photo"
      );
    } finally {
      setSavingPhoto(false);
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // PDF DOWNLOAD
  // ═══════════════════════════════════════════════════════════════
  const downloadAsPDF = async () => {
    if (!downloadRef.current) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(downloadRef.current, {
        scale: 3,
        useCORS: true,
        backgroundColor: "#ffffff",
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }
      pdf.save(`Guider-Details-${fullName}.pdf`);
    } catch (e) {
      console.error("PDF Error:", e);
      alert("PDF download failed");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1100, mx: "auto" }}>
      {/* ═══════ Back button ═══════ */}
      <Button
        onClick={() => navigate(-1)}
        startIcon={<FaArrowLeft size={12} />}
        sx={{
          mb: 3,
          textTransform: "none",
          fontWeight: 700,
          fontSize: "0.78rem",
          color: T.textMuted,
          px: 1.5,
          py: 0.75,
          borderRadius: 2,
          border: `1px solid ${T.border}`,
          bgcolor: T.surface,
          "&:hover": {
            bgcolor: T.surfaceSoft,
            borderColor: T.borderStrong,
            color: T.textPrimary,
          },
        }}
      >
        Back
      </Button>

      {/* ═══════ Header Card ═══════ */}
      <Paper
        elevation={0}
        sx={{
          position: "relative",
          p: 3,
          borderRadius: T.radius,
          border: `1px solid ${T.border}`,
          bgcolor: T.surface,
          mb: 2.5,
          overflow: "hidden",
          "&::before": {
            content: '""',
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            background: `linear-gradient(135deg, ${T.violet}, #a78bfa)`,
          },
        }}
      >
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={3}
          alignItems={{ md: "center" }}
        >
          <Box sx={{ position: "relative" }}>
            <Avatar
              src={imageUrls.profilePhotoUrl}
              alt={fullName}
              sx={{
                width: 96,
                height: 96,
                border: "4px solid #fff",
                background: `linear-gradient(135deg, ${T.violet}, #a78bfa)`,
                color: "#fff",
                fontSize: 32,
                fontWeight: 700,
                boxShadow: `0 8px 20px -6px ${T.violet}55`,
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
              {(fullName[0] || "G").toUpperCase()}
            </Avatar>
            <Tooltip title="Change profile photo">
              <IconButton
                onClick={() => {
                  setProfilePhoto(
                    guider.profilePhotoUrl || guider.profileImage || ""
                  );
                  setEditPhotoDialog(true);
                }}
                sx={{
                  position: "absolute",
                  bottom: -4,
                  right: -4,
                  width: 32,
                  height: 32,
                  bgcolor: T.violet,
                  color: "#fff",
                  border: "3px solid #fff",
                  "&:hover": { bgcolor: "#7c3aed" },
                }}
              >
                <EditIcon sx={{ fontSize: 14 }} />
              </IconButton>
            </Tooltip>
            <Box
              sx={{
                position: "absolute",
                bottom: 2,
                left: 2,
                width: 14,
                height: 14,
                borderRadius: "50%",
                bgcolor: guider.isActive ? T.emerald : T.rose,
                border: "3px solid #fff",
              }}
            />
          </Box>

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              sx={{
                fontFamily: T.fontDisplay,
                fontWeight: 800,
                fontSize: { xs: "1.35rem", md: "1.5rem" },
                color: T.textPrimary,
                letterSpacing: "-0.02em",
                lineHeight: 1.2,
                mb: 0.5,
              }}
            >
              {fullName}
            </Typography>

            <Stack
              direction="row"
              spacing={2}
              sx={{ mt: 1, flexWrap: "wrap", gap: 1 }}
            >
              <Stack direction="row" alignItems="center" spacing={0.75}>
                <FaEnvelope size={12} style={{ color: T.textFaint }} />
                <Typography
                  sx={{
                    fontSize: "0.8rem",
                    color: T.textMuted,
                    fontWeight: 500,
                  }}
                >
                  {email}
                </Typography>
              </Stack>
              <Stack direction="row" alignItems="center" spacing={0.75}>
                <FaPhone size={12} style={{ color: T.textFaint }} />
                <Typography
                  sx={{
                    fontSize: "0.8rem",
                    color: T.textMuted,
                    fontWeight: 500,
                  }}
                >
                  {phone}
                </Typography>
              </Stack>
            </Stack>

            <Stack
              direction="row"
              spacing={1}
              sx={{ mt: 1.75, flexWrap: "wrap", gap: 0.75 }}
            >
              <Chip
                label="GUIDER"
                size="small"
                sx={{
                  bgcolor: "#ede9fe",
                  color: T.violet,
                  fontWeight: 700,
                  fontSize: "0.65rem",
                  height: 22,
                  borderRadius: 999,
                }}
              />
              <Chip
                label={guider.isActive ? "Active" : "Inactive"}
                size="small"
                sx={{
                  bgcolor: guider.isActive ? T.emeraldSoft : T.roseSoft,
                  color: guider.isActive ? "#059669" : "#be123c",
                  fontWeight: 700,
                  fontSize: "0.65rem",
                  height: 22,
                  borderRadius: 999,
                }}
              />
              {guider.rating > 0 && (
                <Chip
                  icon={<FaStar size={10} />}
                  label={`${guider.rating} rating`}
                  size="small"
                  sx={{
                    bgcolor: T.amberSoft,
                    color: "#b45309",
                    fontWeight: 700,
                    fontSize: "0.65rem",
                    height: 22,
                    borderRadius: 999,
                    "& .MuiChip-icon": { color: "#b45309", fontSize: 10 },
                  }}
                />
              )}
            </Stack>
          </Box>

          <Button
            onClick={downloadAsPDF}
            disabled={downloading}
            startIcon={
              downloading ? (
                <CircularProgress size={14} sx={{ color: "#fff" }} />
              ) : (
                <FaFilePdf size={12} />
              )
            }
            sx={{
              textTransform: "none",
              fontWeight: 700,
              fontSize: "0.78rem",
              color: "#fff",
              bgcolor: T.violet,
              px: 2,
              py: 1,
              borderRadius: 2,
              whiteSpace: "nowrap",
              alignSelf: { xs: "flex-start", md: "center" },
              "&:hover": { bgcolor: "#7c3aed" },
              "&.Mui-disabled": {
                bgcolor: T.violet,
                opacity: 0.6,
                color: "#fff",
              },
            }}
          >
            {downloading ? "Downloading..." : "Download PDF"}
          </Button>
        </Stack>
      </Paper>

      {/* ═══════ About ═══════ */}
      {(guider.about || guider.bio) && (
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: T.radius,
            border: `1px solid ${T.border}`,
            bgcolor: T.surface,
            mb: 2.5,
          }}
        >
          <SectionHeader
            title="About"
            subtitle="Profile summary"
            accent={T.violet}
          />
          <Typography
            sx={{
              fontSize: "0.85rem",
              color: T.textPrimary,
              lineHeight: 1.7,
              fontWeight: 500,
            }}
          >
            {guider.about || guider.bio}
          </Typography>
        </Paper>
      )}

      {/* ═══════ Professional info ═══════ */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: T.radius,
          border: `1px solid ${T.border}`,
          bgcolor: T.surface,
          mb: 2.5,
        }}
      >
        <SectionHeader
          title="Professional Information"
          subtitle="Experience & expertise"
          accent={T.violet}
        />
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "1fr 1fr",
              md: "repeat(3, 1fr)",
            },
            gap: 2,
          }}
        >
          <DetailItem
            icon={<FaBriefcase size={14} />}
            label="Experience"
            value={`${guider.experience || 0} years`}
            accent={T.violet}
          />
          <DetailItem
            icon={<FaStar size={14} />}
            label="Rating"
            value={guider.rating || 0}
            accent={T.amber}
          />
          <DetailItem
            icon={<FaBuilding size={14} />}
            label="Company"
            value={guider.companyName}
            accent={T.indigo}
          />
          <DetailItem
            icon={<FaMapMarkerAlt size={14} />}
            label="Location"
            value={guider.location || guider.city}
            accent={T.rose}
          />
          <DetailItem
            icon={<FaLanguage size={14} />}
            label="Languages"
            value={guider.languages?.join(", ")}
            accent={T.sky}
          />
          <DetailItem
            icon={<FaCamera size={14} />}
            label="Speciality"
            value={guider.speciality || guider.cameraDetails}
            accent={T.emerald}
          />
        </Box>
      </Paper>

      {/* ═══════ Gallery (with edit) ═══════ */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: T.radius,
          border: `1px solid ${T.border}`,
          bgcolor: T.surface,
          mb: 2.5,
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ mb: 2 }}
        >
          <SectionHeader
            title="Portfolio Gallery"
            subtitle={`${gallery.length} image(s)`}
            accent={T.rose}
          />
          <Button
            size="small"
            variant="outlined"
            onClick={() => setGalleryDialog(true)}
            startIcon={<EditIcon sx={{ fontSize: 14 }} />}
            sx={{
              textTransform: "none",
              fontWeight: 700,
              fontSize: "0.75rem",
              borderRadius: 2,
              borderColor: T.rose + "40",
              color: T.rose,
              "&:hover": { bgcolor: T.roseSoft, borderColor: T.rose },
            }}
          >
            Edit Gallery
          </Button>
        </Stack>

        {gallery.length === 0 ? (
          <Box
            sx={{
              p: 4,
              borderRadius: 2,
              border: `1px dashed ${T.border}`,
              textAlign: "center",
            }}
          >
            <Typography
              sx={{ color: T.textFaint, fontSize: "0.82rem", fontWeight: 500 }}
            >
              No images yet. Click "Edit Gallery" to upload.
            </Typography>
          </Box>
        ) : (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))",
              gap: 1.25,
            }}
          >
            {gallery.map((url, idx) => (
              <Box
                key={`${url}-${idx}`}
                onClick={() => setPreviewImage(getImageUrl(url))}
                sx={{
                  position: "relative",
                  paddingTop: "75%",
                  borderRadius: 2,
                  overflow: "hidden",
                  border: `1px solid ${T.border}`,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  "&:hover": {
                    transform: "translateY(-2px)",
                    boxShadow: "0 6px 16px rgba(0,0,0,0.1)",
                  },
                }}
              >
                <Box
                  component="img"
                  src={getImageUrl(url)}
                  alt={`gallery-${idx}`}
                  sx={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              </Box>
            ))}
          </Box>
        )}
      </Paper>

      {/* ═══════ Documents ═══════ */}
      {(imageUrls.selfieUrl ||
        imageUrls.idFrontUrl ||
        imageUrls.idBackUrl ||
        imageUrls.profilePhotoUrl) && (
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: T.radius,
            border: `1px solid ${T.border}`,
            bgcolor: T.surface,
            mb: 2.5,
          }}
        >
          <SectionHeader
            title="Documents"
            subtitle="Verification images (click to preview)"
            accent={T.sky}
          />
          <Stack
            direction="row"
            spacing={2}
            sx={{ flexWrap: "wrap", gap: 2 }}
          >
            {imageUrls.profilePhotoUrl && (
              <DocThumb
                src={imageUrls.profilePhotoUrl}
                label="Profile"
                onClick={() => setPreviewImage(imageUrls.profilePhotoUrl)}
              />
            )}
            {imageUrls.selfieUrl && (
              <DocThumb
                src={imageUrls.selfieUrl}
                label="Selfie"
                onClick={() => setPreviewImage(imageUrls.selfieUrl)}
              />
            )}
            {imageUrls.idFrontUrl && (
              <DocThumb
                src={imageUrls.idFrontUrl}
                label="ID Front"
                onClick={() => setPreviewImage(imageUrls.idFrontUrl)}
              />
            )}
            {imageUrls.idBackUrl && (
              <DocThumb
                src={imageUrls.idBackUrl}
                label="ID Back"
                onClick={() => setPreviewImage(imageUrls.idBackUrl)}
              />
            )}
          </Stack>
        </Paper>
      )}

      {/* ═══════ Places ═══════ */}
      {placeNames.length > 0 && (
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: T.radius,
            border: `1px solid ${T.border}`,
            bgcolor: T.surface,
          }}
        >
          <SectionHeader
            title="Places"
            subtitle={`${placeNames.length} location${
              placeNames.length > 1 ? "s" : ""
            } covered`}
            accent={T.emerald}
          />
          <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1 }}>
            {placeNames.map((place, idx) => (
              <Chip
                key={idx}
                label={place}
                sx={{
                  bgcolor: T.emeraldSoft,
                  color: "#047857",
                  fontWeight: 700,
                  fontSize: "0.72rem",
                  height: 26,
                  borderRadius: 999,
                }}
              />
            ))}
          </Stack>
        </Paper>
      )}

      {/* ═══════ Hidden PDF layout ═══════ */}
      <Box sx={{ position: "absolute", left: -9999, top: 0 }}>
        <Box ref={downloadRef}>
          <Box
            sx={{
              width: "794px",
              minHeight: "1123px",
              p: "40px",
              fontFamily: "Arial, sans-serif",
              bgcolor: "#fff",
              color: "#000",
            }}
          >
            <Box
              sx={{
                textAlign: "center",
                borderBottom: "4px solid #8b5cf6",
                pb: 2.5,
                mb: 2.5,
              }}
            >
              <Typography
                sx={{
                  color: "#8b5cf6",
                  fontSize: "32px",
                  m: 0,
                  fontWeight: 700,
                }}
              >
                Local Guider
              </Typography>
              <Typography
                sx={{ color: "#666", fontSize: "18px", mt: 1, fontWeight: 500 }}
              >
                Guider Profile
              </Typography>
            </Box>

            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                mb: 2.5,
                pb: 2.5,
                borderBottom: "2px solid #eee",
              }}
            >
              {imageUrls.profilePhotoUrl && (
                <Box
                  component="img"
                  src={imageUrls.profilePhotoUrl}
                  alt="Profile"
                  sx={{
                    width: 120,
                    height: 120,
                    borderRadius: "50%",
                    mr: 2.5,
                    objectFit: "cover",
                    border: "4px solid #8b5cf6",
                  }}
                />
              )}
              <Box>
                <Typography
                  sx={{ fontSize: "28px", fontWeight: 700, mb: 0.5 }}
                >
                  {fullName}
                </Typography>
                <Typography sx={{ fontSize: "14px", my: 0.5 }}>
                  <strong>Company:</strong> {guider.companyName || "N/A"}
                </Typography>
                <Typography sx={{ fontSize: "14px", my: 0.5 }}>
                  <strong>Location:</strong>{" "}
                  {guider.location || guider.city || "N/A"}
                </Typography>
                <Typography sx={{ fontSize: "14px", my: 0.5 }}>
                  <strong>Status:</strong>{" "}
                  {guider.isActive ? "Active" : "Inactive"}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ mb: 2.5 }}>
              <Typography
                sx={{
                  color: "#8b5cf6",
                  borderBottom: "2px solid #8b5cf6",
                  pb: 0.5,
                  fontSize: "20px",
                  fontWeight: 700,
                }}
              >
                Contact Information
              </Typography>
              <Typography sx={{ fontSize: "14px", my: 1 }}>
                <strong>Email:</strong> {email}
              </Typography>
              <Typography sx={{ fontSize: "14px", my: 1 }}>
                <strong>Phone:</strong> {phone}
              </Typography>
            </Box>

            <Box sx={{ mb: 2.5 }}>
              <Typography
                sx={{
                  color: "#8b5cf6",
                  borderBottom: "2px solid #8b5cf6",
                  pb: 0.5,
                  fontSize: "20px",
                  fontWeight: 700,
                }}
              >
                Professional Information
              </Typography>
              <Typography sx={{ fontSize: "14px", my: 1 }}>
                <strong>Experience:</strong> {guider.experience || 0} years
              </Typography>
              <Typography sx={{ fontSize: "14px", my: 1 }}>
                <strong>Rating:</strong> {guider.rating || 0}
              </Typography>
              <Typography sx={{ fontSize: "14px", my: 1 }}>
                <strong>Languages:</strong>{" "}
                {guider.languages?.join(", ") || "N/A"}
              </Typography>
            </Box>

            <Box sx={{ mb: 2.5 }}>
              <Typography
                sx={{
                  color: "#8b5cf6",
                  borderBottom: "2px solid #8b5cf6",
                  pb: 0.5,
                  fontSize: "20px",
                  fontWeight: 700,
                }}
              >
                About
              </Typography>
              <Typography sx={{ fontSize: "14px", lineHeight: 1.6 }}>
                {guider.about || guider.bio || "No bio provided"}
              </Typography>
            </Box>

            <Box
              sx={{
                textAlign: "center",
                borderTop: "2px solid #8b5cf6",
                pt: 1.5,
                mt: 2.5,
              }}
            >
              <Typography sx={{ color: "#888", fontSize: "12px" }}>
                © 2026 Local Guider. All rights reserved.
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* ═══════ Gallery Edit Dialog ═══════ */}
      <Dialog
        open={galleryDialog}
        onClose={() => !savingGallery && setGalleryDialog(false)}
        maxWidth="md"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: T.radius } } }}
      >
        <Box
          sx={{
            px: 3,
            py: 2,
            borderBottom: `1px solid ${T.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Typography sx={{ fontWeight: 700, fontSize: "1.05rem" }}>
            Edit Gallery — {fullName}
          </Typography>
          <IconButton onClick={() => setGalleryDialog(false)} size="small">
            <CloseIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Box>
        <Box sx={{ p: 3 }}>
          <MultiImageInput
            label="Gallery"
            values={gallery}
            onChange={setGallery}
            maxImages={10}
            folder="local-guider/guiders/gallery"
            helperText="Max 10 images. Click Save below to persist."
          />
        </Box>
        <Box
          sx={{
            px: 3,
            py: 2,
            borderTop: `1px solid ${T.border}`,
            display: "flex",
            justifyContent: "flex-end",
            gap: 1,
          }}
        >
          <Button
            onClick={() => setGalleryDialog(false)}
            disabled={savingGallery}
            sx={{
              textTransform: "none",
              fontWeight: 600,
              color: T.textMuted,
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveGallery}
            disabled={savingGallery}
            startIcon={
              savingGallery ? (
                <CircularProgress size={14} sx={{ color: "#fff" }} />
              ) : (
                <FaSave size={12} />
              )
            }
            sx={{
              textTransform: "none",
              fontWeight: 700,
              borderRadius: 2,
              bgcolor: T.rose,
              px: 3,
              "&:hover": { bgcolor: "#e11d48" },
              boxShadow: "none",
            }}
          >
            {savingGallery ? "Saving..." : "Save Gallery"}
          </Button>
        </Box>
      </Dialog>

      {/* ═══════ Profile Photo Edit Dialog ═══════ */}
      <Dialog
        open={editPhotoDialog}
        onClose={() => !savingPhoto && setEditPhotoDialog(false)}
        maxWidth="sm"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: T.radius } } }}
      >
        <Box
          sx={{
            px: 3,
            py: 2,
            borderBottom: `1px solid ${T.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Typography sx={{ fontWeight: 700, fontSize: "1.05rem" }}>
            Edit Profile Photo
          </Typography>
          <IconButton onClick={() => setEditPhotoDialog(false)} size="small">
            <CloseIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Box>
        <Box sx={{ p: 3 }}>
          <ImageInput
            label="Profile Photo"
            value={profilePhoto}
            onChange={setProfilePhoto}
            folder="local-guider/guiders"
            aspect="square"
            helperText="Recommended: 400x400px, JPG/PNG, under 10MB"
          />
        </Box>
        <Box
          sx={{
            px: 3,
            py: 2,
            borderTop: `1px solid ${T.border}`,
            display: "flex",
            justifyContent: "flex-end",
            gap: 1,
          }}
        >
          <Button
            onClick={() => setEditPhotoDialog(false)}
            disabled={savingPhoto}
            sx={{
              textTransform: "none",
              fontWeight: 600,
              color: T.textMuted,
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveProfilePhoto}
            disabled={savingPhoto}
            startIcon={
              savingPhoto ? (
                <CircularProgress size={14} sx={{ color: "#fff" }} />
              ) : (
                <FaSave size={12} />
              )
            }
            sx={{
              textTransform: "none",
              fontWeight: 700,
              borderRadius: 2,
              bgcolor: T.violet,
              px: 3,
              "&:hover": { bgcolor: "#7c3aed" },
              boxShadow: "none",
            }}
          >
            {savingPhoto ? "Saving..." : "Save"}
          </Button>
        </Box>
      </Dialog>

      {/* ═══════ Image preview ═══════ */}
      <Dialog
        open={!!previewImage}
        onClose={() => setPreviewImage(null)}
        maxWidth="md"
        slotProps={{ paper: { sx: { borderRadius: T.radius } } }}
      >
        <Box sx={{ position: "relative", p: 1 }}>
          <Button
            onClick={() => setPreviewImage(null)}
            sx={{
              position: "absolute",
              top: 8,
              right: 8,
              minWidth: 32,
              width: 32,
              height: 32,
              borderRadius: "50%",
              bgcolor: "rgba(0,0,0,0.5)",
              color: "#fff",
              p: 0,
              "&:hover": { bgcolor: "rgba(0,0,0,0.7)" },
            }}
          >
            <CloseIcon sx={{ fontSize: 18 }} />
          </Button>
          <Box
            component="img"
            src={previewImage}
            alt="Preview"
            sx={{
              width: "100%",
              maxHeight: 600,
              objectFit: "contain",
              display: "block",
              borderRadius: 2,
            }}
          />
        </Box>
      </Dialog>
    </Box>
  );
};

export default GuiderDetails;