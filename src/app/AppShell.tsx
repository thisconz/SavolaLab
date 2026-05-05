import React, { memo, useState, useCallback, useEffect } from "react";
import { Menu, X, FlaskConical, LayoutDashboard, Zap, BarChart3, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Sidebar } from "./layout/Sidebar";
import { Header } from "./layout/Header";
import { RightRail } from "./layout/RightRail";
import { useAppStore, type AppTab, useSetActiveTab } from "../orchestrator/state/app.store";
import { useAuthStore } from "../orchestrator/state/auth.store";
import { LoginPage } from "../capsules/auth";
import clsx from "clsx";

const MOBILE_NAV_TABS: { tab: AppTab; icon: React.ElementType; label: string }[] = [
  { tab: "dashboard", icon: LayoutDashboard, label: "Home" },
  { tab: "lab", icon: FlaskConical, label: "Lab" },
  { tab: "stat", icon: Zap, label: "STAT" },
  { tab: "analytics", icon: BarChart3, label: "Charts" },
];

const MobileBottomNav: React.FC<{ activeTab: AppTab }> = ({ activeTab }) => {
  const setActiveTab = useSetActiveTab();

  return (
    <nav
      aria-label="Mobile quick navigation"
      className="fixed right-0 bottom-0 left-0 z-50 pb-[var(--safe-area-bottom)] lg:hidden"
      style={{
        background: "rgba(5,5,15,0.97)",
        borderTop: "1px solid rgba(100,120,200,0.12)",
        backdropFilter: "blur(24px)",
      }}
    >
      {/* Top accent line */}
      <div
        className="absolute top-0 right-0 left-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(244,63,94,0.5), rgba(139,92,246,0.5), transparent)",
        }}
      />

      <div className="mb-1 flex items-center justify-around px-2 py-2">
        {MOBILE_NAV_TABS.map(({ tab, icon: Icon, label }) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              aria-label={`Navigate to ${label}`}
              aria-current={isActive ? "page" : undefined}
              className="flex min-w-[60px] touch-manipulation flex-col items-center gap-1 rounded-xl px-4 py-2 transition-all duration-300"
              style={{
                background: isActive ? "rgba(244,63,94,0.1)" : "transparent",
                border: isActive ? "1px solid rgba(244,63,94,0.2)" : "1px solid transparent",
                color: isActive ? "#f43f5e" : "rgba(136,146,176,0.6)",
              }}
            >
              <Icon
                size={20}
                strokeWidth={isActive ? 2.5 : 2}
                className={clsx("transition-transform", isActive && "scale-110")}
              />
              <span
                className={clsx(
                  "text-[9px] font-black tracking-widest uppercase transition-all",
                  isActive ? "opacity-100" : "opacity-60",
                )}
              >
                {label}
              </span>
            </button>
          );
        })}

        <button
          onClick={() => window.dispatchEvent(new CustomEvent("open-mobile-sidebar"))}
          aria-label="Open full navigation menu"
          className="text-zenthar-text-muted hover:text-zenthar-text-primary flex min-w-[60px] touch-manipulation flex-col items-center gap-1 rounded-xl px-4 py-2 transition-all"
        >
          <Menu size={20} strokeWidth={2} />
          <span className="text-[9px] font-black tracking-widest uppercase opacity-60">More</span>
        </button>
      </div>
    </nav>
  );
};

export const AppShell: React.FC<{ children: React.ReactNode }> = memo(({ children }) => {
  const { activeTab } = useAppStore();
  const setActiveTab = useSetActiveTab();
  const isAuthenticated = useAuthStore((s) => !!s.currentUser);
  const currentUser = useAuthStore((s) => s.currentUser);

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [rightRailOpen, setRightRailOpen] = useState(false);

  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [activeTab]);
  useEffect(() => {
    const handler = () => setMobileSidebarOpen(true);
    window.addEventListener("open-mobile-sidebar", handler);
    return () => window.removeEventListener("open-mobile-sidebar", handler);
  }, []);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobileSidebarOpen(false);
        setRightRailOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const toggleMobileSidebar = useCallback(() => setMobileSidebarOpen((v) => !v), []);

  if (!isAuthenticated) return <LoginPage />;

  return (
    <div className="zenthar-bg-mesh relative flex h-[100dvh] w-screen overflow-hidden font-sans antialiased">
      {/* Global grid */}
      <div className="instrument-grid pointer-events-none fixed inset-0 z-0 opacity-40" />

      {/* Atmospheric glows */}
      <div
        className="pointer-events-none fixed -top-40 -left-40 h-[500px] w-[500px] rounded-full opacity-50 blur-[120px]"
        style={{ background: "rgba(244,63,94,0.04)" }}
      />
      <div
        className="pointer-events-none fixed -right-40 -bottom-40 h-[400px] w-[400px] rounded-full opacity-40 blur-[100px]"
        style={{ background: "rgba(139,92,246,0.04)" }}
      />

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 lg:hidden"
            style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
            onClick={() => setMobileSidebarOpen(false)}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <div className="hidden shrink-0 lg:flex">
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <motion.div
            role="dialog"
            aria-modal="true"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed top-0 left-0 z-50 h-full shadow-2xl lg:hidden"
          >
            <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
            <button
              onClick={() => setMobileSidebarOpen(false)}
              className="text-zenthar-text-muted hover:text-zenthar-text-primary absolute top-4 right-4 rounded-xl p-2 transition-all"
              style={{ background: "rgba(8,8,26,0.8)", border: "1px solid rgba(100,120,200,0.12)" }}
            >
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main workspace */}
      <div className="relative z-10 flex min-w-0 flex-1 flex-col">
        <Header onMenuToggle={toggleMobileSidebar} />

        <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.main
              key={activeTab}
              initial={{ opacity: 0, y: 8, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -8, filter: "blur(8px)" }}
              transition={{ type: "spring", stiffness: 400, damping: 35, mass: 0.5 }}
              className="custom-scrollbar relative w-full flex-1 overflow-y-auto p-4 pb-24 md:p-6 lg:pb-8"
            >
              <div className="mx-auto min-h-full max-w-7xl">{children}</div>

              {/* Desktop footer decoration */}
              <div className="pointer-events-none sticky bottom-0 left-0 hidden w-full items-end justify-between pt-8 pb-3 select-none lg:flex">
                <div className="flex items-center gap-3 px-2">
                  <div
                    className="h-px w-8"
                    style={{ background: "linear-gradient(90deg, transparent, rgba(244,63,94,0.3))" }}
                  />
                  <span className="text-zenthar-text-muted text-[7px] font-black tracking-[0.5em] uppercase opacity-40">
                    Node // {activeTab}
                  </span>
                </div>
                <div className="flex items-center gap-2 px-2">
                  <div
                    className="bg-brand-primary h-1 w-1 animate-pulse rounded-full"
                    style={{ boxShadow: "0 0 6px rgba(244,63,94,0.8)" }}
                  />
                  <span className="text-zenthar-text-muted font-mono text-[7px] tracking-widest uppercase opacity-40">
                    UID: {currentUser?.id?.substring(0, 8) || "GUEST"}
                  </span>
                </div>
              </div>
            </motion.main>
          </AnimatePresence>
        </div>
      </div>

      {/* Mobile bottom nav */}
      <MobileBottomNav activeTab={activeTab} />

      {/* Right rail toggle */}
      <button
        onClick={() => setRightRailOpen((v) => !v)}
        aria-label="Toggle diagnostics panel"
        className="text-zenthar-text-muted hover:text-brand-primary fixed top-1/2 right-0 z-40 flex h-14 w-7 -translate-y-1/2 items-center justify-center rounded-l-xl transition-colors xl:hidden"
        style={{
          background: "rgba(8,8,26,0.9)",
          border: "1px solid rgba(100,120,200,0.12)",
          borderRight: "none",
        }}
      >
        <ChevronRight size={13} className={clsx("transition-transform", rightRailOpen && "rotate-180")} />
      </button>

      {/* Right rail desktop */}
      <div className="hidden shrink-0 xl:flex">
        <RightRail />
      </div>

      {/* Right rail mobile overlay */}
      <AnimatePresence>
        {rightRailOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-30 xl:hidden"
              style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
              onClick={() => setRightRailOpen(false)}
            />
            <motion.div
              role="complementary"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed top-0 right-0 z-40 h-full xl:hidden"
            >
              <RightRail />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
});

AppShell.displayName = "AppShell";
