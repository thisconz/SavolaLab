import { useState } from "react";
import api from "@/lib/api";

export const useDeleteTests = () => {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const deleteTest = async (batch_number: string) => {
    setDeletingId(batch_number);
    try {
      await api.delete(`/tests/${batch_number}`);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.response?.data?.detail || "Delete failed" };
    } finally {
      setDeletingId(null);
    }
  };

  return { deleteTest, deletingId };
};