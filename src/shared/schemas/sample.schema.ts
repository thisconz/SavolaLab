import { z } from "zod";
import { SugarStageSchema } from "../../core/types/lab.types";

/**
 * --- Shared Enums ---
 */
export const SampleStatusSchema = z.enum([
  "REGISTERED",
  "TESTING",
  "VALIDATING",
  "COMPLETED",
  "APPROVED",
  "ARCHIVED",
  "PENDING",
]);

export const SamplePrioritySchema = z.enum(["NORMAL", "HIGH", "STAT"]);

/**
 * --- Domain Schemas ---
 */
export const SampleSchema = z.object({
  id: z.number(),
  batch_id: z.string(),
  source_stage: z.string(),
  sugar_stage: SugarStageSchema.optional(),
  sample_type: z.string().optional(),
  line_id: z.string().optional(),
  equipment_id: z.string().optional(),
  shift_id: z.string().optional(),
  status: SampleStatusSchema,
  priority: SamplePrioritySchema,
  created_at: z.string(),
  test_count: z.number(),
});

/**
 * --- API Contract Schemas ---
 */
export const CreateSampleRequestSchema = SampleSchema.omit({
  id: true,
  created_at: true,
  test_count: true,
});

export const UpdateSampleRequestSchema = CreateSampleRequestSchema.partial();

export const GetSamplesResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(SampleSchema),
});

export const GetSampleResponseSchema = z.object({
  success: z.boolean(),
  data: SampleSchema,
});

/**
 * --- Types derived from Schemas ---
 */
export type Sample = z.infer<typeof SampleSchema>;
export type SampleStatus = z.infer<typeof SampleStatusSchema>;
export type SamplePriority = z.infer<typeof SamplePrioritySchema>;
export type CreateSampleRequest = z.infer<typeof CreateSampleRequestSchema>;
export type UpdateSampleRequest = z.infer<typeof UpdateSampleRequestSchema>;
