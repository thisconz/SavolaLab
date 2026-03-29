import React, { memo, useMemo } from "react";
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
} from "lucide-react";
import { LogoRoot, LogoIcon } from "../../ui/components/Logo";
import { useAppStore, AppTab } from "../../orchestrator/state/app.store";
import { useAuthStore } from "../../orchestrator/state/auth.store";
import { isTabAllowed } from "../../core/rbac";
import clsx from "clsx";

interface SidebarProps {
  activeTab: AppTab;
}

interface NavItemProps {
  icon: any;
  label: string;
  active: boolean;
  onClick: () => void;
}

const NavItem: React.FC<NavItemProps> = ({
  icon: Icon,
  label,
  active,
  onClick,
}) => (
  <button
    onClick={onClick}
    className={clsx(
      "w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-300 group relative text-left",
      active
        ? "bg-brand-primary/10 text-brand-primary"
        : "text-brand-sage hover:bg-brand-mist hover:text-brand-deep",
    )}
  >
    {active && (
      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-brand-primary rounded-r-full" />
    )}
    <Icon
      className={clsx(
        "w-4 h-4 transition-transform duration-300",
        active ? "scale-110" : "group-hover:scale-110",
      )}
    />
    <span
      className={clsx(
        "text-xs font-bold tracking-wide flex-1",
        active
          ? "text-brand-primary"
          : "text-brand-deep/70 group-hover:text-brand-deep",
      )}
    >
      {label}
    </span>
    {active && <ChevronRight className="w-3 h-3 opacity-50" />}
  </button>
);

const NavSection: React.FC<{ title: string; children: React.ReactNode }> = ({
  title,
  children,
}) => (
  <div className="mb-6">
    <h4 className="px-4 text-[9px] font-black text-brand-sage uppercase tracking-[0.2em] mb-2 opacity-60">
      {title}
    </h4>
    <div className="flex flex-col gap-1">{children}</div>
  </div>
);

export const Sidebar: React.FC<SidebarProps> = memo(({ activeTab }) => {
  const { setActiveTab } = useAppStore();
  const { currentUser } = useAuthStore();

  const navItems = [
    {
      icon: LayoutDashboard,
      tab: "dashboard" as AppTab,
      label: "Dashboard",
      section: "Overview",
    },
    {
      icon: Microscope,
      tab: "lab" as AppTab,
      label: "Lab Bench",
      section: "Operations",
    },
    {
      icon: Zap,
      tab: "stat" as AppTab,
      label: "STAT Requests",
      section: "Operations",
    },
    {
      icon: Truck,
      tab: "dispatch" as AppTab,
      label: "Dispatch",
      section: "Operations",
    },
    {
      icon: ListChecks,
      tab: "workflows" as AppTab,
      label: "Workflows",
      section: "Operations",
    },
    {
      icon: BarChart3,
      tab: "analytics" as AppTab,
      label: "Analytics",
      section: "Intelligence",
    },
    {
      icon: Factory,
      tab: "intelligence" as AppTab,
      label: "Plant Intel",
      section: "Intelligence",
    },
    {
      icon: Database,
      tab: "assets" as AppTab,
      label: "Assets",
      section: "System",
    },
    {
      icon: ShieldAlert,
      tab: "audit" as AppTab,
      label: "Audit",
      section: "System",
    },
  ];

  const filteredNavItems = navItems.filter((item) =>
    currentUser
      ? isTabAllowed(currentUser.role, item.tab)
      : item.tab === "dashboard",
  );

  const sections = ["Overview", "Operations", "Intelligence", "System"];

  return (
    <nav className="w-64 flex flex-col py-6 border-r border-brand-sage/10 bg-white/50 backdrop-blur-xl z-20 shadow-2xl relative overflow-y-auto custom-scrollbar">
      <div className="px-6 mb-8 cursor-pointer">
        <LogoRoot size="lg" variant="dark">
          <LogoIcon animated />
        </LogoRoot>
      </div>

      <div className="flex-1 px-3">
        {sections.map((section) => {
          const sectionItems = filteredNavItems.filter(
            (item) => item.section === section,
          );
          if (sectionItems.length === 0) return null;

          return (
            <NavSection key={section} title={section}>
              {sectionItems.map((item) => (
                <NavItem
                  key={item.tab}
                  icon={item.icon}
                  active={activeTab === item.tab}
                  onClick={() => setActiveTab(item.tab)}
                  label={item.label}
                />
              ))}
            </NavSection>
          );
        })}
      </div>

      <div className="px-3 pt-4 border-t border-brand-sage/10 mt-auto">
        <NavSection title="Configuration">
          <NavItem
            icon={Database}
            active={activeTab === "archive"}
            onClick={() => setActiveTab("archive")}
            label="Archives"
          />
          <NavItem
            icon={Settings}
            active={activeTab === "settings"}
            onClick={() => setActiveTab("settings")}
            label="Settings"
          />
        </NavSection>
      </div>
    </nav>
  );
});

Sidebar.displayName = "Sidebar";
