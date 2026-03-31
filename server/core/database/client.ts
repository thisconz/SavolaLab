import pg from "pg";

const { Pool } = pg;

let pool: pg.Pool | null = null;

function getPool(): pg.Pool {
  if (pool) return pool;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is required.");
  }

  console.log("DB URL loaded:", connectionString.replace(/:.*@/, ":****@"));

  pool = new Pool({
    connectionString,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });

  pool.on("error", (err) => {
    console.error("Unexpected DB pool error", err);
  });

  return pool;
}

// Define a standard interface for both standalone and transaction queries
export interface TransactionClient {
  query<T = any>(sql: string, params?: any[]): Promise<T[]>;
  queryOne<T = any>(sql: string, params?: any[]): Promise<T | null>;
  execute(sql: string, params?: any[]): Promise<void>;
}

export interface DatabaseClient extends TransactionClient {
  transaction<T>(fn: (client: TransactionClient) => Promise<T>): Promise<T>;
}

export const db: DatabaseClient = {
  async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    const start = performance.now();
    const { rows } = await getPool().query(sql, params);
    const duration = performance.now() - start;
    
    if (duration > 50) {
      console.warn("🐢 Slow query:", sql.trim().substring(0, 50), `${duration.toFixed(2)}ms`);
    }
    return rows;
  },

  async queryOne<T = any>(sql: string, params: any[] = []): Promise<T | null> {
    const rows = await db.query<T>(sql, params);
    return rows[0] || null;
  },

  async execute(sql: string, params: any[] = []): Promise<void> {
    await getPool().query(sql, params);
  },

  async transaction<T>(fn: (client: TransactionClient) => Promise<T>): Promise<T> {
    const pgClient = await getPool().connect();
    
    // Create a wrapper so the transaction uses the SAME API as the main db object
    const wrapped: TransactionClient = {
      query: async <T>(sql: string, params: any[] = []) => {
        const { rows } = await pgClient.query(sql, params);
        return rows;
      },
      queryOne: async <T>(sql: string, params: any[] = []) => {
        const { rows } = await pgClient.query(sql, params);
        return rows[0] || null;
      },
      execute: async (sql, params = []) => {
        await pgClient.query(sql, params);
      }
    };

    try {
      await pgClient.query("BEGIN");
      const result = await fn(wrapped);
      await pgClient.query("COMMIT");
      return result;
    } catch (err) {
      await pgClient.query("ROLLBACK"); // Await the rollback!
      throw err;
    } finally {
      pgClient.release();
    }
  },
};

console.log(`PostgreSQL pool initialized`);