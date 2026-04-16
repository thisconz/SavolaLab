import React, { useMemo, memo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "@/src/lib/recharts";
import { motion } from "@/src/lib/motion";
import { Sample } from "../../../core/types";

interface QCStatsWidgetProps {
  samples: Sample[];
  loading?: boolean;
}

// Optimized Zenthar Palette
const STATUS_COLORS: Record<string, string> = {
  COMPLETED: "var(--brand-primary)",
  IN_PROGRESS: "rgba(var(--brand-primary-rgb), 0.5)",
  PENDING: "rgba(var(--brand-sage-rgb), 0.25)",
  FLAGGED: "#FF4D4D",
  ERROR: "#EF4444",
  UNKNOWN: "rgba(var(--brand-sage-rgb), 0.1)",
};

export const QCStatsWidget: React.FC<QCStatsWidgetProps> = memo(({ 
  samples,
  loading = false 
}) => {
  const data = useMemo(() => {
    if (!samples.length) return [];

    const counts: Record<string, number> = {};
    samples.forEach((s) => {
      const status = (s.status || "UNKNOWN").toUpperCase().trim();
      counts[status] = (counts[status] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [samples]);

  const totalSamples = useMemo(
    () => data.reduce((acc, curr) => acc + curr.value, 0),
    [data]
  );

  if (loading) return <QCStatsLoading />;
  if (!data.length) return <QCStatsEmpty />;

  return (
    <div className="h-60 w-full relative group/pie">
      {/* 1. CENTRAL HUD READOUT */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-12">
        <motion.span 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-[8px] font-black text-brand-sage/40 uppercase tracking-[0.25em] mb-1"
        >
          Volume_Aggregate
        </motion.span>
        <span className="text-3xl font-mono font-black text-white tracking-tighter leading-none">
          {totalSamples}
        </span>
        <div className="w-8 h-0.5 bg-brand-primary/20 mt-2 rounded-full overflow-hidden">
          <motion.div 
            animate={{ x: [-20, 20] }} 
            transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
            className="w-1/2 h-full bg-brand-primary" 
          />
        </div>
      </div>

      {/* 2. PIE CHART */}
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="42%" 
            innerRadius={68}
            outerRadius={85}
            stroke="none"
            paddingAngle={3}
            dataKey="value"
            animationDuration={1400}
            animationEasing="ease-out"
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${entry.name}`}
                fill={STATUS_COLORS[entry.name] || STATUS_COLORS.UNKNOWN}
                className="hover:brightness-110 transition-all cursor-crosshair outline-none"
              />
            ))}
          </Pie>

          <Tooltip content={<CustomPieTooltip />} />

          <Legend
            verticalAlign="bottom"
            align="center"
            iconType="circle"
            iconSize={6}
            wrapperStyle={{ paddingBottom: "10px" }}
            formatter={(value: string) => (
              <span className="text-[9px] font-black font-mono uppercase tracking-tighter text-brand-sage/80 hover:text-brand-primary transition-colors cursor-default px-1">
                {value.replace(/_/g, " ")}
              </span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
});

/* --- Visual Sub-Components --- */

const CustomPieTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const { name, value } = payload[0];
  const color = STATUS_COLORS[name] || STATUS_COLORS.UNKNOWN;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-(--color-zenthar-void)/95 backdrop-blur-xl border border-white/10 p-3 rounded-xl shadow-2xl"
    >
      <div className="flex items-center gap-3 mb-2 border-b border-white/5 pb-2">
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
        <p className="text-[8px] font-black text-white/40 uppercase tracking-widest">
          Sensor_Data_Output
        </p>
      </div>
      <div className="flex justify-between items-baseline gap-6">
        <span className="text-[10px] font-mono text-white/90 uppercase">{name}</span>
        <span className="text-[11px] font-bold text-brand-primary">{value} UNITS</span>
      </div>
    </motion.div>
  );
};

const QCStatsLoading = () => (
  <div className="h-60 w-full flex items-center justify-center">
    <div className="w-32 h-32 rounded-full border-4 border-(--color-zenthar-graphite) border-t-brand-primary animate-spin" />
  </div>
);

const QCStatsEmpty = () => (
  <div className="h-60 w-full flex flex-col items-center justify-center border border-dashed border-brand-sage/20 rounded-2xl bg-(--color-zenthar-graphite)/50">
    <p className="text-[10px] font-black text-brand-sage uppercase tracking-widest">Data Stream Empty</p>
  </div>
);

QCStatsWidget.displayName = "QCStatsWidget";