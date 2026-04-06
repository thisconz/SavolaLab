import { api } from "../../../core/http/client";

/**
 * Valid registry tables within the Zenthar system.
 */
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

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export const SettingsApi = {
  /**
   * Retrieves all records from a specific configuration table.
   * @param table - The target registry table.
   */
  getSettings: async <T = any>(table: RegistryTable): Promise<T[]> => {
    const res = await api.get<ApiResponse<T[]>>(`/settings/${table}`);
    return res.data ?? [];
  },

  /**
   * Provisions a new entry into the specified registry.
   * @param table - Target table name.
   * @param payload - The data object to persist.
   */
  addSetting: async <T = any>(table: RegistryTable, payload: T): Promise<T> => {
    const res = await api.post<ApiResponse<T>>(`/settings/${table}`, payload);
    return res.data;
  },

  /**
   * Updates an existing registry entry.
   * Handles varying primary keys (ID, employee_number, or key).
   * @param table - Target table name.
   * @param id - The unique identifier for the record.
   * @param payload - Updated data fields.
   */
  updateSetting: async <T = any>(
    table: RegistryTable, 
    id: string | number, 
    payload: Partial<T>
  ): Promise<T> => {
    const res = await api.put<ApiResponse<T>>(
      `/settings/${table}/${id}`, 
      payload
    );
    return res.data;
  },

  /**
   * Optional: Delete a registry entry.
   * Highly recommended for maintaining clean laboratory configurations.
   */
  deleteSetting: async (table: RegistryTable, id: string | number): Promise<void> => {
    await api.delete(`/settings/${table}/${id}`);
  }
};