import pg from "pg";

const { Pool } = pg;

// ----------------------
// Initialize DB connection
// ----------------------
let connectionString = (process.env.DATABASE_URL || "").trim();

if (!connectionString || connectionString.includes("REDACTED")) {
  console.warn("⚠️ DATABASE_URL not set or invalid, falling back to localhost default");
  connectionString = "postgresql://postgres:12345@localhost:5432/postgres";
}

try {
  new URL(connectionString);
} catch (e) {
  console.error("❌ CRITICAL: The DATABASE_URL is not a valid format:", connectionString);
  process.exit(1);
}

export const pool = new Pool({
  connectionString,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
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
      console.warn("🐢 Slow query:", sql.trim(), `${duration.toFixed(2)}ms`);
    }
    return rows;
  },

  async queryOne<T = any>(sql: string, params: any[] = []): Promise<T | null> {
    const rows = await db.query<T>(sql, params);
    return rows[0] || null;
  },

  async execute(sql: string, params: any[] = []): Promise<void> {
    try {
      await pool.query(sql, params);
    } catch (error) {
      console.error("Database Execution Error:", { sql, params, error });
      throw error;
    }
  },

  async transaction<T>(
    fn: (client: TransactionClient) => Promise<T>,
  ): Promise<T> {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");
      
      const wrappedClient: TransactionClient = {
        query: (sql, params = []) => client.query(sql, params).then(r => r.rows),
        queryOne: (sql, params = []) => client.query(sql, params).then(r => r.rows[0] || null),
        execute: async (sql, params = []) => { await client.query(sql, params); },
      };

      const result = await fn(wrappedClient);
      await client.query("COMMIT");
      return result;
    } catch (err) {
      // Only rollback if the connection is still alive
      try { await client.query("ROLLBACK"); } catch (rollbackErr) { /* ignore rollback errors */ }
      throw err;
    } finally {
      client.release();}
  },
};

console.log(`🗄 PostgreSQL pool initialized`);
