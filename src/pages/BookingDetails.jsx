// src/pages/BookingDetails.jsx
import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchBookingById, clearSelected } from "../redux/slices/bookingSlice";
import {
  ArrowBack,
  Badge,
  CheckCircle as VerifiedIcon,
} from "@mui/icons-material";
import {
  Box,
  Paper,
  Typography,
  Button,
  Chip,
  Avatar,
  Stack,
  CircularProgress,
  Alert,
  Divider,
} from "@mui/material";
import {
  FaUser,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaRupeeSign,
  FaPhone,
  FaEnvelope,
  FaStickyNote,
  FaCamera,
  FaUserTie,
  FaKey,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaHourglassHalf,
} from "react-icons/fa";

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
  fontDisplay: '"Inter", system-ui, -apple-system, sans-serif',
};

const STATUS_STYLES = {
  PENDING: { bg: T.amberSoft, color: "#b45309", label: "Pending" },
  APPROVED: { bg: T.skySoft, color: "#0369a1", label: "Approved" },
  PAID: { bg: T.violetSoft, color: "#6D28D9", label: "Paid" },
  REJECTED: { bg: T.roseSoft, color: "#be123c", label: "Rejected" },
  COMPLETED: { bg: T.emeraldSoft, color: "#047857", label: "Completed" },
  CANCELLED: { bg: "#f1f5f9", color: "#475569", label: "Cancelled" },
};

const PAYMENT_STATUS_STYLES = {
  PENDING: { bg: T.amberSoft, color: "#b45309", label: "Unpaid" },
  PAID: { bg: T.emeraldSoft, color: "#047857", label: "Paid" },
  REFUNDED: { bg: T.violetSoft, color: "#6D28D9", label: "Refunded" },
};

// ═══════════════════════════════════════════════════════════════
// SECTION HEADER
// ═══════════════════════════════════════════════════════════════
const SectionHeader = ({ icon, title, subtitle, accent = T.indigo }) => (
  <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
    <Box
      sx={{
        width: 36,
        height: 36,
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
    <Box>
      <Typography
        sx={{
          fontFamily: T.fontDisplay,
          fontWeight: 700,
          fontSize: "0.95rem",
          color: T.textPrimary,
          lineHeight: 1.3,
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
// INFO ROW
// ═══════════════════════════════════════════════════════════════
const InfoRow = ({ icon, label, value }) => (
  <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ py: 1 }}>
    <Box
      sx={{
        width: 32,
        height: 32,
        borderRadius: 1.5,
        bgcolor: T.surfaceSoft,
        color: T.textMuted,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        border: `1px solid ${T.border}`,
      }}
    >
      {icon}
    </Box>
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <Typography
        sx={{
          fontSize: "0.62rem",
          fontWeight: 700,
          color: T.textFaint,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </Typography>
      <Typography
        sx={{
          fontSize: "0.85rem",
          fontWeight: 600,
          color: T.textPrimary,
          mt: 0.2,
          wordBreak: "break-word",
        }}
      >
        {value || "N/A"}
      </Typography>
    </Box>
  </Stack>
);

// ═══════════════════════════════════════════════════════════════
// ✅ NEW: STATUS TIMELINE
// ═══════════════════════════════════════════════════════════════
const StatusTimeline = ({ booking }) => {
  // Build timeline events from booking data
  const events = [];

  // Booking created
  if (booking.createdAt) {
    events.push({
      key: "created",
      label: "Booking Created",
      date: booking.createdAt,
      status: "done",
      icon: <FaClock size={12} />,
      color: T.sky,
    });
  }

  // Provider approved/rejected (if notes exist with status change)
  if (booking.status === "APPROVED" || booking.status === "REJECTED" || 
      booking.status === "PAID" || booking.status === "COMPLETED") {
    events.push({
      key: "approved",
      label: booking.status === "REJECTED" ? "Booking Rejected" : "Provider Approved",
      date: booking.updatedAt,
      status: "done",
      icon: booking.status === "REJECTED" ? <FaTimesCircle size={12} /> : <FaCheckCircle size={12} />,
      color: booking.status === "REJECTED" ? T.rose : T.sky,
    });
  }

  // Paid
  if (booking.paidAt) {
    events.push({
      key: "paid",
      label: "Payment Received",
      date: booking.paidAt,
      status: "done",
      icon: <FaRupeeSign size={12} />,
      color: T.violet,
      meta: `Method: ${booking.paymentMethod || "N/A"}`,
    });
  }

  // Completed
  if (booking.status === "COMPLETED") {
    events.push({
      key: "completed",
      label: "Booking Completed",
      date: booking.updatedAt,
      status: "done",
      icon: <FaCheckCircle size={12} />,
      color: T.emerald,
    });
  }

  // Cancelled
  if (booking.status === "CANCELLED") {
    events.push({
      key: "cancelled",
      label: "Booking Cancelled",
      date: booking.updatedAt,
      status: "done",
      icon: <FaTimesCircle size={12} />,
      color: T.rose,
      meta: booking.notes ? `Reason: ${booking.notes.slice(0, 60)}...` : null,
    });
  }

  // If no events yet, add current status
  if (events.length === 0) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: T.radius,
          border: `1px solid ${T.border}`,
          bgcolor: T.surface,
          textAlign: "center",
        }}
      >
        <Typography sx={{ fontSize: "0.8rem", color: T.textFaint }}>
          No timeline events
        </Typography>
      </Paper>
    );
  }

  return (
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
        icon={<FaHourglassHalf size={14} />}
        title="Status Timeline"
        subtitle={`${events.length} event${events.length > 1 ? "s" : ""}`}
        accent={T.sky}
      />

      <Box sx={{ position: "relative", ml: 1 }}>
        {/* Vertical line */}
        <Box
          sx={{
            position: "absolute",
            left: 11,
            top: 8,
            bottom: 8,
            width: 2,
            bgcolor: T.border,
          }}
        />

        <Stack spacing={2.5}>
          {events.map((event, idx) => (
            <Stack
              key={event.key}
              direction="row"
              spacing={2}
              alignItems="flex-start"
              sx={{ position: "relative" }}
            >
              {/* Dot */}
              <Box
                sx={{
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  bgcolor: event.color,
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  zIndex: 1,
                  boxShadow: `0 0 0 3px ${event.color}25`,
                }}
              >
                {event.icon}
              </Box>

              {/* Content */}
              <Box sx={{ flex: 1, minWidth: 0, pt: 0.3 }}>
                <Typography
                  sx={{
                    fontSize: "0.85rem",
                    fontWeight: 700,
                    color: T.textPrimary,
                  }}
                >
                  {event.label}
                </Typography>
                <Typography
                  sx={{
                    fontSize: "0.7rem",
                    color: T.textFaint,
                    mt: 0.3,
                    fontWeight: 500,
                  }}
                >
                  {new Date(event.date).toLocaleString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Typography>
                {event.meta && (
                  <Typography
                    sx={{
                      fontSize: "0.7rem",
                      color: T.textMuted,
                      mt: 0.5,
                      fontStyle: "italic",
                    }}
                  >
                    {event.meta}
                  </Typography>
                )}
              </Box>
            </Stack>
          ))}
        </Stack>
      </Box>
    </Paper>
  );
};

// ═══════════════════════════════════════════════════════════════
// ✅ NEW: PAYMENT HISTORY WIDGET
// ═══════════════════════════════════════════════════════════════
const PaymentHistory = ({ booking }) => {
  // Build payment-related events
  const payments = [];

  if (booking.paidAt && booking.paymentMethod) {
    payments.push({
      key: "payment",
      label: "Payment Received",
      amount: parseFloat(booking.totalAmount || 0),
      method: booking.paymentMethod,
      date: booking.paidAt,
      status: "success",
      icon: <FaCheckCircle size={12} />,
      color: T.emerald,
    });
  }

  if (booking.paymentStatus === "REFUNDED") {
    payments.push({
      key: "refund",
      label: "Refund Issued",
      amount: parseFloat(booking.totalAmount || 0),
      method: "Wallet",
      date: booking.updatedAt,
      status: "refund",
      icon: <FaTimesCircle size={12} />,
      color: T.violet,
    });
  }

  if (booking.status === "APPROVED" && booking.paymentStatus === "PENDING") {
    payments.push({
      key: "pending",
      label: "Payment Pending",
      amount: parseFloat(booking.totalAmount || 0),
      method: "—",
      date: booking.updatedAt,
      status: "pending",
      icon: <FaClock size={12} />,
      color: T.amber,
    });
  }

  return (
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
        icon={<FaRupeeSign size={14} />}
        title="Payment History"
        subtitle={`${payments.length} transaction${payments.length > 1 ? "s" : ""}`}
        accent={T.emerald}
      />

      {payments.length === 0 ? (
        <Box
          sx={{
            p: 3,
            borderRadius: 2,
            border: `1px dashed ${T.border}`,
            textAlign: "center",
          }}
        >
          <Typography sx={{ fontSize: "0.8rem", color: T.textFaint }}>
            No payment records
          </Typography>
        </Box>
      ) : (
        <Stack spacing={1.5}>
          {payments.map((payment) => (
            <Paper
              key={payment.key}
              elevation={0}
              sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: `${payment.color}08`,
                border: `1px solid ${payment.color}25`,
                display: "flex",
                alignItems: "center",
                gap: 1.5,
              }}
            >
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  bgcolor: payment.color,
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {payment.icon}
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  sx={{
                    fontSize: "0.82rem",
                    fontWeight: 700,
                    color: T.textPrimary,
                  }}
                >
                  {payment.label}
                </Typography>
                <Typography
                  sx={{ fontSize: "0.68rem", color: T.textFaint, mt: 0.2 }}
                >
                  {new Date(payment.date).toLocaleString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}{" "}
                  · {payment.method}
                </Typography>
              </Box>
              <Typography
                sx={{
                  fontSize: "0.95rem",
                  fontWeight: 800,
                  color: payment.color,
                  fontFamily: "monospace",
                }}
              >
                ₹{payment.amount.toFixed(2)}
              </Typography>
            </Paper>
          ))}
        </Stack>
      )}
    </Paper>
  );
};

// ═══════════════════════════════════════════════════════════════
// BOOKING DETAILS
// ═══════════════════════════════════════════════════════════════
const BookingDetails = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { selectedItem, loading, error } = useSelector((s) => s.bookings);

  useEffect(() => {
    dispatch(fetchBookingById(id));
    return () => dispatch(clearSelected());
  }, [dispatch, id]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress size={32} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <Alert severity="error" sx={{ borderRadius: 2 }}>
          {error}
        </Alert>
      </Box>
    );
  }

  if (!selectedItem) {
    return (
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <Alert severity="warning" sx={{ borderRadius: 2 }}>
          Booking not found
        </Alert>
      </Box>
    );
  }

  const booking = selectedItem;
  const user = booking.User || {};
  const place = booking.place || {};
  const guiderPlan = booking.guiderPlan || {};
  const guider = guiderPlan.guider || {};
  const guiderUser = guider.User || {};
  const photographerPlan = booking.photographerPlan || {};
  const photographer = photographerPlan.photographer || {};
  const photographerUser = photographer.User || {};

  const statusStyle = STATUS_STYLES[booking.status] || STATUS_STYLES.PENDING;
  const payStyle =
    PAYMENT_STATUS_STYLES[booking.paymentStatus] ||
    PAYMENT_STATUS_STYLES.PENDING;

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1100, mx: "auto" }}>
      {/* Back */}
      <Button
        onClick={() => navigate("/bookings")}
        startIcon={<ArrowBack sx={{ fontSize: 14 }} />}
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
        Back to Bookings
      </Button>

      {/* ═══ Header Card ═══ */}
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
            background: `linear-gradient(135deg, ${T.indigo}, ${T.violet})`,
          },
        }}
      >
        <Stack
          direction={{ xs: "column", md: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", md: "center" }}
          spacing={2}
        >
          <Stack direction="row" alignItems="center" spacing={2}>
            <Avatar
              sx={{
                width: 56,
                height: 56,
                background: `linear-gradient(135deg, ${T.indigo}, ${T.violet})`,
                color: "#fff",
                fontWeight: 800,
                fontSize: "1.25rem",
                border: "3px solid #fff",
                boxShadow: `0 6px 16px -4px ${T.indigo}55`,
              }}
            >
              <Badge sx={{ fontSize: 24 }} />
            </Avatar>
            <Box>
              <Typography
                sx={{
                  fontFamily: T.fontDisplay,
                  fontWeight: 800,
                  fontSize: "1.35rem",
                  color: T.textPrimary,
                  letterSpacing: "-0.02em",
                }}
              >
                Booking #{booking.id?.slice(0, 8)}
              </Typography>
              <Typography
                sx={{
                  fontSize: "0.72rem",
                  color: T.textMuted,
                  mt: 0.3,
                  fontWeight: 500,
                }}
              >
                Created: {new Date(booking.createdAt).toLocaleString("en-IN")}
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" spacing={1}>
            <Chip
              label={statusStyle.label}
              sx={{
                bgcolor: statusStyle.bg,
                color: statusStyle.color,
                fontWeight: 700,
                fontSize: "0.78rem",
                height: 32,
                borderRadius: 999,
                px: 1,
              }}
            />
            <Chip
              label={payStyle.label}
              sx={{
                bgcolor: payStyle.bg,
                color: payStyle.color,
                fontWeight: 700,
                fontSize: "0.78rem",
                height: 32,
                borderRadius: 999,
                px: 1,
              }}
            />
          </Stack>
        </Stack>
      </Paper>

      {/* ═══ Grid ═══ */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
          gap: 2.5,
        }}
      >
        {/* Customer Details */}
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
            icon={<FaUser size={14} />}
            title="Customer Details"
            subtitle="Who booked this trip"
            accent={T.indigo}
          />
          <InfoRow
            icon={<FaUser size={12} />}
            label="Name"
            value={`${user.firstName || ""} ${user.lastName || ""}`.trim()}
          />
          <InfoRow icon={<FaPhone size={12} />} label="Phone" value={user.phone} />
          <InfoRow icon={<FaEnvelope size={12} />} label="Email" value={user.email} />
        </Paper>

        {/* Booking Info */}
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
            icon={<FaCalendarAlt size={14} />}
            title="Booking Information"
            subtitle="Details of the booking"
            accent={T.emerald}
          />
          <InfoRow
            icon={<FaMapMarkerAlt size={12} />}
            label="Place"
            value={place.name}
          />
          <InfoRow
            icon={<FaCalendarAlt size={12} />}
            label="Booking Date"
            value={new Date(booking.bookingDate).toLocaleString("en-IN")}
          />
          <InfoRow
            icon={<FaRupeeSign size={12} />}
            label="Amount"
            value={`₹${booking.totalAmount || 0}`}
          />
          {booking.notes && (
            <InfoRow
              icon={<FaStickyNote size={12} />}
              label="Notes"
              value={booking.notes}
            />
          )}
        </Paper>

        {/* Guider Details */}
        {booking.guiderPlanId && (
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
              icon={<FaUserTie size={14} />}
              title="Guider Details"
              subtitle="Assigned tour guide"
              accent={T.violet}
            />
            <InfoRow
              icon={<FaUser size={12} />}
              label="Name"
              value={guider.fullName || guiderUser.firstName}
            />
            <InfoRow
              icon={<FaPhone size={12} />}
              label="Phone"
              value={guiderUser.phone}
            />
            <InfoRow
              icon={<FaEnvelope size={12} />}
              label="Email"
              value={guiderUser.email}
            />
            <InfoRow
              icon={<FaRupeeSign size={12} />}
              label="Plan Price"
              value={guiderPlan.price ? `₹${guiderPlan.price}` : null}
            />
          </Paper>
        )}

        {/* Photographer Details */}
        {booking.photographerPlanId && (
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
              icon={<FaCamera size={14} />}
              title="Photographer Details"
              subtitle="Assigned photographer"
              accent={T.rose}
            />
            <InfoRow
              icon={<FaUser size={12} />}
              label="Name"
              value={photographer.fullName || photographerUser.firstName}
            />
            <InfoRow
              icon={<FaPhone size={12} />}
              label="Phone"
              value={photographerUser.phone}
            />
            <InfoRow
              icon={<FaEnvelope size={12} />}
              label="Email"
              value={photographerUser.email}
            />
            <InfoRow
              icon={<FaRupeeSign size={12} />}
              label="Plan Price"
              value={photographerPlan.price ? `₹${photographerPlan.price}` : null}
            />
          </Paper>
        )}

        {/* ✅ NEW: Status Timeline */}
        <StatusTimeline booking={booking} />

        {/* ✅ NEW: Payment History */}
        <PaymentHistory booking={booking} />

        {/* OTP Info */}
        {booking.completionOtp && (
          <Box sx={{ gridColumn: { xs: "span 1", md: "span 2" } }}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: T.radius,
                border: `1px solid ${T.amber}44`,
                bgcolor: T.amberSoft,
              }}
            >
              <SectionHeader
                icon={<FaKey size={14} />}
                title="Completion OTP"
                subtitle="Used to verify trip completion"
                accent={T.amber}
              />
              <Stack direction="row" spacing={3} sx={{ flexWrap: "wrap", gap: 2 }}>
                <Box>
                  <Typography
                    sx={{
                      fontSize: "0.62rem",
                      fontWeight: 700,
                      color: "#92400e",
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                    }}
                  >
                    OTP
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: "1.5rem",
                      fontWeight: 800,
                      color: "#b45309",
                      fontFamily: "monospace",
                      letterSpacing: "0.1em",
                      mt: 0.5,
                    }}
                  >
                    {booking.completionOtp}
                  </Typography>
                </Box>
                <Box>
                  <Typography
                    sx={{
                      fontSize: "0.62rem",
                      fontWeight: 700,
                      color: "#92400e",
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                    }}
                  >
                    Expires
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: "0.85rem",
                      fontWeight: 600,
                      color: "#b45309",
                      mt: 0.5,
                    }}
                  >
                    {booking.completionOtpExpiresAt
                      ? new Date(
                          booking.completionOtpExpiresAt
                        ).toLocaleString("en-IN")
                      : "N/A"}
                  </Typography>
                </Box>
                <Box>
                  <Typography
                    sx={{
                      fontSize: "0.62rem",
                      fontWeight: 700,
                      color: "#92400e",
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                    }}
                  >
                    Status
                  </Typography>
                  <Chip
                    icon={
                      booking.completionOtpVerified ? (
                        <VerifiedIcon sx={{ fontSize: 14 }} />
                      ) : undefined
                    }
                    label={
                      booking.completionOtpVerified ? "Verified" : "Not Verified"
                    }
                    size="small"
                    sx={{
                      mt: 0.5,
                      bgcolor: booking.completionOtpVerified
                        ? T.emeraldSoft
                        : "#fff",
                      color: booking.completionOtpVerified
                        ? "#047857"
                        : "#b45309",
                      fontWeight: 700,
                      fontSize: "0.65rem",
                      height: 24,
                      borderRadius: 999,
                      "& .MuiChip-icon": {
                        color: "#047857",
                      },
                    }}
                  />
                </Box>
              </Stack>
            </Paper>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default BookingDetails;