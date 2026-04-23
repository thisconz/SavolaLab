import React from "react";
import { LucideIcon } from "lucide-react";
import clsx from "@/src/lib/clsx";

interface DataListRowProps {
  id?: string;
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  status?: {
    label: string;
    variant: "success" | "warning" | "error" | "info" | "neutral";
  };
  metrics?: {
    label: string;
    value: string | number;
  }[];
  onClick?: () => void;
  className?: string;
}

export const DataListRow: React.FC<DataListRowProps> = ({
  id,
  title,
  subtitle,
  icon: Icon,
  status,
  metrics,
  onClick,
  className,
}) => {
  const statusVariants = {
    success: "text-zenthar-success bg-zenthar-success/10 border-zenthar-success/20",
    warning: "text-zenthar-warning bg-zenthar-warning/10 border-zenthar-warning/20",
    error: "text-zenthar-critical bg-zenthar-critical/10 border-zenthar-critical/20",
    info: "text-zenthar-info bg-zenthar-info/10 border-zenthar-info/20",
    neutral: "text-zenthar-text-secondary bg-zenthar-graphite/50 border-white/[0.06]",
  };

  return (
    <div
      onClick={onClick}
      className={clsx(
        "flex items-center justify-between p-5 rounded-2xl border border-white/4 bg-zenthar-graphite/30 hover:bg-zenthar-graphite/50 hover:border-brand-primary/20 hover:shadow-md transition-all duration-300 group",
        onClick && "cursor-pointer",
        className,
      )}
    >
      <div className="flex items-center gap-5">
        <div className="p-2.5 bg-zenthar-carbon rounded-xl shadow-sm group-hover:scale-110 transition-transform duration-300 border border-white/4">
          <Icon className="w-5 h-5 text-brand-primary group-hover:text-white transition-colors" />
        </div>
        <div>
          <h4 className="text-sm font-black text-white uppercase tracking-wider">
            {id ? `${id} - ` : ""}
            {title}
          </h4>
          {subtitle && (
            <p className="text-[10px] text-zenthar-text-secondary font-mono font-bold uppercase tracking-[0.2em] mt-1">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-12 pr-4">
        {status && (
          <div className="text-right">
            <span
              className={clsx(
                "px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-[0.2em] border",
                statusVariants[status.variant],
              )}
            >
              {status.label}
            </span>
          </div>
        )}

        {metrics &&
          metrics.map((metric, i) => (
            <React.Fragment key={i}>
              <div className="w-px h-8 bg-white/4" />
              <div className="text-right">
                <p className="text-lg font-black text-white tracking-tight leading-none">
                  {metric.value}
                </p>
                <p className="text-[9px] text-zenthar-text-secondary font-bold uppercase tracking-[0.2em] mt-1">
                  {metric.label}
                </p>
              </div>
            </React.Fragment>
          ))}
      </div>
    </div>
  );
};
