import { Hono } from "hono";
import type { Variables } from "../../core/types";
import { NotificationService } from "./service";
import { authenticateToken } from "../../core/middleware";
import { toMsg } from "../../core/utils/route"
import { GetNotificationsResponseSchema } from "../../../src/shared/schemas/notification.schema";
import { logger } from "../../core/logger";

const app = new Hono<{ Variables: Variables }>();

// ── Routes ─────────────────────────────────────────────────────────────────

app.get("/", authenticateToken, async (c) => {
  const requestId = c.get("requestId");
  try {
    const user = c.get("user");
    const notifications = await NotificationService.getNotifications(user.employee_number);
    return c.json(
      GetNotificationsResponseSchema.parse({
        success: true,
        data: notifications,
      }),
    );
  } catch (err: unknown) {
    logger.error({ err, requestId }, "Failed to fetch notifications");
    return c.json({ success: false, error: toMsg(err) }, 500);
  }
});

app.post("/:id/read", authenticateToken, async (c) => {
  const requestId = c.get("requestId");
  try {
    const id = c.req.param("id");
    const user = c.get("user");
    if (!id) return c.json({ error: "Notification ID is required" }, 400);

    const updated = await NotificationService.markAsRead(id, user.employee_number);
    if (!updated) return c.json({ error: "Notification not found or already read" }, 404);

    return c.json({ success: true });
  } catch (err: unknown) {
    logger.error({ err, requestId }, "Failed to mark notification as read");
    return c.json({ success: false, error: toMsg(err) }, 500);
  }
});

app.post("/read-all", authenticateToken, async (c) => {
  const requestId = c.get("requestId");
  try {
    const user = c.get("user");
    await NotificationService.markAllAsRead(user.employee_number);
    return c.json({ success: true });
  } catch (err: unknown) {
    logger.error({ err, requestId }, "Failed to mark all notifications as read");
    return c.json({ success: false, error: toMsg(err) }, 500);
  }
});

app.get("/overdue", authenticateToken, async (c) => {
  const requestId = c.get("requestId");
  try {
    const count = await NotificationService.checkOverdueTests();
    return c.json({ success: true, count });
  } catch (err: unknown) {
    logger.error({ err, requestId }, "Failed to check overdue tests");
    return c.json({ success: false, error: toMsg(err) }, 500);
  }
});

export default app;
