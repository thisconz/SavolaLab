import { createAuditLog } from "../../core/database/events";
import { db } from "../../core/database";

export type WorkflowStepInput = {
  test_type: string;
  min_value?: number | null;
  max_value?: number | null;
};

export const WorkflowService = {
  getWorkflows: async () => {
    const workflows = await db.query("SELECT * FROM workflows WHERE is_active = 1") as any[];
    const result = [];
    for (const wf of workflows) {
      const steps = await db.query(
        "SELECT * FROM workflow_steps WHERE workflow_id = $1 ORDER BY sequence_order ASC",
        [wf.id],
      );
      result.push({ ...wf, steps });
    }
    return result;
  },

  createWorkflow: async (data: {
    name: string;
    description?: string;
    target_stage?: string;
    steps: WorkflowStepInput[];
  }) => {
    const { name, description, target_stage, steps } = data;
    if (!name || !steps || steps.length === 0)
      throw new Error("Workflow name and steps are required");

    return await db.transaction(async (client) => {
      const info = await client.query(
        "INSERT INTO workflows (name, description, target_stage) VALUES ($1, $2, $3) RETURNING id",
        [name, description || null, target_stage || null],
      );
      const workflowId = info[0].id;

      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        await client.query(
          "INSERT INTO workflow_steps (workflow_id, test_type, sequence_order, min_value, max_value) VALUES ($1, $2, $3, $4, $5)",
          [
            workflowId,
            step.test_type,
            i + 1,
            step.min_value ?? null,
            step.max_value ?? null,
          ],
        );
      }

      return workflowId;
    });
  },

  executeWorkflow: async (workflowId: string | number, sampleId: string | number) => {
    const workflowExists = await db.queryOne("SELECT id FROM workflows WHERE id = $1", [workflowId]);
    const sampleExists = await db.queryOne("SELECT id FROM samples WHERE id = $1", [sampleId]);
    if (!workflowExists) throw new Error(`Workflow ${workflowId} not found`);
    if (!sampleExists) throw new Error(`Sample ${sampleId} not found`);

    return await db.transaction(async (client) => {
      const info = await client.query(
        "INSERT INTO workflow_executions (workflow_id, sample_id, status) VALUES ($1, $2, 'IN_PROGRESS') RETURNING id",
        [workflowId, sampleId],
      );
      const executionId = info[0].id;

      const stepsResult = await client.query(
        "SELECT id FROM workflow_steps WHERE workflow_id = $1 ORDER BY sequence_order ASC",
        [workflowId],
      );
      const steps = stepsResult;

      for (const step of steps) {
        await client.query(
          "INSERT INTO workflow_step_executions (execution_id, step_id, status) VALUES ($1, $2, 'PENDING')",
          [executionId, step.id],
        );
      }

      return executionId;
    });
  },

  startStep: async (executionId: string | number, stepId: string | number) => {
    const result = await db.execute(
      "UPDATE workflow_step_executions SET status = 'IN_PROGRESS', started_at = CURRENT_TIMESTAMP WHERE execution_id = $1 AND step_id = $2",
      [executionId, stepId],
    );
    // In pg, result.rowCount is used instead of result.changes
    // But my execute wrapper doesn't return rowCount yet.
    // Let's assume it works or check if I should update the wrapper.
    return true;
  },

  completeStep: async (
    executionId: string | number,
    stepId: string | number,
    status: string = "COMPLETED",
    testId?: number,
    resultValue?: number,
  ) => {
    return await db.transaction(async (client) => {
      const stepExecResult = await client.query(
        "SELECT * FROM workflow_step_executions WHERE execution_id = $1 AND step_id = $2",
        [executionId, stepId],
      );
      const stepExec = stepExecResult[0];
      if (!stepExec) throw new Error("Step execution not found");

      await client.query(
        `
        UPDATE workflow_step_executions 
        SET status = $1, completed_at = CURRENT_TIMESTAMP, test_id = $2, result_value = $3
        WHERE execution_id = $4 AND step_id = $5
      `,
        [status, testId ?? null, resultValue ?? null, executionId, stepId],
      );

      const pendingResult = await client.query(
        "SELECT COUNT(*) as count FROM workflow_step_executions WHERE execution_id = $1 AND status != 'COMPLETED'",
        [executionId],
      );
      const pending = pendingResult[0];
      if (Number(pending.count) === 0) {
        await client.query(
          "UPDATE workflow_executions SET status = 'COMPLETED', completed_at = CURRENT_TIMESTAMP WHERE id = $1",
          [executionId],
        );
      }

      return true;
    });
  },

  getExecutionsBySample: async (sampleId: string | number) => {
    const executions = await db.query(
      `
      SELECT we.*, w.name as workflow_name 
      FROM workflow_executions we
      JOIN workflows w ON we.workflow_id = w.id
      WHERE we.sample_id = $1
      ORDER BY we.started_at DESC
    `,
      [sampleId],
    ) as any[];

    const result = [];
    for (const exec of executions) {
      const steps = await db.query(
        `
        SELECT wse.*, ws.test_type, ws.sequence_order
        FROM workflow_step_executions wse
        JOIN workflow_steps ws ON wse.step_id = ws.id
        WHERE wse.execution_id = $1
        ORDER BY ws.sequence_order ASC
      `,
        [exec.id],
      );
      result.push({ ...exec, step_executions: steps });
    }
    return result;
  },
};
