import { db, createNotification } from "../../core/database";

export type Notification = {
  id: number;
  employee_number: string;
  type: string;
  message: string;
  created_at: string;
  is_read: number;
};

export const NotificationService = {
  getNotifications: async (employeeNumber: string): Promise<Notification[]> => {
    return await db.query(
      `SELECT * FROM notifications 
       WHERE employee_number = $1 
       ORDER BY created_at DESC 
       LIMIT 50`,
      [employeeNumber],
    );
  },

  markAsRead: async (id: string, employeeNumber: string) => {
    await db.execute(
      `UPDATE notifications 
       SET is_read = 1 
       WHERE id = $1 AND employee_number = $2`,
      [id, employeeNumber],
    );
    return true;
  },

  markAllAsRead: async (employeeNumber: string) => {
    await db.execute(
      `UPDATE notifications SET is_read = 1 WHERE employee_number = $1`,
      [employeeNumber],
    );
    return true;
  },

  checkOverdueTests: async () => {
    const overdueTests = (await db.query(
      `SELECT t.*, s.batch_id, s.technician_id 
       FROM tests t 
       JOIN samples s ON t.sample_id = s.id 
       WHERE t.status = 'PENDING' 
         AND s.created_at < NOW() - interval '4 hours'`,
    )) as any[];

    if (overdueTests.length === 0) return 0;

    await db.transaction(async (client) => {
      for (const test of overdueTests) {
        const recipientId = test.performer_id || test.technician_id;
        if (recipientId) {
          await client.execute(
            `INSERT INTO notifications (employee_number, type, message) VALUES ($1, $2, $3)`,
            [recipientId, "OVERDUE_TEST", `Test ${test.test_type} for Batch ${test.batch_id} is overdue.`],
          );
        }
      }
    });

    console.log(
      `📢 ${overdueTests.length} overdue test notifications generated.`,
    );
    return overdueTests.length;
  },
};
