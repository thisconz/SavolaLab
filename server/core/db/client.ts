import pg from "pg";
import { logger } from "../logger";

const { Pool } = pg;

// ----------------------
// Initialize DB connection
// ----------------------
let connectionString = process.env.DATABASE_URL;
let dbConnected = true;

if (!connectionString || connectionString.includes("REDACTED")) {
  logger.warn("⚠️ DATABASE_URL not set or invalid, running in mock mode");
  dbConnected = false;
}

export const pool = new Pool({
  connectionString: connectionString || "postgresql://mock:mock@localhost:5432/mock",
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  dbConnected = false;
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
    if (!dbConnected) throw new Error("Database not connected");
    try {
      const start = performance.now();
      const { rows } = await pool.query(sql, params);
      const duration = performance.now() - start;
      if (duration > 50) {
        logger.warn(`🐢 Slow query: ${sql.trim()} (${duration.toFixed(2)}ms)`);
      }
      return rows;
    } catch (err: any) {
      if (err.code === 'ECONNREFUSED') dbConnected = false;
      throw err;
    }
  },

  async queryOne<T = any>(sql: string, params: any[] = []): Promise<T | null> {
    const rows = await db.query<T>(sql, params);
    return rows[0] || null;
  },

  async execute(sql: string, params: any[] = []): Promise<void> {
    if (!dbConnected) throw new Error("Database not connected");
    try {
      await pool.query(sql, params);
    } catch (err: any) {
      if (err.code === 'ECONNREFUSED') dbConnected = false;
      throw err;
    }
  },

  async transaction<T>(
    fn: (client: TransactionClient) => Promise<T>,
  ): Promise<T> {
    if (!dbConnected) throw new Error("Database not connected");
    let client;
    try {
      client = await pool.connect();
    } catch (err: any) {
      if (err.code === 'ECONNREFUSED') dbConnected = false;
      throw err;
    }

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
