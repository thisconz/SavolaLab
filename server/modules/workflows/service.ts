import { db } from "../../core/database";
import { logger } from "../../core/logger";

export type WorkflowStepInput = {
  test_type:  string;
  min_value?: number | null;
  max_value?: number | null;
};

export const WorkflowService = {
  getWorkflows: async () => {
    try {
      const workflows = await db.query(
        "SELECT * FROM workflows WHERE is_active = 1 ORDER BY created_at DESC",
      );
      const result = [];
      for (const wf of workflows) {
        const steps = await db.query(
          "SELECT * FROM workflow_steps WHERE workflow_id = $1 ORDER BY sequence_order ASC",
          [(wf as any).id],
        );
        result.push({ ...wf, steps });
      }
      return result;
    } catch (err: any) {
      if (err.message === "Database not connected") return [];
      throw err;
    }
  },

  createWorkflow: async (data: {
    name:          string;
    description?:  string;
    target_stage?: string;
    steps:         WorkflowStepInput[];
  }) => {
    const { name, description, target_stage, steps } = data;
    if (!name?.trim())   throw new Error("Workflow name is required");
    if (!steps?.length)  throw new Error("At least one step is required");

    return db.transaction(async (client) => {
      // FIX TS2347: cast result array instead of using type argument on client.query()
      const wfRows = (await client.query(
        "INSERT INTO workflows (name, description, target_stage) VALUES ($1, $2, $3) RETURNING id",
        [name.trim(), description ?? null, target_stage ?? null],
      )) as Array<{ id: number }>;

      const workflowId = wfRows[0].id;

      for (let i = 0; i < steps.length; i++) {
        await client.query(
          `INSERT INTO workflow_steps
             (workflow_id, test_type, sequence_order, min_value, max_value)
           VALUES ($1, $2, $3, $4, $5)`,
          [workflowId, steps[i].test_type, i + 1, steps[i].min_value ?? null, steps[i].max_value ?? null],
        );
      }

      return workflowId;
    });
  },

  executeWorkflow: async (
    workflowId: string | number,
    sampleId:   string | number,
  ) => {
    const workflow = await db.queryOne("SELECT id FROM workflows WHERE id = $1", [workflowId]);
    const sample   = await db.queryOne("SELECT id FROM samples   WHERE id = $1", [sampleId]);

    if (!workflow) throw new Error(`Workflow ${workflowId} not found`);
    if (!sample)   throw new Error(`Sample ${sampleId} not found`);

    return db.transaction(async (client) => {
      // FIX TS2347: cast result instead of type arg
      const execRows = (await client.query(
        "INSERT INTO workflow_executions (workflow_id, sample_id, status) VALUES ($1, $2, 'IN_PROGRESS') RETURNING id",
        [workflowId, sampleId],
      )) as Array<{ id: number }>;

      const executionId = execRows[0].id;

      // FIX TS2347: cast result
      const stepRows = (await client.query(
        "SELECT id FROM workflow_steps WHERE workflow_id = $1 ORDER BY sequence_order ASC",
        [workflowId],
      )) as Array<{ id: number }>;

      for (const step of stepRows) {
        await client.query(
          "INSERT INTO workflow_step_executions (execution_id, step_id, status) VALUES ($1, $2, 'PENDING')",
          [executionId, step.id],
        );
      }

      return executionId;
    });
  },

  startStep: async (executionId: string | number, stepId: string | number) => {
    await db.execute(
      `UPDATE workflow_step_executions
       SET status = 'IN_PROGRESS', started_at = CURRENT_TIMESTAMP
       WHERE execution_id = $1 AND step_id = $2`,
      [executionId, stepId],
    );
    return true;
  },

  completeStep: async (
    executionId:  string | number,
    stepId:       string | number,
    status        = "COMPLETED",
    testId?:      number,
    resultValue?: number,
  ) => {
    return db.transaction(async (client) => {
      const rows = await client.query(
        "SELECT id FROM workflow_step_executions WHERE execution_id = $1 AND step_id = $2",
        [executionId, stepId],
      ) as Array<{ id: number }>;

      if (!rows[0]) throw new Error("Step execution not found");

      await client.query(
        `UPDATE workflow_step_executions
         SET status = $1, completed_at = CURRENT_TIMESTAMP,
             test_id = $2, result_value = $3
         WHERE execution_id = $4 AND step_id = $5`,
        [status, testId ?? null, resultValue ?? null, executionId, stepId],
      );

      // Auto-complete workflow when all steps are finished
      const pendingRows = (await client.query(
        `SELECT COUNT(*) AS count
         FROM workflow_step_executions
         WHERE execution_id = $1 AND status NOT IN ('COMPLETED','FAILED')`,
        [executionId],
      )) as Array<{ count: string }>;

      if (Number(pendingRows[0]?.count ?? 1) === 0) {
        await client.query(
          "UPDATE workflow_executions SET status = 'COMPLETED', completed_at = CURRENT_TIMESTAMP WHERE id = $1",
          [executionId],
        );
      }

      return true;
    });
  },

  getExecutionsBySample: async (sampleId: string | number) => {
    try {
      const executions = await db.query(
        `SELECT we.*, w.name AS workflow_name
         FROM workflow_executions we
         JOIN workflows w ON we.workflow_id = w.id
         WHERE we.sample_id = $1
         ORDER BY we.started_at DESC`,
        [sampleId],
      );

      const result = [];
      for (const exec of executions) {
        // FIX: JOIN workflow_steps to get test_type — it doesn't live on step_executions
        const steps = await db.query(
          `SELECT wse.*, ws.test_type, ws.sequence_order, ws.min_value, ws.max_value
           FROM workflow_step_executions wse
           JOIN workflow_steps ws ON wse.step_id = ws.id
           WHERE wse.execution_id = $1
           ORDER BY ws.sequence_order ASC`,
          [(exec as any).id],
        );
        result.push({ ...exec, step_executions: steps });
      }

      return result;
    } catch (err: any) {
      if (err.message === "Database not connected") return [];
      throw err;
    }
  },
};