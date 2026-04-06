import pg from "pg";
import { logger } from "../logger";

const { Pool } = pg;

// ----------------------
// Initialize DB connection
// ----------------------
let connectionString = process.env.DATABASE_URL;

if (!connectionString || connectionString.includes("REDACTED")) {
  logger.warn("⚠️ DATABASE_URL not set or invalid, falling back to localhost default");
  connectionString = "postgresql://postgres:12345@localhost:5432/postgres";
}

export const pool = new Pool({
  connectionString,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// ----------------------
// Database client wrapper
// ----------------------
// This wrapper mimics some of the better-sqlite3 interface but is ASYNCHRONOUS.
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

export const db: DatabaseClient = {
  async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    const start = performance.now();
    const { rows } = await pool.query(sql, params);
    const duration = performance.now() - start;
    if (duration > 50) {
      logger.warn(`🐢 Slow query: ${sql.trim()} (${duration.toFixed(2)}ms)`);
    }
    return rows;
  },

  async queryOne<T = any>(sql: string, params: any[] = []): Promise<T | null> {
    const rows = await db.query<T>(sql, params);
    return rows[0] || null;
  },

  async execute(sql: string, params: any[] = []): Promise<void> {
    await pool.query(sql, params);
  },

  async transaction<T>(
    fn: (client: TransactionClient) => Promise<T>,
  ): Promise<T> {
    const client = await pool.connect();

    const wrappedClient: TransactionClient = {
      async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
        const { rows } = await client.query(sql, params);
        return rows;
      },
      async queryOne<T = any>(
        sql: string,
        params: any[] = [],
      ): Promise<T | null> {
        const { rows } = await client.query(sql, params);
        return rows[0] || null;
      },
      async execute(sql: string, params: any[] = []): Promise<void> {
        await client.query(sql, params);
      },
    };

    try {
      await client.query("BEGIN");
      const result = await fn(wrappedClient);
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

logger.info(`🗄 PostgreSQL pool initialized`);
