import React, { Component, ErrorInfo, ReactNode } from "react";
import { ShieldAlert, RefreshCw, Terminal, Activity, Hash } from "lucide-react";
import clsx from "@/src/lib/clsx";

interface Props {
  children: ReactNode;
  name?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorId: string | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorId: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Generate a unique fault ID for the "Lab Report"
    const faultId = `FLT-${Math.random().toString(36).toUpperCase().substring(2, 10)}`;
    return { hasError: true, error, errorId: faultId };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("CRITICAL_SYSTEM_FAULT:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorId: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      let errorMessage = "KERNEL_PANIC: UNKNOWN_EXCEPTION_OCCURRED";
      let isFirebaseError = false;

      try {
        if (this.state.error?.message) {
          const parsed = JSON.parse(this.state.error.message);
          if (parsed.error && parsed.operationType) {
            errorMessage = `DB_IO_FAILURE: ${parsed.error} @ ${parsed.operationType}`;
            isFirebaseError = true;
          }
        }
      } catch (e) {
        errorMessage = this.state.error?.message || errorMessage;
      }

      return (
        <div className="min-h-screen bg-white instrument-grid flex items-center justify-center p-6 relative overflow-hidden">
          {/* Emergency Scanline Overlay */}
          <div className="absolute inset-0 bg-lab-laser/3 animate-pulse pointer-events-none" />

          <div className="max-w-xl w-full z-10">
            {/* The "Black Box" Fault Terminal */}
            <div className="bg-brand-deep rounded-sm shadow-[0_0_50px_rgba(239,68,68,0.15)] border border-lab-laser/30 overflow-hidden">
              {/* Terminal Header */}
              <div className="bg-lab-laser px-6 py-2 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-white" />
                  <span className="text-[10px] font-black text-white uppercase tracking-[0.3em]">
                    System_Fault_Detected
                  </span>
                </div>
                <span className="text-[10px] font-mono text-white/80">
                  ID: {this.state.errorId}
                </span>
              </div>

              <div className="p-8">
                {/* Status Indicator */}
                <div className="flex items-center gap-4 mb-8">
                  <div className="p-3 bg-lab-laser/10 border border-lab-laser/20 rounded-full">
                    <Activity className="w-6 h-6 text-lab-laser animate-pulse" />
                  </div>
                  <div className="text-left">
                    <h2 className="text-lg font-black text-white uppercase tracking-tighter leading-none">
                      {isFirebaseError
                        ? "Database Access Breach"
                        : "Core Runtime Violation"}
                    </h2>
                    <p className="text-[9px] text-brand-primary font-bold uppercase tracking-widest mt-1">
                      Status: Execution_Halted // Safe_Mode_Active
                    </p>
                  </div>
                </div>

                {/* Diagnostic Trace Box */}
                <div className="relative group">
                  <div className="absolute -top-2 left-4 px-2 bg-brand-deep text-[8px] font-mono text-brand-sage uppercase">
                    Diagnostic_Dump
                  </div>
                  <div className="w-full bg-black/40 border border-white/10 rounded-sm p-5 font-mono mb-8">
                    <p className="text-[11px] text-lab-laser leading-relaxed break-all">
                      <span className="opacity-40 mr-2">&gt;</span>
                      {errorMessage}
                    </p>
                    <div className="mt-4 flex gap-4">
                      <div className="flex items-center gap-1">
                        <Hash className="w-3 h-3 text-brand-primary" />
                        <span className="text-[9px] text-brand-sage uppercase font-bold">
                          Stack_Locked
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Terminal className="w-3 h-3 text-brand-primary" />
                        <span className="text-[9px] text-brand-sage uppercase font-bold">
                          Node_Isolated
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Emergency Kill Switch */}
                <button
                  onClick={this.handleReset}
                  className="w-full group relative flex items-center justify-center gap-3 py-4 bg-lab-laser text-white font-black uppercase tracking-[0.2em] text-xs transition-all hover:bg-white hover:text-lab-laser border border-lab-laser"
                >
                  <RefreshCw className="w-4 h-4 transition-transform group-hover:rotate-180 duration-500" />
                  Attempt System Reboot
                </button>

                <p className="text-center mt-6 text-[8px] font-bold text-brand-sage/40 uppercase tracking-[0.5em]">
                  Personnel Authorized Access Only // Contact Admin if
                  Persistence Continues
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
