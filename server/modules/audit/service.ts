import { db } from "../../core/db/client";
import { dbOrm } from "../../core/db/orm";
import { auditLogs } from "../../core/db/schema";
import { logger } from "../../core/logger";
import { eq, desc, and, gte, lte } from "drizzle-orm";

export interface AuditLog {
  id: number;
  employee_number: string;
  action: string;
  details: string;
  ip_address: string;
  created_at: string;
}

export interface AuditFilters {
  employee_number?: string;
  action?: string;
  start_date?: string;
  end_date?: string;
  limit?: number;
  offset?: number;
}

export const AuditService = {
  // Get audit logs with optional filtering & pagination
  getLogs: async (filters: AuditFilters = {}): Promise<AuditLog[]> => {
    const conditions = [];

    if (filters.employee_number) {
      conditions.push(eq(auditLogs.employee_number, filters.employee_number));
    }
    if (filters.action) {
      conditions.push(eq(auditLogs.action, filters.action));
    }
    if (filters.start_date) {
      conditions.push(gte(auditLogs.created_at, new Date(filters.start_date)));
    }
    if (filters.end_date) {
      conditions.push(lte(auditLogs.created_at, new Date(filters.end_date)));
    }

    const limit = Math.min(filters.limit || 50, 500);
    const offset = Math.max(filters.offset || 0, 0);

    try {
      const results = await dbOrm
        .select()
        .from(auditLogs)
        .where(conditions.length ? and(...conditions) : undefined)
        .orderBy(desc(auditLogs.created_at))
        .limit(limit)
        .offset(offset);
      return results as any;
    } catch (error: any) {
      if (error.message === "Database not connected") return [];
      throw error;
    }
  },

  // Create a new audit log
  createLog: async (employeeNumber: string, action: string, details: string, ip: string) => {
    if (!employeeNumber || !action) {
      throw new Error("Audit log requires employeeNumber and action");
    }

    // Limit string lengths to avoid abuse / DB bloat
    const safeAction = action.trim().slice(0, 100);
    const safeDetails = details ? details.slice(0, 1000) : "";

    try {
      await dbOrm.insert(auditLogs).values({
        employee_number: employeeNumber,
        action: safeAction,
        details: safeDetails,
        ip_address: ip || "127.0.0.1",
      });
    } catch (err: any) {
      if (err.message === "Database not connected") return;
      logger.error(
        {
          employeeNumber,
          action,
          ip,
          err,
        },
        "Failed to write audit log",
      );
    }
  },
};
