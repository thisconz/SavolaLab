import React, { useState, memo, useCallback, useMemo } from "react";
import {
  Microscope, ClipboardList, FlaskConical, Plus,
  Activity, LayoutDashboard, RefreshCw, Wifi,
} from "lucide-react";
import { motion, AnimatePresence }   from "@/src/lib/motion";
import { LabPanel }                  from "../../../ui/components/LabPanel";
import { LabButton }                 from "../../../ui/components/LabButton";
import { SampleQueue }               from "./SampleQueue";
import { SampleDetails }             from "./SampleDetails";
import { LabBench }                  from "./LabBench";
import { RegisterSampleModal }       from "./RegisterSampleModal";
import { useLabSamples }             from "../hooks/useLabSamples";   // ← live hook
import { Sample, SampleStatus }      from "../../../core/types";
import { ErrorBoundary }             from "../../../ui/components/ErrorBoundary";
import { QCStatsWidget }             from "../../dashboard/ui/QCStatsWidget";
import { PriorityWidget }            from "../../dashboard/ui/PriorityWidget";
import clsx from "@/src/lib/clsx";

export const LabFeature: React.FC = memo(() => {
  const { samples, loading, error, refresh, lastUpdated, isRefreshing } = useLabSamples();

  const [selectedSampleId,    setSelectedSampleId]    = useState<number | null>(null);
  const [viewMode,            setViewMode]            = useState<"queue" | "details" | "bench">("queue");
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  const selectedSample = useMemo(
    () => samples?.find((s) => s.id === selectedSampleId) || null,
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
    setSelectedSampleId(null);
    setViewMode("queue");
  }, []);

  return (
    <div className="h-full flex flex-col gap-6 overflow-hidden bg-(--color-zenthar-graphite)/30 p-2 rounded-3xl">
      {/* Header */}
      <div className="flex items-center justify-between px-4 shrink-0 flex-wrap gap-3">
        <div>
          <h2 className="text-xl md:text-2xl font-display font-bold text-(--color-zenthar-text-primary) flex items-center gap-2">
            <LayoutDashboard className="w-6 h-6 text-brand-primary" />
            Facility Hub
          </h2>
          <div className="flex items-center gap-3 mt-0.5">
            <p className="text-[10px] font-mono text-brand-sage uppercase tracking-widest">
              Real-time lab queue
            </p>
            {isRefreshing && (
              <span className="flex items-center gap-1 text-[9px] font-bold text-brand-primary uppercase">
                <RefreshCw size={9} className="animate-spin" /> Syncing
              </span>
            )}
            {lastUpdated && !isRefreshing && (
              <span className="text-[9px] font-mono text-brand-sage/40">
                Updated {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>

        <div className="flex gap-3 flex-wrap items-center">
          <div className="flex items-center gap-4 bg-(--color-zenthar-graphite)/60 backdrop-blur-md border border-brand-sage/10 px-5 py-2 rounded-2xl shadow-sm">
            <StatItem icon={Activity}    label="Testing"  value={activeCount}          color="text-emerald-400" />
            <div className="w-px h-4 bg-brand-sage/20" />
            <StatItem icon={FlaskConical} label="Queue"   value={samples?.length || 0} color="text-brand-primary" />
          </div>
          <LabButton variant="primary" icon={Plus} onClick={() => setIsRegisterModalOpen(true)}>
            Register Sample
          </LabButton>
        </div>
      </div>

      {/* Workspace grid */}
      <div className="flex-1 overflow-hidden grid grid-cols-12 gap-6">
        {/* Queue */}
        <div className="col-span-12 lg:col-span-5 xl:col-span-4 flex flex-col gap-4 overflow-hidden h-full">
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
        <div className="col-span-12 lg:col-span-7 xl:col-span-8 flex flex-col overflow-hidden h-full">
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
                  />
                </ErrorBoundary>
              </WorkspaceTransition>
            ) : (
              <WorkspaceTransition key="bench">
                <ErrorBoundary name="Lab Bench">
                  <LabBench
                    sample={selectedSample}
                    onComplete={() => { refresh(); handleBackToQueue(); }}
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
    animate={{ opacity: 1, scale: 1,    y: 0  }}
    exit={   { opacity: 0, scale: 0.99, y: -10 }}
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
      <span className="text-[8px] font-black uppercase text-brand-sage/60 tracking-widest leading-none">{label}</span>
      <span className="text-sm font-black text-(--color-zenthar-text-primary) leading-tight mt-0.5">{String(value).padStart(2, "0")}</span>
    </div>
  </div>
);

const EmptyWorkspace = ({ samples }: { samples: Sample[] }) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col gap-6">
    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
      <LabPanel title="Quality Distribution" icon={Activity}><QCStatsWidget samples={samples} /></LabPanel>
      <LabPanel title="Urgency Heatmap"      icon={Activity}><PriorityWidget samples={samples} /></LabPanel>
    </div>
    <div className="flex flex-col items-center justify-center p-8 bg-(--color-zenthar-graphite)/30 rounded-[2.5rem] border-2 border-dashed border-brand-sage/10">
      <div className="relative">
        <div className="absolute inset-0 bg-brand-primary/5 rounded-full blur-3xl animate-pulse" />
        <div className="relative p-8 bg-(--color-zenthar-carbon) rounded-full border border-brand-sage/5">
          <Microscope size={36} className="text-brand-primary/20" />
        </div>
      </div>
      <div className="text-center max-w-sm mt-5">
        <h2 className="text-xl font-display font-bold text-(--color-zenthar-text-primary)">Workspace Idle</h2>
        <p className="text-brand-sage text-sm mt-2 leading-relaxed">Select a sample from the processing queue to begin analysis.</p>
      </div>
    </div>
  </motion.div>
);

LabFeature.displayName = "LabFeature";