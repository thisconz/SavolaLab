import { createNotification } from "../../core/db/events";
import { db } from "../../core/database";
import { StatRepository } from "./repository";

export interface StatRequestInput {
  department: string;
  reason: string;
  urgency?: "NORMAL" | "HIGH" | "CRITICAL";
}

export const StatService = {
  // --- Get all stat requests ---
  getStats: async () => {
    return await StatRepository.findAll();
  },

  // --- Create a new stat request with audit logging ---
  createStat: async (
    data: StatRequestInput,
    employeeNumber?: string,
    ip?: string,
  ) => {
    const { department, reason, urgency } = data;

    const statId = await StatRepository.create({
      department,
      reason,
      urgency,
    });

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

  // --- Update stat request status ---
  updateStatStatus: async (
    id: number | string,
    status: string,
    employeeNumber?: string,
    ip?: string,
  ) => {
    const statId = Number(id);
    if (isNaN(statId)) throw new Error("Invalid stat ID");

    await StatRepository.updateStatus(statId, status);

    // --- Audit logging ---
    if (employeeNumber) {
      await db.execute(
        `
        INSERT INTO audit_logs (employee_number, action, details, ip_address)
        VALUES ($1, 'STAT_REQUEST_UPDATED', $2, $3)
      `,
        [
          employeeNumber,
          `Updated stat request #${statId} status to ${status}`,
          ip || "127.0.0.1",
        ],
      );
    }

    return true;
  },
};
