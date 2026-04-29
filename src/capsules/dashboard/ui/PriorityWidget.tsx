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

const PRIORITY_CONFIG = {
  NORMAL: { color: "rgba(148,163,184,0.4)", label: "Normal" },
  HIGH: { color: "var(--color-brand-primary)", label: "High" },
  STAT: { color: "#ef4444", label: "Stat" },
} as const;

const TOOLTIP_STYLE = {
  contentStyle: {
    backgroundColor: "var(--color-zenthar-carbon)",
    borderRadius: "14px",
    border: "1px solid rgba(148,163,184,0.15)",
    padding: "10px 14px",
  },
};

const CustomTick = (props: any) => {
  const { x, y, payload } = props;
  const config = PRIORITY_CONFIG[payload.value as keyof typeof PRIORITY_CONFIG] ?? {
    color: "#94a3b8",
    label: payload.value,
  };
  return (
    <text
      x={x}
      y={y + 14}
      textAnchor="middle"
      fontSize={9}
      fontWeight={900}
      fontFamily="inherit"
      fill={config.color}
      style={{ textTransform: "uppercase" }}
    >
      {config.label}
    </text>
  );
};

export const PriorityWidget: React.FC<Props> = memo(({ samples, loading = false }) => {
  const data = useMemo(() => {
    const counts: Record<string, number> = { NORMAL: 0, HIGH: 0, STAT: 0 };
    samples.forEach((s) => {
      const p = (s.priority?.toUpperCase() || "NORMAL") as keyof typeof counts;
      if (p in counts) counts[p]++;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [samples]);

  if (loading) return <PriorityLoading />;

  return (
    <div className="h-60 w-full relative">
      {/* Decorative corner dots */}
      <div className="absolute top-2 right-2 flex gap-1 opacity-20">
        {[1, 2, 3].map((i) => (
          <div key={i} className="w-1 h-1 bg-brand-primary rounded-[1px]" />
        ))}
      </div>

      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 28, right: 8, left: -28, bottom: 0 }} barSize={48}>
          <CartesianGrid strokeDasharray="1 6" stroke="rgba(148,163,184,0.1)" vertical={false} />
          <XAxis dataKey="name" tick={<CustomTick />} axisLine={false} tickLine={false} />
          <YAxis
            tick={{
              fontSize: 8,
              fontFamily: "inherit",
              fontWeight: 600,
              fill: "rgba(148,163,184,0.5)",
            }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            {...TOOLTIP_STYLE}
            cursor={{ fill: "rgba(148,163,184,0.03)" }}
            formatter={(v: number, name: string) => [
              v,
              PRIORITY_CONFIG[name as keyof typeof PRIORITY_CONFIG]?.label ?? name,
            ]}
          />
          <Bar dataKey="value" radius={[6, 6, 0, 0]} animationDuration={1200}>
            {data.map((entry) => (
              <Cell
                key={entry.name}
                fill={
                  PRIORITY_CONFIG[entry.name as keyof typeof PRIORITY_CONFIG]?.color ?? "#64748b"
                }
                style={
                  entry.name === "STAT"
                    ? { filter: "drop-shadow(0 0 8px rgba(239,68,68,0.4))" }
                    : undefined
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
});

const PriorityLoading = () => (
  <div className="h-60 w-full flex items-end justify-center gap-8 pb-10">
    {[30, 60, 45].map((h, i) => (
      <div
        key={i}
        className="w-12 bg-(--color-zenthar-graphite) rounded-t animate-pulse"
        style={{ height: `${h}%`, opacity: 0.3 + i * 0.2 }}
      />
    ))}
  </div>
);

PriorityWidget.displayName = "PriorityWidget";
