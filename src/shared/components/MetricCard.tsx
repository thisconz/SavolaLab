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
    border: "border-(--color-zenthar-steel) hover:border-(--color-zenthar-text-secondary)/20",
    iconBg: "bg-(--color-zenthar-graphite) border-(--color-zenthar-steel)",
    icon: "text-(--color-zenthar-text-secondary)",
    value: "text-(--color-zenthar-text-primary)",
    dot: "bg-(--color-zenthar-text-muted)",
    glow: "shadow-transparent",
  },
  success: {
    bg: "bg-lab-toxic/5",
    border: "border-lab-toxic/15 hover:border-lab-toxic/30",
    iconBg: "bg-lab-toxic/10 border-lab-toxic/20",
    icon: "text-lab-toxic",
    value: "text-lab-toxic",
    dot: "bg-lab-toxic",
    glow: "shadow-lab-toxic/10",
  },
  warning: {
    bg: "bg-lab-warning/5",
    border: "border-lab-warning/15 hover:border-lab-warning/30",
    iconBg: "bg-lab-warning/10 border-lab-warning/20",
    icon: "text-lab-warning",
    value: "text-lab-warning",
    dot: "bg-lab-warning",
    glow: "shadow-lab-warning/10",
  },
  error: {
    bg: "bg-brand-primary/5",
    border: "border-brand-primary/15 hover:border-brand-primary/30",
    iconBg: "bg-brand-primary/10 border-brand-primary/20",
    icon: "text-brand-primary",
    value: "text-brand-primary",
    dot: "bg-brand-primary",
    glow: "shadow-brand-primary/10",
  },
  info: {
    bg: "bg-lab-laser/5",
    border: "border-lab-laser/15 hover:border-lab-laser/30",
    iconBg: "bg-lab-laser/10 border-lab-laser/20",
    icon: "text-lab-laser",
    value: "text-lab-laser",
    dot: "bg-lab-laser",
    glow: "shadow-lab-laser/10",
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
