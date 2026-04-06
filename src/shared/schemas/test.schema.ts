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
  performed_at: z.string(),
  performer_id: z.string().optional(),
  reviewer_id: z.string().optional(),
  review_at: z.string().optional(),
  review_comment: z.string().optional(),
  notes: z.string().optional(),
  params: z.record(z.string(), z.any()).optional().nullable(),
});

export const CreateTestRequestSchema = z.object({
  sample_id: z.number(),
  test_type: TestTypeSchema,
  raw_value: z.number(),
  calculated_value: z.number(),
  unit: z.string(),
  status: TestStatusSchema.optional(),
  notes: z.string().optional(),
  params: z.record(z.string(), z.any()).optional().nullable(),
});

export const UpdateTestRequestSchema = z.object({
  raw_value: z.number().optional(),
  calculated_value: z.number().optional(),
  unit: z.string().optional(),
  status: TestStatusSchema.optional(),
  notes: z.string().optional(),
  params: z.record(z.string(), z.any()).optional().nullable(),
});

export const ReviewTestRequestSchema = z.object({
  status: z.enum(["APPROVED", "DISAPPROVED"]),
  comment: z.string().optional(),
});

export const GetTestsResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(TestResultSchema),
});
