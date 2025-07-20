"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import SamplesTestsCountAndAverage from "@/components/dashboard/CountAndAvg";
import { useChartData } from "@/hooks/Dahboard/useDashboardAvg";
import SamplesTestsLineGraph from "@/components/dashboard/Graph";
import { motion } from "framer-motion";

export default function DashboardPage() {
  const { data, loading, error } = useChartData();

  if (error)
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-red-600 font-semibold text-lg">
          Failed to load chart data. Please try again later.
        </p>
      </div>
    );

  if (loading)
    return (
      <div className="container mx-auto px-4 py-8 space-y-8 animate-pulse">
        <div className="h-32 bg-gray-200 rounded-xl"></div>
        <div className="h-96 bg-gray-200 rounded-xl"></div>
      </div>
    );

  if (!data)
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-gray-500 text-lg">No data available for display.</p>
      </div>
    );

  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-8 space-y-10">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center space-y-2"
        >
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
          <p className="text-gray-500 text-sm">
            Insights and trends from QC test results and samples.
          </p>
        </motion.div>

        {/* Count Cards */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
        >
          <SamplesTestsCountAndAverage />
        </motion.div>

        {/* Line Graph */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="bg-white p-6 rounded-xl shadow-lg"
        >
          <SamplesTestsLineGraph data={data} />
        </motion.div>
      </div>
    </ProtectedRoute>
  );
}
