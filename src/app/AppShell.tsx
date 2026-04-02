import React, { memo, useMemo } from "react";
import { motion, AnimatePresence } from "@/src/lib/motion";
import { Sidebar } from "./layout/Sidebar";
import { Header } from "./layout/Header";
import { RightRail } from "./layout/RightRail";
import { useAppStore } from "../orchestrator/state/app.store";
import { useAuthStore } from "../orchestrator/state/auth.store";
import { LoginPage } from "../capsules/auth";

export const AppShell: React.FC<{ children: React.ReactNode }> = memo(({ children }) => {
  const { activeTab } = useAppStore();
  const { isAuthenticated } = useAuthStore();

  // Prevents layout shift during auth state transitions
  const layoutKey = useMemo(() => (isAuthenticated ? "auth-terminal" : "guest-access"), [isAuthenticated]);

  if (!isAuthenticated) return <LoginPage />;

  return (
    <div className="flex h-screen w-screen bg-[#FDFDFD] instrument-grid relative overflow-hidden font-sans antialiased selection:bg-brand-primary/20">
      
      {/* GOD-TIER OVERLAY: The HUD Glass */}
      <div className="scanline pointer-events-none fixed inset-0 z-50 opacity-[0.02] mix-blend-overlay" />
      <div className="pointer-events-none fixed inset-0 z-50 bg-linear-to-tr from-brand-primary/2 via-transparent to-brand-laser/[0.02]" />

      {/* PILLAR 1: NAVIGATION (Fixed Width, Full Height) */}
      <Sidebar activeTab={activeTab} />

      {/* PILLAR 2: WORKSPACE (Flexible Core) */}
      <div className="flex-1 flex flex-col min-w-0 relative z-10 border-r border-brand-sage/5 bg-white/20 backdrop-blur-sm">
        
        {/* Docked Header: Integrated into the workspace pillar */}
        <Header />

        {/* Content Projection Area */}
        <div className="flex-1 relative overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.main
              key={activeTab}
              // Motion profile: Stiff mechanical slide with optical blur
              initial={{ opacity: 0, x: 8, scale: 0.995, filter: "blur(8px)" }}
              animate={{ opacity: 1, x: 0, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, x: -8, scale: 1.005, filter: "blur(8px)" }}
              transition={{ 
                type: "spring", 
                stiffness: 350, 
                damping: 32,
                mass: 0.5
              }}
              className="h-full w-full p-8 overflow-y-auto custom-scrollbar relative"
            >
              {/* Dynamic Content Anchor */}
              <div className="max-w-400 mx-auto h-full">
                {children}
              </div>

              {/* Internal Decoration: Layout Coordinates */}
              <div className="absolute bottom-4 right-8 flex gap-6 opacity-20 pointer-events-none">
                <span className="text-[8px] font-mono font-black tracking-[0.4em] text-brand-sage uppercase">
                  Terminal_Ready // {activeTab.toUpperCase()}
                </span>
              </div>
            </motion.main>
          </AnimatePresence>
        </div>
      </div>

      {/* PILLAR 3: TELEMETRY (Fixed Width, Full Height) */}
      <RightRail />

      {/* Layout Grid Markers (The 'God-Tier' touch) */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-0 opacity-40">
         <div className="absolute top-16 left-0 w-full h-px bg-brand-sage/5" />
         <div className="absolute top-0 left-64 h-full w-px bg-brand-sage/5" />
      </div>
    </div>
  );
});

AppShell.displayName = "AppShell";