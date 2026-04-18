import { db } from "./client";
import { migrations } from "./migrations";
import { logger } from "../logger"

/**
 * Ensure schema_migrations table exists
 */
async function initMeta() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      execution_time_ms INTEGER
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
  await db.execute(`SELECT pg_advisory_lock(123456)`);

  try {
    await initMeta();
    const current = await getCurrentVersion();

    const pending = migrations
      .filter((m) => m.version > current)
      .sort((a, b) => a.version - b.version);

    if (!pending.length) return;

    for (const migration of pending) {
      const start = Date.now();
      await db.transaction(async (client) => {
        await migration.up(client);

        const duration = Date.now() - start;
        await client.query(
          `INSERT INTO schema_migrations (version, execution_time_ms) VALUES ($1, $2)`,
          [migration.version, duration]
        );
      });
      logger.info(`Version ${migration.version} applied in ${Date.now() - start}ms`);
    }
    
  } finally {
    // 2. Always release the lock so other processes (or the next deploy) can run
    await db.execute(`SELECT pg_advisory_unlock(123456)`);
  }
}
