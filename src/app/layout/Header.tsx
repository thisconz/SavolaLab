import React, { memo, useMemo, type FC } from "react";
import { Activity, ChevronRight, Zap, ShieldCheck, type LucideIcon, Home, Cpu } from "lucide-react";
import { useAppStore } from "../../orchestrator/state/app.store";
import { NotificationCenter } from "../../capsules/notifications";
import { LogoRoot, LogoText } from "../../shared/components/Logo";
import { RealtimeStatusBadge } from "../../core/providers/RealtimeProvider";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";

interface HeaderProps {
  onMenuToggle?: () => void;
}

export const Header: FC<HeaderProps> = memo(({ onMenuToggle }) => {
  const { activeTab } = useAppStore();
  const breadcrumb = useMemo(() => ["ZENTHAR", activeTab?.toUpperCase() ?? "SYSTEM"], [activeTab]);

  return (
    <header
      className="relative sticky top-0 z-50 flex h-[calc(60px+var(--safe-area-top))] w-full shrink-0 items-center justify-between px-6 md:px-8"
      style={{
        background: "linear-gradient(180deg, rgba(5,5,15,0.98) 0%, rgba(5,5,15,0.90) 100%)",
        borderBottom: "1px solid rgba(100,120,200,0.1)",
        backdropFilter: "blur(24px) saturate(180%)",
      }}
    >
      {/* Top accent line */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, rgba(244,63,94,0.6) 30%, rgba(139,92,246,0.6) 70%, transparent 100%)",
        }}
      />

      {/* Grid overlay */}
      <div className="instrument-grid pointer-events-none absolute inset-0 opacity-30" />

      {/* ── LEFT ── */}
      <div className="relative z-10 flex min-w-0 items-center gap-5">
        <motion.div
          initial={false}
          whileHover={{ filter: "brightness(1.3)" }}
          className="hidden cursor-pointer md:block"
        >
          <LogoRoot size="sm" variant="light">
            <LogoText className="font-black tracking-[0.5em]" subtitle="" />
          </LogoRoot>
        </motion.div>

        <div
          className="hidden h-6 w-px md:block"
          style={{ background: "linear-gradient(180deg, transparent, rgba(100,120,200,0.3), transparent)" }}
        />

        {/* Breadcrumbs */}
        <nav className="flex items-center gap-1.5" aria-label="Breadcrumb">
          <Home className="text-zenthar-text-muted hover:text-brand-primary h-3 w-3 cursor-pointer transition-colors" />

          <AnimatePresence mode="popLayout">
            {breadcrumb.map((seg, i) => (
              <motion.div
                key={`${seg}-${i}`}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                className="flex items-center gap-1.5"
              >
                <ChevronRight className="text-zenthar-steel-bright h-3 w-3" />
                <span
                  className={clsx(
                    "font-mono text-[10px] font-bold tracking-[0.2em] transition-colors",
                    i === breadcrumb.length - 1 ? "text-brand-primary" : "text-zenthar-text-muted",
                  )}
                  style={i === breadcrumb.length - 1 ? { textShadow: "0 0 10px rgba(244,63,94,0.5)" } : {}}
                >
                  {seg}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
        </nav>
      </div>

      {/* ── RIGHT ── */}
      <div className="relative z-10 flex items-center gap-3">
        <RealtimeStatusBadge className="hidden sm:flex" />

        {/* Telemetry pill */}
        <div
          className="hidden items-center gap-4 rounded-xl px-4 py-2 lg:flex"
          style={{
            background: "rgba(8,8,26,0.8)",
            border: "1px solid rgba(100,120,200,0.12)",
          }}
        >
          <TelemetryItem icon={Activity} label="Load" value="Optimal" status="success" percent={24} />
          <div className="h-5 w-px" style={{ background: "rgba(100,120,200,0.15)" }} />
          <TelemetryItem icon={Zap} label="Ping" value="12ms" status="info" percent={88} />
          <div className="h-5 w-px" style={{ background: "rgba(100,120,200,0.15)" }} />
          <TelemetryItem icon={ShieldCheck} label="Sec" value="AES-256" status="success" percent={100} />
        </div>

        {/* Notification bell */}
        <motion.div
          whileTap={{ scale: 0.95 }}
          className="group relative cursor-pointer rounded-xl p-2 transition-all"
          style={{
            background: "rgba(8,8,26,0.8)",
            border: "1px solid rgba(100,120,200,0.12)",
          }}
        >
          <NotificationCenter />
        </motion.div>
      </div>
    </header>
  );
});

// ── Telemetry Item ────────────────────────────────────────────────────────────

interface TelemetryItemProps {
  icon: LucideIcon;
  label: string;
  value: string;
  status: "success" | "info" | "warning";
  percent?: number;
}

const TelemetryItem: FC<TelemetryItemProps> = ({ icon: Icon, label, value, status, percent = 100 }) => {
  const colors = {
    success: "#10b981",
    info: "#f43f5e",
    warning: "#f59e0b",
  };
  const color = colors[status];

  return (
    <div className="flex items-center gap-2.5">
      {/* Mini ring */}
      <div className="relative h-6 w-6">
        <svg className="h-full w-full -rotate-90" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" fill="none" stroke="rgba(100,120,200,0.15)" strokeWidth="2" />
          <motion.circle
            cx="12"
            cy="12"
            r="10"
            fill="none"
            strokeWidth="2"
            strokeDasharray="62.8"
            strokeLinecap="round"
            stroke={color}
            initial={{ strokeDashoffset: 62.8 }}
            animate={{ strokeDashoffset: 62.8 - (percent / 100) * 62.8 }}
            transition={{ duration: 1.5, ease: "circOut" }}
            style={{ filter: `drop-shadow(0 0 3px ${color})` }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <Icon className="h-2.5 w-2.5" style={{ color }} />
        </div>
      </div>

      <div className="flex flex-col">
        <span className="text-zenthar-text-muted text-[7px] leading-none font-black tracking-tighter uppercase opacity-60">
          {label}
        </span>
        <span className="text-zenthar-text-primary font-mono text-[9px] font-bold tabular-nums">{value}</span>
      </div>
    </div>
  );
};

Header.displayName = "Header";
