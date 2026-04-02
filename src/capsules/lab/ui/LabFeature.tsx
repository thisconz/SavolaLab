import React, { useState, memo, useCallback } from "react";
import { Microscope, ClipboardList, FlaskConical, Plus } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { LabPanel } from "../../../ui/components/LabPanel";
import { LabButton } from "../../../ui/components/LabButton";
import { SampleQueue } from "./SampleQueue";
import { SampleDetails } from "./SampleDetails";
import { LabBench } from "./LabBench";
import { RegisterSampleModal } from "./RegisterSampleModal";
import { useLabSamples } from "../hooks/useLabSamples";
import { Sample } from "../../../core/types";
import { ErrorBoundary } from "../../../ui/components/ErrorBoundary";

/**
 * LabFeature Component
 * 
 * The main entry point for the laboratory module. It orchestrates the primary
 * workflows for lab technicians, including sample registration, queue management,
 * and test execution.
 * 
 * Architecture:
 * - Manages the high-level state for the selected sample and current view mode.
 * - Composes three main sub-components:
 *   1. SampleQueue: For finding and selecting samples.
 *   2. SampleDetails: For reviewing sample metadata before testing.
 *   3. LabBench: For the actual execution and recording of test results.
 * - Integrates with `useLabSamples` for data fetching and state management.
 */
export const LabFeature: React.FC = memo(() => {
  const { samples, loading, error, refresh } = useLabSamples();
  const [selectedSample, setSelectedSample] = useState<Sample | null>(null);
  const [viewMode, setViewMode] = useState<"queue" | "details" | "bench">(
    "queue",
  );
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  const handleSampleSelect = useCallback((sample: Sample) => {
    setSelectedSample(sample);
    setViewMode("details");
  }, []);

  const handleRegisterSuccess = useCallback(() => {
    refresh();
  }, [refresh]);

  return (
    <div className="flex flex-col h-full overflow-hidden bg-brand-mist/20 p-2 rounded-3xl">
      <div className="flex-1 overflow-hidden grid grid-cols-12 gap-6 p-2">
        {/* Sample Queue Column */}
        <div className="col-span-4 flex flex-col gap-6 overflow-hidden h-full">
          <LabPanel
            title="Sample Queue"
            icon={ClipboardList}
            loading={loading}
            error={error}
            onRefresh={refresh}
            contentClassName="overflow-hidden p-0"
            actions={
              <LabButton icon={Plus} onClick={() => setIsRegisterModalOpen(true)}>
                Register
              </LabButton>
            }
          >
            <SampleQueue
              samples={samples ?? []}
              selectedSampleId={selectedSample?.id}
              onSampleSelect={handleSampleSelect}
            />
          </LabPanel>
        </div>

        {/* Workspace Column */}
        <div className="col-span-8 flex flex-col gap-6 overflow-hidden h-full">
          <AnimatePresence mode="wait">
            {viewMode === "details" && selectedSample ? (
              <motion.div
                key="details"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="h-full"
              >
                <ErrorBoundary name="Sample Details">
                  <SampleDetails
                    sample={selectedSample}
                    onBack={() => setViewMode("queue")}
                    onStartTesting={() => setViewMode("bench")}
                    onUpdate={refresh}
                  />
                </ErrorBoundary>
              </motion.div>
            ) : viewMode === "bench" && selectedSample ? (
              <motion.div
                key="bench"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="h-full"
              >
                <ErrorBoundary name="Lab Bench">
                  <LabBench
                    sample={selectedSample}
                    onComplete={() => {
                      refresh();
                      setViewMode("queue");
                    }}
                  />
                </ErrorBoundary>
              </motion.div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-brand-sage gap-6 bg-white/50 rounded-3xl border border-brand-sage/10 relative overflow-hidden group">
                <div className="absolute inset-0 bg-brand-primary/5 rounded-full blur-3xl scale-150 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                <div className="p-6 bg-brand-mist rounded-full border border-brand-sage/20 relative z-10">
                  <FlaskConical className="w-16 h-16 opacity-40 text-brand-primary group-hover:opacity-80 transition-opacity duration-300" />
                </div>
                <p className="text-sm font-black text-brand-deep uppercase tracking-[0.2em] relative z-10">
                  Select a sample to begin testing
                </p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <RegisterSampleModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        onSuccess={handleRegisterSuccess}
      />
    </div>
  );
});

LabFeature.displayName = "LabFeature";
