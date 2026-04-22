import { db } from "../../core/database";
import { SampleData, TestResultSummary, SampleTest } from "../../core/types";

export const SampleRepository = {
  async findAll(): Promise<any[]> {
    try {
      const results = await db.query(`
        SELECT
          s.*,
          COUNT(t.id)::int AS test_count
        FROM samples s
        LEFT JOIN tests t ON s.id = t.sample_id
        GROUP BY s.id
        ORDER BY
          CASE s.priority
            WHEN 'STAT'   THEN 1
            WHEN 'HIGH'   THEN 2
            WHEN 'NORMAL' THEN 3
            ELSE 4
          END ASC,
          s.created_at DESC
      `);
      return results;
    } catch (error: any) {
      if (error.message === "Database not connected") {
        return [
          {
            id: 1,
            batch_id: "BT-2026-001",
            sample_type: "Raw sugar",
            source_stage: "Raw Handling",
            priority: "STAT",
            status: "PENDING",
            created_at: new Date().toISOString(),
            test_count: 2,
          },
          {
            id: 2,
            batch_id: "BT-2026-002",
            sample_type: "Polish liquor",
            source_stage: "Evaporation",
            priority: "HIGH",
            status: "TESTING",
            created_at: new Date(Date.now() - 3_600_000).toISOString(),
            test_count: 3,
          },
          {
            id: 3,
            batch_id: "BT-2026-003",
            sample_type: "White sugar",
            source_stage: "Crystallization",
            priority: "NORMAL",
            status: "COMPLETED",
            created_at: new Date(Date.now() - 7_200_000).toISOString(),
            test_count: 4,
          },
        ];
      }
      throw error;
    }
  },

  async findById(id: number): Promise<any | null> {
    try {
      return await db.queryOne("SELECT * FROM samples WHERE id = $1", [id]);
    } catch (error: any) {
      if (error.message === "Database not connected") {
        return {
          id,
          batch_id: `BT-2026-00${id}`,
          sample_type: "Raw sugar",
          source_stage: "Raw Handling",
          priority: "NORMAL",
          status: "PENDING",
          created_at: new Date().toISOString(),
          technician_id: "ADMIN",
        };
      }
      throw error;
    }
  },

  async create(data: SampleData & { technician_id: string }): Promise<number> {
    try {
      const rows = await db.query<{ id: number }>(
        `INSERT INTO samples
           (batch_id, sample_type, source_stage, priority, technician_id,
            line_id, equipment_id, shift_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id`,
        [
          data.batch_id ?? null,
          data.sample_type ?? null,
          data.source_stage ?? null,
          data.priority ?? "NORMAL",
          data.technician_id,
          data.line_id ?? null,
          data.equipment_id ?? null,
          data.shift_id ?? null,
        ],
      );
      return rows[0].id;
    } catch (error: any) {
      if (error.message === "Database not connected")
        return Math.floor(Math.random() * 1000) + 100;
      throw error;
    }
  },

  async update(id: number, data: Partial<SampleData>): Promise<void> {
    const fields: string[] = [];
    const values: any[] = [];
    let i = 1;

    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        fields.push(`${key} = $${i++}`);
        values.push(value);
      }
    }

    if (fields.length === 0) return;

    values.push(id);
    try {
      await db.execute(
        `UPDATE samples SET ${fields.join(", ")} WHERE id = $${i}`,
        values,
      );
    } catch (error: any) {
      if (error.message === "Database not connected") return;
      throw error;
    }
  },

  async findPreviousResults(
    stage: string,
    testType: string,
    limit: number,
  ): Promise<TestResultSummary[]> {
    try {
      return await db.query(
        `SELECT t.raw_value, t.performed_at, s.batch_id
         FROM tests t
         JOIN samples s ON t.sample_id = s.id
         WHERE s.source_stage = $1
           AND t.test_type = $2
           AND t.status = 'COMPLETED'
         ORDER BY t.performed_at DESC
         LIMIT $3`,
        [stage, testType, limit],
      );
    } catch (error: any) {
      if (error.message === "Database not connected") return [];
      throw error;
    }
  },

  async findTestsBySampleId(sampleId: number): Promise<SampleTest[]> {
    try {
      return await db.query(
        "SELECT * FROM tests WHERE sample_id = $1 ORDER BY id ASC",
        [sampleId],
      );
    } catch (error: any) {
      if (error.message === "Database not connected") {
        return [
          { id: 101, sample_id: sampleId, test_type: "Pol", status: "PENDING" },
          {
            id: 102,
            sample_id: sampleId,
            test_type: "Moisture",
            status: "COMPLETED",
          },
        ];
      }
      throw error;
    }
  },
};
