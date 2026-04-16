import React, { memo, useState, useEffect, useCallback, useRef, type FC } from "react";
import {
  ShieldCheck,
  Terminal,
  Fingerprint,
  RefreshCw,
  Radio,
  Zap,
  Activity,
  Lock,
  LucideIcon,
} from "lucide-react";
import { LabPanel } from "../../ui/components/LabPanel";
import { api } from "../../core/http/client";
import { useNotifications } from "../../capsules/notifications/hooks/useNotifications";
import { motion, AnimatePresence } from "@/src/lib/motion";
import clsx from "@/src/lib/clsx";

/* --- Types --- */

interface TelemetryData {
  cpuLoad: string;
  memory: string;
  latency: string;
  uptime: string;
  stats: {
    samples: number;
    pending: number;
  };
}

/* --- Main Component --- */

export const RightRail: FC = memo(() => {
  const { notifications, unreadCount } = useNotifications();
  const [telemetry, setTelemetry] = useState<TelemetryData | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchTelemetry = useCallback(async (signal?: AbortSignal) => {
    setIsSyncing(true);
    try {
      const res = await api.get<TelemetryData>("/telemetry", { signal });
      const data = (res as any)?.data ?? res;
      
      // Artificial jitter for "live" feel
      const jitter = (val: string) => (parseFloat(val) + (Math.random() * 0.4 - 0.2)).toFixed(2);
      
      setTelemetry({
        ...data,
        cpuLoad: `${jitter(data.cpuLoad)}%`,
        latency: `${Math.floor(parseInt(data.latency) + (Math.random() * 3))}ms`
      });
    } catch (err: any) {
      if (err.name !== 'AbortError') console.error("Telemetry Link Dropped", err);
    } finally {
      // Smooth out the syncing indicator flicker
      setTimeout(() => setIsSyncing(false), 600);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchTelemetry(controller.signal);
    const interval = setInterval(() => fetchTelemetry(controller.signal), 5000);
    return () => {
      controller.abort();
      clearInterval(interval);
    };
  }, [fetchTelemetry]);

  return (
    <aside className="w-85 h-full flex flex-col border-l border-brand-sage/10 bg-(--color-zenthar-carbon)/90 backdrop-blur-2xl relative ml-auto z-40 overflow-hidden">
      {/* 1. FX LAYERS */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,var(--color-brand-primary)_0%,transparent_30%)] opacity-[0.03] pointer-events-none" />
      <div className="absolute top-0 left-0 w-full h-px bg-linear-to-r from-transparent via-brand-primary/20 to-transparent" />

      <div className="flex flex-col h-full p-5 gap-5 overflow-y-auto no-scrollbar">
        
        {/* INTERCEPTS SECTION */}
        <LabPanel
          title="Live Intercepts"
          subtitle="Real-time Node Monitoring"
          icon={Radio}
          className="flex-1 bg-transparent border-none"
          actions={
            <div className="flex items-center gap-3">
              <AnimatePresence>
                {isSyncing && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="w-1.5 h-1.5 rounded-full bg-brand-primary animate-ping"
                  />
                )}
              </AnimatePresence>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-xs bg-brand-primary/10 border border-brand-primary/20 text-[9px] font-black text-brand-primary tabular-nums">
                  {unreadCount}
                </span>
              )}
            </div>
          }
        >
          <div ref={scrollRef} className="flex flex-col gap-2 mt-4 overflow-x-hidden">
            <AnimatePresence mode="popLayout" initial={false}>
              {notifications.length === 0 ? (
                <EmptyState />
              ) : (
                notifications.slice(0, 10).map((notif: any) => (
                  <NotificationItem key={notif.id} {...notif} />
                ))
              )}
            </AnimatePresence>
          </div>
        </LabPanel>

        {/* TACTICAL STATUS SECTION */}
        <LabPanel
          title="Tactical Status"
          subtitle="System Core 01"
          icon={Activity}
          className="shrink-0 bg-white/2 border border-brand-sage/10 rounded-2xl p-4"
        >
          {telemetry ? (
            <div className="space-y-6 pt-2">
              <div className="space-y-3">
                <SegmentedMetric label="CPU_LOAD" value={telemetry.cpuLoad} progress={parseInt(telemetry.cpuLoad)} />
                <SegmentedMetric label="MEM_USED" value={telemetry.memory.split(" / ")[0]} progress={62} />
                <SegmentedMetric label="IO_DELAY" value={telemetry.latency} progress={15} color="bg-emerald-400" />
              </div>

              {/* Main Data Card */}
              <div className="relative group/card overflow-hidden rounded-xl border border-white/5 bg-black/20 p-4">
                <div className="absolute top-0 left-0 w-full h-0.5 bg-brand-primary/40 group-hover:top-full transition-all duration-2000 ease-linear pointer-events-none" />
                
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-[7px] font-black text-brand-primary uppercase tracking-[.3em]">Stream_Throughput</p>
                    <h4 className="text-2xl font-mono font-black text-white tabular-nums tracking-tighter">
                      {telemetry.stats.samples.toLocaleString()}
                    </h4>
                  </div>
                  <Fingerprint size={16} className="text-brand-sage/20 group-hover:text-brand-primary/40 transition-colors" />
                </div>

                <div className="grid grid-cols-2 gap-4 pt-3 border-t border-white/5 font-mono">
                  <div>
                    <p className="text-[6px] text-brand-sage/40 uppercase mb-0.5">Queue</p>
                    <p className="text-[10px] text-brand-primary">{telemetry.stats.pending} REQ</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[6px] text-brand-sage/40 uppercase mb-0.5">Integrity</p>
                    <p className="text-[10px] text-emerald-400">SECURE</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <StatusBadge icon={Lock} label="Link" value="AES_256" />
                <StatusBadge icon={RefreshCw} label="Uptime" value={telemetry.uptime.split(' ')[0]} />
              </div>
            </div>
          ) : (
            <div className="h-40 flex items-center justify-center font-mono text-[9px] text-brand-sage animate-pulse">
              SYNCING_SYSTEM_DATA...
            </div>
          )}
        </LabPanel>
      </div>
    </aside>
  );
});

/* --- Sub-Components --- */

const NotificationItem = memo(({ type, message }: any) => {
  const isErr = /ERROR|FAIL|CRIT/i.test(type);
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={clsx(
        "p-3 rounded-lg border transition-all group cursor-default",
        isErr ? "bg-red-500/5 border-red-500/20 hover:border-red-500/40" : "bg-white/5 border-white/5 hover:border-brand-primary/30"
      )}
    >
      <div className="flex justify-between items-center mb-1.5">
        <span className={clsx("text-[8px] font-black uppercase tracking-tighter", isErr ? "text-red-400" : "text-brand-primary")}>
          {type}
        </span>
        <span className="text-[7px] font-mono text-brand-sage/30">ID_{Math.random().toString(36).slice(2,5).toUpperCase()}</span>
      </div>
      <p className="text-[10px] text-white/60 group-hover:text-white leading-relaxed">{message}</p>
    </motion.div>
  );
});

const SegmentedMetric = memo(({ label, value, progress, color = "bg-brand-primary" }: any) => (
  <div className="group/metric">
    <div className="flex justify-between items-end mb-1.5 px-0.5">
      <span className="text-[8px] font-black text-brand-sage/50 uppercase tracking-widest">{label}</span>
      <span className="text-[10px] font-mono text-white tracking-tighter tabular-nums">{value}</span>
    </div>
    <div className="flex gap-0.5 h-1.5">
      {Array.from({ length: 15 }).map((_, i) => (
        <div 
          key={i} 
          className={clsx(
            "flex-1 rounded-[1px] transition-all duration-300",
            (progress / 6.6) > i ? color : "bg-white/3"
          )}
        />
      ))}
    </div>
  </div>
));

const StatusBadge = ({ icon: Icon, label, value }: { icon: LucideIcon, label: string, value: string }) => (
  <div className="flex items-center gap-3 p-2.5 rounded-xl border border-white/5 bg-white/1 hover:bg-white/4 transition-colors group">
    <Icon size={12} className="text-brand-sage group-hover:text-brand-primary transition-colors" />
    <div className="min-w-0">
      <p className="text-[6px] text-brand-sage/40 font-black uppercase leading-none mb-1">{label}</p>
      <p className="text-[9px] text-white font-mono truncate">{value}</p>
    </div>
  </div>
);

const EmptyState = () => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center py-10 opacity-20">
    <ShieldCheck size={32} strokeWidth={1} className="text-brand-sage mb-4" />
    <span className="text-[8px] font-black uppercase tracking-[.4em]">Zero_Incidents</span>
  </motion.div>
);

/* --- Display Names --- */
NotificationItem.displayName = "NotificationItem";
SegmentedMetric.displayName = "SegmentedMetric";
RightRail.displayName = "RightRail";