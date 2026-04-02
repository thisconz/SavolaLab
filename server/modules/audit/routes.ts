import { Hono } from "hono";
import { AuditFilters, AuditService } from "./service";
import { authenticateToken, requireRoles } from "../../core/middleware";
import type { Variables } from "../../core/types";

const app = new Hono<{ Variables: Variables }>();

/**
 * Input validation (minimal but critical)
 */
function validateCreateLog(body: any) {
  if (!body || typeof body !== "object") {
    throw new Error("Invalid request body");
  }

  const { action, details } = body;

  if (!action || typeof action !== "string") {
    throw new Error("Invalid action");
  }

  return {
    action: action.trim().slice(0, 100), // prevent abuse
    details:
      typeof details === "string"
        ? details.slice(0, 1000)
        : JSON.stringify(details ?? {}),
  };
}

/**
 * Extract safe IP (proxy-aware)
 */
function getClientIp(c: any): string {
  const forwarded = c.req.header("x-forwarded-for");
  if (typeof forwarded === "string") {
    return forwarded.split(",")[0].trim();
  }
  return "127.0.0.1";
}

/**
 * Routes
 */

// GET logs (should be restricted later via RBAC)
app.get(
  "/",
  authenticateToken,
  requireRoles("ADMIN", "HEAD_MANAGER", "ASSISTING_MANAGER"),
  async (c) => {
    const filters: AuditFilters = {
      employee_number: c.req.query("employee_number"),
      action: c.req.query("action"),
      start_date: c.req.query("start_date"),
      end_date: c.req.query("end_date"),
      limit: Number(c.req.query("limit") || 50),
      offset: Number(c.req.query("offset") || 0),
    };

    const logs = await AuditService.getLogs(filters);
    return c.json({ success: true, data: logs });
  },
);

// CREATE log (non-blocking safe)
app.post("/", authenticateToken, async (c) => {
  try {
    const user = c.get("user");
    if (!user) {
      return c.json({ success: false, error: "Unauthorized" }, 401);
    }

    const body = await c.req.json();
    const { action, details } = validateCreateLog(body);

    // Fire-and-forget pattern (audit should not block request)
    try {
      await AuditService.createLog(
        user.employee_number,
        action,
        details,
        getClientIp(c),
      );
    } catch (err) {
      // Never break user flow because of audit failure
      console.error("❌ AUDIT WRITE FAILED", {
        error: err,
      });
    }

    return c.json({ success: true });
  } catch (err: any) {
    console.error("Failed to create audit log:", err);
    return c.json(
      { success: false, error: err.message || "Failed to create audit log" },
      400,
    );
  }
});

export default app;
