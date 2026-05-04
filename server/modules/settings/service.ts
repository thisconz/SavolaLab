import { createNotification } from "../../core/db/events";
import { db } from "../../core/database";
import { AppError } from "../../core/errors";

/**
 * =========================
 * TABLE CONFIG (source of truth)
 * =========================
 */
export const TABLE_CONFIG = {
  sample_types: {
    pk: "id",
    columns: ["name", "category", "description"],
  },
  system_preferences: {
    pk: "key",
    columns: ["value"],
  },
  employees: {
    pk: "employee_number",
    columns: ["name", "role", "department", "email", "status"],
  },
  instruments: {
    pk: "id",
    columns: ["name", "model", "status", "last_calibration", "next_calibration"],
  },
  clients: {
    pk: "id",
    columns: ["name", "email", "phone", "address"],
  },
  notification_rules: {
    pk: "id",
    columns: ["name", "condition", "action", "is_active"],
  },
  production_lines: {
    pk: "id",
    columns: ["name", "plant_id"],
  },
  inventory: {
    pk: "id",
    columns: ["name", "type", "quantity", "unit", "min_stock", "expiry_date"],
  },
  test_methods: {
    pk: "id",
    columns: ["name", "sop_steps", "formula", "min_range", "max_range", "version", "is_active"],
  },
  spec_limits: {
    pk: "id",
    columns: ["test_type", "sample_stage", "usl", "lsl", "target", "unit", "notes", "is_active"],
  },
} as const;

type TableName = keyof typeof TABLE_CONFIG;
type ColumnOf<T extends TableName> = (typeof TABLE_CONFIG)[T]["columns"][number];

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function getTableConfig(table: string) {
  const config = TABLE_CONFIG[table as TableName];
  if (!config) {
    // Use AppError so callers return a proper 400, not a 500
    throw new AppError("VALIDATION_ERROR", 400, `Invalid or disallowed table: "${table}"`);
  }
  return config;
}

function filterAllowedColumns<T extends TableName>(
  table: T,
  data: Record<string, any>,
): [ColumnOf<T>, any][] {
  const config = getTableConfig(table);
  const allowed = config.columns as readonly string[];
  const entries: [ColumnOf<T>, any][] = [];

  for (const [key, value] of Object.entries(data)) {
    if (!allowed.includes(key)) {
      throw new AppError("VALIDATION_ERROR", 422, `Column "${key}" is not permitted for table "${table}"`);
    }
    entries.push([key as ColumnOf<T>, value]);
  }

  return entries;
}

// ─────────────────────────────────────────────
// Service
// ─────────────────────────────────────────────

export const SettingsService = {
  getPreferences: async (): Promise<Record<string, string>> => {
    let rows: any[] = [];
    try {
      rows = await db.query("SELECT * FROM system_preferences");
    } catch (err: any) {
      if (err.message !== "Database not connected") throw err;
    }
    const prefs: Record<string, string> = {};
    rows.forEach((row: any) => {
      prefs[row.key] = row.value;
    });
    return {
      date_format: prefs.DATE_TIME_FORMAT ?? "YYYY-MM-DD",
      units: prefs.UNITS === "imperial" ? "imperial" : "metric",
      timezone: prefs.TIMEZONE ?? "UTC",
    };
  },

  getAll: async (table: string): Promise<any[]> => {
    const config = getTableConfig(table);
    const pk = config.pk;
    try {
      return await db.query(`SELECT * FROM ${table} ORDER BY ${pk} DESC`);
    } catch (err: any) {
      if (err.message === "Database not connected") return [];
      throw err;
    }
  },

  create: async (table: string, data: Record<string, any>) => {
    getTableConfig(table); // validates table exists

    if (!data || Object.keys(data).length === 0) {
      throw new AppError("VALIDATION_ERROR", 422, "No data provided for creation");
    }

    const entries = filterAllowedColumns(table as TableName, data);
    if (entries.length === 0) {
      throw new AppError("VALIDATION_ERROR", 422, "No valid fields provided");
    }

    const fields = entries.map(([k]) => k);
    const values = entries.map(([, v]) => v);
    const placeholders = fields.map((_, i) => `$${i + 1}`).join(", ");

    const rows = await db.query(
      `INSERT INTO ${table} (${fields.join(", ")}) VALUES (${placeholders}) RETURNING *`,
      values,
    );

    if (table === "system_preferences") {
      await createNotification("ADMIN", "SETTINGS_CHANGED", `Preference created: ${fields.join(", ")}`);
    }

    const row = rows[0];
    return { id: row?.id ?? row?.key ?? row?.employee_number };
  },

  update: async (table: string, id: string | number, data: Record<string, any>) => {
    const config = getTableConfig(table);
    const pk = config.pk;

    if (!data || Object.keys(data).length === 0) {
      throw new AppError("VALIDATION_ERROR", 422, "No data provided for update");
    }

    const entries = filterAllowedColumns(table as TableName, data);
    if (entries.length === 0) {
      throw new AppError("VALIDATION_ERROR", 422, "No updatable fields found");
    }

    const fields = entries.map(([k]) => k);
    const values = entries.map(([, v]) => v);
    const setClause = fields.map((f, i) => `${f} = $${i + 1}`).join(", ");

    await db.execute(`UPDATE ${table} SET ${setClause} WHERE ${pk} = $${fields.length + 1}`, [...values, id]);

    if (["system_preferences", "notification_rules", "spec_limits"].includes(table)) {
      await createNotification("ADMIN", "SETTINGS_CHANGED", `Record ${id} updated in ${table}`);
    }

    return { success: true };
  },
};
