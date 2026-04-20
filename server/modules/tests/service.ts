import { db } from "../../core/database";
import { TestRepository } from "./repository";
import { sseBus } from "../../core/sse";

const updateWorkflowStep = async (
  sampleId:  number,
  testType:  string,
  testId:    number,
  rawValue:  number,
): Promise<void> => {
  try {
    const exec = await db.queryOne<{ id: number }>(
      `SELECT id FROM workflow_executions
       WHERE sample_id = $1 AND status = 'IN_PROGRESS'
       ORDER BY started_at DESC LIMIT 1`,
      [sampleId],
    );
    if (!exec) return;

    const step = await db.queryOne<{ id: number }>(
      `SELECT wse.id
       FROM workflow_step_executions wse
       JOIN workflow_steps ws ON wse.step_id = ws.id
       WHERE wse.execution_id = $1
         AND ws.test_type     = $2
         AND wse.status IN ('PENDING', 'IN_PROGRESS')
       ORDER BY ws.sequence_order ASC LIMIT 1`,
      [exec.id, testType],
    );
    if (!step) return;

    await db.execute(
      `UPDATE workflow_step_executions
       SET status = 'COMPLETED', completed_at = CURRENT_TIMESTAMP,
           test_id = $1, result_value = $2
       WHERE id = $3`,
      [testId, rawValue, step.id],
    );

    const pending = await db.queryOne<{ count: string }>(
      `SELECT COUNT(*) AS count
       FROM workflow_step_executions
       WHERE execution_id = $1 AND status NOT IN ('COMPLETED','FAILED')`,
      [exec.id],
    );
    if (Number(pending?.count ?? 1) === 0) {
      await db.execute(
        `UPDATE workflow_executions
         SET status = 'COMPLETED', completed_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [exec.id],
      );
      // Emit workflow completion
      sseBus.broadcast("WORKFLOW_COMPLETED", {
        execution_id: exec.id,
        sample_id:    sampleId,
      });
    }
  } catch (err: any) {
    if (err.message === "Database not connected") return;
    console.error("Workflow step update error:", err.message);
  }
};

export const TestService = {
  getTests: async () => TestRepository.findAll(),

  createTestResult: async (
    sampleId:    number,
    data:        any,
    performerId: string,
    ip = "127.0.0.1",
  ) => {
    const {
      test_type, raw_value, calculated_value, unit, status,
      performed_at, reviewer_id, review_at, review_comment, notes, params,
    } = data;

    const timestamp = performed_at ?? new Date().toISOString();
    const paramsStr = params != null
      ? (typeof params === "string" ? params : JSON.stringify(params))
      : null;

    try {
      return await db.transaction(async (client) => {
        const sample = await client.queryOne("SELECT id FROM samples WHERE id = $1", [sampleId]);
        if (!sample) throw new Error(`Sample ${sampleId} not found`);

        const testId = await TestRepository.create(client, {
          sample_id:        sampleId,
          test_type,
          raw_value:        raw_value         ?? null,
          calculated_value: calculated_value  ?? raw_value ?? null,
          unit:             unit              ?? null,
          status:           status            ?? "PENDING",
          performed_at:     timestamp,
          performer_id:     performerId,
          reviewer_id:      reviewer_id       ?? null,
          review_at:        review_at         ?? null,
          review_comment:   review_comment    ?? null,
          notes:            notes             ?? null,
          params:           paramsStr,
        });

        if (raw_value != null) {
          await updateWorkflowStep(sampleId, test_type, testId, raw_value);
        }

        await client.query(
          `INSERT INTO audit_logs (employee_number, action, details, ip_address)
           VALUES ($1, 'TEST_CREATED', $2, $3)`,
          [performerId, `Created '${test_type}' test for sample ${sampleId} (value: ${raw_value})`, ip],
        );

        // Emit SSE — broadcast to all so dashboard/queue can update
        sseBus.broadcast("TEST_SUBMITTED", {
          id:         testId,
          sample_id:  sampleId,
          test_type,
          raw_value:  raw_value ?? null,
          status:     status ?? "PENDING",
          performer_id: performerId,
        });

        return testId;
      });
    } catch (err: any) {
      db.execute(
        `INSERT INTO audit_logs (employee_number, action, details, ip_address)
         VALUES ($1, 'TEST_CREATE_FAILED', $2, $3)`,
        [performerId, `Failed to create '${test_type}' for sample ${sampleId}: ${err.message}`, ip],
      ).catch(() => {});
      throw err;
    }
  },

  updateTest: async (
    id:          string,
    data:        any,
    performerId: string,
    ip = "127.0.0.1",
  ) => {
    const numId = Number(id);
    if (!numId || numId < 1) throw new Error("Invalid test ID");

    try {
      return await db.transaction(async (client) => {
        const test = await TestRepository.findById(numId);
        if (!test) throw new Error("Test not found");

        await TestRepository.update(client, numId, {
          raw_value:        data.raw_value        ?? test.raw_value,
          calculated_value: data.calculated_value ?? test.calculated_value,
          status:           data.status           ?? test.status,
          notes:            data.notes            ?? test.notes,
          params:           data.params           ?? test.params,
        });

        if (data.raw_value != null) {
          await updateWorkflowStep(test.sample_id, test.test_type, numId, data.raw_value);
        }

        await client.query(
          `INSERT INTO audit_logs (employee_number, action, details, ip_address)
           VALUES ($1, 'TEST_UPDATED', $2, $3)`,
          [performerId, `Updated test ${numId} (sample: ${test.sample_id})`, ip],
        );

        sseBus.broadcast("TEST_UPDATED", {
          id:         numId,
          sample_id:  test.sample_id,
          test_type:  test.test_type,
          status:     data.status ?? test.status,
          updated_by: performerId,
        });

        return true;
      });
    } catch (err: any) {
      if (err.message === "Database not connected") return true;
      throw err;
    }
  },

  logDeletionAttempt: async (id: string, performerId: string, ip = "127.0.0.1") => {
    try {
      await db.execute(
        `INSERT INTO audit_logs (employee_number, action, details, ip_address)
         VALUES ($1, 'TEST_DELETE_ATTEMPT', $2, $3)`,
        [performerId, `Attempted to delete test ${id} (blocked)`, ip],
      );
    } catch (e) {
      console.error("Failed to log deletion attempt:", e);
    }
  },

  reviewTest: async (
    id:         string,
    data:       { status: "APPROVED" | "DISAPPROVED"; comment?: string },
    reviewerId: string,
    role:       string,
  ) => {
    if (!["SHIFT_CHEMIST", "HEAD_MANAGER", "ADMIN"].includes(role)) {
      throw new Error("Only Shift Chemists, Managers, or Admins can review tests");
    }

    const numId = Number(id);
    if (!numId || numId < 1) throw new Error("Invalid test ID");

    const test = await TestRepository.findById(numId);
    if (!test) throw new Error("Test not found");

    await TestRepository.review(numId, {
      status:         data.status,
      reviewer_id:    reviewerId,
      review_at:      new Date().toISOString(),
      review_comment: data.comment ?? null,
    });

    // Notify the original performer
    sseBus.sendTo(test.performer_id, "TEST_REVIEWED", {
      id:          numId,
      sample_id:   test.sample_id,
      test_type:   test.test_type,
      status:      data.status,
      reviewed_by: reviewerId,
    });

    // Also broadcast to all so queues update
    sseBus.broadcast("TEST_REVIEWED", {
      id:          numId,
      sample_id:   test.sample_id,
      test_type:   test.test_type,
      status:      data.status,
      reviewed_by: reviewerId,
    });

    return true;
  },
};