import { db, createAuditLog } from "../../core/database";

type Pagination = { limit?: number; offset?: number };
type EquipmentFilter = { lineId?: string } & Pagination;

function replacePlaceholders(sql: string) {
  let index = 1;
  return sql.replace(/\?/g, () => `$${index++}`);
}

export const OperationalService = {
  getProductionLines: async (pagination?: Pagination) => {
    let sql = "SELECT * FROM production_lines ORDER BY name ASC";
    const params: any[] = [];

    if (pagination?.limit) sql += " LIMIT ?";
    if (pagination?.offset) sql += " OFFSET ?";
    if (pagination?.limit) params.push(pagination.limit);
    if (pagination?.offset) params.push(pagination.offset);

    const result = await db.query(replacePlaceholders(sql), params);
    await createAuditLog(
      "SYSTEM",
      "FETCH_PRODUCTION_LINES",
      `Fetched ${result.length} production lines`,
    );
    return result;
  },

  getEquipment: async ({
    lineId,
    limit = 100,
    offset = 0,
  }: EquipmentFilter = {}) => {
    const params: any[] = [];
    let sql = "SELECT * FROM equipment";

    if (lineId) {
      params.push(lineId);
      sql += ` WHERE line_id = $${params.length}`;
    }

    params.push(limit);
    sql += ` ORDER BY name ASC LIMIT $${params.length}`;
    params.push(offset);
    sql += ` OFFSET $${params.length}`;

    return db.query(sql, params);
  },


  getInstruments: async (pagination?: Pagination) => {
    let sql = "SELECT * FROM instruments ORDER BY name ASC";
    const params: any[] = [];
    if (pagination?.limit) sql += " LIMIT ?";
    if (pagination?.offset) sql += " OFFSET ?";
    if (pagination?.limit) params.push(pagination.limit);
    if (pagination?.offset) params.push(pagination.offset);

    const result = await db.query(replacePlaceholders(sql), params);
    await createAuditLog(
      "SYSTEM",
      "FETCH_INSTRUMENTS",
      `Fetched ${result.length} instruments`,
    );
    return result;
  },

  getInventory: async (pagination?: Pagination) => {
    let sql = "SELECT * FROM inventory ORDER BY name ASC";
    const params: any[] = [];
    if (pagination?.limit) sql += " LIMIT ?";
    if (pagination?.offset) sql += " OFFSET ?";
    if (pagination?.limit) params.push(pagination.limit);
    if (pagination?.offset) params.push(pagination.offset);

    const result = await db.query(replacePlaceholders(sql), params);
    await createAuditLog(
      "SYSTEM",
      "FETCH_INVENTORY",
      `Fetched ${result.length} inventory items`,
    );
    return result;
  },

  getCertificates: async (filters?: { status?: string } & Pagination) => {
    let sql = "SELECT * FROM certificates WHERE 1=1";
    const params: any[] = [];

    if (filters?.status) {
      sql += " AND status = ?";
      params.push(filters.status);
    }

    sql += " ORDER BY created_at DESC";
    if (filters?.limit) sql += " LIMIT ?";
    if (filters?.offset) sql += " OFFSET ?";
    if (filters?.limit) params.push(filters.limit);
    if (filters?.offset) params.push(filters.offset);

    const result = await db.query(replacePlaceholders(sql), params);
    await createAuditLog(
      "SYSTEM",
      "FETCH_CERTIFICATES",
      `Fetched ${result.length} certificates`,
    );
    return result;
  },
};
