import { api } from "../../../core/http/client";

/**
 * Registry sections available in the Zenthar Archive.
 */
export type ArchiveSection = 
  | "samples" 
  | "tests" 
  | "certificates" 
  | "instruments"
  | "audit"

interface ArchiveResponse<T> {
  success: boolean;
  data: T;
  meta?: {
    total_records: number;
    pages: number;
  };
}

export const ArchiveApi = {
  /**
   * Search through archived records with dynamic filters.
   * Standardizes the query string construction for complex laboratory filters.
   * * @param section - The archive category (e.g., 'samples').
   * @param filters - Key-value pairs for filtering (dates, batch numbers, analysts).
   */
  search: async <T = any>(
    section: ArchiveSection, 
    filters: Record<string, any>
  ): Promise<T[]> => {
    // Clean up empty filters to keep the URL concise
    const cleanFilters = Object.fromEntries(
      Object.entries(filters).filter(([_, v]) => v != null && v !== "")
    );

    const queryParams = new URLSearchParams(cleanFilters as any);
    
    const res = await api.get<ArchiveResponse<T[]>>(
      `/archive/${section}?${queryParams.toString()}`
    );

    return res.data || [];
  },

  /**
   * Retrieves a single historical record by its archive ID.
   * Useful for "View Details" modals in the Archive UI.
   */
  getRecordById: async <T = any>(
    section: ArchiveSection, 
    id: string | number
  ): Promise<T | null> => {
    const res = await api.get<ArchiveResponse<T>>(`/archive/${section}/${id}`);
    return res.data || null;
  },

  /**
   * Generates a download URL for archived reports (PDF/CSV).
   */
  getExportUrl: (section: ArchiveSection, filters: Record<string, any>) => {
    const queryParams = new URLSearchParams(filters as any);
    return `${import.meta.env.VITE_API_URL ?? ""}/archive/${section}/export?${queryParams.toString()}`;
  }
};
