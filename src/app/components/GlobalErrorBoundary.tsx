import React, { Component, ErrorInfo, ReactNode } from "react";
import { ShieldAlert, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  name?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      let errorMessage = "An unexpected error occurred.";
      let isFirebaseError = false;

      try {
        if (this.state.error?.message) {
          const parsed = JSON.parse(this.state.error.message);
          if (parsed.error && parsed.operationType) {
            errorMessage = `Database Error: ${parsed.error} during ${parsed.operationType}`;
            isFirebaseError = true;
          }
        }
      } catch (e) {
        // Not a JSON error message
        errorMessage = this.state.error?.message || errorMessage;
      }

      return (
        <div className="min-h-screen bg-brand-deep flex items-center justify-center p-6">
          <div className="bg-white rounded-[2.5rem] shadow-2xl p-10 max-w-md w-full border border-lab-laser/20">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-lab-laser/10 rounded-full flex items-center justify-center mb-6">
                <ShieldAlert className="w-8 h-8 text-lab-laser" />
              </div>
              <h2 className="text-xl font-bold text-brand-deep uppercase tracking-widest mb-2">
                System Interruption
              </h2>
              <p className="text-xs text-brand-sage font-mono uppercase tracking-widest mb-6">
                {isFirebaseError
                  ? "Database Permission Denied"
                  : "Application Error Detected"}
              </p>

              <div className="w-full bg-brand-mist/30 rounded-2xl p-4 mb-8">
                <p className="text-[10px] text-lab-laser font-mono break-all">
                  {errorMessage}
                </p>
              </div>

              <button
                onClick={this.handleReset}
                className="w-full py-4 bg-brand-primary text-white rounded-2xl font-bold uppercase tracking-widest text-sm shadow-xl shadow-brand-primary/30 hover:bg-brand-primary/90 transition-all flex items-center justify-center gap-3"
              >
                <RefreshCw className="w-4 h-4" />
                Restart Terminal
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
