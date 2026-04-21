import { api } from "../../../core/http/client";
export const AuditApi = {
  log: async (action: string, details: string): Promise<void> => {
    return api.post("/audit-logs", { action, details });
  },
};