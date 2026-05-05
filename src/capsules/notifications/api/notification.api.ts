import { api } from "../../../core/http/client";
import type { Notification } from "../../../core/types";

export const NotificationApi = {
  getNotifications: async (): Promise<Notification[]> => {
    const res = await api.get<{ success: boolean; data: Notification[] }>(`/notifications?t=${Date.now()}`);
    return res.data ?? [];
  },

  markAsRead: async (id: number): Promise<void> => {
    return api.post(`/notifications/${id}/read`, {});
  },

  markAllAsRead: async (): Promise<void> => {
    return api.post("/notifications/read-all", {});
  },

  checkOverdue: async (): Promise<{ count: number }> => {
    const res = await api.get<{ success: boolean; count: number }>("/notifications/overdue");
    return { count: res.count };
  },
};
