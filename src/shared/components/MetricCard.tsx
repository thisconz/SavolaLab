import { memo, type FC, type ElementType } from "react";
import { motion } from "framer-motion";
import clsx from "clsx";

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

interface VariantStyle {
  border: string;
  iconBg: string;
  iconColor: string;
  valueColor: string;
  dotColor: string;
  glowColor: string;
  bgAccent: string;
  trendColor: string;
}

const VARIANT_STYLES: Record<MetricVariant, VariantStyle> = {
  primary: {
    border: "rgba(244,63,94,0.25)",
    iconBg: "rgba(244,63,94,0.1)",
    iconColor: "#f43f5e",
    valueColor: "#f43f5e",
    dotColor: "#f43f5e",
    glowColor: "rgba(244,63,94,0.15)",
    bgAccent: "rgba(244,63,94,0.04)",
    trendColor: "rgba(244,63,94,0.7)",
  },
  secondary: {
    border: "rgba(100,120,200,0.2)",
    iconBg: "rgba(100,120,200,0.08)",
    iconColor: "#8892b0",
    valueColor: "#f0f4ff",
    dotColor: "#8892b0",
    glowColor: "rgba(100,120,200,0.08)",
    bgAccent: "rgba(100,120,200,0.03)",
    trendColor: "#3d4a6b",
  },
  success: {
    border: "rgba(16,185,129,0.3)",
    iconBg: "rgba(16,185,129,0.1)",
    iconColor: "#10b981",
    valueColor: "#10b981",
    dotColor: "#10b981",
    glowColor: "rgba(16,185,129,0.12)",
    bgAccent: "rgba(16,185,129,0.04)",
    trendColor: "rgba(16,185,129,0.7)",
  },
  warning: {
    border: "rgba(245,158,11,0.3)",
    iconBg: "rgba(245,158,11,0.1)",
    iconColor: "#f59e0b",
    valueColor: "#f59e0b",
    dotColor: "#f59e0b",
    glowColor: "rgba(245,158,11,0.12)",
    bgAccent: "rgba(245,158,11,0.04)",
    trendColor: "rgba(245,158,11,0.7)",
  },
  error: {
    border: "rgba(239,68,68,0.3)",
    iconBg: "rgba(239,68,68,0.1)",
    iconColor: "#ef4444",
    valueColor: "#ef4444",
    dotColor: "#ef4444",
    glowColor: "rgba(239,68,68,0.12)",
    bgAccent: "rgba(239,68,68,0.04)",
    trendColor: "rgba(239,68,68,0.7)",
  },
  info: {
    border: "rgba(34,211,238,0.3)",
    iconBg: "rgba(34,211,238,0.1)",
    iconColor: "#22d3ee",
    valueColor: "#22d3ee",
    dotColor: "#22d3ee",
    glowColor: "rgba(34,211,238,0.12)",
    bgAccent: "rgba(34,211,238,0.04)",
    trendColor: "rgba(34,211,238,0.7)",
  },
};

export const MetricCard: FC<MetricCardProps> = memo(
  ({ label, value, icon: Icon, trend, variant = "primary", onClick, className, loading = false }) => {
    const s = VARIANT_STYLES[variant];

    return (
      <motion.div
        whileHover={onClick ? { scale: 1.02, y: -2 } : undefined}
        whileTap={onClick ? { scale: 0.98 } : undefined}
        onClick={onClick}
        className={clsx(
          "relative flex flex-col gap-3 overflow-hidden rounded-2xl p-5 transition-all duration-300",
          onClick && "cursor-pointer",
          className,
        )}
        style={{
          background: `linear-gradient(135deg, ${s.bgAccent} 0%, rgba(5,5,15,0.98) 100%)`,
          border: `1px solid ${s.border}`,
          boxShadow: `0 0 20px ${s.glowColor}, 0 4px 24px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.04)`,
        }}
      >
        {/* Corner accent */}
        <div
          className="absolute top-0 right-0 h-16 w-16 rounded-bl-full opacity-40"
          style={{ background: `radial-gradient(circle at top right, ${s.glowColor}, transparent)` }}
        />

        {/* Top grid decoration */}
        <div className="instrument-grid pointer-events-none absolute inset-0 opacity-60" />

        {/* Scan line animation on hover */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
          <motion.div
            animate={{ y: ["-100%", "200%"] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="absolute right-0 left-0 h-px opacity-0 hover:opacity-100"
            style={{ background: `linear-gradient(90deg, transparent, ${s.dotColor}, transparent)` }}
          />
        </div>

        {/* Header row */}
        <div className="relative z-10 flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div
              className="h-3 w-1 rounded-full"
              style={{ background: s.dotColor, boxShadow: `0 0 6px ${s.dotColor}` }}
            />
            <span className="text-zenthar-text-muted text-[9px] font-black tracking-[0.3em] uppercase">
              {label}
            </span>
          </div>

          {Icon && (
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl"
              style={{
                background: s.iconBg,
                border: `1px solid ${s.border}`,
                boxShadow: `0 0 12px ${s.glowColor}`,
              }}
            >
              <Icon className="h-4 w-4" style={{ color: s.iconColor }} />
            </div>
          )}
        </div>

        {/* Value */}
        <div className="relative z-10">
          {loading ? (
            <div className="bg-zenthar-graphite h-10 w-24 animate-pulse rounded-xl" />
          ) : (
            <motion.p
              key={String(value)}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl leading-none font-light tracking-tighter tabular-nums"
              style={{
                color: s.valueColor,
                textShadow: `0 0 20px ${s.glowColor}`,
              }}
            >
              {value}
            </motion.p>
          )}

          {trend && (
            <p
              className="mt-1.5 font-mono text-[9px] tracking-widest uppercase"
              style={{ color: s.trendColor }}
            >
              {trend}
            </p>
          )}
        </div>

        {/* Bottom accent line */}
        <div
          className="absolute right-0 bottom-0 left-0 h-px"
          style={{
            background: `linear-gradient(90deg, transparent, ${s.dotColor}, transparent)`,
            opacity: 0.4,
          }}
        />
      </motion.div>
    );
  },
);

export const MetricCardSkeleton: FC = () => (
  <div
    className="h-28 animate-pulse rounded-2xl"
    style={{
      background: "rgba(8,8,26,0.95)",
      border: "1px solid rgba(100,120,200,0.1)",
    }}
  />
);

MetricCard.displayName = "MetricCard";
MetricCardSkeleton.displayName = "MetricCardSkeleton";
