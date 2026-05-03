import { EventEmitter } from "events";
import { ZentharEventType } from "../sse";

type DomainEventPayload = Record<string, any>;

export interface DomainEvent {
  /** Must be a valid ZentharEventType — enforces parity with SSE registry */
  type: ZentharEventType;
  payload: DomainEventPayload;
  /**
   * Optional: employee_number of the sole intended recipient.
   * If omitted, the event is broadcast to all connected clients.
   */
  target?: string;
}

class DomainEventBus extends EventEmitter {
  private static instance: DomainEventBus;

  static getInstance(): DomainEventBus {
    if (!DomainEventBus.instance) {
      DomainEventBus.instance = new DomainEventBus();
      DomainEventBus.instance.setMaxListeners(50);
    }
    return DomainEventBus.instance;
  }

  /**
   * Publish a domain event.
   * The SSE subscriber bridge (sse-subscriber.ts) handles routing to
   * either sseBus.sendTo() or sseBus.broadcast() automatically.
   */
  publish(event: DomainEvent): void {
    this.emit("domain:event", event);
  }

  /**
   * Subscribe to domain events.
   * Returns an unsubscribe function for clean teardown.
   */
  subscribe(handler: (event: DomainEvent) => void): () => void {
    this.on("domain:event", handler);
    return () => this.off("domain:event", handler);
  }
}

export const domainBus = DomainEventBus.getInstance();