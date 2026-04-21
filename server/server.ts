// ─── server/server.ts (additions only — shows changed sections) ───────────────
// Add these imports at the top:
//
//   import realtimeRoutes from "./modules/realtime/routes";
//
// Add this route mount in the API Routes section:
//
//   app.route(`${api}/realtime`, realtimeRoutes);
//
// The full diff is shown below as a patch-style comment, but the complete
// file content is identical to the original except for these additions.
//
// ─────────────────────────────────────────────────────────────────────────────

import "dotenv/config";
import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { cors } from "hono/cors";
import { rateLimiter } from "hono-rate-limiter";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { readFile } from "fs/promises";
import { initDatabase } from "./core/database";
import { logger } from "./core/logger";
import { auth } from "./core/auth";
import { requestId } from "./core/middleware/requestId";

// Route imports
import { authRoutes }         from "./modules/auth";
import { notificationRoutes } from "./modules/notifications";
import { sampleRoutes }       from "./modules/samples";
import { testRoutes }         from "./modules/tests";
import { statRoutes }         from "./modules/stats";
import { workflowRoutes }     from "./modules/workflows";
import { operationalRoutes }  from "./modules/operational";
import { auditRoutes }        from "./modules/audit";
import { telemetryRoutes }    from "./modules/telemetry";
import archiveRoutes          from "./modules/archive/routes";
import settingsRoutes         from "./modules/settings/routes";
import analyticsRoutes        from "./modules/analytics/routes";
import dispatchRoutes         from "./modules/dispatch/routes";
import realtimeRoutes         from "./modules/realtime/router";
import exportRoutes           from "./modules/export/routes";


const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const PORT    = 3000;
const NODE_ENV = process.env.NODE_ENV ?? "development";
const IS_PROD  = NODE_ENV === "production";

function validateEnv() {
  const required = ["JWT_SECRET", "DATABASE_URL"];
  const missing  = required.filter((k) => !process.env[k]);
  if (missing.length > 0) {
    logger.error(`Missing env vars: ${missing.join(", ")}`);
  }
}

async function startServer(): Promise<void> {
  validateEnv();
  const app = new Hono();

  // ── Security headers ──────────────────────────────────────────────────────
  app.use("*", async (c, next) => {
    c.header("X-Content-Type-Options",   "nosniff");
    c.header("X-Frame-Options",          "DENY");
    c.header("X-XSS-Protection",         "1; mode=block");
    c.header("Referrer-Policy",          "strict-origin-when-cross-origin");
    c.header("Permissions-Policy",       "camera=(), microphone=(), geolocation=()");
    c.header("Content-Security-Policy",
      [
        "default-src 'self'",
        "script-src 'self'" + (IS_PROD ? "" : " ws://localhost:* ws://127.0.0.1:*"),
        "style-src-elem 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com",
        "connect-src 'self' https://*.sentry.io https://*.ingest.sentry.io" +
          (IS_PROD ? "" : " ws://localhost:* ws://127.0.0.1:*"),
        "img-src 'self' data:",
        "frame-ancestors 'none'",
      ].join("; "),
    );
    await next();
  });

  app.use("*", requestId);

  if (!IS_PROD) {
    app.use("/api/*", cors({
      origin:       ["http://localhost:5173", "http://127.0.0.1:5173"],
      credentials:  true,
      allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowHeaders: ["Content-Type", "Authorization"],
    }));
  }

  if (IS_PROD) {
    app.use("/api/*", rateLimiter({
      windowMs:        15 * 60 * 1000,
      limit:           1000,
      standardHeaders: "draft-6",
      keyGenerator:    (c) => c.req.header("x-forwarded-for") || "global",
    }));
  }

  if (!IS_PROD) {
    app.use("*", async (c, next) => {
      const start = Date.now();
      await next();
      logger.info(`${c.req.method} ${c.req.path} ${c.res.status} ${Date.now() - start}ms`);
    });
  }

  // ── Database ──────────────────────────────────────────────────────────────
  try {
    await initDatabase();
  } catch (err) {
    logger.error({ err }, "DATABASE BOOT FAILURE — continuing without database");
  }

  // ── API Routes ────────────────────────────────────────────────────────────
  const api = "/api";

  app.route(`${api}/v1/directory`, authRoutes);

  // better-auth
  app.all("/api/auth/*", (c) => auth.handler(c.req.raw));

  app.route(`${api}/notifications`,   notificationRoutes);
  app.route(`${api}/samples`,         sampleRoutes);
  app.route(`${api}/tests`,           testRoutes);
  app.route(`${api}/stats`,           statRoutes);
  app.route(`${api}/workflows`,       workflowRoutes);
  app.route(`${api}/operational`,     operationalRoutes);
  app.route(`${api}/audit-logs`,      auditRoutes);
  app.route(`${api}/telemetry`,       telemetryRoutes);
  app.route(`${api}/archive`,         archiveRoutes);
  app.route(`${api}/settings`,        settingsRoutes);
  app.route(`${api}/analytics`,       analyticsRoutes);
  app.route(`${api}/dispatch`,        dispatchRoutes);
  app.route(`${api}/realtime`,        realtimeRoutes);
  app.route(`${api}/export`,          exportRoutes);

  // ── Health ────────────────────────────────────────────────────────────────
  app.get("/health", (c) =>
    c.json({ status: "ok", uptime: Math.floor(process.uptime()), env: NODE_ENV, ts: new Date().toISOString() }),
  );

  app.notFound((c) => {
    if (c.req.path.startsWith("/api")) {
      return c.json({ error: `Route ${c.req.method} ${c.req.path} not found.` }, 404);
    }
    return c.notFound();
  });

  if (IS_PROD) {
    const distPath = path.join(__dirname, "..", "dist");
    app.use("/*", serveStatic({ root: "dist" }));
    app.get("*", async (c) => {
      try {
        const html = await readFile(path.join(distPath, "index.html"), "utf-8");
        return c.html(html);
      } catch {
        return c.text("Application not found.", 404);
      }
    });
  }

  type HttpStatus = 400 | 401 | 403 | 404 | 500;

  app.onError((err, c) => {
    const message = err?.message || "Unknown error";
    let status: HttpStatus = 500;
    if (message.includes("Invalid credentials")) status = 401;
    else if (message.includes("locked"))         status = 403;
    else if (message.includes("not found"))      status = 404;
    logger.error({ method: c.req.method, path: c.req.path, message }, "ERROR");
    return c.json({ error: IS_PROD ? "Internal Server Error" : message }, status);
  });

  // ── HTTP Server ───────────────────────────────────────────────────────────
  const server = serve({ fetch: app.fetch, port: PORT, hostname: "0.0.0.0" }, (info) => {
    logger.info(`Server running at http://localhost:${info.port} [${NODE_ENV}]`);
    // Local Network
    
  });

  if (!IS_PROD) {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    const apiListeners = server.listeners("request").slice();
    server.removeAllListeners("request");

    server.on("request", (req: any, res: any) => {
      const pathname = (req.url || "/").split("?")[0].replace(/\/+/g, "/");
      const isApi    = pathname.startsWith("/api") || pathname.startsWith("/health");

      if (isApi) {
        apiListeners.forEach((fn) => (fn as Function)(req, res));
      } else {
        vite.middlewares(req, res, () => {
          apiListeners.forEach((fn) => (fn as Function)(req, res));
        });
      }
    });
  }

  // ── Graceful shutdown ─────────────────────────────────────────────────────
  let shuttingDown = false;
  function shutdown(signal: string): void {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.warn(`${signal} - shutting down`);
    server.close(() => { logger.info("HTTP server closed"); process.exit(0); });
    setTimeout(() => { logger.error("Forced shutdown"); process.exit(1); }, 10_000).unref();
  }

  process.on("SIGINT",  () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("uncaughtException",  (err)    => { logger.error({ err }, "UNCAUGHT"); shutdown("uncaughtException"); });
  process.on("unhandledRejection", (reason) => { logger.error({ reason }, "UNHANDLED REJECTION"); });
}

startServer().catch((err) => {
  logger.error({ err }, "SERVER STARTUP FAILED");
  process.exit(1);
});