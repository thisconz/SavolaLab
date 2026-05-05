import { api } from "../../../core/http/client";
import { type StatRequest } from "../../../core/types";
export const StatApi = {
  getStats: async (): Promise<StatRequest[]> => {
    const res = await api.get<{ success: boolean; data: StatRequest[] }>("/stats");
    return res.data || [];
  },
  createStat: async (data: {
    department: string;
    reason: string;
    urgency?: string;
  }): Promise<{ id: number }> => {
    const res = await api.post<{ success: boolean; data: { id: number } }>("/stats", data);
    return res.data;
  },
  updateStatStatus: async (id: number | string, status: string): Promise<void> => {
    await api.put(`/stats/${id}/status`, { status });
  },
};
