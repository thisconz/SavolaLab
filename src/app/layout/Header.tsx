import React, { memo, useMemo, type FC } from "react";
import { Activity, ChevronRight, Zap, ShieldCheck, LucideIcon, Home } from "lucide-react";
import { useAppStore }            from "../../orchestrator/state/app.store";
import { NotificationCenter }     from "../../capsules/notifications";
import { LogoRoot, LogoText }     from "../../shared/components/Logo";
import { RealtimeStatusBadge }    from "../../core/providers/RealtimeProvider";
import { motion }                 from "@/src/lib/motion";
import clsx                       from "@/src/lib/clsx";

interface HeaderProps {
  onMenuToggle?: () => void;
}

interface TelemetryProps {
  icon:    LucideIcon;
  label:   string;
  value:   string;
  status:  "success" | "info" | "warning";
  percent?: number;
}

export const Header: FC<HeaderProps> = memo(({ onMenuToggle }) => {
  const { activeTab } = useAppStore();

  const path = useMemo(() => {
    const node = activeTab?.toUpperCase() || "SYSTEM_ROOT";
    return ["ZENTHAR", node];
  }, [activeTab]);

  return (
    <header className="sticky top-0 h-20 w-full border-b border-(--color-zenthar-steel) flex items-center justify-between px-6 md:px-10 bg-(--color-zenthar-void)/90 backdrop-blur-2xl z-50 shrink-0 overflow-hidden">
      {/* Atmosphere */}
      <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-brand-primary/20 to-transparent animate-pulse" />

      {/* LEFT: Branding + breadcrumb */}
      <div className="flex items-center gap-6 md:gap-10 relative z-10 min-w-0">
        {/* Logo — hidden on mobile (shown in AppShell's mobile bar) */}
        <motion.div whileHover={{ scale: 1.02 }} className="cursor-pointer hidden md:block">
          <LogoRoot size="sm" variant="light">
            <LogoText className="tracking-[0.5em]" />
          </LogoRoot>
        </motion.div>

        <div className="hidden md:flex items-center gap-2">
          <div className="h-8 w-px bg-(--color-zenthar-steel)" />
          <nav className="flex items-center gap-2">
            <Home className="w-3 h-3 text-(--color-zenthar-text-muted)" />
            {path.map((segment, i) => (
              <React.Fragment key={`${segment}-${i}`}>
                <ChevronRight className="w-3 h-3 text-(--color-zenthar-steel)" strokeWidth={4} />
                <motion.span
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={clsx(
                    "text-[12px] font-black tracking-[0.2em] uppercase transition-all duration-500",
                    i === path.length - 1
                      ? "text-(--color-zenthar-text-primary)"
                      : "text-(--color-zenthar-text-muted)",
                  )}
                >
                  {segment}
                </motion.span>
              </React.Fragment>
            ))}
          </nav>
        </div>

        {/* Mobile: just the active tab */}
        <span className="md:hidden text-[12px] font-black tracking-[0.2em] uppercase text-(--color-zenthar-text-primary)">
          {activeTab?.toUpperCase()}
        </span>
      </div>

      {/* RIGHT: System status + notifications */}
      <div className="flex items-center gap-3 md:gap-4 relative z-10">
        {/* Realtime connection badge */}
        <RealtimeStatusBadge className="hidden sm:flex" />

        {/* Telemetry pills — desktop only */}
        <div className="hidden lg:flex items-center gap-3 px-5 py-2 rounded-2xl bg-(--color-zenthar-carbon) border border-(--color-zenthar-steel)">
          <TelemetryModule icon={Activity}    label="Load"     value="Optimal"   status="success" percent={12} />
          <div className="w-px h-6 bg-(--color-zenthar-steel)" />
          <TelemetryModule icon={Zap}         label="Latency"  value="12ms"      status="info"    percent={85} />
          <div className="w-px h-6 bg-(--color-zenthar-steel)" />
          <TelemetryModule icon={ShieldCheck} label="Security" value="Encrypted" status="success" />
        </div>

        {/* Notification bell */}
        <div className="relative group">
          <div className="absolute inset-0 bg-brand-primary/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity rounded-xl" />
          <div className="relative p-2.5 md:p-3 rounded-xl bg-(--color-zenthar-carbon) border border-(--color-zenthar-steel) hover:border-brand-primary/40 transition-all cursor-pointer">
            <NotificationCenter />
          </div>
        </div>
      </div>
    </header>
  );
});

const TelemetryModule: FC<TelemetryProps> = ({ icon: Icon, label, value, status, percent = 100 }) => (
  <div className="flex items-center gap-3 py-1 group/tel cursor-help">
    <div className="relative w-7 h-7 flex items-center justify-center">
      <svg className="absolute inset-0 w-full h-full -rotate-90">
        <circle cx="14" cy="14" r="12" className="fill-none stroke-(--color-zenthar-steel)" strokeWidth="2" />
        <motion.circle cx="14" cy="14" r="12"
          className={clsx("fill-none", status === "success" ? "stroke-emerald-500/40" : "stroke-brand-primary/40")}
          strokeWidth="2" strokeDasharray="75" strokeLinecap="round"
          initial={{ strokeDashoffset: 75 }}
          animate={{ strokeDashoffset: 75 - ((percent / 100) * 75) }}
        />
      </svg>
      <Icon className={clsx("w-3 h-3", status === "success" ? "text-emerald-400" : "text-brand-primary")} />
    </div>
    <div className="flex flex-col">
      <span className="text-[7px] font-black text-(--color-zenthar-text-muted) uppercase tracking-widest leading-none mb-0.5">{label}</span>
      <span className="text-[10px] font-mono font-bold text-(--color-zenthar-text-primary)">{value}</span>
    </div>
  </div>
);

Header.displayName = "Header";