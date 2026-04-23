import React, { memo, useMemo, type FC } from "react";
import { Activity, ChevronRight, Zap, ShieldCheck, type LucideIcon, Home } from "lucide-react";
import { useAppStore } from "../../orchestrator/state/app.store";
import { NotificationCenter } from "../../capsules/notifications";
import { LogoRoot, LogoText } from "../../shared/components/Logo";
import { RealtimeStatusBadge } from "../../core/providers/RealtimeProvider";
import { motion } from "@/src/lib/motion";
import clsx from "@/src/lib/clsx";

interface HeaderProps {
  onMenuToggle?: () => void;
}

interface TelemetryItemProps {
  icon: LucideIcon;
  label: string;
  value: string;
  status: "success" | "info" | "warning";
  percent?: number;
}

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

export const Header: FC<HeaderProps> = memo(({ onMenuToggle }) => {
  const { activeTab } = useAppStore();

  const breadcrumb = useMemo(() => ["ZENTHAR", activeTab?.toUpperCase() ?? "SYSTEM"], [activeTab]);

  return (
    <header
      className="sticky top-0 h-[68px] w-full shrink-0 z-50 overflow-hidden
                       border-b border-(--color-zenthar-steel)
                       bg-(--color-zenthar-void)/90 backdrop-blur-2xl
                       flex items-center justify-between px-5 md:px-8"
    >
      {/* Accent line */}
      <div
        className="absolute inset-x-0 top-0 h-px bg-linear-to-r
                      from-transparent via-brand-primary/30 to-transparent"
      />

      {/* ── LEFT: Logo + breadcrumb ── */}
      <div className="flex items-center gap-5 md:gap-8 min-w-0 relative z-10">
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="hidden md:block cursor-pointer shrink-0"
        >
          <LogoRoot size="sm" variant="light">
            <LogoText className="tracking-[0.45em]" subtitle="" />
          </LogoRoot>
        </motion.div>

        {/* Breadcrumb — desktop */}
        <nav className="hidden md:flex items-center gap-1.5" aria-label="Breadcrumb">
          <div className="h-7 w-px bg-(--color-zenthar-steel) mx-1" />
          <Home className="w-3 h-3 text-(--color-zenthar-text-muted)" />
          {breadcrumb.map((seg, i) => (
            <React.Fragment key={`${seg}-${i}`}>
              <ChevronRight className="w-3 h-3 text-(--color-zenthar-steel)" strokeWidth={3} />
              <motion.span
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                className={clsx(
                  "text-[11px] font-black tracking-[0.18em] uppercase transition-all",
                  i === breadcrumb.length - 1
                    ? "text-(--color-zenthar-text-primary)"
                    : "text-(--color-zenthar-text-muted)",
                )}
              >
                {seg}
              </motion.span>
            </React.Fragment>
          ))}
        </nav>

        {/* Mobile: just the tab name */}
        <span
          className="md:hidden text-[12px] font-black tracking-[0.2em] uppercase
                         text-(--color-zenthar-text-primary)"
        >
          {activeTab?.toUpperCase()}
        </span>
      </div>

      {/* ── RIGHT: Status + notifications ── */}
      <div className="flex items-center gap-2 md:gap-3 relative z-10 shrink-0">
        {/* SSE connection badge */}
        <RealtimeStatusBadge className="hidden sm:flex" />

        {/* Telemetry pills — desktop */}
        <div
          className="hidden lg:flex items-center gap-2.5 px-4 py-2 rounded-2xl
                        bg-(--color-zenthar-carbon) border border-(--color-zenthar-steel)"
        >
          <TelemetryItem
            icon={Activity}
            label="Load"
            value="Optimal"
            status="success"
            percent={12}
          />
          <div className="w-px h-5 bg-(--color-zenthar-steel)" />
          <TelemetryItem icon={Zap} label="Latency" value="12ms" status="info" percent={85} />
          <div className="w-px h-5 bg-(--color-zenthar-steel)" />
          <TelemetryItem icon={ShieldCheck} label="Security" value="AES-256" status="success" />
        </div>

        {/* Notification bell */}
        <div className="relative group">
          <div
            className="absolute inset-0 bg-brand-primary/15 blur-xl opacity-0
                          group-hover:opacity-100 transition-opacity rounded-xl"
          />
          <div
            className="relative p-2.5 rounded-xl bg-(--color-zenthar-carbon)
                          border border-(--color-zenthar-steel)
                          hover:border-brand-primary/30 transition-all cursor-pointer"
          >
            <NotificationCenter />
          </div>
        </div>
      </div>
    </header>
  );
});

// ─────────────────────────────────────────────
// Telemetry mini-module
// ─────────────────────────────────────────────

const TelemetryItem: FC<TelemetryItemProps> = ({
  icon: Icon,
  label,
  value,
  status,
  percent = 100,
}) => {
  const color = status === "success" ? "stroke-emerald-500/50" : "stroke-brand-primary/50";
  const iconColor = status === "success" ? "text-emerald-400" : "text-brand-primary";

  return (
    <div className="flex items-center gap-2.5 group/tel cursor-default">
      <div className="relative w-6 h-6 flex items-center justify-center">
        <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 28 28">
          <circle
            cx="14"
            cy="14"
            r="11"
            fill="none"
            className="stroke-(--color-zenthar-steel)"
            strokeWidth="2"
          />
          <motion.circle
            cx="14"
            cy="14"
            r="11"
            fill="none"
            className={clsx("fill-none", color)}
            strokeWidth="2"
            strokeDasharray="69"
            strokeLinecap="round"
            initial={{ strokeDashoffset: 69 }}
            animate={{ strokeDashoffset: 69 - (percent / 100) * 69 }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </svg>
        <Icon className={clsx("w-3 h-3 relative z-10", iconColor)} />
      </div>
      <div className="flex flex-col">
        <span
          className="text-[7px] font-black text-(--color-zenthar-text-muted) uppercase
                         tracking-widest leading-none mb-0.5"
        >
          {label}
        </span>
        <span className="text-[10px] font-mono font-bold text-(--color-zenthar-text-primary)">
          {value}
        </span>
      </div>
    </div>
  );
};

Header.displayName = "Header";
