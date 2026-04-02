import { api } from "../../../core/http/client";
import { StatRequest } from "../../../core/types";

export const StatApi = {
  getStats: async (): Promise<StatRequest[]> => {
    const res = await api.get<any>("/stats");
    return res.data || [];
  },
  createStat: async (data: {
    department: string;
    reason: string;
    urgency?: string;
  }): Promise<{ id: number }> => {
    const res = await api.post<any>("/stats", data);
    return res.data;
  },
  updateStatStatus: async (id: number, status: string): Promise<void> => {
    await api.put(`/stats/${id}/status`, { status });
  },
};
