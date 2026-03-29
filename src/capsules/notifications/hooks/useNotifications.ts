import { useState, useEffect, useCallback } from "react";
import { NotificationApi } from "../api/notification.api";
import { Notification } from "../../../core/types";

// Using a simple external variable to share state between all hook instances
let globalNotifications: Notification[] = [];
let listeners: Array<(n: Notification[]) => void> = [];

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>(globalNotifications);

  const broadcast = useCallback((data: Notification[]) => {
    globalNotifications = data;
    listeners.forEach((listener) => listener(data));
  }, []);

  const fetchNotifications = useCallback(async () => {
    try { await NotificationApi.checkOverdue(); } catch (err: any) {
      if (err?.status !== 401 && err?.status !== 403) console.warn("checkOverdue failed", err);
    } 
    try {
    const data = await NotificationApi.getNotifications();
    broadcast(data as Notification[]);
    } catch (err: any) {
      if (err?.status !== 401 && err?.status !== 403) console.error("getNotifications failed", err);
    }
  }, [broadcast]);

  useEffect(() => {
    const handler = (data: Notification[]) => setNotifications(data);
    listeners.push(handler);

    let interval: ReturnType<typeof setInterval> | null = null;

    if (listeners.length === 1) {
      fetchNotifications();
      interval = setInterval(fetchNotifications, 30_000);
    }

    return () => {
      listeners = listeners.filter((l) => l !== handler);
      if (listeners.length === 0 && interval) {
        clearInterval(interval);
      }
    };
  }, [fetchNotifications]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return {
    notifications,
    unreadCount,
    fetchNotifications,
    markAsRead: async (id: number) => {
      await NotificationApi.markAsRead(id);
      fetchNotifications();
    },
    markAllAsRead: async () => {
      await NotificationApi.markAllAsRead();
      fetchNotifications();
    }
  };
};