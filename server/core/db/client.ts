import pg from "pg";
import { logger } from "../logger";
import { PGlite } from "@electric-sql/pglite";
import path from "path";

const { Pool } = pg;

// ----------------------
// Initialize DB connection
// ----------------------
let connectionString = process.env.DATABASE_URL;
let useMock = false;

if (!connectionString || connectionString.includes("REDACTED")) {
  logger.warn("⚠️ DATABASE_URL not set or invalid, using local PGLite database");
  useMock = true;
}

// Persist local fake db in 'pgdata' directory
let pgliteDb = useMock ? new PGlite(path.join(process.cwd(), "pgdata")) : null;

class MockPool {
  async query(text: string, params?: any[]) { 
    return pgliteDb!.query(text, params); 
  }
  async connect() { 
    return {
      query: (text: string, params?: any[]) => pgliteDb!.query(text, params),
      release: () => {}
    };
  }
  on(event: string, cb: any) {}
}

export const pool = useMock ? new MockPool() as any : new Pool({
  connectionString: connectionString,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  query_timeout: 5000,
});

if (pool && !useMock) {
  pool.on('error', (err: any) => {
    logger.error({ err }, "DB Pool error");
  });
}

// ----------------------
// Database client wrapper
// ----------------------
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

async function getPGLite() {
  if (!pgliteDb) {
    logger.warn("⚠️ Falling back to local PGLite database due to connection errors...");
    useMock = true;
    pgliteDb = new PGlite(path.join(process.cwd(), "pgdata"));
  }
  return pgliteDb;
}

export const db: DatabaseClient = {
  async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    try {
      const start = performance.now();
      const { rows } = useMock ? await (await getPGLite()).query(sql, params) : await pool!.query(sql, params);
      const duration = performance.now() - start;
      if (duration > 50) {
        logger.warn(`Slow query: ${sql.trim()} (${duration.toFixed(2)}ms)`);
      }
      return rows as T[];
    } catch (err: any) {
      if (!useMock && (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND' || err.code === 'ECONNRESET' || err.message?.includes('timeout') || err.message?.includes('no password supplied') || err.message?.includes('password authentication failed') || err.message?.includes('database'))) {
        const { rows } = await (await getPGLite()).query(sql, params);
        return rows as T[];
      }
      logger.error({ errCode: err?.code, errMsg: err?.message, sql }, "DB Query Error");
      throw err;
    }
  },

  async queryOne<T = any>(sql: string, params: any[] = []): Promise<T | null> {
    const rows = await db.query<T>(sql, params);
    return rows[0] || null;
  },

  async execute(sql: string, params: any[] = []): Promise<void> {
    try {
      if (useMock) {
        const dbInstance = await getPGLite();
        if (params && params.length > 0) {
          await dbInstance.query(sql, params);
        } else {
          await dbInstance.exec(sql);
        }
      } else {
        await pool!.query(sql, params);
      }
    } catch (err: any) {
      if (!useMock && (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND' || err.code === 'ECONNRESET' || err.message?.includes('timeout') || err.message?.includes('password') || err.message?.includes('database'))) {
        const dbInstance = await getPGLite();
        if (params && params.length > 0) {
          await dbInstance.query(sql, params);
        } else {
          await dbInstance.exec(sql);
        }
        return;
      }
      logger.error({ errCode: err?.code, errMsg: err?.message, query: sql }, "DB Execute Error");
      throw err;
    }
  },

  async transaction<T>(
    fn: (client: TransactionClient) => Promise<T>,
  ): Promise<T> {
    if (useMock) {
      const dbInstance = await getPGLite();
      return await dbInstance.transaction(async (tx) => {
        const wrappedClient: TransactionClient = {
          async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
            const { rows } = await tx.query(sql, params);
            return rows as T[];
          },
          async queryOne<T = any>(sql: string, params: any[] = []): Promise<T | null> {
            const { rows } = await tx.query(sql, params);
            return (rows[0] as T) || null;
          },
          async execute(sql: string, params: any[] = []): Promise<void> {
            if (params && params.length > 0) {
              await tx.query(sql, params);
            } else {
              await tx.exec(sql);
            }
          },
        };
        return await fn(wrappedClient);
      });
    }

    let client;
    try {
      client = await pool!.connect();
    } catch (err: any) {
      if (!useMock && (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND' || err.code === 'ECONNRESET' || err.message?.includes('timeout') || err.message?.includes('password') || err.message?.includes('database'))) {
        useMock = true; // Skip regular connect and fall through to recursive useMock
        return await db.transaction(fn);
      }
      logger.error({ errCode: err?.code, errMsg: err?.message }, "DB Transaction Connect Error");
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

logger.info(`PostgreSQL client initialized (Mock: ${useMock})`);
