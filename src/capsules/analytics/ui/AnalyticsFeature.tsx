import React, { memo, useEffect, useState, useMemo, useCallback } from "react";
import {
  BarChart3, TrendingUp, Activity, Info,
  ChevronUp, ChevronDown, RefreshCw, CheckCircle2, XCircle,
} from "lucide-react";
import { LabPanel }           from "../../../ui/components/LabPanel";
import { api }                from "../../../core/http/client";
import { useRealtime }        from "../../../core/providers/RealtimeProvider";
import clsx                   from "@/src/lib/clsx";
import {
  LineChart, Line, BarChart, Bar,
  AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, Cell,
  PieChart, Pie,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from "@/src/lib/recharts";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface QualityPoint   { time: string; brix: number | null; purity: number | null; color: number | null; }
interface VolumePoint    { day: string;  volume: number; target: number; }
interface CpkResult      { brixCpk: number; purityCpk: number; colorCpk: number; }
interface PassRate        { test_type: string; pass_rate: number; total_tested: number; approved: number; }
interface StatusBreakdown { status: string; count: number; }

const STATUS_COLORS: Record<string, string> = {
  COMPLETED: "#10b981",
  APPROVED:  "#0ea5e9",
  PENDING:   "#94a3b8",
  TESTING:   "#f59e0b",
  VALIDATING:"#a78bfa",
  ARCHIVED:  "#64748b",
};

// ─────────────────────────────────────────────
// Shared chart theme
// ─────────────────────────────────────────────

const CHART = {
  text: { fontSize: 10, fontWeight: 700, fill: "#94a3b8", fontFamily: "inherit" },
  grid: { stroke: "rgba(148,163,184,0.1)", strokeDasharray: "4 4" },
  tooltip: {
    contentStyle: {
      backgroundColor: "var(--color-zenthar-carbon)",
      borderRadius:    "16px",
      border:          "1px solid rgba(148,163,184,0.15)",
      boxShadow:       "0 20px 25px -5px rgba(0,0,0,0.4)",
      padding:         "10px 14px",
      backdropFilter:  "blur(12px)",
    },
    labelStyle: {
      fontSize:       "9px",
      fontWeight:     900,
      textTransform:  "uppercase" as const,
      letterSpacing:  "0.12em",
      color:          "#94a3b8",
      marginBottom:   "6px",
    },
  },
} as const;

// ─────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────

const CpkGauge: React.FC<{ label: string; value: number; target?: number }> = ({
  label, value, target = 1.33,
}) => {
  const pct = Math.min(100, Math.max(0, (value / 2) * 100));
  const ok  = value >= target;

  return (
    <div className="flex flex-col items-center gap-2 group">
      <div className="relative w-24 h-24">
        <svg viewBox="0 0 40 40" className="-rotate-90 w-full h-full">
          <circle cx="20" cy="20" r="16" fill="none" strokeWidth="4" className="stroke-current text-brand-sage/10" />
          <circle
            cx="20" cy="20" r="16"
            fill="none" strokeWidth="4" strokeLinecap="round"
            strokeDasharray={`${pct} 100`}
            style={{ stroke: ok ? "#10b981" : "#f59e0b", transition: "stroke-dasharray 0.8s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={clsx("text-base font-mono font-black", ok ? "text-emerald-400" : "text-amber-400")}>
            {value.toFixed(2)}
          </span>
        </div>
      </div>
      <div className="text-center">
        <p className="text-[10px] font-black text-brand-sage uppercase tracking-widest">{label}</p>
        <div className={clsx("flex items-center justify-center gap-1 mt-1 text-[9px]", ok ? "text-emerald-400" : "text-amber-400")}>
          {ok ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
          <span>Target {target}</span>
        </div>
      </div>
    </div>
  );
};

const EmptyChart: React.FC<{ message: string }> = ({ message }) => (
  <div className="h-full flex flex-col items-center justify-center gap-3 opacity-50">
    <Activity className="w-8 h-8 text-brand-sage/30" />
    <p className="text-[10px] font-black text-brand-sage uppercase tracking-widest text-center">{message}</p>
  </div>
);

// ─────────────────────────────────────────────
// Main Feature
// ─────────────────────────────────────────────

export const AnalyticsFeature: React.FC = memo(() => {
  const [quality,    setQuality]    = useState<QualityPoint[]>([]);
  const [volume,     setVolume]     = useState<VolumePoint[]>([]);
  const [capability, setCapability] = useState<CpkResult>({ brixCpk: 0, purityCpk: 0, colorCpk: 0 });
  const [passRates,  setPassRates]  = useState<PassRate[]>([]);
  const [breakdown,  setBreakdown]  = useState<StatusBreakdown[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [lastFetch,  setLastFetch]  = useState<Date | null>(null);

  const { on } = useRealtime();

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

      if (qRes.status  === "fulfilled") setQuality(qRes.value?.data   ?? []);
      if (vRes.status  === "fulfilled") setVolume(vRes.value?.data    ?? []);
      if (cRes.status  === "fulfilled") setCapability(cRes.value?.data ?? { brixCpk: 0, purityCpk: 0, colorCpk: 0 });
      if (prRes.status === "fulfilled") setPassRates(prRes.value?.data ?? []);
      if (bkRes.status === "fulfilled") setBreakdown(bkRes.value?.data ?? []);
      setLastFetch(new Date());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Auto-refresh charts when tests complete (SSE)
  useEffect(() => {
    const unsub = on("TEST_REVIEWED", () => setTimeout(fetchAll, 1000));
    return unsub;
  }, [on, fetchAll]);

  const avgPassRate = useMemo(() => {
    if (!passRates.length) return null;
    return (passRates.reduce((s, r) => s + (r.pass_rate ?? 0), 0) / passRates.length).toFixed(1);
  }, [passRates]);

  return (
    <div className="h-full bg-(--color-zenthar-graphite)/30 p-4 rounded-[2.5rem] overflow-hidden flex flex-col gap-2">
      {/* Header */}
      <div className="flex items-center justify-between px-2 shrink-0">
        <div>
          <h2 className="text-xl font-display font-bold text-(--color-zenthar-text-primary) flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-brand-primary" />
            Analytics
          </h2>
          {lastFetch && (
            <p className="text-[9px] font-mono text-brand-sage/50 uppercase tracking-widest mt-0.5">
              Last synced: {lastFetch.toLocaleTimeString()}
            </p>
          )}
        </div>
        <button
          onClick={fetchAll}
          className="p-2 rounded-xl border border-brand-sage/20 bg-(--color-zenthar-graphite) hover:bg-(--color-zenthar-graphite)/80 transition-all group"
        >
          <RefreshCw className={clsx("w-4 h-4 text-brand-sage group-hover:text-brand-primary", loading && "animate-spin")} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-6">

        {/* ── SPC Chart ── */}
        <LabPanel title="Statistical Process Control (SPC)" icon={TrendingUp} loading={loading}>
          <div className="h-64 w-full pt-4">
            {quality.length === 0 ? (
              <EmptyChart message="Awaiting verified lab results (min. 1 completed test)" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={quality} margin={{ top: 8, right: 16, left: -8, bottom: 16 }}>
                  <defs>
                    <linearGradient id="gBrix" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#0ea5e9" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}    />
                    </linearGradient>
                    <linearGradient id="gPurity" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#10b981" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}    />
                    </linearGradient>
                  </defs>
                  <CartesianGrid {...CHART.grid} vertical={false} />
                  <XAxis dataKey="time"  {...CHART.text} axisLine={false} tickLine={false} dy={12} />
                  <YAxis yAxisId="left"  {...CHART.text} axisLine={false} tickLine={false} dx={-8} />
                  <YAxis yAxisId="right" {...CHART.text} axisLine={false} tickLine={false} dx={8} orientation="right" />
                  <Tooltip {...CHART.tooltip} />
                  <Legend verticalAlign="top" align="right" wrapperStyle={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", paddingBottom: 16 }} />
                  <Area yAxisId="left"  type="monotone" dataKey="brix"   name="Brix %"      stroke="#0ea5e9" strokeWidth={2.5} fill="url(#gBrix)"   activeDot={{ r: 5, strokeWidth: 0 }} connectNulls />
                  <Line yAxisId="left"  type="monotone" dataKey="purity" name="Purity %"     stroke="#10b981" strokeWidth={2.5} dot={false}          connectNulls />
                  <Line yAxisId="right" type="monotone" dataKey="color"  name="Colour Index" stroke="#f59e0b" strokeWidth={2}   strokeDasharray="5 5" dot={false} connectNulls />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </LabPanel>

        {/* ── Volume + Capability row ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Volume vs Target */}
          <div className="lg:col-span-7">
            <LabPanel title="Daily Sample Volume vs Target" icon={BarChart3} loading={loading}>
              <div className="h-64 w-full pt-4">
                {volume.length === 0 ? (
                  <EmptyChart message="No volume data for the last 7 days" />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={volume} margin={{ top: 8, right: 8, left: -16, bottom: 16 }} barSize={28}>
                      <CartesianGrid {...CHART.grid} vertical={false} />
                      <XAxis dataKey="day"    {...CHART.text} axisLine={false} tickLine={false} dy={12} />
                      <YAxis               {...CHART.text} axisLine={false} tickLine={false} dx={-4} />
                      <Tooltip {...CHART.tooltip} cursor={{ fill: "rgba(148,163,184,0.05)", radius: 8 }} />
                      <Legend verticalAlign="top" align="right" wrapperStyle={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", paddingBottom: 16 }} />
                      <Bar dataKey="volume" name="Actual"    fill="#0ea5e9"               radius={[8, 8, 0, 0]} />
                      <Bar dataKey="target" name="Target"    fill="rgba(148,163,184,0.12)" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </LabPanel>
          </div>

          {/* Cpk gauges */}
          <div className="lg:col-span-5">
            <LabPanel title="Process Capability (Cpk)" icon={Activity} loading={loading}>
              <div className="h-64 flex items-center justify-around px-4 py-6">
                <CpkGauge label="Brix"   value={capability.brixCpk}   />
                <div className="w-px h-20 bg-brand-sage/10" />
                <CpkGauge label="Purity" value={capability.purityCpk} />
                <div className="w-px h-20 bg-brand-sage/10" />
                <CpkGauge label="Colour" value={capability.colorCpk}  />
              </div>
            </LabPanel>
          </div>
        </div>

        {/* ── Status breakdown + Pass rates ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Status donut */}
          <div className="lg:col-span-5">
            <LabPanel title="Sample Status (30 days)" icon={Activity} loading={loading}>
              <div className="h-64 relative">
                {breakdown.length === 0 ? (
                  <EmptyChart message="No sample data for the last 30 days" />
                ) : (
                  <>
                    {/* Centre label */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
                      <span className="text-2xl font-mono font-black text-(--color-zenthar-text-primary)">
                        {breakdown.reduce((s, r) => s + r.count, 0)}
                      </span>
                      <span className="text-[8px] font-black text-brand-sage/50 uppercase tracking-widest">total</span>
                    </div>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={breakdown} cx="50%" cy="50%"
                          innerRadius={64} outerRadius={88}
                          paddingAngle={3} dataKey="count"
                          nameKey="status" stroke="none"
                          animationDuration={1200}
                        >
                          {breakdown.map((entry) => (
                            <Cell
                              key={entry.status}
                              fill={STATUS_COLORS[entry.status] ?? "#64748b"}
                            />
                          ))}
                        </Pie>
                        <Tooltip {...CHART.tooltip} formatter={(v: number, name: string) => [`${v} samples`, name]} />
                        <Legend
                          verticalAlign="bottom" iconType="circle" iconSize={6}
                          wrapperStyle={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em" }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </>
                )}
              </div>
            </LabPanel>
          </div>

          {/* Pass rates table */}
          <div className="lg:col-span-7">
            <LabPanel title="Test Pass Rates (30 days)" icon={CheckCircle2} loading={loading}>
              <div className="h-64 flex flex-col">
                {passRates.length === 0 ? (
                  <EmptyChart message="No reviewed tests in the last 30 days" />
                ) : (
                  <>
                    {avgPassRate && (
                      <div className="flex items-center justify-between px-1 mb-3 pb-3 border-b border-(--color-zenthar-steel)/40 shrink-0">
                        <span className="text-[9px] font-black text-brand-sage uppercase tracking-widest">Average pass rate</span>
                        <span className={clsx("text-xl font-mono font-black", Number(avgPassRate) >= 90 ? "text-emerald-400" : "text-amber-400")}>
                          {avgPassRate}%
                        </span>
                      </div>
                    )}
                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-1">
                      {passRates.map((r) => (
                        <div key={r.test_type} className="flex items-center gap-3 group">
                          <span className="text-[10px] font-black text-(--color-zenthar-text-primary) uppercase w-20 shrink-0">
                            {r.test_type}
                          </span>
                          <div className="flex-1 h-2 bg-(--color-zenthar-steel) rounded-full overflow-hidden">
                            <div
                              className={clsx(
                                "h-full rounded-full transition-all duration-700",
                                r.pass_rate >= 95 ? "bg-emerald-500" :
                                r.pass_rate >= 80 ? "bg-amber-400" : "bg-red-400"
                              )}
                              style={{ width: `${r.pass_rate}%` }}
                            />
                          </div>
                          <span className={clsx(
                            "text-[10px] font-mono font-black w-12 text-right shrink-0",
                            r.pass_rate >= 95 ? "text-emerald-400" :
                            r.pass_rate >= 80 ? "text-amber-400" : "text-red-400"
                          )}>
                            {r.pass_rate?.toFixed(1)}%
                          </span>
                          <span className="text-[9px] font-mono text-brand-sage/40 shrink-0">
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