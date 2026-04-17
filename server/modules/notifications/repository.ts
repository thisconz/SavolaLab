import { db } from "../../core/database";
import { Notification } from "../../../src/shared/schemas/notification.schema";

export const NotificationRepository = {
  async findByEmployeeNumber(employeeNumber: string): Promise<Notification[]> {
    try {
      const rows = await db.query(
        `SELECT id, employee_number, type, message, is_read::boolean, created_at 
         FROM notifications 
         WHERE employee_number = $1 
         ORDER BY created_at DESC 
         LIMIT 50`,
        [employeeNumber],
      );
      return rows.map((row: any) => ({
        ...row,
        created_at: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
        is_read: Boolean(row.is_read)
      })) as Notification[];
    } catch (error: any) {
      if (error.message === "Database not connected") return [];
      throw error;
    }
  },

  async markAsRead(id: string | number, employeeNumber: string): Promise<boolean> {
    await db.execute(
      `UPDATE notifications 
       SET is_read = TRUE 
       WHERE id = $1 AND employee_number = $2`,
      [id, employeeNumber],
    );
    return true;
  },

  async markAllAsRead(employeeNumber: string): Promise<boolean> {
    await db.execute(
      `UPDATE notifications SET is_read = TRUE WHERE employee_number = $1`,
      [employeeNumber],
    );
    return true;
  },

  async create(employeeNumber: string, type: string, message: string): Promise<void> {
    await db.execute(
      `INSERT INTO notifications (employee_number, type, message) VALUES ($1, $2, $3)`,
      [employeeNumber, type, message],
    );
  },

  async findOverdueTests(): Promise<any[]> {
    try {
      return await db.query(
        `SELECT t.*, s.batch_id, s.technician_id 
         FROM tests t 
         JOIN samples s ON t.sample_id = s.id 
         WHERE t.status = 'PENDING' 
           AND s.created_at < NOW() - interval '4 hours'`,
      );
    } catch (error: any) {
      if (error.message === "Database not connected") return [];
      throw error;
    }
  },
};
