import { db } from "../../core/database";

export const TestRepository = {
  findAll: async () => {
    try {
      return await db.query("SELECT * FROM tests ORDER BY performed_at DESC");
    } catch (error: any) {
      if (error.message === "Database not connected") return [];
      throw error;
    }
  },

  findById: async (id: string | number) => {
    const result = await db.query("SELECT * FROM tests WHERE id = $1", [id]);
    return result[0];
  },

  create: async (client: any, data: any) => {
    const info = await client.query(
      `
      INSERT INTO tests (
        sample_id, test_type, raw_value, calculated_value, unit, status, 
        performed_at, performer_id, reviewer_id, review_at, review_comment, notes, params
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING id
    `,
      [
        data.sample_id,
        data.test_type,
        data.raw_value,
        data.calculated_value,
        data.unit,
        data.status,
        data.performed_at,
        data.performer_id,
        data.reviewer_id,
        data.review_at,
        data.review_comment,
        data.notes,
        data.params,
      ],
    );
    return info[0].id;
  },

  update: async (client: any, id: string | number, data: any) => {
    await client.query(
      `
      UPDATE tests
      SET raw_value = $1, calculated_value = $2, status = $3, notes = $4, params = $5, updated_at = CURRENT_TIMESTAMP
      WHERE id = $6
    `,
      [
        data.raw_value,
        data.calculated_value,
        data.status,
        data.notes,
        data.params,
        id,
      ],
    );
  },

  review: async (id: string | number, data: any) => {
    await db.execute(
      `
      UPDATE tests
      SET status = $1, reviewer_id = $2, review_at = $3, review_comment = $4
      WHERE id = $5
    `,
      [data.status, data.reviewer_id, data.review_at, data.review_comment, id],
    );
  },
};
