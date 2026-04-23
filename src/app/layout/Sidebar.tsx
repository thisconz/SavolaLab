import React, { memo, useMemo, useState } from "react";
import {
  LayoutDashboard,
  Microscope,
  Zap,
  Truck,
  BarChart3,
  ListChecks,
  Factory,
  Database,
  ShieldAlert,
  Settings,
  ChevronRight,
  Archive,
  LogOut,
  RefreshCw,
  Fingerprint,
} from "lucide-react";
import { motion, AnimatePresence } from "@/src/lib/motion";
import { LogoRoot, LogoIcon } from "../../shared/components/Logo";
import { useAppStore, AppTab, useAppActions } from "../../orchestrator/state/app.store";
import { useAuthStore } from "../../orchestrator/state/auth.store";
import { QuickSwitch } from "../../capsules/auth";
import { isTabAllowed } from "../../core/rbac";
import clsx from "@/src/lib/clsx";

// ─────────────────────────────────────────────
// Nav item
// ─────────────────────────────────────────────

interface NavItemProps {
  icon: React.ElementType;
  label: string;
  active: boolean;
  onClick: () => void;
  variant?: "default" | "mini";
}

const NavItem: React.FC<NavItemProps> = ({
  icon: Icon,
  label,
  active,
  onClick,
  variant = "default",
}) => (
  <button
    onClick={onClick}
    className={clsx(
      "w-full flex items-center gap-3.5 rounded-xl transition-all duration-300 group relative overflow-hidden",
      variant === "mini" ? "px-4 py-2.5" : "px-4 py-3",
      active
        ? "text-(--color-zenthar-text-primary)"
        : "text-(--color-zenthar-text-muted) hover:text-(--color-zenthar-text-secondary)",
    )}
  >
    {/* Active background */}
    <AnimatePresence>
      {active && (
        <motion.div
          layoutId="nav-active-bg"
          className="absolute inset-0 bg-linear-to-r from-brand-primary/12 via-brand-primary/6 to-transparent"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />
      )}
    </AnimatePresence>

    {/* Left indicator */}
    <AnimatePresence>
      {active && (
        <motion.div
          layoutId="nav-indicator"
          className="absolute left-0 top-2 bottom-2 w-0.5 bg-brand-primary rounded-r-full
                     shadow-[0_0_10px_rgba(218,98,125,0.6)]"
        />
      )}
    </AnimatePresence>

    {/* Icon */}
    <div
      className={clsx(
        "relative z-10 transition-all duration-300",
        active
          ? "scale-110 text-brand-primary"
          : "group-hover:scale-105 group-hover:text-(--color-zenthar-text-primary)",
      )}
    >
      <Icon size={variant === "mini" ? 14 : 17} strokeWidth={active ? 2.5 : 2} />
    </div>

    {/* Label */}
    <span
      className={clsx(
        "font-black uppercase tracking-[0.18em] flex-1 text-left z-10 transition-all duration-200 truncate",
        variant === "mini" ? "text-[8px]" : "text-[10px]",
        active ? "translate-x-0.5 opacity-100" : "opacity-60 group-hover:opacity-90",
      )}
    >
      {label}
    </span>

    {active && variant === "default" && (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="z-10 shrink-0">
        <div className="w-1 h-1 rounded-full bg-brand-primary animate-pulse" />
      </motion.div>
    )}
  </button>
);

// ─────────────────────────────────────────────
// Nav config
// ─────────────────────────────────────────────

const NAV_CONFIG = [
  {
    section: "Overview",
    code: "HUD",
    items: [{ icon: LayoutDashboard, tab: "dashboard", label: "Dashboard" }],
  },
  {
    section: "Operations",
    code: "OPS",
    items: [
      { icon: Microscope, tab: "lab", label: "Lab Bench" },
      { icon: Zap, tab: "stat", label: "STAT Requests" },
      { icon: Truck, tab: "dispatch", label: "Dispatch" },
      { icon: ListChecks, tab: "workflows", label: "Workflows" },
    ],
  },
  {
    section: "Intelligence",
    code: "IQ",
    items: [
      { icon: BarChart3, tab: "analytics", label: "Analytics" },
      { icon: Factory, tab: "intelligence", label: "Plant Intel" },
    ],
  },
  {
    section: "Security",
    code: "SEC",
    items: [
      { icon: Database, tab: "assets", label: "Assets" },
      { icon: ShieldAlert, tab: "audit", label: "Audit Log" },
    ],
  },
] as const;

// ─────────────────────────────────────────────
// Sidebar
// ─────────────────────────────────────────────

export const Sidebar: React.FC<{ activeTab: AppTab }> = memo(({ activeTab }) => {
  const { setActiveTab } = useAppActions();
  const { currentUser, logout } = useAuthStore();
  const [isSwitchOpen, setSwitch] = useState(false);

  const filteredNav = useMemo(
    () =>
      NAV_CONFIG.map((section) => ({
        ...section,
        items: section.items.filter(({ tab }) =>
          currentUser ? isTabAllowed(currentUser.role, tab as AppTab) : tab === "dashboard",
        ),
      })).filter((s) => s.items.length > 0),
    [currentUser],
  );

  return (
    <nav
      className="w-[272px] h-full flex flex-col bg-(--color-zenthar-carbon)
                    border-r border-(--color-zenthar-steel) z-50 relative overflow-hidden"
    >
      {/* Subtle background texture */}
      <div className="absolute inset-0 instrument-grid opacity-100 pointer-events-none" />
      {/* Top glow */}
      <div
        className="absolute -top-20 -left-20 w-64 h-64 bg-brand-primary/5
                      blur-[80px] rounded-full pointer-events-none"
      />

      {/* ── Brand mark ── */}
      <div className="relative z-10 px-8 pt-8 pb-6">
        <LogoRoot size="md" variant="dark">
          <LogoIcon animated />
        </LogoRoot>
        <div className="mt-3 flex items-center gap-2 overflow-hidden">
          <div className="h-px flex-1 bg-linear-to-r from-brand-primary/30 to-transparent" />
          <span className="text-[7px] font-mono text-(--color-zenthar-text-muted) tracking-[0.5em] uppercase shrink-0">
            {import.meta.env.VITE_ZENTHAR_VERSION ?? "v2"}_sys
          </span>
        </div>
      </div>

      {/* ── Navigation ── */}
      <div className="flex-1 px-3 overflow-y-auto no-scrollbar space-y-6 pb-4 relative z-10">
        {filteredNav.map((section, idx) => (
          <div key={section.section}>
            <header className="px-4 mb-1.5 flex items-center justify-between opacity-50">
              <span
                className="text-[8px] font-black text-(--color-zenthar-text-muted)
                               uppercase tracking-[0.4em]"
              >
                {section.section}
              </span>
              <span className="text-[7px] font-mono text-brand-primary/60">
                [{section.code}-0{idx + 1}]
              </span>
            </header>
            <div className="flex flex-col gap-0.5">
              {section.items.map(({ icon, tab, label }) => (
                <NavItem
                  key={tab}
                  icon={icon}
                  active={activeTab === tab}
                  onClick={() => setActiveTab(tab as AppTab)}
                  label={label}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* ── Footer utility pod ── */}
      <div className="relative z-10 p-4 space-y-3 border-t border-(--color-zenthar-steel)">
        {/* Quick links */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setActiveTab("settings")}
            className="flex flex-col items-center justify-center p-3 rounded-2xl
                       bg-(--color-zenthar-graphite) border border-(--color-zenthar-steel)
                       hover:bg-brand-primary/10 hover:border-brand-primary/20
                       transition-all group"
          >
            <Settings
              size={13}
              className="text-(--color-zenthar-text-muted) group-hover:text-brand-primary
                                           transition-colors mb-1"
            />
            <span
              className="text-[7px] font-black text-(--color-zenthar-text-muted) group-hover:text-(--color-zenthar-text-primary)
                             uppercase tracking-widest transition-colors"
            >
              Config
            </span>
          </button>
          <button
            onClick={() => setActiveTab("archive")}
            className="flex flex-col items-center justify-center p-3 rounded-2xl
                       bg-(--color-zenthar-graphite) border border-(--color-zenthar-steel)
                       hover:bg-brand-primary/10 hover:border-brand-primary/20
                       transition-all group"
          >
            <Archive
              size={13}
              className="text-(--color-zenthar-text-muted) group-hover:text-brand-primary
                                          transition-colors mb-1"
            />
            <span
              className="text-[7px] font-black text-(--color-zenthar-text-muted) group-hover:text-(--color-zenthar-text-primary)
                             uppercase tracking-widest transition-colors"
            >
              Vault
            </span>
          </button>
        </div>

        {/* User identity module */}
        <div
          className="relative p-4 rounded-2xl bg-(--color-zenthar-graphite)/70
                        border border-(--color-zenthar-steel) overflow-hidden group/user"
        >
          {/* Animated scan line */}
          <div className="absolute top-0 left-0 h-px w-full bg-(--color-zenthar-steel)">
            <motion.div
              animate={{ x: ["-100%", "100%"] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              className="h-full w-1/3 bg-brand-primary/40 blur-[1px]"
            />
          </div>

          <div className="flex items-center gap-3">
            {/* Avatar */}
            <button
              onClick={() => setSwitch(true)}
              className="relative w-10 h-10 rounded-xl bg-brand-primary/10 border border-brand-primary/20
                         flex items-center justify-center shrink-0 overflow-hidden group/av"
            >
              <Fingerprint
                size={17}
                className="text-brand-primary group-hover/av:opacity-0 transition-opacity"
              />
              <div
                className="absolute inset-0 flex items-center justify-center bg-brand-primary
                              opacity-0 group-hover/av:opacity-100 transition-opacity"
              >
                <RefreshCw
                  size={13}
                  className="text-white animate-spin"
                  style={{ animationDuration: "2s" }}
                />
              </div>
            </button>

            {/* User info */}
            <div className="flex-1 min-w-0">
              <p
                className="text-[10px] font-black text-(--color-zenthar-text-primary) truncate
                            uppercase tracking-wide leading-none mb-1"
              >
                {currentUser?.name ?? "GUEST_USER"}
              </p>
              <div className="flex items-center gap-1.5 opacity-70">
                <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                <p className="text-[7px] font-mono text-emerald-400 uppercase tracking-widest">
                  Secure_Session
                </p>
              </div>
            </div>

            {/* Logout */}
            <button
              onClick={logout}
              aria-label="Log out"
              className="p-2 text-(--color-zenthar-text-muted) hover:text-red-400
                         hover:bg-red-400/10 rounded-lg transition-all shrink-0"
            >
              <LogOut size={13} />
            </button>
          </div>
        </div>
      </div>

      <QuickSwitch isOpen={isSwitchOpen} onClose={() => setSwitch(false)} />
    </nav>
  );
});

Sidebar.displayName = "Sidebar";
