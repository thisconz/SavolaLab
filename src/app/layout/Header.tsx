import React, { memo, useMemo, type FC } from "react";
import { Activity, ChevronRight, Zap, ShieldCheck, type LucideIcon, Home } from "lucide-react";
import { useAppStore } from "../../orchestrator/state/app.store";
import { NotificationCenter } from "../../capsules/notifications";
import { LogoRoot, LogoText } from "../../shared/components/Logo";
import { RealtimeStatusBadge } from "../../core/providers/RealtimeProvider";
import { motion, AnimatePresence } from "../../lib/motion";
import clsx from "../../lib/clsx";

interface HeaderProps {
  onMenuToggle?: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Header Component
// ─────────────────────────────────────────────────────────────────────────────

export const Header: FC<HeaderProps> = memo(({ onMenuToggle }) => {
  const { activeTab } = useAppStore();

  const breadcrumb = useMemo(() => ["ZENTHAR", activeTab?.toUpperCase() ?? "SYSTEM"], [activeTab]);

  return (
    <header
      className="sticky top-0 h-[calc(64px+var(--safe-area-top))] w-full shrink-0 z-50
                 border-b border-(--color-zenthar-steel)/50
                 bg-(--color-zenthar-void)/80 backdrop-blur-md
                 flex items-center justify-between px-6 md:px-8"
    >
      {/* Laser-cut top accent */}
      <div className="absolute inset-x-0 top-0 h-[2px] bg-linear-to-r from-transparent via-brand-primary/40 to-transparent opacity-50" />

      {/* ── LEFT: Identity & Navigation ── */}
      <div className="flex items-center gap-6 min-w-0">
        <motion.div 
          initial={false}
          whileHover={{ filter: "brightness(1.2)" }}
          className="hidden md:block cursor-pointer"
        >
          <LogoRoot size="sm" variant="light">
            <LogoText className="tracking-[0.5em] font-black" subtitle="" />
          </LogoRoot>
        </motion.div>

        {/* Vertical Separator */}
        <div className="hidden md:block h-6 w-px bg-linear-to-b from-transparent via-(--color-zenthar-steel) to-transparent" />

        {/* Dynamic Breadcrumbs */}
        <nav className="flex items-center gap-2" aria-label="Breadcrumb">
          <Home className="w-3.5 h-3.5 text-(--color-zenthar-text-muted) hover:text-brand-primary transition-colors cursor-pointer" />
          
          <AnimatePresence mode="popLayout">
            {breadcrumb.map((seg, i) => (
              <motion.div 
                key={`${seg}-${i}`}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                className="flex items-center gap-2"
              >
                <ChevronRight className="w-3 h-3 text-(--color-zenthar-steel)" />
                <span className={clsx(
                  "text-[10px] font-mono font-bold tracking-[0.2em] transition-colors",
                  i === breadcrumb.length - 1 ? "text-brand-primary" : "text-(--color-zenthar-text-muted)"
                )}>
                  {seg}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
        </nav>
      </div>

      {/* ── RIGHT: System Telemetry & Actions ── */}
      <div className="flex items-center gap-4">
        {/* SSE / Realtime Status */}
        <RealtimeStatusBadge className="hidden sm:flex" />

        {/* Telemetry Dashboard Pill */}
        <div className="hidden lg:flex items-center gap-5 px-5 py-2 rounded-full 
                        bg-(--color-zenthar-carbon)/40 border border-(--color-zenthar-steel)/30
                        hover:border-brand-primary/20 transition-all group/telemetry">
          <TelemetryItem icon={Activity} label="Load" value="Optimal" status="success" percent={24} />
          <TelemetryItem icon={Zap} label="Ping" value="12ms" status="info" percent={88} />
          <TelemetryItem icon={ShieldCheck} label="Sec" value="Encrypted" status="success" />
        </div>

        {/* Notifications */}
        <motion.div 
          whileTap={{ scale: 0.95 }}
          className="relative p-2 rounded-xl bg-(--color-zenthar-carbon) border border-(--color-zenthar-steel)
                     hover:border-brand-primary/40 hover:shadow-[0_0_15px_rgba(var(--brand-primary-rgb),0.1)] 
                     transition-all cursor-pointer group"
        >
          <NotificationCenter />
          {/* Subtle notification "ping" animation */}
          <div className="absolute top-0 right-0 w-2 h-2 bg-brand-primary rounded-full animate-ping opacity-75" />
        </motion.div>
      </div>
    </header>
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// Telemetry Mini-Module
// ─────────────────────────────────────────────────────────────────────────────

interface TelemetryItemProps {
  icon: LucideIcon;
  label: string;
  value: string;
  status: "success" | "info" | "warning";
  percent?: number;
}

const TelemetryItem: FC<TelemetryItemProps> = ({ icon: Icon, label, value, status, percent = 100 }) => {
  const isSuccess = status === "success";
  
  return (
    <div className="flex items-center gap-3">
      {/* Radial Progress Ring */}
      <div className="relative w-7 h-7">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 32 32">
          <circle cx="16" cy="16" r="13" fill="none" className="stroke-(--color-zenthar-steel)/20" strokeWidth="2.5" />
          <motion.circle
            cx="16" cy="16" r="13" fill="none"
            className={clsx("stroke-current", isSuccess ? "text-emerald-500" : "text-brand-primary")}
            strokeWidth="2.5"
            strokeDasharray="81.6"
            initial={{ strokeDashoffset: 81.6 }}
            animate={{ strokeDashoffset: 81.6 - (percent / 100) * 81.6 }}
            transition={{ duration: 1.5, ease: "circOut" }}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <Icon className={clsx("w-3 h-3", isSuccess ? "text-emerald-400" : "text-brand-primary")} />
        </div>
      </div>

      {/* Text Data */}
      <div className="flex flex-col justify-center">
        <span className="text-[8px] font-black text-(--color-zenthar-text-muted) uppercase tracking-tighter leading-none opacity-70">
          {label}
        </span>
        <span className="text-[10px] font-mono font-bold text-(--color-zenthar-text-primary) tabular-nums">
          {value}
        </span>
      </div>
    </div>
  );
};

Header.displayName = "Header";