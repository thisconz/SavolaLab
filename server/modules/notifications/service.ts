import { db } from "../../core/database";
import { logger } from "../../core/logger";
import { NotificationRepository } from "./repository";
import { sseBus } from "../../core/sse";
import { Notification } from "../../../src/shared/schemas/notification.schema";

export const NotificationService = {
  getNotifications: async (employeeNumber: string): Promise<Notification[]> => {
    return NotificationRepository.findByEmployeeNumber(employeeNumber);
  },

  markAsRead: async (id: string, employeeNumber: string) => {
    return NotificationRepository.markAsRead(id, employeeNumber);
  },

  markAllAsRead: async (employeeNumber: string) => {
    return NotificationRepository.markAllAsRead(employeeNumber);
  },

  /**
   * Checks for overdue pending tests (> 4h) and creates notifications.
   * Also pushes SSE events to the relevant technicians so their UI updates
   * immediately without polling.
   */
  checkOverdueTests: async () => {
    const sseQueue: Array<{ recipientId: string; message: string }> = [];
    let count = 0;

    await db.transaction(async (client) => {
      const overdueTests = (await client.query<{
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
      )) as any[];

      if (overdueTests.length === 0) return;

      for (const test of overdueTests) {
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
        }

        // Queue SSE — fire only after COMMIT
        sseQueue.push({ recipientId, message });
        count++;
      }
    });

    // Transaction committed — now safe to push SSE events
    for (const { recipientId, message } of sseQueue) {
      sseBus.sendTo(recipientId, "NOTIFICATION_PUSHED", {
        type: "OVERDUE_TEST",
        message,
      });
    }

    if (count > 0) {
      logger.info({ count }, "Overdue test notifications generated");
    }
    return count;
  },

  /**
   * Create a targeted notification and immediately push SSE.
   */
  pushNotification: async (employeeNumber: string, type: string, message: string) => {
    await NotificationRepository.create(employeeNumber, type, message);
    sseBus.sendTo(employeeNumber, "NOTIFICATION_PUSHED", { type, message });
  },
};
