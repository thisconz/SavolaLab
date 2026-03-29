import { api } from "../../../core/http/client";

export const ArchiveApi = {
  search: async (section: string, filters: any) => {
    const queryParams = new URLSearchParams(filters);
    const res = await api.get<{ success: boolean; data: any[] }>(
      `/archive/${section}?${queryParams.toString()}`,
    );
    return res.data || [];
  },
};
