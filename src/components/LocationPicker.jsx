// src/components/LocationPicker.jsx
// ═══════════════════════════════════════════════════════════════
// LOCATION PICKER — District search with auto-fill
// Same UX as mobile LocationSearchScreen
// ═══════════════════════════════════════════════════════════════
import { useState, useEffect, useRef, useCallback } from "react";
import {
  Box,
  TextField,
  Paper,
  Typography,
  Stack,
  Chip,
  CircularProgress,
  InputAdornment,
  IconButton,
  Alert,
  Divider,
  Button,
} from "@mui/material";
import {
  Search as SearchIcon,
  Close as CloseIcon,
  LocationOn as LocationIcon,
  CheckCircle as CheckIcon,
} from "@mui/icons-material";
import { searchLocations } from "../api/locations";
import { toast } from "react-toastify";

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
  emerald: "#10b981",
  emeraldSoft: "#d1fae5",
  radius: 3,
  fontDisplay: '"Inter", system-ui, -apple-system, sans-serif',
};

const LocationPicker = ({
  value = null,           // { city, district, state, lat, lng }
  onChange,               // (location) => void
  label = "Location",
  required = false,
  helperText = "",
  disabled = false,
}) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [error, setError] = useState(null);

  const debounceRef = useRef(null);
  const abortRef = useRef(0);
  const containerRef = useRef(null);

  // ═══════════════════════════════════════════════════════════
  // SEARCH — debounced
  // ═══════════════════════════════════════════════════════════
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const trimmed = query.trim();

    if (trimmed.length < 2) {
      setResults([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    const reqId = ++abortRef.current;

    debounceRef.current = setTimeout(async () => {
      const locations = await searchLocations(trimmed);
      if (reqId !== abortRef.current) return;

      setResults(locations);
      setLoading(false);
      setShowDropdown(true);

      if (locations.length === 0) {
        setError("No locations found. Try a different name.");
      }
    }, 450);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  // ═══════════════════════════════════════════════════════════
  // CLICK OUTSIDE — close dropdown
  // ═══════════════════════════════════════════════════════════
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ═══════════════════════════════════════════════════════════
  // HANDLERS
  // ═══════════════════════════════════════════════════════════
  const handleSelect = useCallback(
    (location) => {
      onChange({
        city: location.city,
        district: location.district,
        state: location.state,
        country: location.country,
        lat: location.lat,
        lng: location.lng,
      });
      setQuery("");
      setResults([]);
      setShowDropdown(false);
      setError(null);
      toast.success(`Location set: ${location.displayName}`);
    },
    [onChange]
  );

  const handleClear = useCallback(() => {
    onChange(null);
    setQuery("");
    setResults([]);
    setError(null);
  }, [onChange]);

  const handleManualOverride = useCallback(() => {
    // Allow manual lat/lng entry
    const lat = window.prompt("Enter latitude:");
    if (lat === null) return;
    const lng = window.prompt("Enter longitude:");
    if (lng === null) return;

    onChange({
      city: value?.city || "",
      district: value?.district || "",
      state: value?.state || "",
      country: value?.country || "India",
      lat: parseFloat(lat),
      lng: parseFloat(lng),
    });
  }, [value, onChange]);

  // ═══════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════
  return (
    <Box ref={containerRef}>
      <Typography
        sx={{
          fontSize: "0.72rem",
          fontWeight: 700,
          color: T.textMuted,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          mb: 1,
        }}
      >
        {label} {required && <span style={{ color: "#f43f5e" }}>*</span>}
      </Typography>

      {/* ═══ SELECTED LOCATION ═══ */}
      {value?.city || value?.district ? (
        <Paper
          elevation={0}
          sx={{
            p: 2,
            borderRadius: 2,
            border: `1px solid ${T.emeraldSoft}`,
            bgcolor: T.emeraldSoft,
            mb: 1.5,
          }}
        >
          <Stack spacing={1}>
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
            >
              <Stack direction="row" alignItems="center" spacing={1}>
                <CheckIcon sx={{ fontSize: 18, color: "#047857" }} />
                <Typography
                  sx={{ fontSize: "0.85rem", fontWeight: 700, color: "#047857" }}
                >
                  Location selected
                </Typography>
              </Stack>
              {!disabled && (
                <IconButton
                  size="small"
                  onClick={handleClear}
                  sx={{ color: "#047857" }}
                >
                  <CloseIcon sx={{ fontSize: 16 }} />
                </IconButton>
              )}
            </Stack>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(4, 1fr)" },
                gap: 1.5,
              }}
            >
              {value.city && (
                <Box>
                  <Typography
                    sx={{
                      fontSize: "0.6rem",
                      fontWeight: 700,
                      color: "#065f46",
                      letterSpacing: "0.05em",
                      textTransform: "uppercase",
                    }}
                  >
                    City
                  </Typography>
                  <Typography
                    sx={{ fontSize: "0.8rem", fontWeight: 600, color: "#047857" }}
                  >
                    {value.city}
                  </Typography>
                </Box>
              )}
              {value.district && (
                <Box>
                  <Typography
                    sx={{
                      fontSize: "0.6rem",
                      fontWeight: 700,
                      color: "#065f46",
                      letterSpacing: "0.05em",
                      textTransform: "uppercase",
                    }}
                  >
                    District
                  </Typography>
                  <Typography
                    sx={{ fontSize: "0.8rem", fontWeight: 600, color: "#047857" }}
                  >
                    {value.district}
                  </Typography>
                </Box>
              )}
              {value.state && (
                <Box>
                  <Typography
                    sx={{
                      fontSize: "0.6rem",
                      fontWeight: 700,
                      color: "#065f46",
                      letterSpacing: "0.05em",
                      textTransform: "uppercase",
                    }}
                  >
                    State
                  </Typography>
                  <Typography
                    sx={{ fontSize: "0.8rem", fontWeight: 600, color: "#047857" }}
                  >
                    {value.state}
                  </Typography>
                </Box>
              )}
              {value.lat != null && value.lng != null && (
                <Box>
                  <Typography
                    sx={{
                      fontSize: "0.6rem",
                      fontWeight: 700,
                      color: "#065f46",
                      letterSpacing: "0.05em",
                      textTransform: "uppercase",
                    }}
                  >
                    Coordinates
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: "0.7rem",
                      fontWeight: 500,
                      color: "#047857",
                      fontFamily: "monospace",
                    }}
                  >
                    {value.lat.toFixed(4)}, {value.lng.toFixed(4)}
                  </Typography>
                </Box>
              )}
            </Box>

            {!disabled && (
              <Box sx={{ pt: 0.5 }}>
                <Button
                  size="small"
                  onClick={handleManualOverride}
                  sx={{
                    textTransform: "none",
                    fontSize: "0.7rem",
                    color: "#047857",
                    fontWeight: 600,
                  }}
                >
                  Override coordinates manually
                </Button>
              </Box>
            )}
          </Stack>
        </Paper>
      ) : null}

      {/* ═══ SEARCH INPUT ═══ */}
      <Box sx={{ position: "relative" }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Search district, city (e.g., Sikar, Fatehpur, Jaipur)"
          value={query}
          disabled={disabled}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (results.length > 0) setShowDropdown(true);
          }}
          autoComplete="off"
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  {loading ? (
                    <CircularProgress size={16} sx={{ color: T.indigo }} />
                  ) : (
                    <SearchIcon sx={{ fontSize: 18, color: T.textFaint }} />
                  )}
                </InputAdornment>
              ),
              endAdornment: query && (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={() => {
                      setQuery("");
                      setResults([]);
                      setError(null);
                    }}
                  >
                    <CloseIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
          sx={{
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
        />

        {/* ═══ DROPDOWN ═══ */}
        {showDropdown && (query.trim().length >= 2) && (
          <Paper
            elevation={4}
            sx={{
              position: "absolute",
              top: "calc(100% + 4px)",
              left: 0,
              right: 0,
              zIndex: 1300,
              maxHeight: 320,
              overflowY: "auto",
              borderRadius: 2,
              border: `1px solid ${T.border}`,
            }}
          >
            {loading ? (
              <Box sx={{ p: 3, textAlign: "center" }}>
                <CircularProgress size={24} sx={{ color: T.indigo }} />
                <Typography
                  sx={{ mt: 1, fontSize: "0.75rem", color: T.textMuted }}
                >
                  Searching...
                </Typography>
              </Box>
            ) : results.length === 0 ? (
              <Box sx={{ p: 3, textAlign: "center" }}>
                <LocationIcon
                  sx={{ fontSize: 32, color: T.textFaint, mb: 1 }}
                />
                <Typography
                  sx={{ fontSize: "0.8rem", color: T.textMuted, fontWeight: 600 }}
                >
                  {error || "No locations found"}
                </Typography>
                <Typography
                  sx={{ fontSize: "0.7rem", color: T.textFaint, mt: 0.5 }}
                >
                  Try different spelling or a nearby city
                </Typography>
              </Box>
            ) : (
              results.map((loc, idx) => (
                <Box key={loc.id}>
                  <Box
                    onClick={() => handleSelect(loc)}
                    sx={{
                      px: 2,
                      py: 1.5,
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                      "&:hover": { bgcolor: T.indigoSoft },
                    }}
                  >
                    <Stack direction="row" alignItems="center" spacing={1.5}>
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
                          flexShrink: 0,
                        }}
                      >
                        <LocationIcon sx={{ fontSize: 16 }} />
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography
                          sx={{
                            fontSize: "0.82rem",
                            fontWeight: 700,
                            color: T.textPrimary,
                            lineHeight: 1.3,
                          }}
                          noWrap
                        >
                          {loc.city || loc.district || loc.state}
                        </Typography>
                        <Typography
                          sx={{
                            fontSize: "0.7rem",
                            color: T.textMuted,
                            mt: 0.2,
                          }}
                          noWrap
                        >
                          {loc.displayName}
                        </Typography>
                      </Box>
                      <Stack direction="row" spacing={0.5}>
                        {loc.district && loc.district !== loc.city && (
                          <Chip
                            label={loc.district}
                            size="small"
                            sx={{
                              height: 20,
                              fontSize: "0.6rem",
                              fontWeight: 700,
                              bgcolor: "#fef3c7",
                              color: "#b45309",
                              borderRadius: 999,
                            }}
                          />
                        )}
                        {loc.state && (
                          <Chip
                            label={loc.state}
                            size="small"
                            sx={{
                              height: 20,
                              fontSize: "0.6rem",
                              fontWeight: 700,
                              bgcolor: T.indigoSoft,
                              color: T.indigo,
                              borderRadius: 999,
                            }}
                          />
                        )}
                      </Stack>
                    </Stack>
                  </Box>
                  {idx < results.length - 1 && (
                    <Divider sx={{ borderColor: T.border }} />
                  )}
                </Box>
              ))
            )}
          </Paper>
        )}
      </Box>

      {/* ═══ HINT ═══ */}
      {helperText && !value?.city && (
        <Typography
          sx={{ fontSize: "0.68rem", color: T.textFaint, mt: 1, ml: 0.5 }}
        >
          {helperText}
        </Typography>
      )}

      {/* ═══ INFO ═══ */}
      {!value?.city && !helperText && (
        <Alert
          severity="info"
          icon={false}
          sx={{
            mt: 1.5,
            bgcolor: T.surfaceSoft,
            border: `1px dashed ${T.border}`,
            borderRadius: 2,
            fontSize: "0.72rem",
            color: T.textMuted,
            "& .MuiAlert-message": { fontSize: "0.72rem" },
          }}
        >
          <strong>Tip:</strong> Start typing district/city name — dropdown se
          select karo. City, district, state aur coordinates auto-fill ho
          jayenge.
        </Alert>
      )}
    </Box>
  );
};

export default LocationPicker;