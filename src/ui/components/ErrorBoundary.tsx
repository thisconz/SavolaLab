import React, { Component, ErrorInfo, ReactNode } from "react";
import { 
  ShieldAlert, 
  RefreshCw, 
  Terminal, 
  Cpu, 
  History, 
  AlertCircle 
} from "lucide-react";
import { motion, AnimatePresence } from "../../lib/motion";
import clsx from "@/src/lib/clsx";

/* --- Configuration --- */
const MAX_AUTO_RECOVERY_ATTEMPTS = 2;

interface Props {
  children: ReactNode;
  name?: string;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo, faultId: string) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  faultId: string | null;
  recoveryAttempts: number;
  timestamp: string | null;
}

export class ErrorBoundary extends Component<Props, State> {
  // Correct TypeScript declaration for static property
  public static displayName = "ResilientErrorBoundary";

  public state: State = {
    hasError: false,
    error: null,
    faultId: null,
    recoveryAttempts: 0,
    timestamp: null
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    const faultId = `FLT-${Math.random().toString(36).toUpperCase().substring(2, 7)}`;
    return { 
      hasError: true, 
      error, 
      faultId,
      timestamp: new Date().toLocaleTimeString()
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { name, onError } = this.props;
    const faultId = this.state.faultId || "UNKNOWN";

    // Telemetry execution
    if (onError) onError(error, errorInfo, faultId);

    // Automatic Logging
    console.group(`%c ⚡ ZENTHAR_KERNEL_PANIC [${faultId}] `, "background: #111; color: #ff4444; font-weight: bold; padding: 4px;");
    console.error(`Component Path: ${name || "Anonymous_Node"}`);
    console.error(`Stack:`, errorInfo.componentStack);
    console.groupEnd();
  }

  private handleManualReset = () => {
    this.setState((prev) => ({ 
      hasError: false, 
      error: null, 
      faultId: null,
      recoveryAttempts: prev.recoveryAttempts + 1 
    }));
  };

  public render() {
    const { hasError, error, faultId, timestamp, recoveryAttempts } = this.state;
    const { children, fallback, name } = this.props;

    if (hasError) {
      if (fallback) return fallback;

      const isCritical = recoveryAttempts >= MAX_AUTO_RECOVERY_ATTEMPTS;

      return (
        <div className="w-full flex items-center justify-center p-8 min-h-100">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-lg bg-[#070708] rounded-[2.5rem] border border-white/5 shadow-2xl relative overflow-hidden"
          >
            {/* 1. LAYER: DYNAMIC BACKGROUND */}
            <div className="absolute inset-0 bg-[url('/assets/grid-dot.svg')] opacity-[0.03] pointer-events-none" />
            <div className={clsx(
                "absolute top-0 left-0 w-full h-1 transition-colors duration-1000",
                isCritical ? "bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]" : "bg-brand-primary"
            )} />

            <div className="p-10">
              {/* Header: Status Indicator */}
              <div className="flex justify-between items-start mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/3 border border-white/5 flex items-center justify-center">
                    <ShieldAlert className={clsx("w-6 h-6", isCritical ? "text-red-500" : "text-brand-primary")} />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-white uppercase tracking-[0.2em]">
                      Fault_Isolated
                    </h3>
                    <p className="text-[10px] text-brand-sage opacity-40 uppercase tracking-widest font-bold">
                      {name || "System_Root"} // Node_01
                    </p>
                  </div>
                </div>
                <div className="text-right">
                    <span className="text-[9px] font-mono text-white/20 uppercase font-black tracking-widest">
                        {timestamp}
                    </span>
                </div>
              </div>

              {/* Body: Diagnostic Data */}
              <div className="space-y-4 mb-10">
                <div className="bg-white/2 rounded-2xl p-4 border border-white/5">
                  <div className="flex items-center gap-2 mb-2 opacity-40">
                    <Terminal size={10} className="text-brand-primary" />
                    <span className="text-[8px] font-black uppercase tracking-[0.2em] text-white">Exception_Log</span>
                  </div>
                  <p className="text-[11px] font-mono text-red-400/80 leading-relaxed wrap-break-word">
                    {error?.message || "Internal_Kernel_Halt"}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <DiagnosticBadge icon={Cpu} label="Fault_ID" value={faultId || "---"} />
                    <DiagnosticBadge icon={History} label="Cycles" value={`${recoveryAttempts} Retries`} />
                </div>
              </div>

              {/* Action: Re-initialization */}
              <button
                onClick={this.handleManualReset}
                className={clsx(
                    "group relative w-full flex items-center justify-center gap-3 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all overflow-hidden",
                    isCritical 
                      ? "bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20" 
                      : "bg-white text-black hover:scale-[1.02] active:scale-95"
                )}
              >
                <RefreshCw className={clsx("w-4 h-4", !isCritical && "group-hover:rotate-180 transition-transform duration-700")} />
                <span>{isCritical ? "Force Hard Reset" : "Re-Initialize Module"}</span>
              </button>
              
              {isCritical && (
                  <p className="mt-4 text-center text-[8px] text-red-500/50 uppercase font-black tracking-widest animate-pulse">
                      Critical loop detected. Manual intervention required.
                  </p>
              )}
            </div>
          </motion.div>
        </div>
      );
    }

    return children;
  }
}

/* --- Helper Sub-components --- */

const DiagnosticBadge = ({ icon: Icon, label, value }: { icon: any, label: string, value: string }) => (
    <div className="flex items-center gap-3 px-4 py-3 bg-white/2 rounded-xl border border-white/3">
        <Icon size={12} className="text-brand-sage opacity-30" />
        <div className="flex flex-col">
            <span className="text-[7px] font-black text-brand-sage/40 uppercase tracking-widest leading-none mb-1">{label}</span>
            <span className="text-[9px] font-mono text-white/70 font-bold leading-none">{value}</span>
        </div>
    </div>
);