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

interface PriorityWidgetProps {
  samples: Sample[];
}

const PRIORITY_COLORS: Record<string, string> = {
  NORMAL: "#10b981",
  HIGH: "#f59e0b",
  STAT: "#ef4444",
};

export const PriorityWidget: React.FC<PriorityWidgetProps> = ({ samples }) => {
  const data = useMemo(() => {
    const counts: Record<string, number> = {
      NORMAL: 0,
      HIGH: 0,
      STAT: 0,
    };
    samples.forEach((s) => {
      if (counts[s.priority] !== undefined) {
        counts[s.priority] += 1;
      }
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [samples]);

  return (
    <div className="h-240px w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 5, right: 20, left: -20, bottom: 5 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#e2e8f0"
            vertical={false}
          />
          <XAxis
            dataKey="name"
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
          <Bar dataKey="value" name="Samples" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={PRIORITY_COLORS[entry.name] || "#6b7280"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
