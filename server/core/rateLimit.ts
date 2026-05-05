import type { Context, Next, MiddlewareHandler } from "hono";
import { logger } from "./logger";

interface RateLimitOptions {
  /** Max requests in the window */
  limit: number;
  /** Window duration in ms */
  windowMs: number;
  /** Optional custom key (defaults to X-Forwarded-For or remote addr) */
  keyFn?: (c: Context) => string;
  /** Message returned on 429 */
  message?: string;
}

interface BucketEntry {
  count: number;
  resetAt: number;
}

/**
 * In-process token-bucket rate limiter.
 * Replace with a Redis-backed store for multi-instance production deployments.
 */
export function rateLimit(opts: RateLimitOptions): MiddlewareHandler {
  const store = new Map<string, BucketEntry>();

  // Sweep expired entries every minute
  const sweep = setInterval(() => {
    const now = Date.now();
    for (const [k, v] of store.entries()) {
      if (now > v.resetAt) store.delete(k);
    }
  }, 60_000);
  if (sweep.unref) sweep.unref();

  return async (c: Context, next: Next) => {
    const ip = opts.keyFn?.(c) ??
      c.req.header("x-forwarded-for")?.split(",")[0].trim() ??
      c.req.header("x-real-ip") ??
      "unknown";

    const now = Date.now();
    let entry = store.get(ip);

    if (!entry || now > entry.resetAt) {
      entry = { count: 0, resetAt: now + opts.windowMs };
      store.set(ip, entry);
    }

    entry.count++;

    // Set standard headers
    c.header("X-RateLimit-Limit", String(opts.limit));
    c.header("X-RateLimit-Remaining", String(Math.max(0, opts.limit - entry.count)));
    c.header("X-RateLimit-Reset", String(Math.ceil(entry.resetAt / 1000)));

    if (entry.count > opts.limit) {
      logger.warn({ ip, path: c.req.path, count: entry.count }, "Rate limit exceeded");
      c.header("Retry-After", String(Math.ceil((entry.resetAt - now) / 1000)));
      return c.json(
        {
          success: false,
          error: opts.message ?? "Too many requests. Please slow down.",
          code: "RATE_LIMIT_EXCEEDED",
        },
        429
      );
    }

    await next();
  };
}

// ─────────────────────────────────────────────
// Pre-built presets
// ─────────────────────────────────────────────

/** Strict limit for auth endpoints (prevents brute-force) */
export const authRateLimit = rateLimit({
  limit: 10,
  windowMs: 15 * 60 * 1000, // 15 min
  message: "Too many authentication attempts. Try again in 15 minutes.",
});

/** Standard API limit */
export const apiRateLimit = rateLimit({
  limit: 300,
  windowMs: 60 * 1000, // 1 min
});

/** Very generous limit for SSE streams (one per user) */
export const sseRateLimit = rateLimit({
  limit: 10,
  windowMs: 60 * 1000,
  message: "Too many SSE connections.",
});
