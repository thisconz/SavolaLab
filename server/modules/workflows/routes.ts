import { Hono } from "hono";
import type { Variables } from "../../core/types";
import { WorkflowService } from "./service";
import { authenticateToken } from "../../core/middleware";
import { logger } from "../../core/logger";

const app = new Hono();

// GET /workflows
app.get("/", authenticateToken, async (c) => {
  try {
    const workflows = await WorkflowService.getWorkflows();
    return c.json({ success: true, data: workflows });
  } catch (err: any) {
    console.error("Failed to fetch workflows:", err);
    return c.json(
      { success: false, error: err.message || "Failed to fetch workflows" },
      500,
    );
  }
});

// POST /workflows
app.post("/", authenticateToken, async (c) => {
  try {
    const body = await c.req.json();
    const id = await WorkflowService.createWorkflow(body);
    return c.json({ success: true, data: { id } }, 201);
  } catch (err: any) {
    console.error("Failed to create workflow:", err);
    return c.json({ success: false, error: err.message }, 400);
  }
});

// POST /workflows/:id/execute
app.post("/:id/execute", authenticateToken, async (c) => {
  try {
    const body = await c.req.json();
    if (!body.sample_id)
      return c.json({ success: false, error: "sample_id is required" }, 400);
    const executionId = await WorkflowService.executeWorkflow(
      c.req.param("id"),
      body.sample_id,
    );
    return c.json({ success: true, data: { executionId } }, 201);
  } catch (err: any) {
    console.error("Failed to execute workflow:", err);
    return c.json({ success: false, error: err.message }, 400);
  }
});

// POST /workflows/executions/:id/steps/:step_id/start
app.post(
  "/executions/:id/steps/:step_id/start",
  authenticateToken,
  async (c) => {
    try {
      await WorkflowService.startStep(
        c.req.param("id"),
        c.req.param("step_id"),
      );
      return c.json({ success: true });
    } catch (err: any) {
      console.error("Failed to start step:", err);
      return c.json({ success: false, error: err.message }, 400);
    }
  },
);

// POST /workflows/executions/:id/steps/:step_id/complete
app.post(
  "/executions/:id/steps/:step_id/complete",
  authenticateToken,
  async (c) => {
    try {
      const body = await c.req.json();
      const { status, test_id, result_value } = body;
      await WorkflowService.completeStep(
        c.req.param("id"),
        c.req.param("step_id"),
        status,
        test_id,
        result_value,
      );
      return c.json({ success: true });
    } catch (err: any) {
      console.error("Failed to complete step:", err);
      return c.json({ success: false, error: err.message }, 400);
    }
  },
);

// GET /workflows/executions/:sample_id
app.get("/executions/:sample_id", authenticateToken, async (c) => {
  try {
    const executions = await WorkflowService.getExecutionsBySample(
      c.req.param("sample_id"),
    );
    return c.json({ success: true, data: executions });
  } catch (err: any) {
    console.error("Failed to fetch executions:", err);
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
