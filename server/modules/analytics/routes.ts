import { Hono } from "hono";
import { AnalyticsService } from "./service";
import { authenticateToken, handleRouteError } from "../../core/middleware";
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
app.get(
  "/capability",
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
