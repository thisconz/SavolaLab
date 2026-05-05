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
  RotateCcw,
  User,
  Zap,
} from "lucide-react";
import type { Sample } from "../../../core/types";
import { SampleStatus, TestStatus } from "../../../core/types";
import { LabPanel } from "../../../shared/components/LabPanel";
import { LabButton } from "../../../shared/components/LabButton";
import { useSampleDetails } from "../hooks/useSampleDetails";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { LabApi } from "../api/lab.api";

interface SampleDetailsProps {
  sample: Sample;
  onBack: () => void;
  onStartTesting: () => void;
  onUpdate: () => void;
  onSelectSample?: (id: number) => void;
}

export const SampleDetails: React.FC<SampleDetailsProps> = memo(
  ({ sample, onBack, onStartTesting, onUpdate, onSelectSample }) => {
    const { isEditing, setIsEditing, editedSample, setEditedSample, isSaving, testResults, handleSave } =
      useSampleDetails(sample, onUpdate);

    const [isRegenerating, setIsRegenerating] = React.useState(false);

    const handleRegenerate = async () => {
      if (!window.confirm("This will create a new re-test sample (suffixed with -R). Proceed?")) return;
      setIsRegenerating(true);
      try {
        const res = await LabApi.regenerateSample(sample.id);
        toast.success("Sample regenerated successfully.");
        if (onSelectSample) onSelectSample(res.id);
        onUpdate();
      } catch (err) {
        toast.error("Failed to regenerate sample.");
      } finally {
        setIsRegenerating(false);
      }
    };

    const isStat = sample.priority === "STAT";
    const isCompleted = sample.status === SampleStatus.COMPLETED || sample.status === SampleStatus.APPROVED;

    return (
      <LabPanel
        title="Diagnostic_Telemetry"
        icon={Fingerprint}
        actions={
          <button
            onClick={onBack}
            className="text-brand-sage border-brand-sage/10 flex items-center gap-2 rounded-lg border bg-(--color-zenthar-carbon)/40 px-3 py-1.5 text-[10px] font-black uppercase transition-all hover:text-(--color-zenthar-text-primary)"
          >
            <ArrowLeft size={14} /> Back
          </button>
        }
      >
        <div className="flex h-full flex-col space-y-6">
          {/* Hero status card */}
          <header
            className={`rounded-4xl border p-6 shadow-xl transition-all duration-500 ${
              isStat
                ? "border-lab-laser/30 bg-(--color-zenthar-carbon)"
                : "border-brand-sage/10 bg-(--color-zenthar-carbon)"
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-5">
                <div
                  className={`flex h-16 w-16 items-center justify-center rounded-2xl shadow-lg ${
                    isStat
                      ? "bg-lab-laser animate-pulse text-(--color-zenthar-void)"
                      : "bg-brand-primary text-(--color-zenthar-void)"
                  }`}
                >
                  <Beaker size={32} />
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="font-mono text-3xl font-black tracking-tight text-(--color-zenthar-text-primary)">
                      {sample.batch_id ?? `Sample #${sample.id}`}
                    </h2>
                    {isStat && (
                      <span className="bg-lab-laser flex items-center gap-1 rounded px-2 py-1 text-[8px] font-black text-(--color-zenthar-void) uppercase">
                        <Zap size={10} fill="currentColor" /> STAT
                      </span>
                    )}
                  </div>
                  <div className="text-brand-sage mt-2 flex items-center gap-3 text-[10px] font-bold tracking-widest uppercase">
                    <span className="flex items-center gap-1">
                      <MapPin size={12} className="text-brand-primary/40" />
                      {sample.source_stage ?? "—"}
                    </span>
                    <span className="bg-brand-sage/30 h-1 w-1 rounded-full" />
                    <span className="flex items-center gap-1">
                      <Clock size={12} className="text-brand-primary/40" />
                      {new Date(sample.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <p className="text-brand-sage/40 mb-1 text-[9px] font-black tracking-[0.2em] uppercase">
                  Status
                </p>
                <div
                  className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-[10px] font-black tracking-wider uppercase ${
                    isCompleted
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                      : "bg-brand-primary/10 border-brand-primary/20 text-brand-primary"
                  }`}
                >
                  {(sample.status === SampleStatus.VALIDATING || sample.status === SampleStatus.TESTING) && (
                    <Activity size={12} className="animate-spin-slow" />
                  )}
                  {sample.status}
                </div>
              </div>
            </div>
          </header>

          <div className="custom-scrollbar flex-1 space-y-6 overflow-y-auto pr-2">
            {/* Parameter bento grid */}
            <section>
              <div className="mb-4 flex items-center gap-2 px-1">
                <Settings size={14} className="text-brand-primary" />
                <h3 className="text-[10px] font-black tracking-[0.2em] text-(--color-zenthar-text-primary) uppercase">
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
                        onChange={(v: string) => setEditedSample((p) => ({ ...p, batch_id: v }))}
                      />
                      <div className="border-brand-primary/20 rounded-2xl border bg-(--color-zenthar-carbon)/50 p-4">
                        <label className="text-brand-primary mb-2 block text-[9px] font-black tracking-widest uppercase">
                          Priority
                        </label>
                        <select
                          className="w-full cursor-pointer bg-transparent text-xs font-bold text-(--color-zenthar-text-primary) outline-none"
                          value={editedSample.priority}
                          onChange={(e) =>
                            setEditedSample((p) => ({
                              ...p,
                              priority: e.target.value as any,
                            }))
                          }
                        >
                          <option value="NORMAL">Normal</option>
                          <option value="HIGH">High</option>
                          <option value="STAT">STAT</option>
                        </select>
                      </div>
                      <EditField
                        icon={TestTube2}
                        label="Sample_Type"
                        value={editedSample.sample_type}
                        onChange={(v: string) => setEditedSample((p) => {
                          return ({ ...p, sample_type: v });
                        })}
                      />
                      <EditField
                        icon={Layers}
                        label="Source_Stage"
                        value={editedSample.source_stage}
                        onChange={(v: string) => setEditedSample((p) => ({ ...p, source_stage: v }))}
                      />
                      <EditField
                        icon={Factory}
                        label="Line_ID"
                        value={editedSample.line_id}
                        onChange={(v: string) => setEditedSample((p) => ({ ...p, line_id: v }))}
                      />
                      <EditField
                        icon={Cpu}
                        label="Equipment_ID"
                        value={editedSample.equipment_id}
                        onChange={(v: string) => setEditedSample((p) => ({ ...p, equipment_id: v }))}
                      />
                      <EditField
                        icon={Clock}
                        label="Shift_ID"
                        value={editedSample.shift_id}
                        onChange={(v: string) => setEditedSample((p) => ({ ...p, shift_id: v }))}
                      />
                      <EditField
                        icon={User}
                        label="Assignee_ID"
                        value={editedSample.technician_id}
                        onChange={(v: string) => setEditedSample((p) => ({ ...p, technician_id: v }))}
                      />
                    </motion.div>
                  ) : (
                    <>
                      <DetailTile
                        className="col-span-3"
                        icon={TestTube2}
                        label="Sample_Type"
                        value={sample.sample_type}
                        highlight
                      />
                      <DetailTile
                        className="col-span-3"
                        icon={Layers}
                        label="Source_Stage"
                        value={sample.source_stage}
                      />
                      <DetailTile
                        className="col-span-2"
                        icon={Factory}
                        label="Line"
                        value={sample.line_id ? `Line ${sample.line_id}` : undefined}
                      />
                      <DetailTile
                        className="col-span-2"
                        icon={Cpu}
                        label="Equipment"
                        value={sample.equipment_id ? `Eq. ${sample.equipment_id}` : undefined}
                      />
                      <DetailTile
                        className="col-span-2"
                        icon={User}
                        label="Assignee"
                        value={sample.technician_id ?? "Unassigned"}
                      />
                    </>
                  )}
                </AnimatePresence>
              </div>
            </section>

            {/* Live instrument readout */}
            <AnimatePresence>
              {testResults.length > 0 && !isEditing && (
                <motion.section
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-3"
                >
                  <div className="flex items-center gap-2 px-1">
                    <TrendingUp size={14} className="text-emerald-400" />
                    <h3 className="text-[10px] font-black tracking-[0.2em] text-(--color-zenthar-text-primary) uppercase">
                      Test_Results
                    </h3>
                  </div>
                  <div className="grid gap-2">
                    {testResults.map((result) => (
                      <div
                        key={result.id}
                        className="border-brand-sage/10 hover:border-brand-primary/40 flex items-center justify-between rounded-2xl border bg-(--color-zenthar-carbon) p-4 transition-all"
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                              result.status === TestStatus.APPROVED || result.status === TestStatus.COMPLETED
                                ? "bg-emerald-500/10 text-emerald-400"
                                : "bg-brand-primary/10 text-brand-primary"
                            }`}
                          >
                            {result.status === TestStatus.APPROVED ||
                            result.status === TestStatus.COMPLETED ? (
                              <CheckCircle2 size={18} />
                            ) : (
                              <Activity size={18} className="animate-pulse" />
                            )}
                          </div>
                          <div>
                            <div className="text-[11px] font-black tracking-tight text-(--color-zenthar-text-primary) uppercase">
                              {result.test_type}
                            </div>
                            <div className="text-brand-sage text-[8px] font-bold tracking-[0.2em] uppercase">
                              {result.status}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-mono text-xl font-black text-(--color-zenthar-text-primary)">
                            {result.calculated_value ?? result.raw_value ?? "—"}
                          </span>
                          <span className="text-brand-sage/60 ml-1 text-[9px] font-bold uppercase">
                            {result.unit ?? ""}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.section>
              )}
            </AnimatePresence>
          </div>

          {/* Action bar */}
          <footer className="border-brand-sage/10 flex gap-3 border-t pt-6">
            {isEditing ? (
              <>
                <LabButton variant="secondary" onClick={() => setIsEditing(false)} icon={X}>
                  Cancel
                </LabButton>
                <LabButton variant="primary" fullWidth onClick={handleSave} loading={isSaving} icon={Save}>
                  Save_Changes
                </LabButton>
              </>
            ) : (
              <>
                <LabButton
                  variant="secondary"
                  onClick={handleRegenerate}
                  loading={isRegenerating}
                  icon={RotateCcw}
                  title="Regenerate/Re-test Sample"
                >
                  Regen
                </LabButton>
                <LabButton variant="secondary" onClick={() => setIsEditing(true)} icon={Edit2}>
                  Edit
                </LabButton>
                <LabButton
                  variant="primary"
                  fullWidth
                  onClick={onStartTesting}
                  disabled={isCompleted}
                  icon={TestTube2}
                  className={!isCompleted ? "shadow-brand-primary/20 shadow-lg" : ""}
                >
                  {isCompleted ? "Analysis_Complete" : "Start_Analysis"}
                </LabButton>
              </>
            )}
          </footer>
        </div>
      </LabPanel>
    );
  },
);

// ─────────────────────────────────────────────
// Atomic Components
// ─────────────────────────────────────────────

const DetailTile = ({ icon: Icon, label, value, highlight, className }: any) => (
  <div
    className={`rounded-2xl border p-4 transition-all ${className} ${
      highlight
        ? "bg-brand-primary/10 border-brand-primary/20"
        : "border-brand-sage/10 bg-(--color-zenthar-carbon)"
    }`}
  >
    <div
      className={`mb-1 flex items-center gap-1.5 text-[8px] font-black tracking-widest uppercase ${
        highlight ? "text-brand-primary" : "text-brand-sage"
      }`}
    >
      <Icon size={10} /> {label}
    </div>
    <div className="truncate font-mono text-xs font-black text-(--color-zenthar-text-primary) uppercase">
      {value ?? "—"}
    </div>
  </div>
);

const EditField = ({ icon: Icon, label, value, onChange }: any) => (
  <div className="border-brand-primary/10 focus-within:border-brand-primary rounded-2xl border-2 bg-(--color-zenthar-carbon) p-4 transition-all">
    <label className="text-brand-primary mb-1 flex items-center gap-1.5 text-[9px] font-black tracking-widest uppercase">
      <Icon size={10} /> {label}
    </label>
    <input
      className="w-full bg-transparent text-xs font-bold text-(--color-zenthar-text-primary) outline-none"
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      autoFocus
    />
  </div>
);

SampleDetails.displayName = "SampleDetails";
