import { memo, type FC, type ReactNode, type ElementType } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import clsx from "clsx";

interface LabPanelProps {
  title?: string;
  icon?: ElementType;
  children: ReactNode;
  skeleton?: ReactNode;
  actions?: ReactNode;
  footer?: ReactNode;
  loading?: boolean;
  error?: string | undefined;
  onRefresh?: () => void;
  contentClassName?: string;
  className?: string;
  compact?: boolean;
  glow?: boolean;
  accentColor?: string;
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
    accentColor = "#f43f5e",
  }) => (
    <div
      className={clsx("relative flex h-full flex-col overflow-hidden rounded-2xl", className)}
      style={{
        background: "linear-gradient(135deg, rgba(8,8,26,0.97) 0%, rgba(5,5,15,0.99) 100%)",
        border: `1px solid ${glow ? accentColor + "44" : "rgba(100,120,200,0.12)"}`,
        boxShadow: glow
          ? `0 0 30px ${accentColor}20, 0 4px 32px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.04)`
          : "0 4px 24px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.03)",
      }}
    >
      {/* Subtle grid pattern */}
      <div className="instrument-grid pointer-events-none absolute inset-0 rounded-2xl opacity-40" />

      {/* Top edge glow */}
      <div
        className="pointer-events-none absolute top-0 right-0 left-0 h-px"
        style={{
          background: `linear-gradient(90deg, transparent 10%, ${accentColor}60 50%, transparent 90%)`,
        }}
      />

      {/* Header */}
      {(title || actions) && (
        <div
          className={clsx(
            "relative z-10 flex shrink-0 items-center justify-between border-b",
            "backdrop-blur-sm",
            compact ? "px-4 py-3" : "px-5 py-4",
          )}
          style={{
            background: "rgba(8,8,26,0.6)",
            borderColor: "rgba(100,120,200,0.1)",
          }}
        >
          {title && (
            <div className="flex min-w-0 items-center gap-3">
              {Icon && (
                <div
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                  style={{
                    background: `${accentColor}15`,
                    border: `1px solid ${accentColor}30`,
                    boxShadow: `0 0 10px ${accentColor}15`,
                  }}
                >
                  <Icon className="h-3.5 w-3.5" style={{ color: accentColor }} />
                </div>
              )}
              <h3 className="text-zenthar-text-primary truncate text-[10px] font-black tracking-[0.25em] uppercase">
                {title}
              </h3>
              {loading && (
                <div
                  className="h-3 w-3 shrink-0 animate-spin rounded-full border-2 border-t-transparent"
                  style={{ borderColor: `${accentColor}40`, borderTopColor: accentColor }}
                />
              )}
            </div>
          )}

          {actions && <div className="ml-auto flex shrink-0 items-center gap-2 pl-3">{actions}</div>}
        </div>
      )}

      {/* Body */}
      <div className={clsx("relative z-10 flex-1 overflow-hidden", contentClassName)}>
        {error ? (
          <div
            className="m-4 flex items-start gap-3 rounded-xl p-4"
            style={{
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.2)",
            }}
          >
            <AlertCircle size={14} className="mt-0.5 shrink-0 text-red-400" />
            <p className="flex-1 text-[11px] leading-relaxed font-bold text-red-400">{error}</p>
            {onRefresh && (
              <button
                onClick={onRefresh}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[9px] font-black tracking-widest uppercase transition-all"
                style={{
                  color: accentColor,
                  border: `1px solid ${accentColor}30`,
                  background: `${accentColor}10`,
                }}
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

      {/* Footer */}
      {footer && (
        <div
          className="relative z-10 shrink-0 border-t px-5 py-3.5"
          style={{
            background: "rgba(5,5,15,0.8)",
            borderColor: "rgba(100,120,200,0.08)",
          }}
        >
          {footer}
        </div>
      )}

      {/* Bottom glow */}
      {glow && (
        <div
          className="pointer-events-none absolute right-0 bottom-0 left-0 h-px"
          style={{
            background: `linear-gradient(90deg, transparent 10%, ${accentColor}40 50%, transparent 90%)`,
          }}
        />
      )}
    </div>
  ),
);

LabPanel.displayName = "LabPanel";
