import { useState } from "react";
import api from "@/lib/api";
import { Sample } from "@/types/sample";

export const useEditSample = () => {
  const [editingId, setEditingId] = useState<string | null>(null);

  const editSample = async (batch_number: string, data: Partial<Sample>) => {
    setEditingId(batch_number);
    try {
      await api.put(`/samples/${batch_number}`, data);
      return { success: true };
    } catch (err: any) {
      return {
        success: false,
        error: err.response?.data?.detail || "Edit failed",
      };
    } finally {
      setEditingId(null);
    }
  };

  return { editSample, editingId };
};
