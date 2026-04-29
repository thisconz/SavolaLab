import { EventEmitter } from "events";
import { ZentharEventType } from "../sse";

type DomainEventPayload = Record<string, any>;

interface DomainEvent {
  type: ZentharEventType;
  payload: DomainEventPayload;
  target?: string; // optional: targeted employee number
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

  publish(event: DomainEvent): void {
    this.emit("domain:event", event);
  }

  subscribe(handler: (event: DomainEvent) => void): () => void {
    this.on("domain:event", handler);
    return () => this.off("domain:event", handler);
  }
}

export const domainBus = DomainEventBus.getInstance();
export type { DomainEvent };
