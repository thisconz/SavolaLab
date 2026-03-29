import { db } from "../../core/database";

/**
 * Shared types
 */
type BaseFilters = {
  start_date?: string;
  end_date?: string;
  limit?: number | string;
  offset?: number | string;
};

type QueryConfig = {
  baseSql: string;
  filters: Record<string, (value: any) => { clause: string; param: any }>;
  defaultOrder?: string;
  maxLimit?: number;
};

/**
 * Normalize + enforce limits (critical for performance)
 */
function normalizePagination(filters: BaseFilters, maxLimit = 100) {
  const limit = Math.min(Number(filters.limit) || 50, maxLimit);
  const offset = Math.max(Number(filters.offset) || 0, 0);
  return { limit, offset };
}

/**
 * Generic query builder
 */
// server/modules/archive/service.ts
export function buildQuery(config: QueryConfig, filters: Record<string, any>) {
  let sql = config.baseSql;
  const params: any[] = [];
  let paramIndex = 1;

  for (const key in config.filters) {
    const value = filters[key];

    // Only process if the filter has a meaningful value
    if (value !== undefined && value !== null && value !== "") {
      try {
        // Execute the filter callback from config
        const result = config.filters[key](value);

        // Ensure the callback actually returned the expected structure
        if (!result || typeof result.clause !== 'string') {
          throw new Error("Filter callback must return { clause: string, param: any }");
        }

        const { clause, param } = result;

        // Safely replace ? with PostgreSQL $n placeholders
        const pgClause = clause.replace(/\?/g, () => `$${paramIndex++}`);
        
        sql += ` AND ${pgClause}`;
        params.push(param);

      } catch (err: any) {
        // Log the internal error for the devs, but throw a clean message for the UI
        console.error(`[Archive Query Error] Filter '${key}' failed:`, err);
        throw new Error(`Invalid search criteria for '${key}'. Please check your input.`);
      }
    }
  }

  const { limit, offset } = normalizePagination(filters, config.maxLimit);

  if (config.defaultOrder) {
    sql += ` ${config.defaultOrder}`;
  }

  // Finalize pagination placeholders
  sql += ` LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
  params.push(limit, offset);

  return { sql, params };
}

/**
 * Archive Service (clean + scalable)
 */
export const ArchiveService = {
  async searchSamples(filters: any) {
    const { sql, params } = buildQuery(
      {
        baseSql: `
          SELECT s.*, e.name as technician_name
          FROM samples s
          LEFT JOIN employees e ON s.technician_id = e.employee_number
          WHERE 1=1
        `,
        defaultOrder: "ORDER BY s.created_at DESC",
        maxLimit: 100,
        filters: {
          sample_id: (v) => ({ clause: "s.id = ?", param: v }),
          batch_id: (v) => ({ clause: "s.batch_id LIKE ?", param: `${v}%` }),
          start_date: (v) => ({ clause: "s.created_at >= ?", param: v }),
          end_date: (v) => ({ clause: "s.created_at <= ?", param: v }),
          status: (v) => ({ clause: "s.status = ?", param: v }),
          technician: (v) => ({ clause: "e.name LIKE ?", param: `${v}%` }),
          stage: (v) => ({ clause: "s.source_stage = ?", param: v }),
        },
      },
      filters,
    );

    return await db.query(sql, params);
  },

  async searchTests(filters: any) {
    const { sql, params } = buildQuery(
      {
        baseSql: `
          SELECT t.*, s.batch_id, e.name as performer_name
          FROM tests t
          JOIN samples s ON t.sample_id = s.id
          LEFT JOIN employees e ON t.performer_id = e.employee_number
          WHERE 1=1
        `,
        defaultOrder: "ORDER BY t.performed_at DESC",
        maxLimit: 100,
        filters: {
          sample_id: (v) => ({ clause: "t.sample_id = ?", param: v }),
          batch_id: (v) => ({ clause: "s.batch_id LIKE ?", param: `${v}%` }),
          start_date: (v) => ({ clause: "t.performed_at >= ?", param: v }),
          end_date: (v) => ({ clause: "t.performed_at <= ?", param: v }),
          test_type: (v) => ({ clause: "t.test_type = ?", param: v }),
          technician: (v) => ({ clause: "e.name LIKE ?", param: `${v}%` }),
          status: (v) => ({ clause: "t.status = ?", param: v }),
        },
      },
      filters,
    );

    return await db.query(sql, params);
  },

  async searchCertificates(filters: any) {
    const { sql, params } = buildQuery(
      {
        baseSql: `
          SELECT c.*, e.name as approver_name
          FROM certificates c
          LEFT JOIN employees e ON c.approved_by = e.employee_number
          WHERE 1=1
        `,
        defaultOrder: "ORDER BY c.created_at DESC",
        maxLimit: 100,
        filters: {
          batch_id: (v) => ({ clause: "c.batch_id LIKE ?", param: `${v}%` }),
          start_date: (v) => ({ clause: "c.created_at >= ?", param: v }),
          end_date: (v) => ({ clause: "c.created_at <= ?", param: v }),
          status: (v) => ({ clause: "c.status = ?", param: v }),
        },
      },
      filters,
    );

    return await db.query(sql, params);
  },

  async searchInstruments(filters: any) {
    const { sql, params } = buildQuery(
      {
        baseSql: `
          SELECT i.*
          FROM instruments i
          WHERE 1=1
        `,
        defaultOrder: "ORDER BY i.name ASC",
        maxLimit: 100,
        filters: {
          start_date: (v) => ({ clause: "i.last_calibrated >= ?", param: v }),
          end_date: (v) => ({ clause: "i.next_calibration <= ?", param: v }),
        },
      },
      filters,
    );

    return await db.query(sql, params);
  },

  async searchAuditLogs(filters: any) {
    const { sql, params } = buildQuery(
      {
        baseSql: `
          SELECT a.*, e.name as employee_name
          FROM audit_logs a
          LEFT JOIN employees e ON a.employee_number = e.employee_number
          WHERE 1=1
        `,
        defaultOrder: "ORDER BY a.created_at DESC",
        maxLimit: 500,
        filters: {
          start_date: (v) => ({ clause: "a.created_at >= ?", param: v }),
          end_date: (v) => ({ clause: "a.created_at <= ?", param: v }),
          technician: (v) => ({ clause: "e.name LIKE ?", param: `${v}%` }),
        },
      },
      filters,
    );

    return await db.query(sql, params);
  },
};
