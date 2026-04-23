import { createNotification } from "../../core/db/events";
import { db } from "../../core/database";

export const ALLOWED_TABLES = new Set([
  "sample_types",
  "process_stages",
  "measurement_units",
  "test_methods",
  "instruments",
  "clients",
  "notification_rules",
  "system_preferences",
  "employees",
  "production_lines",
  "inventory",
]);

function assertAllowedTable(table: string): void {
  if (!ALLOWED_TABLES.has(table)) {
    throw new Error(`Table '${table}' is not in the allowed list`);
  }
}

export const SettingsService = {
  // --- Get system preferences with defaults & validation ---
  getPreferences: async (): Promise<Record<string, string>> => {
    let rows: any[] = [];
    try {
      rows = (await db.query(`SELECT * FROM system_preferences`)) as any[];
    } catch (error: any) {
      if (error.message !== "Database not connected") {
        throw error;
      }
    }
    const prefs: Record<string, string> = {};
    rows.forEach((row) => {
      prefs[row.key] = row.value;
    });

    return {
      date_format: prefs.date_format || "YYYY-MM-DD",
      units: prefs.units === "imperial" ? "imperial" : "metric",
      timezone: prefs.timezone || "UTC",
    };
  },

  // --- Get all records from a table ---
  getAll: async (table: string): Promise<any[]> => {
    if (!ALLOWED_TABLES.has(table)) {
      throw new Error(`Unauthorized access attempt to table: ${table}`);
    }

    let pk = "id";
    if (table === "system_preferences") pk = "key";
    if (table === "employees") pk = "employee_number";

    try {
      return await db.query(`SELECT * FROM ${table} ORDER BY ${pk} DESC`);
    } catch (error: any) {
      if (error.message === "Database not connected") return [];
      throw error;
    }
  },

  // --- Create a new record ---
  create: async (table: string, data: Record<string, any>) => {
    assertAllowedTable(table);
    if (!data || Object.keys(data).length === 0) {
      throw new Error("No data provided for creation");
    }

    const fields = Object.keys(data);
    const values = Object.values(data);
    const placeholders = fields.map((_, i) => `$${i + 1}`).join(", ");

    const sql = `INSERT INTO ${table} (${fields.join(", ")}) VALUES (${placeholders}) RETURNING *`;
    const rows = await db.query(sql, values);

    // Optional: notify admins if creating certain records
    if (table === "system_preferences") {
      await createNotification(
        "ADMIN",
        "SAMPLE_COMPLETED",
        `Preference ${fields.join(", ")} created`,
      );
    }

    return { id: rows[0].id || rows[0].key || rows[0].employee_number };
  },

  // --- Update an existing record ---
  update: async (table: string, id: string | number, data: Record<string, any>) => {
    assertAllowedTable(table);
    if (!data || Object.keys(data).length === 0) {
      throw new Error("No data provided for update");
    }

    const reservedKeys = ["id", "key", "employee_number"];
    const fields = Object.keys(data).filter((f) => !reservedKeys.includes(f));
    if (fields.length === 0) {
      throw new Error("No updatable fields found");
    }

    const values = fields.map((f) => data[f]);
    const setClause = fields.map((f, i) => `${f} = $${i + 1}`).join(", ");

    let pk = "id";
    if (table === "system_preferences") pk = "key";
    if (table === "employees") pk = "employee_number";

    const sql = `UPDATE ${table} SET ${setClause} WHERE ${pk} = $${fields.length + 1}`;
    await db.execute(sql, [...values, id]);

    // Optional: notify admin on critical table changes
    if (["system_preferences", "notification_rules"].includes(table)) {
      await createNotification("ADMIN", "WORKFLOW_FAILURE", `Record ${id} updated in ${table}`);
    }

    return { success: true };
  },
};
