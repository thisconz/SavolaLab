import React, { useMemo } from "react";
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
import { TestResult } from "../../../core/types";

interface QCTrendsWidgetProps {
  tests: TestResult[];
}

export const QCTrendsWidget: React.FC<QCTrendsWidgetProps> = ({ tests }) => {
  const data = useMemo(() => {
    const dailyData: Record<string, { sum: number; count: number }> = {};

    tests.forEach((t) => {
      if (!t.performed_at || t.calculated_value == null) return;
      // Using a shorter date format for technical density
      const date = new Date(t.performed_at).toLocaleDateString(undefined, { 
        month: 'numeric', 
        day: 'numeric' 
      });
      
      if (!dailyData[date]) {
        dailyData[date] = { sum: 0, count: 0 };
      }
      dailyData[date].sum += t.calculated_value;
      dailyData[date].count += 1;
    });

    return Object.entries(dailyData)
      .map(([date, { sum, count }]) => ({
        date,
        avg: parseFloat((sum / count).toFixed(2)),
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-10); // Expanded to 10 points for better visual flow
  }, [tests]);

  return (
    <div className="h-[240px] w-full group/chart relative">
      {/* 1. Technical Backdrop Definition */}
      <svg style={{ height: 0, width: 0, position: 'absolute' }}>
        <defs>
          <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--brand-primary)" stopOpacity={0.3} />
            <stop offset="95%" stopColor="var(--brand-primary)" stopOpacity={0} />
          </linearGradient>
        </defs>
      </svg>

      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 20, right: 10, left: -25, bottom: 0 }}
        >
          <CartesianGrid
            strokeDasharray="1 8"
            stroke="rgba(var(--brand-sage-rgb), 0.2)"
            vertical={true} // Vertical lines help time-series tracking
          />
          
          <XAxis
            dataKey="date"
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
              fill: "rgba(var(--brand-sage-rgb), 0.5)" 
            }}
            axisLine={false}
            tickLine={false}
          />

          <Tooltip content={<TrendTooltip />} />

          <Legend
            verticalAlign="top"
            align="right"
            iconType="diamond"
            iconSize={8}
            wrapperStyle={{ top: -10, right: 10 }}
            formatter={(value) => (
              <span className="text-[8px] font-black font-mono uppercase tracking-[0.2em] text-brand-primary">
                {value} // SIG_STRENGTH
              </span>
            )}
          />

          {/* Using Area instead of Line for the "Instrument Glow" look */}
          <Area
            type="monotone"
            dataKey="avg"
            name="Quality_Index"
            stroke="var(--brand-primary)"
            strokeWidth={2.5}
            fillOpacity={1}
            fill="url(#lineGradient)"
            dot={{ 
              r: 3, 
              fill: "var(--brand-deep)", 
              stroke: "var(--brand-primary)", 
              strokeWidth: 2 
            }}
            activeDot={{ 
              r: 5, 
              fill: "var(--brand-primary)", 
              className: "animate-pulse" 
            }}
            animationDuration={2000}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

/* --- Signal Intercept Tooltip --- */

const TrendTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-brand-deep/95 backdrop-blur-md border border-brand-primary/30 p-3 rounded-xl shadow-2xl">
        <div className="flex items-center justify-between gap-8 mb-2">
          <p className="text-[8px] font-black text-brand-primary uppercase tracking-widest">
            Trend_Capture
          </p>
          <p className="text-[8px] font-mono text-white/30 italic">
            {payload[0].payload.date}
          </p>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-xl font-mono font-black text-white">
            {payload[0].value}
          </span>
          <span className="text-[8px] font-mono text-brand-primary/60 uppercase">
            Units/ML
          </span>
        </div>
      </div>
    );
  }
  return null;
};