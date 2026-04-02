import React, { useState, memo, useMemo } from "react";
import { Plus, Beaker, Layers, Activity, Hash, Settings, TestTube2, AlertCircle } from "lucide-react";
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

// Extract initial state for easy resets
const INITIAL_FORM_STATE = {
  batch_id: "",
  sugar_stage: SUGAR_STAGES[0] as SugarStage,
  sample_type: "",
  priority: "NORMAL" as keyof typeof SamplePriority,
  line_id: "",
  equipment_id: "",
  shift_id: "",
};

export const RegisterSampleModal: React.FC<RegisterSampleModalProps> = memo(
  ({ isOpen, onClose, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState(INITIAL_FORM_STATE);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      
      // Basic Validation
      if (!formData.batch_id.trim()) {
        setError("Batch ID is required for registration.");
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const payload: Partial<Sample> = {
          ...formData,
          source_stage: formData.sugar_stage,
          priority: SamplePriority[formData.priority],
          status: SampleStatus.REGISTERED,
          created_at: new Date().toISOString(),
          test_count: 0,
          // Convert empty strings to undefined for clean API payload
          line_id: formData.line_id || undefined,
          equipment_id: formData.equipment_id || undefined,
          shift_id: formData.shift_id || undefined,
        };

        await LabApi.registerSample(payload);
        onSuccess();
        handleClose();
      } catch (err) {
        setError("Failed to register sample. Verify connection and inputs.");
        console.error("[Labrix Registration Error]:", err);
      } finally {
        setLoading(false);
      }
    };

    const handleClose = () => {
      setFormData(INITIAL_FORM_STATE);
      setError(null);
      onClose();
    };

    const inputClasses = "w-full bg-white/80 backdrop-blur-sm border-2 border-brand-sage/20 rounded-2xl px-5 py-4 text-sm font-mono focus:outline-none focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary text-brand-deep transition-all shadow-sm";

    return (
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title="Register New Sample"
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-red-600 animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-widest">
                {error}
              </span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-[10px] font-black text-brand-sage uppercase tracking-widest">
                <Hash className="w-4 h-4 text-brand-primary" />
                Batch ID
              </label>
              <input
                required
                type="text"
                value={formData.batch_id}
                onChange={(e) => setFormData({ ...formData, batch_id: e.target.value })}
                placeholder="e.g. BT-8822"
                className={inputClasses}
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-[10px] font-black text-brand-sage uppercase tracking-widest">
                <Activity className="w-4 h-4 text-brand-primary" />
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                className={`${inputClasses} cursor-pointer`}
              >
                <option value="NORMAL">NORMAL</option>
                <option value="HIGH">HIGH</option>
                <option value="STAT">STAT (URGENT)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-[10px] font-black text-brand-sage uppercase tracking-widest">
                <Layers className="w-4 h-4 text-brand-primary" />
                Source Stage
              </label>
              <select
                required
                value={formData.sugar_stage}
                onChange={(e) => setFormData({ ...formData, sugar_stage: e.target.value as SugarStage })}
                className={`${inputClasses} cursor-pointer`}
              >
                {SUGAR_STAGES.map((stage) => (
                  <option key={stage} value={stage}>{stage}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-[10px] font-black text-brand-sage uppercase tracking-widest">
                <TestTube2 className="w-4 h-4 text-brand-primary" />
                Sample Type
              </label>
              <input
                type="text"
                value={formData.sample_type}
                onChange={(e) => setFormData({ ...formData, sample_type: e.target.value })}
                placeholder="e.g. Raw Sugar"
                className={inputClasses}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-[10px] font-black text-brand-sage uppercase tracking-widest">
                <Settings className="w-4 h-4 text-brand-primary" />
                Line ID
              </label>
              <input
                type="text"
                value={formData.line_id}
                onChange={(e) => setFormData({ ...formData, line_id: e.target.value })}
                className={inputClasses}
                placeholder="L1"
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-[10px] font-black text-brand-sage uppercase tracking-widest">
                <Beaker className="w-4 h-4 text-brand-primary" />
                Equip ID
              </label>
              <input
                type="text"
                value={formData.equipment_id}
                onChange={(e) => setFormData({ ...formData, equipment_id: e.target.value })}
                className={inputClasses}
                placeholder="E102"
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-[10px] font-black text-brand-sage uppercase tracking-widest">
                <Activity className="w-4 h-4 text-brand-primary" />
                Shift
              </label>
              <select
                value={formData.shift_id}
                onChange={(e) => setFormData({ ...formData, shift_id: e.target.value })}
                className={`${inputClasses} cursor-pointer`}
              >
                <option value="">N/A</option>
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
              </select>
            </div>
          </div>

          <div className="pt-8 mt-8 border-t border-brand-sage/10 flex gap-4">
            <LabButton
              type="button"
              variant="secondary"
              fullWidth
              onClick={handleClose}
              disabled={loading}
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
  }
);

RegisterSampleModal.displayName = "RegisterSampleModal";