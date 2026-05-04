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

const nullableToOptional = <T extends z.ZodTypeAny>(schema: T) =>
  schema
    .nullable()
    .optional()
    .transform((v) => v ?? undefined);

// ─────────────────────────────────────────────
// Domain Schema — mirrors the DB `samples` table
// ─────────────────────────────────────────────

export const SampleSchema = z.object({
  id: z.number(),
  batch_id: nullableToOptional(z.string()),
  /** Type/classification of the sample (e.g. "Raw sugar") */
  sample_type: nullableToOptional(z.string()),
  /** Stage within the production process (e.g. "Evaporation") */
  source_stage: nullableToOptional(z.string()),
  line_id: nullableToOptional(z.union([z.string(), z.number()])),
  equipment_id: nullableToOptional(z.union([z.string(), z.number()])),
  shift_id: nullableToOptional(z.union([z.string(), z.number()])),
  status: SampleStatusSchema,
  priority: SamplePrioritySchema,
  created_at: z.union([z.string(), z.date()]).transform((d) => (typeof d === "string" ? d : d.toISOString())),
  technician_id: nullableToOptional(z.string()),
  test_count: nullableToOptional(z.number()).default(0),
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
