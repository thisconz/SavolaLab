import { createMiddleware } from "hono/factory";
import { v4 as uuidv4 } from "uuid";
import { requestContext } from "../logger";

export const requestId = createMiddleware(async (c, next) => {
  const id = c.req.header("X-Request-ID") || uuidv4();
  c.set("requestId", id);
  c.header("X-Request-ID", id);
  await requestContext.run({ requestId: id }, next);
});
