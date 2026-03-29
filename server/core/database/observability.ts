// server/core/database/observability.ts

import { db } from "./client";

function logError(sql: string, params: unknown[], error: unknown) {
  console.error("❌ DB ERROR", {
    sql,
    params,
    error,
  });

  // SQLite FK diagnostics (very useful in production)
  if (
    typeof error === "object" &&
    error &&
    "code" in error &&
    (error as any).code === "SQLITE_CONSTRAINT_FOREIGNKEY"
  ) {
    console.error("🔗 FOREIGN KEY VIOLATION DETAILS", {
      hint: "Ensure parent records exist before insert/update",
      sql,
      params,
    });
  }
}

export function instrumentDb() {
  // Observability for PostgreSQL can be implemented here if needed.
  // The current pg.Pool implementation already has basic error logging.
}
