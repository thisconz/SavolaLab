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

interface PlantOverviewWidgetProps {
  samples: Sample[];
}

export const PlantOverviewWidget: React.FC<PlantOverviewWidgetProps> = ({
  samples,
}) => {
  const data = useMemo(() => {
    const counts: Record<string, number> = {};
    samples.forEach((s) => {
      const stage = s.source_stage?.toUpperCase() || "UNKNOWN";
      counts[stage] = (counts[stage] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value); // Sort by volume for a cleaner "staircase" look
  }, [samples]);

  return (
    <div className="h-[240px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
          barSize={32}
        >
          {/* Instrumental Underlay */}
          <CartesianGrid
            strokeDasharray="2 4"
            stroke="rgba(var(--brand-sage-rgb), 0.15)"
            vertical={false}
          />
          
          <XAxis
            dataKey="name"
            tick={{ 
              fontSize: 8, 
              fontFamily: "var(--font-mono)", 
              fontWeight: 800, 
              fill: "rgba(var(--brand-deep-rgb), 0.4)" 
            }}
            axisLine={false}
            tickLine={false}
            dy={10}
          />
          
          <YAxis
            tick={{ 
              fontSize: 8, 
              fontFamily: "var(--font-mono)", 
              fill: "rgba(var(--brand-sage-rgb), 0.6)" 
            }}
            axisLine={false}
            tickLine={false}
          />

          <Tooltip
            cursor={{ fill: "rgba(var(--brand-primary-rgb), 0.05)" }}
            content={<CustomTooltip />}
          />

          <Bar 
            dataKey="value" 
            animationDuration={1200}
            radius={[4, 4, 0, 0]}
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                // Dynamic Opacity based on volume
                fill={`rgba(var(--brand-primary-rgb), ${1 - index * 0.1})`}
                className="hover:filter hover:brightness-110 transition-all cursor-crosshair"
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

/* --- Terminal-Style Tooltip (Shared UI Pattern) --- */

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-brand-deep/95 backdrop-blur-md border border-brand-primary/20 p-3 rounded-xl shadow-2xl">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-1 h-1 rounded-full bg-brand-primary animate-ping" />
          <p className="text-[8px] font-black text-brand-primary uppercase tracking-[0.3em]">
            Node_Volume_Report
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-[10px] font-mono text-white/90">
            LOC: <span className="text-brand-primary">{payload[0].payload.name}</span>
          </p>
          <p className="text-[10px] font-mono text-white/50">
            QTY: <span className="text-white font-bold">{payload[0].value} UNITS</span>
          </p>
        </div>
      </div>
    );
  }
  return null;
};