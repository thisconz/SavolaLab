import { Hono } from "hono";
import { AnalyticsService } from "./service";
import { authenticateToken } from "../../core/middleware";

const app = new Hono();

app.get("/quality", authenticateToken, async (c) => {
  try {
    const data = await AnalyticsService.getQualityData();
    return c.json({ success: true, data });
  } catch (err: any) {
    console.error("Error fetching quality data:", err);
    return c.json({ success: false, error: err.message }, 500);
  }
});

app.get("/volume", authenticateToken, async (c) => {
  try {
    const data = await AnalyticsService.getVolumeData();
    return c.json({ success: true, data });
  } catch (err: any) {
    console.error("Error fetching volume data:", err);
    return c.json({ success: false, error: err.message }, 500);
  }
});

app.get("/capability", authenticateToken, async (c) => {
  try {
    const data = await AnalyticsService.getProcessCapability();
    return c.json({ success: true, data });
  } catch (err: any) {
    console.error("Error fetching capability data:", err);
    return c.json({ success: false, error: err.message }, 500);
  }
});

export default app;
