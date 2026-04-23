import React, { memo, type FC, type ElementType } from "react";
import { motion } from "@/src/lib/motion";
import clsx from "@/src/lib/clsx";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export type MetricVariant = "primary" | "secondary" | "success" | "warning" | "error" | "info";

interface MetricCardProps {
  label: string;
  value: string | number;
  icon?: ElementType;
  trend?: string;
  variant?: MetricVariant;
  onClick?: () => void;
  className?: string;
  loading?: boolean;
}

// ─────────────────────────────────────────────
// Style maps — dark-theme consistent
// ─────────────────────────────────────────────

const STYLES: Record<
  MetricVariant,
  {
    bg: string;
    border: string;
    iconBg: string;
    icon: string;
    value: string;
    dot: string;
    glow: string;
  }
> = {
  primary: {
    bg: "bg-(--color-zenthar-carbon)",
    border: "border-(--color-zenthar-steel) hover:border-brand-primary/30",
    iconBg: "bg-brand-primary/10 border-brand-primary/20",
    icon: "text-brand-primary",
    value: "text-brand-primary",
    dot: "bg-brand-primary",
    glow: "shadow-brand-primary/10",
  },
  secondary: {
    bg: "bg-(--color-zenthar-carbon)",
    border: "border-(--color-zenthar-steel) hover:border-white/20",
    iconBg: "bg-white/8 border-white/10",
    icon: "text-(--color-zenthar-text-secondary)",
    value: "text-(--color-zenthar-text-primary)",
    dot: "bg-(--color-zenthar-text-muted)",
    glow: "shadow-transparent",
  },
  success: {
    bg: "bg-emerald-500/5",
    border: "border-emerald-500/15 hover:border-emerald-500/30",
    iconBg: "bg-emerald-500/10 border-emerald-500/20",
    icon: "text-emerald-400",
    value: "text-emerald-400",
    dot: "bg-emerald-500",
    glow: "shadow-emerald-500/10",
  },
  warning: {
    bg: "bg-amber-500/5",
    border: "border-amber-500/15 hover:border-amber-500/30",
    iconBg: "bg-amber-500/10 border-amber-500/20",
    icon: "text-amber-400",
    value: "text-amber-400",
    dot: "bg-amber-500",
    glow: "shadow-amber-500/10",
  },
  error: {
    bg: "bg-red-500/5",
    border: "border-red-500/15 hover:border-red-500/30",
    iconBg: "bg-red-500/10 border-red-500/20",
    icon: "text-red-400",
    value: "text-red-400",
    dot: "bg-red-500",
    glow: "shadow-red-500/10",
  },
  info: {
    bg: "bg-sky-500/5",
    border: "border-sky-500/15 hover:border-sky-500/30",
    iconBg: "bg-sky-500/10 border-sky-500/20",
    icon: "text-sky-400",
    value: "text-sky-400",
    dot: "bg-sky-500",
    glow: "shadow-sky-500/10",
  },
};

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

export const MetricCard: FC<MetricCardProps> = memo(
  ({
    label,
    value,
    icon: Icon,
    trend,
    variant = "primary",
    onClick,
    className,
    loading = false,
  }) => {
    const s = STYLES[variant];

    return (
      <motion.div
        whileHover={onClick ? { scale: 1.02, y: -1 } : undefined}
        whileTap={onClick ? { scale: 0.99 } : undefined}
        onClick={onClick}
        className={clsx(
          "relative overflow-hidden rounded-3xl border p-5 flex flex-col justify-between gap-4",
          "transition-all duration-300 shadow-lg",
          s.bg,
          s.border,
          s.glow,
          onClick && "cursor-pointer",
          className,
        )}
      >
        {/* Decorative glow circle */}
        <div
          className={clsx(
            "absolute -right-6 -top-6 w-24 h-24 rounded-full blur-2xl opacity-20 pointer-events-none",
            s.dot.replace("bg-", "bg-"),
          )}
        />

        {/* Top row */}
        <div className="flex items-start justify-between relative">
          <div className="flex items-center gap-1.5">
            <span className={clsx("w-1.5 h-1.5 rounded-full shrink-0", s.dot)} />
            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-(--color-zenthar-text-muted)">
              {label}
            </span>
          </div>
          {Icon && (
            <div
              className={clsx(
                "w-9 h-9 rounded-2xl flex items-center justify-center border shrink-0",
                s.iconBg,
              )}
            >
              <Icon className={clsx("w-4 h-4", s.icon)} />
            </div>
          )}
        </div>

        {/* Value */}
        <div className="relative">
          {loading ? (
            <div className="h-9 w-20 bg-(--color-zenthar-graphite) rounded-xl animate-pulse" />
          ) : (
            <motion.p
              key={String(value)}
              initial={{ opacity: 0.5, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className={clsx(
                "text-4xl font-light tracking-tighter leading-none tabular-nums",
                s.value,
              )}
            >
              {value}
            </motion.p>
          )}
          {trend && (
            <p className="text-[9px] text-(--color-zenthar-text-muted) font-medium mt-1.5">
              {trend}
            </p>
          )}
        </div>
      </motion.div>
    );
  },
);

export const MetricCardSkeleton: FC = () => (
  <div className="animate-pulse h-28 rounded-3xl bg-(--color-zenthar-carbon) border border-(--color-zenthar-steel)" />
);

MetricCard.displayName = "MetricCard";
MetricCardSkeleton.displayName = "MetricCardSkeleton";
