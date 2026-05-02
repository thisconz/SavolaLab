import { Hono } from "hono";
import type { Variables } from "../../core/types";
import { TestService } from "./service";
import { authenticateToken } from "../../core/middleware";
import { handleRouteError } from "../../core/utils/route"
import {
  CreateTestRequestSchema,
  UpdateTestRequestSchema,
  ReviewTestRequestSchema,
} from "../../../src/shared/schemas/test.schema";
import { logger } from "../../core/logger";

const app = new Hono<{ Variables: Variables }>();

// GET /tests - fetch all test results
app.get("/", authenticateToken, async (c) => {
  const reqId = c.get("requestId");
  try {
    const tests = await TestService.getTests();
    return c.json({ success: true, data: tests });
  } catch (err: any) {
    logger.error({ reqId, err }, "Error fetching tests");
    return handleRouteError(err, c, "TestService.getTests");
  }
});

// POST /tests - create a new test result
app.post("/", authenticateToken, async (c) => {
  const reqId = c.get("requestId");
  try {
    const body = await c.req.json();
    const parsedBody = CreateTestRequestSchema.parse(body);
    const user = c.get("user");
    const performerId = user.employee_number;
    const ip = c.req.header("x-forwarded-for") || "127.0.0.1";

    const id = await TestService.createTestResult(
      parsedBody.sample_id,
      parsedBody,
      performerId,
      ip,
    );
    return c.json({ success: true, id }, 201);
  } catch (err: any) {
    logger.error({ reqId, err }, "Error creating test");
    return c.json({ success: false, error: err.message }, 400);
  }
});

// PUT /tests/:id - update a test
app.put("/:id", authenticateToken, async (c) => {
  const reqId = c.get("requestId");
  try {
    const testId = c.req.param("id");
    const body = await c.req.json();
    const parsedBody = UpdateTestRequestSchema.parse(body);
    const user = c.get("user");
    const performerId = user.employee_number;
    const ip = c.req.header("x-forwarded-for") || "127.0.0.1";

    await TestService.updateTest(testId as string, parsedBody, performerId, ip);
    return c.json({ success: true });
  } catch (err: any) {
    logger.error({ reqId, err }, "Error updating test");
    return c.json({ success: false, error: err.message }, 400);
  }
});

// POST /tests/:id/review - review a test
app.post("/:id/review", authenticateToken, async (c) => {
  const reqId = c.get("requestId");
  try {
    const testId = c.req.param("id");
    const body = await c.req.json();
    const parsedBody = ReviewTestRequestSchema.parse(body);
    const user = c.get("user");
    const performerId = user.employee_number;
    const role = user.role;

    await TestService.reviewTest(testId as string, parsedBody, performerId, role);
    return c.json({ success: true });
  } catch (err: any) {
    logger.error({ reqId, err }, "Error reviewing test");
    return c.json({ success: false, error: err.message }, 400);
  }
});

// DELETE /tests/:id - block deletion, log attempt
app.delete("/:id", authenticateToken, async (c) => {
  const reqId = c.get("requestId");
  try {
    const testId = c.req.param("id");
    const user = c.get("user");
    const performerId = user.employee_number;
    const ip = c.req.header("x-forwarded-for") || "127.0.0.1";

    await TestService.logDeletionAttempt(testId as string, performerId, ip);

    return c.json(
      {
        success: false,
        error: "Test results cannot be deleted. Append-only behavior is enforced.",
      },
      403,
    );
  } catch (err: any) {
    logger.error({ reqId, err }, "Error logging deletion attempt");
    return handleRouteError(err, c, "TestService.logDeletionAttempt");
  }
});

export default app;
