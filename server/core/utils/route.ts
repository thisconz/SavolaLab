import type { Context } from "hono";
import type { StatusCode } from "hono/utils/http-status";
import { AppError } from "../errors";
import { logger } from "../logger";

/**
 * Convert any thrown value to a human-readable string.
 */
export function toMsg(err: unknown): string {
  if (err instanceof Error) return err.message;
  logger.error({ err }, "Non-Error thrown");
  return "An unexpected error occurred.";
}

/**
 * Extract real client IP, respecting trusted-proxy headers.
 */
export function extractClientIp(c: Context): string {
  const forwarded = c.req.header("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const realIp = c.req.header("x-real-ip");
  if (realIp) return realIp;
  return "unknown";
}

/**
 * Consistent AppError → HTTP response mapping.
 * Logs 5xx errors; passes 4xx through silently.
 */
export function handleRouteError(err: unknown, c: Context, context: string): Response {
  if (err instanceof AppError) {

    const status = err.httpStatus as StatusCode;
    if (status >= 500) {
      logger.error({ err, context, ip: extractClientIp(c) }, "Application error");
    }
    return c.json(err.toResponse(), status);
  }
  logger.error({ err, context, ip: extractClientIp(c) }, "Unhandled route error");
  return c.json(
    { success: false, error: "Internal Server Error", code: "INTERNAL_ERROR" },
    500,
  ) as Response;
}

/**
 * Route handler factory — wraps an async handler in consistent error handling.
 *
 * Usage:
 *   app.get("/foo", authenticateToken, routeHandler("FooRoutes.get", async (c) => {
 *     const data = await FooService.getAll();
 *     return c.json({ success: true, data });
 *   }));
 *
 * This eliminates the try/catch boilerplate in every route file.
 */
export function routeHandler(
  context: string,
  fn: (c: Context) => Promise<Response | void>,
) {
  return async (c: Context): Promise<Response | void> => {
    try {
      return await fn(c);
    } catch (err) {
      return handleRouteError(err, c, context);
    }
  };
}

export default { toMsg, extractClientIp, handleRouteError, routeHandler };