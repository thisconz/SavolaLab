"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { DashboardData } from "@/types/dashboard";
import { ChartBarIcon, BeakerIcon } from "@heroicons/react/24/outline";

export default function SamplesTestsCountAndAverage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.get("/dashboard/");
        setData(res.data);
      } catch (err) {
        setError("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) return <p className="text-gray-500 text-center">Loading counts...</p>;
  if (error) return <p className="text-red-600 text-center">{error}</p>;
  if (!data) return null;

  return (
    <div className="grid grid-cols-2 gap-6">
      {/* Samples Card */}
      <div className="bg-green-50 rounded-lg p-5 flex items-center space-x-4 shadow hover:shadow-lg transition-shadow">
        <ChartBarIcon className="h-10 w-10 text-green-600" />
        <div>
          <p className="text-sm font-medium text-green-800">Total Samples</p>
          <p className="text-3xl font-bold text-green-900">{data.total_samples}</p>
        </div>
      </div>

      {/* Tests Card */}
      <div className="bg-blue-50 rounded-lg p-5 flex items-center space-x-4 shadow hover:shadow-lg transition-shadow">
        <BeakerIcon className="h-10 w-10 text-blue-600" />
        <div>
          <p className="text-sm font-medium text-blue-800">Total Tests</p>
          <p className="text-3xl font-bold text-blue-900">{data.total_tests}</p>
        </div>
      </div>
    </div>
  );
}
