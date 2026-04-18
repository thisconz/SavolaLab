import React, { memo } from "react";
import {
  ArrowLeft,
  Beaker,
  Save,
  Edit2,
  X,
  Hash,
  Layers,
  TestTube2,
  Clock,
  MapPin,
  Activity,
  Settings,
  Factory,
  Cpu,
  CheckCircle2,
  TrendingUp,
  Fingerprint,
  Zap,
} from "lucide-react";
import type { Sample } from "../../../core/types";
import { SampleStatus, TestStatus } from "../../../core/types";
import { LabPanel } from "../../../ui/components/LabPanel";
import { LabButton } from "../../../ui/components/LabButton";
import { useSampleDetails } from "../hooks/useSampleDetails";
import { motion, AnimatePresence } from "@/src/lib/motion";

interface SampleDetailsProps {
  sample: Sample;
  onBack: () => void;
  onStartTesting: () => void;
  onUpdate: () => void;
}

export const SampleDetails: React.FC<SampleDetailsProps> = memo(
  ({ sample, onBack, onStartTesting, onUpdate }) => {
    const {
      isEditing,
      setIsEditing,
      editedSample,
      setEditedSample,
      isSaving,
      testResults,
      handleSave,
    } = useSampleDetails(sample, onUpdate);

    const isStat = sample.priority === "STAT";
    const isCompleted = sample.status === SampleStatus.COMPLETED;

    return (
      <LabPanel
        title="Diagnostic_Telemetry"
        icon={Fingerprint}
        actions={
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-3 py-1.5 text-[10px] font-black uppercase text-brand-sage hover:text-(--color-zenthar-text-primary) bg-(--color-zenthar-carbon)/40 rounded-lg border border-brand-sage/10 transition-all"
          >
            <ArrowLeft size={14} /> Back_To_Queue
          </button>
        }
      >
        <div className="flex flex-col h-full space-y-6">
          {/* HERO: STATUS OVERVIEW */}
          <header
            className={`p-6 rounded-4xl border transition-all duration-500 shadow-xl ${
              isStat
                ? "bg-(--color-zenthar-carbon) border-lab-laser/30"
                : "bg-(--color-zenthar-carbon) border-brand-sage/10"
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-5">
                <div
                  className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg transition-all ${
                    isStat
                      ? "bg-lab-laser text-(--color-zenthar-void) animate-pulse"
                      : "bg-brand-primary text-(--color-zenthar-void)"
                  }`}
                >
                  <Beaker size={32} />
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-3xl font-black text-(--color-zenthar-text-primary) tracking-[ -0.05em] font-mono">
                      {sample.batch_id}
                    </h2>
                    {isStat && (
                      <span className="px-2 py-1 bg-lab-laser text-(--color-zenthar-void) text-[8px] font-black uppercase rounded flex items-center gap-1">
                        <Zap size={10} fill="currentColor" /> STAT
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-[10px] font-bold text-brand-sage uppercase tracking-widest">
                    <span className="flex items-center gap-1">
                      <MapPin size={12} className="text-brand-primary/40" />{" "}
                      {sample.source_stage}
                    </span>
                    <span className="w-1 h-1 bg-brand-sage/30 rounded-full" />
                    <span className="flex items-center gap-1">
                      <Clock size={12} className="text-brand-primary/40" />{" "}
                      {new Date(sample.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <p className="text-[9px] font-black text-brand-sage/40 uppercase tracking-[0.2em] mb-1">
                  Lifecycle_Phase
                </p>
                <div
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-[10px] font-black uppercase tracking-wider ${
                    isCompleted
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                      : "bg-brand-primary/10 border-brand-primary/20 text-brand-primary"
                  }`}
                >
                  {sample.status === SampleStatus.VALIDATING && (
                    <Activity size={12} className="animate-spin-slow" />
                  )}
                  {sample.status}
                </div>
              </div>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6 pr-2">
            {/* METADATA BENTO GRID */}
            <section>
              <div className="flex items-center gap-2 mb-4 px-1">
                <Settings size={14} className="text-brand-primary" />
                <h3 className="text-[10px] font-black text-(--color-zenthar-text-primary) uppercase tracking-[0.2em]">
                  Sample_Parameters
                </h3>
              </div>

              <div className="grid grid-cols-6 gap-3">
                <AnimatePresence mode="wait">
                  {isEditing ? (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="col-span-6 grid grid-cols-2 gap-3"
                    >
                      <EditField
                        icon={Hash}
                        label="Batch_ID"
                        value={editedSample.batch_id}
                        onChange={(v: string) =>
                          setEditedSample((p) => ({ ...p, batch_id: v }))
                        }
                      />
                      <div className="p-4 bg-(--color-zenthar-carbon)/50 border border-brand-primary/20 rounded-2xl">
                        <label className="text-[9px] font-black text-brand-primary uppercase mb-2 block tracking-widest">
                          Urgency_Tier
                        </label>
                        <select
                          className="w-full bg-transparent text-xs font-bold text-(--color-zenthar-text-primary) outline-none cursor-pointer"
                          value={editedSample.priority}
                          onChange={(e) =>
                            setEditedSample((p) => ({
                              ...p,
                              priority: e.target.value as any,
                            }))
                          }
                        >
                          <option value="NORMAL" className="bg-(--color-zenthar-carbon)">Normal_Priority</option>
                          <option value="HIGH" className="bg-(--color-zenthar-carbon)">High_Priority</option>
                          <option value="STAT" className="bg-(--color-zenthar-carbon)">Stat_Urgent</option>
                        </select>
                      </div>
                    </motion.div>
                  ) : (
                    <>
                      <DetailTile
                        className="col-span-3"
                        icon={Layers}
                        label="Sample_Type"
                        value={sample.sample_type}
                        highlight
                      />
                      <DetailTile
                        className="col-span-3"
                        icon={Factory}
                        label="Production_Line"
                        value={sample.line_id}
                      />
                      <DetailTile
                        className="col-span-2"
                        icon={Cpu}
                        label="Instrument_ID"
                        value={sample.equipment_id}
                      />
                      <DetailTile
                        className="col-span-4"
                        icon={TestTube2}
                        label="Test_Protocol"
                        value={`${sample.test_count} Standards Mapped`}
                      />
                    </>
                  )}
                </AnimatePresence>
              </div>
            </section>

            {/* LIVE INSTRUMENT READOUT */}
            <AnimatePresence>
              {testResults.length > 0 && !isEditing && (
                <motion.section
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-3"
                >
                  <div className="flex items-center gap-2 px-1">
                    <TrendingUp size={14} className="text-emerald-400" />
                    <h3 className="text-[10px] font-black text-(--color-zenthar-text-primary) uppercase tracking-[0.2em]">
                      Instrument_Readout
                    </h3>
                  </div>
                  <div className="grid gap-2">
                    {testResults.map((result) => (
                      <div
                        key={result.id}
                        className="flex items-center justify-between p-4 bg-(--color-zenthar-carbon) border border-brand-sage/10 rounded-2xl hover:border-brand-primary/40 transition-all shadow-sm"
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center ${result.status === TestStatus.COMPLETED ? "bg-emerald-500/10 text-emerald-400" : "bg-brand-primary/10 text-brand-primary"}`}
                          >
                            {result.status === TestStatus.COMPLETED ? (
                              <CheckCircle2 size={18} />
                            ) : (
                              <Activity size={18} className="animate-pulse" />
                            )}
                          </div>
                          <div>
                            <div className="text-[11px] font-black text-(--color-zenthar-text-primary) uppercase tracking-tight">
                              {result.test_type}
                            </div>
                            <div className="text-[8px] font-bold text-brand-sage tracking-[0.2em] uppercase">
                              {result.status}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xl font-mono font-black text-(--color-zenthar-text-primary)">
                            {result.calculated_value || "---"}
                          </span>
                          <span className="text-[9px] font-bold text-brand-sage/60 ml-1 uppercase">
                            {result.unit}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.section>
              )}
            </AnimatePresence>
          </div>

          {/* ACTION BAR */}
          <footer className="pt-6 border-t border-brand-sage/10 flex gap-3">
            {isEditing ? (
              <>
                <LabButton
                  variant="secondary"
                  onClick={() => setIsEditing(false)}
                  icon={X}
                >
                  Abort_Changes
                </LabButton>
                <LabButton
                  variant="primary"
                  fullWidth
                  onClick={handleSave}
                  loading={isSaving}
                  icon={Save}
                >
                  Commit_To_Database
                </LabButton>
              </>
            ) : (
              <>
                <LabButton
                  variant="secondary"
                  onClick={() => setIsEditing(true)}
                  icon={Edit2}
                >
                  Parameter_Adjustment
                </LabButton>
                <LabButton
                  variant="primary"
                  fullWidth
                  onClick={onStartTesting}
                  disabled={isCompleted}
                  icon={TestTube2}
                  className={
                    !isCompleted ? "shadow-lg shadow-brand-primary/20" : ""
                  }
                >
                  {isCompleted ? "Protocol_Archived" : "Execute_Lab_Run"}
                </LabButton>
              </>
            )}
          </footer>
        </div>
      </LabPanel>
    );
  },
);

/* --- Atomic Components --- */

const DetailTile = ({
  icon: Icon,
  label,
  value,
  highlight,
  className,
}: any) => (
  <div
    className={`p-4 rounded-2xl border transition-all ${className} ${
      highlight
        ? "bg-brand-primary/10 border-brand-primary/20"
        : "bg-(--color-zenthar-carbon) border-brand-sage/10"
    }`}
  >
    <div
      className={`flex items-center gap-1.5 text-[8px] font-black uppercase tracking-widest mb-1 ${highlight ? "text-brand-primary" : "text-brand-sage"}`}
    >
      <Icon size={10} /> {label}
    </div>
    <div className="text-xs font-black text-(--color-zenthar-text-primary) uppercase truncate font-mono">
      {value || "N/A"}
    </div>
  </div>
);

const EditField = ({ icon: Icon, label, value, onChange }: any) => (
  <div className="p-4 bg-(--color-zenthar-carbon) border-2 border-brand-primary/10 rounded-2xl focus-within:border-brand-primary transition-all shadow-inner">
    <label className="flex items-center gap-1.5 text-[9px] font-black text-brand-primary uppercase mb-1 tracking-widest">
      <Icon size={10} /> {label}
    </label>
    <input
      className="w-full bg-transparent text-xs font-bold text-(--color-zenthar-text-primary) outline-none"
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      autoFocus
    />
  </div>
);

SampleDetails.displayName = "SampleDetails";
