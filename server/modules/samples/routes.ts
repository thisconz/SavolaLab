import { Hono } from "hono";
import type { Variables } from "../../core/types";
import { SampleService } from "./service";
import { authenticateToken, requirePermission } from "../../core/middleware";
import {
  CreateSampleRequestSchema,
  UpdateSampleRequestSchema,
  GetSamplesResponseSchema,
  GetSampleResponseSchema,
} from "../../../src/shared/schemas/sample.schema";
import { logger } from "../../core/logger";

const app = new Hono<{ Variables: Variables }>();

function getIp(c: any): string {
  return (c.req.header("x-forwarded-for") ?? "127.0.0.1").split(",")[0].trim();
}

function toMsg(err: unknown): string {
  if (err instanceof Error) return err.message;
  return "An unexpected error occurred.";
}

// GET /samples
app.get("/", authenticateToken, async (c) => {
  const requestId = c.get("requestId");
  try {
    const samples = await SampleService.getSamples();
    return c.json(GetSamplesResponseSchema.parse({ success: true, data: samples }));
  } catch (err: unknown) {
    logger.error({ err, requestId }, "Failed to fetch samples");
    return c.json({ success: false, error: toMsg(err) }, 500);
  }
});

// POST /samples
app.post("/", authenticateToken, requirePermission("input_data"), async (c) => {
  const requestId = c.get("requestId");
  try {
    const user = c.get("user");
    const body = await c.req.json();
    const validated = CreateSampleRequestSchema.parse(body);

    const id = await SampleService.createSample(validated, user.employee_number);
    return c.json({ success: true, id }, 201);
  } catch (err: unknown) {
    logger.error({ err, requestId }, "Failed to create sample");
    return c.json({ success: false, error: toMsg(err) }, 400);
  }
});

// PUT /samples/:id
app.put("/:id", authenticateToken, requirePermission("input_data"), async (c) => {
  const requestId = c.get("requestId");
  try {
    const sampleId = Number(c.req.param("id"));
    if (!Number.isInteger(sampleId) || sampleId < 1) {
      return c.json({ success: false, error: "Invalid sample ID." }, 400);
    }
    const user = c.get("user");
    const body = await c.req.json();
    const validated = UpdateSampleRequestSchema.parse(body);

    await SampleService.updateSample(sampleId, validated, user.employee_number, getIp(c));
    return c.json({ success: true });
  } catch (err: unknown) {
    logger.error({ err, requestId }, "Failed to update sample");
    return c.json({ success: false, error: toMsg(err) }, 400);
  }
});

// GET /samples/previous-results
app.get("/previous-results", authenticateToken, async (c) => {
  const requestId = c.get("requestId");
  try {
    const stage = c.req.query("stage") ?? "";
    const testType = c.req.query("testType") ?? "";
    const limit = Math.min(Number(c.req.query("limit") ?? 5), 50);

    if (!stage || !testType) {
      return c.json({ success: false, error: "stage and testType are required." }, 400);
    }

    const data = await SampleService.getPreviousResults(stage, testType, limit);
    return c.json({ success: true, data });
  } catch (err: unknown) {
    logger.error({ err, requestId }, "Failed to fetch previous results");
    return c.json({ success: false, error: toMsg(err) }, 500);
  }
});

// GET /samples/:id/tests
app.get("/:id/tests", authenticateToken, async (c) => {
  const requestId = c.get("requestId");
  try {
    const sampleId = Number(c.req.param("id"));
    if (!Number.isInteger(sampleId) || sampleId < 1) {
      return c.json({ success: false, error: "Invalid sample ID." }, 400);
    }

    const data = await SampleService.getSampleTests(sampleId);
    return c.json({ success: true, data });
  } catch (err: unknown) {
    logger.error({ err, requestId }, "Failed to fetch sample tests");
    return c.json({ success: false, error: toMsg(err) }, 500);
  }
});

export default app;
