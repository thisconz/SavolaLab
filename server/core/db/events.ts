// server/core/database/events.ts

import { db } from "./client";

/**
 * Create a notification for an employee
 * @param employeeNumber employee ID
 * @param type notification type (OVERDUE_TEST, INFO, ALERT, etc.)
 * @param message descriptive message
 */
export async function createNotification(employeeNumber: string, type: string, message: string) {
  await db.execute(
    `
    INSERT INTO notifications (employee_number, type, message)
    VALUES ($1, $2, $3)
  `,
    [employeeNumber, type, message],
  );
}

/**
 * Create an audit log entry
 * @param employeeNumber employee ID or 'SYSTEM'
 * @param action short action code
 * @param details detailed description
 * @param ip optional IP address
 */
export async function createAuditLog(
  employeeNumber: string,
  action: string,
  details: string,
  ip?: string,
) {
  await db.execute(
    `
    INSERT INTO audit_logs (employee_number, action, details, ip_address)
    VALUES ($1, $2, $3, $4)
  `,
    [employeeNumber, action, details, ip ?? null],
  );
}
