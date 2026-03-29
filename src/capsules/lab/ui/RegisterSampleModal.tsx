import React, { useState, memo } from "react";
import { Plus, Beaker, Layers, Activity, Hash, Settings } from "lucide-react";
import { LabButton } from "../../../ui/components/LabButton";
import { Modal } from "../../../ui/components/Modal";
import type { SugarStage, Sample } from "../../../core/types";
import { SamplePriority, SampleStatus } from "../../../core/types";
import { SUGAR_STAGES } from "../../../core/types/lab.types";
import { LabApi } from "../api/lab.api";

interface RegisterSampleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const RegisterSampleModal: React.FC<RegisterSampleModalProps> = memo(
  ({ isOpen, onClose, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
      batch_id: "",
      sugar_stage: SUGAR_STAGES[0] as SugarStage,
      priority: "NORMAL" as "NORMAL" | "HIGH" | "STAT",
      line_id: "",
      equipment_id: "",
      shift_id: "",
    });

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      setError(null);

      try {
        const payload: Partial<Sample> = {
          batch_id: formData.batch_id,
          sugar_stage: formData.sugar_stage,
          source_stage: formData.sugar_stage, // Keep both for compatibility
          priority:
            SamplePriority[formData.priority as keyof typeof SamplePriority],
          line_id: formData.line_id || undefined,
          equipment_id: formData.equipment_id || undefined,
          shift_id: formData.shift_id || undefined,
          status: SampleStatus.REGISTERED,
          created_at: new Date().toISOString(),
          test_count: 0,
        };

        await LabApi.registerSample(payload);
        onSuccess();
        onClose();
        // Reset form
        setFormData({
          batch_id: "",
          sugar_stage: SUGAR_STAGES[0] as SugarStage,
          priority: "NORMAL" as "NORMAL" | "HIGH" | "STAT",
          line_id: "",
          equipment_id: "",
          shift_id: "",
        });
      } catch (err) {
        setError("Failed to register sample. Please check the inputs.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Register New Sample"
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-4 bg-lab-laser/10 border border-lab-laser/20 rounded-2xl flex items-center gap-3 text-lab-laser">
              <Activity className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-widest">
                {error}
              </span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-6">
            {/* Batch ID */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-[10px] font-black text-brand-sage uppercase tracking-widest">
                <Hash className="w-4 h-4 text-brand-primary" />
                Batch ID
              </label>
              <input
                required
                type="text"
                value={formData.batch_id}
                onChange={(e) =>
                  setFormData({ ...formData, batch_id: e.target.value })
                }
                placeholder="e.g. BT-8822"
                className="w-full bg-white/80 backdrop-blur-sm border-2 border-brand-sage/20 rounded-2xl px-5 py-4 text-sm font-mono focus:outline-none focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary text-brand-deep transition-all shadow-sm"
              />
            </div>

            {/* Priority */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-[10px] font-black text-brand-sage uppercase tracking-widest">
                <Activity className="w-4 h-4 text-brand-primary" />
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) =>
                  setFormData({ ...formData, priority: e.target.value as any })
                }
                className="w-full bg-white/80 backdrop-blur-sm border-2 border-brand-sage/20 rounded-2xl px-5 py-4 text-sm font-mono focus:outline-none focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary text-brand-deep transition-all appearance-none shadow-sm"
              >
                <option value="NORMAL">NORMAL</option>
                <option value="HIGH">HIGH</option>
                <option value="STAT">STAT (URGENT)</option>
              </select>
            </div>
          </div>

          {/* Source Stage */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-[10px] font-black text-brand-sage uppercase tracking-widest">
              <Layers className="w-4 h-4 text-brand-primary" />
              Source Stage
            </label>
            <select
              required
              value={formData.sugar_stage}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  sugar_stage: e.target.value as SugarStage,
                })
              }
              className="w-full bg-white/80 backdrop-blur-sm border-2 border-brand-sage/20 rounded-2xl px-5 py-4 text-sm font-mono focus:outline-none focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary text-brand-deep transition-all appearance-none shadow-sm"
            >
              {SUGAR_STAGES.map((stage) => (
                <option key={stage} value={stage}>
                  {stage}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-6">
            {/* Line ID */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-[10px] font-black text-brand-sage uppercase tracking-widest">
                <Settings className="w-4 h-4 text-brand-primary" />
                Line ID (Opt)
              </label>
              <input
                type="text"
                value={formData.line_id}
                onChange={(e) =>
                  setFormData({ ...formData, line_id: e.target.value })
                }
                placeholder="e.g. L1"
                className="w-full bg-white/80 backdrop-blur-sm border-2 border-brand-sage/20 rounded-2xl px-4 py-3 text-sm font-mono focus:outline-none focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary text-brand-deep transition-all shadow-sm"
              />
            </div>

            {/* Equipment ID */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-[10px] font-black text-brand-sage uppercase tracking-widest">
                <Beaker className="w-4 h-4 text-brand-primary" />
                Equip ID (Opt)
              </label>
              <input
                type="text"
                value={formData.equipment_id}
                onChange={(e) =>
                  setFormData({ ...formData, equipment_id: e.target.value })
                }
                placeholder="e.g. E102"
                className="w-full bg-white/80 backdrop-blur-sm border-2 border-brand-sage/20 rounded-2xl px-4 py-3 text-sm font-mono focus:outline-none focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary text-brand-deep transition-all shadow-sm"
              />
            </div>

            {/* Shift ID */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-[10px] font-black text-brand-sage uppercase tracking-widest">
                <Activity className="w-4 h-4 text-brand-primary" />
                Shift (Opt)
              </label>
              <select
                value={formData.shift_id}
                onChange={(e) =>
                  setFormData({ ...formData, shift_id: e.target.value })
                }
                className="w-full bg-white/80 backdrop-blur-sm border-2 border-brand-sage/20 rounded-2xl px-4 py-3 text-sm font-mono focus:outline-none focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary text-brand-deep transition-all appearance-none shadow-sm"
              >
                <option value="">Select</option>
                <option value="A">Shift A</option>
                <option value="B">Shift B</option>
                <option value="C">Shift C</option>
              </select>
            </div>
          </div>

          <div className="pt-8 mt-8 border-t border-brand-sage/10 flex gap-4">
            <LabButton
              type="button"
              variant="secondary"
              fullWidth
              onClick={onClose}
            >
              Cancel
            </LabButton>
            <LabButton
              type="submit"
              variant="primary"
              fullWidth
              loading={loading}
              icon={Plus}
            >
              Register Sample
            </LabButton>
          </div>
        </form>
      </Modal>
    );
  },
);

RegisterSampleModal.displayName = "RegisterSampleModal";
