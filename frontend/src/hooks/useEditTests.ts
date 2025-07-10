import { useState } from "react";
import api from "@/lib/api";
import { Test } from "@/types/test";

export const useEditTests = () => {
  const [editingId, setEditingId] = useState<string | null>(null);

  const editTest = async (batch_number: string, data: Partial<Test>) => {
    setEditingId(batch_number);
    try {
      await api.put(`/tests/${batch_number}`, data);
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

  return { editTest, editingId };
};