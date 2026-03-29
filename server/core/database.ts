import { db } from "./database/client";
import { runMigrations } from "./database/runner";
import { seedDatabase } from "./database/seeds";
import { instrumentDb } from "./database/observability";
import { initSecurityTriggers } from "./database/security";

let initialized = false;
let initializing = false;

type InitStage = "instrumentation" | "migrations" | "security" | "seeding";

function logError(stage: InitStage, error: unknown) {
  console.error(`❌ DB INIT FAILED [${stage}]`, error);
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
      console.log("🔍 DB instrumentation applied");
    } catch (err) {
      logError("instrumentation", err);
      throw err;
    }

    /** 2️⃣ Migrations */
    try {
      await runMigrations();
      console.log("🛠 DB migrations completed");
    } catch (err) {
      logError("migrations", err);
      throw err;
    }

    /** 3️⃣ Security triggers */
    try {
      await initSecurityTriggers();
      console.log("🔒 Security triggers initialized");
    } catch (err) {
      logError("security", err);
      throw err;
    }

    /** 4️⃣ Seed database (transaction-safe) */
    try {
      await seedDatabase();
      console.log("🌱 Initial seed applied");
    } catch (err) {
      logError("seeding", err);
      throw err;
    }

    initialized = true;
    console.log("✅ Database fully initialized");
  } catch (err) {
    // Reset state for retry
    initialized = false;
    console.error("❌ DATABASE INITIALIZATION FAILED", err);
    throw err;
  } finally {
    initializing = false;
  }
}

// Export DB client
export { db };

// Public API surface
export * from "./database/security";
export * from "./database/events";
