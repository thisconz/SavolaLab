import { createNotification } from "../../core/database/events";
import { db } from "../../core/database";

export interface StatRequestInput {
  department: string;
  reason: string;
  urgency?: "NORMAL" | "HIGH" | "CRITICAL";
}

export const StatService = {
  // --- Get all stat requests ---
  getStats: async () => {
    return await db.query(
      `
      SELECT * 
      FROM stat_requests 
      ORDER BY 
        CASE urgency
          WHEN 'CRITICAL' THEN 1
          WHEN 'HIGH' THEN 2
          ELSE 3
        END ASC,
        created_at DESC
    `,
    );
  },

  // --- Create a new stat request with audit logging ---
  createStat: async (
    data: StatRequestInput,
    employeeNumber?: string,
    ip?: string,
  ) => {
    const { department, reason, urgency } = data;

    if (!department || !reason) {
      throw new Error("Department and reason are required");
    }

    const rows = await db.query(
      `
      INSERT INTO stat_requests (department, reason, urgency, status)
      VALUES ($1, $2, $3, 'OPEN')
      RETURNING id
    `,
      [department, reason || "", urgency || "NORMAL"],
    );

    const statId = rows[0].id;

    // --- Audit logging ---
    if (employeeNumber) {
      await db.execute(
        `
        INSERT INTO audit_logs (employee_number, action, details, ip_address)
        VALUES ($1, 'STAT_REQUEST_CREATED', $2, $3)
      `,
        [
          employeeNumber,
          `Created stat request #${statId} for ${department}`,
          ip || "127.0.0.1",
        ],
      );
    }

    return statId;
  },
};
