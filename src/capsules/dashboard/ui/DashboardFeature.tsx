import React, {
  memo, useState, useEffect, useMemo, useCallback, useRef,
} from "react";
import {
  LayoutDashboard, Bell, AlertCircle, CheckCircle2, XCircle,
  Clock, TrendingUp, BarChart3, PieChart as PieChartIcon,
  Zap, Activity, FlaskConical, ListChecks, RefreshCw, Wifi,
  Calendar, ChevronDown,
} from "lucide-react";
import { motion, AnimatePresence } from "@/src/lib/motion";
import { LabPanel }        from "../../../shared/components/LabPanel";
import { NotificationApi } from "../../notifications";
import { LabApi }          from "../../lab";
import { Notification, Sample, TestResult } from "../../../core/types";
import { useRealtime }     from "../../../core/providers/RealtimeProvider";
import { useAppActions }   from "../../../orchestrator/state/app.store";
import clsx                from "@/src/lib/clsx";

import { QCStatsWidget }       from "./QCStatsWidget";
import { QCTrendsWidget }      from "./QCTrendsWidget";
import { PriorityWidget }      from "./PriorityWidget";
import { EfficiencyWidget }    from "./EfficiencyWidget";
import { PlantOverviewWidget } from "./PlantOverviewWidget";
import {
  MetricCard,
  MetricCardSkeleton,
} from "../../../shared/components/MetricCard";
import {
  ChartSkeleton,
  SampleQueueSkeleton,
} from "../../../shared/components/Skeletons";

// ─────────────────────────────────────────────
// Date range selector
// ─────────────────────────────────────────────

type DateRange = "24h" | "7d" | "30d";

const DATE_RANGE_LABELS: Record<DateRange, string> = {
  "24h": "Last 24 hours",
  "7d":  "Last 7 days",
  "30d": "Last 30 days",
};

const DateRangeSelector: React.FC<{
  value:    DateRange;
  onChange: (v: DateRange) => void;
}> = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-3 py-2 text-[10px] font-black uppercase tracking-widest border border-brand-sage/20 rounded-xl bg-(--color-zenthar-carbon) hover:border-brand-primary/30 text-(--color-zenthar-text-muted) transition-all"
      >
        <Calendar size={12} />
        {DATE_RANGE_LABELS[value]}
        <ChevronDown size={10} className={clsx("transition-transform", open && "rotate-180")} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="absolute top-full right-0 mt-2 z-20 bg-(--color-zenthar-carbon) border border-brand-sage/20 rounded-2xl shadow-xl overflow-hidden min-w-[160px]"
          >
            {(["24h", "7d", "30d"] as DateRange[]).map((opt) => (
              <button
                key={opt}
                onClick={() => { onChange(opt); setOpen(false); }}
                className={clsx(
                  "w-full text-left px-4 py-3 text-[11px] font-bold transition-all",
                  value === opt
                    ? "bg-brand-primary/10 text-brand-primary"
                    : "text-(--color-zenthar-text-primary) hover:bg-(--color-zenthar-graphite)/40"
                )}
              >
                {DATE_RANGE_LABELS[opt]}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────

export const DashboardFeature: React.FC = memo(() => {
  const { setActiveTab } = useAppActions();

  const [data, setData] = useState({
    alerts:  [] as Notification[],
    samples: [] as Sample[],
    tests:   [] as TestResult[],
  });
  const [loading,      setLoading]      = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated,  setLastUpdated]  = useState<Date | null>(null);
  const [dateRange,    setDateRange]    = useState<DateRange>("24h");

  // Per-widget loading states for skeleton granularity
  const [alertsLoading,  setAlertsLoading]  = useState(true);
  const [samplesLoading, setSamplesLoading] = useState(true);
  const [testsLoading,   setTestsLoading]   = useState(true);

  const { on, isConnected } = useRealtime();

  // ── Fetch functions (per-resource for granular skeleton control) ──────────
  const fetchAlerts = useCallback(async () => {
    setAlertsLoading(true);
    try {
      const n = await NotificationApi.getNotifications();
      setData((p) => ({ ...p, alerts: (n as Notification[]).filter((x) => !x.is_read).slice(0, 5) }));
    } catch {} finally { setAlertsLoading(false); }
  }, []);

  const fetchSamples = useCallback(async () => {
    setSamplesLoading(true);
    try {
      const s = await LabApi.getSamples();
      setData((p) => ({ ...p, samples: s }));
    } catch {} finally { setSamplesLoading(false); }
  }, []);

  const fetchTests = useCallback(async () => {
    setTestsLoading(true);
    try {
      const t = await LabApi.getTests();
      setData((p) => ({ ...p, tests: t }));
    } catch {} finally { setTestsLoading(false); }
  }, []);

  const fetchAll = useCallback(async (silent = false) => {
    if (!silent) setLoading(true); else setIsRefreshing(true);
    try {
      await Promise.allSettled([fetchAlerts(), fetchSamples(), fetchTests()]);
      setLastUpdated(new Date());
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [fetchAlerts, fetchSamples, fetchTests]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── SSE subscriptions — timer captured per subscription ──────────────────
  useEffect(() => {
    const makeDebounced = (fn: () => void, delay = 800) => {
      let timer: ReturnType<typeof setTimeout>;
      return () => { clearTimeout(timer); timer = setTimeout(fn, delay); };
    };

    const refreshSamples = makeDebounced(() => fetchSamples());
    const refreshAlerts  = makeDebounced(() => fetchAlerts());
    const refreshAll     = makeDebounced(() => fetchAll(true));

    const unsubs = [
      on("SAMPLE_CREATED",        () => { refreshSamples(); setLastUpdated(new Date()); }),
      on("SAMPLE_UPDATED",        () => { refreshSamples(); setLastUpdated(new Date()); }),
      on("SAMPLE_STATUS_CHANGED", () => { refreshSamples(); setLastUpdated(new Date()); }),
      on("TEST_SUBMITTED",        () => { refreshAll(); }),
      on("TEST_REVIEWED",         () => { refreshAll(); }),
      on("NOTIFICATION_PUSHED",   () => { refreshAlerts(); }),
    ];

    return () => unsubs.forEach((u) => u());
  }, [on, fetchSamples, fetchAlerts, fetchAll]);

  const trends = useMemo(() => computeTrends(data.samples, data.tests), [data]);

  return (
    <div className="h-full flex flex-col gap-6 overflow-hidden bg-(--color-zenthar-graphite)/30 p-2 rounded-3xl">
      {/* Header */}
      <div className="flex items-center justify-between px-4 shrink-0 flex-wrap gap-3">
        <div>
          <h2 className="text-xl md:text-2xl font-display font-bold text-(--color-zenthar-text-primary) flex items-center gap-2">
            <LayoutDashboard className="w-6 h-6 text-brand-primary" />
            Dashboard
          </h2>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-[10px] font-mono text-brand-sage uppercase tracking-widest">
              Real-time · {isConnected ? "Live" : "Polling"}
            </p>
            <div className={clsx(
              "flex items-center gap-1.5 text-[9px] font-bold uppercase",
              isConnected ? "text-emerald-400" : "text-amber-400"
            )}>
              <Wifi size={10} />
              {isConnected ? "Connected" : "Reconnecting"}
            </div>
            {lastUpdated && (
              <span className="text-[9px] font-mono text-brand-sage/40">
                Updated {lastUpdated.toLocaleTimeString()}
              </span>
            )}
            {isRefreshing && (
              <span className="flex items-center gap-1 text-[9px] font-bold text-brand-primary">
                <RefreshCw size={9} className="animate-spin" /> Syncing
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <DateRangeSelector value={dateRange} onChange={setDateRange} />
          <button
            onClick={() => fetchAll(true)}
            className="p-2 rounded-xl border border-brand-sage/20 bg-(--color-zenthar-graphite) hover:bg-(--color-zenthar-graphite)/80 transition-colors group"
          >
            <RefreshCw className={clsx("w-4 h-4 text-brand-sage group-hover:text-brand-primary", isRefreshing && "animate-spin")} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-6">

        {/* Metric cards — clickable to navigate */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => <MetricCardSkeleton key={i} />)
          ) : (
            <>
              <MetricCard
                label="Active Samples"
                value={data.samples.filter((s) => !["COMPLETED", "ARCHIVED"].includes(s.status)).length}
                trend={trends.active}
                icon={FlaskConical}
                variant="primary"
                onClick={() => setActiveTab("lab")}
              />
              <MetricCard
                label="Pending Tests"
                value={data.tests.filter((t) => t.status === "PENDING").length}
                trend={trends.pending}
                icon={ListChecks}
                variant="secondary"
                onClick={() => setActiveTab("lab")}
              />
              <MetricCard
                label="STAT Priority"
                value={data.samples.filter((s) => s.priority === "STAT").length}
                trend={trends.stat}
                icon={Zap}
                variant="error"
                onClick={() => setActiveTab("stat")}
              />
              <MetricCard
                label="System Health"
                value="99.8%"
                trend="STABLE"
                icon={Activity}
                variant="success"
              />
            </>
          )}
        </div>

        {/* Analytics grid */}
        <div className="grid grid-cols-12 gap-6 items-start">
          <div className="col-span-12 lg:col-span-8 space-y-6">
            <LabPanel
              title="Plant Throughput"
              icon={Activity}
              loading={samplesLoading}
              skeleton={<ChartSkeleton height="h-72" />}
            >
              <PlantOverviewWidget samples={data.samples} />
            </LabPanel>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <LabPanel
                title="Quality Distribution"
                icon={PieChartIcon}
                loading={samplesLoading}
                skeleton={<ChartSkeleton height="h-64" />}
              >
                <QCStatsWidget samples={data.samples} />
              </LabPanel>
              <LabPanel
                title="Urgency Heatmap"
                icon={BarChart3}
                loading={samplesLoading}
                skeleton={<ChartSkeleton height="h-64" />}
              >
                <PriorityWidget samples={data.samples} />
              </LabPanel>
            </div>
          </div>

          <div className="col-span-12 lg:col-span-4 space-y-6">
            <LabPanel
              title="Critical Alerts"
              icon={Bell}
              loading={alertsLoading}
              skeleton={<SampleQueueSkeleton count={3} />}
            >
              <div className="flex flex-col min-h-[300px]">
                {data.alerts.length === 0 ? (
                  <EmptyAlertsState />
                ) : (
                  <div className="space-y-2 p-3">
                    {data.alerts.map((alert) => (
                      <AlertItem key={alert.id} alert={alert} />
                    ))}
                    {data.alerts.length >= 5 && (
                      <button
                        onClick={() => setActiveTab("audit")}
                        className="w-full py-3 text-[10px] font-black uppercase tracking-widest text-brand-primary hover:text-brand-primary/80 transition-colors border border-dashed border-brand-primary/20 rounded-2xl mt-2"
                      >
                        View all in Audit Log →
                      </button>
                    )}
                  </div>
                )}
              </div>
            </LabPanel>

            <LabPanel
              title="Stage Efficiency"
              icon={Clock}
              loading={samplesLoading}
              skeleton={<ChartSkeleton height="h-64" />}
            >
              <EfficiencyWidget samples={data.samples} />
            </LabPanel>
          </div>
        </div>

        <div className="pb-4">
          <LabPanel
            title="7-Day Performance Trend"
            icon={TrendingUp}
            loading={testsLoading}
            skeleton={<ChartSkeleton height="h-64" />}
            actions={
              <button
                onClick={() => setActiveTab("analytics")}
                className="text-[10px] font-black uppercase tracking-widest text-brand-primary hover:text-brand-primary/80 transition-colors px-3 py-1.5 border border-brand-primary/20 rounded-xl"
              >
                Full Analytics →
              </button>
            }
          >
            <QCTrendsWidget tests={data.tests} />
          </LabPanel>
        </div>
      </div>
    </div>
  );
});

// ─────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────

const AlertItem = ({ alert }: { alert: Notification }) => {
  const isCritical = alert.type.includes("FAILURE") || alert.type.includes("CRITICAL");
  return (
    <div className="flex gap-4 p-4 rounded-xl border border-brand-sage/5 hover:border-brand-primary/20 hover:bg-(--color-zenthar-graphite)/50 transition-all group relative overflow-hidden cursor-default">
      <div className={clsx("absolute left-0 top-0 bottom-0 w-1 opacity-0 group-hover:opacity-100 transition-opacity", isCritical ? "bg-lab-laser" : "bg-brand-primary")} />
      <div className={clsx("mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center shrink-0", isCritical ? "bg-lab-laser/10 text-lab-laser" : "bg-(--color-zenthar-graphite) text-brand-primary")}>
        {isCritical ? <XCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex justify-between items-start mb-1">
          <p className="text-[11px] font-bold text-(--color-zenthar-text-primary) leading-tight group-hover:text-brand-primary transition-colors truncate pr-2">
            {alert.message}
          </p>
          <span className="text-[8px] font-mono text-brand-sage/60 shrink-0">
            {new Date(alert.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
        <p className="text-[8px] font-mono text-brand-sage uppercase tracking-wider">{alert.type.replace(/_/g, " ")}</p>
      </div>
    </div>
  );
};

const EmptyAlertsState = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="m-auto text-center py-10"
  >
    <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-500/30">
      <CheckCircle2 className="w-6 h-6" />
    </div>
    <p className="text-[10px] font-black text-(--color-zenthar-text-primary) uppercase tracking-widest">All Systems Nominal</p>
    <p className="text-[9px] text-brand-sage mt-1">No pending alerts.</p>
  </motion.div>
);

// ─────────────────────────────────────────────
// Trend calculation
// ─────────────────────────────────────────────

function computeTrends(samples: Sample[], tests: TestResult[]) {
  const now = Date.now();
  const DAY = 86_400_000;

  const inWindow = (list: any[], start: number, end: number) =>
    list.filter((i) => {
      const t = new Date(i.created_at || i.performed_at).getTime();
      return t > now - start * DAY && t <= now - end * DAY;
    }).length;

  const diff = (curr: number, prev: number) => {
    if (prev === 0) return curr > 0 ? "+100%" : "0%";
    const d = Math.round(((curr - prev) / prev) * 100);
    return `${d > 0 ? "+" : ""}${d}%`;
  };

  const active = samples.filter((s) => !["COMPLETED", "ARCHIVED"].includes(s.status));
  const pend   = tests.filter((t) => t.status === "PENDING");
  const stat   = samples.filter((s) => s.priority === "STAT");

  return {
    active:  diff(inWindow(active, 1, 0), inWindow(active, 2, 1)),
    pending: diff(inWindow(pend,   1, 0), inWindow(pend,   2, 1)),
    stat:    diff(inWindow(stat,   1, 0), inWindow(stat,   2, 1)),
  };
}

DashboardFeature.displayName = "DashboardFeature";
export default DashboardFeature;