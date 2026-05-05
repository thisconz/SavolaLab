import { memo, useState, useEffect, useCallback, type FC } from "react";
import {
  ShieldCheck,
  Radio,
  Zap,
  Activity,
  Lock,
  type LucideIcon,
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
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";

interface TelemetryData {
  cpuLoad: string;
  memory: string;
  latency: string;
  uptime: string;
  dbSync: "ACTIVE" | "INACTIVE";
  activeUsers: number;
  errorRate: string;
  throughput: string;
  stats: { samples: number; pending: number };
}

export const RightRail: FC = memo(() => {
  const { notifications, unreadCount } = useNotifications();
  const { status: sseStatus, isConnected } = useRealtime();
  const [telemetry, setTelemetry] = useState<TelemetryData | undefined>(undefined);
  const [isSyncing, setIsSyncing] = useState(false);

  const fetchTelemetry = useCallback(async (signal?: AbortSignal) => {
    setIsSyncing(true);
    try {
      const res = await api.get<TelemetryData>("/telemetry", { signal });
      const data = (res as any)?.data ?? res;
      setTelemetry(data);
    } catch (err: any) {
      if (err.name === "AbortError") return;
      if (err.status === 401 || err.status === 403) return;
    } finally {
      setTimeout(() => setIsSyncing(false), 600);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchTelemetry(controller.signal);
    const interval = setInterval(() => fetchTelemetry(controller.signal), 30_000);
    return () => {
      controller.abort();
      clearInterval(interval);
    };
  }, [fetchTelemetry]);

  return (
    <aside
      className="relative flex h-full w-72 flex-col overflow-hidden"
      style={{
        background: "linear-gradient(180deg, rgba(5,5,15,0.99) 0%, rgba(8,8,26,0.98) 100%)",
        borderLeft: "1px solid rgba(100,120,200,0.1)",
      }}
    >
      {/* Grid background */}
      <div className="instrument-grid pointer-events-none absolute inset-0 opacity-50" />

      {/* Left border glow */}
      <div
        className="pointer-events-none absolute top-0 bottom-0 left-0 w-px"
        style={{
          background:
            "linear-gradient(180deg, transparent 0%, rgba(244,63,94,0.3) 30%, rgba(139,92,246,0.3) 70%, transparent 100%)",
        }}
      />

      {/* Ambient glow */}
      <div
        className="pointer-events-none absolute top-0 right-0 h-32 w-32 rounded-full blur-[60px]"
        style={{ background: "rgba(244,63,94,0.04)" }}
      />

      <div className="no-scrollbar relative z-10 flex h-full flex-col gap-6 overflow-y-auto p-5">
        {/* ── LIVE CHANNEL ── */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Radio size={13} className={clsx("text-brand-primary", isSyncing && "animate-pulse")} />
            <div>
              <h3 className="text-zenthar-text-primary text-[9px] font-black tracking-[0.3em] uppercase">
                Live_Channel
              </h3>
              <span className="text-zenthar-text-muted font-mono text-[7px] tracking-widest uppercase">
                SSE_{sseStatus.toUpperCase()}
              </span>
            </div>
          </div>

          <div
            className="flex items-center gap-1.5 rounded-full px-2 py-1 text-[8px] font-black tracking-widest uppercase"
            style={{
              background: isConnected ? "rgba(16,185,129,0.08)" : "rgba(245,158,11,0.08)",
              border: `1px solid ${isConnected ? "rgba(16,185,129,0.25)" : "rgba(245,158,11,0.25)"}`,
              color: isConnected ? "#10b981" : "#f59e0b",
              boxShadow: isConnected ? "0 0 8px rgba(16,185,129,0.2)" : "none",
            }}
          >
            {isConnected ? <Wifi size={9} /> : <WifiOff size={9} />}
            {isConnected ? "Live" : sseStatus}
          </div>
        </div>

        {/* ── NOTIFICATIONS ── */}
        <div className="flex min-h-0 flex-1 flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-zenthar-text-primary text-[9px] font-black tracking-[0.3em] uppercase">
              Intercepts
            </span>
            {unreadCount > 0 && (
              <span
                className="animate-pulse rounded-full px-2 py-0.5 font-mono text-[8px] font-bold text-white"
                style={{ background: "#f43f5e", boxShadow: "0 0 8px rgba(244,63,94,0.5)" }}
              >
                {unreadCount}_NEW
              </span>
            )}
          </div>

          <div className="custom-scrollbar min-h-0 flex-1 space-y-2 overflow-y-auto">
            <AnimatePresence mode="popLayout" initial={false}>
              {notifications.length === 0 ? (
                <EmptyState key="empty" />
              ) : (
                notifications.slice(0, 8).map((notif: any) => <NotificationItem key={notif.id} {...notif} />)
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ── DIAGNOSTICS ── */}
        <div className="flex flex-col gap-4 pt-4" style={{ borderTop: "1px solid rgba(100,120,200,0.1)" }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity size={13} className="text-zenthar-text-muted" />
              <span className="text-zenthar-text-primary text-[9px] font-black tracking-[0.3em] uppercase">
                Diagnostics
              </span>
            </div>
            <button
              onClick={() => fetchTelemetry()}
              className="text-zenthar-text-muted hover:text-brand-primary rounded-lg p-1.5 transition-all"
              style={{ background: "rgba(8,8,26,0.8)", border: "1px solid rgba(100,120,200,0.1)" }}
            >
              <RefreshCw size={11} className={clsx(isSyncing && "animate-spin")} />
            </button>
          </div>

          {telemetry ? (
            <div className="space-y-4">
              {/* DB status */}
              <div
                className="flex items-center justify-between rounded-xl px-3 py-2"
                style={{
                  background:
                    telemetry.dbSync === "ACTIVE" ? "rgba(16,185,129,0.06)" : "rgba(239,68,68,0.06)",
                  border: `1px solid ${telemetry.dbSync === "ACTIVE" ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)"}`,
                }}
              >
                <div className="flex items-center gap-2">
                  <Database
                    size={11}
                    style={{ color: telemetry.dbSync === "ACTIVE" ? "#10b981" : "#ef4444" }}
                  />
                  <span className="text-zenthar-text-muted text-[8px] font-black tracking-widest uppercase">
                    Database
                  </span>
                </div>
                <span
                  className="text-[8px] font-black uppercase"
                  style={{ color: telemetry.dbSync === "ACTIVE" ? "#10b981" : "#ef4444" }}
                >
                  {telemetry.dbSync}
                </span>
              </div>

              {/* Metrics */}
              <div className="space-y-3">
                <SegmentedMetric
                  icon={Cpu}
                  label="CPU_Load"
                  value={telemetry.cpuLoad}
                  progress={parseInt(telemetry.cpuLoad)}
                  color="rgba(244,63,94,1)"
                />
                <SegmentedMetric
                  icon={Database}
                  label="Memory"
                  value={telemetry.memory.split(" / ")[0]}
                  progress={65}
                  color="rgba(139,92,246,1)"
                />
                <SegmentedMetric
                  icon={Zap}
                  label="DB_Latency"
                  value={telemetry.latency}
                  progress={20}
                  color="rgba(16,185,129,1)"
                />
              </div>

              {/* Throughput card */}
              <div
                className="relative overflow-hidden rounded-xl p-4"
                style={{
                  background: "linear-gradient(135deg, rgba(244,63,94,0.06) 0%, rgba(8,8,26,0.95) 100%)",
                  border: "1px solid rgba(244,63,94,0.15)",
                }}
              >
                <div className="mb-3 flex items-start justify-between">
                  <div>
                    <p className="text-brand-primary mb-1 text-[7px] font-black tracking-[0.4em] uppercase">
                      Throughput
                    </p>
                    <motion.h4
                      key={telemetry.stats.samples}
                      initial={{ opacity: 0.5 }}
                      animate={{ opacity: 1 }}
                      className="text-zenthar-text-primary font-mono text-2xl font-black tracking-tighter tabular-nums"
                      style={{ textShadow: "0 0 20px rgba(244,63,94,0.4)" }}
                    >
                      {telemetry.stats.samples.toLocaleString()}
                    </motion.h4>
                  </div>
                  <Fingerprint size={16} className="text-zenthar-text-muted opacity-40" />
                </div>

                <div
                  className="grid grid-cols-2 gap-3 pt-3 font-mono text-[9px]"
                  style={{ borderTop: "1px solid rgba(100,120,200,0.1)" }}
                >
                  <div>
                    <p className="text-zenthar-text-muted mb-0.5 text-[6px] font-black uppercase">Pending</p>
                    <p className="text-brand-primary font-bold">{telemetry.stats.pending} REQ</p>
                  </div>
                  <div className="text-right">
                    <p className="text-zenthar-text-muted mb-0.5 text-[6px] font-black uppercase">
                      Error Rate
                    </p>
                    <p
                      className="font-black"
                      style={{ color: parseFloat(telemetry.errorRate) > 5 ? "#ef4444" : "#10b981" }}
                    >
                      {telemetry.errorRate}
                    </p>
                  </div>
                </div>
              </div>

              {/* Status badges */}
              <div className="grid grid-cols-2 gap-2">
                <StatusBadge icon={Lock} label="Cipher" value="AES_256" />
                <StatusBadge icon={ShieldCheck} label="Uptime" value={telemetry.uptime} />
              </div>
            </div>
          ) : (
            <div
              className="flex h-36 items-center justify-center rounded-xl"
              style={{ border: "1px dashed rgba(100,120,200,0.1)" }}
            >
              <span className="text-zenthar-text-muted animate-pulse font-mono text-[8px] tracking-widest uppercase">
                Initializing...
              </span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
});

// ── Sub-components ────────────────────────────────────────────────────────────

const NotificationItem = memo(({ type, message }: any) => {
  const isErr = /ERROR|FAIL|CRIT|LOCK/i.test(type);
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="cursor-default rounded-xl p-3 transition-all"
      style={{
        background: isErr ? "rgba(244,63,94,0.06)" : "rgba(8,8,26,0.8)",
        border: `1px solid ${isErr ? "rgba(244,63,94,0.2)" : "rgba(100,120,200,0.1)"}`,
      }}
    >
      <div className="mb-1.5 flex items-center gap-2">
        <div
          className="h-1 w-1 rounded-full"
          style={{
            background: isErr ? "#f43f5e" : "#f43f5e",
            boxShadow: `0 0 4px ${isErr ? "#f43f5e" : "#f43f5e"}`,
          }}
        />
        <span
          className="text-[8px] font-black tracking-widest uppercase"
          style={{ color: isErr ? "#f43f5e" : "rgba(244,63,94,0.7)" }}
        >
          {type}
        </span>
      </div>
      <p className="text-zenthar-text-secondary text-[10px] leading-relaxed font-medium">{message}</p>
    </motion.div>
  );
});

const SegmentedMetric = memo(({ label, value, progress, icon: Icon, color }: any) => (
  <div>
    <div className="mb-1.5 flex items-end justify-between px-0.5">
      <div className="flex items-center gap-1.5">
        <Icon size={9} className="text-zenthar-text-muted" />
        <span className="text-zenthar-text-muted text-[7px] font-black tracking-widest uppercase">
          {label}
        </span>
      </div>
      <span className="text-zenthar-text-primary font-mono text-[9px] tabular-nums">{value}</span>
    </div>
    <div className="flex h-1 gap-0.5">
      {Array.from({ length: 16 }).map((_, i) => (
        <div
          key={i}
          className="flex-1 rounded-[1px] transition-all duration-500"
          style={{
            background: progress / 6.25 > i ? color : "rgba(100,120,200,0.1)",
            boxShadow: progress / 6.25 > i && i > 12 ? `0 0 4px ${color}` : "none",
          }}
        />
      ))}
    </div>
  </div>
));

const StatusBadge = ({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) => (
  <div
    className="flex items-center gap-2 rounded-xl p-2.5 transition-all"
    style={{
      background: "rgba(8,8,26,0.8)",
      border: "1px solid rgba(100,120,200,0.1)",
    }}
  >
    <Icon size={11} className="text-zenthar-text-muted" />
    <div className="min-w-0">
      <p className="text-zenthar-text-muted mb-0.5 text-[6px] leading-none font-black uppercase">{label}</p>
      <p className="text-zenthar-text-primary truncate font-mono text-[8px]">{value}</p>
    </div>
  </div>
);

const EmptyState = () => (
  <div className="flex flex-col items-center py-12">
    <ShieldCheck size={28} strokeWidth={1} className="text-zenthar-text-muted mb-3 opacity-20" />
    <span className="text-zenthar-text-muted text-[8px] font-black tracking-[.5em] uppercase opacity-40">
      All_Clear
    </span>
  </div>
);

NotificationItem.displayName = "NotificationItem";
SegmentedMetric.displayName = "SegmentedMetric";
RightRail.displayName = "RightRail";
