import { z } from "zod";
import { TestTypeSchema, SugarStageSchema } from "../../core/types/lab.types";

export const WorkflowStepSchema = z.object({
  id: z.number().optional(),
  workflow_id: z.number().optional(),
  test_type: TestTypeSchema,
  sequence_order: z.number(),
  min_value: z.number().optional().nullable(),
  max_value: z.number().optional().nullable(),
});

export const WorkflowSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string(),
  target_stage: SugarStageSchema,
  created_at: z.string(),
  is_active: z.boolean(),
  steps: z.array(WorkflowStepSchema).optional(),
});

export const CreateWorkflowRequestSchema = z.object({
  name: z.string(),
  description: z.string(),
  target_stage: z.string(),
  steps: z.array(WorkflowStepSchema),
});

export const ExecuteWorkflowRequestSchema = z.object({
  sample_id: z.number(),
});

export const CompleteStepRequestSchema = z.object({
  status: z.enum(["COMPLETED", "FAILED"]),
  test_id: z.number().optional(),
  result_value: z.number().optional(),
});

export const GetWorkflowsResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(WorkflowSchema),
});
