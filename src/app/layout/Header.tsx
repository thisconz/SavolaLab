import React, { memo, useMemo, type FC } from "react";
import { Activity, ChevronRight, Cpu, LucideIcon } from "lucide-react";
import { useAppStore } from "../../orchestrator/state/app.store";
import { NotificationCenter } from "../../capsules/notifications";
import { LogoRoot, LogoText } from "../../ui/components/Logo";
import clsx from "@/src/lib/clsx";

/**
 * Interface for Telemetry data to eliminate 'any'
 */
interface TelemetryProps {
  icon: LucideIcon;
  label: string;
  value: string;
  status: "success" | "info" | "warning";
}

export const Header: FC = memo(() => {
  const { activeTab } = useAppStore();

  const path = useMemo(() => {
    const node = activeTab?.toUpperCase() || "SYSTEM_ROOT";
    return ["ZENTHAR_OS", node];
  }, [activeTab]);

  return (
    <header className="sticky top-0 h-24 w-full border-b border-brand-sage/15 flex items-center justify-between px-10 bg-(--color-zenthar-carbon)/80 backdrop-blur-3xl z-50 shrink-0 overflow-hidden">
      {/* 1. LAYER: TECHNICAL UNDERLAY & EFFECTS */}
      <div className="absolute inset-0 bg-[url('/assets/grid-dot.svg')] opacity-[0.03] pointer-events-none" />
      
      {/* Scanline Effect (Subtle OS Aesthetic) */}
      <div className="absolute inset-0 bg-linear-to-b from-white/2 to-transparent pointer-events-none h-1/2" />
      
      {/* Bottom Border Glows */}
      <div className="absolute -bottom-px left-0 w-full h-px bg-linear-to-r from-transparent via-brand-primary/30 to-transparent" />
      <div className="absolute -bottom-px left-1/2 -translate-x-1/2 w-1/2 h-0.5 bg-brand-primary/20 blur-md transition-all duration-1000" />

      {/* LEFT: Branding & Dynamic Breadcrumbs */}
      <div className="flex items-center gap-10 relative z-10 min-w-0">
        <div className="hover:scale-105 transition-transform duration-300">
          <LogoRoot size="md" variant="light">
            <LogoText />
          </LogoRoot>
        </div>

        <div className="flex items-center gap-6 group">
          {/* Kinetic Separator */}
          <div className="h-10 w-0.5 bg-linear-to-b from-transparent via-brand-sage/20 to-transparent -rotate-12 group-hover:rotate-0 group-hover:scale-y-110 transition-all duration-500 ease-out" />

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-primary"></span>
              </span>
              <span className="text-[9px] font-black text-brand-sage uppercase tracking-[0.4em] opacity-50 selection:bg-brand-primary">
                Network_Node_Active
              </span>
            </div>

            <nav className="flex items-center gap-2 overflow-hidden whitespace-nowrap">
              {path.map((segment, i) => (
                <React.Fragment key={`${segment}-${i}`}>
                  {i > 0 && (
                    <ChevronRight className="w-3.5 h-3.5 text-brand-sage/20 shrink-0" strokeWidth={3} />
                  )}
                  <span
                    className={clsx(
                      "text-[12px] font-black tracking-[0.18em] transition-all duration-300 cursor-default",
                      i === path.length - 1
                        ? "text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]"
                        : "text-brand-sage/40 hover:text-brand-sage/80",
                    )}
                  >
                    {segment}
                  </span>
                </React.Fragment>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* RIGHT: Intelligence & Action Cluster */}
      <div className="flex items-center gap-8 relative z-10">
        <div className="hidden xl:flex items-center gap-2 pr-8 border-r border-brand-sage/10">
          <TelemetryModule
            icon={Activity}
            label="System_Load"
            value="Optimal"
            status="success"
          />
          <TelemetryModule
            icon={Cpu}
            label="Processing"
            value="3.2ms"
            status="info"
          />
        </div>

        <div className="flex items-center gap-5">
          <div className="p-1 rounded-full hover:bg-white/5 transition-colors cursor-pointer">
             <NotificationCenter />
          </div>
        </div>
      </div>
    </header>
  );
});

/* --- Refined Sub-Components --- */

const TelemetryModule: FC<TelemetryProps> = ({ icon: Icon, label, value, status }) => (
  <div className="flex items-center gap-3 py-2 px-4 rounded-xl border border-transparent hover:border-brand-sage/10 hover:bg-white/2 transition-all duration-300 cursor-help group/tel">
    <div
      className={clsx(
        "w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-700 group-hover/tel:rotate-360 shadow-inner",
        status === "success"
          ? "bg-emerald-500/10 text-emerald-400/80 group-hover/tel:text-emerald-300"
          : "bg-brand-primary/10 text-brand-primary/80 group-hover/tel:text-brand-primary",
      )}
    >
      <Icon className="w-4 h-4" strokeWidth={2} />
    </div>
    
    <div className="flex flex-col">
      <span className="text-[8px] font-bold text-brand-sage/40 uppercase tracking-[0.2em] leading-none mb-1.5 transition-colors group-hover/tel:text-brand-sage/70">
        {label}
      </span>
      <span className="text-[11px] font-mono font-black text-white/90 uppercase leading-none tabular-nums tracking-wider">
        {value}
      </span>
    </div>
  </div>
);

Header.displayName = "Header";