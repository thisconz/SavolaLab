import { useState } from "react";
import api from "@/lib/api";

export const useDeleteSample = () => {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const deleteSample = async (sampleId: string) => {
    setDeletingId(sampleId);
    try {
      await api.delete(`/samples/${sampleId}`);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.response?.data?.detail || "Delete failed" };
    } finally {
      setDeletingId(null);
    }
  };

  return { deleteSample, deletingId };
};
