import React, { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Sample } from "../../../core/types";

interface EfficiencyWidgetProps {
  samples: Sample[];
}

export const EfficiencyWidget: React.FC<EfficiencyWidgetProps> = ({
  samples,
}) => {
  const data = useMemo(() => {
    // Group by source_stage and calculate average test_count as a proxy for efficiency
    const stageData: Record<string, { sum: number; count: number }> = {};

    samples.forEach((s) => {
      const stage = s.source_stage || "Unknown";
      if (!stageData[stage]) {
        stageData[stage] = { sum: 0, count: 0 };
      }
      stageData[stage].sum += s.test_count;
      stageData[stage].count += 1;
    });

    return Object.entries(stageData)
      .map(([name, { sum, count }]) => ({
        name,
        avgTests: parseFloat((sum / count).toFixed(1)),
      }))
      .sort((a, b) => b.avgTests - a.avgTests);
  }, [samples]);

  return (
    <div className="h-240px w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#e2e8f0"
            horizontal={false}
          />
          <XAxis
            type="number"
            tick={{ fontSize: 9, fontFamily: "monospace", fill: "#94a3b8" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fontSize: 9, fontFamily: "monospace", fill: "#94a3b8" }}
            axisLine={false}
            tickLine={false}
            width={80}
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
          <Bar
            dataKey="avgTests"
            name="Avg Tests/Sample"
            fill="#3b82f6"
            radius={[0, 4, 4, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
