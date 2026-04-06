import { z } from "zod";

export const StatRequestStatusSchema = z.enum(["OPEN", "IN_PROGRESS", "CLOSED"]);
export const StatRequestUrgencySchema = z.enum(["NORMAL", "HIGH", "CRITICAL"]);

export const StatRequestSchema = z.object({
  id: z.number(),
  department: z.string(),
  reason: z.string(),
  sample_id: z.number(),
  status: StatRequestStatusSchema,
  urgency: StatRequestUrgencySchema.optional(),
  created_at: z.string(),
});

export const CreateStatRequestSchema = z.object({
  department: z.string(),
  reason: z.string(),
  sample_id: z.number(),
  urgency: StatRequestUrgencySchema.optional(),
});

export const UpdateStatStatusRequestSchema = z.object({
  status: StatRequestStatusSchema,
});

export const GetStatsResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(StatRequestSchema),
});
