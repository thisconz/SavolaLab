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
import clsx from "@/src/lib/clsx";

interface EfficiencyWidgetProps {
  samples: Sample[];
  loading?: boolean;
}

export const EfficiencyWidget: React.FC<EfficiencyWidgetProps> = memo(({
  samples,
  loading = false,
}) => {
  const data = useMemo(() => {
    if (!samples.length) return [];

    const stageData: Record<string, { sum: number; count: number }> = {};

    samples.forEach((s) => {
      // Normalize stage names for consistent grouping
      const stage = (s.source_stage || "UNASSIGNED").toUpperCase().trim();
      if (!stageData[stage]) {
        stageData[stage] = { sum: 0, count: 0 };
      }
      // test_count fallback to 0 if undefined
      stageData[stage].sum += s.test_count || 0;
      stageData[stage].count += 1;
    });

    return Object.entries(stageData)
      .map(([name, { sum, count }]) => ({
        name,
        avgTests: parseFloat((sum / count).toFixed(1)),
        totalTests: sum,
      }))
      .sort((a, b) => b.avgTests - a.avgTests)
      .slice(0, 6); 
  }, [samples]);

  if (loading) return <EfficiencyLoading />;
  if (data.length === 0) return <EfficiencyEmpty />;

  return (
    <div className="h-60 w-full group/chart relative">
      {/* Background HUD Decor */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] overflow-hidden">
        <div className="text-[120px] font-black absolute -bottom-10 -right-10 select-none">
          EFFICIENCY
        </div>
      </div>

      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 10, right: 40, left: 0, bottom: 10 }}
          barSize={10}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(var(--brand-sage-rgb), 0.08)"
            horizontal={false}
          />

          <XAxis type="number" hide domain={[0, 'dataMax + 2']} />

          <YAxis
            type="category"
            dataKey="name"
            tick={<CustomYAxisTick />}
            axisLine={false}
            tickLine={false}
            width={90}
          />

          <Tooltip
            cursor={{ fill: "rgba(var(--brand-primary-rgb), 0.03)" }}
            content={<CustomTooltip />}
            allowEscapeViewBox={{ x: true, y: true }}
          />

          {/* Progress Track (The ghost bar) */}
          <Bar
            dataKey={() => Math.max(...data.map(d => d.avgTests)) * 1.1}
            fill="rgba(var(--brand-sage-rgb), 0.04)"
            radius={[0, 4, 4, 0]}
            isAnimationActive={false}
            xAxisId={0}
          />

          {/* Active Efficiency Bar */}
          <Bar
            dataKey="avgTests"
            radius={[0, 4, 4, 0]}
            animationDuration={1000}
            animationEasing="ease-in-out"
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${entry.name}`}
                fill={index === 0 ? "var(--brand-primary)" : "rgba(var(--brand-primary-rgb), 0.4)"}
                className="hover:fill-brand-primary transition-colors cursor-crosshair"
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
});

/* --- Internal Visual Helpers --- */

const CustomYAxisTick = (props: any) => {
  const { x, y, payload } = props;
  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={-10}
        y={0}
        dy={4}
        textAnchor="end"
        className="fill-brand-deep/60 text-[9px] font-black font-mono tracking-tighter uppercase"
      >
        {payload.value}
      </text>
    </g>
  );
};

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const entry = payload[0].payload;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-brand-deep/95 backdrop-blur-md border border-brand-primary/20 p-3 rounded-xl shadow-2xl"
    >
      <div className="flex items-center justify-between gap-4 mb-2">
        <span className="text-[8px] font-black text-brand-primary uppercase tracking-widest">
          Node_Efficiency
        </span>
        <span className="text-[8px] font-mono text-white/30">v2.0.4</span>
      </div>
      
      <div className="space-y-1.5 border-t border-white/5 pt-2">
        <div className="flex justify-between items-baseline gap-4">
          <span className="text-[9px] font-mono text-white/50 uppercase">Stage</span>
          <span className="text-[10px] font-bold text-white uppercase">{entry.name}</span>
        </div>
        <div className="flex justify-between items-baseline gap-4">
          <span className="text-[9px] font-mono text-white/50 uppercase">Avg_Load</span>
          <span className="text-[10px] font-bold text-brand-primary">{entry.avgTests} Units</span>
        </div>
        <div className="flex justify-between items-baseline gap-4">
          <span className="text-[9px] font-mono text-white/50 uppercase">Throughput</span>
          <span className="text-[10px] font-bold text-emerald-400">{entry.totalTests} Total</span>
        </div>
      </div>
    </motion.div>
  );
};

const EfficiencyLoading = () => (
  <div className="h-60 w-full flex flex-col gap-4 py-4">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="flex items-center gap-4">
        <div className="w-16 h-2 bg-brand-sage/10 rounded animate-pulse" />
        <div className="flex-1 h-3 bg-brand-mist rounded animate-pulse" style={{ width: `${100 - i * 15}%` }} />
      </div>
    ))}
  </div>
);

const EfficiencyEmpty = () => (
  <div className="h-60 w-full flex flex-col items-center justify-center border border-dashed border-brand-sage/20 rounded-2xl">
    <p className="text-[10px] font-black text-brand-sage uppercase tracking-widest">No Efficiency Data Available</p>
  </div>
);

EfficiencyWidget.displayName = "EfficiencyWidget";