"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { DashboardData } from "@/types/dashboard";
import { ChartBarIcon, BeakerIcon } from "@heroicons/react/24/outline";
import { motion } from "framer-motion";

export default function SamplesTestsCountAndAverage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = async () => {
    try {
      setError(null);
      setLoading(true);
      const res = await api.get("/dashboard/");
      setData(res.data);
    } catch (err) {
      setError("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) return <SkeletonCards />;
  if (error)
    return (
      <div className="text-center space-y-3">
        <p className="text-red-600">{error}</p>
        <button
          onClick={fetchDashboard}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Retry
        </button>
      </div>
    );
  if (!data) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <DashboardCard
        icon={<ChartBarIcon className="h-10 w-10 text-green-600" />}
        title="Total Samples"
        value={data.total_samples}
        bg="bg-green-50"
        text="text-green-800"
      />
      <DashboardCard
        icon={<BeakerIcon className="h-10 w-10 text-blue-600" />}
        title="Total Tests"
        value={data.total_tests}
        bg="bg-blue-50"
        text="text-blue-800"
      />
    </div>
  );
}

function DashboardCard({
  icon,
  title,
  value,
  bg,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  value: number;
  bg: string;
  text: string;
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
      className={`${bg} rounded-lg p-5 flex items-center space-x-4 shadow transition`}
    >
      {icon}
      <div>
        <p className={`text-sm font-medium ${text}`}>{title}</p>
        <p className="text-3xl font-bold text-gray-900">{value}</p>
      </div>
    </motion.div>
  );
}

function SkeletonCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {[...Array(2)].map((_, i) => (
        <div
          key={i}
          className="animate-pulse bg-gray-100 rounded-lg p-5 h-[100px]"
        />
      ))}
    </div>
  );
}
