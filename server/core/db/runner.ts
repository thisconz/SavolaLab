import { db } from "./client";
import { migrations } from "./migrations";
import { logger } from "../logger";

/**
 * Ensure the schema_migrations tracking table exists.
 */
async function initMeta(): Promise<void> {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version         INTEGER PRIMARY KEY,
      applied_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      execution_time_ms INTEGER
    );
  `);
}

/**
 * Return the highest applied migration version (0 if none).
 */
async function getCurrentVersion(): Promise<number> {
  const row = await db.queryOne<{ version?: number }>(
    "SELECT MAX(version) AS version FROM schema_migrations",
  );
  return row?.version ?? 0;
}

/**
 * Attempt to acquire a Postgres advisory lock (no-op on PGlite which
 * doesn't support advisory locks).
 * Returns true if the lock was acquired, false if skipped.
 */
async function tryAcquireAdvisoryLock(lockId: number): Promise<boolean> {
  try {
    await db.execute(`SELECT pg_advisory_lock(${lockId})`);
    return true;
  } catch {
    // PGlite or older Postgres versions don't support advisory locks.
    // Migrations are still safe in single-process dev mode.
    logger.warn("pg_advisory_lock unavailable — running migrations without distributed lock");
    return false;
  }
}

async function tryReleaseAdvisoryLock(lockId: number): Promise<void> {
  try {
    await db.execute(`SELECT pg_advisory_unlock(${lockId})`);
  } catch {
    // Ignore — lock was never acquired
  }
}

/**
 * Run all pending migrations in version order.
 * Safe to call multiple times (idempotent).
 */
export async function runMigrations(): Promise<void> {
  const LOCK_ID = 1_000_789; // Arbitrary unique integer for this app
  const lockHeld = await tryAcquireAdvisoryLock(LOCK_ID);

  try {
    await initMeta();
    const current = await getCurrentVersion();

    const pending = migrations
      .filter((m) => m.version > current)
      .sort((a, b) => a.version - b.version);

    if (pending.length === 0) {
      logger.info(`Migrations up-to-date (version ${current})`);
      return;
    }

    logger.info(`Running ${pending.length} pending migration(s) from v${current}`);

    for (const migration of pending) {
      const start = Date.now();
      await db.transaction(async (client) => {
        await migration.up(client);
        const elapsed = Date.now() - start;
        await client.execute(
          "INSERT INTO schema_migrations (version, execution_time_ms) VALUES ($1, $2)",
          [migration.version, elapsed],
        );
      });
      logger.info(`Migration v${migration.version} applied in ${Date.now() - start}ms`);
    }
  } finally {
    if (lockHeld) await tryReleaseAdvisoryLock(LOCK_ID);
  }
}
