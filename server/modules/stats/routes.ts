import { Hono } from "hono";
import type { Variables } from "../../core/types";
import { StatService } from "./service";
import { authenticateToken } from "../../core/middleware";
import {
  CreateStatRequestSchema,
  UpdateStatStatusRequestSchema,
} from "../../../src/shared/schemas/stat.schema";
import { logger } from "../../core/logger";

const app = new Hono<{ Variables: Variables }>();

// --- Get all stat requests ---
app.get("/", authenticateToken, async (c) => {
  const reqId = c.get("requestId");
  try {
    const stats = await StatService.getStats();
    return c.json({ success: true, data: stats });
  } catch (err: any) {
    logger.error({ reqId, err }, "Error fetching stats");
    return c.json(
      { success: false, error: err.message || "Failed to fetch stats" },
      500,
    );
  }
});

// --- Create a new stat request ---
app.post("/", authenticateToken, async (c) => {
  const reqId = c.get("requestId");
  try {
    const user = c.get("user");
    const body = await c.req.json();
    const parsedBody = CreateStatRequestSchema.parse(body);
    const employeeNumber = user?.employee_number || "system";
    const ip = c.req.header("x-forwarded-for") || "127.0.0.1";

    const id = await StatService.createStat(parsedBody, employeeNumber, ip);
    return c.json({ success: true, data: { id } }, 201);
  } catch (err: any) {
    logger.error({ reqId, err }, "Error creating stat");
    return c.json(
      { success: false, error: err.message || "Failed to create stat request" },
      400,
    );
  }
});

// --- Update stat request status ---
app.put("/:id/status", authenticateToken, async (c) => {
  const reqId = c.get("requestId");
  try {
    const user = c.get("user");
    const id = c.req.param("id");
    const body = await c.req.json();
    const parsedBody = UpdateStatStatusRequestSchema.parse(body);
    const employeeNumber = user?.employee_number || "system";
    const ip = c.req.header("x-forwarded-for") || "127.0.0.1";

    await StatService.updateStatStatus(
      id as string,
      parsedBody.status,
      employeeNumber,
      ip,
    );
    return c.json({ success: true });
  } catch (err: any) {
    logger.error({ reqId, err }, "Error updating stat status");
    return c.json(
      { success: false, error: err.message || "Failed to update stat status" },
      400,
    );
  }
});

export default app;
