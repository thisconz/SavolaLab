import { db } from "../../core/database";

export const StatRepository = {
  findAll: async () => {
    return await db.query(
      `
      SELECT * 
      FROM stat_requests 
      ORDER BY 
        CASE urgency
          WHEN 'CRITICAL' THEN 1
          WHEN 'HIGH' THEN 2
          ELSE 3
        END ASC,
        created_at DESC
    `,
    );
  },

  create: async (data: any) => {
    const rows = await db.query(
      `
      INSERT INTO stat_requests (department, reason, urgency, status)
      VALUES ($1, $2, $3, 'OPEN')
      RETURNING id
    `,
      [data.department, data.reason || "", data.urgency || "NORMAL"],
    );
    return rows[0].id;
  },

  updateStatus: async (id: number, status: string) => {
    await db.execute(
      `
      UPDATE stat_requests 
      SET status = $1 
      WHERE id = $2
    `,
      [status, id],
    );
  },
};
