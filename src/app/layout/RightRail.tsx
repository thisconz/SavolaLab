import React, { memo, useState, useEffect, useCallback, useRef } from "react";
import {
  ShieldCheck,
  Terminal,
  Fingerprint,
  RefreshCw,
  Radio,
} from "lucide-react";
import { LabPanel } from "../../ui/components/LabPanel";
import { api } from "../../core/http/client";
import { useNotifications } from "../../capsules/notifications/hooks/useNotifications";
import { motion, AnimatePresence } from "@/src/lib/motion";
import clsx from "@/src/lib/clsx";

/**
 * Refined Types
 */
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

export const RightRail: React.FC = memo(() => {
  const { notifications, unreadCount } = useNotifications();
  const [telemetry, setTelemetry] = useState<TelemetryData | null>(null);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchTelemetry = useCallback(async () => {
    try {
      const res = await api.get<TelemetryData>("/telemetry");
      // Deep compare via stringify is expensive; usually, a simple ref check or ID check is better
      // but for telemetry data, we'll keep the logic but optimize the access
      const data = (res as any)?.data ?? res;
      setTelemetry(data);
    } catch (err: any) {
      if (![401, 403].includes(err?.status))
        console.error("Telemetry Sync Failure:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 10000);
    return () => clearInterval(interval);
  }, [fetchTelemetry]);

  return (
    <aside className="w-85 h-full flex flex-col gap-6 border-l border-brand-sage/15 p-6 bg-white/60 backdrop-blur-3xl relative ml-auto shadow-[-30px_0_60px_rgba(0,0,0,0.03)] z-40">
      {/* Visual Anchor: Static Scanning Line */}
      <div className="absolute top-0 left-0 w-[1px] h-full bg-linear-to-b from-transparent via-brand-primary/40 to-transparent opacity-50" />

      {/* 1. LIVE INTERCEPTS: Dynamic Notification Feed */}
      <LabPanel
        title="Live Intercepts"
        subtitle="Real-time Stream"
        icon={Radio}
        className="flex-1 min-h-0 !bg-transparent"
        actions={
          unreadCount > 0 && (
            <div className="flex items-center gap-2 px-3 py-1 bg-lab-laser/10 border border-lab-laser/20 rounded-full">
              <div className="w-1 h-1 rounded-full bg-lab-laser animate-ping" />
              <span className="text-[8px] font-black text-lab-laser uppercase tracking-tighter">
                {unreadCount} Anomalies
              </span>
            </div>
          )
        }
      >
        <div
          ref={scrollRef}
          className="flex flex-col gap-2 overflow-y-auto custom-scrollbar h-full pr-2"
        >
          <AnimatePresence mode="popLayout">
            {notifications.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.15 }}
                className="flex flex-col items-center justify-center h-full text-brand-sage"
              >
                <ShieldCheck size={40} strokeWidth={1.5} />
                <p className="text-[8px] font-black uppercase tracking-[0.6em] mt-5">
                  Perimeter Secure
                </p>
              </motion.div>
            ) : (
              notifications.map((notif: any) => (
                <NotificationItem key={notif.id} {...notif} />
              ))
            )}
          </AnimatePresence>
        </div>
      </LabPanel>

      {/* 2. TACTICAL STATUS: Hardware Metrics */}
      <LabPanel
        title="Tactical Readout"
        subtitle="Environment Telemetry"
        icon={Terminal}
        className="shrink-0 h-[440px] bg-white/40"
      >
        <div className="space-y-6 relative">
          {telemetry ? (
            <>
              {/* Metric Pulse Section */}
              <div className="space-y-4">
                <MetricRow
                  label="CPU_CORE_FREQ"
                  value={telemetry.cpuLoad}
                  progress={parseInt(telemetry.cpuLoad)}
                />
                <MetricRow
                  label="BUFFER_UTILIZATION"
                  value={telemetry.memory.split(" / ")[0]}
                  progress={74}
                />
                <MetricRow
                  label="NET_LATENCY_MS"
                  value={telemetry.latency}
                  status="STABLE"
                  progress={15}
                />
              </div>

              {/* Data Inversion Card: Dark Mode Visual focus */}
              <div className="bg-brand-deep rounded-3xl p-6 relative overflow-hidden group/card shadow-2xl">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover/card:scale-110 transition-transform duration-700">
                  <Fingerprint size={80} className="text-brand-primary" />
                </div>

                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-5">
                    <div className="w-1.5 h-1.5 rounded-full bg-brand-primary shadow-[0_0_8px_#B1BE9B]" />
                    <span className="text-[9px] font-black text-brand-primary/80 tracking-[.4em] uppercase">
                      Processing_Throughput
                    </span>
                  </div>

                  <div className="flex justify-between items-end">
                    <div>
                      <div className="text-3xl font-black font-mono tracking-tighter text-white tabular-nums">
                        {telemetry.stats.samples.toLocaleString()}
                      </div>
                      <div className="text-[8px] font-bold text-brand-primary/40 uppercase tracking-widest mt-1">
                        Samples_Aggregated
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-black font-mono text-brand-primary/90 tabular-nums">
                        {telemetry.stats.pending}
                      </div>
                      <div className="text-[8px] font-bold text-white/20 uppercase tracking-widest">
                        In_Queue
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* System Meta-Footer: Secondary Metrics */}
              <div className="grid grid-cols-2 gap-3">
                <StatusPill
                  label="Link_State"
                  value="ENCRYPTED"
                  color="text-emerald-500"
                />
                <StatusPill
                  label="Sync_Health"
                  value="99.98%"
                  color="text-brand-primary"
                />
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-40">
              <RefreshCw className="w-6 h-6 animate-spin text-brand-primary" />
              <span className="text-[8px] font-black uppercase tracking-widest text-brand-sage">
                Fetching Data...
              </span>
            </div>
          )}
        </div>
      </LabPanel>
    </aside>
  );
});

/**
 * Sub-Components with refined styling
 */

const NotificationItem = ({ type, message }: any) => {
  const isCritical =
    type.includes("FAILURE") ||
    type.includes("OVERDUE") ||
    type.includes("ERROR");

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={clsx(
        "group relative p-4 rounded-2xl border-l-4 transition-all cursor-pointer",
        "bg-brand-mist/20 hover:bg-white hover:shadow-xl hover:shadow-brand-primary/5",
        isCritical
          ? "border-lab-laser bg-lab-laser/[0.03]"
          : "border-brand-primary",
      )}
    >
      <div className="flex justify-between items-center mb-1.5">
        <span
          className={clsx(
            "text-[9px] font-black uppercase tracking-widest",
            isCritical ? "text-lab-laser" : "text-brand-primary",
          )}
        >
          {type.replace(/_/g, " ")}
        </span>
        <span className="text-[8px] font-mono opacity-30 tabular-nums">
          00:{Math.floor(Math.random() * 60)}s
        </span>
      </div>
      <p className="text-[10px] font-bold text-brand-deep/70 leading-relaxed group-hover:text-brand-deep transition-colors">
        {message}
      </p>
    </motion.div>
  );
};

const MetricRow = ({ label, value, progress, status }: any) => (
  <div className="space-y-2 group/metric">
    <div className="flex justify-between items-end">
      <span className="text-[9px] font-black text-brand-sage group-hover/metric:text-brand-deep transition-colors uppercase tracking-widest">
        {label}
      </span>
      <span
        className={clsx(
          "text-[11px] font-mono font-black tabular-nums",
          status === "STABLE" ? "text-brand-primary" : "text-brand-deep",
        )}
      >
        {value}
      </span>
    </div>
    <div className="h-[4px] w-full bg-brand-mist/40 rounded-full overflow-hidden flex gap-[2px]">
      {[...Array(12)].map((_, i) => (
        <div
          key={i}
          className={clsx(
            "h-full flex-1 transition-all duration-700 ease-out",
            (progress || 0) / 8.3 > i
              ? "bg-brand-primary opacity-100"
              : "bg-brand-sage/10 opacity-30",
          )}
          style={{ transitionDelay: `${i * 30}ms` }}
        />
      ))}
    </div>
  </div>
);

const StatusPill = ({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) => (
  <div className="p-3 bg-brand-mist/30 border border-brand-sage/5 rounded-2xl flex flex-col gap-1">
    <p className="text-[7px] font-black text-brand-sage/60 uppercase tracking-widest">
      {label}
    </p>
    <p
      className={clsx(
        "text-[10px] font-black uppercase tracking-tighter",
        color,
      )}
    >
      {value}
    </p>
  </div>
);

RightRail.displayName = "RightRail";
