import { Hono } from "hono";
import type { Variables } from "../../core/types";
import { DispatchService } from "./service";
import { authenticateToken, handleRouteError } from "../../core/middleware";
import { logger } from "../../core/logger";

const app = new Hono<{ Variables: Variables }>();

app.get("/", authenticateToken, async (c) => {
  const reqId = c.get("requestId");
  try {
    const data = await DispatchService.getDispatchData();
    return c.json({ success: true, data });
  } catch (err: any) {
    logger.error({ reqId, err }, "Error fetching dispatch data");
    return handleRouteError(err, c, "DispatchService.getDispatchData");
  }
});

export default app;
