import React, { memo, type FC, type ReactNode, type ElementType } from "react";
import clsx from "@/src/lib/clsx";
import { AlertCircle } from "lucide-react";

interface LabPanelProps {
  title?:          string;
  icon?:           ElementType;
  children:        ReactNode;
  actions?:        ReactNode;
  footer?:         ReactNode;
  loading?:        boolean;
  error?:          string | null;
  onRefresh?:      () => void;
  contentClassName?: string;
  className?:      string;
  compact?:        boolean;
  glow?:           boolean;
}

export const LabPanel: FC<LabPanelProps> = memo(({
  title, icon: Icon, children, actions, footer, loading = false,
  className, compact = false, glow = false,
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
        "flex items-center justify-between border-b border-brand-sage/10 bg-(--color-zenthar-carbon)/80 backdrop-blur-sm",
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

    {/* Body */}
    <div className={clsx("flex-1 overflow-hidden", contentClassName)}>
      {error ? (
        <div className="p-4 text-red-400 text-xs font-mono flex items-center gap-2">
          <AlertCircle size={14} /> {error}
          {onRefresh && (
            <button onClick={onRefresh} className="ml-auto text-brand-primary hover:underline">Retry</button>
          )}
        </div>
      ) : children}
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