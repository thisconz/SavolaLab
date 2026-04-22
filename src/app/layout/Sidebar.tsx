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
  Cpu,
  Fingerprint,
} from "lucide-react";
import { motion, AnimatePresence } from "@/src/lib/motion";
import { LogoRoot, LogoIcon } from "../../shared/components/Logo";
import {
  useAppStore,
  AppTab,
  useAppActions,
} from "../../orchestrator/state/app.store";
import { useAuthStore } from "../../orchestrator/state/auth.store";
import { QuickSwitch } from "../../capsules/auth";
import { isTabAllowed } from "../../core/rbac";
import clsx from "@/src/lib/clsx";

/* --- Refined NavItem --- */

const NavItem = ({
  icon: Icon,
  label,
  active,
  onClick,
  variant = "default",
}: any) => (
  <button
    onClick={onClick}
    className={clsx(
      "w-full flex items-center gap-4 px-5 rounded-xl transition-all duration-500 group relative overflow-hidden",
      variant === "mini" ? "py-2.5" : "py-3.5",
      active
        ? "text-(--color-zenthar-text-primary)"
        : "text-(--color-zenthar-text-muted) group-hover:text-(--color-zenthar-text-secondary)",
    )}
  >
    {/* Background Glow Depth */}
    <AnimatePresence>
      {active && (
        <motion.div
          layoutId="nav-glow"
          className="absolute inset-0 bg-linear-to-r from-brand-primary/10 via-brand-primary/5 to-transparent z-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />
      )}
    </AnimatePresence>

    {/* Active Laser Line */}
    <AnimatePresence>
      {active && (
        <motion.div
          layoutId="laser-indicator"
          className="absolute left-0 top-2 bottom-2 w-1 bg-brand-primary rounded-r-full shadow-[0_0_12px_rgba(var(--brand-primary-rgb),0.6)] z-20"
        />
      )}
    </AnimatePresence>

    <div
      className={clsx(
        "relative z-10 transition-transform duration-500",
        active
          ? "scale-110 text-brand-primary"
          : "group-hover:scale-110 group-hover:text-(--color-zenthar-text-primary)",
      )}
    >
      <Icon
        size={variant === "mini" ? 14 : 18}
        strokeWidth={active ? 2.5 : 2}
      />
    </div>

    <span
      className={clsx(
        "font-black uppercase tracking-[0.2em] flex-1 text-left z-10 transition-all duration-300 truncate",
        variant === "mini" ? "text-[8px]" : "text-[10px]",
        active
          ? "translate-x-1 opacity-100"
          : "opacity-70 group-hover:opacity-100",
      )}
    >
      {label}
    </span>

    {active && variant === "default" && (
      <motion.div
        initial={{ opacity: 0, x: -5 }}
        animate={{ opacity: 1, x: 0 }}
        className="z-10"
      >
        <div className="w-1 h-1 rounded-full bg-brand-primary animate-pulse" />
      </motion.div>
    )}
  </button>
);

export const Sidebar: React.FC<{ activeTab: AppTab }> = memo(
  ({ activeTab }) => {
    const { setActiveTab } = useAppActions();
    const { currentUser, logout } = useAuthStore();
    const [isSwitchOpen, setIsSwitchOpen] = useState(false);

    const NAV_CONFIG = useMemo(
      () => [
        {
          section: "Overview",
          code: "HUD",
          items: [
            { icon: LayoutDashboard, tab: "dashboard", label: "Dashboard" },
          ],
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
      ],
      [],
    );

    const filteredNav = useMemo(() => {
      return NAV_CONFIG.map((section) => ({
        ...section,
        items: section.items.filter((item) =>
          currentUser
            ? isTabAllowed(currentUser.role, item.tab as AppTab)
            : item.tab === "dashboard",
        ),
      })).filter((section) => section.items.length > 0);
    }, [currentUser, NAV_CONFIG]);

    return (
      <nav className="w-72 h-full flex flex-col border-r border-(--color-zenthar-steel) bg-(--color-zenthar-carbon) z-50 relative">
        {/* Brand Identity */}
        <div className="p-10 relative">
          <LogoRoot size="lg" variant="dark">
            <LogoIcon animated />
          </LogoRoot>
          <div className="mt-4 flex items-center gap-2 overflow-hidden">
            <div className="h-px flex-1 bg-linear-to-r from-brand-primary/40 to-transparent" />
            <span className="text-[7px] font-mono text-(--color-zenthar-text-muted) tracking-[0.5em]">
              {import.meta.env.VITE_ZENTHAR_VERSION}_SYS
            </span>
          </div>
        </div>

        {/* Navigation Area */}
        <div className="flex-1 px-4 overflow-y-auto no-scrollbar space-y-10 pb-10">
          {filteredNav.map((section, idx) => (
            <div key={section.section} className="space-y-2">
              <header className="px-5 flex items-center justify-between opacity-40">
                <span className="text-[8px] font-display font-bold text-(--color-zenthar-text-muted) uppercase tracking-[0.4em]">
                  {section.section}
                </span>
                <span className="text-[7px] font-mono text-brand-primary">
                  [{section.code}-0{idx + 1}]
                </span>
              </header>
              <div className="flex flex-col gap-1">
                {section.items.map((item) => (
                  <NavItem
                    key={item.tab}
                    icon={item.icon}
                    active={activeTab === item.tab}
                    onClick={() => setActiveTab(item.tab as AppTab)}
                    label={item.label}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer Utility Pod */}
        <div className="p-6 mt-auto bg-linear-to-t from-(--color-zenthar-void) to-transparent space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setActiveTab("settings")}
              className="flex flex-col items-center justify-center p-3 rounded-2xl bg-(--color-zenthar-steel) border border-(--color-zenthar-border) hover:bg-brand-primary/10 transition-colors group"
            >
              <Settings
                size={14}
                className="text-(--color-zenthar-text-muted) group-hover:text-brand-primary transition-colors mb-1"
              />
              <span className="text-[7px] font-black text-(--color-zenthar-text-muted) group-hover:text-(--color-zenthar-text-primary) uppercase tracking-widest">
                Config
              </span>
            </button>
            <button
              onClick={() => setActiveTab("archive")}
              className="flex flex-col items-center justify-center p-3 rounded-2xl bg-(--color-zenthar-steel) border border-(--color-zenthar-border) hover:bg-brand-primary/10 transition-colors group"
            >
              <Archive
                size={14}
                className="text-(--color-zenthar-text-muted) group-hover:text-brand-primary transition-colors mb-1"
              />
              <span className="text-[7px] font-black text-(--color-zenthar-text-muted) group-hover:text-(--color-zenthar-text-primary) uppercase tracking-widest">
                Vault
              </span>
            </button>
          </div>

          {/* User Identity Module */}
          <div className="relative p-4 rounded-2xl bg-black/5 border border-black/5 overflow-hidden group/user">
            {/* Integrity Bar */}
            <div className="absolute top-0 left-0 h-px w-full bg-black/10">
              <motion.div
                animate={{ x: ["-100%", "100%"] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="h-full w-1/3 bg-brand-primary/40 shadow-[0_0_8px_brand-primary]"
              />
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsSwitchOpen(true)}
                className="relative w-10 h-10 rounded-xl bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center group/avatar overflow-hidden shrink-0"
              >
                <Fingerprint
                  size={18}
                  className="text-brand-primary group-hover/avatar:opacity-0 transition-opacity"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-brand-primary translate-y-full group-hover/avatar:translate-y-0 transition-transform">
                  <RefreshCw
                    size={14}
                    className="text-black animate-spin-slow"
                  />
                </div>
              </button>

              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black text-(--color-zenthar-text-primary) truncate uppercase tracking-widest leading-none mb-1.5">
                  {currentUser?.name || "GUEST_USER"}
                </p>
                <div className="flex items-center gap-1.5 opacity-60">
                  <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                  <p className="text-[7px] font-mono text-emerald-500 uppercase">
                    Secure_Session
                  </p>
                </div>
              </div>

              <button
                onClick={logout}
                className="p-2 text-(--color-zenthar-text-muted) hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
              >
                <LogOut size={14} />
              </button>
            </div>
          </div>
        </div>

        <QuickSwitch
          isOpen={isSwitchOpen}
          onClose={() => setIsSwitchOpen(false)}
        />
      </nav>
    );
  },
);

Sidebar.displayName = "Sidebar";
