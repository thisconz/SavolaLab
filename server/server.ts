import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { cors } from "hono/cors";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { readFile } from "fs/promises";
import { initDatabase } from "./core/database";
import "dotenv/config";

// ── Route imports ────────────────────────────────────────────
import { authRoutes } from "./modules/auth";
import { notificationRoutes } from "./modules/notifications";
import { sampleRoutes } from "./modules/samples";
import { testRoutes } from "./modules/tests";
import { statRoutes } from "./modules/stats";
import { workflowRoutes } from "./modules/workflows";
import { operationalRoutes } from "./modules/operational";
import { auditRoutes } from "./modules/audit";
import { telemetryRoutes } from "./modules/telemetry";
import archiveRoutes from "./modules/archive/routes";
import settingsRoutes from "./modules/settings/routes";

// ─────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const NODE_ENV = process.env.NODE_ENV;
const IS_PROD = NODE_ENV === "production";

// ─────────────────────────────────────────────
// App
// ─────────────────────────────────────────────
async function startServer(): Promise<void> {
  const app = new Hono();

  // ── Security headers ──────────────────────
  app.use("*", async (c, next) => {
    c.header("X-Content-Type-Options", "nosniff");
    c.header("X-Frame-Options", "DENY");
    c.header("X-XSS-Protection", "1; mode=block");
    c.header("Referrer-Policy", "strict-origin-when-cross-origin");
    c.header("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    c.header(
      "Content-Security-Policy",
      [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline'" +
          (IS_PROD ? "" : " ws://localhost:* ws://127.0.0.1:*"),
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

  // ── CORS (dev-only) ───────────────────────
  if (!IS_PROD) {
    app.use(
      "/api/*",
      cors({
        origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
        credentials: true,
        allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowHeaders: ["Content-Type", "Authorization"],
      }),
    );
  }

  // ── Request logger (dev) ──────────────────
  if (!IS_PROD) {
    app.use("*", async (c, next) => {
      const start = Date.now();
      await next();
      const ms = Date.now() - start;
      const status = c.res.status;
      const color = status >= 500 ? 31 : status >= 400 ? 33 : 32;
      console.log(
        `\x1b[${color}m${c.req.method} ${c.req.path} ${status} — ${ms}ms\x1b[0m`,
      );
    });
  }

  // ── Database ──────────────────────────────
  try {
    await initDatabase();
    console.log("✅ Database initialized");
  } catch (err) {
    console.error("❌ DATABASE BOOT FAILURE — exiting", err);
    process.exit(1);
  }

  // ── API Routes ────────────────────────────
  const api = "/api";
  app.route(`${api}/auth`, authRoutes);
  app.route(`${api}/notifications`, notificationRoutes);
  app.route(`${api}/samples`, sampleRoutes);
  app.route(`${api}/tests`, testRoutes);
  app.route(`${api}/stats`, statRoutes);
  app.route(`${api}/workflows`, workflowRoutes);
  app.route(`${api}/operational`, operationalRoutes);
  app.route(`${api}/audit-logs`, auditRoutes);
  app.route(`${api}/telemetry`, telemetryRoutes);
  app.route(`${api}/archive`, archiveRoutes);
  app.route(`${api}/settings`, settingsRoutes);

  // ── Health check ──────────────────────────
  app.get("/health", (c) =>
    c.json({
      status: "ok",
      uptime: Math.floor(process.uptime()),
      env: NODE_ENV,
      timestamp: new Date().toISOString(),
    }),
  );

  // ── 404 for unknown API routes ─────────────
  app.notFound((c) => {
    if (c.req.path.startsWith("/api")) {
      return c.json(
        { error: `Route ${c.req.method} ${c.req.path} not found.` },
        404,
      );
    }
    // Fall through for SPA routes below
    return c.notFound();
  });

  // ── Production SPA static serving ─────────
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

  // ── Global error handler ──────────────────
  app.onError((err, c) => {
    console.error("❌ UNHANDLED ERROR", {
      method: c.req.method,
      path: c.req.path,
      message: err?.message,
      stack: IS_PROD ? undefined : err?.stack,
    });
    return c.json(
      { error: IS_PROD ? "Internal Server Error" : err?.message },
      500,
    );
  });

  // ── HTTP Server ───────────────────────────
  const server = serve({ fetch: app.fetch, port: PORT }, (info) => {
    console.log(
      `🚀 Server running at http://localhost:${info.port} [${NODE_ENV}]`,
    );
  });

  // ── Vite dev middleware ───────────────────
  if (!IS_PROD) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });

    const apiListeners = server.listeners("request").slice();
    server.removeAllListeners("request");

    server.on("request", (req: any, res: any) => {
      const isApi =
        req.url?.startsWith("/api") || req.url?.startsWith("/health");

      if (isApi) {
        apiListeners.forEach((fn) => (fn as Function)(req, res));
      } else {
        vite.middlewares(req, res, () => {
          apiListeners.forEach((fn) => (fn as Function)(req, res));
        });
      }
    });
  }

  // ── Graceful shutdown ─────────────────────
  let shuttingDown = false;

  function shutdown(signal: string): void {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`\n⚠️  ${signal} received — shutting down gracefully…`);
    server.close(() => {
      console.log("🛑 HTTP server closed");
      process.exit(0);
    });
    // Force-kill after 10 s
    setTimeout(() => {
      console.error("❌ Forced shutdown (timeout)");
      process.exit(1);
    }, 10_000).unref();
  }

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));

  process.on("uncaughtException", (err) => {
    console.error("❌ UNCAUGHT EXCEPTION", err);
    shutdown("uncaughtException");
  });

  process.on("unhandledRejection", (reason) => {
    console.error("❌ UNHANDLED REJECTION", reason);
  });
}

startServer().catch((err) => {
  console.error("❌ SERVER STARTUP FAILED", err);
  process.exit(1);
});
