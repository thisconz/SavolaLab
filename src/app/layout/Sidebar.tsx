import React, { memo, useMemo, useState } from "react";
import {
  LayoutDashboard, Microscope, Zap, Truck, BarChart3,
  ListChecks, Factory, Database, ShieldAlert, Settings,
  ChevronRight, Archive, LogOut, User as UserIcon, RefreshCw
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
}

const NavItem = ({ icon: Icon, label, active, onClick }: NavItemProps) => (
  <button
    onClick={onClick}
    className={clsx(
      "w-full flex items-center gap-4 px-5 py-3 rounded-2xl transition-all duration-300 group relative overflow-hidden",
      active
        ? "bg-brand-primary/10 text-brand-deep shadow-[inset_0_1px_2px_rgba(var(--brand-primary-rgb),0.05)]"
        : "text-brand-sage hover:bg-brand-mist/60 hover:text-brand-deep"
    )}
  >
    <AnimatePresence>
      {active && (
        <motion.div 
          layoutId="laser-indicator"
          className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-brand-primary rounded-r-full shadow-[0_0_12px_rgba(var(--brand-primary-rgb),1)]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />
      )}
    </AnimatePresence>

    <div className={clsx(
      "relative z-10 transition-transform duration-500",
      active ? "scale-110 text-brand-primary" : "group-hover:scale-110 group-hover:text-brand-primary/70"
    )}>
      <Icon className="w-4.5 h-4.5" />
    </div>

    <span className={clsx(
      "text-[10px] font-black uppercase tracking-[0.2em] flex-1 text-left z-10 transition-all duration-300",
      active ? "translate-x-1" : "group-hover:translate-x-0.5"
    )}>
      {label}
    </span>

    {active && (
      <motion.div initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }}>
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

  const NAV_CONFIG = useMemo(() => [
    { section: "Overview", items: [{ icon: LayoutDashboard, tab: "dashboard", label: "Dashboard" }] },
    { section: "Operations", items: [
      { icon: Microscope, tab: "lab", label: "Lab Bench" },
      { icon: Zap, tab: "stat", label: "STAT Requests" },
      { icon: Truck, tab: "dispatch", label: "Dispatch" },
      { icon: ListChecks, tab: "workflows", label: "Workflows" },
    ]},
    { section: "Intelligence", items: [
      { icon: BarChart3, tab: "analytics", label: "Analytics" },
      { icon: Factory, tab: "intelligence", label: "Plant Intel" },
    ]},
    { section: "System", items: [
      { icon: Database, tab: "assets", label: "Assets" },
      { icon: ShieldAlert, tab: "audit", label: "Audit Log" },
    ]}
  ], []);

  const filteredNav = useMemo(() => {
    return NAV_CONFIG.map(section => ({
      ...section,
      items: section.items.filter(item => 
        currentUser ? isTabAllowed(currentUser.role, item.tab as AppTab) : item.tab === "dashboard"
      )
    })).filter(section => section.items.length > 0);
  }, [currentUser, NAV_CONFIG]);

  return (
    <nav className="w-68 h-full flex flex-col border-r border-brand-sage/15 bg-white/70 backdrop-blur-3xl z-50 relative">
      
      {/* 1. Header: Brand Identity */}
      <div className="p-8 pb-10">
        <LogoRoot size="lg" variant="dark">
          <LogoIcon animated />
        </LogoRoot>
      </div>

      {/* 2. Scroll Area: Structured Navigation */}
      <div className="flex-1 px-4 overflow-y-auto custom-scrollbar space-y-8 pb-10">
        {filteredNav.map((section) => (
          <div key={section.section}>
            <h4 className="px-5 text-[8px] font-black text-brand-sage/50 uppercase tracking-[0.4em] mb-4">
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

      {/* 3. Footer: Session & Configuration */}
      <div className="p-4 mt-auto">
        <div className="bg-brand-mist/40 rounded-3xl p-2 border border-brand-sage/10 backdrop-blur-sm">
          {/* Quick Config Links */}
          <div className="flex flex-col gap-1 mb-2">
            <NavItem 
              icon={Archive} 
              label="Archives" 
              active={activeTab === "archive"} 
              onClick={() => setActiveTab("archive")} 
            />
            <NavItem 
              icon={Settings} 
              label="Settings" 
              active={activeTab === "settings"} 
              onClick={() => setActiveTab("settings")} 
            />
          </div>

          {/* User Anchor Pod */}
          <div className="flex items-center gap-2 bg-brand-mist/50 p-1.5 rounded-2xl border border-brand-sage/10 shadow-inner group/pod">
            <button
              onClick={() => setIsSwitchOpen(true)}
              className="relative w-11 h-11 rounded-xl bg-white shadow-xs flex items-center justify-center transition-all hover:scale-105 active:scale-95 group/btn overflow-hidden"
            >
              <span className="text-[11px] font-black text-brand-deep group-hover/btn:opacity-0 transition-opacity">
                {currentUser?.initials || "??"}
              </span>
              <div className="absolute inset-0 bg-brand-deep text-brand-primary flex items-center justify-center translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300">
                <RefreshCw className="w-4 h-4 animate-spin-slow" />
              </div>
            </button>

            <div className="flex-1 min-w-0 px-1">
              <p className="text-[10px] font-black text-brand-deep truncate uppercase tracking-tighter">
                {currentUser?.name || "Unauthenticated"}
              </p>
              <p className="text-[8px] font-bold text-brand-sage uppercase tracking-widest opacity-60">
                {currentUser?.role || "GUEST_ACCESS"}
              </p>
            </div>

            <button 
              onClick={logout}
              className="p-2.5 text-brand-sage hover:text-lab-laser hover:bg-white rounded-xl transition-all"
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