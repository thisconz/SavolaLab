import React, { useState, memo, useCallback, useMemo } from "react";
import { 
  Microscope, 
  ClipboardList, 
  FlaskConical, 
  Plus, 
  Activity, 
  LayoutDashboard 
} from "lucide-react";
import { motion, AnimatePresence } from "@/src/lib/motion";
import { LabPanel } from "../../../ui/components/LabPanel";
import { LabButton } from "../../../ui/components/LabButton";
import { SampleQueue } from "./SampleQueue";
import { SampleDetails } from "./SampleDetails";
import { LabBench } from "./LabBench";
import { RegisterSampleModal } from "./RegisterSampleModal";
import { useLabSamples } from "../hooks/useLabSamples";
import { Sample, SampleStatus } from "../../../core/types"; // Ensure SampleStatus is imported
import { ErrorBoundary } from "../../../ui/components/ErrorBoundary";

export const LabFeature: React.FC = memo(() => {
  const { samples, loading, error, refresh } = useLabSamples();
  
  // FIX 1 & 3: Changed state type to number | null to match Sample.id (Error 2367 & 2345)
  const [selectedSampleId, setSelectedSampleId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<"queue" | "details" | "bench">("queue");
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  const selectedSample = useMemo(
    () => samples?.find((s) => s.id === selectedSampleId) || null,
    [samples, selectedSampleId]
  );

  const activeCount = useMemo(
    // FIX 2: Use the SampleStatus enum/type instead of raw string if applicable (Error 2367)
    // Adjust 'SampleStatus.IN_PROGRESS' to match your actual core/types definition
    () => samples?.filter(s => s.status === "in_progress" as SampleStatus).length || 0,
    [samples]
  );

  const handleSampleSelect = useCallback((sample: Sample) => {
    // FIX: Passing number to number state
    setSelectedSampleId(sample.id);
    setViewMode("details");
  }, []);

  const handleBackToQueue = useCallback(() => {
    setSelectedSampleId(null);
    setViewMode("queue");
  }, []);

  return (
    <div className="flex flex-col h-full overflow-hidden bg-brand-mist/5 p-4 gap-4">
      <header className="flex items-center justify-between px-2">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-brand-primary text-white rounded-xl shadow-lg shadow-brand-primary/20">
            <LayoutDashboard size={20} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-brand-deep tracking-tight">Labrix Operator</h1>
            <p className="text-xs text-brand-sage font-medium uppercase tracking-wider">Savola Facility Hub</p>
          </div>
        </div>
        
        <div className="flex gap-4">
          <div className="flex items-center gap-4 bg-white/50 border border-brand-sage/10 px-4 py-2 rounded-2xl">
            <StatItem icon={Activity} label="Active" value={activeCount} color="text-emerald-500" />
            <div className="w-px h-6 bg-brand-sage/20" />
            <StatItem icon={FlaskConical} label="Queue" value={samples?.length || 0} color="text-brand-primary" />
          </div>
          <LabButton 
            variant="primary" 
            icon={Plus} 
            onClick={() => setIsRegisterModalOpen(true)}
          >
            Register Sample
          </LabButton>
        </div>
      </header>

      <div className="flex-1 overflow-hidden grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-4 xl:col-span-3 flex flex-col gap-4 overflow-hidden h-full">
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
              // FIX 4: selectedSampleId is now correctly passed as number (Error 2322)
              selectedSampleId={selectedSampleId} 
              onSampleSelect={handleSampleSelect}
            />
          </LabPanel>
        </div>

        <div className="col-span-12 lg:col-span-8 xl:col-span-9 flex flex-col overflow-hidden h-full">
          <AnimatePresence mode="wait">
            {!selectedSample ? (
              <EmptyWorkspace key="empty" />
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

/* Sub-components remain the same but ensure props are typed correctly */
const WorkspaceTransition: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.98, y: 10 }}
    animate={{ opacity: 1, scale: 1, y: 0 }}
    exit={{ opacity: 0, scale: 0.98, y: -10 }}
    transition={{ duration: 0.2 }}
    className="h-full"
  >
    {children}
  </motion.div>
);

const StatItem = ({ icon: Icon, label, value, color }: any) => (
  <div className="flex items-center gap-2">
    <Icon size={14} className={color} />
    <span className="text-[10px] font-black uppercase text-brand-sage tracking-tighter">{label}</span>
    <span className="text-sm font-bold text-brand-deep leading-none">{value}</span>
  </div>
);

const EmptyWorkspace = () => (
  <motion.div 
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="h-full flex flex-col items-center justify-center gap-6 bg-white/40 rounded-[2.5rem] border-2 border-dashed border-brand-sage/10"
  >
    <div className="relative">
      <div className="absolute inset-0 bg-brand-primary/10 rounded-full blur-3xl animate-pulse" />
      <div className="relative p-10 bg-white rounded-full border border-brand-sage/10 shadow-sm">
        <Microscope size={48} className="text-brand-primary/30" />
      </div>
    </div>
    <div className="text-center">
      <h2 className="text-xl font-bold text-brand-deep">Workspace Idle</h2>
      <p className="text-brand-sage text-sm mt-1">Select a sample from the queue to start analysis.</p>
    </div>
  </motion.div>
);

LabFeature.displayName = "LabFeature";