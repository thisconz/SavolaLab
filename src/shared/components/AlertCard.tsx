import React from "react";
import { type LucideIcon } from "lucide-react";
import clsx from "clsx";

interface AlertCardProps {
  title: string;
  message: string;
  type: "warning" | "error" | "info" | "success";
  icon: LucideIcon;
  timestamp?: string;
  className?: string;
}

export const AlertCard: React.FC<AlertCardProps> = ({
  title,
  message,
  type,
  icon: Icon,
  timestamp,
  className,
}) => {
  const variants = {
    warning: "bg-zenthar-warning/10 border-zenthar-warning/20 text-zenthar-warning",
    error: "bg-zenthar-critical/10 border-zenthar-critical/20 text-zenthar-critical",
    info: "bg-zenthar-info/10 border-zenthar-info/20 text-zenthar-info",
    success: "bg-zenthar-success/10 border-zenthar-success/20 text-zenthar-success",
  };

  return (
    <div
      className={clsx(
        "group relative overflow-hidden rounded-2xl border p-5 transition-all duration-300",
        variants[type],
        className,
      )}
    >
      <div
        className={clsx(
          "pointer-events-none absolute top-0 right-0 -mt-12 -mr-12 h-24 w-24 rounded-full bg-linear-to-br from-current/10 to-transparent blur-xl transition-transform duration-700 group-hover:scale-150",
        )}
      />

      <div className="relative z-10 mb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={clsx("rounded-lg bg-current/10 p-2")}>
            <Icon size={16} />
          </div>
          <h4 className="text-[10px] font-black tracking-[0.2em] uppercase">{type}</h4>
        </div>
        {timestamp && <span className="font-mono text-[8px] opacity-60">{timestamp}</span>}
      </div>

      <p className="relative z-10 mb-1 text-sm font-black tracking-tight text-white uppercase">{title}</p>
      <p className="text-zenthar-text-secondary relative z-10 text-[11px] leading-relaxed font-medium">
        {message}
      </p>
    </div>
  );
};
