import React, { memo, useState, useCallback, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "@/src/lib/motion";
import { Sidebar } from "./layout/Sidebar";
import { Header } from "./layout/Header";
import { RightRail } from "./layout/RightRail";
import { useAppStore } from "../orchestrator/state/app.store";
import { useAuthStore } from "../orchestrator/state/auth.store";
import { LoginPage } from "../capsules/auth";
import clsx from "@/src/lib/clsx";

export const AppShell: React.FC<{ children: React.ReactNode }> = memo(
  ({ children }) => {
    const { activeTab } = useAppStore();
    const { isAuthenticated, currentUser } = useAuthStore();

    // Mobile sidebar state
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
    // Right rail hidden on small screens by default
    const [rightRailOpen, setRightRailOpen] = useState(false);

    // Close mobile sidebar on tab change
    useEffect(() => {
      setMobileSidebarOpen(false);
    }, [activeTab]);

    // Close sidebar on escape
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

    const toggleMobileSidebar = useCallback(() => {
      setMobileSidebarOpen((v) => !v);
    }, []);

    if (!isAuthenticated) return <LoginPage />;

    return (
      <div className="flex h-[100dvh] w-screen bg-(--color-zenthar-void) relative overflow-hidden font-sans antialiased selection:bg-brand-primary/20">
        {/* ── ATMOSPHERICS ── */}
        <div className="pointer-events-none fixed inset-0 z-50 opacity-[0.03] mix-blend-overlay bg-[url('/assets/noise.png')]" />
        <div className="scanline pointer-events-none fixed inset-0 z-50 opacity-[0.02] mix-blend-overlay" />
        <div className="pointer-events-none fixed -top-24 -left-24 w-96 h-96 bg-brand-primary/10 blur-[120px] rounded-full" />
        <div className="pointer-events-none fixed -bottom-24 -right-24 w-96 h-96 bg-brand-accent/10 blur-[120px] rounded-full" />

        {/* ── MOBILE OVERLAY ── */}
        <AnimatePresence>
          {mobileSidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
              onClick={() => setMobileSidebarOpen(false)}
            />
          )}
        </AnimatePresence>

        {/* ── SIDEBAR — desktop always visible, mobile slides in ── */}
        <div
          className={clsx(
            // Desktop: always visible, normal flow
            "hidden lg:flex lg:relative lg:z-auto lg:translate-x-0",
            // Mobile: fixed, full-height, slides from left
            "lg:block"
          )}
        >
          <Sidebar activeTab={activeTab} />
        </div>

        {/* Mobile sidebar */}
        <AnimatePresence>
          {mobileSidebarOpen && (
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed left-0 top-0 h-full z-50 lg:hidden"
            >
              <Sidebar activeTab={activeTab} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── WORKSPACE ── */}
        <div className="flex-1 flex flex-col min-w-0 relative z-10 bg-(--color-zenthar-carbon)/60 backdrop-blur-md overflow-hidden">
          {/* Mobile hamburger button */}
          <div className="flex lg:hidden items-center gap-3 px-4 pt-3 pb-0 shrink-0">
            <button
              onClick={toggleMobileSidebar}
              className="p-2 rounded-xl bg-(--color-zenthar-carbon) border border-(--color-zenthar-steel) text-(--color-zenthar-text-primary) hover:bg-brand-primary/10 hover:text-brand-primary transition-all"
              aria-label="Open menu"
            >
              {mobileSidebarOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-primary">
              Zenthar
            </span>
          </div>

          <Header onMenuToggle={toggleMobileSidebar} />

          <div className="flex-1 relative overflow-hidden flex flex-col min-h-0">
            <AnimatePresence mode="wait">
              <motion.main
                key={activeTab}
                initial={{ opacity: 0, y: 8, filter: "blur(8px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -8, filter: "blur(8px)" }}
                transition={{ type: "spring", stiffness: 400, damping: 35, mass: 0.5 }}
                className="flex-1 w-full overflow-y-auto custom-scrollbar relative p-4 md:p-6 lg:p-8"
              >
                <div className="max-w-7xl mx-auto min-h-full pb-20">
                  {children}
                </div>

                {/* Footer decoration — only on desktop */}
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

        {/* ── RIGHT RAIL — hidden on mobile, toggle button shown ── */}
        {/* Mobile toggle button */}
        <button
          onClick={() => setRightRailOpen((v) => !v)}
          className={clsx(
            "fixed right-0 top-1/2 -translate-y-1/2 z-40 xl:hidden",
            "w-6 h-16 bg-(--color-zenthar-carbon) border border-(--color-zenthar-steel)",
            "border-r-0 rounded-l-xl flex items-center justify-center",
            "text-(--color-zenthar-text-muted) hover:text-brand-primary transition-colors",
          )}
          aria-label="Toggle info panel"
        >
          <span className="text-[8px] font-black uppercase writing-mode-vertical">⟨</span>
        </button>

        {/* Right rail — always on xl, slide-over on smaller screens */}
        <div className="hidden xl:flex">
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
              />
              <motion.div
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

        {/* ── ARCHITECTURAL GRID MARKERS (desktop only) ── */}
        <div className="hidden lg:block fixed inset-0 pointer-events-none z-0 opacity-20">
          <div className="absolute top-0 left-72 h-full w-px bg-brand-sage/10" />
          <div className="absolute top-0 right-80 h-full w-px bg-brand-sage/10" />
          <div className="absolute top-24 left-72 right-80 h-px bg-brand-sage/10" />
        </div>
      </div>
    );
  },
);

AppShell.displayName = "AppShell";