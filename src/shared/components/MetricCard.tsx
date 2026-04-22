import React, { memo, type FC, type ElementType } from "react";
import { motion } from "@/src/lib/motion";
import clsx from "@/src/lib/clsx";

type Variant = "primary" | "secondary" | "success" | "warning" | "error" | "info";

interface MetricCardProps {
  label:     string;
  value:     string | number;
  icon?:     ElementType;
  trend?:    string;
  variant?:  Variant;
  onClick?:  () => void;
  className?:string;
  loading?:  boolean;
}

const VARIANT_STYLES: Record<Variant, {
  bg:     string;
  iconBg: string;
  icon:   string;
  value:  string;
  dot:    string;
}> = {
  primary:   { bg: "bg-white/80 border-white",                          iconBg: "bg-brand-primary/10 border-brand-primary/20",   icon: "text-brand-primary",   value: "text-brand-primary",   dot: "bg-brand-primary"   },
  secondary: { bg: "bg-white/80 border-white",                          iconBg: "bg-slate-100 border-slate-200",                 icon: "text-slate-500",       value: "text-slate-700",       dot: "bg-slate-400"       },
  success:   { bg: "bg-emerald-50/80 border-emerald-100",               iconBg: "bg-emerald-100 border-emerald-200",             icon: "text-emerald-600",     value: "text-emerald-700",     dot: "bg-emerald-500"     },
  warning:   { bg: "bg-amber-50/80 border-amber-100",                   iconBg: "bg-amber-100 border-amber-200",                 icon: "text-amber-600",       value: "text-amber-700",       dot: "bg-amber-500"       },
  error:     { bg: "bg-red-50/80 border-red-100",                       iconBg: "bg-red-100 border-red-200",                    icon: "text-red-600",         value: "text-red-700",         dot: "bg-red-500"         },
  info:      { bg: "bg-sky-50/80 border-sky-100",                       iconBg: "bg-sky-100 border-sky-200",                    icon: "text-sky-600",         value: "text-sky-700",         dot: "bg-sky-500"         },
};

export const MetricCard: FC<MetricCardProps> = memo(({
  label, value, icon: Icon, trend, variant = "primary", onClick, className, loading = false,
}) => {
  const s = VARIANT_STYLES[variant];

  return (
    <motion.div
      whileHover={onClick ? { scale: 1.02, y: -1 } : undefined}
      whileTap={onClick  ? { scale: 0.99 }          : undefined}
      onClick={onClick}
      className={clsx(
        "relative overflow-hidden rounded-3xl border backdrop-blur-xl p-6 flex flex-col justify-between gap-4 transition-all",
        s.bg,
        onClick && "cursor-pointer hover:shadow-lg",
        className,
      )}
    >
      {/* Decorative background circle */}
      <div className={clsx("absolute -right-8 -top-8 w-32 h-32 rounded-full opacity-[0.04]", s.value.replace("text-", "bg-"))} />

      {/* Top row */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-1.5">
          <div className={clsx("w-1.5 h-1.5 rounded-full", s.dot)} />
          <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500">{label}</span>
        </div>
        {Icon && (
          <div className={clsx("w-10 h-10 rounded-2xl flex items-center justify-center border", s.iconBg)}>
            <Icon className={clsx("w-5 h-5", s.icon)} />
          </div>
        )}
      </div>

      {/* Value */}
      <div>
        {loading ? (
          <div className="h-10 w-24 bg-slate-200 rounded-xl animate-pulse" />
        ) : (
          <motion.p
            key={String(value)}
            initial={{ opacity: 0.6, y: 4 }}
            animate={{ opacity: 1,   y: 0 }}
            className={clsx("text-4xl font-light tracking-tighter leading-none tabular-nums", s.value)}
          >
            {value}
          </motion.p>
        )}
        {trend && (
          <p className="text-[9px] text-slate-400 font-medium mt-1.5">{trend}</p>
        )}
      </div>
    </motion.div>
  );
});

export const MetricCardSkeleton = () => (
  <div className="animate-pulse h-20 rounded-xl bg-gray-800/40" />
);

MetricCard.displayName = "MetricCard";
