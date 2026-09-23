// src/pages/PhotographerDetails.jsx
// ═══════════════════════════════════════════════════════════════
// PHOTOGRAPHER DETAILS — with MultiImageInput for gallery
// ═══════════════════════════════════════════════════════════════
import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchPhotographerById,
  clearSelected,
} from "../redux/slices/photographerSlice";
import {
  FaArrowLeft,
  FaFilePdf,
  FaEnvelope,
  FaPhone,
  FaBriefcase,
  FaMapMarkerAlt,
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
  CircularProgress,
  Dialog,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  Close as CloseIcon,
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

const getFullName = (p) => {
  if (p.fullName) return p.fullName;
  if (p.firstName && p.lastName) return `${p.firstName} ${p.lastName}`;
  if (p.user?.firstName && p.user?.lastName)
    return `${p.user.firstName} ${p.user.lastName}`;
  if (p.name) return p.name;
  return "—";
};

const getEmail = (p) => p.user?.email || p.email || "—";
const getPhone = (p) => p.user?.phone || p.phone || "—";

const DetailItem = ({ icon, label, value, accent = T.rose }) => (
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

const SectionHeader = ({ title, subtitle, accent = T.rose }) => (
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
        borderColor: T.rose,
        transform: "translateY(-2px)",
        boxShadow: `0 8px 20px -8px ${T.rose}55`,
      },
    }}
  >
    <Box
      component="img"
      src={src}
      alt={label}
      sx={{ width: 140, height: 140, objectFit: "cover", display: "block" }}
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

const PhotographerDetails = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { selectedItem, loading, items } = useSelector(
    (state) => state.photographers
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
    dispatch(fetchPhotographerById(id));
    return () => dispatch(clearSelected());
  }, [dispatch, id]);

  useEffect(() => {
    const fetchPlaceNames = async () => {
      const photographer =
        selectedItem || items.find((item) => item.id === id);
      if (!photographer?.placeIds || photographer.placeIds.length === 0) return;
      try {
        const names = await Promise.all(
          photographer.placeIds.map(async (placeId) => {
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

  let photographer = selectedItem;
  if (!photographer) {
    const fallback = items.find((item) => item.id === id);
    if (fallback) photographer = fallback;
  }

  if (!photographer)
    return (
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <Typography sx={{ color: T.rose, fontWeight: 600 }}>
          Photographer not found
        </Typography>
      </Box>
    );

  const fullName = getFullName(photographer);
  const email = getEmail(photographer);
  const phone = getPhone(photographer);
  const fallback = getFallbackAvatar(fullName);

  const imageUrls = {
    profilePhotoUrl: getImageUrl(
      photographer.profilePhotoUrl || photographer.profileImage,
      fullName
    ),
    selfieUrl: getImageUrl(photographer.selfieUrl),
    idFrontUrl: getImageUrl(photographer.idFrontUrl),
    idBackUrl: getImageUrl(photographer.idBackUrl),
  };

  const handleSaveGallery = async () => {
    setSavingGallery(true);
    try {
      await apiClient.put(`/photographers/${id}/gallery`, { images: gallery });
      toast.success("Gallery saved successfully");
      dispatch(fetchPhotographerById(id));
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

  const handleSaveProfilePhoto = async () => {
    setSavingPhoto(true);
    try {
      await apiClient.put(`/photographers/${id}`, {
        profilePhotoUrl: profilePhoto,
      });
      toast.success("Profile photo updated");
      dispatch(fetchPhotographerById(id));
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
      pdf.save(`Photographer-Details-${fullName}.pdf`);
    } catch (e) {
      console.error("PDF Error:", e);
      alert("PDF download failed");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1100, mx: "auto" }}>
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

      {/* Header */}
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
            background: `linear-gradient(135deg, ${T.rose}, #f472b6)`,
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
                background: `linear-gradient(135deg, ${T.rose}, #f472b6)`,
                color: "#fff",
                fontSize: 32,
                fontWeight: 700,
                boxShadow: `0 8px 20px -6px ${T.rose}55`,
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
              {(fullName[0] || "P").toUpperCase()}
            </Avatar>
            <Tooltip title="Change profile photo">
              <IconButton
                onClick={() => {
                  setProfilePhoto(
                    photographer.profilePhotoUrl ||
                      photographer.profileImage ||
                      ""
                  );
                  setEditPhotoDialog(true);
                }}
                sx={{
                  position: "absolute",
                  bottom: -4,
                  right: -4,
                  width: 32,
                  height: 32,
                  bgcolor: T.rose,
                  color: "#fff",
                  border: "3px solid #fff",
                  "&:hover": { bgcolor: "#e11d48" },
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
                bgcolor: photographer.isActive ? T.emerald : T.rose,
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
                label="PHOTOGRAPHER"
                size="small"
                sx={{
                  bgcolor: T.roseSoft,
                  color: "#be185d",
                  fontWeight: 700,
                  fontSize: "0.65rem",
                  height: 22,
                  borderRadius: 999,
                }}
              />
              <Chip
                label={photographer.isActive ? "Active" : "Inactive"}
                size="small"
                sx={{
                  bgcolor: photographer.isActive ? T.emeraldSoft : T.roseSoft,
                  color: photographer.isActive ? "#059669" : "#be123c",
                  fontWeight: 700,
                  fontSize: "0.65rem",
                  height: 22,
                  borderRadius: 999,
                }}
              />
              {photographer.rating > 0 && (
                <Chip
                  label={`${photographer.rating} rating`}
                  size="small"
                  sx={{
                    bgcolor: T.amberSoft,
                    color: "#b45309",
                    fontWeight: 700,
                    fontSize: "0.65rem",
                    height: 22,
                    borderRadius: 999,
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
              bgcolor: T.rose,
              px: 2,
              py: 1,
              borderRadius: 2,
              whiteSpace: "nowrap",
              alignSelf: { xs: "flex-start", md: "center" },
              "&:hover": { bgcolor: "#e11d48" },
              "&.Mui-disabled": {
                bgcolor: T.rose,
                opacity: 0.6,
                color: "#fff",
              },
            }}
          >
            {downloading ? "Downloading..." : "Download PDF"}
          </Button>
        </Stack>
      </Paper>

      {/* About */}
      {(photographer.about || photographer.bio) && (
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
            accent={T.rose}
          />
          <Typography
            sx={{
              fontSize: "0.85rem",
              color: T.textPrimary,
              lineHeight: 1.7,
              fontWeight: 500,
            }}
          >
            {photographer.about || photographer.bio}
          </Typography>
        </Paper>
      )}

      {/* Professional info */}
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
          subtitle="Experience & equipment"
          accent={T.rose}
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
            value={`${photographer.experience || 0} years`}
            accent={T.rose}
          />
          <DetailItem
            icon={<FaCamera size={14} />}
            label="Camera"
            value={photographer.cameraDetails}
            accent={T.indigo}
          />
          <DetailItem
            icon={<FaBuilding size={14} />}
            label="Company"
            value={photographer.companyName}
            accent={T.indigo}
          />
          <DetailItem
            icon={<FaMapMarkerAlt size={14} />}
            label="Location"
            value={photographer.location || photographer.city}
            accent={T.emerald}
          />
          <DetailItem
            icon={<FaCamera size={14} />}
            label="Rating"
            value={photographer.rating || 0}
            accent={T.amber}
          />
        </Box>
      </Paper>

      {/* Gallery */}
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

      {/* Documents */}
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
          <Stack direction="row" spacing={2} sx={{ flexWrap: "wrap", gap: 2 }}>
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

      {/* Places */}
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

      {/* Hidden PDF layout */}
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
                borderBottom: "4px solid #f43f5e",
                pb: 2.5,
                mb: 2.5,
              }}
            >
              <Typography
                sx={{
                  color: "#f43f5e",
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
                Photographer Profile
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
                    border: "4px solid #f43f5e",
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
                  <strong>Company:</strong> {photographer.companyName || "N/A"}
                </Typography>
                <Typography sx={{ fontSize: "14px", my: 0.5 }}>
                  <strong>Location:</strong>{" "}
                  {photographer.location || photographer.city || "N/A"}
                </Typography>
                <Typography sx={{ fontSize: "14px", my: 0.5 }}>
                  <strong>Status:</strong>{" "}
                  {photographer.isActive ? "Active" : "Inactive"}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ mb: 2.5 }}>
              <Typography
                sx={{
                  color: "#f43f5e",
                  borderBottom: "2px solid #f43f5e",
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
                  color: "#f43f5e",
                  borderBottom: "2px solid #f43f5e",
                  pb: 0.5,
                  fontSize: "20px",
                  fontWeight: 700,
                }}
              >
                Professional Information
              </Typography>
              <Typography sx={{ fontSize: "14px", my: 1 }}>
                <strong>Experience:</strong> {photographer.experience || 0}{" "}
                years
              </Typography>
              <Typography sx={{ fontSize: "14px", my: 1 }}>
                <strong>Rating:</strong> {photographer.rating || 0}
              </Typography>
              <Typography sx={{ fontSize: "14px", my: 1 }}>
                <strong>Camera:</strong>{" "}
                {photographer.cameraDetails || "N/A"}
              </Typography>
            </Box>

            <Box sx={{ mb: 2.5 }}>
              <Typography
                sx={{
                  color: "#f43f5e",
                  borderBottom: "2px solid #f43f5e",
                  pb: 0.5,
                  fontSize: "20px",
                  fontWeight: 700,
                }}
              >
                About
              </Typography>
              <Typography sx={{ fontSize: "14px", lineHeight: 1.6 }}>
                {photographer.about ||
                  photographer.bio ||
                  "No bio provided"}
              </Typography>
            </Box>

            <Box
              sx={{
                textAlign: "center",
                borderTop: "2px solid #f43f5e",
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

      {/* Gallery Edit Dialog */}
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
            folder="local-guider/photographers/gallery"
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

      {/* Profile Photo Edit Dialog */}
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
            folder="local-guider/photographers"
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
              bgcolor: T.rose,
              px: 3,
              "&:hover": { bgcolor: "#e11d48" },
              boxShadow: "none",
            }}
          >
            {savingPhoto ? "Saving..." : "Save"}
          </Button>
        </Box>
      </Dialog>

      {/* Image preview */}
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

export default PhotographerDetails;