import { db } from "../../core/db/client";
import { Pagination, EquipmentFilter } from "../../core/types";

export const OperationalRepository = {
  getProductionLines: (pagination?: Pagination) =>
    db.query(
      `SELECT * FROM production_lines ORDER BY name ASC
       LIMIT $1 OFFSET $2`,
      [pagination?.limit ?? 1000, pagination?.offset ?? 0],
    ),

  getEquipment: ({ lineId, limit = 100, offset = 0 }: EquipmentFilter = {}) =>
    lineId
      ? db.query(
          "SELECT * FROM equipment WHERE line_id = $1 ORDER BY name ASC LIMIT $2 OFFSET $3",
          [lineId, limit, offset],
        )
      : db.query(
          "SELECT * FROM equipment ORDER BY name ASC LIMIT $1 OFFSET $2",
          [limit, offset],
        ),

  getInstruments: (pagination?: Pagination) =>
    db.query(
      "SELECT * FROM instruments ORDER BY name ASC LIMIT $1 OFFSET $2",
      [pagination?.limit ?? 1000, pagination?.offset ?? 0],
    ),

  getInventory: (pagination?: Pagination) =>
    db.query(
      "SELECT * FROM inventory ORDER BY name ASC LIMIT $1 OFFSET $2",
      [pagination?.limit ?? 1000, pagination?.offset ?? 0],
    ),

  getCertificates: (status?: string, pagination?: Pagination) =>
    status
      ? db.query(
          "SELECT * FROM certificates WHERE status = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3",
          [status, pagination?.limit ?? 100, pagination?.offset ?? 0],
        )
      : db.query(
          "SELECT * FROM certificates ORDER BY created_at DESC LIMIT $1 OFFSET $2",
          [pagination?.limit ?? 100, pagination?.offset ?? 0],
        ),
};