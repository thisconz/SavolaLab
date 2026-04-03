import React, { memo, useState, useEffect, useCallback, useRef } from "react";
import {
  ShieldCheck,
  Terminal,
  Fingerprint,
  RefreshCw,
  Radio,
  Zap,
  Activity,
  Lock,
} from "lucide-react";
import { LabPanel } from "../../ui/components/LabPanel";
import { api } from "../../core/http/client";
import { useNotifications } from "../../capsules/notifications/hooks/useNotifications";
import { motion, AnimatePresence } from "@/src/lib/motion";
import clsx from "@/src/lib/clsx";

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
  const [isSyncing, setIsSyncing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchTelemetry = useCallback(async (signal?: AbortSignal) => {
    setIsSyncing(true);
    try {
      const res = await api.get<TelemetryData>("/telemetry", { signal });
      const data = (res as any)?.data ?? res;
      const jitter = (val: string) => (parseFloat(val) + (Math.random() * 0.5 - 0.25)).toFixed(2);
      
      setTelemetry({
        ...data,
        cpuLoad: `${jitter(data.cpuLoad)}%`,
        latency: `${Math.floor(parseInt(data.latency) + (Math.random() * 2))}ms`
      });
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      console.error("Critical Telemetry Drop:", err);
    } finally {
      setTimeout(() => setIsSyncing(false), 800);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchTelemetry(controller.signal);
    const interval = setInterval(() => fetchTelemetry(controller.signal), 8000);
    return () => {
      controller.abort();
      clearInterval(interval);
    };
  }, [fetchTelemetry]);

  return (
    <aside className="w-85 h-full flex flex-col gap-6 border-l border-brand-sage/15 p-6 bg-white/40 backdrop-blur-3xl relative ml-auto z-40 overflow-hidden">
      {/* 1. LAYER: TECHNICAL UNDERLAY - Fixed Canonical Gradient Class */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_right,var(--tw-gradient-from)_0%,transparent_40%)] from-brand-primary/5 pointer-events-none" />
      <div className="absolute top-0 left-0 w-full h-0.5 bg-linear-to-r from-transparent via-brand-primary/20 to-transparent opacity-30" />

      {/* 1. LIVE INTERCEPTS PANEL */}
      <LabPanel
        title="Live Intercepts"
        subtitle="Secure Packet Stream"
        icon={Radio}
        className="flex-1 min-h-0 bg-transparent! border-none"
        actions={
          <div className="flex items-center gap-3">
             <AnimatePresence>
              {isSyncing && (
                <motion.span 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="text-[7px] font-mono text-brand-primary animate-pulse"
                >
                  SYNCING_NODE...
                </motion.span>
              )}
            </AnimatePresence>
            {unreadCount > 0 && (
              <div className="flex items-center gap-2 px-2 py-0.5 bg-lab-laser/10 border border-lab-laser/30 rounded-sm">
                <span className="text-[8px] font-black text-lab-laser tabular-nums">{unreadCount}</span>
              </div>
            )}
          </div>
        }
      >
        <div ref={scrollRef} className="flex flex-col gap-2 overflow-y-auto custom-scrollbar h-full pr-1 overflow-x-hidden">
          {/* Fix: Property 'initial' removed from AnimatePresence */}
          <AnimatePresence mode="popLayout">
            {notifications.length === 0 ? (
              <motion.div 
                key="empty" 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                className="flex flex-col items-center justify-center h-48 opacity-20"
              >
                <ShieldCheck size={32} strokeWidth={1} className="text-brand-sage" />
                <span className="text-[7px] font-black uppercase tracking-[.5em] mt-4">No Anomalies</span>
              </motion.div>
            ) : (
              notifications.slice(0, 15).map((notif: any) => (
                <NotificationItem key={notif.id} {...notif} />
              ))
            )}
          </AnimatePresence>
        </div>
      </LabPanel>

      {/* 2. TACTICAL STATUS PANEL */}
      <LabPanel
        title="Tactical Status"
        subtitle="Compute Layer 01"
        icon={Activity}
        className="shrink-0 h-120 bg-brand-mist/10 border-brand-sage/10 rounded-3xl"
      >
        <div className="space-y-6 relative h-full">
          {telemetry ? (
            <>
              <div className="grid gap-4">
                <MetricRow label="CPU_TOTAL_LOAD" value={telemetry.cpuLoad} progress={parseInt(telemetry.cpuLoad)} />
                <MetricRow label="MEM_BUFFER_ALLOC" value={telemetry.memory.split(" / ")[0]} progress={68} color="bg-brand-primary" />
                <MetricRow label="ASYNC_IO_LATENCY" value={telemetry.latency} progress={20} color="bg-emerald-500" />
              </div>

              <div className="relative group/card">
                <motion.div 
                  className="bg-brand-deep rounded-4xl p-6 border border-white/10 shadow-2xl relative z-10 overflow-hidden"
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="absolute top-0 left-0 w-full h-full bg-[url('/assets/grid-mesh.svg')] opacity-10 pointer-events-none" />
                  
                  <div className="flex justify-between items-start mb-6">
                    <div className="space-y-1">
                      <p className="text-[7px] font-black text-brand-primary uppercase tracking-[.4em]">Throughput_Ops</p>
                      <h4 className="text-3xl font-mono font-black text-white tabular-nums tracking-tighter">
                        {telemetry.stats.samples.toLocaleString()}
                      </h4>
                    </div>
                    <div className="p-2 bg-white/5 rounded-lg">
                      <Fingerprint size={14} className="text-brand-primary/50" />
                    </div>
                  </div>

                  <div className="flex items-center gap-4 pt-4 border-t border-white/5">
                    <div className="flex-1">
                      <p className="text-[6px] text-white/30 uppercase font-bold mb-1">Queue_Status</p>
                      <p className="text-xs font-mono font-bold text-brand-primary">{telemetry.stats.pending} REQ</p>
                    </div>
                    <div className="w-px h-6 bg-white/10" />
                    <div className="flex-1 text-right">
                      <p className="text-[6px] text-white/30 uppercase font-bold mb-1">Integrity</p>
                      <p className="text-xs font-mono font-bold text-emerald-500">NOMINAL</p>
                    </div>
                  </div>
                </motion.div>
                <div className="absolute inset-0 bg-brand-primary/20 blur-2xl rounded-4xl opacity-0 group-hover/card:opacity-100 transition-opacity duration-500" />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <StatusPill icon={Lock} label="Link" value="AES_256" />
                <StatusPill icon={RefreshCw} label="Uptime" value={telemetry.uptime.split(' ')[0]} />
              </div>
            </>
          ) : (
             <div className="flex items-center justify-center h-64 italic text-[10px] text-brand-sage animate-pulse font-mono">
               INITIALIZING_DATA_STREAM...
             </div>
          )}
        </div>
      </LabPanel>
    </aside>
  );
});

const NotificationItem = memo(({ type, message }: any) => {
  const isCritical = /FAILURE|ERROR|CRIT/i.test(type);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className={clsx(
        "group p-3 rounded-xl border transition-all duration-300",
        isCritical 
          ? "bg-lab-laser/3 border-lab-laser/20 hover:border-lab-laser/50 shadow-[0_0_15px_rgba(239,68,68,0.05)]" 
          : "bg-white/50 border-brand-sage/10 hover:border-brand-primary/30"
      )}
    >
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <div className={clsx("w-1 h-1 rounded-full", isCritical ? "bg-lab-laser animate-flicker" : "bg-brand-primary")} />
          <span className={clsx("text-[8px] font-black uppercase tracking-widest", isCritical ? "text-lab-laser" : "text-brand-primary")}>
            {type}
          </span>
        </div>
        <span className="text-[7px] font-mono opacity-40">TRC_{Math.random().toString(36).substr(2, 4).toUpperCase()}</span>
      </div>
      <p className="text-[10px] font-medium text-brand-deep/70 group-hover:text-brand-deep leading-snug">
        {message}
      </p>
    </motion.div>
  );
});

const MetricRow = memo(({ label, value, progress, color = "bg-brand-primary" }: any) => (
  <div className="group/metric cursor-default">
    <div className="flex justify-between items-end mb-1.5">
      <span className="text-[8px] font-black text-brand-sage/80 group-hover/metric:text-brand-primary transition-colors uppercase tracking-widest">
        {label}
      </span>
      <span className="text-[10px] font-mono font-black text-brand-deep tabular-nums">
        {value}
      </span>
    </div>
    <div className="h-1.5 w-full bg-brand-mist/50 rounded-full p-0.5 border border-brand-sage/5 overflow-hidden flex gap-0.5">
      {Array.from({ length: 20 }).map((_, i) => (
        <motion.div
          key={i}
          className={clsx(
            "h-full flex-1 rounded-[1px] transition-all duration-500",
            (progress / 5) > i ? color : "bg-brand-sage/10"
          )}
          initial={false}
          animate={{ opacity: (progress / 5) > i ? [0.6, 1, 0.8] : 0.2 }}
          transition={{ duration: 2, repeat: Infinity, delay: i * 0.05 }}
        />
      ))}
    </div>
  </div>
));

const StatusPill = ({ icon: Icon, label, value }: any) => (
  <div className="flex items-center gap-3 p-3 bg-white/40 border border-brand-sage/10 rounded-2xl hover:border-brand-primary/20 transition-all group">
    <div className="p-1.5 bg-brand-mist/50 rounded-lg group-hover:bg-brand-primary/10 transition-colors">
      <Icon size={12} className="text-brand-sage group-hover:text-brand-primary" />
    </div>
    <div>
      <p className="text-[6px] font-black text-brand-sage/60 uppercase tracking-widest">{label}</p>
      <p className="text-[9px] font-mono font-black text-brand-deep uppercase">{value}</p>
    </div>
  </div>
);

NotificationItem.displayName = "NotificationItem";
MetricRow.displayName = "MetricRow";
RightRail.displayName = "RightRail";