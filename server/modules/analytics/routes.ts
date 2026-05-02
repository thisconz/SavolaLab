import { Hono } from "hono";
import { AnalyticsService } from "./service";
import { authenticateToken } from "../../core/middleware";
import { handleRouteError } from "../../core/utils/route"
import { logger } from "../../core/logger";
import type { Variables } from "../../core/types";

const app = new Hono<{ Variables: Variables }>();

function wrap<T>(fn: () => Promise<T>) {
  return async (c: any) => {
    const reqId = c.get("requestId");
    try {
      const data = await fn();
      return c.json({ success: true, data });
    } catch (err: any) {
      logger.error({ reqId, err }, "Analytics route error");
      return handleRouteError(err, c, "AnalyticsRoutes.wrap");
    }
  };
}

app.get(
  "/quality",
  authenticateToken,
  wrap(() => AnalyticsService.getQualityData()),
);
app.get(
  "/volume",
  authenticateToken,
  wrap(() => AnalyticsService.getVolumeData()),
);
// Make spec limits dynamic: Read from the spec_limits table in AnalyticsService.getProcessCapability()
// and cache for 15 minutes. This makes the Settings → Spec Limits UI actually affect analytics.
app.get(
  "/process-capability",
  authenticateToken,
  wrap(() => AnalyticsService.getProcessCapability()),
);
app.get(
  "/status",
  authenticateToken,
  wrap(() => AnalyticsService.getSampleStatusBreakdown()),
);
app.get(
  "/pass-rates",
  authenticateToken,
  wrap(() => AnalyticsService.getTestPassRates()),
);
app.get(
  "/efficiency",
  authenticateToken,
  wrap(() => AnalyticsService.getStageEfficiency()),
);

/** Admin: bust cache */
app.post("/invalidate", authenticateToken, async (c) => {
  AnalyticsService.invalidateAll();
  return c.json({ success: true, message: "Analytics cache cleared" });
});

export default app;
