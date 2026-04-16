import { db } from "../../core/database";
import { SampleData, TestResultSummary, SampleTest } from "./service";
import { Sample } from "../../../src/shared/schemas/sample.schema";

export const SampleRepository = {
  async findAll(): Promise<any[]> {
    try {
      return await db.query(
        `
        SELECT s.*, COUNT(t.id) as test_count 
        FROM samples s 
        LEFT JOIN tests t ON s.id = t.sample_id 
        GROUP BY s.id 
        ORDER BY 
          CASE s.priority 
            WHEN 'STAT' THEN 1 
            WHEN 'HIGH' THEN 2 
            WHEN 'NORMAL' THEN 3 
            ELSE 4 
          END ASC, 
          s.created_at DESC
      `,
      );
    } catch (error: any) {
      if (error.message === "Database not connected") return [];
      throw error;
    }
  },

  async findById(id: number): Promise<any | null> {
    return await db.queryOne("SELECT * FROM samples WHERE id = $1", [id]);
  },

  async create(data: SampleData & { technician_id: string }): Promise<number> {
    const rows = await db.query(
      `
      INSERT INTO samples (batch_id, source_stage, sample_type, priority, technician_id, line_id, equipment_id, shift_id) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id
    `,
      [
        data.batch_id || null,
        data.source_stage || null,
        data.sample_type || null,
        data.priority || "NORMAL",
        data.technician_id,
        data.line_id || null,
        data.equipment_id || null,
        data.shift_id || null,
      ],
    );
    return rows[0].id;
  },

  async update(id: number, data: Partial<SampleData>): Promise<void> {
    const fields: string[] = [];
    const values: any[] = [];
    let i = 1;

    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        fields.push(`${key} = $${i++}`);
        values.push(value);
      }
    });

    if (fields.length === 0) return;

    values.push(id);
    await db.execute(
      `UPDATE samples SET ${fields.join(", ")} WHERE id = $${i}`,
      values,
    );
  },

  async findPreviousResults(
    stage: string,
    testType: string,
    limit: number,
  ): Promise<TestResultSummary[]> {
    return await db.query(
      `
      SELECT t.raw_value, t.performed_at, s.batch_id
      FROM tests t
      JOIN samples s ON t.sample_id = s.id
      WHERE s.source_stage = $1 AND t.test_type = $2 AND t.status = 'COMPLETED'
      ORDER BY t.performed_at DESC
      LIMIT $3
    `,
      [stage, testType, limit],
    );
  },

  async findTestsBySampleId(sampleId: number): Promise<SampleTest[]> {
    return await db.query("SELECT * FROM tests WHERE sample_id = $1", [
      sampleId,
    ]);
  },
};
