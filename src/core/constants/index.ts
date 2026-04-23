/**
 * Zenthar shared constants.
 * Import from here instead of repeating magic strings across modules.
 */

// ─── Sample status literals ───────────────────────────────────────────────────

export const SAMPLE_STATUS = {
  REGISTERED: "REGISTERED",
  PENDING: "PENDING",
  TESTING: "TESTING",
  VALIDATING: "VALIDATING",
  COMPLETED: "COMPLETED",
  APPROVED: "APPROVED",
  ARCHIVED: "ARCHIVED",
} as const;

// ─── Test status literals ─────────────────────────────────────────────────────

export const TEST_STATUS = {
  PENDING: "PENDING",
  VALIDATING: "VALIDATING",
  APPROVED: "APPROVED",
  DISAPPROVED: "DISAPPROVED",
  COMPLETED: "COMPLETED",
} as const;

// ─── Priority literals ────────────────────────────────────────────────────────

export const PRIORITY = {
  NORMAL: "NORMAL",
  HIGH: "HIGH",
  STAT: "STAT",
} as const;

// ─── Urgency literals ─────────────────────────────────────────────────────────

export const URGENCY = {
  NORMAL: "NORMAL",
  HIGH: "HIGH",
  CRITICAL: "CRITICAL",
} as const;

// ─── Roles ────────────────────────────────────────────────────────────────────

export const ROLES = {
  ADMIN: "ADMIN",
  CHEMIST: "CHEMIST",
  SHIFT_CHEMIST: "SHIFT_CHEMIST",
  ASSISTING_MANAGER: "ASSISTING_MANAGER",
  HEAD_MANAGER: "HEAD_MANAGER",
  ENGINEER: "ENGINEER",
  DISPATCH: "DISPATCH",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

// ─── Reviewer roles ───────────────────────────────────────────────────────────

export const REVIEWER_ROLES = [ROLES.SHIFT_CHEMIST, ROLES.HEAD_MANAGER, ROLES.ADMIN] as const;

// ─── Cache TTLs (ms) ──────────────────────────────────────────────────────────

export const TTL_MS = {
  SECONDS_30: 30_000,
  MINUTES_1: 60_000,
  MINUTES_5: 5 * 60_000,
  MINUTES_15: 15 * 60_000,
  MINUTES_30: 30 * 60_000,
  HOURS_1: 60 * 60_000,
} as const;

// ─── Pagination defaults ──────────────────────────────────────────────────────

export const PAGINATION = {
  DEFAULT_LIMIT: 50,
  MAX_LIMIT: 500,
  EXPORT_LIMIT: 10_000,
} as const;

// ─── API paths ────────────────────────────────────────────────────────────────

export const API_BASE = "/api";

export const API_PATHS = {
  SAMPLES: `${API_BASE}/samples`,
  TESTS: `${API_BASE}/tests`,
  STATS: `${API_BASE}/stats`,
  WORKFLOWS: `${API_BASE}/workflows`,
  NOTIFICATIONS: `${API_BASE}/notifications`,
  AUDIT: `${API_BASE}/audit-logs`,
  ANALYTICS: `${API_BASE}/analytics`,
  TELEMETRY: `${API_BASE}/telemetry`,
  SETTINGS: `${API_BASE}/settings`,
  EXPORT: `${API_BASE}/export`,
  ARCHIVE: `${API_BASE}/archive`,
  REALTIME: `${API_BASE}/realtime`,
  DISPATCH: `${API_BASE}/dispatch`,
  OPERATIONAL: `${API_BASE}/operational`,
  AUTH: `${API_BASE}/v1/directory`,
} as const;

// ─── Default test panel per stage ────────────────────────────────────────────

export const DEFAULT_TESTS: Record<string, string[]> = {
  "Raw sugar": ["Pol", "Moisture", "Colour"],
  "White sugar": ["Pol", "Moisture", "Colour", "Ash"],
  "Brown sugar": ["Pol", "Moisture", "Colour", "Ash"],
  "Raw Handling": ["Brix", "pH"],
  Refining: ["Brix", "Purity", "Colour"],
  Clarification: ["pH", "Brix"],
  Evaporation: ["Brix", "pH"],
  Crystallization: ["Brix", "Purity"],
  Centrifuge: ["Pol", "Moisture"],
} as const;
