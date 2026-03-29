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
      color: "bg-brand-sage/10 text-brand-sage border-brand-sage/20",
      icon: Activity,
      label: "NORMAL",
    },
    HIGH: {
      color: "bg-orange-500/10 text-orange-600 border-orange-500/20",
      icon: AlertCircle,
      label: "HIGH",
    },
    STAT: {
      color: "bg-red-500/10 text-red-600 border-red-500/20 animate-pulse",
      icon: Zap,
      label: "STAT",
    },
  };

  const current = config[priority];
  const Icon = current.icon;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest border ${current.color} ${className}`}
    >
      <Icon className="w-3 h-3" />
      {current.label}
    </span>
  );
};
