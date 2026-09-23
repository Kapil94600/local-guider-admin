// src/utils/logger.js
// ═══════════════════════════════════════════════════════════════
// LOGGER — Production-safe logging
// ═══════════════════════════════════════════════════════════════

const isDev = import.meta.env.DEV;

export const logger = {
  info: (...args) => {
    if (isDev) console.log("[INFO]", ...args);
  },
  warn: (...args) => {
    if (isDev) console.warn("[WARN]", ...args);
  },
  error: (...args) => {
    console.error("[ERROR]", ...args);
  },
  debug: (...args) => {
    if (isDev) console.log("[DEBUG]", ...args);
  },
};

export default logger;
