import React from "react";
import clsx from "@/src/lib/clsx";

export type StatusVariant = 
  | "success" 
  | "warning" 
  | "critical" 
  | "info" 
  | "neutral"
  | "primary";

interface StatusPillProps {
  label: string;
  variant?: StatusVariant;
  className?: string;
  icon?: React.ReactNode;
}

export const StatusPill: React.FC<StatusPillProps> = ({
  label,
  variant = "neutral",
  className,
  icon,
}) => {
  const variants = {
    success: "text-zenthar-success bg-zenthar-success/10 border-zenthar-success/20",
    warning: "text-zenthar-warning bg-zenthar-warning/10 border-zenthar-warning/20",
    critical: "text-zenthar-critical bg-zenthar-critical/10 border-zenthar-critical/20",
    info: "text-zenthar-info bg-zenthar-info/10 border-zenthar-info/20",
    neutral: "text-zenthar-text-secondary bg-zenthar-graphite/50 border-white/[0.06]",
    primary: "text-brand-primary bg-brand-primary/10 border-brand-primary/20",
  };

  return (
    <div
      className={clsx(
        "px-2.5 py-1 rounded-md text-[10px] font-mono font-bold uppercase tracking-widest border flex items-center gap-1.5",
        variants[variant],
        className
      )}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {label}
    </div>
  );
};
