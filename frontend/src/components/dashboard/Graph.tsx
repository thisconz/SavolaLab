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

interface Props {
  data: AvgTestResultChartData[];
}

export default function SamplesTestsLineGraph({ data }: Props) {
  // Group data by sample_type
  const grouped = data.reduce((acc: any, curr) => {
    if (!acc[curr.sample_type]) acc[curr.sample_type] = [];
    acc[curr.sample_type].push({
      parameter: curr.parameter,
      avg: curr.avg_test_result,
    });
    return acc;
  }, {});

  return (
    <div className="space-y-8">
      {Object.keys(grouped).map((sampleType) => (
        <div key={sampleType} className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            {formatSampleType(sampleType)} – Avg Results by Parameter
          </h2>

          <div className="w-full h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={grouped[sampleType]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="parameter" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="avg"
                  stroke="#0ea5e9"
                  strokeWidth={3}
                  dot={{ r: 4, fill: "#0ea5e9" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      ))}
    </div>
  );
}
