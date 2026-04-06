import { z } from "zod";

export const AuditLogSchema = z.object({
  id: z.number(),
  employee_number: z.string(),
  action: z.string(),
  details: z.string(),
  ip_address: z.string(),
  created_at: z.string(),
});

export const CreateAuditLogRequestSchema = z.object({
  action: z.string().min(1).max(100),
  details: z.any(),
});

export const GetAuditLogsResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(AuditLogSchema),
});
