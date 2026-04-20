import type { Context, Next, MiddlewareHandler } from "hono";
import { ZodSchema, ZodError, z }               from "zod";

type Target = "json" | "query" | "param";

/**
 * Hono middleware factory that validates incoming data with a Zod schema.
 *
 * Usage:
 *   import { validate } from "../../core/validate";
 *
 *   app.post("/", validate("json", CreateSchema), async (c) => {
 *     const body = c.req.valid("json"); // fully typed
 *   });
 */
export function validate<S extends ZodSchema>(
  target: Target,
  schema: S,
): MiddlewareHandler {
  return async (c: Context, next: Next) => {
    let raw: unknown;

    try {
      switch (target) {
        case "json":  raw = await c.req.json(); break;
        case "query": raw = c.req.query();      break;
        case "param": raw = c.req.param();      break;
      }
    } catch {
      return c.json(
        { success: false, error: "Invalid JSON body", code: "BAD_REQUEST" },
        400,
      );
    }

    const result = schema.safeParse(raw);

    if (!result.success) {
      const issues = (result.error as ZodError).issues.map((i) => ({
        path:    i.path.join("."),
        message: i.message,
        code:    i.code,
      }));

      return c.json(
        {
          success: false,
          error:   "Validation failed",
          code:    "VALIDATION_ERROR",
          issues,
        },
        422,
      );
    }

    // Attach validated (and transformed) data so handlers can read it
    c.set(`valid_${target}`, result.data);
    await next();
  };
}

/**
 * Read validated data from context.
 * Throws a typed error if validation middleware wasn't applied.
 */
export function getValid<T>(c: Context, target: Target): T {
  const key  = `valid_${target}`;
  const data = c.get(key);
  if (data === undefined) {
    throw new Error(
      `[validate] No validated data for target "${target}". Did you apply the validate() middleware?`,
    );
  }
  return data as T;
}