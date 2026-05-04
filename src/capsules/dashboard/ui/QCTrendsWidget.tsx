import React, { useMemo, memo } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { motion } from "framer-motion";
import { TestResult } from "../../../core/types";

interface Props {
  tests: TestResult[];
  loading?: boolean;
}

const CHART = {
  text: {
    fontSize: 9,
    fontWeight: 700,
    fill: "#94a3b8",
    fontFamily: "inherit",
  },
  grid: { stroke: "rgba(148,163,184,0.08)", strokeDasharray: "4 4" },
  tooltip: {
    contentStyle: {
      backgroundColor: "var(--color-zenthar-carbon)",
      borderRadius: "14px",
      border: "1px solid rgba(148,163,184,0.15)",
      padding: "10px 14px",
    },
    labelStyle: {
      fontSize: "9px",
      fontWeight: 900,
      textTransform: "uppercase" as const,
      color: "#94a3b8",
    },
  },
};

export const QCTrendsWidget: React.FC<Props> = memo(({ tests, loading = false }) => {
  const data = useMemo(() => {
    if (!tests?.length) return [];
    const daily: Record<string, { sum: number; count: number }> = {};
    tests.forEach((t) => {
      if (!t.performed_at || t.calculated_value == null) return;
      const date = new Date(t.performed_at).toLocaleDateString(undefined, {
        month: "numeric",
        day: "numeric",
      });
      if (!daily[date]) daily[date] = { sum: 0, count: 0 };
      daily[date].sum += t.calculated_value;
      daily[date].count += 1;
    });
    return Object.entries(daily)
      .map(([date, { sum, count }]) => ({
        date,
        avg: parseFloat((sum / count).toFixed(2)),
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-10);
  }, [tests]);

  if (loading) return <TrendLoading />;
  if (!data.length) return <TrendEmpty />;

  return (
    <div className="h-60 w-full">
      <svg style={{ height: 0, width: 0, position: "absolute" }}>
        <defs>
          <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-brand-primary)" stopOpacity={0.25} />
            <stop offset="95%" stopColor="var(--color-brand-primary)" stopOpacity={0} />
          </linearGradient>
        </defs>
      </svg>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 20, right: 8, left: -24, bottom: 0 }}>
          <CartesianGrid {...CHART.grid} vertical={false} />
          <XAxis dataKey="date" {...CHART.text} axisLine={false} tickLine={false} dy={10} />
          <YAxis {...CHART.text} axisLine={false} tickLine={false} />
          <Tooltip {...CHART.tooltip} />
          <Legend
            verticalAlign="top"
            align="right"
            wrapperStyle={{
              fontSize: 9,
              fontWeight: 800,
              textTransform: "uppercase",
              paddingBottom: 12,
            }}
          />
          <Area
            type="monotone"
            dataKey="avg"
            name="Quality Index"
            stroke="var(--color-brand-primary)"
            strokeWidth={2.5}
            fill="url(#trendGrad)"
            dot={{
              r: 3,
              fill: "var(--color-zenthar-carbon)",
              stroke: "var(--color-brand-primary)",
              strokeWidth: 2,
            }}
            activeDot={{
              r: 5,
              strokeWidth: 0,
              fill: "var(--color-brand-primary)",
            }}
            animationDuration={1600}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
});

const TrendLoading = () => (
  <div className="flex h-60 w-full animate-pulse items-center justify-center rounded-2xl bg-(--color-zenthar-graphite)/50">
    <div className="bg-brand-primary/10 h-0.5 w-1/2 overflow-hidden rounded-full">
      <motion.div
        animate={{ x: ["-100%", "100%"] }}
        transition={{ repeat: Infinity, duration: 1.5 }}
        className="bg-brand-primary/30 h-full w-1/3"
      />
    </div>
  </div>
);

const TrendEmpty = () => (
  <div className="border-brand-sage/20 flex h-60 w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed">
    <span className="text-brand-sage/40 text-[9px] font-black tracking-[0.3em] uppercase">
      Waiting for data...
    </span>
  </div>
);

QCTrendsWidget.displayName = "QCTrendsWidget";
