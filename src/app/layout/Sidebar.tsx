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
} from "lucide-react";
import { motion, AnimatePresence } from "@/src/lib/motion";
import { LogoRoot, LogoIcon } from "../../ui/components/Logo";
import { useAppStore, AppTab } from "../../orchestrator/state/app.store";
import { useAuthStore } from "../../orchestrator/state/auth.store";
import { QuickSwitch } from "../../capsules/auth";
import { isTabAllowed } from "../../core/rbac";
import clsx from "@/src/lib/clsx";

/* --- Refined NavItem with Motion --- */

interface NavItemProps {
  icon: any;
  label: string;
  active: boolean;
  onClick: () => void;
  variant?: "default" | "mini";
}

const NavItem = ({ icon: Icon, label, active, onClick, variant = "default" }: NavItemProps) => (
  <button
    onClick={onClick}
    className={clsx(
      "w-full flex items-center gap-4 px-5 rounded-2xl transition-all duration-300 group relative overflow-hidden",
      variant === "mini" ? "py-2" : "py-3",
      active
        ? "bg-brand-primary/10 text-brand-deep shadow-inner"
        : "text-brand-sage hover:bg-brand-mist/60 hover:text-brand-deep",
    )}
  >
    {/* Active Indicator: Laser Line */}
    <AnimatePresence>
      {active && (
        <motion.div
          layoutId="laser-indicator"
          className="absolute left-0 top-3 bottom-3 w-0.5 bg-brand-primary rounded-r-full shadow-[0_0_8px_rgba(var(--brand-primary-rgb),0.8)]"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
        />
      )}
    </AnimatePresence>

    {/* Icon Container with Glow */}
    <div
      className={clsx(
        "relative z-10 transition-all duration-500 flex items-center justify-center",
        active
          ? "scale-110 text-brand-primary drop-shadow-[0_0_3px_rgba(var(--brand-primary-rgb),0.4)]"
          : "group-hover:scale-110 group-hover:text-brand-primary/70",
      )}
    >
      <Icon className={variant === "mini" ? "w-3.5 h-3.5" : "w-4.5 h-4.5"} />
    </div>

    <span
      className={clsx(
        "font-black uppercase tracking-widest flex-1 text-left z-10 transition-all duration-300 truncate",
        variant === "mini" ? "text-[8px]" : "text-[10px]",
        active ? "translate-x-1" : "group-hover:translate-x-0.5",
      )}
    >
      {label}
    </span>

    {active && variant === "default" && (
      <motion.div
        initial={{ opacity: 0, x: -5 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
      >
        <ChevronRight className="w-3 h-3 text-brand-primary/40" />
      </motion.div>
    )}
  </button>
);

/* --- Main Sidebar --- */

export const Sidebar: React.FC<{ activeTab: AppTab }> = memo(({ activeTab }) => {
  const { setActiveTab } = useAppStore();
  const { currentUser, logout } = useAuthStore();
  const [isSwitchOpen, setIsSwitchOpen] = useState(false);

  const NAV_CONFIG = useMemo(
    () => [
      {
        section: "Overview",
        items: [{ icon: LayoutDashboard, tab: "dashboard", label: "Dashboard" }],
      },
      {
        section: "Operations",
        items: [
          { icon: Microscope, tab: "lab", label: "Lab Bench" },
          { icon: Zap, tab: "stat", label: "STAT Requests" },
          { icon: Truck, tab: "dispatch", label: "Dispatch" },
          { icon: ListChecks, tab: "workflows", label: "Workflows" },
        ],
      },
      {
        section: "Intelligence",
        items: [
          { icon: BarChart3, tab: "analytics", label: "Analytics" },
          { icon: Factory, tab: "intelligence", label: "Plant Intel" },
        ],
      },
      {
        section: "System",
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
    <nav className="w-68 h-full flex flex-col border-r border-brand-sage/15 bg-white/70 backdrop-blur-3xl z-50 relative">
      {/* Brand Identity with Scan-line Effect */}
      <div className="p-8 pb-10 relative group/logo">
        <LogoRoot size="lg" variant="dark">
          <LogoIcon animated />
        </LogoRoot>
        <div className="absolute bottom-0 left-8 right-8 h-px bg-linear-to-r from-transparent via-brand-sage/20 to-transparent scale-x-0 group-hover/logo:scale-x-100 transition-transform duration-700" />
      </div>

      {/* Structured Navigation Scroll Area */}
      <div className="flex-1 px-4 overflow-y-auto custom-scrollbar space-y-8 pb-10">
        {filteredNav.map((section) => (
          <div key={section.section} className="relative">
            <h4 className="px-5 text-[8px] font-black text-brand-sage/50 uppercase tracking-widest mb-4 flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-brand-primary/30" />
              {section.section}
            </h4>
            <div className="flex flex-col gap-1.5">
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

      {/* Footer: Multi-Layer Utility Pod */}
      <div className="p-4 mt-auto space-y-3">
        {/* System Quick Links */}
        <div className="bg-brand-mist/30 rounded-3xl p-1.5 border border-brand-sage/10 backdrop-blur-sm">
          <div className="flex flex-col gap-0.5">
            <NavItem
              variant="mini"
              icon={Archive}
              label="Archives"
              active={activeTab === "archive"}
              onClick={() => setActiveTab("archive")}
            />
            <NavItem
              variant="mini"
              icon={Settings}
              label="Settings"
              active={activeTab === "settings"}
              onClick={() => setActiveTab("settings")}
            />
          </div>
        </div>

        {/* User Anchor Pod - High-Density UI */}
        <div className="bg-brand-deep rounded-3xl p-2 border border-white/5 shadow-2xl relative overflow-hidden group/pod">
          {/* Animated Background Mesh */}
          <div className="absolute inset-0 bg-[url('/assets/grid-mesh.svg')] opacity-5 pointer-events-none" />
          
          <div className="relative z-10 flex items-center gap-3">
            <button
              onClick={() => setIsSwitchOpen(true)}
              className="relative w-11 h-11 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center transition-all hover:bg-white hover:scale-105 active:scale-95 group/btn overflow-hidden"
            >
              <span className="text-[11px] font-black text-white group-hover/btn:text-brand-deep transition-colors">
                {currentUser?.initials || "??"}
              </span>
              <div className="absolute inset-0 bg-brand-primary text-brand-deep flex items-center justify-center translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300">
                <RefreshCw className="w-4 h-4 animate-spin-slow" />
              </div>
            </button>

            <div className="flex-1 min-w-0">
              <p className="text-[9px] font-black text-white truncate uppercase tracking-tighter">
                {currentUser?.name || "Unauthenticated"}
              </p>
              <div className="flex items-center gap-1.5">
                <Cpu className="w-2 h-2 text-brand-primary animate-pulse" />
                <p className="text-[7px] font-bold text-brand-primary uppercase tracking-widest opacity-80">
                  {currentUser?.role || "GUEST_ACCESS"}
                </p>
              </div>
            </div>

            <button
              onClick={logout}
              className="p-2.5 text-white/40 hover:text-lab-laser hover:bg-white/5 rounded-xl transition-all"
              title="Terminate Session"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      <QuickSwitch isOpen={isSwitchOpen} onClose={() => setIsSwitchOpen(false)} />
    </nav>
  );
});

Sidebar.displayName = "Sidebar";