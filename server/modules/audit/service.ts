import { db } from "../../core/database";
import { logger } from "../../core/logger";

export type AuditLog = {
  id: number;
  employee_number: string;
  action: string;
  details: string;
  ip_address: string;
  created_at: string;
};

export type AuditFilters = {
  employee_number?: string;
  action?: string;
  start_date?: string;
  end_date?: string;
  limit?: number;
  offset?: number;
};

export const AuditService = {
  // Get audit logs with optional filtering & pagination
  getLogs: async (filters: AuditFilters = {}): Promise<AuditLog[]> => {
    let sql = `SELECT * FROM audit_logs WHERE 1=1`;
    const params: any[] = [];
    let paramIndex = 1;

    if (filters.employee_number) {
      sql += ` AND employee_number = $${paramIndex++}`;
      params.push(filters.employee_number);
    }
    if (filters.action) {
      sql += ` AND action = $${paramIndex++}`;
      params.push(filters.action);
    }
    if (filters.start_date) {
      sql += ` AND created_at >= $${paramIndex++}`;
      params.push(filters.start_date);
    }
    if (filters.end_date) {
      sql += ` AND created_at <= $${paramIndex++}`;
      params.push(filters.end_date);
    }

    sql += ` ORDER BY created_at DESC`;

    // Pagination with defaults & max limits
    const limit = Math.min(filters.limit || 50, 500);
    const offset = Math.max(filters.offset || 0, 0);
    sql += ` LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(limit, offset);

    try {
      return (await db.query(sql, params)) as AuditLog[];
    } catch (error: any) {
      if (error.message === "Database not connected") return [];
      throw error;
    }
  },

  // Create a new audit log
  createLog: async (
    employeeNumber: string,
    action: string,
    details: string,
    ip: string,
  ) => {
    if (!employeeNumber || !action) {
      throw new Error("Audit log requires employeeNumber and action");
    }

    // Limit string lengths to avoid abuse / DB bloat
    const safeAction = action.trim().slice(0, 100);
    const safeDetails = details ? details.slice(0, 1000) : "";

    try {
      await db.execute(
        `INSERT INTO audit_logs (employee_number, action, details, ip_address) VALUES ($1, $2, $3, $4)`,
        [employeeNumber, safeAction, safeDetails, ip || "127.0.0.1"],
      );
    } catch (err: any) {
      if (err.message === "Database not connected") return;
      logger.error({
        employeeNumber,
        action,
        ip,
        err,
      }, "❌ Failed to write audit log");
    }
  },
};
