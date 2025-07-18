// src/hooks/useTestsByBatch.ts
import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Test } from "@/types/test";

export const useTestsByBatch = (batch_number: string) => {
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTests = async () => {
    try {
      const response = await api.get(`/tests/sample/${batch_number}`);
      setTests(response.data);
    } catch (error) {
      console.error("Failed to fetch tests for batch:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (batch_number) {
      fetchTests();
    }
  }, [batch_number]);

  return { tests, loading, refetch: fetchTests };
};
