import os from "os";
import { db } from "../../core/database";

export interface TelemetryMetrics {
  cpuLoad: string;
  memory: string;
  latency: string;
  dbSync: "ACTIVE" | "INACTIVE";
  uptime: string;
  activeUsers: number;
  errorRate: string;
  throughput: string;
  stats: {
    samples: number;
    pending: number;
    lastAudit: string | null;
  };
}

export interface TelemetryFilter {
  startDate?: string;
  endDate?: string;
}

export const TelemetryService = {
  getTelemetry: async (filter?: TelemetryFilter): Promise<TelemetryMetrics> => {
    const hasFilter = !!filter?.startDate;
    const timeConstraint = hasFilter
      ? `created_at BETWEEN $1 AND $2`
      : `created_at > NOW() - interval '24 hours'`;
    const params = hasFilter
      ? [filter.startDate, filter.endDate ?? new Date().toISOString()]
      : [];

    // --- 1. System Metrics (Synchronous/OS Level) ---
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const memUsage = `${((totalMem - freeMem) / 1024 / 1024 / 1024).toFixed(1)}GB / ${(totalMem / 1024 / 1024 / 1024).toFixed(1)}GB`;
    const cpuLoad = `${Math.min(100, Math.round((os.loadavg()[0] / os.cpus().length) * 100))}%`;

    const uptimeSeconds = Math.floor(process.uptime());
    const days = Math.floor(uptimeSeconds / (24 * 3600));
    const hours = Math.floor((uptimeSeconds % (24 * 3600)) / 3600);
    const uptime =
      days > 0
        ? `${days}d ${hours}h`
        : `${hours}h ${Math.floor((uptimeSeconds % 3600) / 60)}m`;

    // --- 2. Database Metrics (Parallel Execution) ---
    // We initiate all promises at once.
    let sampleCountRes, pendingTestsRes, lastAuditRes, activeUsersRes, totalLogsRes, errorLogsRes, throughputRes;
    try {
      [
        sampleCountRes,
        pendingTestsRes,
        lastAuditRes,
        activeUsersRes,
        totalLogsRes,
        errorLogsRes,
        throughputRes,
      ] = await Promise.all([
        db.queryOne<{ count: string }>(
          "SELECT COUNT(*) AS count FROM samples WHERE status NOT IN ('COMPLETED', 'ARCHIVED')",
        ),
        db.queryOne<{ count: string }>(
          "SELECT COUNT(*) AS count FROM tests WHERE status = 'PENDING'",
        ),
        db.queryOne<{ created_at: string }>(
          "SELECT created_at FROM audit_logs ORDER BY created_at DESC LIMIT 1",
        ),
        db.queryOne<{ count: string }>(
          `SELECT COUNT(DISTINCT employee_number) AS count FROM audit_logs WHERE ${hasFilter ? timeConstraint : "created_at > NOW() - interval '1 hour'"}`,
          params,
        ),
        db.queryOne<{ count: string }>(
          `SELECT COUNT(*) AS count FROM audit_logs WHERE ${timeConstraint}`,
          params,
        ),
        db.queryOne<{ count: string }>(
          `SELECT COUNT(*) AS count FROM audit_logs WHERE (action LIKE '%FAILURE%' OR action LIKE '%ERROR%') AND ${timeConstraint}`,
          params,
        ),
        db.queryOne<{ count: string }>(
          `SELECT COUNT(*) AS count FROM tests WHERE status = 'COMPLETED' AND ${timeConstraint.replace("created_at", "updated_at")}`,
          params,
        ),
      ]);
    } catch (error: any) {
      if (error.message === "Database not connected") {
        return {
          cpuLoad,
          memory: memUsage,
          latency: `12ms`,
          dbSync: "INACTIVE",
          uptime,
          activeUsers: 2,
          errorRate: "0.0%",
          throughput: "0 tests",
          stats: {
            samples: 0,
            pending: 0,
            lastAudit: null,
          },
        };
      }
      throw error;
    }

    // --- 3. Calculations ---
    const totalCount = Number(totalLogsRes?.count ?? 0);
    const errorCount = Number(errorLogsRes?.count ?? 0);
    const errorRatePct = totalCount > 0 ? (errorCount / totalCount) * 100 : 0;

    return {
      cpuLoad,
      memory: memUsage,
      latency: `12ms`,
      dbSync: "ACTIVE",
      uptime,
      activeUsers: Number(activeUsersRes?.count ?? 0),
      errorRate: `${errorRatePct.toFixed(1)}%`,
      throughput: `${throughputRes?.count ?? 0} tests`,
      stats: {
        samples: Number(sampleCountRes?.count ?? 0),
        pending: Number(pendingTestsRes?.count ?? 0),
        lastAudit: lastAuditRes?.created_at ?? null,
      },
    };
  },
};
