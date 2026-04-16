import { db } from "../../core/database";
import { TestRepository } from "./repository";

/**
 * Update workflow step when a test result is entered.
 * Automatically completes the workflow if all steps are done.
 */
const updateWorkflowStep = async (
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
  } catch (err: any) {
    if (err.message === "Database not connected") return;
    console.error("Workflow step update error:", err);
  }
};

export const TestService = {
  // Fetch all test results
  getTests: async () => await TestRepository.findAll(),

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

        const testId = await TestRepository.create(client, {
          sample_id: sampleId,
          test_type,
          raw_value,
          calculated_value,
          unit,
          status: status || "PENDING",
          performed_at: timestamp,
          performer_id: performerId,
          reviewer_id: reviewer_id || null,
          review_at: review_at || null,
          review_comment: review_comment || null,
          notes: notes || null,
          params: paramsStr,
        });

        await updateWorkflowStep(sampleId, test_type, testId, raw_value);

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

    try {
      return await db.transaction(async (client) => {
        const test = await TestRepository.findById(id);
        if (!test) throw new Error("Test not found");

        await TestRepository.update(client, id, {
          raw_value: raw_value ?? test.raw_value,
          calculated_value: calculated_value ?? test.calculated_value,
          status: status || test.status,
          notes: notes ?? test.notes,
          params: params !== undefined
            ? typeof params === "string"
              ? params
              : JSON.stringify(params)
            : test.params,
        });

        if (raw_value !== undefined) {
          await updateWorkflowStep(
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
    } catch (error: any) {
      if (error.message === "Database not connected") return true;
      throw error;
    }
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

    await TestRepository.review(id, {
      status,
      reviewer_id: reviewerId,
      review_at,
      review_comment: comment ?? null,
    });

    return true;
  },
};
