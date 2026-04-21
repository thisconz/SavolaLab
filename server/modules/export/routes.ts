import { Hono }             from "hono";
import type { Variables }   from "../../core/types";
import { authenticateToken, requireRoles } from "../../core/middleware";
import { buildExcelExport, ExportType }    from "./service";
import { logger }           from "../../core/logger";

const app = new Hono<{ Variables: Variables }>();

const ALLOWED_TYPES: ExportType[] = [
  "samples", "tests", "audit", "certificates", "instruments", "inventory",
];

app.get(
  "/:type",
  authenticateToken,
  requireRoles("ADMIN", "HEAD_MANAGER", "ASSISTING_MANAGER", "SHIFT_CHEMIST", "CHEMIST"),
  async (c) => {
    const type = c.req.param("type") as ExportType;

    if (!ALLOWED_TYPES.includes(type)) {
      return c.json({ success: false, error: `Invalid export type: ${type}` }, 400);
    }

    const limit   = Math.min(Number(c.req.query("limit") ?? "5000"), 10_000);
    const reqId   = c.get("requestId");
    const user    = c.get("user");

    try {
      logger.info({ type, limit, user: user.employee_number, reqId }, "Export requested");

      const buffer  = await buildExcelExport({ type, limit });
      const filename= `zenthar-${type}-${new Date().toISOString().split("T")[0]}.xlsx`;

      c.header("Content-Type",        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      c.header("Content-Disposition", `attachment; filename="${filename}"`);
      c.header("Content-Length",      String(buffer.byteLength));
      c.header("Cache-Control",       "no-store");

      return c.body(buffer);
    } catch (err: any) {
      logger.error({ err, type, reqId }, "Export failed");
      return c.json({ success: false, error: err.message || "Export failed" }, 500);
    }
  },
);

export default app;