import { db } from "./client";
import { migrations } from "./migrations";

/**
 * Ensure schema_migrations table exists
 */
async function initMeta() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

/**
 * Get current schema version
 */
async function getCurrentVersion(): Promise<number> {
  const row = await db.queryOne<{ version?: number }>(
    `SELECT MAX(version) AS version FROM schema_migrations`,
  );

  return row?.version ?? 0;
}

/**
 * Run pending migrations (error-only logging)
 */
export async function runMigrations() {
  await initMeta();

  const current = await getCurrentVersion();

  const pending = migrations
    .filter((m) => m.version > current)
    .sort((a, b) => a.version - b.version);

  if (!pending.length) return;

  for (const migration of pending) {
    try {
      await db.transaction(async (client) => {
        await migration.up(client);

        await client.query(
          `
          INSERT INTO schema_migrations (version)
          VALUES ($1)
        `,
          [migration.version],
        );
      });
    } catch (err) {
      console.error("❌ MIGRATION FAILED", {
        version: migration.version,
        error: err,
      });

      // Critical: stop immediately to avoid inconsistent schema
      throw err;
    }
  }
}
