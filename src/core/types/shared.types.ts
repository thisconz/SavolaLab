import type { Role } from "./role";
import type { SugarStage, TestType } from "./lab.types";

/** --- Enums for stricter typing --- */
export enum SampleStatus {
  REGISTERED = "REGISTERED",
  TESTING = "TESTING",
  VALIDATING = "VALIDATING",
  COMPLETED = "COMPLETED",
  APPROVED = "APPROVED",
  ARCHIVED = "ARCHIVED",
  PENDING = "PENDING",
}

export enum SamplePriority {
  NORMAL = "NORMAL",
  HIGH = "HIGH",
  STAT = "STAT",
}

export enum TestStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  DISAPPROVED = "DISAPPROVED",
  COMPLETED = "COMPLETED",
  VALIDATING = "VALIDATING",
}

export enum StatRequestStatus {
  OPEN = "OPEN",
  IN_PROGRESS = "IN_PROGRESS",
  CLOSED = "CLOSED",
}

export enum StatRequestUrgency {
  NORMAL = "NORMAL",
  HIGH = "HIGH",
  CRITICAL = "CRITICAL",
}

export enum WorkflowExecutionStatus {
  PENDING = "PENDING",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
}

export enum WorkflowStepExecutionStatus {
  PENDING = "PENDING",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
}

export enum NotificationType {
  OVERDUE_TEST = "OVERDUE_TEST",
  WORKFLOW_FAILURE = "WORKFLOW_FAILURE",
  SAMPLE_COMPLETED = "SAMPLE_COMPLETED",
}

/** --- User-related types --- */
export interface User {
  id: string;
  employee_number: string;
  username?: string;
  role: Role;
  roleType?: string;
  name: string;
  initials?: string;
  dept?: string;
  permissions: string[];

  status?: "online" | "offline" | "busy";

  online?: boolean;
}

/** --- Sample & Test types --- */
export interface Sample {
  id: number;
  batch_id: string;
  source_stage: string;
  sugar_stage?: SugarStage;
  sample_type?: string;
  line_id?: string;
  equipment_id?: string;
  shift_id?: string;
  status: SampleStatus;
  priority: SamplePriority;
  created_at: string;
  test_count: number;
}

export interface TestResult {
  id: number;
  sample_id: number;
  test_type: TestType | string;
  raw_value: number;
  calculated_value: number;
  unit: string;
  status: TestStatus;
  performed_at: string;
  performer_id?: string;
  reviewer_id?: string;
  review_at?: string;
  review_comment?: string;
  notes?: string;
  params?: Record<string, any>; // Structured JSON params
}

/** --- Stat Requests --- */
export interface StatRequest {
  id: number;
  department: string;
  reason: string;
  sample_id: number;
  status: StatRequestStatus;
  urgency?: StatRequestUrgency;
  created_at: string;
}

/** --- Workflow types --- */
export interface Workflow {
  id: number;
  name: string;
  description: string;
  target_stage: SugarStage;
  created_at: string;
  is_active: boolean;
  steps?: WorkflowStep[];
}

export interface WorkflowStep {
  id: number;
  workflow_id: number;
  test_type: TestType | string;
  sequence_order: number;
  min_value?: number;
  max_value?: number;
}

export interface WorkflowExecution {
  id: number;
  workflow_id: number;
  sample_id: number;
  status: WorkflowExecutionStatus;
  started_at: string;
  completed_at?: string;
  step_executions?: WorkflowStepExecution[];
}

export interface WorkflowStepExecution {
  id: number;
  execution_id: number;
  step_id: number;
  test_id?: number;
  result_value?: number;
  status: WorkflowStepExecutionStatus;
  started_at?: string;
  completed_at?: string;
  // Joined UI fields
  test_type?: TestType | string;
  sequence_order?: number;
}

/** --- Audit and Notification --- */
export interface AuditLog {
  id: number;
  employee_number: string;
  action: string;
  details: string;
  ip_address?: string;
  created_at: string;
}

export interface Notification {
  id: number;
  employee_number: string;
  type: NotificationType;
  message: string;
  is_read: boolean;
  created_at: string;
}
