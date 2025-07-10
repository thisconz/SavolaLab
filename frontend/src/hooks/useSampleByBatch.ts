// src/hooks/useSampleByBatch.ts
import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Sample } from "@/types/sample";

export const useSampleByBatch = (batch_number: string) => {
  const [sample, setSample] = useState<Sample | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSample = async () => {
    try {
      const res = await api.get(`/samples/${batch_number}`);
      setSample(res.data);
    } catch (err) {
      console.error("Failed to fetch sample:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (batch_number) {
      fetchSample();
    }
  }, [batch_number]);

  return { sample, loading, refetch: fetchSample };
};
