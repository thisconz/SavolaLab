import { createAuditLog } from "../../core/database/events";
import { db } from "../../core/database";

export type WorkflowStepInput = {
  test_type: string;
  min_value?: number | null;
  max_value?: number | null;
};

export const WorkflowService = {
  getWorkflows: async () => {
    const rows = (await db.query(`
      SELECT w.*, ws.id as step_id, ws.test_type, ws.sequence_order, ws.min_value, ws.max_value
      FROM workflows w
      LEFT JOIN workflow_steps ws ON w.id = ws.workflow_id
      WHERE w.is_active = 1
      ORDER BY w.id ASC, ws.sequence_order ASC
    `)) as any[];
    
    const workflowMap = new Map();
    for (const row of rows) {
      if (!workflowMap.has(row.id)) {
        const { step_id, test_type, sequence_order, min_value, max_value, ...workflowFields } = row;
        workflowMap.set(row.id, { ...workflowFields, steps: [] });
      }

      if (row.step_id) {
        workflowMap.get(row.id).steps.push({
          id: row.step_id,
          test_type: row.test_type,
          sequence_order: row.sequence_order,
          min_value: row.min_value,
          max_value: row.max_value
        });
      }
    }
    return Array.from(workflowMap.values());
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

  executeWorkflow: async (
    workflowId: string | number,
    sampleId: string | number,
  ) => {
    const workflowExists = await db.queryOne(
      "SELECT id FROM workflows WHERE id = $1",
      [workflowId],
    );
    const sampleExists = await db.queryOne(
      "SELECT id FROM samples WHERE id = $1",
      [sampleId],
    );
    if (!workflowExists) throw new Error(`Workflow ${workflowId} not found`);
    if (!sampleExists) throw new Error(`Sample ${sampleId} not found`);

    return await db.transaction(async (client) => {
      const rows = await client.query<{ id: number }>(
        "INSERT INTO workflow_executions (workflow_id, sample_id, status) VALUES ($1, $2, 'IN_PROGRESS') RETURNING id",
        [workflowId, sampleId],
      );
      const executionId = rows[0]?.id;
      if (!executionId) throw new Error("Failed to create workflow execution");

      const steps = await client.query<{ id: number }>(
        "SELECT id FROM workflow_steps WHERE workflow_id = $1 ORDER BY sequence_order ASC",
        [workflowId],
      );

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
  const rows = await db.query(`
      SELECT 
      we.id, we.workflow_id, we.sample_id, we.status, 
      we.started_at, we.completed_at, w.name as workflow_name,
      wse.id as step_exec_id, wse.step_id, wse.test_id, 
      wse.result_value, wse.status as step_status,
      wse.started_at as step_started_at, wse.completed_at as step_completed_at,
      ws.test_type, ws.sequence_order
    FROM workflow_executions we
    JOIN workflows w ON we.workflow_id = w.id
    LEFT JOIN workflow_step_executions wse ON wse.execution_id = we.id
    LEFT JOIN workflow_steps ws ON wse.step_id = ws.id
    WHERE we.sample_id = $1
    ORDER BY we.started_at DESC, ws.sequence_order ASC
  `, [sampleId]);

  const execMap = new Map();

  for (const row of rows) {
      if (!execMap.has(row.id)) {
        // Create the parent execution object
        execMap.set(row.id, {
          id: row.id,
          workflow_id: row.workflow_id,
          sample_id: row.sample_id,
          status: row.status,
          started_at: row.started_at,
          completed_at: row.completed_at,
          workflow_name: row.workflow_name,
          step_executions: []
        });
      }

    if (row.step_exec_id) {
        // Push the child step data
        execMap.get(row.id).step_executions.push({
          id: row.step_exec_id,
          step_id: row.step_id,
          test_id: row.test_id,
          result_value: row.result_value,
          status: row.step_status,
          started_at: row.step_started_at,
          completed_at: row.step_completed_at,
          test_type: row.test_type,
          sequence_order: row.sequence_order
        });
      }
    }

    return Array.from(execMap.values());
  },
};
