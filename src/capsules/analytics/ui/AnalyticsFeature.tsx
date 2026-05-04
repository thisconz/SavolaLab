import React, { memo, useEffect, useState, useMemo, useCallback, useRef } from "react";
import {
  BarChart3,
  TrendingUp,
  Activity,
  RefreshCw,
  CheckCircle2,
  XCircle,
  ChevronUp,
  ChevronDown,
  Download,
  Calendar,
  AlertTriangle,
  Info,
} from "lucide-react";
import { LabPanel } from "../../../shared/components/LabPanel";
import { api } from "../../../core/http/client";
import { useRealtime } from "../../../core/providers/RealtimeProvider";
import clsx from "clsx";
import { useSpecLimits } from "../hooks/useSpecLimits";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
  PieChart,
  Pie,
  ReferenceLine,
} from "recharts";
import { ChartSkeleton } from "../../../shared/components/Skeletons";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface QualityPoint {
  time: string;
  brix: number | null;
  purity: number | null;
  color: number | null;
}
interface VolumePoint {
  day: string;
  volume: number;
  target: number;
}
interface CpkResult {
  brixCpk: number;
  purityCpk: number;
  colorCpk: number;
  brixPpk?: number;
  purityPpk?: number;
  colorPpk?: number;
}
interface PassRate {
  test_type: string;
  pass_rate: number;
  total_tested: number;
  approved: number;
}
interface StatusBreakdown {
  status: string;
  count: number;
}

// ─────────────────────────────────────────────
// Spec limits — UCL/LCL for reference lines
// ─────────────────────────────────────────────

type TimeWindow = "24h" | "7d" | "30d";
const TIME_LABELS: Record<TimeWindow, string> = {
  "24h": "24 h",
  "7d": "7 days",
  "30d": "30 days",
};

const STATUS_COLORS: Record<string, string> = {
  COMPLETED: "#10b981",
  APPROVED: "#0ea5e9",
  PENDING: "#94a3b8",
  TESTING: "#f59e0b",
  VALIDATING: "#a78bfa",
  ARCHIVED: "#64748b",
};

// ─────────────────────────────────────────────
// Shared chart theme
// ─────────────────────────────────────────────

const CHART = {
  text: {
    fontSize: 10,
    fontWeight: 700,
    fill: "#94a3b8",
    fontFamily: "inherit",
  },
  grid: { stroke: "rgba(148,163,184,0.1)", strokeDasharray: "4 4" },
  tooltip: {
    contentStyle: {
      backgroundColor: "var(--color-zenthar-carbon)",
      borderRadius: "16px",
      border: "1px solid rgba(148,163,184,0.15)",
      boxShadow: "0 20px 25px -5px rgba(0,0,0,0.4)",
      padding: "10px 14px",
      backdropFilter: "blur(12px)",
    },
    labelStyle: {
      fontSize: "9px",
      fontWeight: 900,
      textTransform: "uppercase" as const,
      letterSpacing: "0.12em",
      color: "#94a3b8",
      marginBottom: "6px",
    },
  },
} as const;

// ─────────────────────────────────────────────
// Western Electric Rule 1 violation detector
// (point beyond ±3σ of the dataset mean)
// ─────────────────────────────────────────────

function detectViolations(data: number[], mean: number, stddev: number): boolean[] {
  if (stddev <= 0) return data.map(() => false);
  const ucl = mean + 3 * stddev;
  const lcl = mean - 3 * stddev;
  return data.map((v) => v > ucl || v < lcl);
}

function statsOf(values: (number | null)[]): { mean: number; stddev: number } {
  const valid = values.filter((v): v is number => v != null);
  if (!valid.length) return { mean: 0, stddev: 0 };
  const mean = valid.reduce((s, v) => s + v, 0) / valid.length;
  const variance = valid.reduce((s, v) => s + (v - mean) ** 2, 0) / valid.length;
  return { mean, stddev: Math.sqrt(variance) };
}

// ─────────────────────────────────────────────
// Custom SPC dot — red if violation
// ─────────────────────────────────────────────

const SPCDot = (violations: boolean[]) => (props: any) => {
  const { cx, cy, index } = props;
  if (violations[index]) {
    return (
      <g>
        <circle cx={cx} cy={cy} r={6} fill="rgba(248,113,113,0.2)" stroke="#f87171" strokeWidth={1.5} />
        <circle cx={cx} cy={cy} r={3} fill="#f87171" />
      </g>
    );
  }
  return (
    <circle
      cx={cx}
      cy={cy}
      r={3}
      fill="var(--color-brand-primary)"
      stroke="var(--color-zenthar-carbon)"
      strokeWidth={2}
    />
  );
};

// ─────────────────────────────────────────────
// Cpk Gauge
// ─────────────────────────────────────────────

const CpkGauge: React.FC<{
  label: string;
  cpk: number;
  ppk?: number;
  target?: number;
}> = ({ label, cpk, ppk, target = 1.33 }) => {
  const pct = Math.min(100, Math.max(0, (cpk / 2) * 100));
  const ok = cpk >= target;
  return (
    <div className="group flex flex-col items-center gap-2">
      <div className="relative h-24 w-24">
        <svg viewBox="0 0 40 40" className="h-full w-full -rotate-90">
          <circle
            cx="20"
            cy="20"
            r="16"
            fill="none"
            strokeWidth="4"
            className="text-brand-sage/10 stroke-current"
          />
          <circle
            cx="20"
            cy="20"
            r="16"
            fill="none"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={`${pct} 100`}
            style={{
              stroke: ok ? "#10b981" : "#f59e0b",
              transition: "stroke-dasharray 0.8s ease",
            }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className={clsx(
              "font-mono text-base leading-none font-black",
              ok ? "text-emerald-400" : "text-amber-400",
            )}
          >
            {cpk.toFixed(2)}
          </span>
          {ppk != null && (
            <span className="text-brand-sage/50 mt-0.5 font-mono text-[9px]">Pp {ppk.toFixed(2)}</span>
          )}
        </div>
      </div>
      <div className="text-center">
        <p className="text-brand-sage text-[10px] font-black tracking-widest uppercase">{label}</p>
        <div
          className={clsx(
            "mt-1 flex items-center justify-center gap-1 text-[9px]",
            ok ? "text-emerald-400" : "text-amber-400",
          )}
        >
          {ok ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
          <span>Target {target}</span>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// Empty state
// ─────────────────────────────────────────────

const EmptyChart: React.FC<{ message: string; hint?: string }> = ({ message, hint }) => (
  <div className="flex h-full flex-col items-center justify-center gap-3 opacity-50">
    <Activity className="text-brand-sage/30 h-8 w-8" />
    <p className="text-brand-sage text-center text-[10px] font-black tracking-widest uppercase">{message}</p>
    {hint && <p className="text-brand-sage/50 max-w-xs text-center font-mono text-[9px]">{hint}</p>}
  </div>
);

// ─────────────────────────────────────────────
// Main Feature
// ─────────────────────────────────────────────

export const AnalyticsFeature: React.FC = memo(() => {
  const [quality, setQuality] = useState<QualityPoint[]>([]);
  const [volume, setVolume] = useState<VolumePoint[]>([]);
  const [capability, setCapability] = useState<CpkResult>({
    brixCpk: 0,
    purityCpk: 0,
    colorCpk: 0,
  });
  const [passRates, setPassRates] = useState<PassRate[]>([]);
  const [breakdown, setBreakdown] = useState<StatusBreakdown[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeWindow, setTimeWindow] = useState<TimeWindow>("24h");
  const [lastFetch, setLastFetch] = useState<Date | null>(null);
  const [showSpec, setShowSpec] = useState(true);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { on } = useRealtime();

  const { limits: SPEC_LIMITS } = useSpecLimits();

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [qRes, vRes, cRes, prRes, bkRes] = await Promise.allSettled([
        api.get<any>("/analytics/quality"),
        api.get<any>("/analytics/volume"),
        api.get<any>("/analytics/capability"),
        api.get<any>("/analytics/pass-rates"),
        api.get<any>("/analytics/status"),
      ]);
      if (qRes.status === "fulfilled") setQuality(qRes.value?.data ?? []);
      if (vRes.status === "fulfilled") setVolume(vRes.value?.data ?? []);
      if (cRes.status === "fulfilled")
        setCapability(cRes.value?.data ?? { brixCpk: 0, purityCpk: 0, colorCpk: 0 });
      if (prRes.status === "fulfilled") setPassRates(prRes.value?.data ?? []);
      if (bkRes.status === "fulfilled") setBreakdown(bkRes.value?.data ?? []);
      setLastFetch(new Date());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll, timeWindow]);

  // Auto-refresh on test reviewed
  useEffect(() => {
    const unsub = on("TEST_REVIEWED", () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(fetchAll, 1500);
    });
    return () => {
      unsub();
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [on, fetchAll]);

  // ── Compute violations for SPC chart ───────────────────────────────────
  const spcViolations = useMemo(() => {
    const brixValues = quality.map((q) => q.brix);
    const { mean, stddev } = statsOf(brixValues);
    return detectViolations(brixValues as number[], mean, stddev);
  }, [quality]);

  const avgPassRate = useMemo(() => {
    if (!passRates.length) return null;
    return (passRates.reduce((s, r) => s + (r.pass_rate ?? 0), 0) / passRates.length).toFixed(1);
  }, [passRates]);

  // ── CSV export ─────────────────────────────────────────────────────────
  const exportCSV = useCallback(
    (type: "quality" | "passrates") => {
      const rows =
        type === "quality"
          ? [
              ["Time", "Brix", "Purity", "Colour"],
              ...quality.map((q) => [q.time, q.brix ?? "", q.purity ?? "", q.color ?? ""]),
            ]
          : [
              ["Test Type", "Pass Rate %", "Total Tested", "Approved"],
              ...passRates.map((p) => [p.test_type, p.pass_rate, p.total_tested, p.approved]),
            ];
      const csv = rows.map((r) => r.join(",")).join("\n");
      const a = Object.assign(document.createElement("a"), {
        href: URL.createObjectURL(new Blob([csv], { type: "text/csv" })),
        download: `zenthar-${type}-${new Date().toISOString().split("T")[0]}.csv`,
      });
      a.click();
    },
    [quality, passRates],
  );

  return (
    <div className="flex h-full flex-col gap-2 overflow-hidden rounded-[2.5rem] bg-(--color-zenthar-graphite)/30 p-4">
      {/* Header */}
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 px-2">
        <div>
          <h2 className="font-display flex items-center gap-2 text-xl font-bold text-(--color-zenthar-text-primary)">
            <BarChart3 className="text-brand-primary h-5 w-5" /> Analytics
          </h2>
          {lastFetch && (
            <p className="text-brand-sage/50 mt-0.5 font-mono text-[9px] tracking-widest uppercase">
              Last synced: {lastFetch.toLocaleTimeString()}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          {/* Time window selector */}
          <div className="border-brand-sage/10 flex gap-1 rounded-xl border bg-(--color-zenthar-carbon) p-1">
            {(["24h", "7d", "30d"] as TimeWindow[]).map((w) => (
              <button
                key={w}
                onClick={() => setTimeWindow(w)}
                className={clsx(
                  "rounded-lg px-3 py-1.5 text-[9px] font-black tracking-wider uppercase transition-all",
                  timeWindow === w
                    ? "bg-brand-primary text-white shadow-sm"
                    : "text-brand-sage hover:text-(--color-zenthar-text-primary)",
                )}
              >
                {TIME_LABELS[w]}
              </button>
            ))}
          </div>
          {/* Spec limits toggle */}
          <button
            onClick={() => setShowSpec((v) => !v)}
            className={clsx(
              "flex items-center gap-1.5 rounded-xl border px-3 py-2 text-[9px] font-black tracking-widest uppercase transition-all",
              showSpec
                ? "bg-brand-primary/10 border-brand-primary/30 text-brand-primary"
                : "border-brand-sage/10 text-brand-sage bg-(--color-zenthar-graphite)",
            )}
          >
            <Info size={12} /> Spec Limits
          </button>
          <button
            onClick={fetchAll}
            className="border-brand-sage/20 group rounded-xl border bg-(--color-zenthar-graphite) p-2 transition-all hover:bg-(--color-zenthar-graphite)/80"
          >
            <RefreshCw
              className={clsx(
                "text-brand-sage group-hover:text-brand-primary h-4 w-4",
                loading && "animate-spin",
              )}
            />
          </button>
        </div>
      </div>

      <div className="custom-scrollbar flex-1 space-y-6 overflow-y-auto pr-1">
        {/* ── SPC Chart ── */}
        <LabPanel
          title="Statistical Process Control (SPC)"
          icon={TrendingUp}
          loading={loading}
          skeleton={<ChartSkeleton height="h-72" />}
          actions={
            quality.length > 0 && (
              <button
                onClick={() => exportCSV("quality")}
                className="border-brand-sage/10 text-brand-sage hover:text-brand-primary flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[9px] font-bold transition-colors"
              >
                <Download size={11} /> CSV
              </button>
            )
          }
        >
          <div className="h-72 w-full pt-4">
            {quality.length === 0 ? (
              <EmptyChart
                message="Awaiting verified lab results"
                hint="Minimum 1 approved or completed test required"
              />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={quality} margin={{ top: 8, right: 16, left: -8, bottom: 16 }}>
                  <defs>
                    <linearGradient id="gBrix" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid {...CHART.grid} vertical={false} />
                  <XAxis dataKey="time" {...CHART.text} axisLine={false} tickLine={false} dy={12} />
                  <YAxis yAxisId="left" {...CHART.text} axisLine={false} tickLine={false} dx={-8} />
                  <YAxis
                    yAxisId="right"
                    {...CHART.text}
                    axisLine={false}
                    tickLine={false}
                    dx={8}
                    orientation="right"
                  />
                  <Tooltip {...CHART.tooltip} />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    wrapperStyle={{
                      fontSize: 10,
                      fontWeight: 800,
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                      paddingBottom: 16,
                    }}
                  />

                  {/* Spec limit reference lines */}
                  {showSpec && SPEC_LIMITS.Brix && (
                    <>
                      <ReferenceLine
                        yAxisId="left"
                        y={SPEC_LIMITS.Brix.usl}
                        stroke="rgba(248,113,113,0.4)"
                        strokeDasharray="6 3"
                        label={{
                          value: "UCL",
                          position: "right",
                          fontSize: 9,
                          fill: "rgba(248,113,113,0.6)",
                        }}
                      />
                      <ReferenceLine
                        yAxisId="left"
                        y={SPEC_LIMITS.Brix.lsl}
                        stroke="rgba(248,113,113,0.4)"
                        strokeDasharray="6 3"
                        label={{
                          value: "LCL",
                          position: "right",
                          fontSize: 9,
                          fill: "rgba(248,113,113,0.6)",
                        }}
                      />
                    </>
                  )}

                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="brix"
                    name="Brix %"
                    stroke="#0ea5e9"
                    strokeWidth={2.5}
                    fill="url(#gBrix)"
                    dot={SPCDot(spcViolations)}
                    activeDot={{ r: 5, strokeWidth: 0 }}
                    connectNulls
                  />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="purity"
                    name="Purity %"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    dot={false}
                    connectNulls
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="color"
                    name="Colour"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                    connectNulls
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
          {/* Violation legend */}
          {spcViolations.some(Boolean) && (
            <div className="flex items-center gap-2 px-6 pb-4">
              <div className="flex h-3 w-3 items-center justify-center rounded-full border border-red-500 bg-red-500/20">
                <div className="h-1.5 w-1.5 rounded-full bg-red-500" />
              </div>
              <span className="text-[9px] font-bold tracking-widest text-red-400 uppercase">
                {spcViolations.filter(Boolean).length} Western Electric Rule 1 violation
                {spcViolations.filter(Boolean).length !== 1 ? "s" : ""} (point beyond ±3σ)
              </span>
            </div>
          )}
        </LabPanel>

        {/* ── Volume + Capability ── */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <LabPanel
              title="Daily Sample Volume vs Target"
              icon={BarChart3}
              loading={loading}
              skeleton={<ChartSkeleton height="h-64" />}
            >
              <div className="h-64 w-full pt-4">
                {volume.length === 0 ? (
                  <EmptyChart
                    message="No volume data"
                    hint={`No samples registered in last ${TIME_LABELS[timeWindow]}`}
                  />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={volume} margin={{ top: 8, right: 8, left: -16, bottom: 16 }} barSize={28}>
                      <CartesianGrid {...CHART.grid} vertical={false} />
                      <XAxis dataKey="day" {...CHART.text} axisLine={false} tickLine={false} dy={12} />
                      <YAxis {...CHART.text} axisLine={false} tickLine={false} dx={-4} />
                      <Tooltip {...CHART.tooltip} cursor={{ fill: "rgba(148,163,184,0.05)", radius: 8 }} />
                      <Legend
                        verticalAlign="top"
                        align="right"
                        wrapperStyle={{
                          fontSize: 10,
                          fontWeight: 800,
                          textTransform: "uppercase",
                          letterSpacing: "0.1em",
                          paddingBottom: 16,
                        }}
                      />
                      <Bar dataKey="volume" name="Actual" fill="#0ea5e9" radius={[8, 8, 0, 0]} />
                      <Bar
                        dataKey="target"
                        name="Target"
                        fill="rgba(148,163,184,0.12)"
                        radius={[8, 8, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </LabPanel>
          </div>

          <div className="lg:col-span-5">
            <LabPanel
              title="Process Capability (Cpk / Ppk)"
              icon={Activity}
              loading={loading}
              skeleton={<ChartSkeleton height="h-64" />}
            >
              <div className="flex h-64 items-center justify-around px-4 py-6">
                <CpkGauge label="Brix" cpk={capability.brixCpk} ppk={capability.brixPpk} />
                <div className="bg-brand-sage/10 h-20 w-px" />
                <CpkGauge label="Purity" cpk={capability.purityCpk} ppk={capability.purityPpk} />
                <div className="bg-brand-sage/10 h-20 w-px" />
                <CpkGauge label="Colour" cpk={capability.colorCpk} ppk={capability.colorPpk} />
              </div>
            </LabPanel>
          </div>
        </div>

        {/* ── Status breakdown + Pass rates ── */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <LabPanel
              title="Sample Status (period)"
              icon={Activity}
              loading={loading}
              skeleton={<ChartSkeleton height="h-64" />}
            >
              <div className="relative h-64">
                {breakdown.length === 0 ? (
                  <EmptyChart message="No sample data" />
                ) : (
                  <>
                    <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center">
                      <span className="font-mono text-2xl font-black text-(--color-zenthar-text-primary)">
                        {breakdown.reduce((s, r) => s + r.count, 0)}
                      </span>
                      <span className="text-brand-sage/50 text-[8px] font-black tracking-widest uppercase">
                        total
                      </span>
                    </div>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={breakdown}
                          cx="50%"
                          cy="50%"
                          innerRadius={64}
                          outerRadius={88}
                          paddingAngle={3}
                          dataKey="count"
                          nameKey="status"
                          stroke="none"
                          animationDuration={1200}
                        >
                          {breakdown.map((entry) => (
                            <Cell key={entry.status} fill={STATUS_COLORS[entry.status] ?? "#64748b"} />
                          ))}
                        </Pie>
                        <Tooltip
                          {...CHART.tooltip}
                          formatter={(v: number, name: string) => [`${v} samples`, name]}
                        />
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
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </>
                )}
              </div>
            </LabPanel>
          </div>

          <div className="lg:col-span-7">
            <LabPanel
              title="Test Pass Rates"
              icon={CheckCircle2}
              loading={loading}
              skeleton={<ChartSkeleton height="h-64" />}
              actions={
                passRates.length > 0 && (
                  <button
                    onClick={() => exportCSV("passrates")}
                    className="border-brand-sage/10 text-brand-sage hover:text-brand-primary flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[9px] font-bold transition-colors"
                  >
                    <Download size={11} /> CSV
                  </button>
                )
              }
            >
              <div className="flex h-64 flex-col">
                {passRates.length === 0 ? (
                  <EmptyChart
                    message="No reviewed tests"
                    hint="Tests must be approved or disapproved to appear here"
                  />
                ) : (
                  <>
                    {avgPassRate && (
                      <div className="mb-3 flex shrink-0 items-center justify-between border-b border-(--color-zenthar-steel)/40 px-1 pb-3">
                        <span className="text-brand-sage text-[9px] font-black tracking-widest uppercase">
                          Average pass rate
                        </span>
                        <div className="flex items-center gap-2">
                          {Number(avgPassRate) >= 95 ? (
                            <CheckCircle2 size={12} className="text-emerald-400" />
                          ) : Number(avgPassRate) >= 80 ? (
                            <AlertTriangle size={12} className="text-amber-400" />
                          ) : (
                            <XCircle size={12} className="text-red-400" />
                          )}
                          <span
                            className={clsx(
                              "font-mono text-xl font-black",
                              Number(avgPassRate) >= 95
                                ? "text-emerald-400"
                                : Number(avgPassRate) >= 80
                                  ? "text-amber-400"
                                  : "text-red-400",
                            )}
                          >
                            {avgPassRate}%
                          </span>
                        </div>
                      </div>
                    )}
                    <div className="custom-scrollbar flex-1 space-y-2.5 overflow-y-auto pr-1">
                      {passRates.map((r) => (
                        <div key={r.test_type} className="group flex items-center gap-3">
                          <span className="w-24 shrink-0 text-[10px] font-black text-(--color-zenthar-text-primary) uppercase">
                            {r.test_type}
                          </span>
                          <div className="h-2 flex-1 overflow-hidden rounded-full bg-(--color-zenthar-steel)">
                            <div
                              className={clsx(
                                "h-full rounded-full transition-all duration-700",
                                r.pass_rate >= 95
                                  ? "bg-emerald-500"
                                  : r.pass_rate >= 80
                                    ? "bg-amber-400"
                                    : "bg-red-400",
                              )}
                              style={{ width: `${r.pass_rate}%` }}
                            />
                          </div>
                          <span
                            className={clsx(
                              "w-12 shrink-0 text-right font-mono text-[10px] font-black",
                              r.pass_rate >= 95
                                ? "text-emerald-400"
                                : r.pass_rate >= 80
                                  ? "text-amber-400"
                                  : "text-red-400",
                            )}
                          >
                            {r.pass_rate?.toFixed(1)}%
                          </span>
                          <span className="text-brand-sage/40 w-14 shrink-0 text-right font-mono text-[9px]">
                            {r.approved}/{r.total_tested}
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </LabPanel>
          </div>
        </div>
      </div>
    </div>
  );
});

AnalyticsFeature.displayName = "AnalyticsFeature";
export default AnalyticsFeature;
