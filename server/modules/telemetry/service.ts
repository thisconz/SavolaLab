import os from "os";
import { db } from "../../core/database";
import { telemetryCache, TTL } from "../../core/cache";
import { TelemetryMetrics, TelemetryFilter } from "../../core/types";

export const TelemetryService = {
  getTelemetry: async (filter?: TelemetryFilter): Promise<TelemetryMetrics> => {
    const hasFilter = !!filter?.startDate;
    const cacheKey = hasFilter
      ? `telemetry:custom:${filter!.startDate}:${filter!.endDate}`
      : "telemetry:live";

    // Only cache the live (non-filtered) view; filtered views are user-specific
    const ttl = hasFilter ? 0 : TTL.SECONDS_30;

    const fetchMetrics = async (): Promise<TelemetryMetrics> => {
      // ── OS metrics (cheap — always fresh) ──────────────────────────────
      const totalMem = os.totalmem();
      const freeMem = os.freemem();
      const usedGB = ((totalMem - freeMem) / 1024 ** 3).toFixed(1);
      const totalGB = (totalMem / 1024 ** 3).toFixed(1);
      const memUsage = `${usedGB}GB / ${totalGB}GB`;
      const cpuLoad = `${Math.min(100, Math.round((os.loadavg()[0] / os.cpus().length) * 100))}%`;

      const sec = Math.floor(process.uptime());
      const days = Math.floor(sec / 86400);
      const hours = Math.floor((sec % 86400) / 3600);
      const mins = Math.floor((sec % 3600) / 60);
      const uptime =
        days > 0 ? `${days}d ${hours}h` : hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

      // ── DB metrics ─────────────────────────────────────────────────────
      const timeConstraint = hasFilter
        ? `created_at BETWEEN $1 AND $2`
        : `created_at > NOW() - interval '24 hours'`;
      const params = hasFilter
        ? [filter!.startDate, filter!.endDate ?? new Date().toISOString()]
        : [];

      const dbStart = Date.now();

      let dbSync: "ACTIVE" | "INACTIVE" = "INACTIVE";
      let sampleCount = 0;
      let pendingTests = 0;
      let lastAudit: string | null = null;
      let activeUsers = 0;
      let totalLogs = 0;
      let errorLogs = 0;
      let completedTests = 0;

      try {
        const [sr, pt, la, au, tl, el, ct] = await Promise.all([
          db.queryOne<{ count: string }>(
            "SELECT COUNT(*)::text AS count FROM samples WHERE status NOT IN ('COMPLETED', 'ARCHIVED')",
          ),
          db.queryOne<{ count: string }>(
            "SELECT COUNT(*)::text AS count FROM tests WHERE status = 'PENDING'",
          ),
          db.queryOne<{ created_at: string }>(
            "SELECT created_at FROM audit_logs ORDER BY created_at DESC LIMIT 1",
          ),
          db.queryOne<{ count: string }>(
            `SELECT COUNT(DISTINCT employee_number)::text AS count FROM audit_logs WHERE ${hasFilter ? timeConstraint : "created_at > NOW() - interval '1 hour'"}`,
            params,
          ),
          db.queryOne<{ count: string }>(
            `SELECT COUNT(*)::text AS count FROM audit_logs WHERE ${timeConstraint}`,
            params,
          ),
          db.queryOne<{ count: string }>(
            `SELECT COUNT(*)::text AS count FROM audit_logs WHERE (action LIKE '%FAILURE%' OR action LIKE '%ERROR%') AND ${timeConstraint}`,
            params,
          ),
          db.queryOne<{ count: string }>(
            `SELECT COUNT(*)::text AS count FROM tests WHERE status = 'COMPLETED' AND ${timeConstraint.replace("created_at", "updated_at")}`,
            params,
          ),
        ]);

        dbSync = "ACTIVE";
        sampleCount = Number(sr?.count ?? 0);
        pendingTests = Number(pt?.count ?? 0);
        lastAudit = la?.created_at ?? null;
        activeUsers = Number(au?.count ?? 0);
        totalLogs = Number(tl?.count ?? 0);
        errorLogs = Number(el?.count ?? 0);
        completedTests = Number(ct?.count ?? 0);
      } catch {
        // DB unavailable — return OS metrics only
      }

      const errorRate = totalLogs > 0 ? `${((errorLogs / totalLogs) * 100).toFixed(1)}%` : "0.0%";

      const latency = `${Date.now() - dbStart}ms`;

      return {
        cpuLoad,
        memory: memUsage,
        latency,
        dbSync,
        uptime,
        activeUsers,
        errorRate,
        throughput: `${completedTests} tests`,
        stats: {
          samples: sampleCount,
          pending: pendingTests,
          lastAudit,
        },
      };
    };

    if (ttl > 0) {
      return telemetryCache.getOrSet(cacheKey, fetchMetrics, ttl);
    }
    return fetchMetrics();
  },
};
