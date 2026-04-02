import { Hono } from "hono";
import { DispatchService } from "./service";
import { authenticateToken } from "../../core/middleware";

const app = new Hono();

app.get("/", authenticateToken, async (c) => {
  try {
    const data = await DispatchService.getDispatchData();
    return c.json({ success: true, data });
  } catch (err: any) {
    console.error("Error fetching dispatch data:", err);
    return c.json({ success: false, error: err.message }, 500);
  }
});

export default app;
