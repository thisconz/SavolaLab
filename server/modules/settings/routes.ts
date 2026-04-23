import { Hono } from "hono";
import type { Variables } from "../../core/types";
import { SettingsService, ALLOWED_TABLES } from "./service";
import { authenticateToken, requireRoles } from "../../core/middleware";
import { logger } from "../../core/logger";
import { requireParam, requireIntParam } from "@/server/core/utils/params";

const app = new Hono<{ Variables: Variables }>();

const DELETABLE_TABLES = new Set(["sample_types", "clients", "inventory"]);

const validateTable = (t: string) => ALLOWED_TABLES.has(t);

app.get("/preferences", authenticateToken, async (c) => {
  const reqId = c.get("requestId");
  try {
    return c.json({
      success: true,
      data: await SettingsService.getPreferences(),
    });
  } catch (err: any) {
    logger.error({ reqId, err });
    return c.json({ success: false, error: "Internal server error" }, 500);
  }
});

app.get("/:table", authenticateToken, async (c) => {
  const reqId = c.get("requestId");
  const table = requireParam(c.req.param("table"), "table");
  if (!validateTable(table))
    return c.json({ success: false, error: `Unauthorized access to: ${table}` }, 400);
  try {
    return c.json({ success: true, data: await SettingsService.getAll(table) });
  } catch (err: any) {
    logger.error({ reqId, err, table });
    return c.json({ success: false, error: "Internal server error" }, 500);
  }
});

app.post("/:table", authenticateToken, async (c) => {
  const reqId = c.get("requestId");
  const table = requireParam(c.req.param("table"), "table");
  if (!validateTable(table)) return c.json({ success: false, error: "Invalid table" }, 400);
  try {
    const body = await c.req.json();
    const result = await SettingsService.create(table, body);
    return c.json({ success: true, data: result }, 201);
  } catch (err: any) {
    logger.error({ reqId, err, table });
    return c.json({ success: false, error: err.message || "Internal server error" }, 500);
  }
});

app.put("/:table/:id", authenticateToken, async (c) => {
  const reqId = c.get("requestId");
  const table = requireParam(c.req.param("table"), "table");
  const id = requireParam(c.req.param("id"), "id");
  if (!validateTable(table)) return c.json({ success: false, error: "Invalid table" }, 400);
  try {
    const body = await c.req.json();
    const result = await SettingsService.update(table, id, body);
    return c.json({ success: true, data: result });
  } catch (err: any) {
    logger.error({ reqId, err, table, id });
    return c.json({ success: false, error: "Internal server error" }, 500);
  }
});

app.delete("/:table/:id", authenticateToken, requireRoles("ADMIN", "HEAD_MANAGER"), async (c) => {
  const reqId = c.get("requestId");
  const table = requireParam(c.req.param("table"), "table");
  const id = c.req.param("id");

  if (!validateTable(table)) return c.json({ success: false, error: "Invalid table" }, 400);
  if (!DELETABLE_TABLES.has(table))
    return c.json({ success: false, error: `Table '${table}' does not support deletion` }, 403);

  try {
    // Determine PK column
    const pkCol =
      table === "employees" ? "employee_number" : table === "system_preferences" ? "key" : "id";
    const { db } = await import("../../core/database");
    await db.execute(`DELETE FROM ${table} WHERE ${pkCol} = $1`, [id]);

    logger.info(
      { table, id, user: (c as any).get?.("user")?.employee_number },
      "Record deleted via settings API",
    );
    return c.json({ success: true });
  } catch (err: any) {
    logger.error({ reqId, err, table, id });
    return c.json({ success: false, error: err.message || "Delete failed" }, 500);
  }
});

export default app;
