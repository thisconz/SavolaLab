import { useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import { Sample } from "@/types/sample";

export function useSamples(sampleType?: string) {
  const [samples, setSamples] = useState<Sample[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSamples = useCallback(async () => {
    setLoading(true);
    try {
      const endpoint = sampleType
        ? `/samples/?sample_type=${sampleType}`
        : "/samples/";
      console.log("Fetching samples from:", endpoint);

      const response = await api.get(endpoint);
      console.log("Fetched data:", response.data);

      setSamples(response.data?.data || response.data || []);
    } catch (error) {
      console.error("Error fetching samples:", error);
      setSamples([]);
    } finally {
      setLoading(false);
    }
  }, [sampleType]);

  useEffect(() => {
    fetchSamples();
  }, [fetchSamples]);

  return { samples, loading, refetch: fetchSamples };
}
