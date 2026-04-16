import React, { useMemo, memo } from "react";
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
import { motion } from "@/src/lib/motion";
import { Sample } from "../../../core/types";

interface PlantOverviewWidgetProps {
  samples: Sample[];
  loading?: boolean;
}

export const PlantOverviewWidget: React.FC<PlantOverviewWidgetProps> = memo(({
  samples,
  loading = false,
}) => {
  const data = useMemo(() => {
    if (!samples.length) return [];

    const counts: Record<string, number> = {};
    samples.forEach((s) => {
      const stage = (s.source_stage || "UNASSIGNED").toUpperCase().trim();
      counts[stage] = (counts[stage] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8); // Limit to top 8 stages for visual clarity
  }, [samples]);

  const maxVal = useMemo(() => Math.max(...data.map(d => d.value), 0), [data]);

  if (loading) return <PlantLoadingState />;
  if (!data.length) return <PlantEmptyState />;

  return (
    <div className="h-60 w-full group/chart">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 20, right: 10, left: -20, bottom: 0 }}
          barSize={32}
        >
          <CartesianGrid
            strokeDasharray="2 4"
            stroke="rgba(var(--brand-sage-rgb), 0.1)"
            vertical={false}
          />

          <XAxis
            dataKey="name"
            tick={<CustomXAxisTick />}
            axisLine={false}
            tickLine={false}
            dy={10}
          />

          <YAxis
            tick={{
              fontSize: 9,
              fontFamily: "var(--font-mono)",
              fontWeight: 600,
              fill: "rgba(var(--brand-sage-rgb), 0.5)",
            }}
            axisLine={false}
            tickLine={false}
            domain={[0, maxVal + 5]}
          />

          <Tooltip
            cursor={{ fill: "rgba(var(--brand-primary-rgb), 0.03)" }}
            content={<CustomTooltip />}
          />

          <Bar 
            dataKey="value" 
            animationDuration={1500} 
            animationEasing="ease-out"
            radius={[6, 6, 0, 0]}
          >
            {data.map((entry, index) => {
              // Calculate opacity based on volume (staircase ramp)
              const opacity = 1 - (index * 0.08);
              return (
                <Cell
                  key={`cell-${entry.name}`}
                  fill={`rgba(var(--brand-primary-rgb), ${opacity})`}
                  className="hover:brightness-125 transition-all cursor-crosshair"
                />
              );
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
});

/* --- Sub-Components & Styles --- */

const CustomXAxisTick = (props: any) => {
  const { x, y, payload } = props;
  return (
    <text
      x={x}
      y={y}
      textAnchor="middle"
      className="fill-white/40 text-[8px] font-black font-mono uppercase tracking-tighter"
    >
      {payload.value.length > 10 ? `${payload.value.substring(0, 8)}..` : payload.value}
    </text>
  );
};

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const { name, value } = payload[0].payload;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-(--color-zenthar-void)/95 backdrop-blur-md border border-brand-primary/20 p-3 rounded-xl shadow-2xl"
    >
      <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/5">
        <div className="w-1 h-1 rounded-full bg-brand-primary animate-ping" />
        <p className="text-[8px] font-black text-brand-primary uppercase tracking-[0.2em]">
          Stage_Metrics_V4
        </p>
      </div>
      <div className="space-y-1">
        <div className="flex justify-between gap-4">
          <span className="text-[9px] font-mono text-white/40 uppercase">Location</span>
          <span className="text-[10px] font-bold text-white uppercase">{name}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-[9px] font-mono text-white/40 uppercase">Volume</span>
          <span className="text-[10px] font-bold text-brand-primary">{value} Samples</span>
        </div>
      </div>
    </motion.div>
  );
};

const PlantLoadingState = () => (
  <div className="h-60 w-full flex items-end justify-around pb-6 px-4">
    {[...Array(6)].map((_, i) => (
      <div 
        key={i} 
        className="w-8 bg-(--color-zenthar-graphite) rounded-t-lg animate-pulse" 
        style={{ height: `${20 + i * 12}%`, opacity: 1 - i * 0.1 }}
      />
    ))}
  </div>
);

const PlantEmptyState = () => (
  <div className="h-60 w-full flex flex-col items-center justify-center bg-(--color-zenthar-graphite)/50 rounded-2xl border border-dashed border-brand-sage/20">
    <div className="p-3 bg-(--color-zenthar-graphite) rounded-full shadow-sm mb-2 opacity-50">
      <BarChart className="w-5 h-5 text-brand-sage" />
    </div>
    <p className="text-[10px] font-black text-brand-sage uppercase tracking-widest text-center">
      No Active Throughput Data
    </p>
  </div>
);

PlantOverviewWidget.displayName = "PlantOverviewWidget";