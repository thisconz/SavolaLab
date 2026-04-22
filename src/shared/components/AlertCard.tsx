import React from "react";
import { LucideIcon } from "lucide-react";
import clsx from "@/src/lib/clsx";

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
    warning:
      "bg-zenthar-warning/10 border-zenthar-warning/20 text-zenthar-warning",
    error:
      "bg-zenthar-critical/10 border-zenthar-critical/20 text-zenthar-critical",
    info: "bg-zenthar-info/10 border-zenthar-info/20 text-zenthar-info",
    success:
      "bg-zenthar-success/10 border-zenthar-success/20 text-zenthar-success",
  };

  return (
    <div
      className={clsx(
        "p-5 rounded-2xl border relative overflow-hidden group transition-all duration-300",
        variants[type],
        className,
      )}
    >
      <div
        className={clsx(
          "absolute right-0 top-0 w-24 h-24 bg-linear-to-br from-current/10 to-transparent rounded-full blur-xl -mr-12 -mt-12 pointer-events-none transition-transform duration-700 group-hover:scale-150",
        )}
      />

      <div className="flex items-center justify-between mb-3 relative z-10">
        <div className="flex items-center gap-3">
          <div className={clsx("p-2 rounded-lg bg-current/10")}>
            <Icon size={16} />
          </div>
          <h4 className="text-[10px] font-black uppercase tracking-[0.2em]">
            {type}
          </h4>
        </div>
        {timestamp && (
          <span className="text-[8px] font-mono opacity-60">{timestamp}</span>
        )}
      </div>

      <p className="text-sm text-white font-black mb-1 relative z-10 uppercase tracking-tight">
        {title}
      </p>
      <p className="text-[11px] text-zenthar-text-secondary font-medium leading-relaxed relative z-10">
        {message}
      </p>
    </div>
  );
};
