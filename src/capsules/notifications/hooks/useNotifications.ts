import { useState, useEffect, useCallback, useRef } from "react";
import { NotificationApi } from "../api/notification.api";
import { Notification }    from "../../../core/types";
import { useRealtime }     from "../../../core/providers/RealtimeProvider";
import { useAuthStore }    from "../../../orchestrator/state/auth.store";

// ─────────────────────────────────────────────
// Shared state — all hook instances stay in sync
// ─────────────────────────────────────────────

type Listener = (n: Notification[]) => void;

let _global: Notification[] = [];
let _listeners: Set<Listener> = new Set();

function broadcast(data: Notification[]) {
  _global = data;
  _listeners.forEach((l) => l(data));
}

// ─────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>(_global);
  const { on }          = useRealtime();
  const { isAuthenticated } = useAuthStore();
  const mountedRef      = useRef(true);

  const fetch = useCallback(async () => {
    if (!isAuthenticated || !mountedRef.current) return;
    try {
      // Trigger overdue check (fire-and-forget, ignore failure)
      NotificationApi.checkOverdue().catch(() => {});
      const data = await NotificationApi.getNotifications();
      if (!mountedRef.current) return;
      broadcast(data as Notification[]);
    } catch (err: any) {
      if (err?.status !== 401 && err?.status !== 403) {
        console.error("[Notifications] fetch failed:", err);
      }
    }
  }, [isAuthenticated]);

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  useEffect(() => {
    mountedRef.current = true;

    const listener: Listener = (data) => {
      if (mountedRef.current) setNotifications(data);
    };

    _listeners.add(listener);

    // Initial fetch only if this is the first subscriber
    if (_listeners.size === 1) fetch();

    return () => {
      mountedRef.current = false;
      _listeners.delete(listener);
    };
  }, [fetch]);

  // ── SSE — re-fetch when a notification is pushed ─────────────────────────
  useEffect(() => {
    const unsub = on("NOTIFICATION_PUSHED", () => fetch());
    return unsub;
  }, [on, fetch]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const markAsRead = useCallback(async (id: number) => {
    await NotificationApi.markAsRead(id);
    broadcast(_global.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
  }, []);

  const markAllAsRead = useCallback(async () => {
    await NotificationApi.markAllAsRead();
    broadcast(_global.map((n) => ({ ...n, is_read: true })));
  }, []);

  return {
    notifications,
    unreadCount,
    fetchNotifications: fetch,
    markAsRead,
    markAllAsRead,
  };
};