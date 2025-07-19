import { useState, useEffect } from "react";
import api from "@/lib/api";
import { AvgTestResultChartData } from "@/types/dashboard";

export const useChartData = () => {
  const [data, setData] = useState<AvgTestResultChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchChart = async () => {
      try {
        const res = await api.get("/dashboard/averages");
        setData(res.data.averages_by_type_parameter);
      } catch (err) {
        setError("Failed to load average test results.");
      } finally {
        setLoading(false);
      }
    };
    fetchChart();
  }, []);

  return { data, loading, error };
};
