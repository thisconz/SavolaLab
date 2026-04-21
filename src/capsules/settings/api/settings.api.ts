import { api } from "../../../core/http/client";

export type RegistryTable =
  | "sample_types"
  | "test_methods"
  | "instruments"
  | "clients"
  | "employees"
  | "production_lines"
  | "notification_rules"
  | "inventory"
  | "system_preferences";

interface ApiResponse<T> { success: boolean; data: T; message?: string; }

export const SettingsApi = {
  getSettings: async <T = any>(table: RegistryTable): Promise<T[]> => {
    const res = await api.get<ApiResponse<T[]>>(`/settings/${table}`);
    return res.data ?? [];
  },

  addSetting: async <T = any>(table: RegistryTable, payload: T): Promise<T> => {
    const res = await api.post<ApiResponse<T>>(`/settings/${table}`, payload);
    return res.data;
  },

  updateSetting: async <T = any>(table: RegistryTable, id: string | number, payload: Partial<T>): Promise<T> => {
    const res = await api.put<ApiResponse<T>>(`/settings/${table}/${id}`, payload);
    return res.data;
  },

  /**
   * Delete a registry entry by primary key.
   * Note: the server must have a DELETE route for the given table.
   * Currently only "deletable" tables (sample_types, clients, inventory) expose this.
   */
  deleteSetting: async (table: RegistryTable, id: string | number): Promise<void> => {
    await api.delete(`/settings/${table}/${id}`);
  },
};