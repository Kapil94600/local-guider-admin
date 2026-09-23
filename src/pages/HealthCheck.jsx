// src/pages/HealthCheck.jsx
import { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  Chip,
  Stack,
  CircularProgress,
  Avatar,
} from "@mui/material";
import {
  CheckCircle,
  Error as ErrorIcon,
  Refresh,
  Warning,
} from "@mui/icons-material";
import PanelHeader from "../components/PanelHeader";
import apiClient from "../api/axios";

// ═══════════════════════════════════════════════════════════════
// DESIGN TOKENS
// ═══════════════════════════════════════════════════════════════
const T = {
  border: "#eef1f6",
  surface: "#ffffff",
  surfaceSoft: "#fafbfc",
  textPrimary: "#0b1220",
  textMuted: "#64748b",
  textFaint: "#94a3b8",
  emerald: "#10b981",
  emeraldSoft: "#d1fae5",
  rose: "#f43f5e",
  roseSoft: "#ffe4e6",
  amber: "#f59e0b",
  amberSoft: "#fef3c7",
  radius: 3,
  fontDisplay: '"Inter", system-ui, -apple-system, sans-serif',
};

// ═══════════════════════════════════════════════════════════════
// STATUS CONFIG — covers all backend statuses
// ═══════════════════════════════════════════════════════════════
const STATUS_CONFIG = {
  connected: {
    label: "Connected",
    color: T.emerald,
    bg: T.emeraldSoft,
    icon: CheckCircle,
  },
  healthy: {
    label: "Healthy",
    color: T.emerald,
    bg: T.emeraldSoft,
    icon: CheckCircle,
  },
  configured: {
    label: "Configured",
    color: T.emerald,
    bg: T.emeraldSoft,
    icon: CheckCircle,
  },
  degraded: {
    label: "Degraded",
    color: T.amber,
    bg: T.amberSoft,
    icon: Warning,
  },
  not_configured: {
    label: "Not Configured",
    color: T.textMuted,
    bg: T.surfaceSoft,
    icon: Warning,
  },
  disconnected: {
    label: "Disconnected",
    color: T.rose,
    bg: T.roseSoft,
    icon: ErrorIcon,
  },
  unhealthy: {
    label: "Unhealthy",
    color: T.rose,
    bg: T.roseSoft,
    icon: ErrorIcon,
  },
  unknown: {
    label: "Unknown",
    color: T.textFaint,
    bg: T.surfaceSoft,
    icon: Warning,
  },
};

// ═══════════════════════════════════════════════════════════════
// STATUS ROW
// ═══════════════════════════════════════════════════════════════
const ServiceRow = ({ name, status }) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.unknown;
  const StatusIcon = config.icon;

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        borderRadius: T.radius,
        border: `1px solid ${T.border}`,
        bgcolor: T.surface,
        display: "flex",
        alignItems: "center",
        gap: 2,
      }}
    >
      <Avatar
        sx={{
          width: 44,
          height: 44,
          bgcolor: config.bg,
          color: config.color,
        }}
      >
        <StatusIcon sx={{ fontSize: 22 }} />
      </Avatar>
      <Box sx={{ flex: 1 }}>
        <Typography
          sx={{
            fontSize: "0.9rem",
            fontWeight: 700,
            color: T.textPrimary,
          }}
        >
          {name}
        </Typography>
        <Typography
          sx={{ fontSize: "0.75rem", color: T.textMuted, mt: 0.2 }}
        >
          Status: {config.label}
        </Typography>
      </Box>
      <Chip
        label={config.label}
        size="small"
        sx={{
          bgcolor: config.bg,
          color: config.color,
          fontWeight: 700,
          fontSize: "0.7rem",
          height: 24,
          borderRadius: 999,
        }}
      />
    </Paper>
  );
};

// ═══════════════════════════════════════════════════════════════
// HEALTH CHECK PAGE
// ═══════════════════════════════════════════════════════════════
const HealthCheck = () => {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastChecked, setLastChecked] = useState(null);

  const checkHealth = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient.get("/health");
      setHealth(res.data);
      setLastChecked(new Date());
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || "Health check failed"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 60000); // Refresh every 60s
    return () => clearInterval(interval);
  }, []);

  // ✅ Normalize services — always include all 3
  const services = {
    database: health?.services?.database || "unknown",
    redis: health?.services?.redis || "unknown",
    cloudinary: health?.services?.cloudinary || "not_configured",
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 900, mx: "auto" }}>
      <Box sx={{ mb: 3 }}>
        <PanelHeader eyebrow="System" title="Health Check" />
      </Box>

      {/* Summary card */}
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
          <Box>
            <Typography
              sx={{
                fontSize: "1rem",
                fontWeight: 700,
                color: T.textPrimary,
              }}
            >
              Overall Status
            </Typography>
            {lastChecked && (
              <Typography
                sx={{ fontSize: "0.72rem", color: T.textFaint, mt: 0.3 }}
              >
                Last checked: {lastChecked.toLocaleTimeString("en-IN")}
              </Typography>
            )}
          </Box>
          <Button
            onClick={checkHealth}
            disabled={loading}
            startIcon={
              loading ? (
                <CircularProgress size={14} color="inherit" />
              ) : (
                <Refresh />
              )
            }
            sx={{
              textTransform: "none",
              fontWeight: 700,
              borderRadius: 2,
              color: T.textMuted,
            }}
          >
            Refresh
          </Button>
        </Stack>

        {loading && !health ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              py: 4,
            }}
          >
            <CircularProgress size={32} />
          </Box>
        ) : error ? (
          <Box
            sx={{
              p: 2,
              borderRadius: 2,
              bgcolor: T.roseSoft,
              color: T.rose,
              textAlign: "center",
            }}
          >
            <ErrorIcon sx={{ fontSize: 32, mb: 1 }} />
            <Typography sx={{ fontWeight: 600 }}>{error}</Typography>
          </Box>
        ) : health ? (
          <Box
            sx={{
              p: 2,
              borderRadius: 2,
              bgcolor:
                health.status === "healthy" ? T.emeraldSoft : T.roseSoft,
              color:
                health.status === "healthy" ? "#047857" : "#be123c",
              textAlign: "center",
            }}
          >
            {health.status === "healthy" ? (
              <CheckCircle sx={{ fontSize: 32, mb: 1 }} />
            ) : (
              <ErrorIcon sx={{ fontSize: 32, mb: 1 }} />
            )}
            <Typography sx={{ fontWeight: 800, fontSize: "1.2rem" }}>
              {health.status?.toUpperCase() || "UNKNOWN"}
            </Typography>
            <Stack
              direction="row"
              justifyContent="center"
              spacing={2}
              sx={{ mt: 1.5, flexWrap: "wrap", gap: 2 }}
            >
              <Typography sx={{ fontSize: "0.75rem" }}>
                Uptime: <strong>{health.uptime || "N/A"}</strong>
              </Typography>
              <Typography sx={{ fontSize: "0.75rem" }}>
                Latency: <strong>{health.latency || "N/A"}</strong>
              </Typography>
              <Typography sx={{ fontSize: "0.75rem" }}>
                Env: <strong>{health.environment || "N/A"}</strong>
              </Typography>
            </Stack>
          </Box>
        ) : null}
      </Paper>

      {/* Services — always show 3, even if backend doesn't return them */}
      <Stack spacing={1.5}>
        <Typography
          sx={{
            fontSize: "0.85rem",
            fontWeight: 700,
            color: T.textMuted,
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            mt: 1,
          }}
        >
          Services
        </Typography>
        <ServiceRow name="Database" status={services.database} />
        <ServiceRow name="Redis" status={services.redis} />
        <ServiceRow name="Cloudinary" status={services.cloudinary} />
      </Stack>
    </Box>
  );
};

export default HealthCheck;