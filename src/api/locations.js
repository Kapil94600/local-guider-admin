// src/api/locations.js
// ═══════════════════════════════════════════════════════════════
// LOCATIONS API — Nominatim (OpenStreetMap) search
// Same approach as mobile LocationSearchScreen
// ═══════════════════════════════════════════════════════════════

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

// ═══════════════════════════════════════════════════════════════
// SEARCH LOCATIONS — district/city search
// ═══════════════════════════════════════════════════════════════
export const searchLocations = async (query, options = {}) => {
  if (!query || query.trim().length < 2) return [];

  const {
    countryCode = "in",       // India only by default
    limit = 15,
  } = options;

  try {
    const params = new URLSearchParams({
      q: query.trim(),
      format: "json",
      addressdetails: "1",
      limit: String(limit),
      countrycodes: countryCode,
    });

    const res = await fetch(`${NOMINATIM_URL}?${params.toString()}`, {
      headers: {
        "User-Agent": "LocalGuiderAdmin/1.0",
        Accept: "application/json",
      },
    });

    if (!res.ok) return [];

    const data = await res.json();
    if (!Array.isArray(data)) return [];

    // ═══════════════════════════════════════════════════════════
    // Normalize each result
    // ═══════════════════════════════════════════════════════════
    const seen = new Set();
    const results = [];

    for (const item of data) {
      const addr = item.address || {};

      // ✅ Extract city (multiple possible fields)
      const city =
        addr.city ||
        addr.town ||
        addr.village ||
        addr.municipality ||
        addr.suburb ||
        addr.county ||
        "";

      // ✅ Extract district
      // In India, Nominatim usually gives:
      //   - district in `county` field
      //   - sometimes in `state_district`
      const district =
        addr.state_district ||
        addr.county ||
        addr.district ||
        city ||
        "";

      const state = addr.state || addr.region || "";
      const country = addr.country || "";

      // Skip if we can't identify any location
      if (!city && !district && !state) continue;

      // Build unique key for deduplication
      const uniqueKey = `${city}|${district}|${state}`.toLowerCase();
      if (seen.has(uniqueKey)) continue;
      seen.add(uniqueKey);

      // Full display name
      const displayParts = [city, district, state, country].filter(
        (v, i, arr) => v && arr.indexOf(v) === i
      );

      results.push({
        id: String(item.place_id || uniqueKey),
        // Parsed fields
        city: city || district || state,
        district: district || city,
        state,
        country,
        // Coordinates
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
        // Display
        displayName: displayParts.join(", "),
        // Raw data for debugging
        _raw: {
          display_name: item.display_name,
          type: item.type,
          class: item.class,
        },
      });
    }

    return results;
  } catch (err) {
    console.error("Location search error:", err);
    return [];
  }
};

export default { searchLocations };