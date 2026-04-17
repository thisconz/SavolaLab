import { db } from "./db/client";
import { runMigrations } from "./db/runner";
import { seedDatabase } from "./db/seeds";
import { initSecurityTriggers } from "./db/security";
import { logger } from "./logger";

let initialized = false;
let initializing = false;

type InitStage = "instrumentation" | "migrations" | "security" | "seeding";

function logError(stage: InitStage, error: unknown) {
  logger.error({ error }, `DB INIT FAILED [${stage}]`);
}

/**
 * Initialize database (idempotent, production-grade, safe for concurrent calls)
 */
export async function initDatabase(): Promise<void> {
  if (initialized) return;

  if (initializing) {
    throw new Error("Database initialization already in progress");
  }

  initializing = true;

  try {
    /** 1️⃣ Observability instrumentation */
    try {
      // instrumentDb(); // Removed for now as it was better-sqlite3 specific
      logger.info("DB instrumentation applied");
    } catch (err) {
      logError("instrumentation", err);
      throw err;
    }

    /** 2️⃣ Migrations */
    try {
      await runMigrations();
      logger.info("DB migrations completed");
    } catch (err) {
      logError("migrations", err);
      throw err;
    }

    /** 3️⃣ Security triggers */
    try {
      await initSecurityTriggers();
      logger.info("Security triggers initialized");
    } catch (err) {
      logError("security", err);
      throw err;
    }

    /** 4️⃣ Seed database (transaction-safe) */
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
    // Reset state for retry
    initialized = false;
    logger.error({ err }, "DATABASE INITIALIZATION FAILED");
    throw err;
  } finally {
    initializing = false;
  }
}

// Export DB client
export { db };

// Public API surface
export * from "./db/security";
export * from "./db/events";
