import React, { memo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sidebar } from "./layout/Sidebar";
import { Header } from "./layout/Header";
import { RightRail } from "./layout/RightRail";
import { useAppStore } from "../orchestrator/state/app.store";
import { useAuthStore } from "../orchestrator/state/auth.store";
import { LoginPage } from "../capsules/auth";

interface AppShellProps {
  children: React.ReactNode;
}

/**
 * AppShell provides the stable frame for the application.
 * It is memoized to prevent unnecessary re-renders of the layout.
 */
export const AppShell: React.FC<AppShellProps> = memo(({ children }) => {
  const { activeTab } = useAppStore();
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <div className="flex h-screen w-screen bg-white instrument-grid relative overflow-hidden">
      <div className="scanline" />

      <Sidebar activeTab={activeTab} />

      <main className="flex-1 flex flex-col overflow-hidden relative z-10">
        <Header />

        <div className="flex-1 p-6 grid grid-cols-12 gap-6 overflow-hidden">
          <div className="col-span-9 h-full overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="col-span-3 h-full overflow-hidden">
            <RightRail />
          </div>
        </div>
      </main>
    </div>
  );
});

AppShell.displayName = "AppShell";
