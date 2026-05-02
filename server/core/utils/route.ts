import type { Context } from "hono";
import { AppError } from "../errors";
import { logger } from "../logger";

/**
 * Converts any thrown value to a human-readable string.
 * Previously copy-pasted as `toMsg` in 5+ route files.
 */
export function toMsg(err: unknown): string {
  if (err instanceof Error) return err.message;
  return "An unexpected error occurred.";
}

/**
 * Extracts the real client IP, respecting trusted-proxy headers.
 * Previously duplicated as `extractClientIp` / `getIp` across route files.
 */
export function extractClientIp(c: Context): string {
  const forwarded = c.req.header("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const realIp = c.req.header("x-real-ip");
  if (realIp) return realIp;
  return "unknown";
}

/**
 * Handles AppError and generic errors in a consistent way.
 * Re-exported from middleware.ts but duplicated in several route files.
 */
export function handleRouteError(err: unknown, c: Context, context: string): Response {
  if (err instanceof AppError) {
    if (err.httpStatus >= 500) logger.error({ err, context }, "Application error");
    return c.json(err.toResponse(), err.httpStatus);
  }
  logger.error({ err, context }, "Unhandled route error");
  return c.json(
    { success: false, error: "Internal Server Error", code: "INTERNAL_ERROR" },
    500,
  );
}