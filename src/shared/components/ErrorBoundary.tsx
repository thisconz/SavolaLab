import React, { Component, ErrorInfo, ReactNode, useState, useEffect } from "react";
import {
  ShieldAlert,
  RefreshCcw,
  Terminal,
  Cpu,
  Download,
  Zap,
  Brain,
  Binary,
  AlertTriangle,
  Activity,
  History,
  ServerCrash,
} from "lucide-react";
import { motion, AnimatePresence } from "../../lib/motion";
import clsx from "@/src/lib/clsx";

/* --- Configuration --- */
const SYSTEM_ID = "0x882_ZENTHAR";
const TELEMETRY_ENDPOINT = "/api/v1/telemetry/fault_report";
const MAX_AUTO_RECOVERY_ATTEMPTS = 3;

interface Props {
  children: ReactNode;
  name?: string;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo, faultId: string) => void;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  faultId: string | null;
  recoveryAttempts: number;
  timestamp: number | null;
  resetKey: number; // Forced remounting logic
}

/* --- Diagnostic Visualizer --- */
const DiagnosticGraph = () => (
  <div className="flex items-end gap-1 h-8 opacity-20">
    {[...Array(12)].map((_, i) => (
      <motion.div
        key={i}
        animate={{ height: [4, Math.random() * 24 + 4, 4] }}
        transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.1 }}
        className="w-1 bg-cyan-500/40 rounded-t-full"
      />
    ))}
  </div>
);

/* --- Enhanced Sidebar --- */
const DiagnosticsSidebar = ({
  timestamp,
  faultId,
  moduleName,
  attempts,
}: {
  timestamp: number | null;
  faultId: string | null;
  moduleName: string;
  attempts: number;
}) => {
  const [uptime, setUptime] = useState(0);

  useEffect(() => {
    if (!timestamp) return;
    const interval = setInterval(() => setUptime(Date.now() - timestamp), 1000);
    return () => clearInterval(interval);
  }, [timestamp]);

  return (
    <div className="w-80 border-r border-white/5 bg-zenthar-graphite/40 backdrop-blur-3xl p-8 flex flex-col justify-between shadow-[20px_0_40px_rgba(0,0,0,0.3)]">
      <div className="space-y-8">
        <div className="flex items-center justify-between pb-6 border-b border-white/5">
          <div className="flex items-center gap-3 text-cyan-500">
            <Activity size={18} className="animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em]">Node_Monitor</span>
          </div>
          <DiagnosticGraph />
        </div>

        <div className="space-y-5">
          <StatMetric label="Kernel Identity" value={SYSTEM_ID} />
          <StatMetric
            label="Fault Protocol"
            value={faultId || "NULL_PTR"}
            isItalic
            color="text-rose-500"
          />
          <StatMetric label="Target Segment" value={moduleName} />
          <StatMetric
            label="Neural Integrity"
            value={attempts > 0 ? `DEGRADED (${attempts})` : "SEVERED"}
            color="text-amber-500"
          />
          <StatMetric label="Execution Path" value="0x77-RECOVERY-MODE" />
        </div>
      </div>

      <div className="bg-black/40 border border-white/10 p-5 rounded-2xl ring-1 ring-white/5">
        <div className="flex justify-between items-center mb-2">
          <span className="text-[9px] text-zinc-500 font-black uppercase tracking-widest">
            Fault_Timer
          </span>
          <History size={12} className="text-zinc-700" />
        </div>
        <div className="text-4xl font-black text-white font-mono tracking-tighter italic">
          {(uptime / 1000).toFixed(1)}
          <span className="text-lg text-rose-500 ml-1">sec</span>
        </div>
      </div>
    </div>
  );
};

const StatMetric = ({
  label,
  value,
  color = "text-zinc-200",
  isItalic = false,
}: {
  label: string;
  value: string;
  color?: string;
  isItalic?: boolean;
}) => (
  <div className="group space-y-1">
    <div className="text-[8px] text-zinc-600 font-black uppercase tracking-[0.25em] group-hover:text-cyan-500/60 transition-colors">
      {label}
    </div>
    <div
      className={clsx(
        "text-[10px] font-mono truncate py-1 px-2 bg-white/5 rounded-md border border-white/5",
        color,
        isItalic && "italic font-black",
      )}
    >
      {value}
    </div>
  </div>
);

/* --- Main Logic --- */
export class ErrorBoundary extends Component<Props, State> {
  public static displayName = "Zenthar_Kernel_Panic";

  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    faultId: null,
    recoveryAttempts: 0,
    timestamp: null,
    resetKey: 0,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      timestamp: Date.now(),
      faultId: `ZNT-${Math.random().toString(36).toUpperCase().substring(2, 7)}`,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    this.reportTelemetry(error, errorInfo);

    if (this.props.onError) {
      this.props.onError(error, errorInfo, this.state.faultId || "ERR");
    }
  }

  private reportTelemetry = async (error: Error, errorInfo: ErrorInfo) => {
    try {
      await fetch(TELEMETRY_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          faultId: this.state.faultId,
          error: error.message,
          stack: errorInfo.componentStack,
          module: this.props.name,
        }),
      });
    } catch (e) {
      console.warn("Telemetry Relay Offline");
    }
  };

  private handleReset = () => {
    this.props.onReset?.();
    this.setState((prev) => ({
      hasError: false,
      error: null,
      errorInfo: null,
      faultId: null,
      recoveryAttempts: prev.recoveryAttempts + 1,
      resetKey: prev.resetKey + 1, // Forces React to treat children as brand new
    }));
  };

  public render() {
    const { hasError, error, faultId, timestamp, recoveryAttempts, resetKey } = this.state;

    if (hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="fixed inset-0 min-h-screen bg-[#050507] flex font-mono select-none z-9999 overflow-hidden text-zinc-300">
          {/* CRT Grille Overlay */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.05] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-size-[100%_2px,3px_100%] z-50" />

          <DiagnosticsSidebar
            timestamp={timestamp}
            faultId={faultId}
            moduleName={this.props.name || "Unknown_Module"}
            attempts={recoveryAttempts}
          />

          <main className="flex-1 flex flex-col p-20 justify-center relative overflow-hidden">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-4xl w-full"
            >
              <header className="flex items-start justify-between mb-16">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-rose-500">
                    <ShieldAlert size={20} className="animate-pulse" />
                    <span className="text-[10px] font-black tracking-[0.5em] uppercase border-b border-rose-500/30 pb-1">
                      Critical_Level_0_Fault
                    </span>
                  </div>
                  <h1 className="text-7xl font-black text-white tracking-tighter italic uppercase leading-[0.85] glitch-text">
                    Kernel
                    <br />
                    Panic
                  </h1>
                </div>
                <ServerCrash
                  size={80}
                  className="text-white/3 absolute -right-10 top-10 rotate-12"
                />
              </header>

              <div className="grid grid-cols-5 gap-6 mb-12">
                {/* Fault Terminal */}
                <div className="col-span-3 space-y-6">
                  <div className="bg-black/60 border border-white/5 rounded-2xl p-6 ring-1 ring-inset ring-white/5 shadow-2xl">
                    <div className="flex items-center gap-2 mb-4 text-zinc-500">
                      <Terminal size={14} />
                      <span className="text-[10px] font-bold uppercase tracking-widest">
                        Stack_Trace_Buffer
                      </span>
                    </div>
                    <div className="max-h-48 overflow-y-auto no-scrollbar rounded-lg bg-rose-500/5 border border-rose-500/10 p-4">
                      <code className="text-xs text-rose-400/80 leading-relaxed break-all">
                        {error?.stack || error?.message || "SYSTEM_TREE_COLLAPSE"}
                      </code>
                    </div>
                  </div>
                </div>

                {/* Status Matrix */}
                <div className="col-span-2 bg-zenthar-graphite/20 border border-white/5 rounded-2xl p-6 flex flex-col justify-between">
                  <div className="text-[10px] text-zinc-600 font-black uppercase tracking-[0.2em] mb-4">
                    Matrix_Status
                  </div>
                  <div className="space-y-3">
                    <StatusItem label="Buffer" value="Overflow" color="text-rose-500" />
                    <StatusItem label="I/O Link" value="Timeout" color="text-amber-500" />
                    <StatusItem label="Encrypted" value="True" color="text-emerald-500" />
                    <StatusItem label="Safe_Mode" value="Active" color="text-cyan-500" />
                  </div>
                  <div className="mt-6 pt-6 border-t border-white/5 text-[9px] text-zinc-500 italic">
                    Attempting to maintain state integrity...
                  </div>
                </div>
              </div>

              {/* Recovery Directives */}
              <div className="grid grid-cols-4 gap-4">
                <TacticalButton
                  icon={<AlertTriangle size={18} />}
                  label="Acknowledge"
                  onClick={() => this.setState({ hasError: false })}
                />
                <TacticalButton
                  icon={<Download size={18} />}
                  label="Core_Dump"
                  onClick={() => this.downloadFaultReport()}
                />
                <TacticalButton
                  icon={<RefreshCcw size={18} />}
                  label="Hot_Reset"
                  variant="active"
                  onClick={this.handleReset}
                />
                <TacticalButton
                  icon={<Zap size={18} />}
                  label="Cold_Reboot"
                  variant="danger"
                  onClick={() => window.location.reload()}
                />
              </div>
            </motion.div>
          </main>

          <style>{`
            .glitch-text { animation: glitch 0.3s steps(2) infinite; }
            @keyframes glitch {
              0% { text-shadow: 2px 0 0 #ff0055, -2px 0 0 #00ffff; }
              50% { text-shadow: -2px 0 0 #ff0055, 2px 0 0 #00ffff; }
              100% { text-shadow: 2px 0 0 #ff0055, -2px 0 0 #00ffff; }
            }
          `}</style>
        </div>
      );
    }

    return <React.Fragment key={resetKey}>{this.props.children}</React.Fragment>;
  }

  private downloadFaultReport = () => {
    const data = {
      faultId: this.state.faultId,
      error: this.state.error?.message,
      stack: this.state.errorInfo?.componentStack,
      timestamp: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `FAULT_${this.state.faultId}.json`;
    a.click();
  };
}

const StatusItem = ({ label, value, color }: { label: string; value: string; color: string }) => (
  <div className="flex justify-between items-center py-2 border-b border-white/5">
    <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-tighter">{label}</span>
    <span className={clsx("text-[10px] font-black italic tracking-widest", color)}>{value}</span>
  </div>
);

const TacticalButton = ({ icon, label, variant = "default", onClick }: any) => (
  <button
    onClick={onClick}
    className={clsx(
      "flex flex-col items-center justify-center p-6 border transition-all rounded-2xl gap-3 group active:scale-95",
      variant === "default" && "bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10",
      variant === "active" &&
        "bg-cyan-500/10 border-cyan-500/30 text-cyan-500 hover:bg-cyan-500 hover:text-black",
      variant === "danger" &&
        "bg-rose-500/10 border-rose-500/30 text-rose-500 hover:bg-rose-500 hover:text-black",
    )}
  >
    {icon}
    <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
  </button>
);
