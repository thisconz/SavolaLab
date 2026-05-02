import { db } from "./db/client";
import { runMigrations } from "./db/runner";
import { seedDatabase } from "./db/seeds";
import { initSecurityTriggers } from "./db/security";
import { logger } from "./logger";

let initialized = false;
let initPromise: Promise<void> | null = null;

type InitStage = "instrumentation" | "migrations" | "security" | "seeding";

function logError(stage: InitStage, error: unknown) {
  logger.error({ error }, `DB INIT FAILED [${stage}]`);
}

/**
 * Initialise the database (idempotent, safe for concurrent calls).
 * Call once at server startup; subsequent calls are no-ops.
 */
export async function initDatabase(): Promise<void> {
  if (initialized) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      // 1. Instrumentation
      try {
        logger.info("DB instrumentation applied");
      } catch (err) {
        logError("instrumentation", err);
        throw err;
      }

      // 2. Migrations
      try {
        await runMigrations();
        logger.info("DB migrations completed");
      } catch (err) {
        logError("migrations", err);
        throw err;
      }

      // 3. Security triggers
      try {
        await initSecurityTriggers();
        logger.info("Security triggers initialized");
      } catch (err) {
        logError("security", err);
        throw err;
      }

      // 4. Seed initial data
      try {
        await seedDatabase();
        logger.info("Initial seed applied");
      } catch (err) {
        logError("seeding", err);
        throw err;
      }

      initialized = true;
      logger.info("Database fully initialized");
    } catch (err) {
      initialized = false;
      initPromise = null;
      logger.error({ err }, "DATABASE INITIALIZATION FAILED");
      throw err;
    }
  })();

  return initPromise;
}

// Re-export the db client and helper utilities
export { db };
export * from "./db/security";
export * from "./db/events";
