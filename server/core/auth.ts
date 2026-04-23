import { betterAuth } from "better-auth";
import { pool } from "./db/client";

/**
 * better-auth requires a real PostgreSQL Pool.
 * When DATABASE_URL is not set the app falls back to PGlite via MockPool,
 * which does not satisfy the full Pool interface.
 *
 * We detect the mock by checking for a property only the real pg.Pool has.
 * If the pool is a MockPool we skip better-auth initialisation so the server
 * can still start in development / demo mode.
 */
function isRealPool(p: any): boolean {
  // Real pg.Pool exposes totalCount; MockPool does not
  return typeof p?.totalCount === "number";
}

let auth: { handler: (req: Request) => Promise<Response> };

if (isRealPool(pool)) {
  auth = betterAuth({
    database: pool,
    secret: process.env.JWT_SECRET ?? process.env.BETTER_AUTH_SECRET ?? "insecure-dev-secret",
    emailAndPassword: { enabled: true },
  });
} else {
  // Stub handler when running with PGlite (no real Postgres connection)
  auth = {
    handler: async (_req: Request) => {
      return new Response(
        JSON.stringify({
          error: "Auth service not available in demo/PGlite mode. Set DATABASE_URL.",
        }),
        { status: 503, headers: { "Content-Type": "application/json" } },
      );
    },
  };
}

export { auth };
