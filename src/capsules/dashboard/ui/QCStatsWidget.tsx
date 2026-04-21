import React, { useMemo, memo } from "react";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
} from "@/src/lib/recharts";
import { motion } from "@/src/lib/motion";
import { Sample } from "../../../core/types";

interface Props { samples: Sample[]; loading?: boolean; }

const STATUS_COLORS: Record<string, string> = {
  COMPLETED:  "#0ea5e9",
  APPROVED:   "#10b981",
  PENDING:    "#94a3b8",
  TESTING:    "#f59e0b",
  VALIDATING: "#a78bfa",
  REGISTERED: "#64748b",
  ARCHIVED:   "#334155",
};

const TOOLTIP_STYLE = {
  contentStyle: {
    backgroundColor: "var(--color-zenthar-carbon)",
    borderRadius: "16px",
    border: "1px solid rgba(148,163,184,0.15)",
    boxShadow: "0 20px 25px -5px rgba(0,0,0,0.4)",
    padding: "10px 14px",
  },
  labelStyle: { fontSize: "9px", fontWeight: 900, textTransform: "uppercase" as const, letterSpacing: "0.12em", color: "#94a3b8" },
};

export const QCStatsWidget: React.FC<Props> = memo(({ samples, loading = false }) => {
  const data = useMemo(() => {
    if (!samples.length) return [];
    const counts: Record<string, number> = {};
    samples.forEach((s) => {
      const k = (s.status || "UNKNOWN").toUpperCase();
      counts[k] = (counts[k] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [samples]);

  const total = useMemo(() => data.reduce((s, d) => s + d.value, 0), [data]);

  if (loading) return <SkeletonPie />;
  if (!data.length) return <EmptyState />;

  return (
    <div className="h-60 w-full relative">
      {/* Centre total */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-10 z-10">
        <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-3xl font-mono font-black text-(--color-zenthar-text-primary) tracking-tighter">{total}</motion.span>
        <span className="text-[8px] font-black text-brand-sage/50 uppercase tracking-widest">samples</span>
      </div>

      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} cx="50%" cy="45%" innerRadius={58} outerRadius={80} paddingAngle={3} dataKey="value" stroke="none" animationDuration={1200}>
            {data.map((entry) => (
              <Cell key={entry.name} fill={STATUS_COLORS[entry.name] ?? "#64748b"} className="hover:opacity-80 transition-opacity cursor-pointer" />
            ))}
          </Pie>
          <Tooltip {...TOOLTIP_STYLE} formatter={(v: number, name: string) => [`${v} samples`, name]} />
          <Legend verticalAlign="bottom" iconType="circle" iconSize={6}
            wrapperStyle={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em" }}
            formatter={(value: string) => <span className="text-brand-sage/70">{value}</span>} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
});

const SkeletonPie = () => (
  <div className="h-60 w-full flex items-center justify-center">
    <div className="w-32 h-32 rounded-full border-8 border-(--color-zenthar-steel) border-t-brand-primary animate-spin" />
  </div>
);

const EmptyState = () => (
  <div className="h-60 w-full flex flex-col items-center justify-center gap-2 border border-dashed border-brand-sage/20 rounded-2xl bg-(--color-zenthar-graphite)/50">
    <p className="text-[10px] font-black text-brand-sage uppercase tracking-widest">No data yet</p>
  </div>
);

QCStatsWidget.displayName = "QCStatsWidget";