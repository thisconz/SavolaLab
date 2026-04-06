import { z } from "zod";

export const NotificationTypeSchema = z.enum([
  "OVERDUE_TEST",
  "WORKFLOW_FAILURE",
  "SAMPLE_COMPLETED",
]);

export const NotificationSchema = z.object({
  id: z.number(),
  employee_number: z.string(),
  type: NotificationTypeSchema,
  message: z.string(),
  is_read: z.boolean(),
  created_at: z.string(),
});

export const GetNotificationsResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(NotificationSchema),
});

export type Notification = z.infer<typeof NotificationSchema>;
