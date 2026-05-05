import { Hono } from "hono";
import { WorkflowService } from "./service";
import { authenticateToken } from "../../core/middleware";
import { logger } from "../../core/logger";
import { requireIntParam } from "../../core/utils/params";

const app = new Hono();

// GET /workflows
app.get("/", authenticateToken, async (c) => {
  try {
    const workflows = await WorkflowService.getWorkflows();
    return c.json({ success: true, data: workflows });
  } catch (err: any) {
    logger.error({ err }, "Failed to fetch workflows");
    return c.json({ success: false, error: err.message || "Failed to fetch workflows" }, 500);
  }
});

// POST /workflows
app.post("/", authenticateToken, async (c) => {
  try {
    const body = await c.req.json();
    const id = await WorkflowService.createWorkflow(body);
    return c.json({ success: true, data: { id } }, 201);
  } catch (err: any) {
    logger.error({ err }, "Failed to create workflow");
    return c.json({ success: false, error: err.message }, 400);
  }
});

// POST /workflows/:id/execute
app.post("/:id/execute", authenticateToken, async (c) => {
  try {
    const body = await c.req.json();
    if (body.sample_id === undefined) return c.json({ success: false, error: "sample_id is required" }, 400);
    const id = requireIntParam(c.req.param("id"), "id");
    const executionId = await WorkflowService.executeWorkflow(id, body.sample_id);
    return c.json({ success: true, data: { executionId } }, 201);
  } catch (err: any) {
    logger.error({ err }, "Failed to execute workflow");
    return c.json({ success: false, error: err.message }, 400);
  }
});

// POST /workflows/executions/:id/steps/:step_id/start
app.post("/executions/:id/steps/:step_id/start", authenticateToken, async (c) => {
  try {
    const id = requireIntParam(c.req.param("id"), "id");
    const stepId = requireIntParam(c.req.param("step_id"), "step_id");
    await WorkflowService.startStep(id, stepId);
    return c.json({ success: true });
  } catch (err: any) {
    logger.error({ err }, "Failed to start step");
    return c.json({ success: false, error: err.message }, 400);
  }
});

// POST /workflows/executions/:id/steps/:step_id/complete
app.post("/executions/:id/steps/:step_id/complete", authenticateToken, async (c) => {
  try {
    const body = await c.req.json();
    const { status, test_id, result_value } = body;
    const id = requireIntParam(c.req.param("id"), "id");
    const stepId = requireIntParam(c.req.param("step_id"), "step_id");
    await WorkflowService.completeStep(id, stepId, status, test_id, result_value);
    return c.json({ success: true });
  } catch (err: any) {
    logger.error({ err }, "Failed to complete step");
    return c.json({ success: false, error: err.message }, 400);
  }
});

// GET /workflows/executions/:sample_id
app.get("/executions/:sample_id", authenticateToken, async (c) => {
  try {
    const sampleId = requireIntParam(c.req.param("sample_id"), "sample_id");
    const executions = await WorkflowService.getExecutionsBySample(sampleId);
    return c.json({ success: true, data: executions });
  } catch (err: any) {
    logger.error({ err }, "Failed to fetch executions");
    return c.json(
      {
        success: false,
        error: err.message || "Failed to fetch workflow executions",
      },
      500,
    );
  }
});

export default app;
