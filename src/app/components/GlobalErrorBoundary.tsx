import React, { Component, ErrorInfo, ReactNode } from "react";
import { 
  ShieldAlert, 
  RefreshCw, 
  Terminal, 
  ServerCrash, 
  Cpu,
  Copy,
  CheckCircle2,
  AlertOctagon
} from "lucide-react";
import { motion, AnimatePresence } from "../../lib/motion";
import clsx from "@/src/lib/clsx";

// --- Types ---

interface Props {
  children: ReactNode;
  moduleName?: string;
  onError?: (error: Error, errorInfo: ErrorInfo, faultId: string) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorId: string | null;
  recoveryCount: number;
  copied: boolean;
}

// --- Logic Constants ---
const MAX_RECOVERY_ATTEMPTS = 3;

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorId: null,
    recoveryCount: 0,
    copied: false,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    const faultId = `SYS-FLT-${Math.random().toString(36).toUpperCase().substring(2, 8)}`;
    return { hasError: true, error, errorId: faultId };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // 1. Internal Console Telemetry
    console.group(`%c 🚨 KERNEL_PANIC: ${this.state.errorId} `, "background: #ef4444; color: white; font-weight: bold; padding: 4px;");
    console.error("Trace:", errorInfo.componentStack);
    console.groupEnd();

    if (this.props.onError) {
      this.props.onError(error, errorInfo, this.state.errorId || "UNKNOWN");
    }
  }

  private handleSoftReset = () => {
    if (this.state.recoveryCount >= MAX_RECOVERY_ATTEMPTS) return;
    
    this.setState((prev) => ({ 
      hasError: false, 
      error: null, 
      errorId: null,
      recoveryCount: prev.recoveryCount + 1 
    }));
  };

  private handleHardReset = () => window.location.reload();

  private copyDiagnostics = () => {
    const text = `ID: ${this.state.errorId}\nModule: ${this.props.moduleName}\nError: ${this.state.error?.message}`;
    navigator.clipboard.writeText(text);
    this.setState({ copied: true });
    setTimeout(() => this.setState({ copied: false }), 2000);
  };

  public render() {
    if (this.state.hasError) {
      const isLooping = this.state.recoveryCount >= MAX_RECOVERY_ATTEMPTS;

      return (
        <div className="min-h-100 w-full bg-[#070708] flex items-center justify-center p-4 relative overflow-hidden font-sans rounded-4xl border border-red-500/10">
          {/* Reactive Background Grid */}
          <div 
            className="absolute inset-0 opacity-[0.03] pointer-events-none" 
            style={{ 
                backgroundImage: `radial-gradient(#ef4444 1px, transparent 0)`, 
                backgroundSize: '24px 24px' 
            }} 
          />

          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-xl w-full z-10"
          >
            <div className="bg-[#0f0f12] border border-white/5 rounded-3xl shadow-2xl overflow-hidden">
              
              {/* Header: Critical Alert */}
              <div className={clsx(
                "px-6 py-4 flex justify-between items-center border-b transition-colors duration-500",
                isLooping ? "bg-red-950/50 border-red-500/30" : "bg-white/5 border-white/5"
              )}>
                <div className="flex items-center gap-3">
                  <AlertOctagon className={clsx("w-4 h-4", isLooping ? "text-red-500 animate-pulse" : "text-red-400")} />
                  <span className="text-[10px] font-black text-white/90 uppercase tracking-[0.3em]">
                    {isLooping ? "Critical Loop Detected" : `Fault Isolated // ${this.props.moduleName || "Global"}`}
                  </span>
                </div>
                <div className="flex items-center gap-2 bg-black/40 px-2 py-1 rounded-md border border-white/5">
                   <span className="text-[9px] font-mono text-red-400 font-bold tracking-tighter">{this.state.errorId}</span>
                </div>
              </div>

              <div className="p-8">
                {/* Error Summary */}
                <div className="flex items-start gap-5 mb-8">
                  <div className="shrink-0 p-4 bg-red-500/5 border border-red-500/10 rounded-2xl">
                    <ServerCrash className="w-7 h-7 text-red-500" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-lg font-black text-white uppercase tracking-tight">Execution Halted</h3>
                    <p className="text-[11px] text-slate-500 font-medium leading-relaxed max-w-[320px]">
                      A runtime exception forced the <span className="text-red-400 font-mono">{this.props.moduleName || "Core"}</span> module to suspend operations.
                    </p>
                  </div>
                </div>

                {/* Diagnostic Trace Window */}
                <div className="bg-black/40 border border-white/5 rounded-2xl p-5 mb-8 group relative transition-all hover:border-white/10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Terminal className="w-3 h-3 text-slate-500" />
                      <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Diagnostic_Dump</span>
                    </div>
                    <button 
                      onClick={this.copyDiagnostics}
                      className="text-slate-600 hover:text-white transition-colors"
                    >
                      {this.state.copied ? <CheckCircle2 size={12} className="text-emerald-500" /> : <Copy size={12} />}
                    </button>
                  </div>
                  
                  <div className="space-y-1.5 font-mono overflow-hidden">
                    <div className="flex gap-3">
                      <span className="text-red-500/30 text-[10px]">MSG</span>
                      <p className="text-[11px] text-red-400/90 font-bold truncate">
                        {this.state.error?.message || "UNDEFINED_CORE_PANIC"}
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <span className="text-slate-700 text-[10px]">OBJ</span>
                      <p className="text-[11px] text-slate-500 truncate">Source: {this.props.moduleName || "Kernel_Root"}</p>
                    </div>
                  </div>
                </div>

                {/* Resilience Controls */}
                <div className="flex flex-col gap-3">
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      disabled={isLooping}
                      onClick={this.handleSoftReset}
                      className={clsx(
                        "flex items-center justify-center gap-2 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border active:scale-95",
                        isLooping 
                          ? "bg-white/5 border-white/5 text-white/20 cursor-not-allowed" 
                          : "bg-white/5 border-white/10 text-white hover:bg-white/10"
                      )}
                    >
                      <Cpu className="w-3.5 h-3.5" />
                      Hot Reload
                    </button>
                    <button
                      onClick={this.handleHardReset}
                      className="flex items-center justify-center gap-2 py-3.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-red-600/20 active:scale-95"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Hard Reboot
                    </button>
                  </div>
                  
                  {isLooping && (
                    <motion.p 
                      initial={{ opacity: 0 }} 
                      animate={{ opacity: 1 }}
                      className="text-[9px] text-red-500/60 font-bold text-center uppercase tracking-tighter"
                    >
                      Soft recovery failed. Hard reboot recommended to clear cache.
                    </motion.p>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      );
    }

    return this.props.children;
  }
}