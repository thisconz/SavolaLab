import React from "react";
import { LucideIcon } from "lucide-react";
import { motion } from "@/src/lib/motion";
import clsx from "@/src/lib/clsx";

export type MetricVariant = "primary" | "secondary" | "success" | "warning" | "error" | "info";

interface MetricCardProps {
  label: string;
  value: string | number;
  trend?: string;
  icon: LucideIcon;
  variant?: MetricVariant;
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  trend,
  icon: Icon,
  variant = "primary",
  className,
}) => {
  const variants = {
    primary: {
      bg: "from-brand-primary/10",
      accent: "bg-brand-primary",
      text: "text-brand-primary",
      border: "border-brand-primary/20",
    },
    secondary: {
      bg: "from-brand-sage/10",
      accent: "bg-brand-sage",
      text: "text-brand-sage",
      border: "border-brand-sage/20",
    },
    success: {
      bg: "from-zenthar-success/10",
      accent: "bg-zenthar-success",
      text: "text-zenthar-success",
      border: "border-zenthar-success/20",
    },
    warning: {
      bg: "from-zenthar-warning/10",
      accent: "bg-zenthar-warning",
      text: "text-zenthar-warning",
      border: "border-zenthar-warning/20",
    },
    error: {
      bg: "from-zenthar-critical/10",
      accent: "bg-zenthar-critical",
      text: "text-zenthar-critical",
      border: "border-zenthar-critical/20",
    },
    info: {
      bg: "from-zenthar-info/10",
      accent: "bg-zenthar-info",
      text: "text-zenthar-info",
      border: "border-zenthar-info/20",
    },
  };

  const theme = variants[variant];
  const isPositive = trend?.includes("+");

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      className={clsx(
        "bg-(--color-zenthar-carbon) border border-(--color-zenthar-steel) rounded-[1.25rem] p-6 shadow-sm relative group overflow-hidden transition-all duration-300",
        className
      )}
    >
      {/* Decorative Background Gradient Blur */}
      <div
        className={clsx(
          "absolute -right-16 -top-16 w-40 h-40 bg-linear-to-br to-transparent rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700",
          theme.bg
        )}
      />

      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className="flex items-center gap-2">
          {/* Status Pulse */}
          <div
            className={clsx(
              "w-2 h-2 rounded-full",
              theme.accent,
              variant !== "success" && "animate-pulse"
            )}
          />
          <span className="text-[10px] font-black text-zenthar-text-secondary uppercase tracking-[0.2em] font-mono">
            {label}
          </span>
        </div>

        {trend && (
          <div
            className={clsx(
              "text-[9px] font-mono font-bold px-2 py-0.5 rounded-md border backdrop-blur-xs",
              isPositive
                ? "text-zenthar-success bg-zenthar-success/10 border-zenthar-success/30"
                : "text-zenthar-text-secondary bg-zenthar-graphite/50 border-white/6"
            )}
          >
            {trend}
          </div>
        )}
      </div>

      <div className="flex items-end justify-between relative z-10">
        <div className="text-4xl font-display font-bold text-(--color-zenthar-text-primary) tracking-tighter leading-none">
          {value}
        </div>

        <div
          className={clsx(
            "w-12 h-12 rounded-xl flex items-center justify-center border transition-all duration-500 group-hover:rotate-6",
            theme.bg.replace("from-", "bg-"), // Background fill
            theme.border,
            theme.text
          )}
        >
          <Icon className="w-6 h-6" />
        </div>
      </div>

      {/* Hover Progress Indicator */}
      <div
        className={clsx(
          "absolute right-0 top-0 w-48 h-48 bg-linear-to-br to-transparent rounded-full blur-3xl -mr-20 -mt-20 transition-transform duration-700 group-hover:scale-150",
          theme.bg
        )}
      />
      <div
        className={clsx(
          "absolute left-0 bottom-0 h-1 w-full bg-linear-to-r to-transparent transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500",
          theme.accent
        )}
      />
    </motion.div>
  );
};
