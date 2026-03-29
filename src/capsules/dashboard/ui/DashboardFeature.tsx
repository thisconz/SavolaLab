import React, { memo, useState, useEffect, useMemo } from "react";
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
} from "lucide-react";
import { LabPanel } from "../../../ui/components/LabPanel";
import { NotificationApi } from "../../notifications";
import { LabApi } from "../../lab";
import { Notification, Sample, TestResult } from "../../../core/types";
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
    const fetchData = async () => {
      try {
        const [notificationsRes, samplesRes, testsRes] =
          await Promise.allSettled([
            NotificationApi.getNotifications(),
            LabApi.getSamples(),
            LabApi.getTests(),
          ]);

        if (notificationsRes.status === "fulfilled") {
          setAlerts(
            notificationsRes.value
              .filter((n) => !n.is_read)
              .slice(
                0,
                5,
              ) as import("../../../core/types/shared.types").Notification[],
          );
        }
        if (samplesRes.status === "fulfilled") {
          setSamples(samplesRes.value);
        }
        if (testsRes.status === "fulfilled") {
          setTests(testsRes.value);
        }
      } catch (err) {
        console.error("Failed to fetch dashboard data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case "SAMPLE_COMPLETED":
        return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case "WORKFLOW_FAILURE":
        return <XCircle className="w-4 h-4 text-lab-laser" />;
      case "OVERDUE_TEST":
        return <Clock className="w-4 h-4 text-amber-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-brand-primary" />;
    }
  };

  const trends = useMemo(() => {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

    const getTrend = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? "+100%" : "0%";
      const percent = Math.round(((current - previous) / previous) * 100);
      return percent > 0 ? `+${percent}%` : `${percent}%`;
    };

    // Active Samples
    const activeSamples = samples.filter(s => s.status !== "COMPLETED" && s.status !== "ARCHIVED");
    const activeToday = activeSamples.filter(s => new Date(s.created_at) > oneDayAgo).length;
    const activeYesterday = activeSamples.filter(s => new Date(s.created_at) > twoDaysAgo && new Date(s.created_at) <= oneDayAgo).length;
    
    // Pending Tests
    const pendingTests = tests.filter(t => t.status === "PENDING");
    const pendingTestsToday = pendingTests.filter(t => {
      const sample = samples.find(s => s.id === t.sample_id);
      return sample && new Date(sample.created_at) > oneDayAgo;
    }).length;
    const pendingTestsYesterday = pendingTests.filter(t => {
      const sample = samples.find(s => s.id === t.sample_id);
      return sample && new Date(sample.created_at) > twoDaysAgo && new Date(sample.created_at) <= oneDayAgo;
    }).length;

    // STAT Requests
    const statSamples = samples.filter(s => s.priority === "STAT");
    const statToday = statSamples.filter(s => new Date(s.created_at) > oneDayAgo).length;
    const statYesterday = statSamples.filter(s => new Date(s.created_at) > twoDaysAgo && new Date(s.created_at) <= oneDayAgo).length;

    return {
      active: getTrend(activeToday, activeYesterday),
      pending: getTrend(pendingTestsToday, pendingTestsYesterday),
      stat: getTrend(statToday, statYesterday),
    };
  }, [samples, tests]);

  return (
    <div className="flex flex-col gap-8 h-full overflow-y-auto pb-8 pr-4 custom-scrollbar">
      {/* Hero Section: Key Metrics */}
      <div className="grid grid-cols-4 gap-6 shrink-0">
        <MetricCard
          label="Active Samples"
          value={
            samples.filter(
              (s) => s.status !== "COMPLETED" && s.status !== "ARCHIVED",
            ).length
          }
          trend={trends.active}
          icon={FlaskConical}
          color="brand-primary"
        />
        <MetricCard
          label="Pending Tests"
          value={tests.filter((t) => t.status === "PENDING").length}
          trend={trends.pending}
          icon={ListChecks}
          color="brand-sage"
        />
        <MetricCard
          label="STAT Requests"
          value={samples.filter((s) => s.priority === "STAT").length}
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

      {/* Top Row: Plant Overview & Alerts */}
      <div className="grid grid-cols-12 gap-6 shrink-0">
        <div className="col-span-8">
          <LabPanel title="Plant Overview" icon={LayoutDashboard}>
            <PlantOverviewWidget samples={samples} />
          </LabPanel>
        </div>

        <div className="col-span-4">
          <LabPanel title="System Alerts" icon={Bell}>
            <div className="flex flex-col">
              {loading ? (
                <div className="flex justify-center p-8">
                  <div className="w-6 h-6 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : alerts.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-[10px] text-brand-sage font-mono uppercase tracking-[0.2em] opacity-50">
                    No Active Alerts
                  </p>
                </div>
              ) : (
                alerts.map((alert) => (
                  <div key={alert.id} className="data-row group">
                    <div className="shrink-0 mr-4 transition-transform group-hover:scale-110">
                      {getIcon(alert.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-brand-deep leading-tight truncate">
                        {alert.message}
                      </p>
                      <p className="text-[9px] text-brand-sage font-mono mt-1 uppercase tracking-tighter">
                        {new Date(alert.created_at).toLocaleTimeString()} •{" "}
                        {alert.type.replace(/_/g, " ")}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </LabPanel>
        </div>
      </div>

      {/* Middle Row: QC Performance & Trends */}
      <div className="grid grid-cols-12 gap-6 shrink-0">
        <div className="col-span-6">
          <LabPanel title="QC Performance" icon={PieChartIcon}>
            <QCStatsWidget samples={samples} />
          </LabPanel>
        </div>
        <div className="col-span-6">
          <LabPanel title="Quality Trends" icon={TrendingUp}>
            <QCTrendsWidget tests={tests} />
          </LabPanel>
        </div>
      </div>

      {/* Bottom Row: Priority & Efficiency */}
      <div className="grid grid-cols-12 gap-6 shrink-0">
        <div className="col-span-6">
          <LabPanel title="Priority Distribution" icon={BarChart3}>
            <PriorityWidget samples={samples} />
          </LabPanel>
        </div>
        <div className="col-span-6">
          <LabPanel title="Lab Efficiency" icon={Zap}>
            <EfficiencyWidget samples={samples} />
          </LabPanel>
        </div>
      </div>

    </div>
  );
});

const MetricCard = ({ label, value, trend, icon: Icon, color }: any) => {
  const colorClasses = {
    "brand-primary": {
      bg: "bg-brand-primary/10",
      text: "text-brand-primary",
      glow: "bg-brand-primary/5",
    },
    "brand-sage": {
      bg: "bg-brand-sage/10",
      text: "text-brand-sage",
      glow: "bg-brand-sage/5",
    },
    "lab-laser": {
      bg: "bg-lab-laser/10",
      text: "text-lab-laser",
      glow: "bg-lab-laser/5",
    },
    "emerald-500": {
      bg: "bg-emerald-500/10",
      text: "text-emerald-500",
      glow: "bg-emerald-500/5",
    },
  }[color as "brand-primary" | "brand-sage" | "lab-laser" | "emerald-500"] || {
    bg: "bg-brand-mist",
    text: "text-brand-sage",
    glow: "bg-brand-mist/50",
  };

  return (
    <div className="bg-white border border-brand-sage/10 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
      <div
        className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700 ${colorClasses.glow}`}
      />

      <div className="flex items-center justify-between mb-4 relative z-10">
        <div
          className={`p-2 rounded-lg ${colorClasses.bg} ${colorClasses.text}`}
        >
          <Icon className="w-5 h-5" />
        </div>
        <div
          className={`text-[10px] font-mono font-bold ${trend.startsWith("+") ? "text-emerald-500" : trend.startsWith("-") ? "text-lab-laser" : "text-brand-sage"}`}
        >
          {trend}
        </div>
      </div>

      <div className="relative z-10">
        <div className="text-3xl font-bold text-brand-deep tracking-tight mb-1">
          {value}
        </div>
        <div className="text-[10px] font-mono text-brand-sage uppercase tracking-[0.2em]">
          {label}
        </div>
      </div>
    </div>
  );
};

DashboardFeature.displayName = "DashboardFeature";
export default DashboardFeature;
