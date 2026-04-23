import React, { Suspense, lazy, useMemo, useEffect } from "react";
import { ShieldAlert, Loader2, Lock, Fingerprint } from "lucide-react";
import { motion, AnimatePresence } from "@/src/lib/motion";
import { useAppStore, AppTab } from "../../orchestrator/state/app.store";
import { useAuthStore } from "../../orchestrator/state/auth.store";
import { isTabAllowed } from "../../core/rbac";
import { ErrorBoundary as GlobalErrorBoundary } from "../../shared/components/ErrorBoundary";

/**
 * Registry of Feature Modules
 * Using a map for O(1) lookup and cleaner scalability.
 */
const FEATURE_REGISTRY: Record<AppTab, React.LazyExoticComponent<React.FC>> = {
  dashboard: lazy(() => import("../../capsules/dashboard/ui/DashboardFeature")),
  lab: lazy(() => import("../../capsules/lab")),
  stat: lazy(() => import("../../capsules/stat/ui/StatFeature")),
  analytics: lazy(() => import("../../capsules/analytics/ui/AnalyticsFeature")),
  dispatch: lazy(() => import("../../capsules/dispatch/ui/DispatchFeature")),
  workflows: lazy(() => import("../../capsules/workflows/ui/WorkflowsFeature")),
  intelligence: lazy(() => import("../../capsules/intelligence/ui/IntelligenceFeature")),
  assets: lazy(() => import("../../capsules/assets/ui/AssetsFeature")),
  audit: lazy(() => import("../../capsules/audit/ui/AuditFeature")),
  settings: lazy(() => import("../../capsules/settings")),
  archive: lazy(() => import("../../capsules/archive")),
};

export const FeatureRouter: React.FC = () => {
  const { activeTab } = useAppStore();
  const { currentUser } = useAuthStore();

  // 1. Logic: RBAC verification
  const isAllowed = useMemo(() => {
    if (!currentUser) return activeTab === "dashboard";
    return isTabAllowed(currentUser.role, activeTab);
  }, [currentUser, activeTab]);

  // 2. Optimization: Pre-fetch critical modules
  useEffect(() => {
    // Example: Always pre-fetch Lab if the user is a chemist
    if (currentUser?.role === "CHEMIST") {
      import("../../capsules/lab");
    }
  }, [currentUser]);

  if (!isAllowed) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="h-full w-full"
      >
        <AccessDeniedView tab={activeTab} />
      </motion.div>
    );
  }

  const ActiveFeature = FEATURE_REGISTRY[activeTab] || FEATURE_REGISTRY.dashboard;

  return (
    <GlobalErrorBoundary key={activeTab}>
      <div className="h-full w-full relative overflow-hidden bg-(--color-zenthar-void)">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.3, ease: "circOut" }}
            className="h-full w-full"
          >
            <Suspense fallback={<FeatureLoader />}>
              <ActiveFeature />
            </Suspense>
          </motion.div>
        </AnimatePresence>
      </div>
    </GlobalErrorBoundary>
  );
};

/* --- Enhanced Sub-Components --- */

const AccessDeniedView: React.FC<{ tab: string }> = ({ tab }) => (
  <div className="h-full w-full flex items-center justify-center p-8 bg-linear-to-br from-(--color-zenthar-graphite) to-(--color-zenthar-void)">
    <div className="max-w-md w-full glass-panel p-12 shadow-2xl flex flex-col items-center text-center relative overflow-hidden">
      {/* Decorative Red Scanline */}
      <div className="absolute top-0 left-0 w-full h-1 bg-(--color-lab-laser) animate-pulse opacity-50" />

      <div className="w-24 h-24 bg-(--color-lab-laser)/10 rounded-3xl flex items-center justify-center mb-8 rotate-3 border border-(--color-lab-laser)/20">
        <div className="relative">
          <Lock className="w-10 h-10 text-(--color-lab-laser)" />
          <Fingerprint className="w-6 h-6 text-(--color-lab-laser)/40 absolute -bottom-2 -right-2" />
        </div>
      </div>

      <h2 className="text-2xl font-black text-(--color-zenthar-text-primary) uppercase tracking-[0.2em] mb-3">
        Terminal Locked
      </h2>

      <div className="px-4 py-1.5 bg-(--color-lab-laser)/10 border border-(--color-lab-laser)/20 rounded-full mb-8">
        <span className="text-[10px] font-mono text-(--color-lab-laser) font-bold uppercase tracking-widest">
          ERR_ACCESS_RESTRICTED: {tab}
        </span>
      </div>

      <p className="text-[11px] text-(--color-zenthar-text-muted) uppercase font-bold tracking-widest leading-relaxed opacity-60">
        Authentication level insufficient for requested node. Please verify credentials with system
        oversight or QA leadership.
      </p>

      <div className="mt-10 flex items-center gap-2 text-[9px] font-black text-(--color-zenthar-text-muted) uppercase tracking-widest">
        <ShieldAlert size={12} />
        System ID: {Math.random().toString(36).substring(7).toUpperCase()}
      </div>
    </div>
  </div>
);

const FeatureLoader = () => (
  <div className="h-full w-full flex flex-col items-center justify-center gap-6">
    <div className="relative flex items-center justify-center">
      {/* Dynamic Pulse Rings */}
      <motion.div
        animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute w-16 h-16 border border-brand-primary/30 rounded-full"
      />
      <div className="w-12 h-12 bg-(--color-zenthar-void) rounded-2xl shadow-xl flex items-center justify-center border border-brand-sage/10 relative z-10">
        <Loader2 className="w-6 h-6 text-brand-primary animate-spin" />
      </div>
    </div>

    <div className="flex flex-col items-center">
      <p className="text-[10px] font-black uppercase tracking-[0.4em] text-(--color-zenthar-text-primary) animate-pulse">
        Initializing Module
      </p>
      <div className="mt-2 h-0.5 w-32 bg-(--color-zenthar-graphite) rounded-full overflow-hidden">
        <motion.div
          initial={{ x: "-100%" }}
          animate={{ x: "100%" }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          className="h-full w-1/2 bg-brand-primary"
        />
      </div>
    </div>
  </div>
);

FeatureRouter.displayName = "FeatureRouter";
