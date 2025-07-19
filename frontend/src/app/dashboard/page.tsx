"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import SamplesTestsCountAndAverage from "@/components/dashboard/CountAndAvg";
import { useChartData } from "@/hooks/Dahboard/useDashboardAvg";
import SamplesTestsLineGraph from "@/components/dashboard/Graph";

export default function DashboardPage() {

  const { data, loading, error } = useChartData();

  if (error) return <p className="text-red-600 text-center">Failed to load chart data</p>;
  if (loading) return <p className="text-center text-gray-500">Loading dashboard...</p>;
  if (!data) return <p className="text-center text-gray-500">No data available</p>;

  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Count Cards */}
        <SamplesTestsCountAndAverage />

        {/* Graph for Average Test Results by Parameter */}
        <SamplesTestsLineGraph data={data} />
      </div>
    </ProtectedRoute>
  );
}
