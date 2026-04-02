import { Hono } from "hono";
import { OperationalService } from "./service";
import { authenticateToken } from "../../core/middleware";

const app = new Hono();

// Helper for consistent responses
function sendResponse(c: any, data: any, message = "OK") {
  return c.json({ success: true, message, data });
}

// --- Production Lines ---
app.get("/production-lines", authenticateToken, async (c) => {
  try {
    const lines = await OperationalService.getProductionLines();
    return sendResponse(c, lines, "Production lines retrieved");
  } catch (err) {
    console.error("Error fetching production lines:", err);
    return c.json(
      { success: false, error: "Failed to fetch production lines" },
      500,
    );
  }
});

// --- Equipment by Production Line ---
app.get("/equipment", authenticateToken, async (c) => {
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

    const equipment = await OperationalService.getEquipment({ lineId: line_id });
    return sendResponse(
      c,
      equipment,
      `Equipment for line ${line_id} retrieved`,
    );
  } catch (err) {
    console.error("Error fetching equipment:", err);
    return c.json({ success: false, error: "Failed to fetch equipment" }, 500);
  }
});

// --- Instruments ---
app.get("/instruments", authenticateToken, async (c) => {
  try {
    const instruments = await OperationalService.getInstruments();
    return sendResponse(c, instruments, "Instruments retrieved");
  } catch (err) {
    console.error("Error fetching instruments:", err);
    return c.json(
      { success: false, error: "Failed to fetch instruments" },
      500,
    );
  }
});

// --- Inventory ---
app.get("/inventory", authenticateToken, async (c) => {
  try {
    const inventory = await OperationalService.getInventory();
    return sendResponse(c, inventory, "Inventory retrieved");
  } catch (err) {
    console.error("Error fetching inventory:", err);
    return c.json({ success: false, error: "Failed to fetch inventory" }, 500);
  }
});

// --- Certificates ---
app.get("/certificates", authenticateToken, async (c) => {
  try {
    const certificates = await OperationalService.getCertificates();
    return sendResponse(c, certificates, "Certificates retrieved");
  } catch (err) {
    console.error("Error fetching certificates:", err);
    return c.json(
      { success: false, error: "Failed to fetch certificates" },
      500,
    );
  }
});

// --- Plant Intelligence ---
app.get("/plant-intel", authenticateToken, async (c) => {
  try {
    const data = await OperationalService.getPlantIntel();
    return sendResponse(c, data, "Plant intelligence retrieved");
  } catch (err) {
    console.error("Error fetching plant intel:", err);
    return c.json(
      { success: false, error: "Failed to fetch plant intel" },
      500,
    );
  }
});

export default app;
