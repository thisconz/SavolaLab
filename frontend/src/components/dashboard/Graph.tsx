"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

type ChartData = {
  name: string;
  samples: number;
  tests: number;
};

export default function SamplesTestsGraph({ data }: { data: ChartData[] }) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Samples & Test Results by Type</h2>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={data}
          margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Legend />
          <Bar dataKey="samples" fill="#10b981" name="Samples" />
          <Bar dataKey="tests" fill="#076d4bff" name="Tests" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
