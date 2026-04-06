import { db } from "../../core/database";
import { logger } from "../../core/logger";
import { NotificationRepository } from "./repository";
import { Notification } from "../../../src/shared/schemas/notification.schema";

export const NotificationService = {
  getNotifications: async (employeeNumber: string): Promise<Notification[]> => {
    return await NotificationRepository.findByEmployeeNumber(employeeNumber);
  },

  markAsRead: async (id: string, employeeNumber: string) => {
    return await NotificationRepository.markAsRead(id, employeeNumber);
  },

  markAllAsRead: async (employeeNumber: string) => {
    return await NotificationRepository.markAllAsRead(employeeNumber);
  },

  checkOverdueTests: async () => {
    const overdueTests = await NotificationRepository.findOverdueTests();

    if (overdueTests.length === 0) return 0;

    await db.transaction(async (client) => {
      for (const test of overdueTests) {
        const recipientId = test.performer_id || test.technician_id;
        if (recipientId) {
          await client.execute(
            `INSERT INTO notifications (employee_number, type, message) VALUES ($1, $2, $3)`,
            [
              recipientId,
              "OVERDUE_TEST",
              `Test ${test.test_type} for Batch ${test.batch_id} is overdue.`,
            ],
          );
        }
      }
    });

    logger.info({ count: overdueTests.length }, "📢 Overdue test notifications generated.");
    return overdueTests.length;
  },
};
