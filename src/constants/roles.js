// src/constants/roles.js
// ═══════════════════════════════════════════════════════════════
// SINGLE SOURCE OF TRUTH for admin roles
// ═══════════════════════════════════════════════════════════════

export const ADMIN_ROLES = ["ADMIN"];

export const ALL_ROLES = {
  ADMIN: "ADMIN",
  USER: "USER",
  GUIDER: "GUIDER",
  PHOTOGRAPHER: "PHOTOGRAPHER",
};

export const isAdminRole = (role) => ADMIN_ROLES.includes(role);
