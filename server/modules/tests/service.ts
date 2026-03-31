import { TransactionClient } from "@/server/core/database/client";
import { db } from "../../core/database";

/**
 * Update workflow step when a test result is entered.
 * Automatically completes the workflow if all steps are done.
 */
const updateWorkflowStep = async (
  client: TransactionClient,
  sample_id: number,
  test_type: string,
  test_id: number,
  raw_value: number,
) => {
  try {
    const activeExecution = (await db.queryOne(
      `
      SELECT id FROM workflow_executions 
      WHERE sample_id = $1 AND status = 'IN_PROGRESS'
      LIMIT 1
    `,
      [sample_id],
    )) as any;

    if (!activeExecution) return;

    const matchingStep = (await db.queryOne(
      `
      SELECT wse.id 
      FROM workflow_step_executions wse
      JOIN workflow_steps ws ON wse.step_id = ws.id
      WHERE wse.execution_id = $1 
      AND ws.test_type = $2 
      AND wse.status IN ('PENDING', 'IN_PROGRESS')
      ORDER BY ws.sequence_order ASC
      LIMIT 1
    `,
      [activeExecution.id, test_type],
    )) as any;

    if (!matchingStep) return;

    // Complete this workflow step
    await db.execute(
      `
      UPDATE workflow_step_executions 
      SET status = 'COMPLETED', completed_at = CURRENT_TIMESTAMP, test_id = $1, result_value = $2
      WHERE id = $3
    `,
      [test_id, raw_value, matchingStep.id],
    );

    // Check if workflow is fully completed
    const pendingSteps = (await db.queryOne(
      `
      SELECT COUNT(*) as count 
      FROM workflow_step_executions 
      WHERE execution_id = $1 AND status != 'COMPLETED'
    `,
      [activeExecution.id],
    )) as any;

    if (Number(pendingSteps.count) === 0) {
      await db.execute(
        `
        UPDATE workflow_executions 
        SET status = 'COMPLETED', completed_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `,
        [activeExecution.id],
      );
    }
  } catch (err) {
    console.error("Workflow step update error:", err);
  }
};

export const TestService = {
  // Fetch all test results
  getTests: async (limit = 500) =>
    await db.query("SELECT * FROM tests ORDER BY performed_at DESC LIMIT $1", [limit]),

  // Create a test result with validation, workflow update, and audit logging
  createTestResult: async (
    sampleId: number,
    data: any,
    performerId: string,
    ip: string = "127.0.0.1",
  ) => {
    const {
      test_type,
      raw_value,
      calculated_value,
      unit,
      status,
      performed_at,
      reviewer_id,
      review_at,
      review_comment,
      notes,
      params,
    } = data;

    // Validate required fields
    if (!test_type || typeof test_type !== "string")
      throw new Error("test_type is required and must be a string");
    if (raw_value === undefined || typeof raw_value !== "number")
      throw new Error("raw_value is required and must be a number");
    if (calculated_value === undefined || typeof calculated_value !== "number")
      throw new Error("calculated_value is required and must be a number");
    if (!unit || typeof unit !== "string")
      throw new Error("unit is required and must be a string");
    if (!status || typeof status !== "string")
      throw new Error("status is required and must be a string");

    // Ensure optional fields exist in payload
    ["reviewer_id", "review_at", "review_comment", "notes", "params"].forEach(
      (field) => {
        if (!(field in data))
          throw new Error(`${field} must be provided in payload`);
      },
    );

    const timestamp = performed_at || new Date().toISOString();
    const paramsStr = params
      ? typeof params === "string"
        ? params
        : JSON.stringify(params)
      : null;

    try {
      return await db.transaction(async (client) => {
        const sampleResult = await client.query(
          "SELECT id FROM samples WHERE id = $1",
          [sampleId],
        );
        const sample = sampleResult[0];
        if (!sample) throw new Error(`Sample ${sampleId} not found`);

        const info = await client.query(
          `
          INSERT INTO tests (
            sample_id, test_type, raw_value, calculated_value, unit, status, 
            performed_at, performer_id, reviewer_id, review_at, review_comment, notes, params
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
          RETURNING id
        `,
          [
            sampleId,
            test_type,
            raw_value,
            calculated_value,
            unit,
            status,
            timestamp,
            performerId,
            reviewer_id || null,
            review_at || null,
            review_comment || null,
            notes || null,
            paramsStr,
          ],
        );

        const testId = info[0].id;

        await updateWorkflowStep(client, sampleId, test_type, testId, raw_value);

        await client.query(
          `
          INSERT INTO audit_logs (employee_number, action, details, ip_address)
          VALUES ($1, 'TEST_CREATED', $2, $3)
        `,
          [
            performerId,
            `Created test '${test_type}' for sample ${sampleId} with value ${raw_value}`,
            ip,
          ],
        );

        return testId;
      });
    } catch (error: any) {
      // Attempt to log failure
      try {
        await db.execute(
          `
          INSERT INTO audit_logs (employee_number, action, details, ip_address)
          VALUES ($1, 'TEST_CREATE_FAILED', $2, $3)
        `,
          [
            performerId,
            `Failed to create test '${test_type}' for sample ${sampleId}: ${error.message}`,
            ip,
          ],
        );
      } catch {}
      throw error;
    }
  },

  // Legacy convenience wrapper
  createTest: async (data: any, performerId: string) =>
    await TestService.createTestResult(
      data.sample_id,
      {
        ...data,
        calculated_value: data.calculated_value ?? data.raw_value,
        status: data.status || "PENDING",
        reviewer_id: data.reviewer_id ?? null,
        review_at: data.review_at ?? null,
        review_comment: data.review_comment ?? null,
        notes: data.notes ?? null,
        params: data.params ?? null,
      },
      performerId,
    ),

  // Update an existing test
  updateTest: async (
    id: string,
    data: any,
    performerId: string,
    ip: string = "127.0.0.1",
  ) => {
    const { raw_value, calculated_value, status, notes, params } = data;

    return await db.transaction(async (client) => {
      const testResult = await client.query(
        "SELECT * FROM tests WHERE id = $1",
        [id],
      );
      const test = testResult[0];
      if (!test) throw new Error("Test not found");

      await client.query(
        `
        UPDATE tests
        SET raw_value = $1, calculated_value = $2, status = $3, notes = $4, params = $5, updated_at = CURRENT_TIMESTAMP
        WHERE id = $6
      `,
        [
          raw_value ?? test.raw_value,
          calculated_value ?? test.calculated_value,
          status || test.status,
          notes ?? test.notes,
          params !== undefined
            ? typeof params === "string"
              ? params
              : JSON.stringify(params)
            : test.params,
          id,
        ],
      );

      if (raw_value !== undefined) {
        await updateWorkflowStep(
          client,
          test.sample_id,
          test.test_type,
          Number(id),
          raw_value,
        );
      }

      await client.query(
        `
        INSERT INTO audit_logs (employee_number, action, details, ip_address)
        VALUES ($1, 'TEST_UPDATED', $2, $3)
      `,
        [performerId, `Updated test ${id} (Sample: ${test.sample_id})`, ip],
      );

      return true;
    });
  },

  // Log attempts to delete a test (deletion blocked)
  logDeletionAttempt: async (
    id: string,
    performerId: string,
    ip: string = "127.0.0.1",
  ) => {
    try {
      await db.execute(
        `
        INSERT INTO audit_logs (employee_number, action, details, ip_address)
        VALUES ($1, 'TEST_DELETE_ATTEMPT', $2, $3)
      `,
        [
          performerId,
          `Attempted to delete test result ${id} (deletion is blocked)`,
          ip,
        ],
      );
    } catch (e) {
      console.error("Failed to log deletion attempt:", e);
    }
  },

  // Review a test
  reviewTest: async (
    id: string,
    data: { status: "APPROVED" | "DISAPPROVED"; comment?: string },
    reviewerId: string,
    role: string,
  ) => {
    const { status, comment } = data;
    const review_at = new Date().toISOString();

    if (!["SHIFT_CHEMIST", "HEAD_MANAGER"].includes(role)) {
      throw new Error("Only Shift Chemists or Managers can review tests");
    }

    await db.execute(
      `
      UPDATE tests
      SET status = $1, reviewer_id = $2, review_at = $3, review_comment = $4
      WHERE id = $5
    `,
      [status, reviewerId, review_at, comment ?? null, id],
    );

    return true;
  },
};
