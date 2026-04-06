import { Hono } from "hono";
import { SettingsService, ALLOWED_TABLES } from "./service";
import { authenticateToken } from "../../core/middleware";
import { logger } from "../../core/logger";
import type { Variables } from "../../core/types";

const app = new Hono<{ Variables: Variables }>();

/**
 * PRODUCTION FIX:
 * We use a reusable validator function to ensure all CRUD operations
 * respect the single source of truth in the Service layer.
 */
const validateTable = (table: string) => ALLOWED_TABLES.has(table);

// --- GET system preferences ---
app.get("/preferences", authenticateToken, async (c) => {
  const reqId = c.get("requestId");
  try {
    const prefs = await SettingsService.getPreferences();
    return c.json({ success: true, data: prefs });
  } catch (err: any) {
    logger.error({ reqId, err }, "Failed to fetch preferences");
    return c.json({ success: false, error: "Internal server error" }, 500);
  }
});

// --- GET all records from a table ---
app.get("/:table", authenticateToken, async (c) => {
  const reqId = c.get("requestId");
  const table = c.req.param("table");

  if (!validateTable(table as string)) {
    return c.json(
      {
        success: false,
        error: `Unauthorized access: ${table} is not an administrative table.`,
      },
      400,
    );
  }

  try {
    const data = await SettingsService.getAll(table as string);
    return c.json({ success: true, data });
  } catch (err: any) {
    logger.error({ reqId, err, table }, `Failed to fetch table ${table}`);
    return c.json({ success: false, error: "Internal server error" }, 500);
  }
});

// --- CREATE a new record ---
app.post("/:table", authenticateToken, async (c) => {
  const reqId = c.get("requestId");
  const table = c.req.param("table");

  if (!validateTable(table as string)) {
    return c.json({ success: false, error: "Invalid table" }, 400);
  }

  try {
    const body = await c.req.json();
    const result = await SettingsService.create(table as string, body);
    return c.json({ success: true, data: result }, 201);
  } catch (err: any) {
    logger.error({ reqId, err, table }, `Failed to create record in ${table}`);
    return c.json(
      { success: false, error: err.message || "Internal server error" },
      500,
    );
  }
});

// --- UPDATE an existing record ---
app.put("/:table/:id", authenticateToken, async (c) => {
  const reqId = c.get("requestId");
  const table = c.req.param("table");
  const id = c.req.param("id");

  if (!validateTable(table as string)) {
    return c.json({ success: false, error: "Invalid table" }, 400);
  }

  try {
    const body = await c.req.json();
    const result = await SettingsService.update(table as string, id as string, body);
    return c.json({ success: true, data: result });
  } catch (err: any) {
    logger.error({ reqId, err, table, id }, `Failed to update record ${id} in ${table}`);
    return c.json({ success: false, error: "Internal server error" }, 500);
  }
});

export default app;
