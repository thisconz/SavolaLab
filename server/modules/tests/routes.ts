import { Hono } from "hono";
import { TestService } from "./service";
import { authenticateToken } from "../../core/middleware";
import type { Variables } from "../../core/types";

const app = new Hono<{ Variables: Variables }>();

// GET /tests - fetch all test results
app.get("/", authenticateToken, async (c) => {
  try {
    const tests = await TestService.getTests();
    return c.json({ success: true, data: tests });
  } catch (err: any) {
    console.error("Error fetching tests:", err);
    return c.json({ success: false, error: err.message }, 500);
  }
});

// POST /tests - create a new test result
app.post("/", authenticateToken, async (c) => {
  try {
    const body = await c.req.json();
    const sampleId = Number(body.sample_id);
    const user = c.get("user");
    const performerId = user.employee_number;
    const ip = c.req.header("x-forwarded-for") || "127.0.0.1";

    if (!sampleId) throw new Error("sample_id is required");

    const id = await TestService.createTestResult(
      sampleId,
      body,
      performerId,
      ip,
    );
    return c.json({ success: true, id }, 201);
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 400);
  }
});

// PUT /tests/:id - update a test
app.put("/:id", authenticateToken, async (c) => {
  try {
    const testId = c.req.param("id");
    const body = await c.req.json();
    const user = c.get("user");
    const performerId = user.employee_number;
    const ip = c.req.header("x-forwarded-for") || "127.0.0.1";

    await TestService.updateTest(testId, body, performerId, ip);
    return c.json({ success: true });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 404);
  }
});

// POST /tests/:id/review - review a test
app.post("/:id/review", authenticateToken, async (c) => {
  try {
    const testId = c.req.param("id");
    const body = await c.req.json();
    const user = c.get("user");
    const performerId = user.employee_number;
    const role = user.role;

    await TestService.reviewTest(testId, body, performerId, role);
    return c.json({ success: true });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 403);
  }
});

// DELETE /tests/:id - block deletion, log attempt
app.delete("/:id", authenticateToken, async (c) => {
  try {
    const testId = c.req.param("id");
    const user = c.get("user");
    const performerId = user.employee_number;
    const ip = c.req.header("x-forwarded-for") || "127.0.0.1";

    await TestService.logDeletionAttempt(testId, performerId, ip);

    return c.json(
      {
        success: false,
        error:
          "Test results cannot be deleted. Append-only behavior is enforced.",
      },
      403,
    );
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

export default app;
