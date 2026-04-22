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

interface Props {
  samples: Sample[];
  loading?: boolean;
}

const TOOLTIP_STYLE = {
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
};

const CustomXTick = (props: any) => {
  const { x, y, payload } = props;
  const label =
    payload.value.length > 8 ? `${payload.value.slice(0, 7)}..` : payload.value;
  return (
    <text
      x={x}
      y={y + 14}
      textAnchor="middle"
      fontSize={8}
      fontWeight={900}
      fontFamily="inherit"
      fill="rgba(148,163,184,0.45)"
      style={{ textTransform: "uppercase" }}
    >
      {label}
    </text>
  );
};

export const PlantOverviewWidget: React.FC<Props> = memo(
  ({ samples, loading = false }) => {
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
        .slice(0, 8);
    }, [samples]);

    if (loading) return <PlantLoading />;
    if (!data.length) return <PlantEmpty />;

    const maxVal = Math.max(...data.map((d) => d.value), 0);

    return (
      <div className="h-60 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 16, right: 8, left: -22, bottom: 0 }}
            barSize={32}
          >
            <CartesianGrid
              strokeDasharray="2 4"
              stroke="rgba(148,163,184,0.08)"
              vertical={false}
            />
            <XAxis
              dataKey="name"
              tick={<CustomXTick />}
              axisLine={false}
              tickLine={false}
              dy={8}
            />
            <YAxis
              tick={{
                fontSize: 8,
                fontFamily: "inherit",
                fontWeight: 600,
                fill: "rgba(148,163,184,0.45)",
              }}
              axisLine={false}
              tickLine={false}
              domain={[0, maxVal + 2]}
            />
            <Tooltip
              {...TOOLTIP_STYLE}
              cursor={{ fill: "rgba(148,163,184,0.03)" }}
            />
            <Bar
              dataKey="value"
              radius={[6, 6, 0, 0]}
              animationDuration={1400}
              animationEasing="ease-out"
            >
              {data.map((_, i) => (
                <Cell key={i} fill={`rgba(14,165,233,${1 - i * 0.09})`} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  },
);

const PlantLoading = () => (
  <div className="h-60 w-full flex items-end justify-around pb-6 px-4 gap-2">
    {[...Array(7)].map((_, i) => (
      <div
        key={i}
        className="flex-1 bg-(--color-zenthar-graphite) rounded-t-lg animate-pulse"
        style={{ height: `${20 + i * 11}%`, opacity: 0.4 + i * 0.08 }}
      />
    ))}
  </div>
);

const PlantEmpty = () => (
  <div className="h-60 w-full flex flex-col items-center justify-center bg-(--color-zenthar-graphite)/50 rounded-2xl border border-dashed border-brand-sage/20">
    <p className="text-[10px] font-black text-brand-sage uppercase tracking-widest">
      No throughput data
    </p>
  </div>
);

PlantOverviewWidget.displayName = "PlantOverviewWidget";
