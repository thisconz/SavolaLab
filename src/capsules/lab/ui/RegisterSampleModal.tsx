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
import type { SugarType, Sample } from "../../../core/types";
import { SamplePriority, SampleStatus } from "../../../core/types";
import { SAMPLE_TYPES } from "../../../core/types/lab.types";
import { LabApi } from "../api/lab.api";

interface RegisterSampleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const INITIAL_FORM_STATE = {
  batch_id: "",
  sample_type: SAMPLE_TYPES[0] as SugarType,
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
          source_stage: formData.sugar_type,
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
      "w-full bg-(--color-zenthar-carbon)/60 backdrop-blur-md border-2 border-brand-sage/10 rounded-2xl px-5 py-4 text-sm font-mono focus:outline-none focus:border-brand-primary/50 focus:ring-4 focus:ring-brand-primary/5 text-(--color-zenthar-text-primary) transition-all shadow-inner placeholder:text-brand-sage/30";

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
                <option value="NORMAL" className="bg-(--color-zenthar-carbon)">Normal_Priority</option>
                <option value="HIGH" className="bg-(--color-zenthar-carbon)">High_Priority</option>
                <option value="STAT" className="bg-(--color-zenthar-carbon)">Stat_Urgent (Hot)</option>
              </select>
            </div>
          </div>

          {/* SECTION 2: PROCESS CONTEXT */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className={labelStyle}>
                <Layers size={14} className="text-brand-primary" /> Sugar_Type
              </label>
              <select
                required
                value={formData.sugar_type}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    sugar_type: e.target.value as SugarType,
                  })
                }
                className={`${inputStyle} cursor-pointer appearance-none`}
              >
                {SAMPLE_TYPES.map((type) => (
                  <option key={type} value={type} className="bg-(--color-zenthar-carbon)">
                    {type}
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
          <div className="bg-(--color-zenthar-carbon)/20 p-6 rounded-4xl border border-brand-sage/5">
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
                  <option value="" className="bg-(--color-zenthar-carbon)">N/A</option>
                  <option value="A" className="bg-(--color-zenthar-carbon)">Shift_A</option>
                  <option value="B" className="bg-(--color-zenthar-carbon)">Shift_B</option>
                  <option value="C" className="bg-(--color-zenthar-carbon)">Shift_C</option>
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
