import { dbOrm } from "../../core/db/orm";
import { notifications, tests, samples } from "../../core/db/schema";
import { Notification } from "../../../src/shared/schemas/notification.schema";
import { eq, desc, and, lt, sql } from "drizzle-orm";

export const NotificationRepository = {
  async findByEmployeeNumber(employeeNumber: string): Promise<Notification[]> {
    try {
      const rows = await dbOrm
        .select()
        .from(notifications)
        .where(eq(notifications.employee_number, employeeNumber))
        .orderBy(desc(notifications.created_at))
        .limit(50);

      return rows.map((row: any) => ({
        ...row,
        created_at: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
        is_read: Boolean(row.is_read),
      })) as Notification[];
    } catch (error: any) {
      if (error.message === "Database not connected") return [];
      throw error;
    }
  },

  async markAsRead(id: string | number, employeeNumber: string): Promise<boolean> {
    await dbOrm
      .update(notifications)
      .set({ is_read: 1 })
      .where(
        and(eq(notifications.id, Number(id)), eq(notifications.employee_number, employeeNumber)),
      );
    return true;
  },

  async markAllAsRead(employeeNumber: string): Promise<boolean> {
    await dbOrm
      .update(notifications)
      .set({ is_read: 1 })
      .where(eq(notifications.employee_number, employeeNumber));
    return true;
  },

  async create(employeeNumber: string, type: string, message: string): Promise<void> {
    await dbOrm.insert(notifications).values({
      employee_number: employeeNumber,
      type: type,
      message: message,
    });
  },

  /** @deprecated Use the inline query in NotificationService.checkOverdueTests for transactional consistency */
  async findOverdueTests(): Promise<any[]> {
    try {
      const rows = await dbOrm
        .select({
          test: tests,
          batch_id: samples.batch_id,
          technician_id: samples.technician_id,
        })
        .from(tests)
        .innerJoin(samples, eq(tests.sample_id, samples.id))
        .where(
          and(eq(tests.status, "PENDING"), lt(tests.updated_at, sql`NOW() - interval '4 hours'`)),
        );

      return rows.map((row) => ({
        ...row.test,
        batch_id: row.batch_id,
        technician_id: row.technician_id,
      }));
    } catch (error: any) {
      if (error.message === "Database not connected") return [];
      throw error;
    }
  },
};
