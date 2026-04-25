import { createNotification } from "../../core/db/events";
import { db } from "../../core/database";

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
  process_stages: {
    pk: "id",
    columns: ["name", "order"],
  },
  system_preferences: {
    pk: "key",
    columns: ["value"],
  },
  employees: {
    pk: "employee_number",
    columns: ["name", "role", "is_active"],
  },
  instruments: {
    pk: "id",
    columns: ["name", "model", "status"],
  },
  clients: {
    pk: "id",
    columns: ["name", "contact_email"],
  },
  notification_rules: {
    pk: "id",
    columns: ["event", "role", "enabled"],
  },
  production_lines: {
    pk: "id",
    columns: ["name", "location"],
  },
  inventory: {
    pk: "id",
    columns: ["item_name", "quantity", "unit"],
  },
  measurement_units: {
    pk: "id",
    columns: ["name", "symbol"],
  },
  test_methods: {
    pk: "id",
    columns: ["name", "description"],
  },
} as const;

type TableName = keyof typeof TABLE_CONFIG;
type ColumnOf<T extends TableName> =
  (typeof TABLE_CONFIG)[T]["columns"][number];

/**
 * Get validated table config
 */
function getTableConfig(table: string) {
  const config = TABLE_CONFIG[table as TableName];
  if (!config) {
    throw new Error(`Invalid table: ${table}`);
  }
  return config;
}

/**
 * Column allowlist enforcement
 */
function filterAllowedColumns<T extends TableName>(
  table: T,
  data: Record<string, any>
): [ColumnOf<T>, any][] {
  const config = getTableConfig(table);
  const allowed = config.columns as readonly string[];

  const entries: [ColumnOf<T>, any][] = [];

  for (const [key, value] of Object.entries(data) as [string, any][]) {
    if (!allowed.includes(key)) {
      throw new Error(`Invalid column '${key}' for table '${table}'`);
    }

    entries.push([key as ColumnOf<T>, value]);
  }

  return entries;
}

/**
 * =========================
 * SERVICE
 * =========================
 */
export const SettingsService = {
  /**
   * Preferences (safe read)
   */
  getPreferences: async (): Promise<Record<string, string>> => {
    let rows: any[] = [];

    try {
      rows = (await db.query(
        `SELECT * FROM system_preferences`
      )) as any[];
    } catch (error: any) {
      if (error.message !== "Database not connected") {
        throw error;
      }
    }

    const prefs: Record<string, string> = {};

    rows.forEach((row: any) => {
      prefs[row.key] = row.value;
    });

    return {
      date_format: prefs.date_format || "YYYY-MM-DD",
      units: prefs.units === "imperial" ? "imperial" : "metric",
      timezone: prefs.timezone || "UTC",
    };
  },

  /**
   * READ ALL
   */
  getAll: async (table: string): Promise<any[]> => {
    const config = getTableConfig(table);
    const pk = config.pk;

    try {
      return await db.query(
        `SELECT * FROM ${table} ORDER BY ${pk} DESC`
      );
    } catch (error: any) {
      if (error.message === "Database not connected") return [];
      throw error;
    }
  },

  /**
   * CREATE
   */
  create: async (table: string, data: Record<string, any>) => {
    const config = getTableConfig(table);

    if (!data || Object.keys(data).length === 0) {
      throw new Error("No data provided for creation");
    }

    const entries = filterAllowedColumns(table as TableName, data);

    if (entries.length === 0) {
      throw new Error("No valid fields provided");
    }

    const fields = entries.map(([k]) => k);
    const values = entries.map(([, v]) => v);
    const placeholders = fields.map((_, i) => `$${i + 1}`).join(", ");

    const sql = `
      INSERT INTO ${table}
      (${fields.join(", ")})
      VALUES (${placeholders})
      RETURNING *
    `;

    const rows = await db.query(sql, values);

    if (table === "system_preferences") {
      await createNotification(
        "ADMIN",
        "SAMPLE_COMPLETED",
        `Preference ${fields.join(", ")} created`
      );
    }

    return {
      id:
        rows[0].id ||
        rows[0].key ||
        rows[0].employee_number,
    };
  },

  /**
   * UPDATE
   */
  update: async (
    table: string,
    id: string | number,
    data: Record<string, any>
  ) => {
    const config = getTableConfig(table);
    const pk = config.pk;

    if (!data || Object.keys(data).length === 0) {
      throw new Error("No data provided for update");
    }

    const entries = filterAllowedColumns(table as TableName, data);

    if (entries.length === 0) {
      throw new Error("No updatable fields found");
    }

    const fields = entries.map(([k]) => k);
    const values = entries.map(([, v]) => v);

    const setClause = fields
      .map((f, i) => `${f} = $${i + 1}`)
      .join(", ");

    const sql = `
      UPDATE ${table}
      SET ${setClause}
      WHERE ${pk} = $${fields.length + 1}
    `;

    await db.execute(sql, [...values, id]);

    if (
      ["system_preferences", "notification_rules"].includes(table)
    ) {
      await createNotification(
        "ADMIN",
        "WORKFLOW_FAILURE",
        `Record ${id} updated in ${table}`
      );
    }

    return { success: true };
  },
};