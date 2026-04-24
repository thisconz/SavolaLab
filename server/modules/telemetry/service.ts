import os from "os";
import { dbOrm } from "../../core/db/orm";
import { samples, tests, auditLogs } from "../../core/db/schema";
import { telemetryCache, TTL } from "../../core/cache";
import { TelemetryMetrics, TelemetryFilter } from "../../core/types";
import { sql, and, gte, lte, notInArray, eq, like, or } from "drizzle-orm";

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
      const timeConstraintAudit = hasFilter
        ? and(gte(auditLogs.created_at, new Date(filter!.startDate!)), lte(auditLogs.created_at, new Date(filter!.endDate ?? new Date())))
        : gte(auditLogs.created_at, sql`NOW() - interval '24 hours'`);

      const timeConstraintTest = hasFilter
        ? and(gte(tests.updated_at, new Date(filter!.startDate!)), lte(tests.updated_at, new Date(filter!.endDate ?? new Date())))
        : gte(tests.updated_at, sql`NOW() - interval '24 hours'`);

      const activeUsersConstraintAudit = hasFilter 
        ? timeConstraintAudit
        : gte(auditLogs.created_at, sql`NOW() - interval '1 hour'`);

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
          dbOrm.select({ count: sql`COUNT(*)::text` }).from(samples).where(notInArray(samples.status, ['COMPLETED', 'ARCHIVED'])),
          dbOrm.select({ count: sql`COUNT(*)::text` }).from(tests).where(eq(tests.status, 'PENDING')),
          dbOrm.select({ created_at: auditLogs.created_at }).from(auditLogs).orderBy(sql`${auditLogs.created_at} DESC`).limit(1),
          dbOrm.select({ count: sql`COUNT(DISTINCT ${auditLogs.employee_number})::text` }).from(auditLogs).where(activeUsersConstraintAudit as any),
          dbOrm.select({ count: sql`COUNT(*)::text` }).from(auditLogs).where(timeConstraintAudit as any),
          dbOrm.select({ count: sql`COUNT(*)::text` }).from(auditLogs).where(and(or(like(auditLogs.action, '%FAILURE%'), like(auditLogs.action, '%ERROR%')) as any, timeConstraintAudit as any)),
          dbOrm.select({ count: sql`COUNT(*)::text` }).from(tests).where(and(eq(tests.status, 'COMPLETED'), timeConstraintTest as any)),
        ]);

        dbSync = "ACTIVE";
        sampleCount = Number(sr[0]?.count ?? 0);
        pendingTests = Number(pt[0]?.count ?? 0);
        lastAudit = (la[0]?.created_at as any)?.toISOString() ?? null;
        activeUsers = Number(au[0]?.count ?? 0);
        totalLogs = Number(tl[0]?.count ?? 0);
        errorLogs = Number(el[0]?.count ?? 0);
        completedTests = Number(ct[0]?.count ?? 0);
      } catch (e: any) {
        console.error(e);
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
