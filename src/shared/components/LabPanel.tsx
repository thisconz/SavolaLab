import React, { memo, type FC, type ReactNode, type ElementType } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import clsx from "@/src/lib/clsx";
 
interface LabPanelProps {
  title?:           string;
  icon?:            ElementType;
  children:         ReactNode;
  /** Optional component shown in the content area while loading=true */
  skeleton?:        ReactNode;
  actions?:         ReactNode;
  footer?:          ReactNode;
  loading?:         boolean;
  /** Error message string — displayed inline with a retry button */
  error?:           string | null;
  /** Called when user clicks the retry button inside the error state */
  onRefresh?:       () => void;
  /** Extra classes applied to the scrollable content wrapper div */
  contentClassName?: string;
  className?:       string;
  compact?:         boolean;
  glow?:            boolean;
}
 
export const LabPanel: FC<LabPanelProps> = memo(({
  // ─── FIX #03: all props now destructured ────────────────────────────────
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
  <div className={clsx(
    "flex flex-col h-full overflow-hidden rounded-3xl border transition-all",
    glow
      ? "bg-(--color-zenthar-carbon) border-brand-primary/30 shadow-lg shadow-brand-primary/10"
      : "bg-(--color-zenthar-carbon) border-brand-sage/10",
    className,
  )}>
    {/* Header */}
    {(title || actions) && (
      <div className={clsx(
        "flex items-center justify-between border-b border-brand-sage/10 bg-(--color-zenthar-carbon)/80 backdrop-blur-sm shrink-0",
        compact ? "px-5 py-3.5" : "px-6 py-5",
      )}>
        {title && (
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="w-8 h-8 rounded-xl bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4 text-brand-primary" />
              </div>
            )}
            <div className="flex items-center gap-2">
              <h3 className="text-[10px] font-black text-(--color-zenthar-text-primary) uppercase tracking-[0.25em]">
                {title}
              </h3>
              {loading && (
                <div className="w-3 h-3 rounded-full border-2 border-brand-primary border-t-transparent animate-spin" />
              )}
            </div>
          </div>
        )}
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    )}
 
    {/* Body — error state, skeleton state, or children */}
    <div className={clsx("flex-1 overflow-hidden", contentClassName)}>
      {error ? (
        // ─── FIX #03: error and onRefresh now actually accessible ─────────
        <div className="flex items-center gap-3 p-5 m-4 rounded-2xl bg-red-500/10 border border-red-500/20">
          <AlertCircle size={16} className="text-red-400 shrink-0" />
          <p className="text-xs font-bold text-red-400 flex-1">{error}</p>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black text-brand-primary border border-brand-primary/20 rounded-xl hover:bg-brand-primary/10 transition-all uppercase tracking-widest"
            >
              <RefreshCw size={10} /> Retry
            </button>
          )}
        </div>
      ) : loading && skeleton ? (
        // ─── ENHANCEMENT: show skeleton slot when loading ─────────────────
        skeleton
      ) : (
        children
      )}
    </div>
 
    {/* Footer */}
    {footer && (
      <div className="px-6 py-4 border-t border-brand-sage/10 bg-(--color-zenthar-carbon)/60 shrink-0">
        {footer}
      </div>
    )}
  </div>
));
 
LabPanel.displayName = "LabPanel";
 