import React, { memo, useState, useEffect, useCallback, type FC } from "react";
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
  Database,
  Wifi,
  WifiOff,
} from "lucide-react";
import { api } from "../../core/http/client";
import { useNotifications } from "../../capsules/notifications/hooks/useNotifications";
import { useRealtime } from "../../core/providers/RealtimeProvider";
import { motion, AnimatePresence } from "@/src/lib/motion";
import clsx from "@/src/lib/clsx";

interface TelemetryData {
  cpuLoad: string;
  memory: string;
  latency: string;
  uptime: string;
  dbSync: "ACTIVE" | "INACTIVE";
  activeUsers: number;
  errorRate: string;
  throughput: string;
  stats: {
    samples: number;
    pending: number;
  };
}

export const RightRail: FC = memo(() => {
  const { notifications, unreadCount } = useNotifications();
  const { status: sseStatus, isConnected } = useRealtime();
  const [telemetry, setTelemetry] = useState<TelemetryData | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const fetchTelemetry = useCallback(async (signal?: AbortSignal) => {
    setIsSyncing(true);
    try {
      const res = await api.get<TelemetryData>("/telemetry", { signal });
      const data = (res as any)?.data ?? res;
      setTelemetry(data);
    } catch (err: any) {
      if (err.name !== "AbortError")
        console.error("Telemetry fetch failed", err);
    } finally {
      setTimeout(() => setIsSyncing(false), 600);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchTelemetry(controller.signal);
    const interval = setInterval(
      () => fetchTelemetry(controller.signal),
      30_000,
    );
    return () => {
      controller.abort();
      clearInterval(interval);
    };
  }, [fetchTelemetry]);

  return (
    <aside className="w-80 h-full flex flex-col border-l border-(--color-zenthar-steel) bg-(--color-zenthar-void) relative z-40 overflow-hidden">
      {/* Background decor */}
      <div className="absolute inset-0 bg-[url('/assets/grid-dot.svg')] opacity-[0.02] pointer-events-none" />
      <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/5 blur-[80px] pointer-events-none rounded-full" />

      <div className="flex flex-col h-full p-6 gap-8 overflow-y-auto no-scrollbar relative z-10">
        {/* ── SECTION 1: REALTIME STATUS ── */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-3">
            <Radio
              size={14}
              className={clsx(
                "text-brand-primary",
                isSyncing && "animate-pulse",
              )}
            />
            <div>
              <h3 className="text-[10px] font-display font-bold text-(--color-zenthar-text-primary) uppercase tracking-[0.3em]">
                Live_Channel
              </h3>
              <span className="text-[7px] font-mono text-(--color-zenthar-text-muted) uppercase tracking-widest">
                SSE_{sseStatus.toUpperCase()}
              </span>
            </div>
          </div>
          <div
            className={clsx(
              "flex items-center gap-1.5 px-2 py-1 rounded-full text-[8px] font-black uppercase tracking-widest",
              isConnected
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                : "bg-amber-500/10 text-amber-400 border border-amber-500/20",
            )}
          >
            {isConnected ? <Wifi size={10} /> : <WifiOff size={10} />}
            {isConnected ? "Live" : sseStatus}
          </div>
        </div>

        {/* ── SECTION 2: NOTIFICATIONS ── */}
        <div className="flex flex-col gap-4 flex-1 min-h-0">
          <div className="flex items-center justify-between px-1">
            <span className="text-[10px] font-black text-(--color-zenthar-text-primary) uppercase tracking-[0.3em]">
              Intercepts
            </span>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-brand-primary text-[8px] font-mono font-bold text-white animate-pulse">
                {unreadCount}_NEW
              </span>
            )}
          </div>

          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-2 min-h-0">
            <AnimatePresence mode="popLayout" initial={false}>
              {notifications.length === 0 ? (
                <EmptyState key="empty" />
              ) : (
                notifications
                  .slice(0, 8)
                  .map((notif: any) => (
                    <NotificationItem key={notif.id} {...notif} />
                  ))
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ── SECTION 3: DIAGNOSTICS ── */}
        <div className="flex flex-col gap-6 pt-6 border-t border-(--color-zenthar-steel)">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-3">
              <Activity
                size={14}
                className="text-(--color-zenthar-text-muted)"
              />
              <span className="text-[10px] font-black text-(--color-zenthar-text-primary) uppercase tracking-[0.3em]">
                Diagnostics
              </span>
            </div>
            <button
              onClick={() => fetchTelemetry()}
              className="p-1.5 rounded-lg hover:bg-(--color-zenthar-steel) transition-colors"
              title="Refresh telemetry"
            >
              <RefreshCw
                size={12}
                className={clsx(
                  "text-(--color-zenthar-text-muted)",
                  isSyncing && "animate-spin",
                )}
              />
            </button>
          </div>

          {telemetry ? (
            <div className="space-y-5">
              {/* DB sync status */}
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <Database
                    size={12}
                    className={
                      telemetry.dbSync === "ACTIVE"
                        ? "text-emerald-400"
                        : "text-red-400"
                    }
                  />
                  <span className="text-[9px] font-black text-(--color-zenthar-text-muted) uppercase tracking-widest">
                    Database
                  </span>
                </div>
                <span
                  className={clsx(
                    "text-[9px] font-black uppercase",
                    telemetry.dbSync === "ACTIVE"
                      ? "text-emerald-400"
                      : "text-red-400",
                  )}
                >
                  {telemetry.dbSync}
                </span>
              </div>

              {/* Metric bars */}
              <div className="space-y-4">
                <SegmentedMetric
                  icon={Cpu}
                  label="CPU_Load"
                  value={telemetry.cpuLoad}
                  progress={parseInt(telemetry.cpuLoad)}
                />
                <SegmentedMetric
                  icon={Database}
                  label="Memory"
                  value={telemetry.memory.split(" / ")[0]}
                  progress={65}
                />
                <SegmentedMetric
                  icon={Zap}
                  label="DB_Latency"
                  value={telemetry.latency}
                  progress={20}
                  color="bg-emerald-500"
                />
              </div>

              {/* Throughput card */}
              <div className="relative group overflow-hidden rounded-2xl border border-(--color-zenthar-steel) bg-(--color-zenthar-void) p-5">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-[7px] font-black text-brand-primary uppercase tracking-[0.4em]">
                      Throughput
                    </p>
                    <motion.h4
                      key={telemetry.stats.samples}
                      initial={{ opacity: 0.5 }}
                      animate={{ opacity: 1 }}
                      className="text-2xl font-mono font-black text-(--color-zenthar-text-primary) tabular-nums tracking-tighter"
                    >
                      {telemetry.stats.samples.toLocaleString()}
                    </motion.h4>
                  </div>
                  <Fingerprint
                    size={18}
                    className="text-(--color-zenthar-text-muted)"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4 pt-3 border-t border-(--color-zenthar-steel) font-mono text-[10px]">
                  <div>
                    <p className="text-[6px] text-(--color-zenthar-text-muted) uppercase font-black">
                      Pending
                    </p>
                    <p className="text-brand-primary font-bold">
                      {telemetry.stats.pending} REQ
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[6px] text-(--color-zenthar-text-muted) uppercase font-black">
                      Error Rate
                    </p>
                    <p
                      className={clsx(
                        "font-black",
                        parseFloat(telemetry.errorRate) > 5
                          ? "text-red-400"
                          : "text-emerald-500",
                      )}
                    >
                      {telemetry.errorRate}
                    </p>
                  </div>
                </div>
              </div>

              {/* Status badges */}
              <div className="grid grid-cols-2 gap-3">
                <StatusBadge icon={Lock} label="Cipher" value="AES_256" />
                <StatusBadge
                  icon={ShieldCheck}
                  label="Uptime"
                  value={telemetry.uptime}
                />
              </div>
            </div>
          ) : (
            <div className="h-40 flex items-center justify-center border border-dashed border-(--color-zenthar-steel) rounded-2xl">
              <span className="text-[8px] font-mono text-(--color-zenthar-text-muted) animate-pulse uppercase tracking-widest">
                Initializing...
              </span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
});

// ─────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────

const NotificationItem = memo(({ type, message }: any) => {
  const isErr = /ERROR|FAIL|CRIT/i.test(type);
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={clsx(
        "p-3.5 rounded-xl border transition-all cursor-default group",
        isErr
          ? "bg-red-500/10 border-red-500/20 hover:border-red-500/40"
          : "bg-(--color-zenthar-void) border-(--color-zenthar-steel) hover:border-brand-primary/40",
      )}
    >
      <div className="flex items-center gap-2 mb-1.5">
        <div
          className={clsx(
            "w-1 h-1 rounded-full",
            isErr ? "bg-red-500" : "bg-brand-primary",
          )}
        />
        <span
          className={clsx(
            "text-[9px] font-black uppercase tracking-widest",
            isErr ? "text-red-400" : "text-brand-primary",
          )}
        >
          {type}
        </span>
      </div>
      <p className="text-[10px] text-(--color-zenthar-text-secondary) group-hover:text-(--color-zenthar-text-primary) leading-relaxed font-medium transition-colors">
        {message}
      </p>
    </motion.div>
  );
});

const SegmentedMetric = memo(
  ({ label, value, progress, icon: Icon, color = "bg-brand-primary" }: any) => (
    <div className="group/metric">
      <div className="flex justify-between items-end mb-1.5 px-1">
        <div className="flex items-center gap-2">
          <Icon size={10} className="text-(--color-zenthar-text-muted)" />
          <span className="text-[8px] font-black text-(--color-zenthar-text-muted) uppercase tracking-widest">
            {label}
          </span>
        </div>
        <span className="text-[10px] font-mono text-(--color-zenthar-text-primary) tabular-nums">
          {value}
        </span>
      </div>
      <div className="flex gap-1 h-1.5">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className={clsx(
              "flex-1 rounded-[1px] transition-all duration-500",
              progress / 8.3 > i ? color : "bg-(--color-zenthar-steel)",
            )}
          />
        ))}
      </div>
    </div>
  ),
);

const StatusBadge = ({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) => (
  <div className="flex items-center gap-3 p-3 rounded-xl border border-(--color-zenthar-steel) bg-(--color-zenthar-void) hover:bg-(--color-zenthar-steel) transition-all group">
    <Icon
      size={12}
      className="text-(--color-zenthar-text-muted) group-hover:text-brand-primary transition-colors"
    />
    <div className="min-w-0">
      <p className="text-[7px] text-(--color-zenthar-text-secondary) font-black uppercase leading-none mb-0.5">
        {label}
      </p>
      <p className="text-[9px] text-(--color-zenthar-text-primary) font-mono truncate">
        {value}
      </p>
    </div>
  </div>
);

const EmptyState = () => (
  <div className="flex flex-col items-center py-16">
    <ShieldCheck
      size={36}
      strokeWidth={1}
      className="text-(--color-zenthar-steel) mb-3"
    />
    <span className="text-[8px] font-black text-(--color-zenthar-text-muted) opacity-50 uppercase tracking-[.5em]">
      All_Clear
    </span>
  </div>
);

NotificationItem.displayName = "NotificationItem";
SegmentedMetric.displayName = "SegmentedMetric";
RightRail.displayName = "RightRail";
