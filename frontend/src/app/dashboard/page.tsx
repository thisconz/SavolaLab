"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import SamplesTestsCount from "@/components/dashboard/SamplesTestsCount";
import SamplesTestsGraph from "@/components/dashboard/Graph";
import { useChartData } from "@/hooks/useDashboard";

export default function DashboardPage() {
  const { data, loading, error } = useChartData();

  if (error) {
    console.error("Error fetching chart data:", error);
    return <p className="text-red-600">Failed to load chart data</p>;
  }
  if (loading) {
    return <p>Loading chart...</p>;
  }
  if (!data) {
    return <p>No data available</p>;
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
