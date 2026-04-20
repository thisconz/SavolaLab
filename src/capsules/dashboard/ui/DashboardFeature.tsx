import React, { memo, useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  LayoutDashboard, Bell, AlertCircle, CheckCircle2, XCircle,
  Clock, TrendingUp, BarChart3, PieChart as PieChartIcon,
  Zap, Activity, FlaskConical, ListChecks, RefreshCw, Wifi,
} from "lucide-react";
import { motion, AnimatePresence } from "@/src/lib/motion";
import { LabPanel } from "../../../ui/components/LabPanel";
import { NotificationApi } from "../../notifications";
import { LabApi } from "../../lab";
import { Notification, Sample, TestResult } from "../../../core/types";
import { useRealtime } from "../../../core/providers/RealtimeProvider";
import clsx from "@/src/lib/clsx";

import { QCStatsWidget }    from "./QCStatsWidget";
import { QCTrendsWidget }   from "./QCTrendsWidget";
import { PriorityWidget }   from "./PriorityWidget";
import { EfficiencyWidget } from "./EfficiencyWidget";
import { PlantOverviewWidget } from "./PlantOverviewWidget";
import { MetricCard } from "../../../ui/components/MetricCard";

export const DashboardFeature: React.FC = memo(() => {
  const [data, setData] = useState({
    alerts:  [] as Notification[],
    samples: [] as Sample[],
    tests:   [] as TestResult[],
  });
  const [loading,     setLoading]     = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // ── Debounced refresh — coalesces rapid SSE events ────────────────────
  const refreshTimer = useRef<ReturnType<typeof setTimeout>>();

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setIsRefreshing(true);

    try {
      const [notifRes, samplesRes, testsRes] = await Promise.allSettled([
        NotificationApi.getNotifications(),
        LabApi.getSamples(),
        LabApi.getTests(),
      ]);

      setData({
        alerts:  notifRes.status  === "fulfilled" ? (notifRes.value as Notification[]).filter((n) => !n.is_read).slice(0, 5) : [],
        samples: samplesRes.status === "fulfilled" ? samplesRes.value : [],
        tests:   testsRes.status  === "fulfilled" ? testsRes.value   : [],
      });
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Real-time updates via SSE ─────────────────────────────────────────
  const { on, isConnected } = useRealtime();

  const scheduleRefresh = useCallback(() => {
    clearTimeout(refreshTimer.current);
    refreshTimer.current = setTimeout(() => fetchData(true), 800); // 800ms debounce
  }, [fetchData]);

  useEffect(() => {
    const unsubs = [
      on("SAMPLE_CREATED",        scheduleRefresh),
      on("SAMPLE_UPDATED",        scheduleRefresh),
      on("SAMPLE_STATUS_CHANGED", scheduleRefresh),
      on("TEST_SUBMITTED",        scheduleRefresh),
      on("TEST_REVIEWED",         scheduleRefresh),
      on("NOTIFICATION_PUSHED",   scheduleRefresh),
    ];
    return () => {
      unsubs.forEach((u) => u());
      clearTimeout(refreshTimer.current);
    };
  }, [on, scheduleRefresh]);

  const trends = useMemo(() => computeTrends(data.samples, data.tests), [data]);

  return (
    <div className="h-full flex flex-col gap-6 overflow-hidden bg-(--color-zenthar-graphite)/30 p-2 rounded-3xl">
      {/* Header */}
      <div className="flex items-center justify-between px-4 shrink-0">
        <div>
          <h2 className="text-xl md:text-2xl font-display font-bold text-(--color-zenthar-text-primary) flex items-center gap-2">
            <LayoutDashboard className="w-6 h-6 text-brand-primary" />
            Dashboard
          </h2>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-[10px] font-mono text-brand-sage uppercase tracking-widest">
              Real-time data synchronization
            </p>
            <div className={clsx(
              "flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest",
              isConnected ? "text-emerald-400" : "text-amber-400"
            )}>
              <Wifi size={10} className={isConnected ? "text-emerald-400" : "text-amber-400"} />
              {isConnected ? "Live" : "Polling"}
            </div>
          </div>
        </div>
        <button
          onClick={() => fetchData(true)}
          className="p-2 rounded-xl border border-brand-sage/20 bg-(--color-zenthar-graphite) hover:bg-(--color-zenthar-graphite)/80 transition-colors group"
        >
          <RefreshCw className={clsx(
            "w-4 h-4 text-brand-sage group-hover:text-brand-primary",
            isRefreshing && "animate-spin"
          )} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-6">
        {/* Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            label="Active Samples"
            value={data.samples.filter((s) => !["COMPLETED", "ARCHIVED"].includes(s.status)).length}
            trend={trends.active}
            icon={FlaskConical}
            variant="primary"
          />
          <MetricCard
            label="Pending Tests"
            value={data.tests.filter((t) => t.status === "PENDING").length}
            trend={trends.pending}
            icon={ListChecks}
            variant="secondary"
          />
          <MetricCard
            label="STAT Priority"
            value={data.samples.filter((s) => s.priority === "STAT").length}
            trend={trends.stat}
            icon={Zap}
            variant="error"
          />
          <MetricCard
            label="System Health"
            value="99.8%"
            trend="STABLE"
            icon={Activity}
            variant="success"
          />
        </div>

        {/* Analytics grid */}
        <div className="grid grid-cols-12 gap-6 items-start">
          <div className="col-span-12 lg:col-span-8 space-y-6">
            <LabPanel title="Plant Throughput" icon={Activity}>
              <PlantOverviewWidget samples={data.samples} />
            </LabPanel>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <LabPanel title="Quality Distribution" icon={PieChartIcon}>
                <QCStatsWidget samples={data.samples} />
              </LabPanel>
              <LabPanel title="Urgency Heatmap" icon={BarChart3}>
                <PriorityWidget samples={data.samples} />
              </LabPanel>
            </div>
          </div>

          <div className="col-span-12 lg:col-span-4 space-y-6">
            <LabPanel title="Critical Alerts" icon={Bell}>
              <div className="flex flex-col min-h-[300px]">
                {loading ? (
                  <LoadingState />
                ) : data.alerts.length === 0 ? (
                  <EmptyAlertsState />
                ) : (
                  <div className="space-y-2">
                    {data.alerts.map((alert) => (
                      <AlertItem key={alert.id} alert={alert} />
                    ))}
                  </div>
                )}
              </div>
            </LabPanel>

            <LabPanel title="Efficiency" icon={Clock}>
              <EfficiencyWidget samples={data.samples} />
            </LabPanel>
          </div>
        </div>

        <div className="pb-4">
          <LabPanel title="7-Day Performance Trend" icon={TrendingUp}>
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
    <div className="flex gap-4 p-4 rounded-xl border border-brand-sage/5 hover:border-brand-primary/20 hover:bg-(--color-zenthar-graphite)/50 transition-all group relative overflow-hidden">
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

const LoadingState = () => (
  <div className="m-auto flex flex-col items-center gap-3 py-10">
    <div className="w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
    <span className="text-[9px] font-black uppercase tracking-widest text-brand-sage">Syncing...</span>
  </div>
);

const EmptyAlertsState = () => (
  <div className="m-auto text-center py-10">
    <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-500/30">
      <CheckCircle2 className="w-6 h-6" />
    </div>
    <p className="text-[10px] font-black text-(--color-zenthar-text-primary) uppercase tracking-widest">All Systems Nominal</p>
    <p className="text-[9px] text-brand-sage mt-1">No pending alerts.</p>
  </div>
);

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function computeTrends(samples: Sample[], tests: TestResult[]) {
  const now  = Date.now();
  const DAY  = 86_400_000;

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