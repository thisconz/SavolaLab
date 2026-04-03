import React, { memo } from "react";
import { AlertCircle, Zap, Activity, LucideIcon } from "lucide-react";
import clsx from "@/src/lib/clsx";

/* ============================= */
/* Types & Config */
/* ============================= */

type PriorityLevel = "NORMAL" | "HIGH" | "STAT";

interface BadgeStyle {
  container: string;
  iconColor: string;
  icon: LucideIcon;
  label: string;
  glow: string;
}

const PRIORITY_CONFIG: Record<PriorityLevel, BadgeStyle> = {
  NORMAL: {
    label: "Status: Nominal",
    icon: Activity,
    iconColor: "text-brand-sage",
    container: "bg-brand-sage/5 text-brand-sage border-brand-sage/20",
    glow: "group-hover:bg-brand-sage/10",
  },
  HIGH: {
    label: "Priority: Elevated",
    icon: AlertCircle,
    iconColor: "text-orange-500",
    container: "bg-orange-500/5 text-orange-600 border-orange-500/20 shadow-[0_4px_12px_-4px_rgba(249,115,22,0.1)]",
    glow: "bg-orange-500/15 group-hover:blur-md",
  },
  STAT: {
    label: "Urgency: STAT",
    icon: Zap,
    iconColor: "text-red-500",
    container: "bg-red-600 text-white border-red-700 shadow-[0_8px_20px_-6px_rgba(220,38,38,0.4)]",
    glow: "bg-red-500/40 blur-xl animate-pulse",
  },
};

/* ============================= */
/* Component */
/* ============================= */

interface PriorityBadgeProps {
  priority: PriorityLevel;
  className?: string;
  showIcon?: boolean;
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = memo(({
  priority,
  className = "",
  showIcon = true,
}) => {
  const current = PRIORITY_CONFIG[priority];
  const Icon = current.icon;
  const isStat = priority === "STAT";

  return (
    <div
      className={clsx(
        "group relative inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-lg",
        "text-[9px] font-black uppercase tracking-[0.25em] border transition-all duration-500",
        "cursor-default overflow-hidden antialiased",
        current.container,
        className
      )}
    >
      {/* 1. KINETIC GLOW LAYER */}
      <div 
        className={clsx(
          "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none",
          current.glow
        )} 
      />

      {/* 2. ICON ENGINE */}
      {showIcon && (
        <div className={clsx(
          "relative z-10 flex items-center justify-center transition-transform duration-500 shrink-0",
          priority === "HIGH" && "group-hover:rotate-12",
          isStat && "animate-[pulse_1.5s_ease-in-out_infinite]"
        )}>
          <Icon className={clsx("w-3.5 h-3.5 stroke-[3px]", !isStat && current.iconColor)} />
        </div>
      )}

      {/* 3. LABEL: Monospace Impact */}
      <span className="relative z-10 leading-none drop-shadow-sm">
        {current.label}
      </span>

      {/* 4. STAT-SPECIFIC EFFECTS (Hazard Stripes & Scanner) */}
      {isStat && (
        <>
          {/* Subtle Hazard Stripe Background */}
          <div className="absolute inset-0 opacity-10 pointer-events-none bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,white_10px,white_20px)]" />
          
          {/* High-Velocity Scanner */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-0 h-full w-12 bg-linear-to-r from-transparent via-white/40 to-transparent -skew-x-12 animate-[shimmer_1.5s_infinite]" />
          </div>
        </>
      )}
    </div>
  );
});

PriorityBadge.displayName = "PriorityBadge";