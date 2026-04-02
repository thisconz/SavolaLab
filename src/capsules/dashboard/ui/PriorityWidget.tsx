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
} from "@/src/lib/recharts";
import { Sample } from "../../../core/types";

interface PriorityWidgetProps {
  samples: Sample[];
}

// Semantic tokens mapped to Labrix OS palette
const PRIORITY_MAP: Record<string, { color: string; label: string }> = {
  NORMAL: { color: "rgba(var(--brand-sage-rgb), 0.4)", label: "LVL_01" },
  HIGH: { color: "var(--brand-primary)", label: "LVL_02" },
  STAT: { color: "#FF4D4D", label: "CRITICAL" }, // Direct highlight for emergency
};

export const PriorityWidget: React.FC<PriorityWidgetProps> = ({ samples }) => {
  const data = useMemo(() => {
    const counts: Record<string, number> = { NORMAL: 0, HIGH: 0, STAT: 0 };
    samples.forEach((s) => {
      const p = s.priority?.toUpperCase();
      if (counts[p] !== undefined) counts[p] += 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [samples]);

  return (
    <div className="h-[240px] w-full relative">
      {/* Decorative Scanner Overlay */}
      <div className="absolute inset-0 pointer-events-none border-l border-brand-primary/5 z-0" />

      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 20, right: 10, left: -25, bottom: 0 }}
          barSize={40}
        >
          <CartesianGrid
            strokeDasharray="1 6"
            stroke="rgba(var(--brand-sage-rgb), 0.2)"
            vertical={false}
          />

          <XAxis
            dataKey="name"
            tick={({ x, y, payload }) => (
              <g transform={`translate(${x},${y})`}>
                <text
                  x={0}
                  y={0}
                  dy={16}
                  textAnchor="middle"
                  className="fill-brand-deep/40 text-[8px] font-black font-mono tracking-tighter"
                >
                  {PRIORITY_MAP[payload.value]?.label || payload.value}
                </text>
              </g>
            )}
            axisLine={false}
            tickLine={false}
          />

          <YAxis
            tick={{
              fontSize: 8,
              fontFamily: "var(--font-mono)",
              fill: "rgba(var(--brand-sage-rgb), 0.5)",
            }}
            axisLine={false}
            tickLine={false}
          />

          <Tooltip
            cursor={{ fill: "rgba(var(--brand-primary-rgb), 0.03)" }}
            content={<PriorityTooltip />}
          />

          <Bar dataKey="value" animationDuration={1000}>
            {data.map((entry, index) => {
              const isStat = entry.name === "STAT";
              return (
                <Cell
                  key={`cell-${index}`}
                  fill={PRIORITY_MAP[entry.name]?.color || "#6b7280"}
                  // STAT bars get a subtle drop-shadow "glow" in CSS
                  style={{
                    filter: isStat
                      ? "drop-shadow(0 0 8px rgba(255, 77, 77, 0.4))"
                      : "none",
                  }}
                  className="hover:brightness-110 transition-all cursor-help"
                />
              );
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

/* --- Custom Priority Tooltip --- */

const PriorityTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const name = payload[0].payload.name;
    const isStat = name === "STAT";

    return (
      <div className="bg-brand-deep border border-white/10 p-3 rounded-lg shadow-xl backdrop-blur-xl">
        <div className="flex items-center gap-2 mb-1.5">
          <div
            className={`w-2 h-2 rounded-full ${isStat ? "bg-[#FF4D4D] animate-pulse" : "bg-brand-primary"}`}
          />
          <p className="text-[9px] font-black text-white/50 uppercase tracking-[0.2em]">
            Priority_Status
          </p>
        </div>
        <p
          className={`text-xs font-mono font-bold mb-1 ${isStat ? "text-[#FF4D4D]" : "text-white"}`}
        >
          {name} :: {payload[0].value} UNITS
        </p>
        <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-brand-primary/50"
            style={{ width: `${Math.min(payload[0].value, 100)}%` }}
          />
        </div>
      </div>
    );
  }
  return null;
};
