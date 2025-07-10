import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Sample } from "@/types/sample";

export const useSamples = () => {
  const [samples, setSamples] = useState<Sample[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSamples = async () => {
    setLoading(true);
    try {
      const res = await api.get("/samples/");
      setSamples(res.data);
    } catch (err) {
      console.error("Failed to fetch samples", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSamples();
  }, []);

  return { samples, loading, refetch: fetchSamples };
};
