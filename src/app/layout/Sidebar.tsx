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
  Archive,
  LogOut,
  RefreshCw,
  Fingerprint,
  Activity,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { LogoRoot, LogoIcon } from "../../shared/components/Logo";
import type { AppTab } from "../../orchestrator/state/app.store";
import { useAuthStore } from "../../orchestrator/state/auth.store";
import { QuickSwitch } from "../../capsules/auth";
import { isTabAllowed } from "../../core/rbac";
import clsx from "clsx";

// ─── Nav Item ────────────────────────────────────────────────────────────────

interface NavItemProps {
  icon: React.ElementType;
  label: string;
  active: boolean;
  onClick: () => void;
  variant?: "default" | "mini";
}

const NavItem: React.FC<NavItemProps> = ({ icon: Icon, label, active, onClick, variant = "default" }) => (
  <button
    onClick={onClick}
    className={clsx(
      "group relative flex w-full items-center gap-3.5 overflow-hidden rounded-xl transition-all duration-300",
      variant === "mini" ? "px-3 py-2.5" : "px-4 py-3",
    )}
    style={{
      background: active
        ? "linear-gradient(135deg, rgba(244,63,94,0.12) 0%, rgba(244,63,94,0.05) 100%)"
        : "transparent",
      border: active ? "1px solid rgba(244,63,94,0.2)" : "1px solid transparent",
      boxShadow: active ? "0 0 20px rgba(244,63,94,0.08), inset 0 1px 0 rgba(255,255,255,0.04)" : "none",
    }}
  >
    {/* Left indicator bar */}
    <AnimatePresence>
      {active && (
        <motion.div
          layoutId="nav-indicator"
          className="absolute top-2 bottom-2 left-0 w-0.5 rounded-r-full"
          style={{ background: "#f43f5e", boxShadow: "0 0 8px rgba(244,63,94,0.8)" }}
          initial={{ opacity: 0, scaleY: 0 }}
          animate={{ opacity: 1, scaleY: 1 }}
          exit={{ opacity: 0, scaleY: 0 }}
        />
      )}
    </AnimatePresence>

    {/* Hover shimmer */}
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-xl opacity-0 transition-opacity group-hover:opacity-100">
      <motion.div
        animate={{ x: ["-100%", "200%"] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
        className="absolute inset-y-0 w-1/3"
        style={{ background: "linear-gradient(90deg, transparent, rgba(244,63,94,0.06), transparent)" }}
      />
    </div>

    {/* Icon */}
    <div
      className={clsx(
        "relative z-10 transition-all duration-300",
        active ? "scale-110" : "group-hover:scale-105",
      )}
    >
      <Icon
        size={variant === "mini" ? 14 : 16}
        strokeWidth={active ? 2.5 : 2}
        style={{ color: active ? "#f43f5e" : "rgba(136,146,176,0.7)" }}
        className="group-hover:!text-zenthar-text-primary transition-colors duration-300"
      />
      {active && (
        <div className="absolute inset-0 -z-10 blur-md" style={{ background: "rgba(244,63,94,0.4)" }} />
      )}
    </div>

    {/* Label */}
    <span
      className={clsx(
        "z-10 flex-1 truncate text-left font-black uppercase transition-all duration-200",
        variant === "mini" ? "text-[8px] tracking-[0.2em]" : "text-[10px] tracking-[0.18em]",
        active
          ? "text-zenthar-text-primary translate-x-0.5"
          : "text-zenthar-text-muted group-hover:text-zenthar-text-secondary",
      )}
    >
      {label}
    </span>

    {active && variant === "default" && (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="z-10 shrink-0">
        <div
          className="h-1.5 w-1.5 rounded-full"
          style={{ background: "#f43f5e", boxShadow: "0 0 6px rgba(244,63,94,0.8)" }}
        />
      </motion.div>
    )}
  </button>
);

// ─── Nav Config ───────────────────────────────────────────────────────────────

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

// ─── Sidebar ─────────────────────────────────────────────────────────────────

export const Sidebar: React.FC<{ activeTab: AppTab; onTabChange: (tab: AppTab) => void }> = memo(
  ({ activeTab, onTabChange }) => {
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
        className="relative flex h-full w-[272px] flex-col overflow-hidden"
        style={{
          background: "linear-gradient(180deg, rgba(5,5,15,0.99) 0%, rgba(8,8,26,0.98) 100%)",
          borderRight: "1px solid rgba(100,120,200,0.12)",
        }}
      >
        {/* Background effects */}
        <div className="instrument-grid pointer-events-none absolute inset-0 opacity-60" />
        <div
          className="pointer-events-none absolute -top-32 -left-32 h-64 w-64 rounded-full blur-[80px]"
          style={{ background: "rgba(244,63,94,0.04)" }}
        />
        <div
          className="pointer-events-none absolute -right-20 -bottom-20 h-48 w-48 rounded-full blur-[60px]"
          style={{ background: "rgba(139,92,246,0.04)" }}
        />

        {/* Right border glow */}
        <div
          className="pointer-events-none absolute top-0 right-0 bottom-0 w-px"
          style={{
            background:
              "linear-gradient(180deg, transparent 0%, rgba(244,63,94,0.3) 30%, rgba(139,92,246,0.3) 70%, transparent 100%)",
          }}
        />

        {/* Brand mark */}
        <div className="relative z-10 px-7 pt-7 pb-5">
          <LogoRoot size="md" variant="dark">
            <LogoIcon animated />
          </LogoRoot>
          <div className="mt-3 flex items-center gap-2 overflow-hidden">
            <div
              className="h-px flex-1"
              style={{ background: "linear-gradient(90deg, rgba(244,63,94,0.4), transparent)" }}
            />
            <span className="text-zenthar-text-muted shrink-0 font-mono text-[7px] tracking-[0.5em] uppercase">
              {import.meta.env.VITE_ZENTHAR_VERSION}
            </span>
          </div>

          {/* Live status */}
          <div className="mt-2 flex items-center gap-2">
            <Activity size={9} className="animate-pulse text-emerald-400" />
            <span className="font-mono text-[8px] font-bold tracking-widest text-emerald-400/70 uppercase">
              System Online
            </span>
          </div>
        </div>

        {/* Navigation */}
        <div className="no-scrollbar relative z-10 flex-1 space-y-5 overflow-y-auto px-3 pb-4">
          {filteredNav.map((section, idx) => (
            <div key={section.section}>
              <header className="mb-2 flex items-center justify-between px-4">
                <span
                  className="text-zenthar-text-muted text-[8px] font-black tracking-[0.4em] uppercase"
                  style={{ opacity: 0.5 }}
                >
                  {section.section}
                </span>
                <span className="font-mono text-[7px]" style={{ color: "rgba(244,63,94,0.5)" }}>
                  [{section.code}-{String(idx + 1).padStart(2, "0")}]
                </span>
              </header>
              <div className="flex flex-col gap-0.5">
                {section.items.map(({ icon, tab, label }) => (
                  <NavItem
                    key={tab}
                    icon={icon}
                    active={activeTab === tab}
                    onClick={() => onTabChange(tab as AppTab)}
                    label={label}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer utilities */}
        <div
          className="relative z-10 space-y-3 border-t p-4"
          style={{ borderColor: "rgba(100,120,200,0.1)" }}
        >
          {/* Quick links */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { icon: Settings, tab: "settings", label: "Config" },
              { icon: Archive, tab: "archive", label: "Vault" },
            ].map(({ icon: Icon, tab, label }) => (
              <button
                key={tab}
                onClick={() => onTabChange(tab as AppTab)}
                className="group flex flex-col items-center justify-center rounded-xl p-3 transition-all"
                style={{
                  background: "rgba(8,8,26,0.8)",
                  border: "1px solid rgba(100,120,200,0.1)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(244,63,94,0.25)";
                  (e.currentTarget as HTMLButtonElement).style.background = "rgba(244,63,94,0.06)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(100,120,200,0.1)";
                  (e.currentTarget as HTMLButtonElement).style.background = "rgba(8,8,26,0.8)";
                }}
              >
                <Icon
                  size={13}
                  className="text-zenthar-text-muted group-hover:text-brand-primary mb-1 transition-colors"
                />
                <span className="text-zenthar-text-muted group-hover:text-zenthar-text-primary text-[7px] font-black tracking-widest uppercase transition-colors">
                  {label}
                </span>
              </button>
            ))}
          </div>

          {/* User identity pod */}
          <div
            className="relative overflow-hidden rounded-xl p-4"
            style={{
              background: "linear-gradient(135deg, rgba(244,63,94,0.08) 0%, rgba(8,8,26,0.9) 100%)",
              border: "1px solid rgba(244,63,94,0.15)",
            }}
          >
            {/* Scan line */}
            <div className="absolute top-0 left-0 h-px w-full overflow-hidden">
              <motion.div
                animate={{ x: ["-100%", "100%"] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="h-full w-1/3"
                style={{
                  background: "linear-gradient(90deg, transparent, rgba(244,63,94,0.6), transparent)",
                }}
              />
            </div>

            <div className="flex items-center gap-3">
              {/* Avatar */}
              <button
                onClick={() => setSwitch(true)}
                className="group/av relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl transition-all"
                style={{
                  background: "rgba(244,63,94,0.1)",
                  border: "1px solid rgba(244,63,94,0.25)",
                }}
              >
                <Fingerprint
                  size={17}
                  className="text-brand-primary transition-opacity group-hover/av:opacity-0"
                />
                <div
                  className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover/av:opacity-100"
                  style={{ background: "#f43f5e" }}
                >
                  <RefreshCw
                    size={13}
                    className="animate-spin text-white"
                    style={{ animationDuration: "2s" }}
                  />
                </div>
              </button>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <p className="text-zenthar-text-primary mb-1 truncate text-[10px] leading-none font-black tracking-wide uppercase">
                  {currentUser?.name ?? "GUEST_USER"}
                </p>
                <div className="flex items-center gap-1.5">
                  <div className="h-1 w-1 animate-pulse rounded-full bg-emerald-500" />
                  <p className="font-mono text-[7px] tracking-widest text-emerald-400 uppercase">
                    Secure_Session
                  </p>
                </div>
              </div>

              {/* Logout */}
              <button
                onClick={logout}
                aria-label="Log out"
                className="text-zenthar-text-muted rounded-lg p-2 transition-all hover:text-red-400"
                style={{ background: "transparent" }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = "rgba(239,68,68,0.1)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                }}
              >
                <LogOut size={13} />
              </button>
            </div>
          </div>
        </div>

        <QuickSwitch isOpen={isSwitchOpen} onClose={() => setSwitch(false)} />
      </nav>
    );
  },
);

Sidebar.displayName = "Sidebar";
