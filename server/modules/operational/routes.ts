import { Hono }               from "hono";
import type { Variables }     from "../../core/types";
import { OperationalService } from "./service";
import { authenticateToken }  from "../../core/middleware";
import { logger }             from "../../core/logger";

const app = new Hono<{ Variables: Variables }>();

// Helper for consistent responses
function sendResponse(c: any, data: any, message = "OK") {
  return c.json({ success: true, message, data });
}

// --- Production Lines ---
app.get("/production-lines", authenticateToken, async (c) => {
  const reqId = c.get("requestId");
  try {
    const lines = await OperationalService.getProductionLines();
    return sendResponse(c, lines, "Production lines retrieved");
  } catch (err) {
    logger.error({ reqId, err }, "Error fetching production lines");
    return c.json(
      { success: false, error: "Failed to fetch production lines" },
      500,
    );
  }
});

// --- Equipment by Production Line ---
app.get("/equipment", authenticateToken, async (c) => {
  const reqId = c.get("requestId");
  try {
    const line_id = c.req.query("line_id");
    if (!line_id)
      return c.json(
        {
          success: false,
          error: "line_id query parameter is required",
        },
        400,
      );

    const equipment = await OperationalService.getEquipment({
      lineId: line_id,
    });
    return sendResponse(
      c,
      equipment,
      `Equipment for line ${line_id} retrieved`,
    );
  } catch (err) {
    logger.error({ reqId, err }, "Error fetching equipment");
    return c.json({ success: false, error: "Failed to fetch equipment" }, 500);
  }
});

// --- Instruments ---
app.get("/instruments", authenticateToken, async (c) => {
  const reqId = c.get("requestId");
  try {
    const instruments = await OperationalService.getInstruments();
    return sendResponse(c, instruments, "Instruments retrieved");
  } catch (err) {
    logger.error({ reqId, err }, "Error fetching instruments");
    return c.json(
      { success: false, error: "Failed to fetch instruments" },
      500,
    );
  }
});

// --- Inventory ---
app.get("/inventory", authenticateToken, async (c) => {
  const reqId = c.get("requestId");
  try {
    const inventory = await OperationalService.getInventory();
    return sendResponse(c, inventory, "Inventory retrieved");
  } catch (err) {
    logger.error({ reqId, err }, "Error fetching inventory");
    return c.json({ success: false, error: "Failed to fetch inventory" }, 500);
  }
});

// --- Certificates ---
app.get("/certificates", authenticateToken, async (c) => {
  const reqId = c.get("requestId");
  try {
    const certificates = await OperationalService.getCertificates();
    return sendResponse(c, certificates, "Certificates retrieved");
  } catch (err) {
    logger.error({ reqId, err }, "Error fetching certificates");
    return c.json(
      { success: false, error: "Failed to fetch certificates" },
      500,
    );
  }
});

// --- Plant Intelligence ---
app.get("/plant-intel", authenticateToken, async (c) => {
  const reqId = c.get("requestId");
  try {
    const data = await OperationalService.getPlantIntel();
    return sendResponse(c, data, "Plant intelligence retrieved");
  } catch (err) {
    logger.error({ reqId, err }, "Error fetching plant intel");
    return c.json(
      { success: false, error: "Failed to fetch plant intel" },
      500,
    );
  }
});

export default app;
