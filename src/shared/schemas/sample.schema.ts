import { z } from "zod";
import { SugarTypesSchema } from "../../core/types/lab.types";

// ─────────────────────────────────────────────
// Enums
// ─────────────────────────────────────────────

export const SampleStatusSchema = z.enum([
  "REGISTERED",
  "PENDING",
  "TESTING",
  "VALIDATING",
  "COMPLETED",
  "APPROVED",
  "ARCHIVED",
]);

export const SamplePrioritySchema = z.enum(["NORMAL", "HIGH", "STAT"]);

// ─────────────────────────────────────────────
// Domain Schema — mirrors the DB `samples` table
// ─────────────────────────────────────────────

export const SampleSchema = z.object({
  id: z.number(),
  batch_id: z.string().nullable().optional(),
  /** Type/classification of the sample (e.g. "Raw sugar") */
  sample_type: z.string().nullable().optional(),
  /** Stage within the production process (e.g. "Evaporation") */
  source_stage: z.string().nullable().optional(),
  line_id: z.union([z.string(), z.number()]).nullable().optional(),
  equipment_id: z.union([z.string(), z.number()]).nullable().optional(),
  shift_id: z.union([z.string(), z.number()]).nullable().optional(),
  status: SampleStatusSchema,
  priority: SamplePrioritySchema,
  created_at: z
    .union([z.string(), z.date()])
    .transform((d) => (typeof d === "string" ? d : d.toISOString())),
  technician_id: z.string().nullable().optional(),
  test_count: z.number().nullable().optional().default(0),
});

// ─────────────────────────────────────────────
// API Contract Schemas
// ─────────────────────────────────────────────

export const CreateSampleRequestSchema = SampleSchema.omit({
  id: true,
  created_at: true,
  test_count: true,
  technician_id: true,
}).partial();

export const UpdateSampleRequestSchema = CreateSampleRequestSchema;

export const GetSamplesResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(SampleSchema),
});

export const GetSampleResponseSchema = z.object({
  success: z.boolean(),
  data: SampleSchema,
});

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export type Sample = z.infer<typeof SampleSchema>;
export type SampleStatus = z.infer<typeof SampleStatusSchema>;
export type SamplePriority = z.infer<typeof SamplePrioritySchema>;
export type CreateSampleRequest = z.infer<typeof CreateSampleRequestSchema>;
export type UpdateSampleRequest = z.infer<typeof UpdateSampleRequestSchema>;
