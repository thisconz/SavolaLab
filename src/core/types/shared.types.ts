import { z } from "zod";
import {
  SampleStatusSchema,
  SamplePrioritySchema,
  SampleSchema
} from "../../shared/schemas/sample.schema";
import { UserSchema } from "../../shared/schemas/auth.schema";
import { TestResultSchema, TestStatusSchema } from "../../shared/schemas/test.schema";
import {
  StatRequestSchema,
  StatRequestStatusSchema,
  StatRequestUrgencySchema
} from "../../shared/schemas/stat.schema";
import { WorkflowSchema, WorkflowStepSchema } from "../../shared/schemas/workflow.schema";
import { NotificationSchema, NotificationTypeSchema } from "../../shared/schemas/notification.schema";
import { AuditLogSchema } from "../../shared/schemas/audit.schema";
import { TestType } from "./lab.types";

/** --- Enums from Schemas --- */
export type SampleStatus = z.infer<typeof SampleStatusSchema>;
export const SampleStatus = SampleStatusSchema.enum;

export type SamplePriority = z.infer<typeof SamplePrioritySchema>;
export const SamplePriority = SamplePrioritySchema.enum;

export type TestStatus = z.infer<typeof TestStatusSchema>;
export const TestStatus = TestStatusSchema.enum;

export type StatRequestStatus = z.infer<typeof StatRequestStatusSchema>;
export const StatRequestStatus = StatRequestStatusSchema.enum;

export type StatRequestUrgency = z.infer<typeof StatRequestUrgencySchema>;
export const StatRequestUrgency = StatRequestUrgencySchema.enum;

export enum WorkflowExecutionStatus {
  PENDING     = "PENDING",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED   = "COMPLETED",
  FAILED      = "FAILED",
}

export enum WorkflowStepExecutionStatus {
  PENDING     = "PENDING",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED   = "COMPLETED",
  FAILED      = "FAILED",
}

export type NotificationType = z.infer<typeof NotificationTypeSchema>;
export const NotificationType = NotificationTypeSchema.enum;

/** --- Domain Types --- */
export type User        = z.infer<typeof UserSchema>;
export type Sample      = z.infer<typeof SampleSchema>;
export type TestResult  = z.infer<typeof TestResultSchema>;
export type StatRequest = z.infer<typeof StatRequestSchema>;
export type Workflow    = z.infer<typeof WorkflowSchema>;
export type WorkflowStep = z.infer<typeof WorkflowStepSchema>;
export type AuditLog    = z.infer<typeof AuditLogSchema>;
export type Notification = z.infer<typeof NotificationSchema>;

/** --- Execution Types (UI-specific) --- */
export interface WorkflowExecution {
  id:           number;
  workflow_id:  number;
  sample_id:    number;
  status:       WorkflowExecutionStatus;
  started_at?:   string;
  completed_at?: string;
  step_executions?: WorkflowStepExecution[];
}

export interface WorkflowStepExecution {
  id:            number;
  execution_id:  number;
  step_id:       number;
  status:         WorkflowStepExecutionStatus;
  started_at?:   string;
  completed_at?: string;
  test_id?:      number;
  result_value?: number;
  sequence_order?: number;
  test_type?:    TestType;
  min_value?:    number;
  max_value?:    number;
}