import React, { memo, useMemo, type FC } from "react";
import { Activity, ChevronRight, Cpu, LucideIcon, Home, Zap, ShieldCheck } from "lucide-react";
import { useAppStore } from "../../orchestrator/state/app.store";
import { NotificationCenter } from "../../capsules/notifications";
import { LogoRoot, LogoText } from "../../ui/components/Logo";
import { motion } from "@/src/lib/motion";
import clsx from "@/src/lib/clsx";

interface TelemetryProps {
  icon: LucideIcon;
  label: string;
  value: string;
  status: "success" | "info" | "warning";
  percent?: number;
}

export const Header: FC = memo(() => {
  const { activeTab } = useAppStore();

  const path = useMemo(() => {
    const node = activeTab?.toUpperCase() || "SYSTEM_ROOT";
    return ["ZENTHAR", node];
  }, [activeTab]);

  return (
    <header className="sticky top-0 h-24 w-full border-b border-white/4 flex items-center justify-between px-10 bg-[#080809]/90 backdrop-blur-2xl z-50 shrink-0 overflow-hidden">
      {/* 1. LAYER: ATMOSPHERICS */}
      <div className="absolute inset-0 bg-[url('/assets/grid-dot.svg')] opacity-[0.02] pointer-events-none" />
      
      {/* Dynamic Scanline HUD */}
      <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-brand-primary/20 to-transparent animate-pulse" />
      <div 
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          background: `linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.03) 50%, transparent 100%)`,
          backgroundSize: '200% 100%',
        }}
      />

      {/* LEFT: Branding & Navigation Matrix */}
      <div className="flex items-center gap-12 relative z-10 min-w-0">
        <motion.div 
          whileHover={{ scale: 1.02, filter: "brightness(1.2)" }}
          className="cursor-pointer"
        >
          <LogoRoot size="md" variant="light">
            <LogoText className="tracking-[0.5em]" />
          </LogoRoot>
        </motion.div>

        <div className="flex items-center gap-8 group">
          {/* Vertical Angled Separator */}
          <div className="h-12 w-px bg-white/10 rotate-20 group-hover:rotate-0 transition-transform duration-500" />

          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/5 border border-emerald-500/20">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                </span>
                <span className="text-[7px] font-black text-emerald-400 uppercase tracking-widest">Live_Signal</span>
              </div>
              <div className="h-px w-8 bg-white/5" />
              <span className="text-[8px] font-mono font-bold text-zinc-600 uppercase tracking-[0.3em]">
                Node: 0x-ALPHA
              </span>
            </div>

            <nav className="flex items-center gap-3">
              <Home className="w-3 h-3 text-zinc-500 hover:text-brand-primary transition-colors cursor-pointer" />
              {path.map((segment, i) => (
                <React.Fragment key={`${segment}-${i}`}>
                  <ChevronRight className="w-3 h-3 text-zinc-800" strokeWidth={4} />
                  <motion.span
                    initial={{ opacity: 0, x: -5 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={clsx(
                      "text-[13px] font-black tracking-[0.2em] uppercase transition-all duration-500 cursor-default",
                      i === path.length - 1
                        ? "text-white drop-shadow-[0_0_12px_rgba(var(--brand-primary-rgb),0.4)]"
                        : "text-zinc-600 hover:text-zinc-400"
                    )}
                  >
                    {segment}
                  </motion.span>
                </React.Fragment>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* RIGHT: System Intelligence */}
      <div className="flex items-center gap-6 relative z-10">
        <div className="hidden lg:flex items-center gap-4 px-6 py-2 rounded-2xl bg-white/2 border border-white/5 shadow-inner">
          <TelemetryModule
            icon={Activity}
            label="Load"
            value="Optimal"
            status="success"
            percent={12}
          />
          <div className="w-px h-8 bg-white/3" />
          <TelemetryModule
            icon={Zap}
            label="Latency"
            value="12ms"
            status="info"
            percent={85}
          />
          <div className="w-px h-8 bg-white/3" />
          <TelemetryModule
            icon={ShieldCheck}
            label="Security"
            value="Encrypted"
            status="success"
          />
        </div>

        <div className="relative group">
          <div className="absolute inset-0 bg-brand-primary/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative p-3 rounded-xl bg-white/3 border border-white/10 hover:border-brand-primary/40 transition-all cursor-pointer">
             <NotificationCenter />
          </div>
        </div>
      </div>
    </header>
  );
});

const TelemetryModule: FC<TelemetryProps> = ({ icon: Icon, label, value, status, percent = 100 }) => (
  <div className="flex items-center gap-4 py-1 px-2 group/tel cursor-help">
    <div className="relative w-9 h-9 flex items-center justify-center">
      {/* SVG Orbital Ring */}
      <svg className="absolute inset-0 w-full h-full -rotate-90">
        <circle
          cx="18"
          cy="18"
          r="16"
          className="fill-none stroke-white/5"
          strokeWidth="2"
        />
        <motion.circle
          cx="18"
          cy="18"
          r="16"
          className={clsx(
            "fill-none transition-colors duration-500",
            status === "success" ? "stroke-emerald-500/40" : "stroke-brand-primary/40"
          )}
          strokeWidth="2"
          strokeDasharray="100"
          initial={{ strokeDashoffset: 100 }}
          animate={{ strokeDashoffset: 100 - percent }}
          strokeLinecap="round"
        />
      </svg>
      <Icon className={clsx(
        "w-3.5 h-3.5 transition-all group-hover/tel:scale-110",
        status === "success" ? "text-emerald-400" : "text-brand-primary"
      )} />
    </div>
    
    <div className="flex flex-col">
      <span className="text-[7px] font-black text-zinc-500 uppercase tracking-widest leading-none mb-1">
        {label}
      </span>
      <span className="text-[10px] font-mono font-bold text-white tracking-tight">
        {value}
      </span>
    </div>
  </div>
);

Header.displayName = "Header";