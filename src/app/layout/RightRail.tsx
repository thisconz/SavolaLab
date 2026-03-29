import React, { memo, useState, useEffect, useCallback } from "react";
import { Bell, ShieldCheck, Activity, Terminal, RefreshCw } from "lucide-react";
import { LabPanel } from "../../ui/components/LabPanel";
import { api } from "../../core/http/client";
import { useNotifications } from "../../capsules/notifications/hooks/useNotifications";

interface TelemetryData {
  cpuLoad: string;
  memory: string;
  latency: string;
  dbSync: string;
  uptime: string;
  activeUsers: number;
  errorRate: string;
  throughput: string;
  stats: {
    samples: number;
    pending: number;
    lastAudit: string | null;
  };
}

/**
 * RightRail: Stable layout component for secondary information.
 * Displays notifications, audit logs, and system telemetry.
 */
export const RightRail: React.FC = memo(() => {
  // 1. Notifications are now handled globally. No local state or polling needed here.
  const { notifications, unreadCount } = useNotifications();
  
  const [telemetry, setTelemetry] = useState<TelemetryData | null>(null);
  const [loading, setLoading] = useState(true);

  // 2. Fetch Telemetry (The backend now handles the optimized Sample counting)
  const fetchTelemetry = useCallback(async () => {
    try {
    const telRes = await api.get<TelemetryData>("/telemetry");
    const rawTel = telRes as any;
    const newTel = rawTel?.data ?? rawTel;

    setTelemetry(prev => {
      // If previous state is null, definitely update
      if (!prev) return newTel;
      
      // Compare current state to new data
      return JSON.stringify(prev) === JSON.stringify(newTel) ? prev : newTel;
    });
  } catch (err: any) {
    if (err?.status !== 401 && err?.status !== 403) {
      console.error("Failed to fetch telemetry", err);
    }
  } finally {
    setLoading(false);
  }
}, []);

  useEffect(() => {
    fetchTelemetry();
    // 10s interval is fine for telemetry because the query is now optimized on the backend
    const interval = setInterval(fetchTelemetry, 10000);
    return () => clearInterval(interval);
  }, [fetchTelemetry]);

  const formatTimeAgo = (dateStr: string) => {
    const now = new Date();
    const date = new Date(dateStr);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "just now";
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  return (
    <div className="flex flex-col gap-6 h-full overflow-hidden">
      {/* NOTIFICATIONS PANEL */}
      <LabPanel
        title={
          <div className="flex items-center gap-2">
            <span>Notifications</span>
            {unreadCount > 0 && (
              <span className="px-1.5 py-0.5 bg-lab-laser text-white text-[8px] font-black rounded-md">
                {unreadCount}
              </span>
            )}
          </div>
        }
        icon={Bell}
        className="h-1/2"
        onRefresh={fetchTelemetry}
        loading={loading}
      >
        <div className="flex flex-col gap-3 overflow-y-auto custom-scrollbar pr-1">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 opacity-30">
              <Bell className="w-8 h-8 mb-2 text-brand-sage" />
              <p className="text-[10px] font-mono uppercase tracking-widest">
                No active alerts
              </p>
            </div>
          ) : (
            notifications.slice(0, 5).map((notif) => (
              <NotificationItem
                key={notif.id}
                type={
                  notif.type === "OVERDUE_TEST" ? "STAT" : 
                  notif.type === "WORKFLOW_FAILURE" ? "ALERT" : "INFO"
                }
                title={notif.type.replace(/_/g, " ")}
                time={formatTimeAgo(notif.created_at)}
                message={notif.message}
              />
            ))
          )}
        </div>
      </LabPanel>

      {/* SYSTEM TELEMETRY PANEL */}
      <LabPanel
        title={
          <div className="flex items-center gap-2">
            <span>System Telemetry</span>
            <div className="flex items-center gap-1 px-1.5 py-0.5 bg-brand-primary/10 rounded-full">
              <div className="w-1 h-1 bg-brand-primary rounded-full animate-pulse" />
              <span className="text-[7px] font-black text-brand-primary uppercase tracking-widest">
                Live
              </span>
            </div>
          </div>
        }
        icon={Terminal}
        className="h-1/2"
      >
        <div className="flex flex-col gap-4 h-full overflow-y-auto custom-scrollbar pr-1">
          {telemetry ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <TelemetryItem
                  label="CPU Load"
                  value={telemetry.cpuLoad}
                  status={
                    parseInt(telemetry.cpuLoad) > 80 ? "CRITICAL" : "NORMAL"
                  }
                />
                <TelemetryItem
                  label="Memory"
                  value={telemetry.memory.split(" / ")[0]}
                  status="NORMAL"
                />
                <TelemetryItem
                  label="Latency"
                  value={telemetry.latency}
                  status="OPTIMAL"
                />
                <TelemetryItem
                  label="DB Sync"
                  value={telemetry.dbSync}
                  status="OPTIMAL"
                />
              </div>

              <div className="h-px bg-brand-sage/10 my-1" />

              <div className="grid grid-cols-2 gap-3">
                <TelemetryItem label="Uptime" value={telemetry.uptime} />
                <TelemetryItem
                  label="Active Users"
                  value={telemetry.activeUsers}
                />
                <TelemetryItem
                  label="Error Rate"
                  value={telemetry.errorRate}
                  status={
                    parseInt(telemetry.errorRate) > 5 ? "CRITICAL" : "OPTIMAL"
                  }
                />
                <TelemetryItem
                  label="Throughput"
                  value={telemetry.throughput.split(" ")[0]}
                />
              </div>

              <div className="grid grid-cols-2 gap-2 mt-2">
                <div className="p-2 bg-brand-mist/20 rounded-lg border border-brand-sage/5">
                  <div className="text-[8px] text-brand-sage uppercase font-mono">
                    Total Samples
                  </div>
                  <div className="text-sm font-bold text-brand-deep">
                    {telemetry.stats.samples}
                  </div>
                </div>
                <div className="p-2 bg-brand-mist/20 rounded-lg border border-brand-sage/5">
                  <div className="text-[8px] text-brand-sage uppercase font-mono">
                    Pending Tests
                  </div>
                  <div className="text-sm font-bold text-brand-deep">
                    {telemetry.stats.pending}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-20">
              <div className="w-4 h-4 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          <div className="mt-auto pt-4 border-t border-brand-sage/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[8px] font-mono text-brand-sage uppercase tracking-widest">
                <ShieldCheck className="w-3 h-3 text-brand-primary" />
                Audit Trail:{" "}
                <span className="text-brand-primary">Verified</span>
              </div>
              {telemetry?.stats.lastAudit && (
                <span className="text-[7px] font-mono text-brand-sage opacity-60">
                  Last:{" "}
                  {new Date(telemetry.stats.lastAudit).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              )}
            </div>
          </div>
        </div>
      </LabPanel>
    </div>
  );
});

const NotificationItem = ({ type, title, time, message }: any) => (
  <div className="p-3 bg-brand-mist/30 border border-brand-sage/10 rounded-lg hover:border-brand-primary/20 transition-all cursor-pointer group">
    <div className="flex items-center justify-between mb-1">
      <span
        className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-widest ${
          type === "STAT"
            ? "bg-lab-laser/10 text-lab-laser"
            : type === "ALERT"
              ? "bg-brand-sodium/10 text-brand-sodium"
              : "bg-brand-primary/10 text-brand-primary"
        }`}
      >
        {type}
      </span>
      <span className="text-[8px] text-brand-sage font-mono group-hover:text-brand-primary transition-colors">
        {time}
      </span>
    </div>
    <h4 className="text-[10px] font-bold text-brand-deep mb-1 uppercase tracking-tight">
      {title}
    </h4>
    <p className="text-[9px] text-brand-sage leading-relaxed line-clamp-2">
      {message}
    </p>
  </div>
);

const TelemetryItem = ({ label, value, status }: any) => (
  <div className="flex items-center justify-between">
    <span className="text-[10px] text-brand-sage font-mono uppercase tracking-tighter">
      {label}
    </span>
    <div className="flex items-center gap-2">
      <span className="text-[10px] font-bold text-brand-deep font-mono">
        {value}
      </span>
      <div
        className={`w-1.5 h-1.5 rounded-full ${
          status === "OPTIMAL"
            ? "bg-brand-primary shadow-[0_0_8px_rgba(177,190,155,0.6)]"
            : status === "CRITICAL"
              ? "bg-lab-laser shadow-[0_0_8px_rgba(239,68,68,0.6)]"
              : "bg-brand-sage"
        }`}
      />
    </div>
  </div>
);

RightRail.displayName = "RightRail";
