import { Hono } from "hono";
import { SettingsService, ALLOWED_TABLES } from "./service";
import { authenticateToken } from "../../core/middleware";

const app = new Hono();

/**
 * PRODUCTION FIX: 
 * We use a reusable validator function to ensure all CRUD operations 
 * respect the single source of truth in the Service layer.
 */
const validateTable = (table: string) => ALLOWED_TABLES.has(table);

// --- GET system preferences ---
app.get("/preferences", authenticateToken, async (c) => {
  try {
    const prefs = await SettingsService.getPreferences();
    return c.json({ success: true, data: prefs });
  } catch (err: any) {
    console.error("Failed to fetch preferences:", err);
    return c.json(
      { success: false, error: "Internal server error" },
      500,
    );
  }
});

// --- GET all records from a table ---
app.get("/:table", authenticateToken, async (c) => {
  const table = c.req.param("table");
  
  if (!validateTable(table)) {
    return c.json({ success: false, error: `Unauthorized access: ${table} is not an administrative table.` }, 400);
  }

  try {
    const data = await SettingsService.getAll(table);
    return c.json({ success: true, data });
  } catch (err: any) {
    console.error(`Failed to fetch table ${table}:`, err);
    return c.json({ success: false, error: "Internal server error" }, 500);
  }
});

// --- CREATE a new record ---
app.post("/:table", authenticateToken, async (c) => {
  const table = c.req.param("table");
  
  if (!validateTable(table)) {
    return c.json({ success: false, error: "Invalid table" }, 400);
  }

  try {
    const body = await c.req.json();
    const result = await SettingsService.create(table, body);
    return c.json({ success: true, data: result }, 201);
  } catch (err: any) {
    console.error(`Failed to create record in ${table}:`, err);
    return c.json({ success: false, error: err.message || "Internal server error" }, 500);
  }
});

// --- UPDATE an existing record ---
app.put("/:table/:id", authenticateToken, async (c) => {
  const table = c.req.param("table");
  const id = c.req.param("id");

  if (!validateTable(table)) {
    return c.json({ success: false, error: "Invalid table" }, 400);
  }

  try {
    const body = await c.req.json();
    const result = await SettingsService.update(table, id, body);
    return c.json({ success: true, data: result });
  } catch (err: any) {
    console.error(`Failed to update record ${id} in ${table}:`, err);
    return c.json({ success: false, error: "Internal server error" }, 500);
  }
});

export default app;