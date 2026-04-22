import pg from "pg";
import { logger } from "../logger";
import { PGlite } from "@electric-sql/pglite";
import path from "path";
import { fileURLToPath } from "url";

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─── Stable path regardless of CWD ─────────────────────────────────────────
const PGLITE_DATA_DIR = path.join(__dirname, "..", "..", "..", "pgdata");

// ─── Determine mode at startup — never mutate after this point ─────────────
const connectionString = process.env.DATABASE_URL;
let useMock =
  !connectionString ||
  connectionString.includes("REDACTED") ||
  connectionString.includes("placeholder");

if (useMock) {
  logger.warn(
    "⚠️  DATABASE_URL not set or invalid — using local PGlite database",
  );
  logger.warn(`    PGlite data dir: ${PGLITE_DATA_DIR}`);
}

// ─── PGlite singleton — created once, shared across all requests ────────────
// This prevents WAL corruption from multiple instances on the same path.
let _pgliteInstance: PGlite | null = null;

function getPGLiteInstance(): PGlite {
  if (!_pgliteInstance) {
    _pgliteInstance = new PGlite(PGLITE_DATA_DIR);
    logger.info(`PGlite database initialised at: ${PGLITE_DATA_DIR}`);
  }
  return _pgliteInstance;
}

// ─── Real Postgres pool ─────────────────────────────────────────────────────
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

export const pool = useMock
  ? (new MockPool() as any)
  : new Pool({
      connectionString,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
      query_timeout: 5000,
    });

if (!useMock) {
  pool.on("error", (err: any) => {
    logger.error({ err }, "DB Pool error");
  });
}

// ─────────────────────────────────────────────
// Database client interfaces
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

// ─── Helper: gracefully fall back to PGlite on Postgres connection errors ──
// NOTE: useMock is never changed here. Instead we route this request to
// PGlite while keeping useMock=false for future requests so we can recover
// if Postgres comes back up.
function isConnectionError(err: any): boolean {
  const connectionCodes = ["ECONNREFUSED", "ENOTFOUND", "ECONNRESET"];
  const connectionMessages = [
    "timeout",
    "no password supplied",
    "password authentication failed",
    "database",
  ];
  return (
    connectionCodes.includes(err?.code) ||
    connectionMessages.some((m) => err?.message?.includes(m))
  );
}

// ─────────────────────────────────────────────
// db client implementation
// ─────────────────────────────────────────────

export const db: DatabaseClient = {
  async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    if (useMock) {
      const { rows } = await getPGLiteInstance().query(sql, params);
      return rows as T[];
    }
    try {
      const start = performance.now();
      const { rows } = await pool.query(sql, params);
      const duration = performance.now() - start;
      if (duration > 50)
        logger.warn(`Slow query: ${sql.trim()} (${duration.toFixed(2)}ms)`);
      return rows as T[];
    } catch (err: any) {
      if (isConnectionError(err)) {
        logger.warn(
          "Postgres unavailable, falling back to PGlite for this query",
        );
        const { rows } = await getPGLiteInstance().query(sql, params);
        return rows as T[];
      }
      logger.error(
        { errCode: err?.code, errMsg: err?.message, sql },
        "DB Query Error",
      );
      throw err;
    }
  },

  async queryOne<T = any>(sql: string, params: any[] = []): Promise<T | null> {
    const rows = await db.query<T>(sql, params);
    return rows[0] || null;
  },

  async execute(sql: string, params: any[] = []): Promise<void> {
    if (useMock) {
      const pglite = getPGLiteInstance();
      if (params.length > 0) {
        await pglite.query(sql, params);
      } else {
        await pglite.exec(sql);
      }
      return;
    }
    try {
      await pool.query(sql, params);
    } catch (err: any) {
      if (isConnectionError(err)) {
        logger.warn(
          "Postgres unavailable, falling back to PGlite for this execute",
        );
        const pglite = getPGLiteInstance();
        if (params.length > 0) {
          await pglite.query(sql, params);
        } else {
          await pglite.exec(sql);
        }
        return;
      }
      logger.error(
        { errCode: err?.code, errMsg: err?.message, query: sql },
        "DB Execute Error",
      );
      throw err;
    }
  },

  async transaction<T>(
    fn: (client: TransactionClient) => Promise<T>,
  ): Promise<T> {
    if (useMock) {
      const pglite = getPGLiteInstance();
      return pglite.transaction(async (tx) => {
        const wrappedClient: TransactionClient = {
          async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
            const { rows } = await tx.query(sql, params);
            return rows as T[];
          },
          async queryOne<T = any>(
            sql: string,
            params: any[] = [],
          ): Promise<T | null> {
            const { rows } = await tx.query(sql, params);
            return (rows[0] as T) || null;
          },
          async execute(sql: string, params: any[] = []): Promise<void> {
            if (params.length > 0) {
              await tx.query(sql, params);
            } else {
              await tx.exec(sql);
            }
          },
        };
        return fn(wrappedClient);
      });
    }

    let client: any;
    try {
      client = await pool.connect();
    } catch (err: any) {
      if (isConnectionError(err)) {
        // Route this entire transaction through PGlite
        logger.warn("Postgres unavailable for transaction, routing to PGlite");
        const pglite = getPGLiteInstance();
        return pglite.transaction(async (tx) => {
          const wrappedClient: TransactionClient = {
            async query<T = any>(
              sql: string,
              params: any[] = [],
            ): Promise<T[]> {
              const { rows } = await tx.query(sql, params);
              return rows as T[];
            },
            async queryOne<T = any>(
              sql: string,
              params: any[] = [],
            ): Promise<T | null> {
              const { rows } = await tx.query(sql, params);
              return (rows[0] as T) || null;
            },
            async execute(sql: string, params: any[] = []): Promise<void> {
              if (params.length > 0) {
                await tx.query(sql, params);
              } else {
                await tx.exec(sql);
              }
            },
          };
          return fn(wrappedClient);
        });
      }
      logger.error(
        { errCode: err?.code, errMsg: err?.message },
        "DB Transaction Connect Error",
      );
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

logger.info(
  `PostgreSQL client initialised (mode: ${useMock ? "PGlite" : "PostgreSQL"})`,
);
