import React, { useState, memo, useCallback, useMemo } from "react";
import {
  Microscope,
  ClipboardList,
  FlaskConical,
  Plus,
  Activity,
  LayoutDashboard,
  RefreshCw
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { LabPanel } from "../../../shared/components/LabPanel";
import { LabButton } from "../../../shared/components/LabButton";
import { SampleQueue } from "./SampleQueue";
import { SampleDetails } from "./SampleDetails";
import { LabBench } from "./LabBench";
import { RegisterSampleModal } from "./RegisterSampleModal";
import { useLabSamples } from "../hooks/useLabSamples"; // ← live hook
import { type Sample, type SampleStatus } from "../../../core/types";
import { ZentharKernelBoundary as ErrorBoundary } from "../../../shared/components/ErrorBoundary";
import { QCStatsWidget } from "../../dashboard/widget/QCStatsWidget";
import { PriorityWidget } from "../../dashboard/widget/PriorityWidget";

export const LabFeature: React.FC = memo(() => {
  const { samples, loading, error, refresh, lastUpdated, isRefreshing } = useLabSamples();

  const [selectedSampleId, setSelectedSampleId] = useState<number | undefined>(undefined);
  const [viewMode, setViewMode] = useState<"queue" | "details" | "bench">("queue");
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  const selectedSample = useMemo(
    () => samples?.find((s) => s.id === selectedSampleId) || undefined,
    [samples, selectedSampleId],
  );

  const activeCount = useMemo(
    () => samples?.filter((s) => s.status === ("TESTING" as SampleStatus)).length || 0,
    [samples],
  );

  const handleSampleSelect = useCallback((sample: Sample) => {
    setSelectedSampleId(sample.id);
    setViewMode("details");
  }, []);

  const handleBackToQueue = useCallback(() => {
    setSelectedSampleId(undefined);
    setViewMode("queue");
  }, []);

  return (
    <div className="flex h-full flex-col gap-6 overflow-hidden rounded-3xl bg-(--color-zenthar-graphite)/30 p-2">
      {/* Header */}
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 px-4">
        <div>
          <h2 className="font-display flex items-center gap-2 text-xl font-bold text-(--color-zenthar-text-primary) md:text-2xl">
            <LayoutDashboard className="text-brand-primary h-6 w-6" />
            Facility Hub
          </h2>
          <div className="mt-0.5 flex items-center gap-3">
            <p className="text-brand-sage font-mono text-[10px] tracking-widest uppercase">
              Real-time lab queue
            </p>
            {isRefreshing && (
              <span className="text-brand-primary flex items-center gap-1 text-[9px] font-bold uppercase">
                <RefreshCw size={9} className="animate-spin" /> Syncing
              </span>
            )}
            {lastUpdated && !isRefreshing && (
              <span className="text-brand-sage/40 font-mono text-[9px]">
                Updated {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="border-brand-sage/10 flex items-center gap-4 rounded-2xl border bg-(--color-zenthar-graphite)/60 px-5 py-2 shadow-sm backdrop-blur-md">
            <StatItem icon={Activity} label="Testing" value={activeCount} color="text-emerald-400" />
            <div className="bg-brand-sage/20 h-4 w-px" />
            <StatItem
              icon={FlaskConical}
              label="Queue"
              value={samples?.length || 0}
              color="text-brand-primary"
            />
          </div>
          <LabButton variant="primary" icon={Plus} onClick={() => setIsRegisterModalOpen(true)}>
            Register Sample
          </LabButton>
        </div>
      </div>

      {/* Workspace grid */}
      <div className="grid flex-1 grid-cols-12 gap-6 overflow-hidden">
        {/* Queue */}
        <div className="col-span-12 flex h-full flex-col gap-4 overflow-hidden lg:col-span-5 xl:col-span-4">
          <LabPanel
            title="Processing Queue"
            icon={ClipboardList}
            loading={loading}
            error={error}
            onRefresh={refresh}
            contentClassName="overflow-hidden p-0"
          >
            <SampleQueue
              samples={samples ?? []}
              selectedSampleId={selectedSampleId}
              onSampleSelect={handleSampleSelect}
            />
          </LabPanel>
        </div>

        {/* Workspace */}
        <div className="col-span-12 flex h-full flex-col overflow-hidden lg:col-span-7 xl:col-span-8">
          <AnimatePresence mode="wait">
            {!selectedSample ? (
              <EmptyWorkspace key="empty" samples={samples ?? []} />
            ) : viewMode === "details" ? (
              <WorkspaceTransition key="details">
                <ErrorBoundary name="Sample Details">
                  <SampleDetails
                    sample={selectedSample}
                    onBack={handleBackToQueue}
                    onStartTesting={() => setViewMode("bench")}
                    onUpdate={refresh}
                    onSelectSample={setSelectedSampleId}
                  />
                </ErrorBoundary>
              </WorkspaceTransition>
            ) : (
              <WorkspaceTransition key="bench">
                <ErrorBoundary name="Lab Bench">
                  <LabBench
                    sample={selectedSample}
                    onComplete={() => {
                      refresh();
                      handleBackToQueue();
                    }}
                  />
                </ErrorBoundary>
              </WorkspaceTransition>
            )}
          </AnimatePresence>
        </div>
      </div>

      <RegisterSampleModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        onSuccess={refresh}
      />
    </div>
  );
});

// ─────────────────────────────────────────────
// Micro-components
// ─────────────────────────────────────────────

const WorkspaceTransition: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.99, y: 10 }}
    animate={{ opacity: 1, scale: 1, y: 0 }}
    exit={{ opacity: 0, scale: 0.99, y: -10 }}
    transition={{ duration: 0.22, ease: "easeOut" }}
    className="h-full"
  >
    {children}
  </motion.div>
);

const StatItem = ({ icon: Icon, label, value, color }: any) => (
  <div className="flex items-center gap-2">
    <Icon size={14} className={color} />
    <div className="flex flex-col">
      <span className="text-brand-sage/60 text-[8px] leading-none font-black tracking-widest uppercase">
        {label}
      </span>
      <span className="mt-0.5 text-sm leading-tight font-black text-(--color-zenthar-text-primary)">
        {String(value).padStart(2, "0")}
      </span>
    </div>
  </div>
);

const EmptyWorkspace = ({ samples }: { samples: Sample[] }) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex h-full flex-col gap-6">
    <div className="grid flex-1 grid-cols-1 gap-6 md:grid-cols-2">
      <LabPanel title="Quality Distribution" icon={Activity}>
        <QCStatsWidget samples={samples} />
      </LabPanel>
      <LabPanel title="Urgency Heatmap" icon={Activity}>
        <PriorityWidget samples={samples} />
      </LabPanel>
    </div>
    <div className="border-brand-sage/10 flex flex-col items-center justify-center rounded-[2.5rem] border-2 border-dashed bg-(--color-zenthar-graphite)/30 p-8">
      <div className="relative">
        <div className="bg-brand-primary/5 absolute inset-0 animate-pulse rounded-full blur-3xl" />
        <div className="border-brand-sage/5 relative rounded-full border bg-(--color-zenthar-carbon) p-8">
          <Microscope size={36} className="text-brand-primary/20" />
        </div>
      </div>
      <div className="mt-5 max-w-sm text-center">
        <h2 className="font-display text-xl font-bold text-(--color-zenthar-text-primary)">Workspace Idle</h2>
        <p className="text-brand-sage mt-2 text-sm leading-relaxed">
          Select a sample from the processing queue to begin analysis.
        </p>
      </div>
    </div>
  </motion.div>
);

LabFeature.displayName = "LabFeature";
