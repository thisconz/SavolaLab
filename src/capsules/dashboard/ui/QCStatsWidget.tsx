import React, { useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { Sample } from "../../../core/types";

interface QCStatsWidgetProps {
  samples: Sample[];
}

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#6b7280"];

export const QCStatsWidget: React.FC<QCStatsWidgetProps> = ({ samples }) => {
  const data = useMemo(() => {
    const counts: Record<string, number> = {};
    samples.forEach((s) => {
      counts[s.status] = (counts[s.status] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [samples]);

  return (
    <div className="h-240px w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
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
            verticalAlign="bottom"
            align="center"
            iconType="circle"
            formatter={(value) => (
              <span className="text-[10px] font-mono uppercase tracking-tighter text-brand-sage">
                {value}
              </span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};
