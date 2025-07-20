import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import { AvgTestResultChartData } from "@/types/dashboard";

export const useChartData = () => {
  const [data, setData] = useState<AvgTestResultChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchChart = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<{ averages_by_sample_type: AvgTestResultChartData[] }>("/dashboard/averages");
      setData(res.data.averages_by_sample_type);
    } catch (err) {
      console.error("Failed to load average test results:", err);
      setError("Failed to load average test results.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChart();
  }, [fetchChart]);

  return { data, loading, error, refetch: fetchChart };
};
