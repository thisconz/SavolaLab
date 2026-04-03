import React, { memo, useMemo } from "react";
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

    // 1. Auth Guard: Early return for guest state
    if (!isAuthenticated) return <LoginPage />;

    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex h-screen w-screen bg-[#FDFDFD] relative overflow-hidden font-sans antialiased selection:bg-brand-primary/20"
      >
        {/* --- LAYER 0: ENVIRONMENTAL FX --- */}
        {/* The "Glass" Scanline & Noise Overlay */}
        <div className="pointer-events-none fixed inset-0 z-50 opacity-[0.015] mix-blend-overlay bg-[url('/assets/noise.png')]" />
        <div className="scanline pointer-events-none fixed inset-0 z-50 opacity-[0.02] mix-blend-overlay" />
        
        {/* Subtle Brand Gradient Glow */}
        <div className="pointer-events-none fixed -top-24 -left-24 w-96 h-96 bg-brand-primary/5 blur-[120px] rounded-full" />
        <div className="pointer-events-none fixed -bottom-24 -right-24 w-96 h-96 bg-brand-laser/5 blur-[120px] rounded-full" />

        {/* --- PILLAR 1: NAVIGATION --- */}
        <Sidebar activeTab={activeTab} />

        {/* --- PILLAR 2: WORKSPACE --- */}
        <div className="flex-1 flex flex-col min-w-0 relative z-10 bg-white/40 backdrop-blur-md">
          {/* Integrated Workspace Header */}
          <Header />

          {/* Feature Projection Area */}
          <div className="flex-1 relative overflow-hidden flex flex-col">
            <AnimatePresence mode="wait">
              <motion.main
                key={activeTab}
                initial={{ opacity: 0, y: 10, filter: "blur(10px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -10, filter: "blur(10px)" }}
                transition={{
                  type: "spring",
                  stiffness: 400,
                  damping: 35,
                  mass: 0.5,
                }}
                className="flex-1 w-full overflow-y-auto custom-scrollbar relative p-8"
              >
                {/* Content Anchor: Uses Canonical Max-Width */}
                <div className="max-w-7xl mx-auto min-h-full pb-20">
                  {children}
                </div>

                {/* --- LAYER 3: TELEMETRY DECORATION --- */}
                <div className="sticky bottom-0 left-0 w-full pt-10 pb-4 flex justify-between items-end pointer-events-none select-none">
                   {/* Breadcrumb / Path Trace */}
                   <div className="flex items-center gap-4 px-2">
                      <div className="h-px w-8 bg-brand-sage/20" />
                      <span className="text-[7px] font-black text-brand-sage uppercase tracking-[0.5em] opacity-40">
                        Node_Path // 0x{activeTab.length} // {activeTab}
                      </span>
                   </div>

                   {/* Session Status Marker */}
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

        {/* --- PILLAR 3: UTILITY RAIL --- */}
        <RightRail />

        {/* --- LAYER 4: ARCHITECTURAL MARKERS --- */}
        {/* Visual indicators of the underlying grid system */}
        <div className="fixed inset-0 pointer-events-none z-0 opacity-20">
          {/* Vertical Separators */}
          <div className="absolute top-0 left-68 h-full w-px bg-brand-sage/10" />
          <div className="absolute top-0 right-72 h-full w-px bg-brand-sage/10" />
          
          {/* Horizontal Header Alignment */}
          <div className="absolute top-16 left-68 right-72 h-px bg-brand-sage/10" />
          
          {/* Corner Accents */}
          <div className="absolute top-4 left-72 w-2 h-2 border-t border-l border-brand-sage/30 rounded-tl-xs" />
          <div className="absolute top-4 right-76 w-2 h-2 border-t border-r border-brand-sage/30 rounded-tr-xs" />
        </div>
      </motion.div>
    );
  },
);

AppShell.displayName = "AppShell";