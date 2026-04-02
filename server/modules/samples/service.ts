import { createNotification } from "../../core/database/events";
import { db } from "../../core/database";

export type SampleData = {
  batch_id?: string;
  source_stage?: string;
  sample_type?: string;
  priority?: "NORMAL" | "HIGH" | "STAT";
  line_id?: string;
  equipment_id?: string;
  shift_id?: string;
  status?: "REGISTERED" | "TESTING" | "VALIDATING" | "COMPLETED" | "ARCHIVED";
};

export type TestResultSummary = {
  raw_value: number;
  performed_at: string;
  batch_id: string;
};

export type SampleTest = {
  id: number;
  sample_id: number;
  test_type: string;
  status: "PENDING" | "APPROVED" | "DISAPPROVED" | "COMPLETED" | "VALIDATING";
};

export const SampleService = {
  // --- Get all samples with test counts ---
  getSamples: async (): Promise<any[]> => {
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
  },

  // --- Create a new sample ---
  createSample: async (data: SampleData, technicianId: string): Promise<number> => {
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
        technicianId,
        data.line_id || null,
        data.equipment_id || null,
        data.shift_id || null,
      ],
    );

    return rows[0].id;
  },

  // --- Update an existing sample ---
  updateSample: async (
    id: string | number,
    data: SampleData,
    employeeNumber: string,
    ip: string,
  ): Promise<boolean> => {
    const sampleId = Number(id);
    if (isNaN(sampleId)) throw new Error("Invalid sample ID");

    const oldSample = await db.queryOne("SELECT * FROM samples WHERE id = $1", [sampleId]);
    if (!oldSample) throw new Error("Sample not found");

    await db.execute(
      `
      UPDATE samples 
      SET batch_id = $1, source_stage = $2, sample_type = $3, priority = $4, status = $5 
      WHERE id = $6
    `,
      [
        data.batch_id || oldSample.batch_id,
        data.source_stage || oldSample.source_stage,
        data.sample_type || oldSample.sample_type,
        data.priority || oldSample.priority,
        data.status || oldSample.status,
        sampleId,
      ],
    );

    // --- Audit log changes ---
    const changes: string[] = [];
    if (data.priority && data.priority !== oldSample.priority)
      changes.push(`Priority: ${oldSample.priority} -> ${data.priority}`);
    if (data.status && data.status !== oldSample.status) {
      changes.push(`Status: ${oldSample.status} -> ${data.status}`);

      // Trigger notification if completed
      if (data.status === "COMPLETED" && oldSample.technician_id) {
        await createNotification(
          oldSample.technician_id,
          "SAMPLE_COMPLETED",
          `Sample ${oldSample.batch_id} analysis has been completed.`,
        );
      }
    }
    if (data.batch_id && data.batch_id !== oldSample.batch_id)
      changes.push(`Batch ID: ${oldSample.batch_id} -> ${data.batch_id}`);
    if (data.source_stage && data.source_stage !== oldSample.source_stage)
      changes.push(`Stage: ${oldSample.source_stage} -> ${data.source_stage}`);

    if (changes.length > 0) {
      const details = `Updated sample #${sampleId}. Changes: ${changes.join(", ")}`;
      await db.execute(
        `
        INSERT INTO audit_logs (employee_number, action, details, ip_address)
        VALUES ($1, 'SAMPLE_UPDATED', $2, $3)
      `,
        [employeeNumber, details, ip],
      );
    }

    return true;
  },

  // --- Get previous test results ---
  getPreviousResults: async (
    stage: string,
    testType: string,
    limit: number = 5,
  ): Promise<TestResultSummary[]> => {
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

  // --- Get all tests for a sample, or default template ---
  getSampleTests: async (id: string | number): Promise<SampleTest[]> => {
    const sampleId = Number(id);
    if (isNaN(sampleId)) throw new Error("Invalid sample ID");

    const tests: SampleTest[] = await db.query("SELECT * FROM tests WHERE sample_id = $1", [sampleId]);

    if (tests.length === 0) {
      const sample = await db.queryOne("SELECT source_stage, batch_id FROM samples WHERE id = $1", [sampleId]);
      if (!sample) return [];

      const DEFAULT_TESTS: Record<string, string[]> = {
        "Raw Sugar": ["Pol", "Moisture", "Colour"],
        "White Sugar": ["Pol", "Moisture", "Colour", "Ash"],
        "Brown Sugar": ["Pol", "Moisture", "Colour", "Ash"],
        Clarification: ["pH", "Brix"],
        Evaporation: ["Brix", "pH"],
        Crystallization: ["Brix", "Purity"],
      };

      const testsToCreate = DEFAULT_TESTS[sample.source_stage] || [
        "Pol",
        "Moisture",
      ];
      return testsToCreate.map((testType, index) => ({
        id: -(index + 1), // Temporary negative ID for UI
        sample_id: sampleId,
        test_type: testType,
        status: "PENDING",
      }));
    }

    return tests;
  },
};
