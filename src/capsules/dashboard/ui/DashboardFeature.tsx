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
} from "lucide-react";
import { motion } from "@/src/lib/motion";
import { LabPanel } from "../../../ui/components/LabPanel";
import { NotificationApi } from "../../notifications";
import { LabApi } from "../../lab";
import { Notification, Sample, TestResult } from "../../../core/types";
import clsx from "@/src/lib/clsx";

// Widgets
import { QCStatsWidget } from "./QCStatsWidget";
import { QCTrendsWidget } from "./QCTrendsWidget";
import { PriorityWidget } from "./PriorityWidget";
import { EfficiencyWidget } from "./EfficiencyWidget";
import { PlantOverviewWidget } from "./PlantOverviewWidget";

export const DashboardFeature: React.FC = memo(() => {
  const [data, setData] = useState({
    alerts: [] as Notification[],
    samples: [] as Sample[],
    tests: [] as TestResult[],
  });
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setIsRefreshing(true);

    try {
      const [notificationsRes, samplesRes, testsRes] = await Promise.allSettled([
        NotificationApi.getNotifications(),
        LabApi.getSamples(),
        LabApi.getTests(),
      ]);

      setData({
        alerts: notificationsRes.status === "fulfilled" 
          ? (notificationsRes.value as Notification[]).filter(n => !n.is_read).slice(0, 5) 
          : [],
        samples: samplesRes.status === "fulfilled" ? samplesRes.value : [],
        tests: testsRes.status === "fulfilled" ? testsRes.value : [],
      });
    } catch (err) {
      console.error("Dashboard Sync Error:", err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const trends = useMemo(() => calculateDashboardTrends(data.samples, data.tests), [data]);

  return (
    <div className="h-full flex flex-col gap-6 overflow-hidden bg-(--color-zenthar-graphite)/30 p-2 rounded-3xl">
      {/* 1. HEADER SECTION */}
      <div className="flex items-center justify-between px-4 shrink-0">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <LayoutDashboard className="w-5 h-5 text-brand-primary" />
            Dashboard
          </h2>
          <p className="text-[10px] font-mono text-brand-sage uppercase tracking-widest">
            Real-time data synchronization active
          </p>
        </div>
        <button 
          onClick={() => fetchData(true)}
          className="p-2 rounded-xl border border-brand-sage/20 bg-(--color-zenthar-graphite) hover:bg-(--color-zenthar-graphite)/80 transition-colors group"
        >
          <RefreshCw className={clsx("w-4 h-4 text-brand-sage group-hover:text-brand-primary", isRefreshing && "animate-spin")} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-6">
        {/* 2. METRICS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            label="Active Samples"
            value={data.samples.filter((s) => !["COMPLETED", "ARCHIVED"].includes(s.status)).length}
            trend={trends.active}
            icon={FlaskConical}
            variant="brand-primary"
          />
          <MetricCard
            label="Pending Tests"
            value={data.tests.filter((t) => t.status === "PENDING").length}
            trend={trends.pending}
            icon={ListChecks}
            variant="brand-sage"
          />
          <MetricCard
            label="STAT Priority"
            value={data.samples.filter((s) => s.priority === "STAT").length}
            trend={trends.stat}
            icon={Zap}
            variant="lab-laser"
          />
          <MetricCard
            label="System Health"
            value="99.8%"
            trend="STABLE"
            icon={Activity}
            variant="emerald-500"
          />
        </div>

        {/* 3. ANALYTICS CONTENT */}
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
              <div className="flex flex-col min-h-75">
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

        <div className="col-span-12 pb-4">
          <LabPanel title="7-Day Performance Trend" icon={TrendingUp}>
            <QCTrendsWidget tests={data.tests} />
          </LabPanel>
        </div>
      </div>
    </div>
  );
});

/* --- Sub-Components --- */

const MetricCard = ({ label, value, trend, icon: Icon, variant }: any) => {
  const variants = {
    "brand-primary": {
      bg: "from-brand-primary/10", 
      accent: "bg-brand-primary", 
      text: "text-brand-primary", 
      border: "border-brand-primary/20"
    },
    "brand-sage": { 
      bg: "from-brand-sage/10", 
      accent: "bg-brand-sage", 
      text: "text-brand-sage", 
      border: "border-brand-sage/20" 
    },
    "lab-laser": { 
      bg: "from-red-500/10", 
      accent: "bg-red-500", 
      text: "text-red-500", 
      border: "border-red-500/20" 
    },
    "emerald-500": { 
      bg: "from-emerald-500/10", 
      accent: "bg-emerald-500", 
      text: "text-emerald-500", 
      border: "border-emerald-500/20" 
    },
  };

  const theme = variants[variant as keyof typeof variants] || variants["brand-primary"];
  const isPositive = trend.includes("+");

  return (
    <motion.div 
      whileHover={{ y: -4, scale: 1.02 }}
      className="bg-(--color-zenthar-carbon) border border-brand-sage/10 rounded-2xl p-6 shadow-sm relative group overflow-hidden transition-all duration-300"
    >
      {/* Decorative Background Gradient Blur */}
      <div className={clsx(
        "absolute -right-16 -top-16 w-40 h-40 bg-linear-to-br to-transparent rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700",
        theme.bg
      )} />

      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className="flex items-center gap-2">
          {/* Status Pulse */}
          <div className={clsx(
            "w-2 h-2 rounded-full",
            theme.accent,
            variant !== "emerald-500" && "animate-pulse" 
          )} />
          <span className="text-[10px] font-black text-brand-sage uppercase tracking-[0.2em]">
            {label}
          </span>
        </div>
        
        <div className={clsx(
          "text-[9px] font-bold px-2 py-0.5 rounded-md border backdrop-blur-xs",
          isPositive 
            ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" 
            : "text-brand-sage bg-(--color-zenthar-graphite)/50 border-brand-sage/20"
        )}>
          {trend}
        </div>
      </div>

      <div className="flex items-end justify-between relative z-10">
        <div className="text-5xl font-light text-white tracking-tighter leading-none">
          {value}
        </div>
        
        <div className={clsx(
          "w-12 h-12 rounded-xl flex items-center justify-center border transition-all duration-500 group-hover:rotate-6",
          theme.bg.replace('from-', 'bg-'), // Background fill
          theme.border,
          theme.text
        )}>
          <Icon className="w-6 h-6" />
        </div>
      </div>

      {/* Hover Progress Indicator */}
      <div className={clsx(
        "absolute right-0 top-0 w-48 h-48 bg-linear-to-br to-transparent rounded-full blur-3xl -mr-20 -mt-20 transition-transform duration-700 group-hover:scale-150",
        theme.bg
      )} />
      <div className={clsx(
        "absolute left-0 bottom-0 h-1 w-full bg-linear-to-r to-transparent transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500",
        theme.accent
      )} />
    </motion.div>
  );
};

const AlertItem = ({ alert }: { alert: Notification }) => {
  const isCritical = alert.type.includes("FAILURE") || alert.type.includes("CRITICAL");

  return (
    <div className="flex gap-4 p-4 rounded-xl border border-brand-sage/5 hover:border-brand-primary/20 hover:bg-(--color-zenthar-graphite)/50 hover:shadow-sm transition-all group relative overflow-hidden">
      {/* Side accent strip */}
      <div className={clsx(
        "absolute left-0 top-0 bottom-0 w-1 opacity-0 group-hover:opacity-100 transition-opacity",
        isCritical ? "bg-lab-laser" : "bg-brand-primary"
      )} />
      
      <div className={clsx(
        "mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors",
        isCritical ? "bg-lab-laser/10 text-lab-laser" : "bg-(--color-zenthar-graphite) text-brand-primary"
      )}>
        {isCritical ? <XCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex justify-between items-start mb-1">
          <p className="text-[11px] font-bold text-white leading-tight group-hover:text-brand-primary transition-colors truncate pr-2">
            {alert.message}
          </p>
          <span className="text-[8px] font-mono text-brand-sage/60 shrink-0">
            {new Date(alert.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        <p className="text-[8px] font-mono text-brand-sage uppercase tracking-wider">
          {alert.type.replace(/_/g, " ")}
        </p>
      </div>
    </div>
  );
};

const LoadingState = () => (
  <div className="m-auto flex flex-col items-center gap-3">
    <div className="w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
    <span className="text-[9px] font-black uppercase tracking-widest text-brand-sage">Syncing Data...</span>
  </div>
);

const EmptyAlertsState = () => (
  <div className="m-auto text-center py-10">
    <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-500/30">
      <CheckCircle2 className="w-6 h-6" />
    </div>
    <p className="text-[10px] font-black text-white uppercase tracking-widest">All Systems Nominal</p>
    <p className="text-[9px] text-brand-sage mt-1">No pending alerts requiring action.</p>
  </div>
);

/* --- Helper Logic --- */

function calculateDashboardTrends(samples: Sample[], tests: TestResult[]) {
  const now = Date.now();
  const DAY_MS = 86400000;

  const getCountInWindow = (list: any[], dStart: number, dEnd: number) => 
    list.filter(item => {
      const time = new Date(item.created_at || item.performed_at).getTime();
      return time > now - dStart * DAY_MS && time <= now - dEnd * DAY_MS;
    }).length;

  const getDiff = (curr: number, prev: number) => {
    if (prev === 0) return curr > 0 ? "+100%" : "0%";
    const diff = Math.round(((curr - prev) / prev) * 100);
    return `${diff > 0 ? "+" : ""}${diff}%`;
  };

  const activeS = samples.filter(s => !["COMPLETED", "ARCHIVED"].includes(s.status));
  const pendT = tests.filter(t => t.status === "PENDING");
  const statS = samples.filter(s => s.priority === "STAT");

  return {
    active: getDiff(getCountInWindow(activeS, 1, 0), getCountInWindow(activeS, 2, 1)),
    pending: getDiff(getCountInWindow(pendT, 1, 0), getCountInWindow(pendT, 2, 1)),
    stat: getDiff(getCountInWindow(statS, 1, 0), getCountInWindow(statS, 2, 1)),
  };
}

DashboardFeature.displayName = "DashboardFeature";
export default DashboardFeature;