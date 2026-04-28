import { useCallback, useEffect, useRef, useState } from "react";
import { useAuthStore } from "../../orchestrator/state/auth.store";

// ─────────────────────────────────────────────
// Types
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
export type SSEStatus = "connecting" | "connected" | "reconnecting" | "disconnected";

const ALL_EVENTS: SSEEventType[] = [
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

/** Add ±15% jitter to spread reconnection load across multiple clients */
function jitteredDelay(attempt: number): number {
  const base = Math.min(BASE_DELAY * 2 ** attempt, MAX_DELAY);
  const jitter = base * 0.15 * (Math.random() * 2 - 1);
  return Math.round(base + jitter);
}

// ─────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────

export function useSSE(options: UseSSEOptions = {}): UseSSEReturn {
  const { onConnect, onReconnect, onGiveUp, maxRetries = 8, autoConnect = true } = options;

  const isAuthenticated = useAuthStore((s) => !!s.currentUser);

  const [status, setStatus] = useState<SSEStatus>("disconnected");
  const [lastEvent, setLastEvent] = useState<{ type: SSEEventType; data: any } | null>(null);

  const esRef = useRef<EventSource | null>(null);
  const listenersRef = useRef(new Map<SSEEventType, Set<SSECallback>>());
  const retryRef = useRef(0);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  const emit = useCallback((type: SSEEventType, data: any) => {
    if (!mountedRef.current) return;
    setLastEvent({ type, data });
    listenersRef.current.get(type)?.forEach((cb) => {
      try {
        cb(data);
      } catch (e) {
        console.error("[SSE] callback error", e);
      }
    });
  }, []);

  const connect = useCallback(() => {
    if (!mountedRef.current || !isAuthenticated) return;
    if (esRef.current?.readyState === EventSource.OPEN) return;

    // Clean up any stale connection
    esRef.current?.close();

    setStatus(retryRef.current > 0 ? "reconnecting" : "connecting");

    const es = new EventSource(SSE_URL, { withCredentials: true });
    esRef.current = es;

    es.onopen = () => {
      if (!mountedRef.current) {
        es.close();
        return;
      }
      setStatus("connected");
      retryRef.current = 0;
    };

    ALL_EVENTS.forEach((type) => {
      es.addEventListener(type, (e: MessageEvent) => {
        if (!mountedRef.current) return;
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
      esRef.current = null;
      setStatus("disconnected");

      if (retryRef.current >= maxRetries) {
        onGiveUp?.();
        return;
      }

      const delay = jitteredDelay(retryRef.current);
      retryRef.current++;
      onReconnect?.(retryRef.current);

      retryTimerRef.current = setTimeout(() => {
        if (mountedRef.current) connect();
      }, delay);
    };
  }, [isAuthenticated, emit, onConnect, onReconnect, onGiveUp, maxRetries]);

  // ── Connect on mount / auth change ───────────────────────────────────────

  useEffect(() => {
    mountedRef.current = true;
    if (autoConnect && isAuthenticated) connect();

    const handleVisibilityChange = () => {
      if (
        document.visibilityState === "visible" &&
        isAuthenticated &&
        esRef.current?.readyState !== EventSource.OPEN
      ) {
        retryRef.current = 0; // reset backoff
        connect();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      mountedRef.current = false;
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      clearTimeout(retryTimerRef.current ?? undefined);
      esRef.current?.close();
      esRef.current = null;
    };
  }, [isAuthenticated, autoConnect, connect]);

  // ── Disconnect when auth is lost ─────────────────────────────────────────

  useEffect(() => {
    if (!isAuthenticated) {
      clearTimeout(retryTimerRef.current ?? undefined);
      esRef.current?.close();
      esRef.current = null;
      setStatus("disconnected");
    }
  }, [isAuthenticated]);

  // ── Subscribe API ─────────────────────────────────────────────────────────

  const on = useCallback(<T = any>(event: SSEEventType, callback: SSECallback<T>) => {
    if (!listenersRef.current.has(event)) {
      listenersRef.current.set(event, new Set());
    }
    listenersRef.current.get(event)!.add(callback as SSECallback);
    return () => {
      listenersRef.current.get(event)?.delete(callback as SSECallback);
    };
  }, []);

  const disconnect = useCallback(() => {
    clearTimeout(retryTimerRef.current ?? undefined);
    esRef.current?.close();
    esRef.current = null;
    setStatus("disconnected");
  }, []);

  const reconnect = useCallback(() => {
    retryRef.current = 0;
    disconnect();
    setTimeout(() => {
      if (mountedRef.current) connect();
    }, 100);
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
