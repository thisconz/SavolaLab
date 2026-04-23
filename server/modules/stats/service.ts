import { createNotification } from "../../core/db/events";
import { db } from "../../core/database";
import { StatRepository } from "./repository";
import { sseBus } from "../../core/sse";
import { analyticsCache } from "../../core/cache";

export interface StatRequestInput {
  department: string;
  reason: string;
  urgency?: "NORMAL" | "HIGH" | "CRITICAL";
}

export const StatService = {
  getStats: async () => StatRepository.findAll(),

  createStat: async (data: StatRequestInput, employeeNumber?: string, ip?: string) => {
    const statId = await StatRepository.create({
      department: data.department,
      reason: data.reason,
      urgency: data.urgency ?? "NORMAL",
    });

    if (employeeNumber) {
      await db.execute(
        `INSERT INTO audit_logs (employee_number, action, details, ip_address)
         VALUES ($1, 'STAT_REQUEST_CREATED', $2, $3)`,
        [
          employeeNumber,
          `Created STAT request #${statId} for department: ${data.department}`,
          ip ?? "127.0.0.1",
        ],
      );
    }

    // Broadcast to all — critical stats shown as toast in the frontend
    sseBus.broadcast("STAT_CREATED", {
      id: statId,
      department: data.department,
      urgency: data.urgency ?? "NORMAL",
    });

    // Invalidate sample-count analytics cache (STAT changes active queue view)
    analyticsCache.invalidate("analytics:samples:status");

    return statId;
  },

  updateStatStatus: async (
    id: number | string,
    status: string,
    employeeNumber?: string,
    ip?: string,
  ) => {
    const statId = Number(id);
    if (isNaN(statId)) throw new Error("Invalid stat ID");

    await StatRepository.updateStatus(statId, status);

    if (employeeNumber) {
      await db.execute(
        `INSERT INTO audit_logs (employee_number, action, details, ip_address)
         VALUES ($1, 'STAT_REQUEST_UPDATED', $2, $3)`,
        [employeeNumber, `Updated STAT request #${statId} → ${status}`, ip ?? "127.0.0.1"],
      );
    }

    sseBus.broadcast("STAT_UPDATED", {
      id: statId,
      status,
      updated_by: employeeNumber ?? "SYSTEM",
    });

    return true;
  },
};
