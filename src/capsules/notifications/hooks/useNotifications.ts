import { create }                from "zustand";
import { useEffect, useCallback } from "react";
import { NotificationApi }       from "../api/notification.api";
import { Notification }          from "../../../core/types";
import { useRealtime }           from "../../../core/providers/RealtimeProvider";
import { useAuthStore }          from "../../../orchestrator/state/auth.store";

// ─────────────────────────────────────────────
// Zustand store — single source of truth
// ─────────────────────────────────────────────

interface NotificationStore {
  notifications:   Notification[];
  isFetching:      boolean;
  lastFetchedAt:   number | null;

  setNotifications: (n: Notification[]) => void;
  setFetching:      (v: boolean) => void;
  markOneAsRead:    (id: number) => void;
  markAllAsRead:    () => void;
}

const useNotificationStore = create<NotificationStore>((set) => ({
  notifications:   [],
  isFetching:      false,
  lastFetchedAt:   null,

  setNotifications: (notifications) =>
    set({ notifications, lastFetchedAt: Date.now() }),

  setFetching: (isFetching) => set({ isFetching }),

  // Optimistic updates — UI changes immediately, server call is fire-and-forget
  markOneAsRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, is_read: true } : n
      ),
    })),

  markAllAsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, is_read: true })),
    })),
}));

// ─────────────────────────────────────────────
// Shared fetch function (deduplicates concurrent calls)
// ─────────────────────────────────────────────

let _fetchInFlight: Promise<void> | null = null;

async function fetchNotifications(): Promise<void> {
  if (_fetchInFlight) return _fetchInFlight;

  _fetchInFlight = (async () => {
    const { setNotifications, setFetching } = useNotificationStore.getState();
    setFetching(true);
    try {
      // Trigger overdue check (fire-and-forget)
      NotificationApi.checkOverdue().catch(() => {});
      const data = await NotificationApi.getNotifications();
      setNotifications(data as Notification[]);
    } catch (err: any) {
      if (err?.status !== 401 && err?.status !== 403) {
        console.error("[Notifications] fetch failed:", err);
      }
    } finally {
      setFetching(false);
      _fetchInFlight = null;
    }
  })();

  return _fetchInFlight;
}

// ─────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────

export const useNotifications = () => {
  const { isAuthenticated } = useAuthStore();
  const { on }              = useRealtime();

  const notifications = useNotificationStore((s) => s.notifications);
  const isFetching    = useNotificationStore((s) => s.isFetching);
  const store         = useNotificationStore();

  // ── Initial fetch ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated) return;
    fetchNotifications();
  }, [isAuthenticated]);

  // ── SSE subscription — refetch on push ─────────────────────────────────
  // FIX: Zustand removes the double-registration problem entirely.
  //      The store is a stable singleton; each hook instance just reads from it.
  useEffect(() => {
    const unsub = on("NOTIFICATION_PUSHED", () => fetchNotifications());
    return unsub;
  }, [on]);

  // ── Derived values ──────────────────────────────────────────────────────
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const unreadByType = notifications.reduce<Record<string, number>>((acc, n) => {
    if (!n.is_read) acc[n.type] = (acc[n.type] || 0) + 1;
    return acc;
  }, {});

  // ── Actions ─────────────────────────────────────────────────────────────
  const markAsRead = useCallback(async (id: number) => {
    store.markOneAsRead(id); // optimistic
    try {
      await NotificationApi.markAsRead(id);
    } catch {
      // Revert on failure by re-fetching
      fetchNotifications();
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    store.markAllAsRead(); // optimistic
    try {
      await NotificationApi.markAllAsRead();
    } catch {
      fetchNotifications();
    }
  }, []);

  return {
    notifications,
    unreadCount,
    unreadByType,
    isFetching,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  };
};