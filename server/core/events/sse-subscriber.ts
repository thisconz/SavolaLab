import { domainBus } from "./domain-bus";
import { sseBus } from "../sse";

/**
 * Single subscriber that bridges domain events → SSE transport.
 * Call once at server startup.
 */
export function initSseSubscriber(): void {
  domainBus.subscribe((event) => {
    if (event.target) {
      sseBus.sendTo(event.target, event.type, event.payload);
    } else {
      sseBus.broadcast(event.type, event.payload);
    }
  });
}
