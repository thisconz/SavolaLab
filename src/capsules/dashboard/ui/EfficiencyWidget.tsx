import React, { useMemo, memo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { motion } from "framer-motion";
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
};

const CustomYTick = (props: any) => {
  const { x, y, payload } = props;
  const label = payload.value.length > 10 ? `${payload.value.slice(0, 8)}..` : payload.value;
  return (
    <text
      x={x - 8}
      y={y + 4}
      textAnchor="end"
      fontSize={9}
      fontWeight={700}
      fontFamily="inherit"
      fill="rgba(148,163,184,0.6)"
      style={{ textTransform: "uppercase" }}
    >
      {label}
    </text>
  );
};

export const EfficiencyWidget: React.FC<Props> = memo(({ samples, loading = false }) => {
  const data = useMemo(() => {
    if (!samples.length) return [];
    const stageData: Record<string, { sum: number; count: number }> = {};
    samples.forEach((s) => {
      const stage = (s.source_stage || "UNASSIGNED").toUpperCase().trim();
      if (!stageData[stage]) stageData[stage] = { sum: 0, count: 0 };
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
  if (!data.length) return <EfficiencyEmpty />;

  const maxVal = Math.max(...data.map((d) => d.avgTests), 1);

  return (
    <div className="h-60 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 8, right: 32, left: 0, bottom: 8 }}
          barSize={10}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.07)" horizontal={false} />
          <XAxis type="number" hide domain={[0, maxVal * 1.15]} />
          <YAxis
            type="category"
            dataKey="name"
            tick={<CustomYTick />}
            axisLine={false}
            tickLine={false}
            width={84}
          />
          <Tooltip
            {...TOOLTIP_STYLE}
            formatter={(v: number, _: string, props: any) => [
              `${v} avg tests · ${props.payload.totalTests} total`,
              props.payload.name,
            ]}
          />
          {/* Ghost track */}
          <Bar
            dataKey={() => maxVal * 1.1}
            fill="rgba(148,163,184,0.04)"
            radius={[0, 4, 4, 0]}
            isAnimationActive={false}
          />
          {/* Active bar */}
          <Bar dataKey="avgTests" radius={[0, 4, 4, 0]} animationDuration={1000}>
            {data.map((_, i) => (
              <Cell
                key={i}
                fill={i === 0 ? "var(--color-brand-primary)" : `rgba(14,165,233,${0.55 - i * 0.07})`}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
});

const EfficiencyLoading = () => (
  <div className="flex h-60 w-full flex-col gap-4 py-4">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="flex items-center gap-4">
        <div className="bg-brand-sage/10 h-2 w-16 animate-pulse rounded" />
        <div
          className="h-3 flex-1 animate-pulse rounded bg-(--color-zenthar-graphite)"
          style={{ width: `${95 - i * 12}%` }}
        />
      </div>
    ))}
  </div>
);

const EfficiencyEmpty = () => (
  <div className="border-brand-sage/20 flex h-60 w-full flex-col items-center justify-center rounded-2xl border border-dashed">
    <p className="text-brand-sage text-[10px] font-black tracking-widest uppercase">No efficiency data</p>
  </div>
);

EfficiencyWidget.displayName = "EfficiencyWidget";
