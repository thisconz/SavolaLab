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

interface PriorityWidgetProps {
  samples: Sample[];
  loading?: boolean;
}

const PRIORITY_MAP: Record<string, { color: string; label: string; glow?: string }> = {
  NORMAL: { color: "rgba(var(--brand-sage-rgb), 0.3)", label: "LVL_01" },
  HIGH: { color: "var(--brand-primary)", label: "LVL_02" },
  STAT: { 
    color: "#FF4D4D", 
    label: "CRITICAL",
    glow: "drop-shadow(0 0 12px rgba(255, 77, 77, 0.5))"
  },
};

export const PriorityWidget: React.FC<PriorityWidgetProps> = memo(({ 
  samples,
  loading = false 
}) => {
  const data = useMemo(() => {
    const counts: Record<string, number> = { NORMAL: 0, HIGH: 0, STAT: 0 };
    
    samples.forEach((s) => {
      const p = (s.priority?.toUpperCase() || "NORMAL") as keyof typeof counts;
      if (counts[p] !== undefined) counts[p] += 1;
    });

    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [samples]);

  if (loading) return <PriorityLoadingState />;

  return (
    <div className="h-60 w-full relative group/priority">
      {/* Structural Decor */}
      <div className="absolute top-2 right-2 flex gap-1 opacity-20 group-hover/priority:opacity-50 transition-opacity">
        <div className="w-1 h-1 bg-brand-primary" />
        <div className="w-1 h-1 bg-brand-primary/50" />
        <div className="w-1 h-1 bg-brand-primary/20" />
      </div>

      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 30, right: 10, left: -25, bottom: 0 }}
          barSize={44}
        >
          <CartesianGrid
            strokeDasharray="1 8"
            stroke="rgba(var(--brand-sage-rgb), 0.15)"
            vertical={false}
          />

          <XAxis
            dataKey="name"
            tick={<CustomPriorityTick />}
            axisLine={false}
            tickLine={false}
          />

          <YAxis
            tick={{
              fontSize: 8,
              fontFamily: "var(--font-mono)",
              fontWeight: 600,
              fill: "rgba(var(--brand-sage-rgb), 0.4)",
            }}
            axisLine={false}
            tickLine={false}
          />

          <Tooltip
            cursor={{ fill: "rgba(var(--brand-primary-rgb), 0.02)" }}
            content={<PriorityTooltip />}
          />

          <Bar 
            dataKey="value" 
            animationDuration={1200}
            radius={[4, 4, 0, 0]}
          >
            {data.map((entry, index) => {
              const config = PRIORITY_MAP[entry.name];
              return (
                <Cell
                  key={`cell-${entry.name}`}
                  fill={config?.color || "rgba(var(--brand-sage-rgb), 0.2)"}
                  style={{ filter: config?.glow || "none" }}
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

/* --- Sub-Components --- */

const CustomPriorityTick = (props: any) => {
  const { x, y, payload } = props;
  const config = PRIORITY_MAP[payload.value];
  const isCritical = payload.value === "STAT";

  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={0}
        y={0}
        dy={16}
        textAnchor="middle"
        className={`text-[8px] font-black font-mono tracking-widest ${
          isCritical ? "fill-[#FF4D4D]" : "fill-white/40"
        }`}
      >
        {config?.label || payload.value}
      </text>
    </g>
  );
};

const PriorityTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  
  const { name, value } = payload[0].payload;
  const isStat = name === "STAT";

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-(--color-zenthar-void)/95 backdrop-blur-xl border border-white/10 p-3 rounded-xl shadow-2xl min-w-35"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={`w-1.5 h-1.5 rounded-full ${isStat ? "bg-[#FF4D4D] animate-pulse" : "bg-brand-primary"}`} />
          <p className="text-[8px] font-black text-white/40 uppercase tracking-widest">Priority_Node</p>
        </div>
        <span className="text-[8px] font-mono text-white/20">#{(value * 7).toString(16).slice(0, 3)}</span>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-baseline">
          <span className={`text-xs font-bold font-mono ${isStat ? "text-[#FF4D4D]" : "text-white"}`}>
            {name}
          </span>
          <span className="text-xs font-black text-white">{value} <span className="text-[8px] text-white/30">QTY</span></span>
        </div>
        
        <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${Math.min((value / 50) * 100, 100)}%` }}
            className={`h-full ${isStat ? "bg-[#FF4D4D]" : "bg-brand-primary"}`} 
          />
        </div>
      </div>
    </motion.div>
  );
};

const PriorityLoadingState = () => (
  <div className="h-60 w-full flex items-end justify-center gap-8 pb-10">
    {[30, 60, 45].map((h, i) => (
      <div 
        key={i} 
        className="w-10 bg-(--color-zenthar-graphite) rounded-t animate-pulse" 
        style={{ height: `${h}%`, opacity: 0.3 + i * 0.2 }} 
      />
    ))}
  </div>
);

PriorityWidget.displayName = "PriorityWidget";