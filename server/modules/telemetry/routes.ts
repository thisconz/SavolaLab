import { Hono }                  from "hono";
import type { Variables, TelemetryFilter } from "../../core/types";
import { TelemetryService }      from "./service";
import { authenticateToken }     from "../../core/middleware";
import { TelemetryFilterSchema } from "../../../src/shared/schemas/telemetry.schema";
import { logger }                from "../../core/logger";

const app = new Hono<{ Variables: Variables }>();

/**
 * GET /telemetry?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 * Optional query parameters to filter telemetry stats by date range.
 */
app.get("/", authenticateToken, async (c) => {
  const reqId = c.get("requestId");
  try {
    const query = {
      startDate: c.req.query("startDate") || undefined,
      endDate: c.req.query("endDate") || undefined,
    };
    
    const filter = TelemetryFilterSchema.parse(query);

    const telemetry = await TelemetryService.getTelemetry(filter);
    return c.json({ success: true, data: telemetry });
  } catch (err: any) {
    logger.error({ reqId, err }, "Telemetry fetch error");
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
