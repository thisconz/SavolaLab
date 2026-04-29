/**
 * Drizzle ORM schema definitions.
 *
 * IMPORTANT: This file mirrors the raw SQL migrations in migrations.ts.
 * Keep both in sync. Raw migrations are the source of truth at boot;
 * this schema is used only by the Drizzle ORM client (dbOrm) for
 * type-safe queries where applicable.
 */

import { pgTable, serial, text, integer, doublePrecision, timestamp } from "drizzle-orm/pg-core";

// ─── Permissions ─────────────────────────────────────────────────────────────

export const userPermissions = pgTable("user_permissions", {
  role: text("role").primaryKey(),
  view_results: integer("view_results").default(0),
  input_data: integer("input_data").default(0),
  edit_formulas: integer("edit_formulas").default(0),
  change_specs: integer("change_specs").default(0),
});

// ─── Employees ────────────────────────────────────────────────────────────────

export const employees = pgTable("employees", {
  employee_number: text("employee_number").primaryKey(),
  national_id: text("national_id").notNull().unique(),
  dob: text("dob").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull(),
  department: text("department").notNull(),
  email: text("email").unique(),
  status: text("status").default("ACTIVE"),
});

// ─── Users (auth credentials, FK → employees) ────────────────────────────────

export const users = pgTable("users", {
  employee_number: text("employee_number").primaryKey(),
  password_hash: text("password_hash").notNull(),
  pin_hash: text("pin_hash"),
  status: text("status").default("PENDING_ACTIVATION"),
  last_login: timestamp("last_login"),
  failed_attempts: integer("failed_attempts").default(0),
  locked_until: timestamp("locked_until"),
});

// ─── Production Lines ─────────────────────────────────────────────────────────

export const productionLines = pgTable("production_lines", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  plant_id: text("plant_id").default("PLANT-01"),
});

// ─── Samples ──────────────────────────────────────────────────────────────────

export const samples = pgTable("samples", {
  id: serial("id").primaryKey(),
  batch_id: text("batch_id"),
  sample_type: text("sample_type"),
  source_stage: text("source_stage"),
  line_id: integer("line_id"),
  equipment_id: integer("equipment_id"),
  shift_id: integer("shift_id"),
  status: text("status").default("REGISTERED"),
  priority: text("priority").default("NORMAL"),
  created_at: timestamp("created_at").defaultNow(),
  technician_id: text("technician_id"),
});

// ─── Tests ────────────────────────────────────────────────────────────────────

export const tests = pgTable("tests", {
  id: serial("id").primaryKey(),
  sample_id: integer("sample_id").notNull(),
  test_type: text("test_type").notNull(),
  raw_value: doublePrecision("raw_value"),
  calculated_value: doublePrecision("calculated_value"),
  unit: text("unit"),
  status: text("status").default("PENDING"),
  performed_at: timestamp("performed_at"),
  performer_id: text("performer_id"),
  reviewer_id: text("reviewer_id"),
  review_at: timestamp("review_at"),
  review_comment: text("review_comment"),
  notes: text("notes"),
  params: text("params"),
  updated_at: timestamp("updated_at").defaultNow(),
  updated_by: text("updated_by"),
  version: integer("version").default(1),
});

// ─── Audit Logs ───────────────────────────────────────────────────────────────

export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  employee_number: text("employee_number").notNull(),
  action: text("action").notNull(),
  details: text("details").notNull(),
  ip_address: text("ip_address"),
  created_at: timestamp("created_at").defaultNow(),
});

// ─── Instruments ──────────────────────────────────────────────────────────────

export const instruments = pgTable("instruments", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  model: text("model"),
  serial_number: text("serial_number"),
  status: text("status").default("ACTIVE"),
  last_calibration: timestamp("last_calibration"),
  next_calibration: timestamp("next_calibration"),
});

// ─── Inventory ────────────────────────────────────────────────────────────────

export const inventory = pgTable("inventory", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type"),
  quantity: doublePrecision("quantity"),
  unit: text("unit"),
  expiry_date: timestamp("expiry_date"),
  min_stock: doublePrecision("min_stock"),
});

// ─── Notifications ────────────────────────────────────────────────────────────

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  employee_number: text("employee_number"),
  type: text("type"),
  message: text("message"),
  is_read: integer("is_read").default(0),
  created_at: timestamp("created_at").defaultNow(),
});

// ─── Certificates ─────────────────────────────────────────────────────────────

export const certificates = pgTable("certificates", {
  id: serial("id").primaryKey(),
  batch_id: text("batch_id"),
  status: text("status").default("DRAFT"),
  version: integer("version").default(1),
  created_at: timestamp("created_at").defaultNow(),
  approved_by: text("approved_by"),
});

// ─── STAT Requests ─────────────────────────────────────────────────────────────

export const statRequests = pgTable("stat_requests", {
  id: serial("id").primaryKey(),
  department: text("department").notNull(),
  reason: text("reason").notNull(),
  urgency: text("urgency").default("NORMAL"),
  status: text("status").default("OPEN"),
  created_at: timestamp("created_at").defaultNow(),
});

// ─── System Preferences ───────────────────────────────────────────────────────

export const systemPreferences = pgTable("system_preferences", {
  key: text("key").primaryKey(),
  value: text("value"),
});

// ─── Refresh Tokens ───────────────────────────────────────────────────────────

export const refreshTokens = pgTable("refresh_tokens", {
  id: serial("id").primaryKey(),
  employee_number: text("employee_number").notNull(),
  token_hash: text("token_hash").notNull().unique(),
  created_at: timestamp("created_at").defaultNow(),
  expires_at: timestamp("expires_at").notNull(),
  revoked_at: timestamp("revoked_at"),
  user_agent: text("user_agent"),
  ip_address: text("ip_address"),
});
