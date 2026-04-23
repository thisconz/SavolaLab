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
import { LabButton } from "../../../shared/components/LabButton";
import { Modal } from "../../../shared/components/Modal";
import { SamplePriority, SampleStatus } from "../../../core/types";
import { LabApi } from "../api/lab.api";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type FormState = {
  batch_id: string;
  sample_type: string;
  source_stage: string;
  priority: "NORMAL" | "HIGH" | "STAT";
  line_id: string;
  equipment_id: string;
  shift_id: string;
};

const INITIAL: FormState = {
  batch_id: "",
  sample_type: "Raw sugar",
  source_stage: "Raw Handling",
  priority: "NORMAL",
  line_id: "",
  equipment_id: "",
  shift_id: "",
};

const SAMPLE_TYPE_OPTIONS = [
  "Raw sugar",
  "White sugar",
  "Brown sugar",
  "Polish liquor",
  "Fine liquor",
  "Evaporator liquor",
  "Effluent samples",
  "Sweet water",
  "Utility samples",
];

const SOURCE_STAGE_OPTIONS = [
  "Raw Handling",
  "Refining",
  "Carbonation",
  "Filtration",
  "Evaporation",
  "Crystallization",
  "Centrifuge",
  "Drying",
  "Packaging",
];

export const RegisterSampleModal: React.FC<Props> = memo(({ isOpen, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(INITIAL);

  const set = (key: keyof FormState, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.batch_id.trim()) {
      setError("Batch ID is required.");
      return;
    }
    if (form.batch_id.trim().length < 3) {
      setError("Batch ID must be at least 3 characters.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await LabApi.registerSample({
        batch_id: form.batch_id.trim(),
        sample_type: form.sample_type || undefined,
        source_stage: form.source_stage || undefined,
        priority: SamplePriority[form.priority],
        status: SampleStatus.REGISTERED,
        line_id: form.line_id || undefined,
        equipment_id: form.equipment_id || undefined,
        shift_id: form.shift_id || undefined,
      } as any);

      onSuccess();
      handleClose();
    } catch (err: any) {
      setError(err?.message ?? "Failed to register sample. Check connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setForm(INITIAL);
    setError(null);
    onClose();
  };

  const labelStyle =
    "flex items-center gap-2 text-[9px] font-black text-brand-sage uppercase tracking-[0.2em] mb-2";
  const inputStyle =
    "w-full bg-(--color-zenthar-carbon)/60 border-2 border-brand-sage/10 rounded-2xl px-5 py-4 text-sm font-mono focus:outline-none focus:border-brand-primary/50 focus:ring-4 focus:ring-brand-primary/5 text-(--color-zenthar-text-primary) transition-all placeholder:text-brand-sage/30";

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Register_New_Sample" maxWidth="max-w-xl">
      <form onSubmit={handleSubmit} className="space-y-8 p-1">
        {error && (
          <div className="p-4 bg-lab-laser/5 border border-lab-laser/20 rounded-2xl flex items-center gap-3 text-lab-laser">
            <AlertCircle size={18} />
            <span className="text-[10px] font-black uppercase tracking-widest">{error}</span>
          </div>
        )}

        {/* Section 1: Core Identification */}
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className={labelStyle}>
              <Hash size={14} className="text-brand-primary" /> Batch_ID
            </label>
            <input
              required
              autoFocus
              type="text"
              value={form.batch_id}
              onChange={(e) => set("batch_id", e.target.value)}
              placeholder="e.g. BT-9001"
              className={inputStyle}
            />
          </div>

          <div>
            <label className={labelStyle}>
              <Activity size={14} className="text-brand-primary" /> Priority_Tier
            </label>
            <select
              value={form.priority}
              onChange={(e) => set("priority", e.target.value as any)}
              className={`${inputStyle} cursor-pointer appearance-none`}
            >
              <option value="NORMAL">Normal</option>
              <option value="HIGH">High Priority</option>
              <option value="STAT">STAT – Urgent</option>
            </select>
          </div>
        </div>

        {/* Section 2: Sample Classification */}
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className={labelStyle}>
              <TestTube2 size={14} className="text-brand-primary" /> Sample_Type
            </label>
            <select
              value={form.sample_type}
              onChange={(e) => set("sample_type", e.target.value)}
              className={`${inputStyle} cursor-pointer appearance-none`}
            >
              {SAMPLE_TYPE_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelStyle}>
              <Layers size={14} className="text-brand-primary" /> Source_Stage
            </label>
            <select
              value={form.source_stage}
              onChange={(e) => set("source_stage", e.target.value)}
              className={`${inputStyle} cursor-pointer appearance-none`}
            >
              {SOURCE_STAGE_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Section 3: Logistics (optional) */}
        <div className="bg-(--color-zenthar-carbon)/20 p-6 rounded-4xl border border-brand-sage/5">
          <p className="text-[9px] font-black text-brand-sage/50 uppercase tracking-widest mb-4">
            Optional — Logistics
          </p>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={labelStyle}>
                <Settings size={12} /> Line
              </label>
              <input
                type="text"
                value={form.line_id}
                onChange={(e) => set("line_id", e.target.value)}
                placeholder="L1"
                className={`${inputStyle} py-3 px-4 text-center`}
              />
            </div>
            <div>
              <label className={labelStyle}>
                <Beaker size={12} /> Equipment
              </label>
              <input
                type="text"
                value={form.equipment_id}
                onChange={(e) => set("equipment_id", e.target.value)}
                placeholder="E01"
                className={`${inputStyle} py-3 px-4 text-center`}
              />
            </div>
            <div>
              <label className={labelStyle}>
                <Clock size={12} /> Shift
              </label>
              <select
                value={form.shift_id}
                onChange={(e) => set("shift_id", e.target.value)}
                className={`${inputStyle} py-3 px-4 cursor-pointer text-center`}
              >
                <option value="">N/A</option>
                <option value="1">Morning (07:00–15:00)</option>
                <option value="2">Afternoon (15:00–23:00)</option>
                <option value="3">Night (23:00–07:00)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-6 border-t border-brand-sage/10 flex gap-4">
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
            className="shadow-xl shadow-brand-primary/20"
          >
            Register_Sample
          </LabButton>
        </div>
      </form>
    </Modal>
  );
});

RegisterSampleModal.displayName = "RegisterSampleModal";
