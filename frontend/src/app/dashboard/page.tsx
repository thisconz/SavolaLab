"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import SamplesTestsCount from "@/components/dashboard/SamplesTestsCount";
import SamplesTestsGraph from "@/components/dashboard/Graph";
import { useState, useEffect } from "react";
import api from "@/lib/api";

type ChartData = {
  name: string;
  samples: number;
  tests: number;
};

export default function DashboardPage() {
  const [data, setData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await api.get("/dashboard/chart-data");
        setData(response.data);
      } catch (err: any) {
        setError(err.response?.data?.detail || "Failed to fetch data");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return <div className="text-center">Loading...</div>;
  }
  if (error) {
    return <div className="text-red-500 text-center">{error}</div>;
  }
  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-4 text-gray-800">Dashboard</h1>
        {loading && <p>Loading chart...</p>}
        {error && <p className="text-red-600">{error}</p>}
        {!loading && !error && <SamplesTestsGraph data={data} />}
        <SamplesTestsCount batch_number="" />
      </div>
    </ProtectedRoute>
  );
}
