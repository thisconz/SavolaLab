import { domainBus } from "../../core/events/domain-bus";
import { StatRepository } from "./repository";
import { analyticsCache } from "../../core/cache";
import { AuditService } from "../audit/service";

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
      await AuditService.createLog(
        employeeNumber,
        "STAT_REQUEST_CREATED",
        `Created STAT request #${statId} for department: ${data.department}`,
        ip ?? "127.0.0.1",
      );
    }

    // Broadcast to all — critical stats shown as toast in the frontend
    domainBus.publish({
      type: "STAT_CREATED",
      payload: {
        id: statId,
        department: data.department,
        urgency: data.urgency ?? "NORMAL",
      },
    });

    // Invalidate sample-count analytics cache (STAT changes active queue view)
    analyticsCache.invalidate("analytics:samples:status");

    return statId;
  },

  updateStatStatus: async (id: number | string, status: string, employeeNumber?: string, ip?: string) => {
    const statId = Number(id);
    if (isNaN(statId)) throw new Error("Invalid stat ID");

    await StatRepository.updateStatus(statId, status);

    if (employeeNumber) {
      await AuditService.createLog(
        employeeNumber,
        "STAT_REQUEST_UPDATED",
        `Updated STAT request #${statId} → ${status}`,
        ip ?? "127.0.0.1",
      );
    }

    domainBus.publish({
      type: "STAT_UPDATED",
      payload: {
        id: statId,
        status,
        updated_by: employeeNumber ?? "SYSTEM",
      },
    });

    return true;
  },
};
