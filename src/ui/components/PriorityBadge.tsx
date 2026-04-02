import React from "react";
import { AlertCircle, Zap, Activity } from "lucide-react";

interface PriorityBadgeProps {
  priority: "NORMAL" | "HIGH" | "STAT";
  className?: string;
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({
  priority,
  className = "",
}) => {
  const config = {
    NORMAL: {
      color: "bg-brand-sage/5 text-brand-sage border-brand-sage/20",
      icon: Activity,
      label: "Normal",
      glow: "group-hover:bg-brand-sage/10",
      animation: "",
    },
    HIGH: {
      color:
        "bg-orange-500/5 text-orange-600 border-orange-500/20 shadow-[0_0_12px_-4px_rgba(249,115,22,0.2)]",
      icon: AlertCircle,
      label: "High Priority",
      glow: "bg-orange-500/10",
      animation: "group-hover:rotate-12 transition-transform",
    },
    STAT: {
      color:
        "bg-red-500/10 text-red-600 border-red-600/30 shadow-[0_0_15px_-3px_rgba(220,38,38,0.3)]",
      icon: Zap,
      label: "Critical Stat",
      glow: "bg-red-600/20 animate-pulse",
      animation: "animate-[bounce_2s_infinite]",
    },
  };

  const current = config[priority];
  const Icon = current.icon;

  return (
    <span
      className={`
        group relative inline-flex items-center gap-2 px-3 py-1 rounded-full 
        text-[10px] font-black uppercase tracking-[0.15em] border transition-all duration-500
        ${current.color} ${className}
      `}
    >
      {/* Internal Glow Layer */}
      <span
        className={`absolute inset-0 rounded-full blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${current.glow}`}
      />

      {/* Icon with Kinetic Energy */}
      <div
        className={`relative z-10 flex items-center justify-center ${current.animation}`}
      >
        <Icon className="w-3.5 h-3.5 stroke-[2.5px]" />
      </div>

      {/* Label with specific character tracking */}
      <span className="relative z-10 leading-none">{current.label}</span>

      {/* STAT-only scanner line effect */}
      {priority === "STAT" && (
        <span className="absolute inset-0 overflow-hidden rounded-full pointer-events-none">
          <span className="absolute inset-0 w-full h-full bg-linear-to-r from-transparent via-white/40 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
        </span>
      )}
    </span>
  );
};
