import { Hono } from "hono";
import { TelemetryService, TelemetryFilter } from "./service";
import { authenticateToken } from "../../core/middleware";

const app = new Hono();

/**
 * GET /telemetry?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 * Optional query parameters to filter telemetry stats by date range.
 */
app.get("/", authenticateToken, async (c) => {
  try {
    const filter: TelemetryFilter = {
      startDate: c.req.query("startDate")
        ? String(c.req.query("startDate"))
        : undefined,
      endDate: c.req.query("endDate")
        ? String(c.req.query("endDate"))
        : undefined,
    };

    const telemetry = await TelemetryService.getTelemetry(filter);
    return c.json({ success: true, data: telemetry });
  } catch (err: any) {
    console.error("Telemetry fetch error:", err);
    return c.json(
      {
        success: false,
        error: err.message || "Failed to fetch telemetry data",
      },
      500,
    );
  }
});

export default app;
