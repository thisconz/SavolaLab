"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { AvgTestResultChartData } from "@/types/dashboard";
import { formatSampleType } from "@/utils/format";
import { useMemo } from "react";

interface Props {
  data: AvgTestResultChartData[];
}

interface GroupedData {
  [sampleType: string]: { parameter: string; avg: number }[];
}

const COLORS = ["#0ea5e9", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6"];

export default function SamplesTestsLineGraph({ data }: Props) {
  const grouped = useMemo<GroupedData>(() => {
    return data.reduce((acc, curr) => {
      if (!acc[curr.sample_type]) acc[curr.sample_type] = [];
      acc[curr.sample_type].push({
        parameter: curr.parameter,
        avg: curr.avg_test_result,
      });
      return acc;
    }, {} as GroupedData);
  }, [data]);

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-10 text-gray-500">
        No data available to display.
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 rounded shadow text-sm">
          <p className="font-semibold">{label}</p>
          <p className="text-blue-500">Avg: {payload[0].value}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8">
      {Object.entries(grouped).map(([sampleType, chartData], index) => (
        <div key={sampleType} className="bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            {formatSampleType(sampleType)} – Avg Results by Parameter
          </h2>
          <div className="w-full h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="parameter" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="avg"
                  stroke={COLORS[index % COLORS.length]}
                  strokeWidth={3}
                  dot={{ r: 4, fill: COLORS[index % COLORS.length] }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      ))}
    </div>
  );
}
