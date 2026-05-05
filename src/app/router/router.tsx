import React, { Suspense, lazy, useMemo, useEffect } from "react";
import { ShieldAlert, Loader2, Lock, Fingerprint } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppStore, type AppTab } from "../../orchestrator/state/app.store";
import { useAuthStore } from "../../orchestrator/state/auth.store";
import { isTabAllowed } from "../../core/rbac";
import { ZentharKernelBoundary as GlobalErrorBoundary } from "../../shared/components/ErrorBoundary";

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
      import("../../capsules/stat");
    }

    // Example: Always pre-fetch Analytics if the user is a manager
    if (currentUser?.role === "HEAD_MANAGER") {
      import("../../capsules/analytics");
      import("../../capsules/workflows");
      import("../../capsules/audit");
    }

    // Example: Always pre-fetch Settings if the user is an admin
    if (currentUser?.role === "ADMIN") {
      import("../../capsules/settings");
      import("../../capsules/audit");
    }
  }, [currentUser]);

  if (!isAllowed) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="h-full w-full">
        <AccessDeniedView tab={activeTab} />
      </motion.div>
    );
  }

  const ActiveFeature = FEATURE_REGISTRY[activeTab] || FEATURE_REGISTRY.dashboard;

  return (
    <GlobalErrorBoundary key={activeTab}>
      <div className="relative h-full w-full overflow-hidden bg-(--color-zenthar-void)">
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
  <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-(--color-zenthar-graphite) to-(--color-zenthar-void) p-8">
    <div className="glass-panel relative flex w-full max-w-md flex-col items-center overflow-hidden p-12 text-center shadow-2xl">
      {/* Decorative Red Scanline */}
      <div className="absolute top-0 left-0 h-1 w-full animate-pulse bg-(--color-lab-laser) opacity-50" />

      <div className="mb-8 flex h-24 w-24 rotate-3 items-center justify-center rounded-3xl border border-(--color-lab-laser)/20 bg-(--color-lab-laser)/10">
        <div className="relative">
          <Lock className="h-10 w-10 text-(--color-lab-laser)" />
          <Fingerprint className="absolute -right-2 -bottom-2 h-6 w-6 text-(--color-lab-laser)/40" />
        </div>
      </div>

      <h2 className="mb-3 text-2xl font-black tracking-[0.2em] text-(--color-zenthar-text-primary) uppercase">
        Terminal Locked
      </h2>

      <div className="mb-8 rounded-full border border-(--color-lab-laser)/20 bg-(--color-lab-laser)/10 px-4 py-1.5">
        <span className="font-mono text-[10px] font-bold tracking-widest text-(--color-lab-laser) uppercase">
          ERR_ACCESS_RESTRICTED: {tab}
        </span>
      </div>

      <p className="text-[11px] leading-relaxed font-bold tracking-widest text-(--color-zenthar-text-muted) uppercase opacity-60">
        Authentication level insufficient for requested node. Please verify credentials with system oversight
        or QA leadership.
      </p>

      <div className="mt-10 flex items-center gap-2 text-[9px] font-black tracking-widest text-(--color-zenthar-text-muted) uppercase">
        <ShieldAlert size={12} />
        System ID: {Math.random().toString(36).substring(7).toUpperCase()}
      </div>
    </div>
  </div>
);

const FeatureLoader = () => (
  <div className="flex h-full w-full flex-col items-center justify-center gap-6">
    <div className="relative flex items-center justify-center">
      {/* Dynamic Pulse Rings */}
      <motion.div
        animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="border-brand-primary/30 absolute h-16 w-16 rounded-full border"
      />
      <div className="border-brand-sage/10 relative z-10 flex h-12 w-12 items-center justify-center rounded-2xl border bg-(--color-zenthar-void) shadow-xl">
        <Loader2 className="text-brand-primary h-6 w-6 animate-spin" />
      </div>
    </div>

    <div className="flex flex-col items-center">
      <p className="animate-pulse text-[10px] font-black tracking-[0.4em] text-(--color-zenthar-text-primary) uppercase">
        Initializing Module
      </p>
      <div className="mt-2 h-0.5 w-32 overflow-hidden rounded-full bg-(--color-zenthar-graphite)">
        <motion.div
          initial={{ x: "-100%" }}
          animate={{ x: "100%" }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          className="bg-brand-primary h-full w-1/2"
        />
      </div>
    </div>
  </div>
);

FeatureRouter.displayName = "FeatureRouter";
