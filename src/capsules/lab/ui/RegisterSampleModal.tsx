import React, { useState, memo } from "react";
import {
  Plus,
  Beaker,
  Layers,
  Activity,
  Hash,
  Settings,
  TestTube2,
  AlertCircle,
  Clock,
} from "lucide-react";
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
      if (!formData.batch_id.trim()) {
        setError("Batch_ID is mandatory for system registration.");
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
          // Sanitize empty strings for API consistency
          line_id: formData.line_id.trim() || undefined,
          equipment_id: formData.equipment_id.trim() || undefined,
          shift_id: formData.shift_id.trim() || undefined,
        };

        await LabApi.registerSample(payload as any);
        onSuccess();
        handleClose();
      } catch (err) {
        setError("System link failed. Verify inputs or check network status.");
        console.error("[Zenthar_Auth_Error]:", err);
      } finally {
        setLoading(false);
      }
    };

    const handleClose = () => {
      setFormData(INITIAL_FORM_STATE);
      setError(null);
      onClose();
    };

    const labelStyle =
      "flex items-center gap-2 text-[9px] font-black text-brand-sage uppercase tracking-[0.2em] mb-2";
    const inputStyle =
      "w-full bg-white/60 backdrop-blur-md border-2 border-brand-sage/10 rounded-2xl px-5 py-4 text-sm font-mono focus:outline-none focus:border-brand-primary/50 focus:ring-4 focus:ring-brand-primary/5 text-brand-deep transition-all shadow-inner placeholder:text-brand-sage/30";

    return (
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title="Initialize_New_Run"
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleSubmit} className="space-y-8 p-1">
          {error && (
            <div className="p-4 bg-lab-laser/5 border border-lab-laser/20 rounded-2xl flex items-center gap-3 text-lab-laser animate-in fade-in zoom-in-95">
              <AlertCircle size={18} />
              <span className="text-[10px] font-black uppercase tracking-widest">
                {error}
              </span>
            </div>
          )}

          {/* SECTION 1: PRIMARY DATA */}
          <div className="grid grid-cols-2 gap-6">
            <div className="group">
              <label className={labelStyle}>
                <Hash size={14} className="text-brand-primary" />{" "}
                Batch_Identifier
              </label>
              <input
                required
                type="text"
                autoFocus
                value={formData.batch_id}
                onChange={(e) =>
                  setFormData({ ...formData, batch_id: e.target.value })
                }
                placeholder="Ex: BT-9000"
                className={inputStyle}
              />
            </div>

            <div>
              <label className={labelStyle}>
                <Activity size={14} className="text-brand-primary" />{" "}
                Priority_Tier
              </label>
              <select
                value={formData.priority}
                onChange={(e) =>
                  setFormData({ ...formData, priority: e.target.value as any })
                }
                className={`${inputStyle} cursor-pointer appearance-none`}
              >
                <option value="NORMAL">Normal_Priority</option>
                <option value="HIGH">High_Priority</option>
                <option value="STAT">Stat_Urgent (Hot)</option>
              </select>
            </div>
          </div>

          {/* SECTION 2: PROCESS CONTEXT */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className={labelStyle}>
                <Layers size={14} className="text-brand-primary" /> Source_Stage
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
                className={`${inputStyle} cursor-pointer appearance-none`}
              >
                {SUGAR_STAGES.map((stage) => (
                  <option key={stage} value={stage}>
                    {stage}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelStyle}>
                <TestTube2 size={14} className="text-brand-primary" />{" "}
                Material_Type
              </label>
              <input
                type="text"
                value={formData.sample_type}
                onChange={(e) =>
                  setFormData({ ...formData, sample_type: e.target.value })
                }
                placeholder="Ex: Fine Granular"
                className={inputStyle}
              />
            </div>
          </div>

          {/* SECTION 3: LOGISTICS GRID */}
          <div className="bg-brand-mist/20 p-6 rounded-4xl border border-brand-sage/5">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className={labelStyle}>
                  <Settings size={12} /> Line
                </label>
                <input
                  type="text"
                  value={formData.line_id}
                  onChange={(e) =>
                    setFormData({ ...formData, line_id: e.target.value })
                  }
                  placeholder="L1"
                  className={`${inputStyle} py-3 px-4 text-center`}
                />
              </div>

              <div>
                <label className={labelStyle}>
                  <Beaker size={12} /> Equip
                </label>
                <input
                  type="text"
                  value={formData.equipment_id}
                  onChange={(e) =>
                    setFormData({ ...formData, equipment_id: e.target.value })
                  }
                  placeholder="E01"
                  className={`${inputStyle} py-3 px-4 text-center`}
                />
              </div>

              <div>
                <label className={labelStyle}>
                  <Clock size={12} /> Shift
                </label>
                <select
                  value={formData.shift_id}
                  onChange={(e) =>
                    setFormData({ ...formData, shift_id: e.target.value })
                  }
                  className={`${inputStyle} py-3 px-4 cursor-pointer text-center`}
                >
                  <option value="">N/A</option>
                  <option value="A">Shift_A</option>
                  <option value="B">Shift_B</option>
                  <option value="C">Shift_C</option>
                </select>
              </div>
            </div>
          </div>

          {/* FOOTER ACTIONS */}
          <div className="pt-6 border-t border-brand-sage/10 flex gap-4">
            <LabButton
              type="button"
              variant="secondary"
              fullWidth
              onClick={handleClose}
              disabled={loading}
            >
              Discard_Entry
            </LabButton>
            <LabButton
              type="submit"
              variant="primary"
              fullWidth
              loading={loading}
              icon={Plus}
              className="shadow-xl shadow-brand-primary/20"
            >
              Initialize_Batch
            </LabButton>
          </div>
        </form>
      </Modal>
    );
  },
);

RegisterSampleModal.displayName = "RegisterSampleModal";
