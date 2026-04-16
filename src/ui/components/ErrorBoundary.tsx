// src/ui/components/ErrorBoundary.tsx
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
  AlertTriangle 
} from "lucide-react";
import { motion, AnimatePresence } from "../../lib/motion";
import clsx from "@/src/lib/clsx";

/* --- Configuration --- */
const SYSTEM_ID = "0x882_ZENTHAR // WARDEN_CORE";
const TELEMETRY_ENDPOINT = "/api/v1/telemetry/fault_report";
const MAX_AUTO_RECOVERY_ATTEMPTS = 2;

interface Props {
  children: ReactNode;
  name?: string; // moduleName
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
}

/* --- System Analytics Sidebar --- */
const DiagnosticsSidebar = ({ timestamp, faultId, moduleName }: { 
  timestamp: number | null, 
  faultId: string | null,
  moduleName: string 
}) => {
  const [uptime, setUptime] = useState(0);

  useEffect(() => {
    if (!timestamp) return;
    const interval = setInterval(() => {
      setUptime(Date.now() - timestamp);
    }, 1000);
    return () => clearInterval(interval);
  }, [timestamp]);

  return (
    <div className="w-1/4 min-w-75 border-r border-white/5 bg-black/40 p-6 flex flex-col justify-between backdrop-blur-md">
      <div className="space-y-6">
        <div className="flex items-center gap-3 text-cyan-500 pb-4 border-b border-white/5">
          <Binary size={18} />
          <span className="text-[11px] font-black uppercase tracking-[0.3em]">Diagnostics // Monitor</span>
        </div>

        <StatMetric label="System ID" value={SYSTEM_ID} />
        <StatMetric label="Fault ID" value={faultId || "UNKNOWN"} isItalic />
        <StatMetric label="Timestamp" value={timestamp ? new Date(timestamp).toLocaleTimeString() : "--:--:--"} />
        <StatMetric label="Module" value={moduleName} />
        <StatMetric label="Neural Link" value="SEVERED" color="text-red-500" />
      </div>

      <div className="bg-white/2 p-4 border border-white/5 rounded-sm">
        <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1">Fault Duration</div>
        <div className="text-3xl font-black text-red-500 font-mono italic">
          {(uptime / 1000).toFixed(0)}<span className="text-lg ml-1">s</span>
        </div>
      </div>
    </div>
  );
};

const StatMetric = ({ label, value, color = "text-zinc-200", isItalic = false }: { 
  label: string, value: string, color?: string, isItalic?: boolean 
}) => (
  <div className="group">
    <div className="text-[9px] text-zinc-600 font-black uppercase tracking-[0.2em] mb-1 group-hover:text-cyan-500 transition-colors">
      {label}
    </div>
    <div className={clsx("text-[11px] font-mono truncate", color, isItalic && "italic font-black")}>
      {value}
    </div>
  </div>
);

/* --- Threat Analysis Logic --- */
const getThreatLevel = (error: Error | null) => {
  const msg = error?.message.toLowerCase() || "";
  if (msg.includes("render") || msg.includes("react")) return {
    label: "Neural_Link_Failure", color: "text-purple-500", border: "border-purple-900/30", glow: "shadow-[0_0_15px_rgba(168,85,247,0.2)]",
    description: "Primary optical engine detached. Euler flow projection is offline.",
    advice: "Neural Recalibration advised. Use Hot_Reset to re-sync visual segment."
  };
  if (msg.includes("undefined") || msg.includes("null")) return {
    label: "Buffer_Overflow", color: "text-rose-500", border: "border-rose-900/30", glow: "shadow-[0_0_15px_rgba(244,63,94,0.2)]",
    description: "Memory access violation. Pointer refers to non-existent data block.",
    advice: "Perform Core_Dump and verify Labrix data hydration sequences."
  };
  return {
    label: "System_Panic", color: "text-red-500", border: "border-red-900/30", glow: "shadow-[0_0_15px_rgba(239,68,68,0.2)]",
    description: "Critical UI tree collapse. Kernel unable to reconcile states.",
    advice: "Initiate Cold_Reboot if Hot_Reset attempts fail to stabilize."
  };
};

/* --- Main Error Boundary --- */
export class ErrorBoundary extends Component<Props, State> {
  public static displayName = "WardenErrorBoundary";

  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    faultId: null,
    recoveryAttempts: 0,
    timestamp: null
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      timestamp: Date.now(),
      faultId: `FLT-${Math.random().toString(36).toUpperCase().substring(2, 7)}`
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { name, onError } = this.props;
    const faultId = this.state.faultId || "UNKNOWN";

    this.setState({ errorInfo });

    if (onError) onError(error, errorInfo, faultId);

    console.group(`%c ⚡ ZENTHAR_KERNEL_PANIC [${faultId}] `, "background: #111; color: #ff4444; font-weight: bold; padding: 4px;");
    console.error(`Component Path: ${name || "Anonymous_Node"}`);
    console.error(`Stack:`, errorInfo.componentStack);
    console.groupEnd();

    this.reportTelemetry(error, errorInfo);
  }

  private reportTelemetry = async (error: Error, errorInfo: ErrorInfo) => {
    try {
      await fetch(TELEMETRY_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemId: SYSTEM_ID,
          faultId: this.state.faultId,
          error: error.toString(),
          stack: errorInfo.componentStack,
          module: this.props.name || "Unknown"
        })
      });
    } catch (e) {
      console.warn(`[WARDEN] Telemetry offline for ${this.state.faultId}`);
    }
  };

  private handleRecoveryAction = (action: 'Acknowledge' | 'Reset' | 'CoreDump') => {
    switch (action) {
      case 'Reset':
        this.props.onReset?.();
        this.setState((prev) => ({ 
          hasError: false, 
          error: null, 
          errorInfo: null, 
          faultId: null,
          timestamp: null,
          recoveryAttempts: prev.recoveryAttempts + 1 
        }));
        break;
      case 'CoreDump':
        this.downloadFaultReport();
        break;
      case 'Acknowledge':
        this.setState({ hasError: false });
        break;
    }
  };

  private downloadFaultReport = () => {
    const data = JSON.stringify({ 
      faultId: this.state.faultId,
      error: this.state.error?.toString(), 
      stack: this.state.errorInfo?.componentStack 
    }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const href = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = href;
    link.download = `WARDEN_FAULT_${this.state.faultId}.json`;
    link.click();
    URL.revokeObjectURL(href);
  };

  public render() {
    const { hasError, error, faultId, timestamp, recoveryAttempts } = this.state;
    const { children, fallback, name = "System_Root" } = this.props;

    if (hasError) {
      if (fallback) return fallback;

      const threat = getThreatLevel(error);
      const isCritical = recoveryAttempts >= MAX_AUTO_RECOVERY_ATTEMPTS;

      return (
        <div className="fixed inset-0 min-h-screen bg-[#020203] flex font-mono select-none z-9999 overflow-hidden">
          {/* CRT Overlay Effects */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[url('/assets/scanlines.svg')] z-50" />
          <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_100px_rgba(239,68,68,0.1)] z-50" />

          {/* Sidebar */}
          <DiagnosticsSidebar 
            timestamp={timestamp} 
            faultId={faultId} 
            moduleName={name} 
          />

          {/* Main Interface */}
          <div className="flex-1 flex flex-col p-16 justify-center relative">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="max-w-5xl w-full mx-auto"
            >
              <div className="flex justify-between items-start mb-12">
                <div className="space-y-2">
                  <div className={clsx("flex items-center gap-2", threat.color)}>
                    <ShieldAlert size={18} className="animate-pulse" />
                    <span className="text-[10px] font-black tracking-[0.4em] uppercase">
                      {isCritical ? "CRITICAL_LOOP_DETECTED" : "SYSTEM_PANIC: SEGMENT_FAULT"}
                    </span>
                  </div>
                  <h1 className="text-6xl font-black text-white tracking-tighter uppercase italic leading-none glitch-text">
                    RUNTIME_EXCEPTION
                  </h1>
                </div>
                <Cpu size={48} className="text-white/5 -rotate-12" />
              </div>

              <div className="grid grid-cols-[2fr,1fr] gap-8 mb-12">
                <div className="space-y-6">
                  {/* Fault Log */}
                  <div className="border border-white/5 bg-white/1 p-6 rounded-sm">
                    <div className="flex items-center gap-2 mb-4">
                      <Terminal size={12} className="text-zinc-600" />
                      <span className="text-[10px] text-zinc-600 font-black uppercase tracking-[0.2em]">Primary_Fault</span>
                    </div>
                    <pre className="text-xs text-red-400/90 whitespace-pre-wrap leading-relaxed font-mono italic bg-red-500/5 p-4 border-l-2 border-red-500">
                      {error?.message || "INTERNAL_KERNEL_HALT"}
                    </pre>
                  </div>

                  {/* Threat Intel */}
                  <div className={clsx("flex items-start gap-5 p-6 border backdrop-blur-sm", threat.border, threat.glow)}>
                    <Brain size={24} className={clsx("shrink-0 mt-1", threat.color)} />
                    <div className="space-y-1">
                      <span className={clsx("text-xs font-black uppercase tracking-widest", threat.color)}>
                        {threat.label}
                      </span>
                      <p className="text-xs text-zinc-400 leading-relaxed italic">{threat.description}</p>
                      <p className="text-[11px] text-zinc-500 pt-2 border-t border-white/5 mt-2">
                        <span className="text-zinc-400">Recommended_Action:</span> {threat.advice}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Status Matrix */}
                <div className="border border-white/5 bg-white/1 p-6 space-y-4">
                  <div className="text-[10px] text-zinc-600 font-black uppercase mb-4 tracking-[0.2em]">Recovery_Matrix</div>
                  <StatusRow label="State Integrity" value={isCritical ? "VOID" : "COMPROMISED"} color="text-red-500" />
                  <StatusRow label="Cycles" value={`${recoveryAttempts} Retries`} color="text-amber-500" />
                  <StatusRow label="Data Cache" value="SECURE" color="text-emerald-500" />
                  <StatusRow label="Telemetry" value="SYNCED" color="text-cyan-500" />
                </div>
              </div>

              {/* Action Directives */}
              <div className="grid grid-cols-4 gap-4 pt-8 border-t border-white/5">
                <TacticalButton 
                  icon={<AlertTriangle size={18} />} 
                  label="Acknowledge" 
                  variant="warning" 
                  onClick={() => this.handleRecoveryAction('Acknowledge')} 
                />
                <TacticalButton 
                  icon={<Download size={18} />} 
                  label="Core_Dump" 
                  onClick={() => this.handleRecoveryAction('CoreDump')} 
                />
                <TacticalButton 
                  icon={<RefreshCcw size={18} />} 
                  label="Hot_Reset" 
                  variant="active" 
                  onClick={() => this.handleRecoveryAction('Reset')} 
                />
                <TacticalButton 
                  icon={<Zap size={18} />} 
                  label="Cold_Reboot" 
                  variant="danger" 
                  onClick={() => window.location.reload()} 
                />
              </div>
            </motion.div>
          </div>

          <style>{`
            @keyframes glitch {
              0% { text-shadow: 2px 0 0 #ff0055, -2px 0 0 #00ffff; transform: translate(0); }
              25% { text-shadow: -2px 0 0 #ff0055, 2px 0 0 #00ffff; transform: translate(-1px, 1px); }
              50% { text-shadow: 2px 0 0 #ff0055, -2px 0 0 #00ffff; transform: translate(1px, -1px); }
              100% { text-shadow: -2px 0 0 #ff0055, 2px 0 0 #00ffff; transform: translate(0); }
            }
            .glitch-text { animation: glitch 0.4s steps(2) infinite; opacity: 0.9; }
          `}</style>
        </div>
      );
    }

    return children;
  }
}

/* --- UI Sub-components --- */

const StatusRow = ({ label, value, color }: { label: string, value: string, color: string }) => (
  <div className="flex justify-between items-center text-[10px] font-mono border-b border-white/5 pb-2.5">
    <span className="text-zinc-600 uppercase tracking-wider">{label}</span>
    <span className={clsx("font-black italic tracking-widest", color)}>{value}</span>
  </div>
);

const TacticalButton = ({ 
  icon, 
  label, 
  variant = 'default', 
  onClick 
}: { 
  icon: React.ReactNode, 
  label: string, 
  variant?: 'default' | 'danger' | 'active' | 'warning', 
  onClick?: () => void 
}) => (
  <button 
    onClick={onClick}
    className={clsx(
      "relative flex flex-col items-center justify-center p-6 border transition-all duration-200 gap-3 rounded-sm group active:scale-95 overflow-hidden",
      variant === 'default' && "bg-transparent border-white/5 hover:border-cyan-500/40 hover:bg-cyan-500/5",
      variant === 'danger' && "bg-rose-500/5 border-rose-500/20 hover:bg-rose-500 hover:text-black text-rose-500",
      variant === 'active' && "bg-cyan-500/5 border-cyan-500/20 hover:bg-cyan-500 hover:text-black text-cyan-500",
      variant === 'warning' && "bg-amber-500/5 border-amber-500/20 hover:bg-amber-500 hover:text-black text-amber-500",
    )}
  >
    <div className="transition-transform group-hover:scale-110 group-hover:text-inherit">
      {icon}
    </div>
    <span className={clsx(
      "text-[10px] font-black uppercase tracking-[0.2em] group-hover:text-inherit",
      variant === 'default' && 'text-zinc-500 group-hover:text-white',
    )}>
      {label}
    </span>
    <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-10 pointer-events-none" />
  </button>
);