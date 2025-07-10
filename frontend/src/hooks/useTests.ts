// src/hooks/useTests.ts
import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Test } from "@/types/test";

export const useTests = () => {
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTests = async () => {
    try {
      const response = await api.get("/tests/");
      setTests(response.data);
    } catch (error) {
      console.error("Failed to fetch tests:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTests();
  }, []);

  return { tests, loading, refetch: fetchTests };
};
