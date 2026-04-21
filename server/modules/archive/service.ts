import { db }          from "../../core/database";
import { logger }      from "../../core/logger";

type BaseFilters = {
  start_date?: string;
  end_date?:   string;
  limit?:      number | string;
  offset?:     number | string;
};

type FilterCallback = (value: any) => { clause: string; param: any };

type QueryConfig = {
  baseSql:       string;
  filters:       Record<string, FilterCallback>;
  defaultOrder?: string;
  maxLimit?:     number;
};

function normalizePagination(filters: BaseFilters, maxLimit = 100) {
  return {
    limit:  Math.min(Math.max(Number(filters.limit)  || 50, 1), maxLimit),
    offset: Math.max(Number(filters.offset) || 0, 0),
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
  let sql    = config.baseSql;
  const params: any[] = [];
  let idx = 1;

  for (const key of Object.keys(config.filters)) {
    const value = filters[key];
    if (value === undefined || value === null || value === "") continue;

    let clause: string;
    let param: any;

    try {
      const result = config.filters[key](value);
      if (!result || typeof result.clause !== "string") {
        throw new Error(`Filter '${key}' must return { clause: string, param: any }`);
      }
      clause = result.clause;
      param  = result.param;
    } catch (err: any) {
      logger.error({ err, key }, `[Archive] Filter '${key}' failed`);
      throw new Error(`Invalid search criteria for '${key}'.`);
    }

    // Replace ALL ? in this clause with sequential $N placeholders
    const pgClause = clause.replace(/\?/g, () => `$${idx++}`);
    sql += ` AND ${pgClause}`;
    params.push(param);
  }

  const { limit, offset } = normalizePagination(filters, config.maxLimit);

  if (config.defaultOrder) sql += ` ${config.defaultOrder}`;

  sql += ` LIMIT $${idx++} OFFSET $${idx}`;
  params.push(limit, offset);

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
          sample_id:  (v) => ({ clause: "s.id = ?",                param: Number(v) }),
          batch_id:   (v) => ({ clause: "s.batch_id ILIKE ?",      param: `${v}%`   }),
          start_date: (v) => ({ clause: "s.created_at >= ?",       param: v         }),
          end_date:   (v) => ({ clause: "s.created_at <= ?",       param: v         }),
          status:     (v) => ({ clause: "s.status = ?",            param: v         }),
          technician: (v) => ({ clause: "e.name ILIKE ?",          param: `%${v}%`  }),
          stage:      (v) => ({ clause: "s.source_stage ILIKE ?",  param: `%${v}%`  }),
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
          sample_id:  (v) => ({ clause: "t.sample_id = ?",        param: Number(v) }),
          batch_id:   (v) => ({ clause: "s.batch_id ILIKE ?",     param: `${v}%`   }),
          start_date: (v) => ({ clause: "t.performed_at >= ?",    param: v         }),
          end_date:   (v) => ({ clause: "t.performed_at <= ?",    param: v         }),
          test_type:  (v) => ({ clause: "t.test_type = ?",        param: v         }),
          technician: (v) => ({ clause: "e.name ILIKE ?",         param: `%${v}%`  }),
          status:     (v) => ({ clause: "t.status = ?",           param: v         }),
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
          batch_id:   (v) => ({ clause: "c.batch_id ILIKE ?",  param: `${v}%` }),
          start_date: (v) => ({ clause: "c.created_at >= ?",   param: v       }),
          end_date:   (v) => ({ clause: "c.created_at <= ?",   param: v       }),
          status:     (v) => ({ clause: "c.status = ?",        param: v       }),
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
          start_date: (v) => ({ clause: "i.last_calibration >= ?",  param: v }),
          end_date:   (v) => ({ clause: "i.next_calibration <= ?",  param: v }),
          status:     (v) => ({ clause: "i.status = ?",             param: v }),
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
          start_date: (v) => ({ clause: "a.created_at >= ?",  param: v         }),
          end_date:   (v) => ({ clause: "a.created_at <= ?",  param: v         }),
          technician: (v) => ({ clause: "e.name ILIKE ?",     param: `%${v}%`  }),
          action:     (v) => ({ clause: "a.action = ?",       param: v         }),
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