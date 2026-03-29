import { Hono } from "hono";
import { SampleService } from "./service";
import { authenticateToken, requirePermission } from "../../core/middleware";
import type { Variables } from "../../core/types";

const app = new Hono<{ Variables: Variables }>();

function getIp(c: any): string {
  return (c.req.header("x-forwarded-for") ?? "127.0.0.1").split(",")[0].trim();
}

function toMsg(err: unknown): string {
  return err instanceof Error ? err.message : "An unexpected error occurred.";
}

// GET /samples
app.get("/", authenticateToken, async (c) => {
  try {
    return c.json({ success: true, data: await SampleService.getSamples() });
  } catch (err: unknown) {
    return c.json({ success: false, error: toMsg(err) }, 500);
  }
});

// POST /samples
app.post("/", authenticateToken, requirePermission("input_data"), async (c) => {
  try {
    const user = c.get("user");
    const body = await c.req.json();
    const id = await SampleService.createSample(body, user.employee_number);
    return c.json({ success: true, id }, 201);
  } catch (err: unknown) {
    return c.json({ success: false, error: toMsg(err) }, 400);
  }
});

// PUT /samples/:id
app.put(
  "/:id",
  authenticateToken,
  requirePermission("input_data"),
  async (c) => {
    try {
      const sampleId = Number(c.req.param("id"));
      if (!Number.isInteger(sampleId) || sampleId < 1) {
        return c.json({ success: false, error: "Invalid sample ID." }, 400);
      }
      const user = c.get("user");
      const body = await c.req.json();
      await SampleService.updateSample(
        sampleId,
        body,
        user.employee_number,
        getIp(c),
      );
      return c.json({ success: true });
    } catch (err: unknown) {
      return c.json({ success: false, error: toMsg(err) }, 400);
    }
  },
);

// GET /samples/previous-results
app.get("/previous-results", authenticateToken, async (c) => {
  try {
    const stage = c.req.query("stage") ?? "";
    const testType = c.req.query("testType") ?? "";
    const limit = Math.min(Number(c.req.query("limit") ?? 5), 50);
    if (!stage || !testType) {
      return c.json(
        { success: false, error: "stage and testType are required." },
        400,
      );
    }
    return c.json({
      success: true,
      data: await SampleService.getPreviousResults(stage, testType, limit),
    });
  } catch (err: unknown) {
    return c.json({ success: false, error: toMsg(err) }, 500);
  }
});

// GET /samples/:id/tests
app.get("/:id/tests", authenticateToken, async (c) => {
  try {
    const sampleId = Number(c.req.param("id"));
    if (!Number.isInteger(sampleId) || sampleId < 1) {
      return c.json({ success: false, error: "Invalid sample ID." }, 400);
    }
    return c.json({
      success: true,
      data: await SampleService.getSampleTests(sampleId),
    });
  } catch (err: unknown) {
    return c.json({ success: false, error: toMsg(err) }, 500);
  }
});

export default app;
