import { z } from "zod";

/**
 * We use z.string() instead of a strict enum so the frontend gracefully
 * handles notification types that haven't been hard-coded here yet
 * (e.g. custom rules created via the notification_rules table).
 */
export const NotificationTypeSchema = z.enum([
  "OVERDUE_TEST",
  "WORKFLOW_FAILURE",
  "SAMPLE_COMPLETED",
]);

// Lenient schema for API responses — accepts any string type from the DB
export const NotificationSchema = z.object({
  id:              z.number(),
  employee_number: z.string(),
  type:            z.string(),           // intentionally loose
  message:         z.string(),
  is_read:         z.boolean(),
  created_at:      z.string(),
});

export const GetNotificationsResponseSchema = z.object({
  success: z.boolean(),
  data:    z.array(NotificationSchema),
});

export type Notification     = z.infer<typeof NotificationSchema>;
export type NotificationType = z.infer<typeof NotificationTypeSchema>;