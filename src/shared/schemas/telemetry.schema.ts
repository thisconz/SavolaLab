import { z } from "zod";

export const TelemetryFilterSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export const TelemetryDataSchema = z.object({
  totalSamples: z.number(),
  completedSamples: z.number(),
  inProgressSamples: z.number(),
  pendingSamples: z.number(),
  totalTests: z.number(),
  approvedTests: z.number(),
  disapprovedTests: z.number(),
  pendingTests: z.number(),
  recentActivity: z.array(z.any()),
});

export const GetTelemetryResponseSchema = z.object({
  success: z.boolean(),
  data: TelemetryDataSchema,
});
