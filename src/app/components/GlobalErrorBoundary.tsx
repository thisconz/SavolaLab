import React, { Component, ErrorInfo, ReactNode, Fragment } from "react";
import { 
  ShieldAlert, 
  RefreshCw, 
  Terminal, 
  ServerCrash, 
  Cpu,
  Copy,
  CheckCircle2,
  AlertOctagon,
  Database,
  Globe,
  Code2
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
  timestamp: string | null;
}

const MAX_RECOVERY_ATTEMPTS = 3;

export class ErrorBoundary extends Component<Props, State> {

  public static displayName = "ErrorBoundary";
  
  public state: State = {
    hasError: false,
    error: null,
    errorId: null,
    recoveryCount: 0,
    copied: false,
    timestamp: null
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    const faultId = `SYS-FLT-${Math.random().toString(36).toUpperCase().substring(2, 8)}`;
    return { 
      hasError: true, 
      error, 
      errorId: faultId, 
      timestamp: new Date().toISOString() 
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
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
    const text = `ID: ${this.state.errorId}\nTimestamp: ${this.state.timestamp}\nModule: ${this.props.moduleName}\nError: ${this.state.error?.message}`;
    navigator.clipboard.writeText(text);
    this.setState({ copied: true });
    setTimeout(() => this.setState({ copied: false }), 2000);
  };

  public render() {
    if (this.state.hasError) {
      const isLooping = this.state.recoveryCount >= MAX_RECOVERY_ATTEMPTS;

      return (
        <div className="fixed inset-0 z-9999 bg-[#050506] flex items-center justify-center p-6 md:p-12 overflow-y-auto selection:bg-red-500/30">
          {/* 1. ATMOSPHERIC LAYERS */}
          <div className="absolute inset-0 bg-[url('/assets/grid-dot.svg')] opacity-[0.05] pointer-events-none" />
          <div className="absolute inset-0 bg-radial-gradient(circle_at_center,rgba(239,68,68,0.08)_0%,transparent_70%) pointer-events-none" />
          
          {/* Scanning Laser Line */}
          <motion.div 
            animate={{ top: ['-10%', '110%'] }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            className="absolute left-0 w-full h-px bg-linear-to-r from-transparent via-red-500/20 to-transparent pointer-events-none"
          />

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-5xl grid lg:grid-cols-[1fr_380px] gap-8 relative z-10"
          >
            {/* LEFT COLUMN: Main Error Interface */}
            <div className="bg-[#0b0b0e] border border-white/5 rounded-[2.5rem] shadow-3xl overflow-hidden flex flex-col">
              
              {/* Top Banner */}
              <div className={clsx(
                "px-8 py-5 flex justify-between items-center border-b transition-all duration-700",
                isLooping ? "bg-red-500/10 border-red-500/20" : "bg-white/2 border-white/5"
              )}>
                <div className="flex items-center gap-4">
                  <div className={clsx(
                    "w-2 h-2 rounded-full animate-pulse",
                    isLooping ? "bg-red-500 shadow-[0_0_10px_#ef4444]" : "bg-orange-500"
                  )} />
                  <span className="text-[11px] font-black text-white/40 uppercase tracking-[0.4em]">
                    System_Status // <span className="text-white">{isLooping ? "Kernel_Panic" : "Exception_Caught"}</span>
                  </span>
                </div>
                <div className="px-3 py-1 rounded-full bg-black/40 border border-white/10">
                  <span className="text-[10px] font-mono text-red-400 font-bold">{this.state.errorId}</span>
                </div>
              </div>

              <div className="p-8 md:p-12 flex-1">
                <header className="mb-10">
                  <div className="inline-flex p-5 bg-red-500/10 border border-red-500/20 rounded-3xl mb-6">
                    <ServerCrash className="w-10 h-10 text-red-500" strokeWidth={1.5} />
                  </div>
                  <h1 className="text-4xl font-black text-white tracking-tighter uppercase mb-4">
                    The sequence <br /> was interrupted.
                  </h1>
                  <p className="text-slate-400 text-sm leading-relaxed max-w-md">
                    An unhandled exception occurred in the <span className="text-red-400 font-mono">[{this.props.moduleName || "ROOT_CORE"}]</span> layer. We've isolated the fault to prevent data corruption.
                  </p>
                </header>

                {/* Technical Trace Window */}
                <div className="bg-black/40 border border-white/5 rounded-3xl p-6 group transition-all hover:border-red-500/20 mb-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Terminal className="w-4 h-4 text-slate-500" />
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Stack_Summary</span>
                    </div>
                    <button 
                      onClick={this.copyDiagnostics}
                      className="p-2 hover:bg-white/5 rounded-lg transition-colors text-slate-400 hover:text-white"
                    >
                      {this.state.copied ? <CheckCircle2 size={16} className="text-emerald-500" /> : <Copy size={16} />}
                    </button>
                  </div>
                  <code className="block font-mono text-xs leading-relaxed">
                    <span className="text-red-500/50 mr-3">ERR_TYPE</span>
                    <span className="text-red-400 font-bold">{this.state.error?.name || "RuntimeError"}</span>
                    <br />
                    <span className="text-slate-600 mr-3">MESSAGE</span>
                    <span className="text-slate-300 italic">"{this.state.error?.message || "No message provided by core."}"</span>
                  </code>
                </div>

                {/* Primary Actions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    disabled={isLooping}
                    onClick={this.handleSoftReset}
                    className={clsx(
                      "group relative flex items-center justify-center gap-3 py-5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all border active:scale-95",
                      isLooping 
                        ? "bg-white/5 border-white/5 text-white/20 cursor-not-allowed" 
                        : "bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/20"
                    )}
                  >
                    <Cpu className={clsx("w-4 h-4", !isLooping && "group-hover:rotate-12 transition-transform")} />
                    Attempt Recovery ({MAX_RECOVERY_ATTEMPTS - this.state.recoveryCount})
                  </button>
                  <button
                    onClick={this.handleHardReset}
                    className="flex items-center justify-center gap-3 py-5 bg-red-600 hover:bg-red-500 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all shadow-[0_10px_30px_rgba(220,38,38,0.2)] active:scale-95"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Force Hard Reboot
                  </button>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Integrity Info */}
            <aside className="space-y-6">
              <section className="bg-white/2 border border-white/5 rounded-4xl p-8">
                <h4 className="text-[10px] font-black text-brand-primary uppercase tracking-[0.3em] mb-6">Integrity_Report</h4>
                <div className="space-y-5">
                  <StatusMetric icon={Database} label="Memory State" status="Purged" />
                  <StatusMetric icon={Globe} label="Network Link" status="Suspended" />
                  <StatusMetric icon={Code2} label="Logic Bridge" status="Broken" isWarning />
                </div>
              </section>

              <section className="p-8 bg-linear-to-b from-red-500/10 to-transparent border border-red-500/10 rounded-4xl">
                <h4 className="text-[10px] font-black text-red-400 uppercase tracking-[0.3em] mb-4">What happened?</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                  A fatal error usually means a logic branch received unexpected data or a resource failed to load. 
                  <br /><br />
                  Recovery attempts to clear the local component state, while a Hard Reboot clears the entire browser memory for this session.
                </p>
              </section>
            </aside>
          </motion.div>
        </div>
      );
    }

    return this.props.children;
  }
}

/* --- UI Micro-Components --- */

const StatusMetric = ({ icon: Icon, label, status, isWarning }: { icon: any, label: string, status: string, isWarning?: boolean }) => (
  <div className="flex items-center justify-between group">
    <div className="flex items-center gap-3">
      <div className="p-2 bg-white/5 rounded-lg group-hover:bg-white/10 transition-colors">
        <Icon size={14} className="text-slate-500" />
      </div>
      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-tight">{label}</span>
    </div>
    <span className={clsx(
      "text-[10px] font-mono font-bold uppercase",
      isWarning ? "text-orange-500" : "text-slate-600"
    )}>{status}</span>
  </div>
);

ErrorBoundary.displayName = "ErrorBoundary";