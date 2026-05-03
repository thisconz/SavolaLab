import { Hono } from "hono";
import { AnalyticsService } from "./service";
import { authenticateToken, requireRoles } from "../../core/middleware";
import { routeHandler } from "../../core/utils/route";
import type { Variables } from "../../core/types";

const app = new Hono<{ Variables: Variables }>();

// ── Quality / SPC trend (last 24 h) ──────────────────────────────────────────
app.get(
  "/quality",
  authenticateToken,
  routeHandler("Analytics.quality", async (c) => {
    const data = await AnalyticsService.getQualityData();
    return c.json({ success: true, data });
  }),
);

// ── Daily volume vs target (last 7 d) ────────────────────────────────────────
app.get(
  "/volume",
  authenticateToken,
  routeHandler("Analytics.volume", async (c) => {
    const data = await AnalyticsService.getVolumeData();
    return c.json({ success: true, data });
  }),
);

// ── Process Capability Cpk/Ppk (last 30 d) ───────────────────────────────────
// Dynamic spec limits are loaded from the spec_limits table inside the service.
app.get(
  "/process-capability",
  authenticateToken,
  routeHandler("Analytics.processCapability", async (c) => {
    const data = await AnalyticsService.getProcessCapability();
    return c.json({ success: true, data });
  }),
);

// ── Sample status breakdown ───────────────────────────────────────────────────
app.get(
  "/status",
  authenticateToken,
  routeHandler("Analytics.status", async (c) => {
    const data = await AnalyticsService.getSampleStatusBreakdown();
    return c.json({ success: true, data });
  }),
);

// ── Test pass rates ───────────────────────────────────────────────────────────
app.get(
  "/pass-rates",
  authenticateToken,
  routeHandler("Analytics.passRates", async (c) => {
    const data = await AnalyticsService.getTestPassRates();
    return c.json({ success: true, data });
  }),
);

// ── Stage efficiency ──────────────────────────────────────────────────────────
app.get(
  "/efficiency",
  authenticateToken,
  routeHandler("Analytics.efficiency", async (c) => {
    const data = await AnalyticsService.getStageEfficiency();
    return c.json({ success: true, data });
  }),
);


// ── Admin: bust analytics + spec_limits cache ─────────────────────────────────
app.post(
  "/invalidate",
  authenticateToken,
  requireRoles("ADMIN", "HEAD_MANAGER"),
  routeHandler("Analytics.invalidate", async (c) => {
    AnalyticsService.invalidateAll();
    return c.json({ success: true, message: "Analytics cache cleared" });
  }),
);

export default app;
