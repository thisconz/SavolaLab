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

interface EfficiencyWidgetProps {
  samples: Sample[];
}

export const EfficiencyWidget: React.FC<EfficiencyWidgetProps> = ({ samples }) => {
  const data = useMemo(() => {
    const stageData: Record<string, { sum: number; count: number }> = {};

    samples.forEach((s) => {
      const stage = s.source_stage?.toUpperCase() || "UNKNOWN";
      if (!stageData[stage]) {
        stageData[stage] = { sum: 0, count: 0 };
      }
      stageData[stage].sum += s.test_count;
      stageData[stage].count += 1;
    });

    return Object.entries(stageData)
      .map(([name, { sum, count }]) => ({
        name,
        avgTests: parseFloat((sum / count).toFixed(1)),
      }))
      .sort((a, b) => b.avgTests - a.avgTests)
      .slice(0, 6); // Keep it clean for the widget height
  }, [samples]);

  return (
    <div className="h-[240px] w-full group/chart">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          barSize={12}
        >
          {/* Subtle Grid - Vertical only to match technical readout style */}
          <CartesianGrid
            strokeDasharray="4 4"
            stroke="rgba(var(--brand-sage-rgb), 0.1)"
            horizontal={false}
          />

          <XAxis
            type="number"
            hide // Keep the HUD clean, rely on Tooltip/Labels
          />

          <YAxis
            type="category"
            dataKey="name"
            tick={{ 
              fontSize: 8, 
              fontFamily: "var(--font-mono)", 
              fontWeight: 900,
              fill: "rgba(var(--brand-deep-rgb), 0.5)" 
            }}
            axisLine={false}
            tickLine={false}
            width={70}
          />

          <Tooltip
            cursor={{ fill: "rgba(var(--brand-primary-rgb), 0.05)" }}
            content={<CustomTooltip />}
          />

          {/* Background Bar (Shadow) for "Full Scale" feel */}
          <Bar
            dataKey="avgTests"
            fill="rgba(var(--brand-sage-rgb), 0.05)"
            radius={[0, 4, 4, 0]}
            isAnimationActive={false}
            // We use a fixed high value or background logic here if needed
          />

          {/* Active Data Bar */}
          <Bar
            dataKey="avgTests"
            radius={[0, 4, 4, 0]}
            animationDuration={1500}
            animationEasing="ease-out"
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={index === 0 ? "var(--brand-primary)" : "rgba(var(--brand-primary-rgb), 0.6)"} 
                className="hover:opacity-80 transition-opacity cursor-crosshair"
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

/* --- Terminal-Style Tooltip --- */

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-brand-deep/95 backdrop-blur-md border border-brand-primary/20 p-3 rounded-xl shadow-2xl shadow-black/20">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-1.5 h-1.5 rounded-full bg-brand-primary animate-pulse" />
          <p className="text-[8px] font-black text-brand-primary uppercase tracking-widest">
            Telemetry_Intercept
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-[10px] font-mono text-white/90 uppercase">
            STAGE: <span className="text-brand-primary">{payload[0].payload.name}</span>
          </p>
          <p className="text-[10px] font-mono text-white/50">
            AVG_LOAD: <span className="text-white font-bold">{payload[0].value} TEST_UNITS</span>
          </p>
        </div>
      </div>
    );
  }
  return null;
};