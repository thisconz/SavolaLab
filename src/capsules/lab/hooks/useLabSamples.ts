import { useState, useEffect, useCallback } from "react";
import { LabApi } from "../api/lab.api";
import { Sample } from "../../../core/types";

/**
 * Hook: useLabSamples
 * Manages the state and operations for lab samples within the lab capsule.
 */
export function useLabSamples() {
  const [samples, setSamples] = useState<Sample[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSamples = useCallback(async (signal?: AbortSignal) => {
    try {
      setLoading(true);
      const data = await LabApi.getSamples();
      if (!signal?.aborted) {
        setSamples(data);
        setError(null);
      }
    } catch (err: any) {
      if (!signal?.aborted) {
        console.error("Error fetching samples:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch samples");
      }
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchSamples(controller.signal);
    return () => controller.abort();
  }, [fetchSamples]);

  const refresh = () => fetchSamples();

  return { samples, loading, error, refresh: fetchSamples };
}
