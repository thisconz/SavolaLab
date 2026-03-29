import React, { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { TestResult } from "../../../core/types";

interface QCTrendsWidgetProps {
  tests: TestResult[];
}

export const QCTrendsWidget: React.FC<QCTrendsWidgetProps> = ({ tests }) => {
  const data = useMemo(() => {
    // Group by date and calculate daily average
    const dailyData: Record<string, { sum: number; count: number }> = {};

    tests.forEach((t) => {
      if (!t.performed_at || t.calculated_value == null) return;
      const date = new Date(t.performed_at).toLocaleDateString();
      if (!dailyData[date]) {
        dailyData[date] = { sum: 0, count: 0 };
      }
      dailyData[date].sum += t.calculated_value;
      dailyData[date].count += 1;
    });

    return Object.entries(dailyData)
      .map(([date, { sum, count }]) => ({
        date,
        avg: parseFloat((sum / count).toFixed(2)),
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-7); // Last 7 days
  }, [tests]);

  return (
    <div className="h-240px w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 5, right: 20, left: -20, bottom: 5 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#e2e8f0"
            vertical={false}
          />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 9, fontFamily: "monospace", fill: "#94a3b8" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 9, fontFamily: "monospace", fill: "#94a3b8" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
              fontSize: "10px",
              fontFamily: "monospace",
            }}
          />
          <Legend
            verticalAlign="top"
            align="right"
            iconType="circle"
            formatter={(value) => (
              <span className="text-[10px] font-mono uppercase tracking-tighter text-brand-sage">
                {value}
              </span>
            )}
          />
          <Line
            type="monotone"
            dataKey="avg"
            name="Avg Quality"
            stroke="#10b981"
            strokeWidth={2}
            dot={{ r: 3, fill: "#10b981" }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
