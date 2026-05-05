import React, { useMemo, memo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { motion } from "framer-motion";
import { type Sample } from "../../../core/types";

interface Props {
  samples: Sample[];
  loading?: boolean;
}

const STATUS_COLORS: Record<string, string> = {
  COMPLETED: "#0ea5e9",
  APPROVED: "#10b981",
  PENDING: "#94a3b8",
  TESTING: "#f59e0b",
  VALIDATING: "#a78bfa",
  REGISTERED: "#64748b",
  ARCHIVED: "#334155",
};

const TOOLTIP_STYLE = {
  contentStyle: {
    backgroundColor: "var(--color-zenthar-carbon)",
    borderRadius: "16px",
    border: "1px solid rgba(148,163,184,0.15)",
    boxShadow: "0 20px 25px -5px rgba(0,0,0,0.4)",
    padding: "10px 14px",
  },
  labelStyle: {
    fontSize: "9px",
    fontWeight: 900,
    textTransform: "uppercase" as const,
    letterSpacing: "0.12em",
    color: "#94a3b8",
  },
};

export const QCStatsWidget: React.FC<Props> = memo(({ samples, loading = false }) => {
  const data = useMemo(() => {
    if (!samples.length) return [];
    const counts: Record<string, number> = {};
    samples.forEach((s) => {
      const k = (s.status || "UNKNOWN").toUpperCase();
      counts[k] = (counts[k] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [samples]);

  const total = useMemo(() => data.reduce((s, d) => s + d.value, 0), [data]);

  if (loading) return <SkeletonPie />;
  if (!data.length) return <EmptyState />;

  return (
    <div className="relative h-60 w-full">
      {/* Centre total */}
      <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center pb-10">
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="font-mono text-3xl font-black tracking-tighter text-(--color-zenthar-text-primary)"
        >
          {total}
        </motion.span>
        <span className="text-brand-sage/50 text-[8px] font-black tracking-widest uppercase">samples</span>
      </div>

      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="45%"
            innerRadius={58}
            outerRadius={80}
            paddingAngle={3}
            dataKey="value"
            stroke="none"
            animationDuration={1200}
          >
            {data.map((entry) => (
              <Cell
                key={entry.name}
                fill={STATUS_COLORS[entry.name] ?? "#64748b"}
                className="cursor-pointer transition-opacity hover:opacity-80"
              />
            ))}
          </Pie>
          <Tooltip {...TOOLTIP_STYLE} formatter={(v: number, name: string) => [`${v} samples`, name]} />
          <Legend
            verticalAlign="bottom"
            iconType="circle"
            iconSize={6}
            wrapperStyle={{
              fontSize: 9,
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
            }}
            formatter={(value: string) => <span className="text-brand-sage/70">{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
});

const SkeletonPie = () => (
  <div className="flex h-60 w-full items-center justify-center">
    <div className="border-t-brand-primary h-32 w-32 animate-spin rounded-full border-8 border-(--color-zenthar-steel)" />
  </div>
);

const EmptyState = () => (
  <div className="border-brand-sage/20 flex h-60 w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed bg-(--color-zenthar-graphite)/50">
    <p className="text-brand-sage text-[10px] font-black tracking-widest uppercase">No data yet</p>
  </div>
);

QCStatsWidget.displayName = "QCStatsWidget";
