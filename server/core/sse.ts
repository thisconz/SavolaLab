import { EventEmitter } from "events";
import { logger } from "./logger";

// ─────────────────────────────────────────────
// Event type registry — strongly typed
// ─────────────────────────────────────────────

export type ZentharEventType =
  | "SAMPLE_CREATED"
  | "SAMPLE_UPDATED"
  | "SAMPLE_STATUS_CHANGED"
  | "TEST_SUBMITTED"
  | "TEST_REVIEWED"
  | "TEST_UPDATED"
  | "STAT_CREATED"
  | "STAT_UPDATED"
  | "NOTIFICATION_PUSHED"
  | "WORKFLOW_STARTED"
  | "WORKFLOW_COMPLETED"
  | "SYSTEM_ALERT";

export interface ZentharEvent<T = Record<string, any>> {
  type: ZentharEventType;
  data: T;
  /** If set, only this employee will receive the event */
  target?: string;
  /** ISO timestamp */
  ts: string;
}

export type SampleCreatedEvent = ZentharEvent<{
  id: number;
  batch_id: string;
  priority: string;
  source_stage: string;
  technician_id: string;
}>;

export type SampleUpdatedEvent = ZentharEvent<{
  id: number;
  batch_id: string;
  status?: string;
  priority?: string;
  changed_by: string;
}>;

export type TestSubmittedEvent = ZentharEvent<{
  id: number;
  sample_id: number;
  test_type: string;
  raw_value: number | undefined;
  status: string;
  performer_id: string;
}>;

export type StatCreatedEvent = ZentharEvent<{
  id: number;
  department: string;
  urgency: string;
}>;

export type SystemAlertEvent = ZentharEvent<{
  message: string;
  level: "info" | "warning" | "error";
}>;

// ─────────────────────────────────────────────
// Connection record
// ─────────────────────────────────────────────

interface SSEClient {
  employeeNumber: string;
  connectionId: string;
  connectedAt: Date;
  handler: (event: ZentharEvent) => void;
}

// ─────────────────────────────────────────────
// Event Bus
// ─────────────────────────────────────────────

class SSEBus {
  private clients = new Map<string, SSEClient>();
  private debounceTimers = new Map<string, ReturnType<typeof setTimeout>>();

  /**
   * Register a new SSE client connection.
   * Returns an unsubscribe function.
   */
  subscribe(
    connectionId: string,
    employeeNumber: string,
    handler: (event: ZentharEvent) => void,
  ): () => void {
    const client: SSEClient = {
      employeeNumber,
      connectionId,
      connectedAt: new Date(),
      handler,
    };

    this.clients.set(connectionId, client);

    logger.info({ connectionId, employeeNumber, total: this.clients.size }, "SSE client connected");

    return () => {
      this.clients.delete(connectionId);
      logger.info({ connectionId, employeeNumber, total: this.clients.size }, "SSE client disconnected");
    };
  }

  /**
   * Publish an event. If `event.target` is set, only that employee
   * receives it. Otherwise broadcast to all connections.
   */
  publish(event: ZentharEvent): void {
    const payload: ZentharEvent = {
      ...event,
      ts: event.ts ?? new Date().toISOString(),
    };

    let delivered = 0;

    for (const client of this.clients.values()) {
      if (payload.target && client.employeeNumber !== payload.target) {
        continue;
      }
      try {
        client.handler(payload);
        delivered++;
      } catch (err) {
        logger.error({ err, connectionId: client.connectionId }, "SSE delivery error");
      }
    }

    logger.debug({ type: payload.type, delivered, total: this.clients.size }, "SSE event published");
  }

  /** Convenience helpers */
  broadcast(type: ZentharEventType, data: Record<string, any>): void {
    this.publish({ type, data, ts: new Date().toISOString() });
  }

  sendTo(employeeNumber: string, type: ZentharEventType, data: Record<string, any>): void {
    this.publish({
      type,
      data,
      target: employeeNumber,
      ts: new Date().toISOString(),
    });
  }

  get connectionCount(): number {
    return this.clients.size;
  }

  getConnectionsForEmployee(employeeNumber: string): number {
    let count = 0;
    for (const c of this.clients.values()) {
      if (c.employeeNumber === employeeNumber) count++;
    }
    return count;
  }

  publishDebounced(event: ZentharEvent, windowMs = 250): void {
    const key = `${event.type}:${event.target ?? "all"}`;
    clearTimeout(this.debounceTimers.get(key));
    this.debounceTimers.set(
      key,
      setTimeout(() => this.publish(event), windowMs),
    );
  }
}

// Export a module-level singleton
export const sseBus = new SSEBus();
