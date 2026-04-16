import React, { useMemo, memo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "@/src/lib/recharts";
import { motion } from "@/src/lib/motion";
import { TestResult } from "../../../core/types";

interface QCTrendsWidgetProps {
  tests: TestResult[];
  loading?: boolean;
}

export const QCTrendsWidget: React.FC<QCTrendsWidgetProps> = memo(({ 
  tests, 
  loading = false 
}) => {
  const data = useMemo(() => {
    if (!tests?.length) return [];
    
    const dailyData: Record<string, { sum: number; count: number }> = {};

    tests.forEach((t) => {
      if (!t.performed_at || t.calculated_value == null) return;
      
      const date = new Date(t.performed_at).toLocaleDateString(undefined, {
        month: "numeric",
        day: "numeric",
      });

      if (!dailyData[date]) dailyData[date] = { sum: 0, count: 0 };
      dailyData[date].sum += t.calculated_value;
      dailyData[date].count += 1;
    });

    return Object.entries(dailyData)
      .map(([date, { sum, count }]) => ({
        date,
        avg: parseFloat((sum / count).toFixed(2)),
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-12); // Increased to 12 points for better signal density
  }, [tests]);

  if (loading) return <TrendLoadingState />;
  if (!data.length) return <TrendEmptyState />;

  return (
    <div className="h-60 w-full group/chart relative overflow-hidden">
      {/* 1. Technical Gradient Definition */}
      <svg style={{ height: 0, width: 0, position: "absolute" }}>
        <defs>
          <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--brand-primary)" stopOpacity={0.35} />
            <stop offset="95%" stopColor="var(--brand-primary)" stopOpacity={0} />
          </linearGradient>
        </defs>
      </svg>

      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 30, right: 10, left: -25, bottom: 0 }}
        >
          <CartesianGrid
            strokeDasharray="1 8"
            stroke="rgba(var(--brand-sage-rgb), 0.15)"
            vertical={true}
          />

          <XAxis
            dataKey="date"
            tick={<CustomTrendTick />}
            axisLine={false}
            tickLine={false}
          />

          <YAxis
            tick={{
              fontSize: 8,
              fontFamily: "var(--font-mono)",
              fill: "rgba(var(--brand-sage-rgb), 0.5)",
              fontWeight: 600
            }}
            axisLine={false}
            tickLine={false}
          />

          <Tooltip content={<TrendTooltip />} cursor={<CustomCursor />} />

          <Legend
            verticalAlign="top"
            align="right"
            iconType="square"
            iconSize={6}
            wrapperStyle={{ top: -15, right: 10 }}
            formatter={(value: string) => (
              <span className="text-[8px] font-black font-mono uppercase tracking-[0.2em] text-brand-primary/80">
                {value.replace(/_/g, " ")}
              </span>
            )}
          />

          <Area
            type="monotone"
            dataKey="avg"
            name="Quality_Index"
            stroke="var(--brand-primary)"
            strokeWidth={2.5}
            fillOpacity={1}
            fill="url(#lineGradient)"
            dot={{
              r: 2,
              fill: "var(--brand-deep)",
              stroke: "var(--brand-primary)",
              strokeWidth: 2,
            }}
            activeDot={{
              r: 5,
              fill: "var(--brand-primary)",
              className: "animate-pulse shadow-glow",
            }}
            animationDuration={1800}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
});

/* --- UI Sub-Components --- */

const CustomTrendTick = (props: any) => {
  const { x, y, payload } = props;
  return (
    <text
      x={x}
      y={y + 16}
      textAnchor="middle"
      className="fill-white/40 text-[8px] font-black font-mono uppercase tracking-tighter"
    >
      {payload.value}
    </text>
  );
};

const CustomCursor = (props: any) => {
  const { points, width, height } = props;
  const { x } = points[0];
  return (
    <rect
      x={x - 1}
      y={30}
      width={2}
      height={height - 30}
      fill="rgba(var(--brand-primary-rgb), 0.1)"
    />
  );
};

const TrendTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const { date, avg } = payload[0].payload;

  return (
    <motion.div 
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-(--color-zenthar-void)/95 backdrop-blur-xl border border-brand-primary/30 p-3 rounded-xl shadow-2xl min-w-30"
    >
      <div className="flex items-center justify-between gap-4 mb-2 border-b border-white/5 pb-2">
        <p className="text-[8px] font-black text-brand-primary uppercase tracking-widest">
          Trend_Capture
        </p>
        <p className="text-[8px] font-mono text-white/30 italic">{date}</p>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-xl font-mono font-black text-white leading-none">
          {avg}
        </span>
        <span className="text-[8px] font-mono text-brand-primary/60 uppercase">
          IDX
        </span>
      </div>
    </motion.div>
  );
};

const TrendLoadingState = () => (
  <div className="h-60 w-full bg-(--color-zenthar-graphite)/50 animate-pulse rounded-2xl flex items-center justify-center">
    <div className="w-1/2 h-1 bg-brand-primary/10 rounded-full overflow-hidden">
      <motion.div 
        animate={{ x: ["-100%", "100%"] }} 
        transition={{ repeat: Infinity, duration: 1.5 }}
        className="w-1/3 h-full bg-brand-primary/40" 
      />
    </div>
  </div>
);

const TrendEmptyState = () => (
  <div className="h-60 w-full flex flex-col items-center justify-center border border-dashed border-brand-sage/20 rounded-2xl">
    <span className="text-[9px] font-black text-brand-sage/40 uppercase tracking-[0.3em]">
      Waiting for signal...
    </span>
  </div>
);

QCTrendsWidget.displayName = "QCTrendsWidget";