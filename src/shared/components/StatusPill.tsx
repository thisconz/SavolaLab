import React, { memo, type FC } from "react";
import clsx from "@/src/lib/clsx";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export type StatusVariant =
  | "success"
  | "warning"
  | "error"
  | "info"
  | "primary"
  | "muted"
  | "critical"
  | "neutral";

interface StatusPillProps {
  label:     string;
  variant?:  StatusVariant;
  dot?:      boolean;
  className?: string;
  size?:     "xs" | "sm" | "md";
}

// ─────────────────────────────────────────────
// Style maps
// ─────────────────────────────────────────────

const PILL_STYLES: Record<StatusVariant, string> = {
  success:  "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
  warning:  "bg-amber-500/10  border-amber-500/20  text-amber-400",
  error:    "bg-red-500/10    border-red-500/20    text-red-400",
  info:     "bg-sky-500/10    border-sky-500/20    text-sky-400",
  primary:  "bg-brand-primary/10 border-brand-primary/20 text-brand-primary",
  muted:    "bg-white/5       border-white/10      text-zenthar-text-muted",
  critical: "bg-red-500/15    border-red-500/30    text-red-300 font-black",
  neutral:  "bg-white/5       border-white/8       text-zenthar-text-secondary",
};

const DOT_COLORS: Record<StatusVariant, string> = {
  success:  "bg-emerald-500",
  warning:  "bg-amber-500",
  error:    "bg-red-500",
  info:     "bg-sky-500",
  primary:  "bg-brand-primary",
  muted:    "bg-zenthar-text-muted",
  critical: "bg-red-400",
  neutral:  "bg-zenthar-text-secondary",
};

const SIZE_STYLES = {
  xs: "px-2 py-0.5 text-[8px] gap-1",
  sm: "px-2.5 py-1 text-[9px] gap-1.5",
  md: "px-3 py-1.5 text-[10px] gap-2",
} as const;

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

export const StatusPill: FC<StatusPillProps> = memo(({
  label,
  variant = "muted",
  dot     = true,
  size    = "sm",
  className,
}) => (
  <span className={clsx(
    "inline-flex items-center rounded-full border font-black uppercase tracking-wider whitespace-nowrap",
    PILL_STYLES[variant],
    SIZE_STYLES[size],
    className,
  )}>
    {dot && (
      <span className={clsx(
        "rounded-full shrink-0",
        size === "xs" ? "w-1 h-1" : "w-1.5 h-1.5",
        DOT_COLORS[variant],
      )} />
    )}
    {label}
  </span>
));

StatusPill.displayName = "StatusPill";