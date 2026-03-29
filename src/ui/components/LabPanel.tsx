import React, { memo } from "react";
import { motion } from "motion/react";
import { LucideIcon, RefreshCw, AlertCircle } from "lucide-react";
import { ErrorBoundary } from "./ErrorBoundary";

interface LabPanelProps {
  title: React.ReactNode;
  icon?: LucideIcon;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
  actions?: React.ReactNode;
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
}

/**
 * Shared UI Component: LabPanel
 * Provides a consistent container for all feature panels.
 * Includes built-in support for loading, error, and refresh states.
 */
export const LabPanel: React.FC<LabPanelProps> = memo(
  ({
    title,
    icon: Icon,
    children,
    className = "",
    contentClassName = "",
    actions,
    loading = false,
    error = null,
    onRefresh,
  }) => {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`bg-white border border-brand-sage/10 rounded-3xl shadow-sm hover:shadow-xl transition-all duration-500 flex flex-col h-full overflow-hidden relative group/panel ${className}`}
      >
        {/* Corner Accent */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-linear-to-br from-brand-primary/5 to-transparent rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none transition-transform duration-700 group-hover/panel:scale-150" />
        <div className="absolute bottom-0 left-0 w-full h-1 bg-linear-to-r from-transparent via-brand-primary/20 to-transparent opacity-0 group-hover/panel:opacity-100 transform scale-x-0 group-hover/panel:scale-x-100 transition-all duration-700 origin-left" />

        <div className="flex items-center justify-between px-6 py-5 border-b border-brand-sage/5 bg-white/50 backdrop-blur-md relative z-10">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-brand-primary/10 rounded-2xl border border-brand-primary/20 shadow-inner group-hover/panel:rotate-12 transition-transform duration-500">
              {Icon && <Icon className="w-5 h-5 text-brand-primary" />}
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-[0.2em] text-brand-deep font-mono group-hover/panel:text-brand-primary transition-colors">
                {title}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-1.5 h-1.5 rounded-full bg-brand-primary animate-pulse" />
                <div className="h-0.5 w-12 bg-linear-to-r from-brand-primary/50 to-transparent rounded-full" />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {onRefresh && (
              <button
                onClick={onRefresh}
                disabled={loading}
                className={`p-2.5 hover:bg-brand-mist rounded-xl text-brand-sage transition-all border border-transparent hover:border-brand-sage/20 shadow-sm ${loading ? "animate-spin" : ""}`}
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            )}
            {actions}
          </div>
        </div>

        <div
          className={`flex-1 overflow-auto p-6 custom-scrollbar relative z-10 ${contentClassName}`}
        >
          {loading && !children && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-[2px] z-10">
              <div className="w-6 h-6 border-2 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin" />
            </div>
          )}

          {error ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6">
              <AlertCircle className="w-8 h-8 text-lab-laser/40 mb-3" />
              <p className="text-[10px] font-bold text-lab-laser uppercase tracking-widest mb-2">
                Panel Error
              </p>
              <p className="text-[10px] text-brand-sage leading-relaxed max-w-200px">
                {error}
              </p>
              {onRefresh && (
                <button
                  onClick={onRefresh}
                  className="mt-4 text-[9px] font-bold uppercase text-brand-primary hover:underline"
                >
                  Retry Request
                </button>
              )}
            </div>
          ) : (
            <ErrorBoundary name={`Panel: ${title}`}>{children}</ErrorBoundary>
          )}
        </div>
      </motion.div>
    );
  },
);

LabPanel.displayName = "LabPanel";
