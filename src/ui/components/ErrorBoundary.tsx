import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle, RefreshCw, Terminal, ShieldAlert } from "lucide-react";
import { motion } from "@/src/lib/motion"; // Assuming you're using Framer Motion
import clsx from "@/src/lib/clsx";

interface Props {
  children: ReactNode;
  /** Unique name for the module/feature being wrapped */
  name?: string;
  /** Optional custom fallback UI */
  fallback?: ReactNode;
  /** External logging hook (e.g., Sentry, Datadog) */
  onError?: (error: Error, errorInfo: ErrorInfo, faultId: string) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  faultId: string | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public static displayName = "ResilientErrorBoundary";
  
  public state: State = {
    hasError: false,
    error: null,
    faultId: null,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    // Generate a unique ID for this specific incident
    const faultId = `FLT-${Math.random().toString(36).toUpperCase().substring(2, 7)}`;
    return { hasError: true, error, faultId };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { name, onError } = this.props;
    const faultId = this.state.faultId || "UNKNOWN";

    // 1. Technical Console Output
    console.group(`%c 🚨 SYSTEM_FAULT [${faultId}] `, "background: #ef4444; color: white; font-weight: bold;");
    console.error(`Origin: ${name || "Anonymous_Component"}`);
    console.error("Error:", error);
    console.groupEnd();

    // 2. Fire Telemetry Hook
    if (onError) {
      onError(error, errorInfo, faultId);
    }
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, faultId: null });
  };

  public render() {
    const { hasError, error, faultId } = this.state;
    const { children, fallback, name } = this.props;

    if (hasError) {
      if (fallback) return fallback;

      return (
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full flex items-center justify-center p-6 min-h-64"
        >
          <div className="max-w-md w-full bg-white rounded-3xl border border-lab-laser/10 shadow-xl overflow-hidden relative group">
            {/* Aesthetic Detail: Industrial Stripe */}
            <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-lab-laser/40 via-lab-laser to-lab-laser/40" />
            
            <div className="p-8 flex flex-col items-center text-center">
              <div className="w-14 h-14 bg-lab-laser/5 rounded-2xl flex items-center justify-center mb-6 border border-lab-laser/10 rotate-3 group-hover:rotate-0 transition-transform duration-500">
                <ShieldAlert className="w-7 h-7 text-lab-laser" />
              </div>

              <h3 className="text-[11px] font-black text-brand-deep uppercase tracking-[0.3em] mb-2">
                Module Suspended // {name || "Kernel"}
              </h3>
              
              <div className="flex items-center gap-2 mb-6 bg-brand-mist/50 px-3 py-1 rounded-full border border-brand-sage/10">
                <Terminal className="w-3 h-3 text-brand-sage" />
                <span className="text-[9px] font-mono font-bold text-brand-sage uppercase">
                  ID: {faultId}
                </span>
              </div>

              <p className="text-[11px] text-brand-sage mb-8 font-medium leading-relaxed opacity-80 italic">
                "{error?.message || "Internal core exception detected."}"
              </p>

              <div className="w-full h-px bg-brand-sage/5 mb-8" />

              <button
                onClick={this.handleReset}
                className="group/btn relative inline-flex items-center gap-3 px-6 py-3 bg-brand-deep text-white text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all hover:bg-lab-laser hover:shadow-lg active:scale-95 overflow-hidden"
              >
                <RefreshCw className="w-4 h-4 group-hover/btn:rotate-180 transition-transform duration-500" />
                <span>Re-Initialize Module</span>
              </button>
            </div>

            {/* Subliminal OS-level decoration */}
            <div className="absolute bottom-2 right-4 flex gap-1 opacity-20 pointer-events-none">
              <div className="w-1 h-1 rounded-full bg-brand-sage" />
              <div className="w-1 h-1 rounded-full bg-brand-sage" />
            </div>
          </div>
        </motion.div>
      );
    }

    return children;
  }
}

ErrorBoundary.displayName = "ResilientErrorBoundary";