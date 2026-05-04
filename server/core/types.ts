// ─────────────────────────────────────────────
// Types and interfaces for user management and permissions
// ─────────────────────────────────────────────

// --- User and Permissions ---
export type UserRole =
  | "ADMIN"
  | "CHEMIST"
  | "SHIFT_CHEMIST"
  | "ASSISTING_MANAGER"
  | "HEAD_MANAGER"
  | "ENGINEER"
  | "DISPATCH";

export interface User {
  employee_number: string;
  name: string;
  role: UserRole;
  dept: string;
  permissions: PermissionFlags;
}

export interface PermissionFlags {
  view_results: 0 | 1;
  input_data: 0 | 1;
  edit_formulas: 0 | 1;
  change_specs: 0 | 1;
}

// --- Sample and Testing ---
export interface SampleType {
  id?: number;
  name: string;
  category: "STAGE" | "PRODUCT" | "LIQUID" | "UTILITY";
  description?: string; // optional if not always used
}

export interface SampleData {
  batch_id?: string;
  sample_type?: string;
  source_stage?: string;
  priority?: string;
  line_id?: string | number | undefined;
  equipment_id?: string | number | undefined;
  shift_id?: string | number | undefined;
  status?: string;
}

export interface TestResultSummary {
  raw_value: number;
  performed_at: string;
  batch_id: string;
}

export interface SampleTest {
  id: number;
  sample_id: number;
  test_type: string;
  status: "PENDING" | "APPROVED" | "DISAPPROVED" | "COMPLETED" | "VALIDATING";
}

// --- Variables and Export ---
export interface Variables {
  user: User;
  requestId: string;
  clientIp?: string;
}

// --- Export ---
export type ExportType = "samples" | "tests" | "audit" | "certificates" | "instruments" | "inventory";

export interface ExportOptions {
  type: ExportType;
  filters?: Record<string, string | undefined>;
  limit?: number;
}

// --- Telemetry ---
export interface TelemetryMetrics {
  cpuLoad: string;
  memory: string;
  latency: string;
  dbSync: "ACTIVE" | "INACTIVE";
  uptime: string;
  activeUsers: number;
  errorRate: string;
  throughput: string;
  stats: {
    samples: number;
    pending: number;
    lastAudit: string | undefined;
  };
}

export interface TelemetryFilter {
  startDate?: string;
  endDate?: string;
}

// --- Workflow ---
export interface WorkflowStepInput {
  test_type: string;
  min_value?: number | undefined;
  max_value?: number | undefined;
}

// --- Operational Data ---
export interface Pagination {
  limit?: number;
  offset?: number;
}
export type EquipmentFilter = { lineId?: string } & Pagination;
// ─────────────────────────────────────────────
// Permission helpers
// ─────────────────────────────────────────────

export function can(user: User, perm: keyof PermissionFlags): boolean {
  return user.permissions[perm] === 1;
}

export const REVIEWER_ROLES: UserRole[] = ["SHIFT_CHEMIST", "HEAD_MANAGER", "ADMIN"];

export function isReviewer(role: string): role is UserRole {
  return REVIEWER_ROLES.includes(role as UserRole);
}
