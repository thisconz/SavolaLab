import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import { sseBus, ZentharEvent } from "../../core/sse";
import { authenticateToken } from "../../core/middleware";
import { logger } from "../../core/logger";
import type { Variables } from "../../core/types";
import { v4 as uuidv4 } from "uuid";
import { sseRateLimit } from "../../core/rateLimit";

const app = new Hono<{ Variables: Variables }>();

// ── /api/realtime/stream ──────────────────────────────────────────────────────
app.get("/stream", sseRateLimit, authenticateToken, async (c) => {
  const user = c.get("user");
  const userId = user.employee_number;

  // Set Nginx/Proxy headers manually if not handled by middleware
  c.header("X-Accel-Buffering", "no");

  logger.info({ userId }, "SSE client connection attempt");

  return streamSSE(c, async (sse) => {
    let closed = false;
    const connectionId = uuidv4();

    // Initial Connection Event
    await sse.writeSSE({
      event: "CONNECTED",
      data: JSON.stringify({ userId, ts: Date.now() }),
    });

    // Subscribe to Bus
    const unsubscribe = sseBus.subscribe(connectionId, userId, async (event: ZentharEvent) => {
      if (closed) return;
      try {
        await sse.writeSSE({
          event: event.type,
          data: JSON.stringify(event.data),
        });
      } catch (err) {
        closed = true;
        cleanup();
      }
    });

    // Heartbeat to keep connection alive
    const heartbeat = setInterval(async () => {
      if (closed) return;
      try {
        await sse.writeSSE({
          event: "heartbeat",
          data: Date.now().toString(),
        });
      } catch {
        closed = true;
        cleanup();
      }
    }, 20_000);

    // Centralized cleanup function
    function cleanup() {
      closed = true;
      clearInterval(heartbeat);
      unsubscribe();
      logger.info({ userId, connectionId }, "SSE client resources cleaned up");
    }

    // Handle client disconnect
    sse.onAbort(() => {
      cleanup();
    });

    // Keep the stream alive
    while (!closed) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  });
});

// ── Admin broadcast (ADMIN only) ─────────────────────────────────────────────
app.post("/broadcast", authenticateToken, async (c) => {
  const user = c.get("user");

  if (!["ADMIN", "HEAD_MANAGER"].includes(user.role)) {
    return c.json({ success: false, error: "Forbidden" }, 403);
  }

  try {
    const body = await c.req.json();
    const { type, data } = body;

    if (!type) {
      return c.json({ success: false, error: "type is required" }, 400);
    }

    sseBus.broadcast(type, {
      ...data,
      _from: user.employee_number,
      _ts: Date.now(),
    });

    return c.json({ success: true });
  } catch (error) {
    return c.json({ success: false, error: "Invalid JSON body" }, 400);
  }
});

export default app;
