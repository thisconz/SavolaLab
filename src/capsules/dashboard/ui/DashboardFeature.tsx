import React, { memo, useState, useEffect, useMemo, useCallback } from "react";
import {
  LayoutDashboard,
  Bell,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  BarChart3,
  PieChart as PieChartIcon,
  Zap,
  Activity,
  FlaskConical,
  ListChecks,
  RefreshCw,
  Wifi,
  Calendar,
  ChevronDown,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { LabPanel } from "../../../shared/components/LabPanel";
import { NotificationApi } from "../../notifications";
import { LabApi } from "../../lab";
import type { Notification, Sample, TestResult } from "../../../core/types";
import { useRealtime } from "../../../core/providers/RealtimeProvider";
import { useSetActiveTab } from "../../../orchestrator/state/app.store";
import clsx from "clsx";

import { QCStatsWidget } from "../widget/QCStatsWidget";
import { QCTrendsWidget } from "../widget/QCTrendsWidget";
import { PriorityWidget } from "../widget/PriorityWidget";
import { EfficiencyWidget } from "../widget/EfficiencyWidget";
import { PlantOverviewWidget } from "../widget/PlantOverviewWidget";
import { MetricCard, MetricCardSkeleton } from "../../../shared/components/MetricCard";
import { ChartSkeleton, SampleQueueSkeleton } from "../../../shared/components/Skeletons";

// ─────────────────────────────────────────────
// Date range selector
// ─────────────────────────────────────────────

type DateRange = "24h" | "7d" | "30d";

const DATE_RANGE_LABELS: Record<DateRange, string> = {
  "24h": "Last 24 hours",
  "7d": "Last 7 days",
  "30d": "Last 30 days",
};

const DateRangeSelector: React.FC<{
  value: DateRange;
  onChange: (v: DateRange) => void;
}> = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="border-brand-sage/20 hover:border-brand-primary/30 flex items-center gap-2 rounded-xl border bg-(--color-zenthar-carbon) px-3 py-2 text-[10px] font-black tracking-widest text-(--color-zenthar-text-muted) uppercase transition-all"
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
            className="border-brand-sage/20 absolute top-full right-0 z-20 mt-2 min-w-[160px] overflow-hidden rounded-2xl border bg-(--color-zenthar-carbon) shadow-xl"
          >
            {(["24h", "7d", "30d"] as DateRange[]).map((opt) => (
              <button
                key={opt}
                onClick={() => {
                  onChange(opt);
                  setOpen(false);
                }}
                className={clsx(
                  "w-full px-4 py-3 text-left text-[11px] font-bold transition-all",
                  value === opt
                    ? "bg-brand-primary/10 text-brand-primary"
                    : "text-(--color-zenthar-text-primary) hover:bg-(--color-zenthar-graphite)/40",
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
  const setActiveTab = useSetActiveTab();

  const [data, setData] = useState({
    alerts: [] as Notification[],
    samples: [] as Sample[],
    tests: [] as TestResult[],
  });
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | undefined>(undefined);
  const [dateRange, setDateRange] = useState<DateRange>("24h");

  // Per-widget loading states for skeleton granularity
  const [alertsLoading, setAlertsLoading] = useState(true);
  const [samplesLoading, setSamplesLoading] = useState(true);
  const [testsLoading, setTestsLoading] = useState(true);

  const [systemHealth, setSystemHealth] = useState<string | undefined>("100%");

  const { on, isConnected } = useRealtime();

  // ── Fetch functions (per-resource for granular skeleton control) ──────────
  const fetchAlerts = useCallback(async () => {
    setAlertsLoading(true);
    try {
      const n = await NotificationApi.getNotifications();
      setData((p) => ({
        ...p,
        alerts: (n as Notification[]).filter((x) => !x.is_read).slice(0, 5),
      }));
    } catch { /* empty */ } finally {
      setAlertsLoading(false);
    }
  }, []);

  const fetchSamples = useCallback(async () => {
    setSamplesLoading(true);
    try {
      const s = await LabApi.getSamples();
      setData((p) => ({ ...p, samples: s }));
    } catch { /* empty */ } finally {
      setSamplesLoading(false);
    }
  }, []);

  const fetchTests = useCallback(async () => {
    setTestsLoading(true);
    try {
      const t = await LabApi.getTests();
      setData((p) => ({ ...p, tests: t }));
    } catch { /* empty */ } finally {
      setTestsLoading(false);
    }
  }, []);

  const fetchAll = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      else setIsRefreshing(true);
      try {
        await Promise.allSettled([fetchAlerts(), fetchSamples(), fetchTests()]);
        setLastUpdated(new Date());
      } finally {
        setLoading(false);
        setIsRefreshing(false);
      }
    },
    [fetchAlerts, fetchSamples, fetchTests],
  );

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // ── SSE subscriptions — timer captured per subscription ──────────────────
  useEffect(() => {
    const makeDebounced = (fn: () => void, delay = 800) => {
      let timer: ReturnType<typeof setTimeout>;
      return () => {
        clearTimeout(timer);
        timer = setTimeout(fn, delay);
      };
    };

    const refreshSamples = makeDebounced(() => fetchSamples());
    const refreshAlerts = makeDebounced(() => fetchAlerts());
    const refreshAll = makeDebounced(() => fetchAll(true));

    const unsubs = [
      on("SAMPLE_CREATED", () => {
        refreshSamples();
        setLastUpdated(new Date());
      }),
      on("SAMPLE_UPDATED", () => {
        refreshSamples();
        setLastUpdated(new Date());
      }),
      on("SAMPLE_STATUS_CHANGED", () => {
        refreshSamples();
        setLastUpdated(new Date());
      }),
      on("TEST_SUBMITTED", () => {
        refreshAll();
      }),
      on("TEST_REVIEWED", () => {
        refreshAll();
      }),
      on("NOTIFICATION_PUSHED", () => {
        refreshAlerts();
      }),
    ];

    return () => unsubs.forEach((u) => u());
  }, [on, fetchSamples, fetchAlerts, fetchAll]);

  const trends = useMemo(() => computeTrends(data.samples, data.tests), [data]);

  return (
    <div className="flex h-full flex-col gap-6 overflow-hidden rounded-3xl bg-(--color-zenthar-graphite)/30 p-2">
      {/* Header */}
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 px-4">
        <div>
          <h2 className="font-display flex items-center gap-2 text-xl font-bold text-(--color-zenthar-text-primary) md:text-2xl">
            <LayoutDashboard className="text-brand-primary h-6 w-6" />
            Dashboard
          </h2>
          <div className="mt-1 flex items-center gap-3">
            <p className="text-brand-sage font-mono text-[10px] tracking-widest uppercase">
              Real-time · {isConnected ? "Live" : "Polling"}
            </p>
            <div
              className={clsx(
                "flex items-center gap-1.5 text-[9px] font-bold uppercase",
                isConnected ? "text-emerald-400" : "text-amber-400",
              )}
            >
              <Wifi size={10} />
              {isConnected ? "Connected" : "Reconnecting"}
            </div>
            {lastUpdated && (
              <span className="text-brand-sage/40 font-mono text-[9px]">
                Updated {lastUpdated.toLocaleTimeString()}
              </span>
            )}
            {isRefreshing && (
              <span className="text-brand-primary flex items-center gap-1 text-[9px] font-bold">
                <RefreshCw size={9} className="animate-spin" /> Syncing
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <DateRangeSelector value={dateRange} onChange={setDateRange} />
          <button
            onClick={() => fetchAll(true)}
            className="border-brand-sage/20 group rounded-xl border bg-(--color-zenthar-graphite) p-2 transition-colors hover:bg-(--color-zenthar-graphite)/80"
          >
            <RefreshCw
              className={clsx(
                "text-brand-sage group-hover:text-brand-primary h-4 w-4",
                isRefreshing && "animate-spin",
              )}
            />
          </button>
        </div>
      </div>

      <div className="custom-scrollbar flex-1 space-y-6 overflow-y-auto pr-2">
        {/* Metric cards — clickable to navigate */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
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
                value={systemHealth ?? "N/A"}
                trend="STABLE"
                icon={Activity}
                variant="success"
              />
            </>
          )}
        </div>

        {/* Analytics grid */}
        <div className="grid grid-cols-12 items-start gap-6">
          <div className="col-span-12 space-y-6 lg:col-span-8">
            <LabPanel
              title="Plant Throughput"
              icon={Activity}
              loading={samplesLoading}
              skeleton={<ChartSkeleton height="h-72" />}
            >
              <PlantOverviewWidget samples={data.samples} />
            </LabPanel>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
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

          <div className="col-span-12 space-y-6 lg:col-span-4">
            <LabPanel
              title="Critical Alerts"
              icon={Bell}
              loading={alertsLoading}
              skeleton={<SampleQueueSkeleton count={3} />}
            >
              <div className="flex min-h-[300px] flex-col">
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
                        className="text-brand-primary hover:text-brand-primary/80 border-brand-primary/20 mt-2 w-full rounded-2xl border border-dashed py-3 text-[10px] font-black tracking-widest uppercase transition-colors"
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
                className="text-brand-primary hover:text-brand-primary/80 border-brand-primary/20 rounded-xl border px-3 py-1.5 text-[10px] font-black tracking-widest uppercase transition-colors"
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
    <div className="border-brand-sage/5 hover:border-brand-primary/20 group relative flex cursor-default gap-4 overflow-hidden rounded-xl border p-4 transition-all hover:bg-(--color-zenthar-graphite)/50">
      <div
        className={clsx(
          "absolute top-0 bottom-0 left-0 w-1 opacity-0 transition-opacity group-hover:opacity-100",
          isCritical ? "bg-lab-laser" : "bg-brand-primary",
        )}
      />
      <div
        className={clsx(
          "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
          isCritical ? "bg-lab-laser/10 text-lab-laser" : "text-brand-primary bg-(--color-zenthar-graphite)",
        )}
      >
        {isCritical ? <XCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-start justify-between">
          <p className="group-hover:text-brand-primary truncate pr-2 text-[11px] leading-tight font-bold text-(--color-zenthar-text-primary) transition-colors">
            {alert.message}
          </p>
          <span className="text-brand-sage/60 shrink-0 font-mono text-[8px]">
            {new Date(alert.created_at).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
        <p className="text-brand-sage font-mono text-[8px] tracking-wider uppercase">
          {alert.type.replace(/_/g, " ")}
        </p>
      </div>
    </div>
  );
};

const EmptyAlertsState = () => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="m-auto py-10 text-center">
    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
      <CheckCircle2 className="h-6 w-6" />
    </div>
    <p className="text-[10px] font-black tracking-widest text-(--color-zenthar-text-primary) uppercase">
      All Systems Nominal
    </p>
    <p className="text-brand-sage mt-1 text-[9px]">No pending alerts.</p>
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
  const pend = tests.filter((t) => t.status === "PENDING");
  const stat = samples.filter((s) => s.priority === "STAT");

  return {
    active: diff(inWindow(active, 1, 0), inWindow(active, 2, 1)),
    pending: diff(inWindow(pend, 1, 0), inWindow(pend, 2, 1)),
    stat: diff(inWindow(stat, 1, 0), inWindow(stat, 2, 1)),
  };
}

DashboardFeature.displayName = "DashboardFeature";
export default DashboardFeature;
