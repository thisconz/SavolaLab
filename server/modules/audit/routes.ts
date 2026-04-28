import { Hono, Context } from "hono";
import type { Variables } from "../../core/types";
import { AuditFilters, AuditService } from "./service";
import { authenticateToken, requireRoles } from "../../core/middleware";
import { CreateAuditLogRequestSchema } from "../../../src/shared/schemas/audit.schema";
import { logger } from "../../core/logger";

const app = new Hono<{ Variables: Variables }>();

const TRUSTED_PROXIES = new Set(
  (process.env.TRUSTED_PROXY_IPS ?? "127.0.0.1,::1").split(",").map((s) => s.trim()),
);

/**
 * Extract safe IP (proxy-aware)
 */
function getClientIp(c: Context): string {
  let socketIp = "unknown";

  const raw = c.req.raw as any;

  // Node.js / Bun (if available)
  if (raw && raw.socket && typeof raw.socket.remoteAddress === "string") {
    socketIp = raw.socket.remoteAddress;
  }

  // Edge runtimes (Cloudflare, etc.)
  else if (c.env && typeof (c.env as any).remoteAddress === "string") {
    socketIp = (c.env as any).remoteAddress;
  }

  if (TRUSTED_PROXIES.has(socketIp)) {
    const forwarded = c.req.header("x-forwarded-for");
    if (forwarded) return forwarded.split(",")[0].trim();

    const realIp = c.req.header("x-real-ip");
    if (realIp) return realIp;
  }

  return socketIp;
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
    const reqId = c.get("requestId");
    try {
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
    } catch (err: any) {
      logger.error({ reqId, err }, "Failed to fetch audit logs");
      return c.json({ success: false, error: "Internal Server Error" }, 500);
    }
  },
);

// CREATE log (non-blocking safe)
app.post("/", authenticateToken, async (c) => {
  const reqId = c.get("requestId");
  try {
    const user = c.get("user");
    if (!user) {
      return c.json({ success: false, error: "Unauthorized" }, 401);
    }

    const body = await c.req.json();
    const parsedBody = CreateAuditLogRequestSchema.parse(body);
    const detailsStr =
      typeof parsedBody.details === "string"
        ? parsedBody.details
        : JSON.stringify(parsedBody.details ?? {});

    // Fire-and-forget pattern (audit should not block request)
    try {
      void AuditService.createLog(
        user.employee_number,
        parsedBody.action,
        detailsStr,
        getClientIp(c),
      );
    } catch (err) {
      // Never break user flow because of audit failure
      logger.error({ reqId, err }, "AUDIT WRITE FAILED");
    }

    return c.json({ success: true });
  } catch (err: any) {
    logger.error({ reqId, err }, "Failed to create audit log");
    return c.json({ success: false, error: err.message || "Failed to create audit log" }, 400);
  }
});

export default app;
