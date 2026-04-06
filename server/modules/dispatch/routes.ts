import { Hono } from "hono";
import { DispatchService } from "./service";
import { authenticateToken } from "../../core/middleware";
import { logger } from "../../core/logger";
import type { Variables } from "../../core/types";

const app = new Hono<{ Variables: Variables }>();

app.get("/", authenticateToken, async (c) => {
  const reqId = c.get("requestId");
  try {
    const data = await DispatchService.getDispatchData();
    return c.json({ success: true, data });
  } catch (err: any) {
    logger.error({ reqId, err }, "Error fetching dispatch data");
    return c.json({ success: false, error: err.message }, 500);
  }
});

export default app;
