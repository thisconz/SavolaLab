import { z } from "zod";
import { TestTypeSchema } from "../../core/types/lab.types";

export const TestStatusSchema = z.enum(["PENDING", "APPROVED", "DISAPPROVED", "COMPLETED", "VALIDATING"]);

const nullableToOptional = <T extends z.ZodTypeAny>(schema: T) =>
  schema
    .nullable()
    .optional()
    .transform((v) => v ?? undefined);

export const TestResultSchema = z.object({
  id: z.number(),
  sample_id: z.number(),
  test_type: TestTypeSchema,
  raw_value: z.number(),
  calculated_value: z.number(),
  unit: z.string(),
  status: TestStatusSchema,
  performed_at: z
    .union([z.string(), z.date()])
    .transform((d) => (typeof d === "string" ? d : d.toISOString())),
  performer_id: nullableToOptional(z.string()),
  reviewer_id: nullableToOptional(z.string()),
  review_at: z
    .union([z.string(), z.date()])
    .nullable()
    .optional()
    .transform((d) => (d ? (typeof d === "string" ? d : d.toISOString()) : undefined)),
  review_comment: nullableToOptional(z.string()),
  notes: nullableToOptional(z.string()),
  params: z.record(z.string(), z.any()).optional().nullable(),
});

export const CreateTestRequestSchema = z.object({
  sample_id: z.number(),
  test_type: TestTypeSchema,
  raw_value: z.number(),
  calculated_value: z.number(),
  unit: z.string(),
  status: TestStatusSchema.optional(),
  notes: nullableToOptional(z.string()),
  params: z.record(z.string(), z.any()).optional().nullable(),
});

export const UpdateTestRequestSchema = z.object({
  raw_value: z.number().nullish(),
  calculated_value: z.number().nullish(),
  unit: z.string().nullish(),
  status: TestStatusSchema.optional(),
  notes: nullableToOptional(z.string()),
  params: z.record(z.string(), z.any()).optional().nullable(),
});

export const ReviewTestRequestSchema = z.object({
  status: z.enum(["APPROVED", "DISAPPROVED"]),
  comment: nullableToOptional(z.string()),
});

export const GetTestsResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(TestResultSchema),
});
