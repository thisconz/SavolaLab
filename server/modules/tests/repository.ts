import { db } from "../../core/database";

export const TestRepository = {
  findAll: async () => {
    try {
      return await db.query(
        "SELECT * FROM tests ORDER BY COALESCE(performed_at, updated_at) DESC",
      );
    } catch (err: any) {
      if (err.message === "Database not connected") {
        return [
          { id: 1, sample_id: 1, test_type: "Pol",      raw_value: 98.5,  calculated_value: 98.5,  unit: "%",  status: "COMPLETED", performed_at: new Date().toISOString() },
          { id: 2, sample_id: 2, test_type: "Moisture", raw_value: 0.15,  calculated_value: 0.15,  unit: "%",  status: "PENDING",   performed_at: new Date(Date.now() - 3_600_000).toISOString() },
          { id: 3, sample_id: 3, test_type: "Colour",   raw_value: 120,   calculated_value: 120,   unit: "IU", status: "COMPLETED", performed_at: new Date(Date.now() - 7_200_000).toISOString() },
        ];
      }
      throw err;
    }
  },

  findById: async (id: string | number) => {
    try {
      return await db.queryOne("SELECT * FROM tests WHERE id = $1", [id]);
    } catch (err: any) {
      if (err.message === "Database not connected") return null;
      throw err;
    }
  },

  /**
   * FIX TS2347: Remove type argument from client.query() — cast result instead.
   * All nullable params use explicit `null` (pg driver serialises `undefined` as "undefined").
   */
  create: async (client: any, data: any): Promise<number> => {
    const rows = (await client.query(
      `INSERT INTO tests
         (sample_id, test_type, raw_value, calculated_value, unit,
          status, performed_at, performer_id, reviewer_id,
          review_at, review_comment, notes, params)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       RETURNING id`,
      [
        data.sample_id,
        data.test_type,
        data.raw_value           ?? null,
        data.calculated_value    ?? null,
        data.unit                ?? null,
        data.status              ?? "PENDING",
        data.performed_at        ?? null,
        data.performer_id        ?? null,
        data.reviewer_id         ?? null,
        data.review_at           ?? null,
        data.review_comment      ?? null,
        data.notes               ?? null,
        data.params != null
          ? (typeof data.params === "string" ? data.params : JSON.stringify(data.params))
          : null,
      ],
    )) as Array<{ id: number }>;

    if (!rows[0]?.id) throw new Error("INSERT tests did not return an id");
    return rows[0].id;
  },

  update: async (client: any, id: string | number, data: any): Promise<void> => {
    await client.query(
      `UPDATE tests
       SET raw_value        = $1,
           calculated_value = $2,
           status           = $3,
           notes            = $4,
           params           = $5,
           updated_at       = CURRENT_TIMESTAMP
       WHERE id = $6`,
      [
        data.raw_value        ?? null,
        data.calculated_value ?? null,
        data.status           ?? "PENDING",
        data.notes            ?? null,
        data.params != null
          ? (typeof data.params === "string" ? data.params : JSON.stringify(data.params))
          : null,
        id,
      ],
    );
  },

  review: async (id: string | number, data: any): Promise<void> => {
    await db.execute(
      `UPDATE tests
       SET status = $1, reviewer_id = $2, review_at = $3,
           review_comment = $4, updated_at = CURRENT_TIMESTAMP
       WHERE id = $5`,
      [data.status, data.reviewer_id, data.review_at, data.review_comment ?? null, id],
    );
  },
};