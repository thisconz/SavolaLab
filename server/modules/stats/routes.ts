import { Hono } from "hono";
import { StatService } from "./service";
import { authenticateToken } from "../../core/middleware";
import type { Variables } from "../../core/types";

const app = new Hono<{ Variables: Variables }>();

// --- Get all stat requests ---
app.get("/", authenticateToken, async (c) => {
  try {
    const stats = await StatService.getStats();
    return c.json({ success: true, data: stats });
  } catch (err: any) {
    console.error("Error fetching stats:", err);
    return c.json(
      { success: false, error: err.message || "Failed to fetch stats" },
      500,
    );
  }
});

// --- Create a new stat request ---
app.post("/", authenticateToken, async (c) => {
  try {
    const user = c.get("user");
    const body = await c.req.json();
    const employeeNumber = user?.employee_number || "system";
    const ip = c.req.header("x-forwarded-for") || "127.0.0.1";

    const id = await StatService.createStat(body, employeeNumber, ip);
    return c.json({ success: true, data: { id } }, 201);
  } catch (err: any) {
    console.error("Error creating stat:", err);
    return c.json(
      { success: false, error: err.message || "Failed to create stat request" },
      500,
    );
  }
});

// --- Update stat request status ---
app.put("/:id/status", authenticateToken, async (c) => {
  try {
    const user = c.get("user");
    const id = c.req.param("id");
    const body = await c.req.json();
    const employeeNumber = user?.employee_number || "system";
    const ip = c.req.header("x-forwarded-for") || "127.0.0.1";

    await StatService.updateStatStatus(id, body.status, employeeNumber, ip);
    return c.json({ success: true });
  } catch (err: any) {
    console.error("Error updating stat status:", err);
    return c.json(
      { success: false, error: err.message || "Failed to update stat status" },
      500,
    );
  }
});

export default app;
