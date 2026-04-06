import React, { memo, useState, useMemo } from "react";
import {
  Activity,
  Database,
  LogOut,
  RefreshCw,
  Box,
  ShieldCheck,
  Zap,
  ChevronRight,
  Cpu,
} from "lucide-react";
import { useAppStore } from "../../orchestrator/state/app.store";
import { useAuthStore } from "../../orchestrator/state/auth.store";
import { NotificationCenter } from "../../capsules/notifications";
import { LogoRoot, LogoText } from "../../ui/components/Logo";
import { motion, AnimatePresence } from "@/src/lib/motion";
import clsx from "@/src/lib/clsx";

export const Header: React.FC = memo(() => {
  const { activeTab } = useAppStore();

  // Derive logical path from activeTab
  const path = useMemo(() => {
    const node = activeTab?.toUpperCase() || "SYSTEM_ROOT";
    return ["ZENTHAR_OS", node];
  }, [activeTab]);

  return (
    <header className="h-24 border-b border-brand-sage/15 flex items-center justify-between px-10 bg-white/70 backdrop-blur-3xl relative z-50 shrink-0">
      {/* 1. LAYER: TECHNICAL UNDERLAY */}
      <div className="absolute inset-0 bg-[url('/assets/grid-dot.svg')] opacity-[0.03] pointer-events-none" />
      <div className="absolute -bottom-px left-0 w-full h-px bg-linear-to-r from-transparent via-brand-primary/30 to-transparent" />

      {/* Laser Focus Glow */}
      <div className="absolute -bottom-px left-1/2 -translate-x-1/2 w-1/3 h-0.5 bg-brand-primary/40 blur-xs" />

      {/* LEFT: Branding & Dynamic Breadcrumbs */}
      <div className="flex items-center gap-10 relative z-10">
        <LogoRoot size="md" variant="dark">
          <LogoText />
        </LogoRoot>

        <div className="flex items-center gap-6 group">
          <div className="h-8 w-px bg-brand-sage/20 -rotate-12 group-hover:rotate-0 transition-transform duration-500" />

          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 mb-1.5">
              <div className="w-1 h-1 rounded-full bg-brand-primary animate-pulse" />
              <span className="text-[8px] font-black text-brand-sage uppercase tracking-[0.4em] opacity-60">
                Network_Node_Active
              </span>
            </div>

            <nav className="flex items-center gap-2">
              {path.map((segment, i) => (
                <React.Fragment key={segment}>
                  {i > 0 && (
                    <ChevronRight className="w-3 h-3 text-brand-sage/30" />
                  )}
                  <span
                    className={clsx(
                      "text-[11px] font-black tracking-[0.15em] transition-colors",
                      i === path.length - 1
                        ? "text-brand-deep"
                        : "text-brand-sage/60",
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
        {/* Real-time Telemetry (Desktop Only) */}
        <div className="hidden xl:flex items-center gap-4 pr-8 border-r border-brand-sage/10">
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

        {/* Global Controls */}
        <div className="flex items-center gap-4">
          <NotificationCenter />
        </div>
      </div>
    </header>
  );
});

/* --- Refined Sub-Components --- */

const TelemetryModule = ({ icon: Icon, label, value, status }: any) => (
  <div className="flex items-center gap-3 py-1.5 px-3 rounded-xl hover:bg-white/50 transition-colors cursor-help group/tel">
    <div
      className={clsx(
        "w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-500 group-hover/tel:rotate-360",
        status === "success"
          ? "bg-emerald-50 text-emerald-600"
          : "bg-brand-primary/10 text-brand-primary",
      )}
    >
      <Icon className="w-3.5 h-3.5" strokeWidth={2.5} />
    </div>
    <div className="flex flex-col">
      <span className="text-[7px] font-black text-brand-sage/60 uppercase tracking-[0.2em] leading-none mb-1">
        {label}
      </span>
      <span className="text-[10px] font-mono font-black text-brand-deep uppercase leading-none tabular-nums">
        {value}
      </span>
    </div>
  </div>
);

Header.displayName = "Header";