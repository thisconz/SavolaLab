import { z } from "zod";

export const StatRequestStatusSchema = z.enum(["OPEN", "IN_PROGRESS", "CLOSED"]);
export const StatRequestUrgencySchema = z.enum(["NORMAL", "HIGH", "CRITICAL"]);

export const StatRequestSchema = z.object({
  id:         z.number(),
  department: z.string(),
  reason:     z.string(),
  urgency:    StatRequestUrgencySchema.optional().default("NORMAL"),
  status:     StatRequestStatusSchema,
  created_at: z.string(),
});

export const CreateStatRequestSchema = z.object({
  department: z.string().min(1, "Department is required"),
  reason:     z.string().min(1, "Reason is required"),
  urgency:    StatRequestUrgencySchema.optional().default("NORMAL"),
});

export const UpdateStatStatusRequestSchema = z.object({
  status: StatRequestStatusSchema,
});

export const GetStatsResponseSchema = z.object({
  success: z.boolean(),
  data:    z.array(StatRequestSchema),
});