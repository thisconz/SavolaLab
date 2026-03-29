import { api } from "../../../core/http/client";

export const SettingsApi = {
  getSettings: async (table: string) => {
    const res = await api.get<{ success: boolean; data: any[] }>(
      `/settings/${table}`,
    );
    return res.data || [];
  },

  addSetting: async (table: string, data: any) => {
    const res = await api.post<{ success: boolean; data: any }>(
      `/settings/${table}`,
      data,
    );
    return res.data;
  },

  updateSetting: async (table: string, id: string | number, data: any) => {
    const res = await api.put<{ success: boolean; data: any }>(
      `/settings/${table}/${id}`,
      data,
    );
    return res.data;
  },
};
