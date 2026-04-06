import { createMiddleware } from "hono/factory";
import { v4 as uuidv4 } from "uuid";

export const requestId = createMiddleware(async (c, next) => {
  const requestId = c.req.header("X-Request-ID") || uuidv4();
  c.set("requestId", requestId);
  c.header("X-Request-ID", requestId);
  await next();
});
