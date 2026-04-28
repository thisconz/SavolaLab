import { Hono } from "hono";
import { stream } from "hono/streaming";
import { sseBus, ZentharEvent } from "../../core/sse";
import { authenticateToken } from "../../core/middleware";
import { sseRateLimit } from "../../core/rateLimit";
import { logger } from "../../core/logger";
import type { Variables } from "../../core/types";
import { v4 as uuidv4 } from "uuid";

const app = new Hono<{ Variables: Variables }>();

// ── /api/realtime/stream ──────────────────────────────────────────────────────
app.get("/stream", sseRateLimit, authenticateToken, async (c) => {
  const user = c.get("user");
  const userId = user.employee_number;

  c.header("Content-Type", "text/event-stream");
  c.header("Cache-Control", "no-cache, no-transform");
  c.header("Connection", "keep-alive");
  c.header("X-Accel-Buffering", "no"); // nginx: disable proxy buffering

  logger.info({ userId }, "SSE client connected");

  return stream(c, async (writer) => {
    // Send initial connection confirmation
    await writer.write(`event: CONNECTED\ndata: ${JSON.stringify({ userId, ts: Date.now() })}\n\n`);

    let closed = false;

    // Register on the bus
    const connectionId = uuidv4();
    const unsubscribe = sseBus.subscribe(connectionId, userId, (event: ZentharEvent) => {
      if (closed) return;
      writer.write(`event: ${event.type}\ndata: ${JSON.stringify(event.data)}\n\n`).catch(() => {
        closed = true;
      });
    });

    // Heartbeat every 20s to keep connection alive through proxies
    const heartbeat = setInterval(async () => {
      if (closed) {
        clearInterval(heartbeat);
        return;
      }
      try {
        await writer.write(`event: heartbeat\ndata: ${Date.now()}\n\n`);
      } catch {
        closed = true;
        clearInterval(heartbeat);
      }
    }, 20_000);

    // Cleanup on disconnect
    writer.onAbort(() => {
      closed = true;
      clearInterval(heartbeat);
      unsubscribe();
      logger.info({ userId }, "SSE client disconnected");
    });

    // Block until client disconnects
    await new Promise<void>((resolve) => {
      writer.onAbort(resolve);
    });
  });
});

// ── Admin broadcast (ADMIN only) ─────────────────────────────────────────────
app.post("/broadcast", authenticateToken, async (c) => {
  const user = c.get("user");
  if (!["ADMIN", "HEAD_MANAGER"].includes(user.role)) {
    return c.json({ success: false, error: "Forbidden" }, 403);
  }
  const { type, data } = await c.req.json();
  if (!type) return c.json({ success: false, error: "type is required" }, 400);

  sseBus.broadcast(type, {
    ...data,
    _from: user.employee_number,
    _ts: Date.now(),
  });
  return c.json({ success: true });
});

export default app;
