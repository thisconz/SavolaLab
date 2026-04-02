import React, { memo, useState, useEffect, useMemo } from "react";
import {
  LayoutDashboard, Bell, AlertCircle, CheckCircle2, XCircle,
  Clock, TrendingUp, BarChart3, PieChart as PieChartIcon,
  Zap, Activity, FlaskConical, ListChecks,
} from "lucide-react";
import { LabPanel } from "../../../ui/components/LabPanel";
import { NotificationApi } from "../../notifications";
import { LabApi } from "../../lab";
import { Notification, Sample, TestResult } from "../../../core/types";

// Import your widgets
import { QCStatsWidget } from "./QCStatsWidget";
import { QCTrendsWidget } from "./QCTrendsWidget";
import { PriorityWidget } from "./PriorityWidget";
import { EfficiencyWidget } from "./EfficiencyWidget";
import { PlantOverviewWidget } from "./PlantOverviewWidget";

export const DashboardFeature: React.FC = memo(() => {
  const [alerts, setAlerts] = useState<Notification[]>([]);
  const [samples, setSamples] = useState<Sample[]>([]);
  const [tests, setTests] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      try {
        const [notificationsRes, samplesRes, testsRes] = await Promise.allSettled([
          NotificationApi.getNotifications(),
          LabApi.getSamples(),
          LabApi.getTests(),
        ]);

        if (!isMounted) return;

        if (notificationsRes.status === "fulfilled") {
          // Casting to shared Notification type to satisfy the state
          setAlerts((notificationsRes.value as any[]).filter((n) => !n.is_read).slice(0, 5));
        }
        if (samplesRes.status === "fulfilled") setSamples(samplesRes.value);
        if (testsRes.status === "fulfilled") setTests(testsRes.value);
      } catch (err) {
        console.error("Dashboard Sync Error:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchData();
    return () => { isMounted = false; };
  }, []);

  const trends = useMemo(() => {
    const now = Date.now();
    const DAY_MS = 86400000;
    
    const getCountInWindow = (list: any[], daysStart: number, daysEnd: number) => {
      return list.filter(item => {
        const time = new Date(item.created_at || item.performed_at).getTime();
        return time > (now - daysStart * DAY_MS) && time <= (now - daysEnd * DAY_MS);
      }).length;
    };

    const calculateTrend = (curr: number, prev: number) => {
      if (prev === 0) return curr > 0 ? "+100%" : "0%";
      const diff = ((curr - prev) / prev) * 100;
      return `${diff > 0 ? "+" : ""}${Math.round(diff)}%`;
    };

    const active = samples.filter(s => s.status !== "COMPLETED" && s.status !== "ARCHIVED");
    const stats = samples.filter(s => s.priority === "STAT");

    return {
      active: calculateTrend(getCountInWindow(active, 1, 0), getCountInWindow(active, 2, 1)),
      pending: calculateTrend(getCountInWindow(tests.filter(t => t.status === "PENDING"), 1, 0), getCountInWindow(tests.filter(t => t.status === "PENDING"), 2, 1)),
      stat: calculateTrend(getCountInWindow(stats, 1, 0), getCountInWindow(stats, 2, 1)),
    };
  }, [samples, tests]);

  return (
    <div className="flex flex-col gap-6 h-full overflow-y-auto pb-8 pr-4 custom-scrollbar">
      
      {/* 1. TOP METRIC STRIP */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
        <MetricCard
          label="Active Samples"
          value={samples.filter(s => !["COMPLETED", "ARCHIVED"].includes(s.status)).length}
          trend={trends.active}
          icon={FlaskConical}
          color="brand-primary"
        />
        <MetricCard
          label="Pending Tests"
          value={tests.filter(t => t.status === "PENDING").length}
          trend={trends.pending}
          icon={ListChecks}
          color="brand-sage"
        />
        <MetricCard
          label="STAT Priority"
          value={samples.filter(s => s.priority === "STAT").length}
          trend={trends.stat}
          icon={Zap}
          color="lab-laser"
        />
        <MetricCard
          label="System Health"
          value="99.8%"
          trend="STABLE"
          icon={Activity}
          color="emerald-500"
        />
      </div>

      {/* 2. PRIMARY ANALYTICS GRID */}
      <div className="grid grid-cols-12 gap-6 items-start">
        <div className="col-span-12 lg:col-span-8 space-y-6">
          <LabPanel title="Plant Throughput" icon={LayoutDashboard}>
            <PlantOverviewWidget samples={samples} />
          </LabPanel>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <LabPanel title="Quality Distribution" icon={PieChartIcon}>
              <QCStatsWidget samples={samples} />
            </LabPanel>
            <LabPanel title="Urgency Heatmap" icon={BarChart3}>
              <PriorityWidget samples={samples} />
            </LabPanel>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-4 space-y-6">
          <LabPanel title="System Alerts" icon={Bell}>
            <div className="flex flex-col min-h-60">
              {loading ? (
                <div className="m-auto flex flex-col items-center gap-2">
                  <div className="w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : alerts.length === 0 ? (
                <div className="m-auto text-center opacity-30">
                  <CheckCircle2 className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-[10px] font-mono uppercase tracking-[0.2em]">All Systems Nominal</p>
                </div>
              ) : (
                alerts.map(alert => (
                  <div key={alert.id} className="flex items-start p-3 border-b border-brand-sage/5 hover:bg-brand-primary/5 transition-colors">
                    <div className="mt-0.5 mr-3 shrink-0 text-brand-primary">
                      {alert.type === "WORKFLOW_FAILURE" ? <XCircle className="w-4 h-4 text-red-500" /> : <AlertCircle className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-bold text-brand-deep leading-tight truncate">{alert.message}</p>
                      <span className="text-[9px] font-mono text-brand-sage/60 uppercase">{alert.type.replace(/_/g, " ")}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </LabPanel>

          <LabPanel title="Processing Efficiency" icon={Activity}>
             <EfficiencyWidget samples={samples} />
          </LabPanel>
        </div>
      </div>

      <div className="col-span-12">
        <LabPanel title="7-Day Quality Trend" icon={TrendingUp}>
          <QCTrendsWidget tests={tests} />
        </LabPanel>
      </div>
    </div>
  );
});

/* --- Internal Components to Fix TS2304 --- */

const MetricCard = ({ label, value, trend, icon: Icon, color }: any) => {
  const colorMap = {
    "brand-primary": "text-brand-primary bg-brand-primary/10",
    "brand-sage": "text-brand-sage bg-brand-sage/10",
    "lab-laser": "text-lab-laser bg-lab-laser/10",
    "emerald-500": "text-emerald-500 bg-emerald-500/10",
  };

  return (
    <div className="bg-white border border-brand-sage/10 rounded-2xl p-6 shadow-sm relative overflow-hidden group">
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className={`p-2 rounded-lg ${(colorMap as any)[color] || colorMap["brand-primary"]}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className={`text-[10px] font-mono font-bold ${trend.startsWith("+") ? "text-emerald-500" : trend.startsWith("-") ? "text-red-500" : "text-brand-sage"}`}>
          {trend}
        </div>
      </div>
      <div className="relative z-10">
        <div className="text-3xl font-bold text-brand-deep tracking-tight mb-1">{value}</div>
        <div className="text-[10px] font-mono text-brand-sage uppercase tracking-[0.2em]">{label}</div>
      </div>
    </div>
  );
};

DashboardFeature.displayName = "DashboardFeature";
export default DashboardFeature;