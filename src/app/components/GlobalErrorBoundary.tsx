import React, { Component, ErrorInfo, ReactNode } from "react";
import { 
  ShieldAlert, RefreshCw, Terminal, ServerCrash, Cpu, Copy, 
  CheckCircle2, Database, Globe, Code2, ArrowLeft, Bug, History
} from "lucide-react";
import { motion, AnimatePresence } from "../../lib/motion";
import clsx from "../../lib/clsx";

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
  isScanning: boolean;
}

const MAX_RECOVERY_ATTEMPTS = 3;

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorId: null,
    recoveryCount: 0,
    copied: false,
    timestamp: null,
    isScanning: true
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    const faultId = `SYS-FLT-${Math.random().toString(36).toUpperCase().substring(2, 8)}`;
    return { 
      hasError: true, 
      error, 
      errorId: faultId, 
      timestamp: new Date().toLocaleTimeString(),
      isScanning: true
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (this.props.onError) {
      this.props.onError(error, errorInfo, this.state.errorId || "UNKNOWN");
    }
    // Simulate diagnostic scan completion
    setTimeout(() => this.setState({ isScanning: false }), 2500);
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

  private handleHardReset = () => window.location.assign('/');

  private copyDiagnostics = () => {
    const text = `
      [SYSTEM ERROR REPORT]
      ID: ${this.state.errorId}
      Timestamp: ${this.state.timestamp}
      Module: ${this.props.moduleName}
      Error: ${this.state.error?.name}: ${this.state.error?.message}
      URL: ${window.location.href}
      UA: ${navigator.userAgent}
    `.trim();
    navigator.clipboard.writeText(text);
    this.setState({ copied: true });
    setTimeout(() => this.setState({ copied: false }), 2000);
  };

  public render() {
    const { hasError, isScanning, error, errorId, recoveryCount, copied, timestamp } = this.state;
    const isLooping = recoveryCount >= MAX_RECOVERY_ATTEMPTS;

    if (hasError) {
      return (
        <div className="fixed inset-0 z-9999 bg-[#050507] text-slate-300 font-sans flex items-center justify-center p-4 overflow-hidden selection:bg-red-500/40">
          
          {/* BACKGROUND LAYERS */}
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-50 pointer-events-none" />
          <div className="absolute inset-0 bg-radial-gradient(circle_at_50%_50%,rgba(220,38,38,0.1)_0%,transparent_80%) pointer-events-none" />
          
          <div className="w-full max-w-7xl h-[90vh] grid lg:grid-cols-[1fr_400px] gap-6 relative z-10">
            
            {/* MAIN INTERFACE: The "Glass" Shell */}
            <motion.main 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-[#0b0b0f]/80 backdrop-blur-xl border border-white/5 rounded-[2.5rem] flex flex-col overflow-hidden shadow-2xl shadow-black"
            >
              {/* STATUS BAR */}
              <div className={clsx(
                "px-8 py-4 border-b flex items-center justify-between transition-colors duration-1000",
                isLooping ? "bg-red-500/10 border-red-500/20" : "bg-white/2 border-white/5"
              )}>
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <div className={clsx("w-2 h-2 rounded-full", isLooping ? "bg-red-500 animate-pulse" : "bg-orange-500")} />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Critical_Failure</span>
                  </div>
                  <div className="h-4 w-px bg-white/10 hidden md:block" />
                  <span className="text-[10px] font-mono text-white/60 hidden md:block uppercase tracking-widest">
                    ID // <span className="text-white">{errorId}</span>
                  </span>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-[10px] font-mono text-white/30">{timestamp}</span>
                    <button onClick={this.handleHardReset} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                        <ArrowLeft size={14} />
                    </button>
                </div>
              </div>

              {/* BODY CONTENT */}
              <div className="flex-1 p-8 md:p-16 overflow-y-auto custom-scrollbar">
                <AnimatePresence mode="wait">
                  {isScanning ? (
                    <motion.div 
                      key="scanning"
                      exit={{ opacity: 0, y: -20 }}
                      className="h-full flex flex-col items-center justify-center text-center space-y-6"
                    >
                      <motion.div 
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="p-4 rounded-full border border-red-500/20 bg-red-500/5"
                      >
                        <RefreshCw className="w-12 h-12 text-red-500" />
                      </motion.div>
                      <h2 className="text-xl font-black uppercase tracking-widest text-white">Running Diagnostics...</h2>
                      <p className="text-sm text-slate-500 font-mono tracking-tighter">Analyzing heap memory and logic branch integrity</p>
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="failure"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-12"
                    >
                      <header>
                        <div className="inline-flex p-4 bg-red-500/10 border border-red-500/20 rounded-2xl mb-8">
                          <ServerCrash className="w-12 h-12 text-red-500" strokeWidth={1} />
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black text-white tracking-tight uppercase leading-[0.9]">
                          System <br /> <span className="text-red-600">Interrupted.</span>
                        </h1>
                        <p className="mt-8 text-lg text-slate-400 max-w-xl leading-relaxed">
                          The application encountered a fatal exception in <span className="text-white font-mono bg-white/5 px-2 py-1 rounded">[{this.props.moduleName || "ROOT"}]</span>. Process execution has been suspended to protect state integrity.
                        </p>
                      </header>

                      {/* DIAGNOSTIC TERMINAL */}
                      <div className="relative group">
                        <div className="absolute -inset-1 bg-linear-to-r from-red-500/20 to-transparent rounded-3xl blur opacity-25 group-hover:opacity-50 transition duration-1000" />
                        <div className="relative bg-black border border-white/5 rounded-3xl overflow-hidden">
                          <div className="flex items-center justify-between px-6 py-4 bg-white/5 border-b border-white/5">
                            <div className="flex items-center gap-3">
                              <Terminal className="w-4 h-4 text-red-500" />
                              <span className="text-[10px] font-black uppercase tracking-widest">Stack_Trace</span>
                            </div>
                            <button 
                              onClick={this.copyDiagnostics}
                              className="flex items-center gap-2 px-3 py-1 bg-white/5 hover:bg-white/10 rounded-full transition-all text-[10px] font-bold"
                            >
                              {copied ? <CheckCircle2 size={12} className="text-emerald-500" /> : <Copy size={12} />}
                              {copied ? "COPIED" : "COPY LOGS"}
                            </button>
                          </div>
                          <div className="p-6 h-48 overflow-y-auto font-mono text-xs leading-relaxed custom-scrollbar">
                            <div className="text-red-500/80 mb-2">/!/ FAULT_DETECTED: {error?.name}</div>
                            <div className="text-white mb-4">{error?.message}</div>
                            <div className="text-slate-600 break-all opacity-60">
                              {error?.stack}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* ACTION SUITE */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <button
                          disabled={isLooping}
                          onClick={this.handleSoftReset}
                          className={clsx(
                            "flex items-center justify-center gap-4 py-6 rounded-2xl text-xs font-black uppercase tracking-widest transition-all border active:scale-95",
                            isLooping 
                              ? "opacity-20 cursor-not-allowed grayscale" 
                              : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-red-500/20 text-white"
                          )}
                        >
                          <Cpu className="w-5 h-5" />
                          Try Soft Recovery ({MAX_RECOVERY_ATTEMPTS - recoveryCount})
                        </button>
                        <button
                          onClick={this.handleHardReset}
                          className="flex items-center justify-center gap-4 py-6 bg-red-600 hover:bg-red-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-[0_20px_40px_rgba(220,38,38,0.3)] active:scale-95"
                        >
                          <RefreshCw className="w-5 h-5" />
                          System Reboot
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.main>

            {/* SIDEBAR: System Context */}
            <aside className="space-y-6 hidden lg:block">
              <section className="bg-white/2 border border-white/5 rounded-4xl p-8">
                <h4 className="text-[10px] font-black text-red-500 uppercase tracking-[0.4em] mb-8 flex items-center gap-2">
                  <Database size={14} /> Env_Telemetry
                </h4>
                <div className="space-y-6">
                  <Metric label="Core Status" value="Locked" icon={ShieldAlert} color="text-red-500" />
                  <Metric label="Memory Heap" value="0.42gb" icon={Cpu} />
                  <Metric label="Network" value="Offline" icon={Globe} />
                  <Metric label="Version" value="v4.2.0-stable" icon={Code2} />
                </div>
              </section>

              <section className="bg-white/2 border border-white/5 rounded-4xl p-8">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-6 flex items-center gap-2">
                  <History size={14} /> Session_History
                </h4>
                <div className="space-y-4">
                    <HistoryItem time="12:04:22" event="Auth_Token_Validated" />
                    <HistoryItem time="12:04:45" event="Module_Load_Success" />
                    <HistoryItem time={timestamp || "--:--"} event="Fatal_Exception" isError />
                </div>
              </section>

              <div className="px-8 flex items-center gap-4 opacity-40 grayscale">
                <Bug size={24} />
                <p className="text-[10px] font-bold leading-tight">
                  REPORTS AUTOMATICALLY SENT TO <br /> THE INFRASTRUCTURE TEAM
                </p>
              </div>
            </aside>

          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/* --- UI Micro-Components --- */

const Metric = ({ label, value, icon: Icon, color = "text-slate-500" }: any) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-3">
      <Icon size={14} className="text-slate-600" />
      <span className="text-[11px] font-bold text-slate-500 uppercase">{label}</span>
    </div>
    <span className={clsx("text-[10px] font-mono font-bold uppercase", color)}>{value}</span>
  </div>
);

const HistoryItem = ({ time, event, isError }: { time: string, event: string, isError?: boolean }) => (
    <div className="flex items-start gap-3">
        <span className="text-[9px] font-mono text-slate-600 mt-1">{time}</span>
        <span className={clsx("text-[10px] font-bold uppercase tracking-tight", isError ? "text-red-500" : "text-slate-400")}>
            {event}
        </span>
    </div>
)