import { Hono } from "hono";
import { NotificationService } from "./service";
import { authenticateToken } from "../../core/middleware";
import type { Variables } from "../../core/types";

const app = new Hono<{ Variables: Variables }>();

app.get("/", authenticateToken, async (c) => {
  try {
    const user = c.get("user");
    const notifications = await NotificationService.getNotifications(
      user.employee_number,
    );
    return c.json({ success: true, data: notifications });
  } catch (err: any) {
    return c.json(
      { success: false, error: err.message || "Internal Server Error" },
      500,
    );
  }
});

app.post("/:id/read", authenticateToken, async (c) => {
  try {
    const id = c.req.param("id");
    const user = c.get("user");
    if (!id) return c.json({ error: "Notification ID is required" }, 400);

    const updated = await NotificationService.markAsRead(
      id,
      user.employee_number,
    );
    if (!updated)
      return c.json({ error: "Notification not found or already read" }, 404);

    return c.json({ success: true });
  } catch (err: any) {
    return c.json(
      { success: false, error: err.message || "Internal Server Error" },
      500,
    );
  }
});

app.post("/read-all", authenticateToken, async (c) => {
  try {
    const user = c.get("user");
    await NotificationService.markAllAsRead(user.employee_number);
    return c.json({ success: true });
  } catch (err: any) {
    return c.json(
      { success: false, error: err.message || "Internal Server Error" },
      500,
    );
  }
});

app.get("/overdue", authenticateToken, async (c) => {
  try {
    const count = await NotificationService.checkOverdueTests();
    return c.json({ success: true, count });
  } catch (err: any) {
    return c.json(
      { success: false, error: err.message || "Internal Server Error" },
      500,
    );
  }
});

export default app;
