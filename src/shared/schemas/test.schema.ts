import { z } from "zod";
import { TestTypeSchema } from "../../core/types/lab.types";

export const TestStatusSchema = z.enum([
  "PENDING",
  "APPROVED",
  "DISAPPROVED",
  "COMPLETED",
  "VALIDATING",
]);

export const TestResultSchema = z.object({
  id: z.number(),
  sample_id: z.number(),
  test_type: TestTypeSchema,
  raw_value: z.number(),
  calculated_value: z.number(),
  unit: z.string(),
  status: TestStatusSchema,
  performed_at: z.union([z.string(), z.date()]).transform(d => typeof d === "string" ? d : d.toISOString()),
  performer_id: z.string().nullish(),
  reviewer_id: z.string().nullish(),
  review_at: z.union([z.string(), z.date()]).nullish().transform(d => d ? (typeof d === "string" ? d : d.toISOString()) : null),
  review_comment: z.string().nullish(),
  notes: z.string().nullish(),
  params: z.record(z.string(), z.any()).optional().nullable(),
});

export const CreateTestRequestSchema = z.object({
  sample_id: z.number(),
  test_type: TestTypeSchema,
  raw_value: z.number(),
  calculated_value: z.number(),
  unit: z.string(),
  status: TestStatusSchema.optional(),
  notes: z.string().nullish(),
  params: z.record(z.string(), z.any()).optional().nullable(),
});

export const UpdateTestRequestSchema = z.object({
  raw_value: z.number().nullish(),
  calculated_value: z.number().nullish(),
  unit: z.string().nullish(),
  status: TestStatusSchema.optional(),
  notes: z.string().nullish(),
  params: z.record(z.string(), z.any()).optional().nullable(),
});

export const ReviewTestRequestSchema = z.object({
  status: z.enum(["APPROVED", "DISAPPROVED"]),
  comment: z.string().nullish(),
});

export const GetTestsResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(TestResultSchema),
});
