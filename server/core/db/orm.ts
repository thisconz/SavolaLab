import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import type { Pool } from "pg";
import { pool, DB_MODE } from "./client";

/**
 * Drizzle ORM instance — only valid in PostgreSQL mode.
 *
 * In PGlite mode, the `pool` is a MockPool and is incompatible with the
 * Drizzle node-postgres driver. Modules that use `dbOrm` must guard
 * against this or use the raw `db` client instead.
 *
 * Pattern:
 *   if (DB_MODE !== "postgres") return []; // fallback
 *   return dbOrm.select()...
 */
export let dbOrm: NodePgDatabase;

if (DB_MODE === "postgres") {
  dbOrm = drizzle(pool as Pool);
} else {
  // In PGlite mode, provide a stub that surfaces a clear error message
  // if called directly, rather than a cryptic Drizzle internal failure.
  dbOrm = new Proxy({} as NodePgDatabase, {
    get(_target, prop) {
      throw new Error(
        `[dbOrm] Cannot use Drizzle ORM in PGlite mode. ` +
          `Attempted to access: ${String(prop)}. ` +
          `Use the raw 'db' client instead, or guard with DB_MODE === "postgres".`,
      );
    },
  });
}
