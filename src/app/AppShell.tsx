import React, { memo, useState, useCallback, useEffect } from "react";
import { Menu, X, FlaskConical, LayoutDashboard, Zap, BarChart3, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "@/src/lib/motion";
import { Sidebar } from "./layout/Sidebar";
import { Header } from "./layout/Header";
import { RightRail } from "./layout/RightRail";
import { useAppStore, useAppActions, AppTab } from "../orchestrator/state/app.store";
import { useAuthStore } from "../orchestrator/state/auth.store";
import { LoginPage } from "../capsules/auth";
import clsx from "@/src/lib/clsx";

// ─── Mobile bottom nav — quick-access for the 4 most-used tabs ──────────────
const MOBILE_NAV_TABS: {
  tab: AppTab;
  icon: React.ElementType;
  label: string;
}[] = [
  { tab: "dashboard", icon: LayoutDashboard, label: "Home" },
  { tab: "lab", icon: FlaskConical, label: "Lab" },
  { tab: "stat", icon: Zap, label: "STAT" },
  { tab: "analytics", icon: BarChart3, label: "Analytics" },
];

const MobileBottomNav: React.FC<{ activeTab: AppTab }> = ({ activeTab }) => {
  const { setActiveTab } = useAppActions();

  return (
    <nav
      aria-label="Mobile quick navigation"
      className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-(--color-zenthar-carbon)/95 backdrop-blur-2xl border-t border-(--color-zenthar-steel) pb-[var(--safe-area-bottom)]"
    >
      <div className="flex items-center justify-around px-2 py-2 mb-1">
        {MOBILE_NAV_TABS.map(({ tab, icon: Icon, label }) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              aria-label={`Navigate to ${label}`}
              aria-current={isActive ? "page" : undefined}
              className={clsx(
                "flex flex-col items-center gap-1 px-4 py-2 rounded-2xl transition-all duration-300 min-w-[60px] touch-manipulation",
                isActive
                  ? "bg-brand-primary/10 text-brand-primary"
                  : "text-(--color-zenthar-text-muted) hover:text-(--color-zenthar-text-primary)",
              )}
            >
              <Icon
                size={22}
                strokeWidth={isActive ? 2.5 : 2}
                className={clsx("transition-transform", isActive && "scale-110")}
              />
              <span
                className={clsx(
                  "text-[9px] font-black uppercase tracking-widest transition-all",
                  isActive ? "opacity-100" : "opacity-60",
                )}
              >
                {label}
              </span>
            </button>
          );
        })}

        {/* "More" button opens the full sidebar */}
        <button
          onClick={() => {
            window.dispatchEvent(new CustomEvent("open-mobile-sidebar"));
          }}
          aria-label="Open full navigation menu"
          className="flex flex-col items-center gap-1 px-4 py-2 rounded-2xl text-(--color-zenthar-text-muted) hover:text-(--color-zenthar-text-primary) transition-all min-w-[60px] touch-manipulation"
        >
          <Menu size={22} strokeWidth={2} />
          <span className="text-[9px] font-black uppercase tracking-widest opacity-60">More</span>
        </button>
      </div>
    </nav>
  );
};

// ─────────────────────────────────────────────
// Main AppShell
// ─────────────────────────────────────────────

export const AppShell: React.FC<{ children: React.ReactNode }> = memo(({ children }) => {
  const { activeTab } = useAppStore();
  const isAuthenticated = useAuthStore((s) => !!s.currentUser);
  const currentUser = useAuthStore((s) => s.currentUser);

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [rightRailOpen, setRightRailOpen] = useState(false);

  // Close mobile sidebar on tab change
  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [activeTab]);

  // Listen for the mobile bottom nav "More" button
  useEffect(() => {
    const handler = () => setMobileSidebarOpen(true);
    window.addEventListener("open-mobile-sidebar", handler);
    return () => window.removeEventListener("open-mobile-sidebar", handler);
  }, []);

  // Escape key closes all overlays
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
    <div className="flex h-[100dvh] w-screen bg-(--color-zenthar-void) relative overflow-hidden font-sans antialiased selection:bg-brand-primary/20">
      {/* Atmospheric decorations */}
      <div className="pointer-events-none fixed inset-0 z-50 opacity-[0.03] mix-blend-overlay bg-[url('/assets/noise.png')]" />
      <div className="scanline pointer-events-none fixed inset-0 z-50 opacity-[0.02] mix-blend-overlay" />
      <div className="pointer-events-none fixed -top-24 -left-24 w-96 h-96 bg-brand-primary/10 blur-[120px] rounded-full" />
      <div className="pointer-events-none fixed -bottom-24 -right-24 w-96 h-96 bg-brand-accent/10 blur-[120px] rounded-full" />

      {/* Mobile overlay backdrop */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileSidebarOpen(false)}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* ── DESKTOP SIDEBAR — always visible on lg+ ─────────────────────── */}
      {/* FIX #05: was "hidden lg:flex lg:relative lg:z-auto lg:translate-x-0 lg:block"
                  "lg:block" conflicted with "lg:flex". Now just "hidden lg:flex". */}
      <div className="hidden lg:flex shrink-0">
        <Sidebar activeTab={activeTab} />
      </div>

      {/* ── MOBILE SIDEBAR — slide in from left ─────────────────────────── */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed left-0 top-0 h-full z-50 lg:hidden shadow-2xl"
          >
            <Sidebar activeTab={activeTab} />
            {/* Close button at top-right of mobile sidebar */}
            <button
              onClick={() => setMobileSidebarOpen(false)}
              aria-label="Close navigation menu"
              className="absolute top-4 right-4 p-2 rounded-xl bg-(--color-zenthar-graphite) text-(--color-zenthar-text-muted) hover:text-(--color-zenthar-text-primary) transition-all"
            >
              <X size={18} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── MAIN WORKSPACE ─────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 relative z-10 bg-(--color-zenthar-carbon)/60 backdrop-blur-md">
        <Header onMenuToggle={toggleMobileSidebar} />

        <div className="flex-1 relative overflow-hidden flex flex-col min-h-0">
          <AnimatePresence mode="wait">
            <motion.main
              key={activeTab}
              initial={{ opacity: 0, y: 8, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -8, filter: "blur(8px)" }}
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 35,
                mass: 0.5,
              }}
              className={clsx(
                "flex-1 w-full overflow-y-auto custom-scrollbar relative p-4 md:p-6 lg:p-8",
                // Extra bottom padding on mobile for the bottom nav bar
                "pb-24 lg:pb-8",
              )}
            >
              <div className="max-w-7xl mx-auto min-h-full">{children}</div>

              {/* Footer decoration — desktop only */}
              <div className="hidden lg:flex sticky bottom-0 left-0 w-full pt-10 pb-4 justify-between items-end pointer-events-none select-none">
                <div className="flex items-center gap-4 px-2">
                  <div className="h-px w-8 bg-brand-sage/20" />
                  <span className="text-[7px] font-black text-brand-sage uppercase tracking-[0.5em] opacity-40">
                    Node // {activeTab}
                  </span>
                </div>
                <div className="flex flex-col items-end gap-1 px-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[7px] font-bold text-brand-primary uppercase tracking-widest">
                      Terminal Active
                    </span>
                    <div className="w-1 h-1 rounded-full bg-brand-primary animate-pulse" />
                  </div>
                  <span className="text-[6px] font-mono text-brand-sage/40 uppercase">
                    UID: {currentUser?.id?.substring(0, 8) || "GUEST"}
                  </span>
                </div>
              </div>
            </motion.main>
          </AnimatePresence>
        </div>
      </div>

      {/* ── MOBILE BOTTOM NAV ──────────────────────────────────────────── */}
      <MobileBottomNav activeTab={activeTab} />

      {/* ── RIGHT RAIL toggle — proper FAB, not a tiny 6px span ─────── */}
      <button
        onClick={() => setRightRailOpen((v) => !v)}
        aria-label="Toggle diagnostics panel"
        className={clsx(
          "fixed right-0 top-1/2 -translate-y-1/2 z-40 xl:hidden",
          "w-7 h-14 bg-(--color-zenthar-carbon) border border-(--color-zenthar-steel)",
          "border-r-0 rounded-l-xl flex items-center justify-center",
          "text-(--color-zenthar-text-muted) hover:text-brand-primary transition-colors",
        )}
      >
        <ChevronRight
          size={14}
          className={clsx("transition-transform", rightRailOpen && "rotate-180")}
        />
      </button>

      {/* Right rail — always on xl, slide-over on smaller screens */}
      <div className="hidden xl:flex shrink-0">
        <RightRail />
      </div>

      <AnimatePresence>
        {rightRailOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-30 xl:hidden bg-black/40"
              onClick={() => setRightRailOpen(false)}
              aria-hidden="true"
            />
            <motion.div
              role="complementary"
              aria-label="Diagnostics panel"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed right-0 top-0 h-full z-40 xl:hidden"
            >
              <RightRail />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Architectural grid markers — desktop only */}
      <div className="hidden lg:block fixed inset-0 pointer-events-none z-0 opacity-20">
        <div className="absolute top-0 left-72 h-full w-px bg-brand-sage/10" />
        <div className="absolute top-0 right-80 h-full w-px bg-brand-sage/10" />
        <div className="absolute top-24 left-72 right-80 h-px bg-brand-sage/10" />
      </div>
    </div>
  );
});

AppShell.displayName = "AppShell";
