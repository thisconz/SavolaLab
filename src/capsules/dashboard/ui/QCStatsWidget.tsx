import React, { useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "@/src/lib/recharts";
import { Sample } from "../../../core/types";

interface QCStatsWidgetProps {
  samples: Sample[];
}

// Semantic Color Mapping
const STATUS_COLORS: Record<string, string> = {
  COMPLETED: "var(--brand-primary)",
  IN_PROGRESS: "rgba(var(--brand-primary-rgb), 0.5)",
  PENDING: "rgba(var(--brand-sage-rgb), 0.3)",
  FLAGGED: "#FF4D4D",
  ERROR: "#EF4444",
};

export const QCStatsWidget: React.FC<QCStatsWidgetProps> = ({ samples }) => {
  const data = useMemo(() => {
    const counts: Record<string, number> = {};
    samples.forEach((s) => {
      const status = s.status?.toUpperCase() || "UNKNOWN";
      counts[status] = (counts[status] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [samples]);

  const totalSamples = useMemo(() => 
    data.reduce((acc, curr) => acc + curr.value, 0), 
  [data]);

  return (
    <div className="h-[240px] w-full relative">
      {/* Central Statistical Readout */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
        <span className="text-[8px] font-black text-brand-sage/40 uppercase tracking-[0.2em]">Total_Units</span>
        <span className="text-2xl font-mono font-black text-brand-deep leading-none">
          {totalSamples}
        </span>
      </div>

      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="45%" // Shifted up slightly to accommodate the legend
            innerRadius={65}
            outerRadius={82}
            stroke="none"
            paddingAngle={4}
            dataKey="value"
            animationBegin={0}
            animationDuration={1800}
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={STATUS_COLORS[entry.name] || "rgba(var(--brand-sage-rgb), 0.2)"}
                className="hover:opacity-80 transition-opacity cursor-pointer outline-none"
              />
            ))}
          </Pie>

          <Tooltip content={<CustomPieTooltip />} />

          <Legend
            verticalAlign="bottom"
            align="center"
            iconType="rect"
            iconSize={8}
            wrapperStyle={{ paddingTop: '10px' }}
            formatter={(value) => (
              <span className="text-[9px] font-black font-mono uppercase tracking-tighter text-brand-sage/70 px-1">
                {value}
              </span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

/* --- Terminal-Style Tooltip for Pie --- */

const CustomPieTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const { name, value } = payload[0];
    return (
      <div className="bg-brand-deep/95 backdrop-blur-md border border-white/10 p-2.5 rounded-lg shadow-xl">
        <div className="flex items-center gap-2 mb-1">
          <div 
            className="w-1.5 h-1.5 rounded-sm" 
            style={{ backgroundColor: STATUS_COLORS[name] || '#ccc' }} 
          />
          <p className="text-[8px] font-black text-white/40 uppercase tracking-widest">
            Status_Metrics
          </p>
        </div>
        <p className="text-[10px] font-mono text-white">
          {name}: <span className="text-brand-primary font-bold">{value} UNITS</span>
        </p>
      </div>
    );
  }
  return null;
};