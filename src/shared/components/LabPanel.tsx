import React, { memo, type FC, type ReactNode, type ElementType } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import clsx from "@/src/lib/clsx";

interface LabPanelProps {
  title?: string;
  icon?: ElementType;
  children: ReactNode;
  skeleton?: ReactNode;
  actions?: ReactNode;
  footer?: ReactNode;
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  contentClassName?: string;
  className?: string;
  compact?: boolean;
  glow?: boolean;
}

export const LabPanel: FC<LabPanelProps> = memo(
  ({
    title,
    icon: Icon,
    children,
    skeleton,
    actions,
    footer,
    loading = false,
    error,
    onRefresh,
    contentClassName,
    className,
    compact = false,
    glow = false,
  }) => (
    <div
      className={clsx(
        "flex flex-col h-full overflow-hidden rounded-3xl border transition-all duration-300",
        glow
          ? "bg-(--color-zenthar-carbon) border-brand-primary/30 shadow-lg shadow-brand-primary/10"
          : "bg-(--color-zenthar-carbon) border-(--color-zenthar-steel)",
        className,
      )}
    >
      {/* ── Header ── */}
      {(title || actions) && (
        <div
          className={clsx(
            "flex items-center justify-between border-b border-(--color-zenthar-steel) shrink-0",
            "bg-(--color-zenthar-carbon)/80 backdrop-blur-sm",
            compact ? "px-4 py-3" : "px-6 py-4",
          )}
        >
          {title && (
            <div className="flex items-center gap-3 min-w-0">
              {Icon && (
                <div
                  className="w-7 h-7 rounded-xl bg-brand-primary/10 border border-brand-primary/20
                              flex items-center justify-center shrink-0"
                >
                  <Icon className="w-3.5 h-3.5 text-brand-primary" />
                </div>
              )}
              <h3 className="text-[10px] font-black text-(--color-zenthar-text-primary) uppercase tracking-[0.25em] truncate">
                {title}
              </h3>
              {loading && (
                <div
                  className="w-3 h-3 rounded-full border-2 border-brand-primary/30
                              border-t-brand-primary animate-spin shrink-0"
                />
              )}
            </div>
          )}
          {actions && (
            <div className="flex items-center gap-2 ml-auto pl-3 shrink-0">{actions}</div>
          )}
        </div>
      )}

      {/* ── Body ── */}
      <div className={clsx("flex-1 overflow-hidden", contentClassName)}>
        {error ? (
          <div
            className="flex items-start gap-3 p-4 m-4 rounded-2xl
                        bg-red-500/10 border border-red-500/20"
          >
            <AlertCircle size={14} className="text-red-400 shrink-0 mt-0.5" />
            <p className="text-[11px] font-bold text-red-400 flex-1 leading-relaxed">{error}</p>
            {onRefresh && (
              <button
                onClick={onRefresh}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[9px] font-black
                         text-brand-primary border border-brand-primary/20 rounded-xl
                         hover:bg-brand-primary/10 transition-all uppercase tracking-widest shrink-0"
              >
                <RefreshCw size={10} /> Retry
              </button>
            )}
          </div>
        ) : loading && skeleton ? (
          skeleton
        ) : (
          children
        )}
      </div>

      {/* ── Footer ── */}
      {footer && (
        <div
          className="px-6 py-3.5 border-t border-(--color-zenthar-steel)
                      bg-(--color-zenthar-carbon)/60 shrink-0"
        >
          {footer}
        </div>
      )}
    </div>
  ),
);

LabPanel.displayName = "LabPanel";
