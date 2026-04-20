import { db }                              from "../../core/database";
import { analyticsCache, TTL }            from "../../core/cache";
import { logger }                         from "../../core/logger";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export interface HourlyQualityPoint {
  time:   string;
  brix:   number | null;
  purity: number | null;
  color:  number | null;
}

export interface DailyVolumePoint {
  day:    string;
  volume: number;
  target: number;
}

export interface CpkResult {
  brixCpk:   number;
  purityCpk: number;
  colorCpk:  number;
}

export interface SampleStatusBreakdown {
  status: string;
  count:  number;
}

export interface StageEfficiency {
  stage:     string;
  avg_tests: number;
  total:     number;
}

export interface TestPassRate {
  test_type:    string;
  pass_rate:    number;
  total_tested: number;
  approved:     number;
}

// ─────────────────────────────────────────────
// Spec limits (configurable per test type)
// ─────────────────────────────────────────────

const SPECS: Record<string, { usl: number; lsl: number }> = {
  Brix:   { lsl: 60,  usl: 70  },
  Purity: { lsl: 95,  usl: 100 },
  Color:  { lsl: 0,   usl: 60  },
  Pol:    { lsl: 95,  usl: 100 },
  pH:     { lsl: 6.5, usl: 8.5 },
};

function calcCpk(mean: number, stddev: number, usl: number, lsl: number): number {
  if (stddev <= 0) return 0;
  const cpu = (usl - mean) / (3 * stddev);
  const cpl = (mean - lsl) / (3 * stddev);
  return Math.min(cpu, cpl);
}

// ─────────────────────────────────────────────
// Service
// ─────────────────────────────────────────────

export const AnalyticsService = {
  /**
   * SPC trend — hourly averages of Brix, Purity, Color for the last 24 h.
   * Cached 15 min because this drives the real-time chart.
   */
  getQualityData: async (): Promise<HourlyQualityPoint[]> => {
    return analyticsCache.getOrSet(
      "analytics:quality:24h",
      async () => {
        try {
          const rows = await db.query<{
            hour:       string;
            test_type:  string;
            avg_value:  number;
          }>(`
            SELECT
              date_trunc('hour', performed_at)         AS hour,
              test_type,
              ROUND(AVG(calculated_value)::numeric, 2) AS avg_value
            FROM tests
            WHERE test_type IN ('Brix', 'Purity', 'Colour')
              AND status      IN ('COMPLETED', 'APPROVED')
              AND performed_at >= NOW() - INTERVAL '24 hours'
            GROUP BY date_trunc('hour', performed_at), test_type
            ORDER BY hour ASC
          `);

          // Pivot into { time, brix, purity, color }
          const buckets = new Map<string, HourlyQualityPoint>();

          for (const row of rows) {
            const time = new Date(row.hour).toLocaleTimeString([], {
              hour:   "2-digit",
              minute: "2-digit",
            });

            if (!buckets.has(time)) {
              buckets.set(time, { time, brix: null, purity: null, color: null });
            }

            const pt = buckets.get(time)!;
            const v  = Number(row.avg_value);
            if (row.test_type === "Brix")   pt.brix   = v;
            if (row.test_type === "Purity") pt.purity = v;
            if (row.test_type === "Colour") pt.color  = v;
          }

          return Array.from(buckets.values());
        } catch (err: any) {
          logger.error({ err }, "AnalyticsService.getQualityData failed");
          return [];
        }
      },
      TTL.MINUTES_15,
    );
  },

  /**
   * Daily sample volume vs. target for the last 7 days.
   * Cached 30 min — doesn't change intraday for most installs.
   */
  getVolumeData: async (): Promise<DailyVolumePoint[]> => {
    return analyticsCache.getOrSet(
      "analytics:volume:7d",
      async () => {
        try {
          const rows = await db.query<{
            date:   string;
            volume: string;
          }>(`
            SELECT
              DATE(created_at)            AS date,
              COUNT(*)::text              AS volume
            FROM samples
            WHERE created_at >= NOW() - INTERVAL '7 days'
            GROUP BY DATE(created_at)
            ORDER BY date ASC
          `);

          const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

          return rows.map((r) => ({
            day:    days[new Date(r.date).getDay()],
            volume: Number(r.volume),
            target: 100, // configurable in system_preferences
          }));
        } catch (err: any) {
          logger.error({ err }, "AnalyticsService.getVolumeData failed");
          return [];
        }
      },
      TTL.MINUTES_30,
    );
  },

  /**
   * Process Capability (Cpk) per test type — last 30 days.
   * Falls back to hardcoded targets when insufficient data.
   * Cached 1 hour.
   */
  getProcessCapability: async (): Promise<CpkResult> => {
    return analyticsCache.getOrSet(
      "analytics:capability:30d",
      async () => {
        try {
          const rows = await db.query<{
            test_type: string;
            mean:      number;
            stddev:    number;
            n:         string;
          }>(`
            SELECT
              test_type,
              AVG(calculated_value)    AS mean,
              STDDEV(calculated_value) AS stddev,
              COUNT(*)::text           AS n
            FROM tests
            WHERE test_type IN ('Brix', 'Purity', 'Colour')
              AND status    IN ('COMPLETED', 'APPROVED')
              AND performed_at >= NOW() - INTERVAL '30 days'
            GROUP BY test_type
          `);

          const cpk: CpkResult = { brixCpk: 1.33, purityCpk: 1.33, colorCpk: 1.33 };

          for (const row of rows) {
            const mean   = Number(row.mean);
            const stddev = Number(row.stddev);
            const n      = Number(row.n);

            if (stddev <= 0 || n < 10) continue; // need at least 10 pts

            const type = row.test_type;
            const spec = SPECS[type] ?? SPECS["Brix"];
            const val  = calcCpk(mean, stddev, spec.usl, spec.lsl);

            if (type === "Brix")   cpk.brixCpk   = Number(val.toFixed(2));
            if (type === "Purity") cpk.purityCpk = Number(val.toFixed(2));
            if (type === "Colour") cpk.colorCpk  = Number(val.toFixed(2));
          }

          return cpk;
        } catch (err: any) {
          logger.error({ err }, "AnalyticsService.getProcessCapability failed");
          return { brixCpk: 0, purityCpk: 0, colorCpk: 0 };
        }
      },
      TTL.HOURS_1,
    );
  },

  /**
   * Sample status breakdown (donut chart data).
   * Cached 5 min.
   */
  getSampleStatusBreakdown: async (): Promise<SampleStatusBreakdown[]> => {
    return analyticsCache.getOrSet(
      "analytics:samples:status",
      async () => {
        try {
          return await db.query<SampleStatusBreakdown>(`
            SELECT
              status,
              COUNT(*)::int AS count
            FROM samples
            WHERE created_at >= NOW() - INTERVAL '30 days'
            GROUP BY status
            ORDER BY count DESC
          `);
        } catch {
          return [];
        }
      },
      TTL.MINUTES_5,
    );
  },

  /**
   * Test pass/fail rates per test type.
   * Cached 15 min.
   */
  getTestPassRates: async (): Promise<TestPassRate[]> => {
    return analyticsCache.getOrSet(
      "analytics:tests:passrates",
      async () => {
        try {
          return await db.query<TestPassRate>(`
            SELECT
              test_type,
              COUNT(*) FILTER (WHERE status = 'APPROVED')::int   AS approved,
              COUNT(*) FILTER (WHERE status != 'PENDING')::int   AS total_tested,
              ROUND(
                100.0 * COUNT(*) FILTER (WHERE status = 'APPROVED') /
                NULLIF(COUNT(*) FILTER (WHERE status != 'PENDING'), 0),
                1
              )::float                                           AS pass_rate
            FROM tests
            WHERE performed_at >= NOW() - INTERVAL '30 days'
            GROUP BY test_type
            HAVING COUNT(*) FILTER (WHERE status != 'PENDING') > 0
            ORDER BY total_tested DESC
            LIMIT 10
          `);
        } catch {
          return [];
        }
      },
      TTL.MINUTES_15,
    );
  },

  /**
   * Stage-level throughput efficiency.
   * Cached 30 min.
   */
  getStageEfficiency: async (): Promise<StageEfficiency[]> => {
    return analyticsCache.getOrSet(
      "analytics:efficiency:stages",
      async () => {
        try {
          return await db.query<StageEfficiency>(`
            SELECT
              COALESCE(source_stage, 'Unknown')      AS stage,
              ROUND(AVG(test_count)::numeric, 1)     AS avg_tests,
              COUNT(*)::int                          AS total
            FROM (
              SELECT
                s.source_stage,
                COUNT(t.id) AS test_count
              FROM samples s
              LEFT JOIN tests t ON t.sample_id = s.id
              WHERE s.created_at >= NOW() - INTERVAL '30 days'
              GROUP BY s.id, s.source_stage
            ) sub
            GROUP BY source_stage
            ORDER BY avg_tests DESC
            LIMIT 8
          `);
        } catch {
          return [];
        }
      },
      TTL.MINUTES_30,
    );
  },

  /** Manually bust all analytics caches (call after bulk imports) */
  invalidateAll(): void {
    analyticsCache.invalidatePrefix("analytics:");
  },
};