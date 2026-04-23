import { db } from "../../core/database";
import { logger } from "../../core/logger";

type BaseFilters = {
  start_date?: string;
  end_date?: string;
  limit?: number | string;
  offset?: number | string;
};

type FilterResult = {
  clause: string;
  params: any[];
};

type FilterCallback = (value: any) => FilterResult;

type QueryConfig = {
  baseSql: string;
  filters: Record<string, FilterCallback>;
  defaultOrder?: string;
  maxLimit?: number;
};

function normalizePagination(filters: BaseFilters, maxLimit = 100) {
  const rawLimit = Number(filters.limit);
  const rawOffset = Number(filters.offset);

  return {
    limit: Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), maxLimit) : 50,

    offset: Number.isFinite(rawOffset) ? Math.max(rawOffset, 0) : 0,
  };
}

/**
 * Builds a parameterised PostgreSQL query from a config + filter map.
 *
 * BUG FIX: The previous version incremented `paramIndex` inside the
 * `clause.replace()` callback BEFORE pushing the param, producing
 * off-by-one placeholder numbers when multiple filters were active.
 * Now we collect all {clause, param} pairs first, then assign $N
 * sequentially and push params in the same pass.
 */
export function buildQuery(config: QueryConfig, filters: Record<string, any>) {
  let sql = config.baseSql;
  const params: any[] = [];

  for (const [key, filterFn] of Object.entries(config.filters)) {
    const value = filters[key];
    if (value === undefined || value === null || value === "") continue;

    let result: FilterResult;

    try {
      result = config.filters[key](value);

      if (!result || typeof result.clause !== "string" || !Array.isArray(result.params)) {
        throw new Error(`Filter '${key}' must return { clause: string, params: any[] }`);
      }

      const expected = (result.clause.match(/\?/g) || []).length;
      if (expected !== result.params.length) {
        throw new Error(
          `Placeholder mismatch in filter '${key}': expected ${expected}, got ${result.params.length}`,
        );
      }
    } catch (err: any) {
      logger.error({ err, key }, `[Archive] Filter '${key}' failed`);
      throw new Error(`Invalid search criteria for '${key}'.`);
    }

    // Replace ? with correct positional params
    let localIdx = params.length + 1;

    const pgClause = result.clause.replace(/\?/g, () => `$${localIdx++}`);

    sql += ` AND ${pgClause}`;
    params.push(...result.params);
  }

  const { limit, offset } = normalizePagination(filters, config.maxLimit);

  if (config.defaultOrder) {
    sql += ` ${config.defaultOrder}`;
  }

  // pagination bound AFTER params are final
  const limitIdx = params.length + 1;
  const offsetIdx = params.length + 2;

  sql += ` LIMIT $${limitIdx} OFFSET $${offsetIdx}`;
  params.push(limit, offset);

  const totalPlaceholders = (sql.match(/\$\d+/g) || []).length;

  if (totalPlaceholders !== params.length) {
    throw new Error(
      `Query invariant violated: placeholders (${totalPlaceholders}) != params (${params.length})`,
    );
  }

  logger.debug({ sql, params }, "[Archive] Built query");

  return { sql, params };
}

export const ArchiveService = {
  async searchSamples(filters: any) {
    const { sql, params } = buildQuery(
      {
        baseSql: `
          SELECT s.*, e.name AS technician_name
          FROM samples s
          LEFT JOIN employees e ON s.technician_id = e.employee_number
          WHERE 1=1
        `,
        defaultOrder: "ORDER BY s.created_at DESC",
        maxLimit: 200,
        filters: {
          sample_id: (v) => ({ clause: "s.id = ?", params: [Number(v)] }),
          batch_id: (v) => ({
            clause: "s.batch_id ILIKE ?",
            params: [`${v}%`],
          }),
          start_date: (v) => ({ clause: "s.created_at >= ?", params: [v] }),
          end_date: (v) => ({ clause: "s.created_at <= ?", params: [v] }),
          status: (v) => ({ clause: "s.status = ?", params: [v] }),
          technician: (v) => ({ clause: "e.name ILIKE ?", params: [`%${v}%`] }),
          stage: (v) => ({
            clause: "s.source_stage ILIKE ?",
            params: [`%${v}%`],
          }),
        },
      },
      filters,
    );

    try {
      return await db.query(sql, params);
    } catch (err: any) {
      if (err.message === "Database not connected") return [];
      throw err;
    }
  },

  async searchTests(filters: any) {
    const { sql, params } = buildQuery(
      {
        baseSql: `
          SELECT t.*, s.batch_id, e.name AS performer_name
          FROM tests t
          JOIN  samples   s ON t.sample_id   = s.id
          LEFT JOIN employees e ON t.performer_id = e.employee_number
          WHERE 1=1
        `,
        defaultOrder: "ORDER BY t.performed_at DESC",
        maxLimit: 200,
        filters: {
          sample_id: (v) => ({
            clause: "t.sample_id = ?",
            params: [Number(v)],
          }),
          batch_id: (v) => ({
            clause: "s.batch_id ILIKE ?",
            params: [`${v}%`],
          }),
          start_date: (v) => ({ clause: "t.performed_at >= ?", params: [v] }),
          end_date: (v) => ({ clause: "t.performed_at <= ?", params: [v] }),
          test_type: (v) => ({ clause: "t.test_type = ?", params: [v] }),
          technician: (v) => ({ clause: "e.name ILIKE ?", params: [`%${v}%`] }),
          status: (v) => ({ clause: "t.status = ?", params: [v] }),
        },
      },
      filters,
    );

    try {
      return await db.query(sql, params);
    } catch (err: any) {
      if (err.message === "Database not connected") return [];
      throw err;
    }
  },

  async searchCertificates(filters: any) {
    const { sql, params } = buildQuery(
      {
        baseSql: `
          SELECT c.*, e.name AS approver_name
          FROM certificates c
          LEFT JOIN employees e ON c.approved_by = e.employee_number
          WHERE 1=1
        `,
        defaultOrder: "ORDER BY c.created_at DESC",
        maxLimit: 200,
        filters: {
          batch_id: (v) => ({
            clause: "c.batch_id ILIKE ?",
            params: [`${v}%`],
          }),
          start_date: (v) => ({ clause: "c.created_at >= ?", params: [v] }),
          end_date: (v) => ({ clause: "c.created_at <= ?", params: [v] }),
          status: (v) => ({ clause: "c.status = ?", params: [v] }),
        },
      },
      filters,
    );

    try {
      return await db.query(sql, params);
    } catch (err: any) {
      if (err.message === "Database not connected") return [];
      throw err;
    }
  },

  async searchInstruments(filters: any) {
    const { sql, params } = buildQuery(
      {
        baseSql: `SELECT i.* FROM instruments i WHERE 1=1`,
        defaultOrder: "ORDER BY i.name ASC",
        maxLimit: 200,
        filters: {
          start_date: (v) => ({
            clause: "i.last_calibration >= ?",
            params: [v],
          }),
          end_date: (v) => ({ clause: "i.next_calibration <= ?", params: [v] }),
          status: (v) => ({ clause: "i.status = ?", params: [v] }),
        },
      },
      filters,
    );

    try {
      return await db.query(sql, params);
    } catch (err: any) {
      if (err.message === "Database not connected") return [];
      throw err;
    }
  },

  async searchAuditLogs(filters: any) {
    const { sql, params } = buildQuery(
      {
        baseSql: `
          SELECT a.*, e.name AS employee_name
          FROM audit_logs a
          LEFT JOIN employees e ON a.employee_number = e.employee_number
          WHERE 1=1
        `,
        defaultOrder: "ORDER BY a.created_at DESC",
        maxLimit: 1000,
        filters: {
          start_date: (v) => ({ clause: "a.created_at >= ?", params: [v] }),
          end_date: (v) => ({ clause: "a.created_at <= ?", params: [v] }),
          technician: (v) => ({ clause: "e.name ILIKE ?", params: [`%${v}%`] }),
          action: (v) => ({ clause: "a.action = ?", params: [v] }),
        },
      },
      filters,
    );

    try {
      return await db.query(sql, params);
    } catch (err: any) {
      if (err.message === "Database not connected") return [];
      throw err;
    }
  },
};
