import { db } from "../../core/database";
import { logger } from "../../core/logger";
import { NotificationRepository } from "./repository";
import { domainBus } from "../../core/events/domain-bus";
import { Notification } from "../../../src/shared/schemas/notification.schema";

export const NotificationService = {
  getNotifications: (employeeNumber: string): Promise<Notification[]> =>
    NotificationRepository.findByEmployeeNumber(employeeNumber),

  markAsRead: (id: string, employeeNumber: string) =>
    NotificationRepository.markAsRead(id, employeeNumber),

  markAllAsRead: (employeeNumber: string) =>
    NotificationRepository.markAllAsRead(employeeNumber),

  /**
   * Checks for overdue pending tests (> 4h) and creates notifications.
   * Also pushes SSE events to the relevant technicians so their UI updates
   * immediately without polling.
   */
  checkOverdueTests: async (): Promise<number> => {
    const sseQueue: Array<{ recipientId: string; message: string }> = [];

    await db.transaction(async (client) => {
      const overdueTests = await client.query<{
        id: number;
        test_type: string;
        batch_id: string | null;
        performer_id: string | null;
        technician_id: string | null;
      }>(
        `SELECT t.id, t.test_type, s.batch_id, t.performer_id, s.technician_id
         FROM tests t
         INNER JOIN samples s ON t.sample_id = s.id
         WHERE t.status = 'PENDING'
           AND t.updated_at < NOW() - interval '4 hours'`,
      );

      for (const test of overdueTests as any[]) {
        const recipientId = test.performer_id || test.technician_id;
        if (!recipientId) continue;

        const message = `Test ${test.test_type} for Batch ${test.batch_id} is overdue.`;

        const alreadyNotified = await client.queryOne<{ id: number }>(
          `SELECT id FROM notifications
           WHERE employee_number = $1
             AND type = 'OVERDUE_TEST'
             AND created_at >= DATE_TRUNC('hour', CURRENT_TIMESTAMP)
           LIMIT 1`,
          [recipientId],
        );

        if (!alreadyNotified) {
          await client.execute(
            `INSERT INTO notifications (employee_number, type, message)
             VALUES ($1, 'OVERDUE_TEST', $2)`,
            [recipientId, message],
          );
          sseQueue.push({ recipientId, message });
        }
      }
    });

    // Transaction committed — safe to push SSE events
    for (const { recipientId, message } of sseQueue) {
      domainBus.publish({
        type: "NOTIFICATION_PUSHED",
        target: recipientId,
        payload: { type: "OVERDUE_TEST", message },
      });
    }

    if (sseQueue.length > 0) {
      logger.info({ count: sseQueue.length }, "Overdue test notifications generated");
    }

    return sseQueue.length;
  },

  /**
   * Create a targeted notification and immediately push SSE.
   */
  pushNotification: async (
    employeeNumber: string,
    type: string,
    message: string,
  ): Promise<void> => {
    await NotificationRepository.create(employeeNumber, type, message);
    domainBus.publish({
      type: "NOTIFICATION_PUSHED",
      target: employeeNumber,
      payload: { type, message },
    });
  },
};
