import React, { Suspense, lazy } from "react";
import { useAppStore } from "../../orchestrator/state/app.store";
import { useAuthStore } from "../../orchestrator/state/auth.store";
import { isTabAllowed } from "../../core/rbac";
import { ErrorBoundary as GlobalErrorBoundary } from "../../ui/components/ErrorBoundary";
import { ShieldAlert } from "lucide-react";

// Lazy-loaded feature modules
const DashboardFeature = lazy(() => import("../../capsules/dashboard"));
const LabFeature = lazy(() => import("../../capsules/lab"));
const StatFeature = lazy(() => import("../../capsules/stat"));
const AnalyticsFeature = lazy(() => import("../../capsules/analytics"));
const DispatchFeature = lazy(() => import("../../capsules/dispatch"));
const WorkflowsFeature = lazy(() => import("../../capsules/workflows"));
const IntelligenceFeature = lazy(() => import("../../capsules/intelligence"));
const AssetsFeature = lazy(() => import("../../capsules/assets"));
const AuditFeature = lazy(() => import("../../capsules/audit"));
const SettingsFeature = lazy(() => import("../../capsules/settings"));
const ArchiveFeature = lazy(() => import("../../capsules/archive"));

/**
 * Feature Router: Handles conditional rendering of feature modules.
 * Uses React Suspense for lazy loading and fallback states.
 */
export const FeatureRouter: React.FC = () => {
  const { activeTab } = useAppStore();
  const { currentUser } = useAuthStore();

  // RBAC Check
  const isAllowed = currentUser
    ? isTabAllowed(currentUser.role, activeTab)
    : activeTab === "dashboard";

  if (!isAllowed) {
    return <AccessDeniedView tab={activeTab} />;
  }

  const renderFeature = () => {
    switch (activeTab) {
      case "dashboard":
        return <DashboardFeature />;
      case "lab":
        return <LabFeature />;
      case "stat":
        return <StatFeature />;
      case "analytics":
        return <AnalyticsFeature />;
      case "dispatch":
        return <DispatchFeature />;
      case "workflows":
        return <WorkflowsFeature />;
      case "intelligence":
        return <IntelligenceFeature />;
      case "assets":
        return <AssetsFeature />;
      case "audit":
        return <AuditFeature />;
      case "settings":
        return <SettingsFeature />;
      case "archive":
        return <ArchiveFeature />;
      default:
        return <DashboardFeature />;
    }
  };

  return (
    <GlobalErrorBoundary key={activeTab}>
      <Suspense fallback={<FeatureLoader />}>{renderFeature()}</Suspense>
    </GlobalErrorBoundary>
  );
};

const AccessDeniedView: React.FC<{ tab: string }> = ({ tab }) => (
  <div className="h-full w-full flex items-center justify-center p-8">
    <div className="max-w-md w-full bg-white rounded-3xl p-12 shadow-2xl border border-lab-laser/10 flex flex-col items-center text-center">
      <div className="w-20 h-20 bg-lab-laser/10 rounded-full flex items-center justify-center mb-6">
        <ShieldAlert className="w-10 h-10 text-lab-laser" />
      </div>
      <h2 className="text-2xl font-black text-brand-deep uppercase tracking-widest mb-2">
        Access Restricted
      </h2>
      <p className="text-brand-sage font-mono text-xs uppercase mb-8">
        Your current role does not have permission to access the{" "}
        <span className="text-lab-laser font-bold">{tab}</span> module.
      </p>
      <div className="w-full h-1px bg-brand-sage/10 mb-8" />
      <p className="text-[10px] text-brand-sage uppercase tracking-tighter leading-relaxed">
        If you believe this is an error, please contact your system
        administrator or the Quality Assurance department.
      </p>
    </div>
  </div>
);

const FeatureLoader = () => (
  <div className="h-full w-full flex items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 border-4 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin" />
      <p className="text-[10px] font-mono uppercase tracking-widest text-brand-sage">
        Loading Feature Module...
      </p>
    </div>
  </div>
);
