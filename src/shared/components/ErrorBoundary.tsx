import React, { Component, type ErrorInfo, type ReactNode, useState, useEffect, useMemo } from "react";
import {
  ShieldAlert,
  RefreshCcw,
  Terminal,
  Download,
  Zap,
  Activity,
  Copy,
  Check,
  Bug,
  Box,
  Layers,
  HardDrive,
  Share2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";

/* --- 1. CORE ARCHITECTURE TYPES --- */

const KERNEL_VERSION = "0.9.8-APEX";

interface Props {
  children: ReactNode;
  name?: string;
  fallback?: ReactNode;
  onError?: (error: Error, info: ErrorInfo, faultId: string) => void;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | undefined;
  errorInfo: ErrorInfo | undefined;
  faultId: string | undefined;
  recoveryAttempts: number;
  timestamp: number | undefined;
  resetKey: number;
  isRecovering: boolean;
  viewMode: "diagnostic" | "vfs" | "telemetry";
}

/* --- 2. UNIQUE MOTION UTILITIES --- */

const ScrambleText = ({ text }: { text: string }) => {
  const [display, setDisplay] = useState(text);
  const chars = "!<>-_\\/[]{}—=+*^?#________";

  useEffect(() => {
    let iteration = 0;
    const interval = setInterval(() => {
      setDisplay((prev) =>
        prev
          .split("")
          .map((_, index) => {
            if (index < iteration) return text[index];
            return chars[Math.floor(Math.random() * chars.length)];
          })
          .join(""),
      );
      if (iteration >= text.length) clearInterval(interval);
      iteration += 1 / 3;
    }, 30);
    return () => clearInterval(interval);
  }, [text]);

  return <span>{display}</span>;
};

/* --- 3. REFINED ERROR TREE COMPONENT --- */

const DiagnosticMatrix = ({
  error,
  visible,
}: {
  error: Error | undefined;
  info: ErrorInfo | undefined;
  visible: boolean;
}) => {
  const [showRaw, setShowRaw] = useState(false);

  // Group stack traces by module if possible
  const organizedStack = useMemo(() => {
    if (!error?.stack) return ["SYSTEM_TREE_COLLAPSE"];
    return error.stack.split("\n").filter((line) => line.trim().length > 0);
  }, [error]);

  return (
    <div
      className={clsx(
        "transition-all duration-700",
        visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
      )}
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="flex gap-2">
          <TabButton active={!showRaw} onClick={() => setShowRaw(false)} label="Diagnostic_Path" />
          <TabButton active={showRaw} onClick={() => setShowRaw(true)} label="Raw_Memory_Dump" />
        </div>
        <div className="flex items-center gap-4">
          <CopyButton content={error?.stack || ""} />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/40 shadow-2xl backdrop-blur-md">
        <div className="custom-scrollbar max-h-[450px] overflow-y-auto p-6 select-text selection:bg-rose-500/30">
          {!showRaw ? (
            <div className="space-y-3">
              {organizedStack.slice(0, 10).map((line, i) => (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  key={i}
                  className="group flex gap-4 rounded-lg border border-transparent p-2 transition-all hover:border-white/5 hover:bg-white/[0.03]"
                >
                  <span className="w-4 font-mono text-[10px] text-zinc-700">
                    {i.toString(16).padStart(2, "0")}
                  </span>
                  <code className="truncate text-[11px] text-zinc-400 transition-colors group-hover:text-rose-400">
                    {line.replace(/at /g, "λ_")}
                  </code>
                </motion.div>
              ))}
            </div>
          ) : (
            <code className="font-mono text-[10px] leading-relaxed whitespace-pre text-rose-500/80">
              {error?.stack}
            </code>
          )}
        </div>
      </div>
    </div>
  );
};

/* --- 4. MAIN KERNEL IMPLEMENTATION --- */

export class ZentharKernelBoundary extends Component<Props, State> {
  public override state: State = {
    hasError: false,
    error: undefined,
    errorInfo: undefined,
    faultId: undefined,
    recoveryAttempts: 0,
    timestamp: undefined,
    resetKey: 0,
    isRecovering: false,
    viewMode: "diagnostic",
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      timestamp: Date.now(),
      faultId: `ZNT-${Math.random().toString(36).toUpperCase().slice(2, 7)}`,
    };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    this.reportTelemetry(error, errorInfo);
  }

  private reportTelemetry = async (_error: Error, _info: ErrorInfo) => {
    try {
      // Functional Mock Call
      console.log(`[ZENTHAR_KERNEL] Reporting Fault ${this.state.faultId}`);
    } catch {
      /* Silent Fail */
    }
  };

  private handleReset = () => {
    this.setState({ isRecovering: true });
    // Simulate "Neural Re-Link"
    setTimeout(() => {
      this.setState((prev) => ({
        hasError: false,
        recoveryAttempts: prev.recoveryAttempts + 1,
        resetKey: prev.resetKey + 1,
        isRecovering: false,
      }));
    }, 1500);
  };

  public override render() {
    const {
      hasError,
      error,
      errorInfo,
      faultId,
      timestamp,
      recoveryAttempts,
      resetKey,
      isRecovering,
      viewMode,
    } = this.state;

    if (hasError) {
      return (
        <div className="fixed inset-0 z-[9999] flex min-h-screen overflow-hidden bg-[#020204] font-mono text-zinc-400">
          {/* Background FX */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute inset-0 animate-pulse bg-[radial-gradient(circle_at_50%_50%,rgba(244,63,94,0.05),transparent)]" />
            <div
              className="absolute inset-0 opacity-[0.02]"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='1' fill-rule='evenodd'%3E%3Ccircle cx='3' cy='3' r='1'/%3E%3C/g%3E%3C/svg%3E")`,
              }}
            />
          </div>

          {/* Left Control Column */}
          <aside className="relative z-20 flex w-20 flex-col items-center gap-8 border-r border-white/5 bg-black/40 py-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/20 text-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.3)]">
              <ShieldAlert size={20} />
            </div>
            <div className="flex flex-1 flex-col gap-4">
              <NavIcon
                icon={<Terminal size={18} />}
                active={viewMode === "diagnostic"}
                onClick={() => this.setState({ viewMode: "diagnostic" })}
              />
              <NavIcon
                icon={<Box size={18} />}
                active={viewMode === "vfs"}
                onClick={() => this.setState({ viewMode: "vfs" })}
              />
              <NavIcon
                icon={<Activity size={18} />}
                active={viewMode === "telemetry"}
                onClick={() => this.setState({ viewMode: "telemetry" })}
              />
            </div>
            <NavIcon icon={<Share2 size={18} />} onClick={() => alert(`Report ID: ${faultId}`)} />
          </aside>

          {/* Main Interface Wrapper */}
          <div className="relative z-10 flex flex-1 flex-col">
            {/* Top Status Bar */}
            <header className="flex h-16 items-center justify-between border-b border-white/5 bg-black/20 px-10 backdrop-blur-xl">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 animate-ping rounded-full bg-rose-500" />
                  <span className="text-[10px] font-black tracking-[0.3em] text-white uppercase">
                    Kernel_Halt
                  </span>
                </div>
                <div className="h-4 w-px bg-white/10" />
                <span className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase">
                  ID: {faultId}
                </span>
              </div>
              <div className="flex items-center gap-8">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-black tracking-tighter text-zinc-600 uppercase">
                    Uptime
                  </span>
                  <Timer start={timestamp} />
                </div>
              </div>
            </header>

            <main className="flex flex-1 items-center justify-center overflow-hidden p-16">
              <AnimatePresence mode="wait">
                {isRecovering ? (
                  <motion.div
                    key="recovery"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 1.1, opacity: 0 }}
                    className="flex flex-col items-center gap-6"
                  >
                    <div className="relative h-24 w-24">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                        className="absolute inset-0 rounded-full border-t-2 border-cyan-500"
                      />
                      <div className="absolute inset-0 flex items-center justify-center text-cyan-500">
                        <Zap size={32} className="animate-pulse" />
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="mb-2 text-xs font-black tracking-[0.8em] text-cyan-400 uppercase">
                        Neural_Re-link_Active
                      </div>
                      <div className="text-[9px] tracking-widest text-zinc-500 uppercase">
                        Rebuilding Virtual DOM Fragment...
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="main"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="grid w-full max-w-6xl grid-cols-12 items-start gap-12"
                  >
                    {/* Left: Content */}
                    <div className="col-span-8 space-y-12">
                      <div>
                        <div className="mb-4 flex items-center gap-3 text-[11px] font-black tracking-[0.6em] text-rose-500 uppercase">
                          <Bug size={14} />
                          <ScrambleText text="FATAL_EXCEPTION_DETECTED" />
                        </div>
                        <h1 className="text-8xl leading-none font-black tracking-tighter text-white uppercase italic">
                          PANIC<span className="text-rose-600">.LOG</span>
                        </h1>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-3 px-2">
                          <div className="h-4 w-1 bg-rose-500" />
                          <span className="text-xs font-bold text-zinc-200">
                            {error?.name || "SystemError"}: {error?.message}
                          </span>
                        </div>
                        <DiagnosticMatrix
                          error={error}
                          info={errorInfo}
                          visible={viewMode === "diagnostic"}
                        />
                      </div>
                    </div>

                    {/* Right: Tactics */}
                    <div className="col-span-4 space-y-6 pt-24">
                      <MetricCard
                        label="Kernel_Target"
                        value={this.props.name || "GLOBAL_ROOT"}
                        icon={<Layers size={14} />}
                      />
                      <MetricCard
                        label="Integrity_Risk"
                        value={recoveryAttempts > 1 ? "CRITICAL" : "MODERATE"}
                        icon={<HardDrive size={14} />}
                        color={recoveryAttempts > 1 ? "text-rose-500" : "text-amber-500"}
                      />

                      <div className="space-y-4 rounded-3xl border border-white/5 bg-white/[0.02] p-8 shadow-inner">
                        <div className="mb-4 text-[10px] font-black tracking-widest text-zinc-600 uppercase">
                          Directives
                        </div>
                        <TacticalBtn
                          label="Initialize_Hot_Reset"
                          icon={<RefreshCcw size={16} />}
                          variant="primary"
                          onClick={this.handleReset}
                        />
                        <TacticalBtn
                          label="Export_Memory_Dump"
                          icon={<Download size={16} />}
                          onClick={this.downloadReport}
                        />
                        <TacticalBtn
                          label="Kill_Process_Tree"
                          icon={<Zap size={16} />}
                          variant="danger"
                          onClick={() => window.location.reload()}
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </main>

            {/* Bottom Info Bar */}
            <footer className="flex h-12 items-center justify-between border-t border-white/5 bg-black/40 px-10 text-[9px] font-black tracking-widest text-zinc-600 uppercase">
              <div className="flex gap-8">
                <span>ZENTHAR_OS_CORE</span>
                <span>REV: {KERNEL_VERSION}</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="h-2 w-2 rounded-full bg-emerald-500/40" />
                <span>Relay_Active</span>
              </div>
            </footer>
          </div>
        </div>
      );
    }
    return <React.Fragment key={resetKey}>{this.props.children}</React.Fragment>;
  }

  private downloadReport = () => {
    const report = {
      id: this.state.faultId,
      error: this.state.error?.message,
      stack: this.state.errorInfo?.componentStack,
      time: new Date(),
    };
    const blob = new Blob([JSON.stringify(report, undefined, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ZENTHAR_APEX_LOG_${this.state.faultId}.json`;
    link.click();
  };
}

/* --- 5. UI ATOMS --- */

const NavIcon = ({ icon, active, onClick }: any) => (
  <button
    onClick={onClick}
    className={clsx(
      "group flex h-12 w-12 items-center justify-center rounded-xl transition-all",
      active ? "bg-white/10 text-white shadow-lg" : "text-zinc-600 hover:bg-white/5 hover:text-white",
    )}
  >
    {icon}
  </button>
);

const TabButton = ({ active, label, onClick }: any) => (
  <button
    onClick={onClick}
    className={clsx(
      "rounded-lg px-4 py-2 text-[9px] font-black tracking-widest uppercase transition-all",
      active ? "bg-white/10 text-white" : "text-zinc-600 hover:text-zinc-400",
    )}
  >
    {label}
  </button>
);

const MetricCard = ({ label, value, icon, color = "text-white" }: any) => (
  <div className="group flex items-center justify-between rounded-2xl border border-white/5 bg-white/[0.02] p-5 transition-colors hover:border-white/10">
    <div className="flex items-center gap-3">
      <div className="text-zinc-700 transition-colors group-hover:text-rose-500">{icon}</div>
      <span className="text-[10px] font-black tracking-tighter text-zinc-500 uppercase">{label}</span>
    </div>
    <span className={clsx("font-mono text-[11px] font-bold", color)}>{value}</span>
  </div>
);

const TacticalBtn = ({ label, icon, variant = "secondary", onClick }: any) => (
  <button
    onClick={onClick}
    className={clsx(
      "group flex w-full items-center justify-between rounded-xl px-6 py-4 text-[10px] font-black tracking-widest uppercase transition-all active:scale-95",
      variant === "secondary"
        ? "bg-white/5 text-zinc-400 hover:bg-white/10"
        : variant === "primary"
          ? "bg-cyan-500 text-black shadow-[0_0_30px_rgba(6,182,212,0.3)]"
          : "border border-rose-500/20 bg-rose-600/20 text-rose-500 hover:bg-rose-600 hover:text-white",
    )}
  >
    <span>{label}</span>
    {icon}
  </button>
);

const CopyButton = ({ content }: { content: string }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-2 text-[10px] font-black text-zinc-500 uppercase transition-colors hover:text-white"
    >
      {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
      {copied ? "Buffer_Synced" : "Copy_Trace"}
    </button>
  );
};

const Timer = ({ start }: { start: number | undefined }) => {
  const [ms, setMs] = useState(0);
  useEffect(() => {
    if (!start) return;
    const timer = setInterval(() => setMs(Date.now() - start), 10);
    return () => clearInterval(timer);
  }, [start]);
  return (
    <span className="text-sm font-black tracking-tighter text-white italic">{(ms / 1000).toFixed(2)}s</span>
  );
};
