"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import SamplesTestsCountAndAverage from "@/components/dashboard/CountAndAvg";
import { useChartData } from "@/hooks/Dahboard/useDashboardAvg";
import SamplesTestsLineGraph from "@/components/charts/SamplesTestsLineGraph";
import { motion } from "framer-motion";

const fadeIn = (delay = 0) => ({
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, delay } },
});

export default function DashboardPage() {
  const { data, loading, error } = useChartData();

  // Error State
  if (error)
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-lg font-semibold text-red-600">
          Failed to load dashboard data. Please try again later.
        </p>
      </div>
    );

  // Loading Skeleton
  if (loading)
    return (
      <div className="container mx-auto px-6 py-12 space-y-10 animate-pulse">
        <div className="h-24 rounded-2xl bg-gray-200 shadow-sm"></div>
        <div className="h-96 rounded-2xl bg-gray-200 shadow-sm"></div>
      </div>
    );

  // No Data State
  if (!data)
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-lg text-gray-500">No dashboard data available.</p>
      </div>
    );

  return (
    <ProtectedRoute>
      <div className="container mx-auto px-6 py-10 space-y-12">
        {/* Dashboard Header */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeIn(0)}
          className="text-center"
        >
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
            Dashboard Overview
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Real-time insights and trends from QC test results and samples.
          </p>
        </motion.div>

        {/* KPI Cards */}
        <motion.section
          initial="hidden"
          animate="visible"
          variants={fadeIn(0.1)}
          className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4"
        >
          <SamplesTestsCountAndAverage />
        </motion.section>

        {/* Trends Graph */}
        <motion.section
          initial="hidden"
          animate="visible"
          variants={fadeIn(0.2)}
          className="rounded-2xl border border-gray-100 bg-white p-8 shadow-lg"
        >
          <h2 className="mb-4 text-lg font-semibold text-gray-800">
            Samples & Test Trends
          </h2>
          <SamplesTestsLineGraph data={data} />
        </motion.section>
      </div>
    </ProtectedRoute>
  );
}
