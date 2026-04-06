import { Hono } from "hono";
import { AnalyticsService } from "./service";
import { authenticateToken } from "../../core/middleware";
import { logger } from "../../core/logger";
import type { Variables } from "../../core/types";

const app = new Hono<{ Variables: Variables }>();

// --- Get all Quality ---
app.get("/quality", authenticateToken, async (c) => {
  const reqId = c.get("requestId");
  try {
    const data = await AnalyticsService.getQualityData();
    return c.json({ success: true, data });
  } catch (err: any) {
    logger.error({ reqId, err }, "Error fetching quality data");
    return c.json({ success: false, error: err.message }, 500);
  }
});

// --- Get all Volume ---
app.get("/volume", authenticateToken, async (c) => {
  const reqId = c.get("requestId");
  try {
    const data = await AnalyticsService.getVolumeData();
    return c.json({ success: true, data });
  } catch (err: any) {
    logger.error({ reqId, err }, "Error fetching volume data");
    return c.json({ success: false, error: err.message }, 500);
  }
});

// --- Get all Capability ---
app.get("/capability", authenticateToken, async (c) => {
  const reqId = c.get("requestId");
  try {
    const data = await AnalyticsService.getProcessCapability();
    return c.json({ success: true, data });
  } catch (err: any) {
    logger.error({ reqId, err }, "Error fetching capability data");
    return c.json({ success: false, error: err.message }, 500);
  }
});

export default app;
