import { useCallback, useEffect, useRef, useState } from "react";
import { useAuthStore } from "../../orchestrator/state/auth.store";

// ─────────────────────────────────────────────
// Types (unchanged from original)
// ─────────────────────────────────────────────

export type SSEEventType =
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
  | "SYSTEM_ALERT"
  | "heartbeat"
  | "connected";

export type SSECallback<T = any> = (data: T) => void;
export type SSEStatus =
  | "connecting"
  | "connected"
  | "reconnecting"
  | "disconnected";

interface UseSSEOptions {
  onConnect?: (info: { connectionId: string }) => void;
  onReconnect?: (attempt: number) => void;
  onGiveUp?: () => void;
  maxRetries?: number;
  autoConnect?: boolean;
}

interface UseSSEReturn {
  status: SSEStatus;
  isConnected: boolean;
  on: <T = any>(event: SSEEventType, callback: SSECallback<T>) => () => void;
  lastEvent: { type: SSEEventType; data: any } | null;
  disconnect: () => void;
  reconnect: () => void;
}

const SSE_URL = "/api/realtime/stream";
const BASE_DELAY = 1_000;
const MAX_DELAY = 30_000;

// ─── FIX: add ±10% jitter to spread reconnection load ───────────────────────
function jitteredDelay(baseMs: number): number {
  const jitter = baseMs * 0.1 * (Math.random() * 2 - 1); // ±10%
  return Math.min(baseMs + jitter, MAX_DELAY);
}

// ─────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────

export function useSSE(options: UseSSEOptions = {}): UseSSEReturn {
  const {
    onConnect,
    onReconnect,
    onGiveUp,
    maxRetries = 8,
    autoConnect = true,
  } = options;

  const { isAuthenticated } = useAuthStore();

  const [status, setStatus] = useState<SSEStatus>("disconnected");
  const [lastEvent, setLastEvent] = useState<{
    type: SSEEventType;
    data: any;
  } | null>(null);

  const esRef = useRef<EventSource | null>(null);
  const listenersRef = useRef<Map<SSEEventType, Set<SSECallback>>>(new Map());
  const retryRef = useRef(0);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  const emit = useCallback((type: SSEEventType, data: any) => {
    if (!mountedRef.current) return;
    setLastEvent({ type, data });
    listenersRef.current.get(type)?.forEach((cb) => cb(data));
  }, []);

  const connect = useCallback(() => {
    if (!mountedRef.current || !isAuthenticated) return;
    if (esRef.current?.readyState === EventSource.OPEN) return;

    setStatus(retryRef.current > 0 ? "reconnecting" : "connecting");

    const es = new EventSource(SSE_URL);
    esRef.current = es;

    es.onopen = () => {
      if (!mountedRef.current) return;
      setStatus("connected");
      retryRef.current = 0;
    };

    const EVENTS: SSEEventType[] = [
      "SAMPLE_CREATED",
      "SAMPLE_UPDATED",
      "SAMPLE_STATUS_CHANGED",
      "TEST_SUBMITTED",
      "TEST_REVIEWED",
      "TEST_UPDATED",
      "STAT_CREATED",
      "STAT_UPDATED",
      "NOTIFICATION_PUSHED",
      "WORKFLOW_STARTED",
      "WORKFLOW_COMPLETED",
      "SYSTEM_ALERT",
      "heartbeat",
      "connected",
    ];

    EVENTS.forEach((type) => {
      es.addEventListener(type, (e: MessageEvent) => {
        let parsed: any;
        try {
          parsed = JSON.parse(e.data);
        } catch {
          parsed = e.data;
        }
        if (type === "connected" && parsed?.connectionId) onConnect?.(parsed);
        emit(type, parsed);
      });
    });

    es.onerror = () => {
      if (!mountedRef.current) return;
      es.close();
      setStatus("disconnected");

      if (retryRef.current >= maxRetries) {
        onGiveUp?.();
        return;
      }

      // FIX: jitter prevents thundering herd
      const baseDelay = Math.min(BASE_DELAY * 2 ** retryRef.current, MAX_DELAY);
      const delay = jitteredDelay(baseDelay);
      retryRef.current++;
      onReconnect?.(retryRef.current);

      retryTimerRef.current = setTimeout(connect, delay);
    };
  }, [isAuthenticated, emit, onConnect, onReconnect, onGiveUp, maxRetries]);

  useEffect(() => {
    mountedRef.current = true;
    if (autoConnect && isAuthenticated) connect();
    return () => {
      mountedRef.current = false;
      clearTimeout(retryTimerRef.current);
      esRef.current?.close();
    };
  }, [isAuthenticated, autoConnect]); // eslint-disable-line

  const on = useCallback(
    <T = any>(event: SSEEventType, callback: SSECallback<T>) => {
      if (!listenersRef.current.has(event)) {
        listenersRef.current.set(event, new Set());
      }
      listenersRef.current.get(event)!.add(callback as SSECallback);
      return () => {
        listenersRef.current.get(event)?.delete(callback as SSECallback);
      };
    },
    [],
  );

  const disconnect = useCallback(() => {
    clearTimeout(retryTimerRef.current);
    esRef.current?.close();
    setStatus("disconnected");
  }, []);

  const reconnect = useCallback(() => {
    retryRef.current = 0;
    disconnect();
    setTimeout(connect, 100);
  }, [connect, disconnect]);

  return {
    status,
    isConnected: status === "connected",
    on,
    lastEvent,
    disconnect,
    reconnect,
  };
}
