import React, { memo, useState, useEffect, useCallback, useRef, type FC } from "react";
import {
  ShieldCheck,
  Radio,
  Zap,
  Activity,
  Lock,
  LucideIcon,
  Fingerprint,
  RefreshCw,
  Cpu,
  Database
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

export const RightRail: FC = memo(() => {
  const { notifications, unreadCount } = useNotifications();
  const [telemetry, setTelemetry] = useState<TelemetryData | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const fetchTelemetry = useCallback(async (signal?: AbortSignal) => {
    setIsSyncing(true);
    try {
      const res = await api.get<TelemetryData>("/telemetry", { signal });
      const data = (res as any)?.data ?? res;
      
      // Simulated data jitter for authenticity
      const jitter = (val: string) => (parseFloat(val) + (Math.random() * 0.4 - 0.2)).toFixed(2);
      
      setTelemetry({
        ...data,
        cpuLoad: `${jitter(data.cpuLoad)}%`,
        latency: `${Math.floor(parseInt(data.latency) + (Math.random() * 3))}ms`
      });
    } catch (err: any) {
      if (err.name !== 'AbortError') console.error("Link Failure", err);
    } finally {
      setTimeout(() => setIsSyncing(false), 800);
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
    <aside className="w-80 h-full flex flex-col border-l border-(--color-zenthar-steel) bg-(--color-zenthar-void) relative ml-auto z-40 overflow-hidden">
      {/* HUD ACCENTS */}
      <div className="absolute inset-0 bg-[url('/assets/grid-dot.svg')] opacity-[0.02] pointer-events-none" />
      <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/5 blur-[80px] pointer-events-none rounded-full" />
      
      <div className="flex flex-col h-full p-6 gap-8 overflow-y-auto no-scrollbar relative z-10">
        
        {/* SECTION 1: INTERCEPTS FEED */}
        <div className="flex flex-col gap-4 flex-1 min-h-0">
          <header className="flex items-center justify-between px-1">
            <div className="flex items-center gap-3">
              <Radio size={14} className={clsx("text-brand-primary", isSyncing && "animate-pulse")} />
              <div className="flex flex-col">
                <h3 className="text-[10px] font-display font-bold text-(--color-zenthar-text-primary) uppercase tracking-[0.3em]">Live_Intercepts</h3>
                <span className="text-[7px] font-mono text-(--color-zenthar-text-muted) uppercase tracking-widest">Buffer_Active</span>
              </div>
            </div>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-brand-primary text-[8px] font-mono font-bold text-white animate-pulse">
                {unreadCount}_NEW
              </span>
            )}
          </header>

          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
            <AnimatePresence mode="popLayout" initial={false}>
              {notifications.length === 0 ? (
                <EmptyState />
              ) : (
                notifications.slice(0, 8).map((notif: any) => (
                  <NotificationItem key={notif.id} {...notif} />
                ))
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* SECTION 2: TACTICAL DIAGNOSTICS */}
        <div className="flex flex-col gap-6 pt-6 border-t border-(--color-zenthar-steel)">
          <div className="flex items-center gap-3 px-1">
            <Activity size={14} className="text-(--color-zenthar-text-muted)" />
            <h3 className="text-[10px] font-display font-bold text-(--color-zenthar-text-primary) uppercase tracking-[0.3em]">Core_Diagnostics</h3>
          </div>

          {telemetry ? (
            <div className="space-y-6">
              {/* METRIC STACK */}
              <div className="space-y-4">
                <SegmentedMetric 
                  icon={Cpu}
                  label="Compute_Load" 
                  value={telemetry.cpuLoad} 
                  progress={parseInt(telemetry.cpuLoad)} 
                />
                <SegmentedMetric 
                  icon={Database}
                  label="Memory_Buffer" 
                  value={telemetry.memory.split(" / ")[0]} 
                  progress={68} 
                />
                <SegmentedMetric 
                  icon={Zap}
                  label="I/O_Response" 
                  value={telemetry.latency} 
                  progress={15} 
                  color="bg-emerald-500" 
                />
              </div>

              {/* THROUGHPUT CARD */}
              <div className="relative group overflow-hidden rounded-2xl border border-(--color-zenthar-steel) bg-(--color-zenthar-void) p-5">
                <div className="absolute top-0 left-0 w-full h-0.5 bg-brand-primary/20 blur-[1px] group-hover:top-full transition-all duration-3000 ease-linear" />
                
                <div className="flex justify-between items-start mb-5">
                  <div className="space-y-1">
                    <p className="text-[7px] font-black text-brand-primary uppercase tracking-[.4em]">Throughput_Vol</p>
                    <motion.h4 
                      key={telemetry.stats.samples}
                      initial={{ opacity: 0.5 }}
                      animate={{ opacity: 1 }}
                      className="text-2xl font-mono font-black text-(--color-zenthar-text-primary) tabular-nums tracking-tighter"
                    >
                      {telemetry.stats.samples.toLocaleString()}
                    </motion.h4>
                  </div>
                  <Fingerprint size={18} className="text-(--color-zenthar-text-muted) group-hover:text-brand-primary/40 transition-colors" />
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-(--color-zenthar-steel) font-mono">
                  <div className="space-y-1">
                    <p className="text-[6px] text-(--color-zenthar-text-muted) uppercase font-black">Pending_Tx</p>
                    <p className="text-[11px] text-brand-primary">{telemetry.stats.pending} REQ</p>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="text-[6px] text-(--color-zenthar-text-muted) uppercase font-black">Link_State</p>
                    <p className="text-[11px] text-emerald-500 font-black">STABLE</p>
                  </div>
                </div>
              </div>

              {/* LOWER BADGES */}
              <div className="grid grid-cols-2 gap-3">
                <StatusBadge icon={Lock} label="Cipher" value="AES_256" />
                <StatusBadge icon={RefreshCw} label="Uptime" value={telemetry.uptime.split(' ')[0]} />
              </div>
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center border border-dashed border-(--color-zenthar-steel) rounded-2xl">
              <span className="text-[8px] font-mono text-(--color-zenthar-text-muted) animate-pulse uppercase tracking-widest">Initializing_Uplink...</span>
            </div>
          )}
        </div>
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
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={clsx(
        "p-4 rounded-xl border mb-3 transition-all cursor-default group",
        isErr 
          ? "bg-red-500/10 border-red-500/20 hover:border-red-500/40" 
          : "bg-(--color-zenthar-void) border-(--color-zenthar-steel) hover:border-brand-primary/40"
      )}
    >
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
           <div className={clsx("w-1 h-1 rounded-full", isErr ? "bg-red-500" : "bg-brand-primary")} />
           <span className={clsx("text-[9px] font-black uppercase tracking-widest", isErr ? "text-red-400" : "text-brand-primary")}>
            {type}
          </span>
        </div>
        <span className="text-[7px] font-mono text-[var(--color-zenthar-text-muted)] opacity-60">TX_{Math.random().toString(36).slice(2,5).toUpperCase()}</span>
      </div>
      <p className="text-[10px] text-(--color-zenthar-text-secondary) group-hover:text-(--color-zenthar-text-primary) leading-relaxed font-medium transition-colors">
        {message}
      </p>
    </motion.div>
  );
});

const SegmentedMetric = memo(({ label, value, progress, icon: Icon, color = "bg-brand-primary" }: any) => (
  <div className="group/metric">
    <div className="flex justify-between items-end mb-2 px-1">
      <div className="flex items-center gap-2">
        <Icon size={10} className="text-(--color-zenthar-text-muted) group-hover/metric:text-brand-primary transition-colors" />
        <span className="text-[8px] font-black text-(--color-zenthar-text-muted) group-hover/metric:text-(--color-zenthar-text-primary) uppercase tracking-widest">{label}</span>
      </div>
      <span className="text-[10px] font-mono text-(--color-zenthar-text-primary) tracking-tighter tabular-nums">{value}</span>
    </div>
    {/* Grid Segmented Bar */}
    <div className="flex gap-1 h-1.5">
      {Array.from({ length: 12 }).map((_, i) => (
        <div 
          key={i} 
          className={clsx(
            "flex-1 rounded-[1px] transition-all duration-500",
            (progress / 8.3) > i ? color : "bg-(--color-zenthar-steel)"
          )}
        />
      ))}
    </div>
  </div>
));

const StatusBadge = ({ icon: Icon, label, value }: { icon: LucideIcon, label: string, value: string }) => (
  <div className="flex items-center gap-3 p-3 rounded-xl border border-(--color-zenthar-steel) bg-(--color-zenthar-void) hover:bg-(--color-zenthar-steel) transition-all group">
    <Icon size={12} className="text-(--color-zenthar-text-muted) group-hover:text-brand-primary transition-colors" />
    <div className="min-w-0">
      <p className="text-[7px] text-(--color-zenthar-text-secondary) font-black uppercase leading-none mb-1">{label}</p>
      <p className="text-[9px] text-(--color-zenthar-text-primary) font-mono truncate">{value}</p>
    </div>
  </div>
);

const EmptyState = () => (
  <div className="flex flex-col items-center py-20">
    <ShieldCheck size={40} strokeWidth={1} className="text-(--color-zenthar-steel) mb-4" />
    <span className="text-[8px] font-black text-[var(--color-zenthar-text-muted)] opacity-50 uppercase tracking-[.5em]">Network_Silent</span>
  </div>
);

NotificationItem.displayName = "NotificationItem";
SegmentedMetric.displayName = "SegmentedMetric";
RightRail.displayName = "RightRail";