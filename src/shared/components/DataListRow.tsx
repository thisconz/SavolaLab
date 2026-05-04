import React from "react";
import { type LucideIcon } from "lucide-react";
import clsx from "clsx";

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
    success: "text-lab-toxic bg-lab-toxic/10 border-lab-toxic/20",
    warning: "text-lab-warning bg-lab-warning/10 border-lab-warning/20",
    error: "text-brand-primary bg-brand-primary/10 border-brand-primary/20",
    info: "text-lab-laser bg-lab-laser/10 border-lab-laser/20",
    neutral: "text-zenthar-text-secondary bg-zenthar-graphite/50 border-white/[0.06]",
  };

  return (
    <div
      onClick={onClick}
      className={clsx(
        "bg-zenthar-graphite/30 hover:bg-zenthar-graphite/50 hover:border-brand-primary/20 group flex items-center justify-between rounded-2xl border border-white/4 p-5 transition-all duration-300 hover:shadow-md",
        onClick && "cursor-pointer",
        className,
      )}
    >
      <div className="flex items-center gap-5">
        <div className="bg-zenthar-carbon rounded-xl border border-white/4 p-2.5 shadow-sm transition-transform duration-300 group-hover:scale-110">
          <Icon className="text-brand-primary h-5 w-5 transition-colors group-hover:text-white" />
        </div>
        <div>
          <h4 className="text-sm font-black tracking-wider text-white uppercase">
            {id ? `${id} - ` : ""}
            {title}
          </h4>
          {subtitle && (
            <p className="text-zenthar-text-secondary mt-1 font-mono text-[10px] font-bold tracking-[0.2em] uppercase">
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
                "rounded-md border px-2.5 py-1 text-[9px] font-black tracking-[0.2em] uppercase",
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
              <div className="h-8 w-px bg-white/4" />
              <div className="text-right">
                <p className="text-lg leading-none font-black tracking-tight text-white">{metric.value}</p>
                <p className="text-zenthar-text-secondary mt-1 text-[9px] font-bold tracking-[0.2em] uppercase">
                  {metric.label}
                </p>
              </div>
            </React.Fragment>
          ))}
      </div>
    </div>
  );
};
