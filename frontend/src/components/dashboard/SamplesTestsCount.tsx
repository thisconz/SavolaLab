"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { DashboardData } from "@/types/dashboard";

export default function SamplesTestsCount ({ batch_number }: { batch_number: string }) {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await api.get("/dashboard/");
        setDashboardData(response.data);
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [batch_number]);

  if (loading) return <div>Loading dashboard data...</div>;

  if (!dashboardData) return null;

  return (
    <div className="bg-white shadow rounded-lg p-4">
      <h2 className="text-lg font-semibold mb-4 text-gray-800">Sample and Test Count</h2>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-green-700 text-white p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Samples</h3>
          <p className="text-2xl font-bold">{dashboardData.total_samples}</p>
        </div>
        <div className="bg-green-700 text-white p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Tests</h3>
          <p className="text-2xl font-bold">{dashboardData.total_tests}</p>
          <p className="text-sm font-bold">Avg. Test Results: {dashboardData.average_test_results}</p>
        </div>
      </div>
    </div>
  );
}