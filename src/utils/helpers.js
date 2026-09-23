// src/utils/helpers.js

// ═══════════════════════════════════════════════════════════════
// DATE FORMATTERS
// ═══════════════════════════════════════════════════════════════

/**
 * Format a date string/Date to "DD Mon YYYY" using LOCAL timezone.
 * Handles null/undefined/invalid gracefully.
 */
export const formatDate = (date) => {
  if (!date) return "—";
  try {
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "—";
  }
};

/**
 * Format with time — "DD Mon YYYY, HH:MM AM/PM"
 */
export const formatDateTime = (date) => {
  if (!date) return "—";
  try {
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
};

/**
 * Relative time — "Just now", "5m ago", "2h ago", "3d ago"
 */
export const formatRelativeTime = (date) => {
  if (!date) return "—";
  try {
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) return "—";

    const diffMs = Date.now() - d.getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;

    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;

    const days = Math.floor(hrs / 24);
    if (days < 30) return `${days}d ago`;

    return formatDate(d);
  } catch {
    return "—";
  }
};

// ═══════════════════════════════════════════════════════════════
// NUMBER / CURRENCY FORMATTERS
// ═══════════════════════════════════════════════════════════════

/**
 * Format currency in INR with ₹ symbol.
 * Handles null/undefined/NaN gracefully.
 */
export const formatCurrency = (amount) => {
  const num = Number(amount);
  if (isNaN(num)) return "₹0";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(num);
};

/**
 * Format number with Indian comma grouping — 1,23,456
 */
export const formatNumber = (num) => {
  const n = Number(num);
  if (isNaN(n)) return "0";
  return n.toLocaleString("en-IN");
};

// ═══════════════════════════════════════════════════════════════
// STRING FORMATTERS
// ═══════════════════════════════════════════════════════════════

/**
 * Truncate string to `n` chars with ellipsis.
 * Guards against non-string input.
 */
export const truncate = (str, n = 30) => {
  if (typeof str !== "string") return "—";
  if (str.length <= n) return str;
  return str.substring(0, n) + "…";
};

/**
 * Capitalize first letter of string.
 */
export const capitalize = (str) => {
  if (typeof str !== "string" || !str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
};

/**
 * Format name from parts.
 */
export const formatFullName = (firstName, lastName) => {
  return `${firstName || ""} ${lastName || ""}`.trim() || "—";
};

// ═══════════════════════════════════════════════════════════════
// MISC HELPERS
// ═══════════════════════════════════════════════════════════════

/**
 * Debounce helper — delays function execution.
 */
export const debounce = (fn, delay = 300) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
};

/**
 * Safe JSON parse with fallback.
 */
export const safeJsonParse = (str, fallback = null) => {
  if (typeof str !== "string") return fallback;
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
};