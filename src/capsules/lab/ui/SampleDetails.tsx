import React, { memo, useState } from "react";
import {
  ArrowLeft,
  Beaker,
  Save,
  Edit2,
  X,
  Hash,
  Layers,
  TestTube2,
  AlertCircle,
  Clock,
  MapPin,
  Activity,
  Settings,
  Factory,
  Cpu,
} from "lucide-react";
import type { Sample } from "../../../core/types";
import { LabPanel } from "../../../ui/components/LabPanel";
import { LabButton } from "../../../ui/components/LabButton";
import { LabApi } from "../api/lab.api";
import { AuditApi } from "../../audit/api/audit.api";
import { useAuthStore } from "../../../orchestrator/state/auth.store";
import { motion, AnimatePresence } from "motion/react";

interface SampleDetailsProps {
  sample: Sample;
  onBack: () => void;
  onStartTesting: () => void;
  onUpdate: () => void;
}

export const SampleDetails: React.FC<SampleDetailsProps> = memo(
  ({ sample, onBack, onStartTesting, onUpdate }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editedSample, setEditedSample] = useState<Partial<Sample>>({
      priority: sample.priority,
      batch_id: sample.batch_id,
      source_stage: sample.source_stage,
      line_id: sample.line_id,
      equipment_id: sample.equipment_id,
      shift_id: sample.shift_id,
      sample_types: sample.sample_types,
    });
    const [isSaving, setIsSaving] = useState(false);
    const { currentUser } = useAuthStore();

    const handleSave = async () => {
      setIsSaving(true);
      try {
        await LabApi.updateSample(sample.id, editedSample);

        // Log to audit trail
        const changes = [];
        if (editedSample.priority !== sample.priority)
          changes.push(
            `Priority: ${sample.priority} -> ${editedSample.priority}`,
          );
        if (editedSample.batch_id !== sample.batch_id)
          changes.push(
            `Batch ID: ${sample.batch_id} -> ${editedSample.batch_id}`,
          );
        if (editedSample.source_stage !== sample.source_stage)
          changes.push(
            `Stage: ${sample.source_stage} -> ${editedSample.source_stage}`,
          );
        if (editedSample.line_id !== sample.line_id)
          changes.push(`Line: ${sample.line_id} -> ${editedSample.line_id}`);
        if (editedSample.equipment_id !== sample.equipment_id)
          changes.push(
            `Equip: ${sample.equipment_id} -> ${editedSample.equipment_id}`,
          );
        if (editedSample.shift_id !== sample.shift_id)
          changes.push(`Shift: ${sample.shift_id} -> ${editedSample.shift_id}`);

        if (changes.length > 0) {
          await AuditApi.log(
            "SAMPLE_UPDATED",
            `Updated sample #${sample.id} (${sample.batch_id}). Changes: ${changes.join(", ")}`,
          );
        }

        setIsEditing(false);
        onUpdate();
      } catch (err) {
        console.error("Failed to update sample", err);
      } finally {
        setIsSaving(false);
      }
    };

    return (
      <LabPanel
        title={`Sample Details`}
        icon={Beaker}
        actions={
          <button
            onClick={onBack}
            className="text-[10px] font-bold uppercase text-brand-sage hover:text-brand-primary flex items-center gap-1.5 transition-colors bg-brand-mist/50 px-3 py-1.5 rounded-lg hover:bg-brand-primary/10"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Queue
          </button>
        }
      >
        <div className="flex flex-col h-full gap-6">
          {/* Header Section */}
          <div className="flex items-start justify-between p-6 bg-linear-to-br from-brand-mist/40 via-brand-mist/20 to-transparent rounded-3xl border border-brand-sage/10 relative overflow-hidden shadow-sm">
            <div className="absolute top-0 right-0 w-48 h-48 bg-brand-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />

            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-3">
                <div className="w-12 h-12 rounded-2xl bg-white shadow-md shadow-brand-primary/5 border border-brand-sage/10 flex items-center justify-center text-brand-primary">
                  <Beaker className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-brand-deep uppercase tracking-0.1em">
                    {sample.batch_id}
                  </h2>
                  <div className="flex items-center gap-3 text-[11px] font-mono text-brand-sage uppercase tracking-widest mt-1.5">
                    <span className="flex items-center gap-1.5 bg-white/50 px-2 py-1 rounded-lg border border-brand-sage/5">
                      <Clock className="w-3.5 h-3.5" />{" "}
                      {new Date(sample.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    <span className="text-brand-sage/30">•</span>
                    <span className="flex items-center gap-1.5 bg-white/50 px-2 py-1 rounded-lg border border-brand-sage/5">
                      <MapPin className="w-3.5 h-3.5" /> {sample.source_stage}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative z-10 flex flex-col items-end gap-3">
              <div
                className={`px-3.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] border shadow-sm backdrop-blur-sm ${
                  sample.priority === "STAT"
                    ? "bg-lab-laser/10 text-lab-laser border-lab-laser/20"
                    : sample.priority === "HIGH"
                      ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                      : "bg-brand-primary/10 text-brand-primary border-brand-primary/20"
                }`}
              >
                {sample.priority} PRIORITY
              </div>
              <div
                className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.15em] bg-white/50 px-3 py-1.5 rounded-xl border border-brand-sage/10 shadow-sm ${
                  sample.status === "COMPLETED"
                    ? "text-emerald-600"
                    : "text-brand-sage"
                }`}
              >
                {sample.status === "TESTING" && (
                  <Activity className="w-3.5 h-3.5 text-brand-primary animate-pulse" />
                )}
                {sample.status}
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
            <div className="grid grid-cols-2 gap-4">
              <AnimatePresence mode="popLayout">
                {isEditing ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="col-span-2 grid grid-cols-2 gap-4"
                  >
                    <EditField
                      icon={Hash}
                      label="Batch ID"
                      value={editedSample.batch_id}
                      onChange={(v: string) =>
                        setEditedSample((prev) => ({ ...prev, batch_id: v }))
                      }
                    />
                    <div className="p-4 bg-white/50 backdrop-blur-sm border-2 border-brand-primary/20 rounded-2xl shadow-sm focus-within:border-brand-primary focus-within:ring-4 focus-within:ring-brand-primary/10 transition-all">
                      <div className="flex items-center gap-2 text-[9px] font-black text-brand-primary uppercase tracking-[0.15em] mb-2">
                        <AlertCircle className="w-4 h-4" /> Priority Level
                      </div>
                      <select
                        value={editedSample.priority}
                        onChange={(e) =>
                          setEditedSample((prev) => ({
                            ...prev,
                            priority: e.target.value as any,
                          }))
                        }
                        className="w-full bg-transparent text-sm font-bold text-brand-deep uppercase focus:outline-none cursor-pointer"
                      >
                        <option value="NORMAL">NORMAL</option>
                        <option value="HIGH">HIGH</option>
                        <option value="STAT">STAT</option>
                      </select>
                    </div>
                    <EditField
                      icon={MapPin}
                      label="Source Stage"
                      value={editedSample.source_stage}
                      onChange={(v: string) =>
                        setEditedSample((prev) => ({
                          ...prev,
                          source_stage: v,
                        }))
                      }
                    />
                    <EditField
                      icon={Factory}
                      label="Line ID"
                      value={editedSample.line_id}
                      onChange={(v: string) =>
                        setEditedSample((prev) => ({ ...prev, line_id: v }))
                      }
                    />
                    <EditField
                      icon={Cpu}
                      label="Equipment ID"
                      value={editedSample.equipment_id}
                      onChange={(v: string) =>
                        setEditedSample((prev) => ({ ...prev, equipment_id: v }))
                      }
                    />
                    <div className="p-4 bg-white/50 backdrop-blur-sm border-2 border-brand-primary/20 rounded-2xl shadow-sm focus-within:border-brand-primary focus-within:ring-4 focus-within:ring-brand-primary/10 transition-all">
                      <div className="flex items-center gap-2 text-[9px] font-black text-brand-primary uppercase tracking-[0.15em] mb-2">
                        <Activity className="w-4 h-4" /> Shift
                      </div>
                      <select
                        value={editedSample.shift_id || ""}
                        onChange={(e) =>
                          setEditedSample((prev) => ({
                            ...prev,
                            shift_id: e.target.value || undefined,
                          }))
                        }
                        className="w-full bg-transparent text-sm font-bold text-brand-deep uppercase focus:outline-none cursor-pointer"
                      >
                        <option value="">N/A</option>
                        <option value="A">Shift A</option>
                        <option value="B">Shift B</option>
                        <option value="C">Shift C</option>
                      </select>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="col-span-2 grid grid-cols-2 gap-4"
                  >
                    <DetailItem
                      icon={Hash}
                      label="Batch ID"
                      value={sample.batch_id}
                    />
                    <DetailItem
                      icon={Layers}
                      label="Sample Type"
                      value={sample.sample_types || "N/A"}
                    />
                    <DetailItem
                      icon={MapPin}
                      label="Source Stage"
                      value={sample.source_stage}
                    />
                    <DetailItem
                      icon={TestTube2}
                      label="Required Tests"
                      value={`${sample.test_count} Tests`}
                      highlight
                    />

                    <div className="col-span-2 grid grid-cols-3 gap-4 mt-2 pt-4 border-t border-brand-sage/10">
                      <DetailItem
                        icon={Factory}
                        label="Line ID"
                        value={sample.line_id || "N/A"}
                      />
                      <DetailItem
                        icon={Cpu}
                        label="Equip ID"
                        value={sample.equipment_id || "N/A"}
                      />
                      <DetailItem
                        icon={Activity}
                        label="Shift"
                        value={sample.shift_id || "N/A"}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Actions Footer */}
          <div className="pt-6 border-t border-brand-sage/10 flex gap-4 mt-auto">
            {isEditing ? (
              <>
                <LabButton
                  variant="secondary"
                  onClick={() => setIsEditing(false)}
                  icon={X}
                >
                  Cancel
                </LabButton>
                <LabButton
                  variant="primary"
                  fullWidth
                  onClick={handleSave}
                  loading={isSaving}
                  icon={Save}
                >
                  Save Changes
                </LabButton>
              </>
            ) : (
              <>
                <LabButton
                  variant="secondary"
                  onClick={() => setIsEditing(true)}
                  icon={Edit2}
                >
                  Edit
                </LabButton>
                <LabButton
                  variant="primary"
                  fullWidth
                  onClick={onStartTesting}
                  disabled={sample.status === "COMPLETED"}
                  icon={TestTube2}
                >
                  {sample.status === "COMPLETED"
                    ? "Analysis Complete"
                    : "Start Analysis"}
                </LabButton>
              </>
            )}
          </div>
        </div>
      </LabPanel>
    );
  },
);

const DetailItem = ({ icon: Icon, label, value, highlight, small }: any) => (
  <div
    className={`p-4 rounded-2xl border transition-all ${
      highlight
        ? "bg-linear-to-br from-brand-primary/10 to-brand-primary/5 border-brand-primary/20 shadow-sm"
        : "bg-white/50 backdrop-blur-sm border-brand-sage/10 hover:border-brand-sage/30 hover:shadow-sm"
    }`}
  >
    <div
      className={`flex items-center gap-2 font-black uppercase tracking-[0.15em] mb-1.5 ${
        highlight ? "text-brand-primary" : "text-brand-sage"
      } ${small ? "text-[8px]" : "text-[9px]"}`}
    >
      {Icon && <Icon className={small ? "w-3 h-3" : "w-4 h-4"} />}
      {label}
    </div>
    <div
      className={`font-bold text-brand-deep uppercase truncate ${small ? "text-[10px]" : "text-sm"}`}
    >
      {value}
    </div>
  </div>
);

const EditField = ({ icon: Icon, label, value, onChange }: any) => (
  <div className="p-4 bg-white/50 backdrop-blur-sm border-2 border-brand-primary/20 rounded-2xl shadow-sm focus-within:border-brand-primary focus-within:ring-4 focus-within:ring-brand-primary/10 transition-all">
    <div className="flex items-center gap-2 text-[9px] font-black text-brand-primary uppercase tracking-[0.15em] mb-2">
      {Icon && <Icon className="w-4 h-4" />}
      {label}
    </div>
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-transparent text-sm font-bold text-brand-deep uppercase focus:outline-none placeholder:text-brand-sage/40"
      placeholder={`Enter ${label.toLowerCase()}...`}
    />
  </div>
);

SampleDetails.displayName = "SampleDetails";
