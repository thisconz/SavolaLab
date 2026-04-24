import pg from "pg";
import { logger } from "../logger";
import { PGlite } from "@electric-sql/pglite";
import path from "path";
import { fileURLToPath } from "url";

const { Pool } = pg;

// ─── Path resolution ─────────────────────────────────────────────
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PGLITE_DATA_DIR = path.join(__dirname, "..", "..", "..", "pgdata");

// ─── DB Mode (strict, deterministic) ─────────────────────────────
export type DbMode = "postgres" | "pglite";

const connectionString = process.env.DATABASE_URL;

export const DB_MODE: DbMode =
  process.env.DB_MODE === "pglite" || !connectionString
    ? "pglite"
    : "postgres";

if (DB_MODE === "pglite") {
  logger.warn("⚠️ Running in PGlite mode");
  logger.warn(`   Data dir: ${PGLITE_DATA_DIR}`);
}

// ─── PGlite singleton ─────────────────────────────────────────────
let _pgliteInstance: PGlite | null = null;

function getPGLiteInstance(): PGlite {
  if (!_pgliteInstance) {
    _pgliteInstance = new PGlite(PGLITE_DATA_DIR);
    logger.info(`PGlite initialized at: ${PGLITE_DATA_DIR}`);
  }
  return _pgliteInstance;
}

// ─── Mock Pool (PGlite adapter) ───────────────────────────────────
class MockPool {
  async query(text: string, params?: any[]) {
    return getPGLiteInstance().query(text, params);
  }

  async connect() {
    return {
      query: (text: string, params?: any[]) =>
        getPGLiteInstance().query(text, params),
      release: () => {},
    };
  }

  on(_event: string, _cb: any) {}
}

// ─── Pool (deterministic, no runtime switching) ───────────────────
export const pool =
  DB_MODE === "pglite"
    ? (new MockPool() as any)
    : new Pool({
        connectionString,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
      });

if (DB_MODE === "postgres") {
  pool.on("error", (err: any) => {
    logger.error({ err }, "DB Pool error");
  });
}

// ─────────────────────────────────────────────
// Interfaces
// ─────────────────────────────────────────────

export interface TransactionClient {
  query<T = any>(sql: string, params?: any[]): Promise<T[]>;
  queryOne<T = any>(sql: string, params?: any[]): Promise<T | null>;
  execute(sql: string, params?: any[]): Promise<void>;
}

export interface DatabaseClient {
  query<T = any>(sql: string, params?: any[]): Promise<T[]>;
  queryOne<T = any>(sql: string, params?: any[]): Promise<T | null>;
  execute(sql: string, params?: any[]): Promise<void>;
  transaction<T>(fn: (client: TransactionClient) => Promise<T>): Promise<T>;
}

// ─────────────────────────────────────────────
// DB implementation (NO fallback logic)
// ─────────────────────────────────────────────

export const db: DatabaseClient = {
  async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    const start = performance.now();

    const result = await pool.query(sql, params);
    const duration = performance.now() - start;

    if (duration > 50) {
      logger.warn(`Slow query: ${sql.trim()} (${duration.toFixed(2)}ms)`);
    }

    return result.rows as T[];
  },

  async queryOne<T = any>(sql: string, params: any[] = []): Promise<T | null> {
    const rows = await this.query<T>(sql, params);
    return rows[0] || null;
  },

  async execute(sql: string, params: any[] = []): Promise<void> {
    await pool.query(sql, params);
  },

  async transaction<T>(
    fn: (client: TransactionClient) => Promise<T>,
  ): Promise<T> {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const wrapped: TransactionClient = {
        query: async (sql, params = []) => {
          const res = await client.query(sql, params);
          return res.rows;
        },

        queryOne: async (sql, params = []) => {
          const res = await client.query(sql, params);
          return res.rows[0] || null;
        },

        execute: async (sql, params = []) => {
          await client.query(sql, params);
        },
      };

      const result = await fn(wrapped);

      await client.query("COMMIT");
      return result;
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  },
};

// ─────────────────────────────────────────────
// Init log
// ─────────────────────────────────────────────

logger.info(
  `DB initialized (mode: ${DB_MODE === "pglite" ? "PGlite" : "PostgreSQL"})`,
);