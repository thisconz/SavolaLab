import React, { memo, useState, useEffect } from "react";
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
  CheckCircle2,
  TrendingUp,
  Fingerprint,
} from "lucide-react";
import type { Sample, TestResult } from "../../../core/types";
import { LabPanel } from "../../../ui/components/LabPanel";
import { LabButton } from "../../../ui/components/LabButton";
import { LabApi } from "../api/lab.api";
import { AuditApi } from "../../audit/api/audit.api";
import { useAuthStore } from "../../../orchestrator/state/auth.store";
import { motion, AnimatePresence } from "@/src/lib/motion";

interface SampleDetailsProps {
  sample: Sample;
  onBack: () => void;
  onStartTesting: () => void;
  onUpdate: () => void;
}

export const SampleDetails: React.FC<SampleDetailsProps> = memo(
  ({ sample, onBack, onStartTesting, onUpdate }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editedSample, setEditedSample] = useState<Partial<Sample>>({});
    const [isSaving, setIsSaving] = useState(false);
    const [testResults, setTestResults] = useState<TestResult[]>([]);
    const [loadingTests, setLoadingTests] = useState(false);
    const { currentUser } = useAuthStore();

    useEffect(() => {
      if (isEditing) {
        setEditedSample({
          priority: sample.priority,
          batch_id: sample.batch_id,
          source_stage: sample.source_stage,
          line_id: sample.line_id,
          equipment_id: sample.equipment_id,
          sample_type: sample.sample_type,
        });
      }
    }, [isEditing, sample]);

    useEffect(() => {
      const fetchTests = async () => {
        setLoadingTests(true);
        try {
          const results = await LabApi.getSampleTests(sample.id);
          setTestResults(results);
        } catch (err) {
          console.error("Failed to fetch test results", err);
        } finally {
          setLoadingTests(false);
        }
      };
      if (sample.status === "COMPLETED" || sample.status === "TESTING") {
        fetchTests();
      }
    }, [sample.id, sample.status]);

    const handleSave = async () => {
      setIsSaving(true);
      try {
        await LabApi.updateSample(sample.id, editedSample);
        const changes = Object.keys(editedSample)
          .filter((key) => editedSample[key as keyof Sample] !== sample[key as keyof Sample]);

        if (changes.length > 0) {
          await AuditApi.log("SAMPLE_UPDATED", `Modified by ${currentUser?.name}`);
        }
        setIsEditing(false);
        onUpdate();
      } finally {
        setIsSaving(false);
      }
    };

    const isStat = sample.priority === "STAT";

    return (
      <LabPanel
        title="Diagnostic View"
        icon={Fingerprint}
        actions={
          <button onClick={onBack} className="flex items-center gap-2 px-3 py-1.5 text-[10px] font-black uppercase text-brand-sage hover:text-brand-primary bg-brand-mist/50 rounded-lg transition-all border border-brand-sage/10">
            <ArrowLeft size={14} /> Back
          </button>
        }
      >
        <div className="flex flex-col h-full space-y-6 overflow-hidden">
          
          {/* Status Hero Card */}
          <header className={`relative p-6 rounded-3xl border transition-all duration-500 shadow-2xl shadow-brand-deep/5 overflow-hidden ${
            isStat ? 'bg-white border-lab-laser/20' : 'bg-white border-brand-sage/10'
          }`}>
            <div className="relative z-10 flex items-start justify-between">
              <div className="flex items-center gap-5">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg transition-transform duration-700 ${
                  isStat ? 'bg-lab-laser text-white scale-110' : 'bg-brand-primary text-white'
                }`}>
                  <Beaker size={32} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-3xl font-black text-brand-deep tracking-tighter tabular-nums">
                      {sample.batch_id}
                    </h2>
                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${isStat ? 'bg-lab-laser text-white animate-pulse' : 'bg-brand-mist text-brand-sage'}`}>
                      {sample.priority}
                    </span>
                  </div>
                  <p className="text-[10px] font-bold text-brand-sage uppercase tracking-widest mt-1 flex items-center gap-2">
                    <MapPin size={12} className="opacity-40" /> {sample.source_stage} • <Clock size={12} className="opacity-40" /> {new Date(sample.created_at).toLocaleTimeString()}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <div className="text-[9px] font-black text-brand-sage uppercase tracking-[0.2em] mb-2">Process Phase</div>
                <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-wider ${
                   sample.status === "COMPLETED" ? "bg-emerald-50 border-emerald-100 text-emerald-600" : "bg-brand-primary/10 border-brand-primary/20 text-brand-primary"
                }`}>
                   {sample.status === "TESTING" && <Activity size={12} className="animate-pulse" />}
                   {sample.status}
                </div>
              </div>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6 pr-2">
            {/* Bento Grid Parameters */}
            <section>
              <div className="flex items-center gap-2 px-1 mb-3">
                <Settings size={14} className="text-brand-primary" />
                <h3 className="text-[10px] font-black text-brand-deep uppercase tracking-widest">Metadata Grid</h3>
              </div>
              
              <div className="grid grid-cols-6 gap-3">
                <AnimatePresence mode="popLayout">
                  {isEditing ? (
                    <div className="col-span-6 grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-bottom-2">
                      <EditField icon={Hash} label="Batch ID" value={editedSample.batch_id} onChange={(v: string) => setEditedSample(p => ({...p, batch_id: v}))} />
                      <div className="p-4 bg-brand-mist/20 border border-brand-primary/20 rounded-2xl">
                         <label className="text-[9px] font-black text-brand-primary uppercase tracking-widest block mb-2">Priority</label>
                         <select className="w-full bg-transparent text-xs font-bold text-brand-deep uppercase" value={editedSample.priority} onChange={(e) => setEditedSample(p => ({...p, priority: e.target.value as any}))}>
                            <option value="NORMAL">Normal</option>
                            <option value="HIGH">High</option>
                            <option value="STAT">STAT</option>
                         </select>
                      </div>
                    </div>
                  ) : (
                    <>
                      <DetailTile className="col-span-3" icon={Layers} label="Type" value={sample.sample_type} highlight />
                      <DetailTile className="col-span-3" icon={Factory} label="Line" value={sample.line_id} />
                      <DetailTile className="col-span-2" icon={Cpu} label="Equipment" value={sample.equipment_id} />
                      <DetailTile className="col-span-4" icon={TestTube2} label="Requirement" value={`${sample.test_count} Standard Tests`} />
                    </>
                  )}
                </AnimatePresence>
              </div>
            </section>

            {/* Instrument Readout (Test Results) */}
            <AnimatePresence>
              {testResults.length > 0 && !isEditing && (
                <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                  <div className="flex items-center gap-2 px-1">
                    <TrendingUp size={14} className="text-emerald-500" />
                    <h3 className="text-[10px] font-black text-brand-deep uppercase tracking-widest">Live Instrument Readout</h3>
                  </div>
                  <div className="grid gap-2">
                    {testResults.map((result) => (
                      <div key={result.id} className="flex items-center justify-between p-4 bg-linear-to-r from-brand-mist/40 to-transparent border border-brand-sage/10 rounded-2xl group hover:border-brand-primary/30 transition-all">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${result.status === "COMPLETED" ? 'bg-emerald-500/10 text-emerald-500' : 'bg-brand-primary/10 text-brand-primary'}`}>
                             {result.status === "COMPLETED" ? <CheckCircle2 size={18} /> : <Activity size={18} className="animate-spin-slow" />}
                          </div>
                          <div>
                            <div className="text-[11px] font-black text-brand-deep uppercase">{result.test_type}</div>
                            <div className="text-[8px] font-bold text-brand-sage tracking-widest">{result.status}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xl font-black text-brand-deep tabular-nums">{result.calculated_value || "---"}</span>
                          <span className="text-[9px] font-bold text-brand-sage ml-1 uppercase">{result.unit}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.section>
              )}
            </AnimatePresence>
          </div>

          {/* Action Bar */}
          <footer className="pt-4 border-t border-brand-sage/10 flex gap-3">
            {isEditing ? (
              <>
                <LabButton variant="secondary" onClick={() => setIsEditing(false)} icon={X}>Cancel</LabButton>
                <LabButton variant="primary" fullWidth onClick={handleSave} loading={isSaving} icon={Save}>Commit Changes</LabButton>
              </>
            ) : (
              <>
                <LabButton variant="secondary" onClick={() => setIsEditing(true)} icon={Edit2}>Adjust</LabButton>
                <LabButton 
                  variant="primary" 
                  fullWidth 
                  onClick={onStartTesting} 
                  disabled={sample.status === "COMPLETED"} 
                  icon={TestTube2}
                  className="shadow-lg shadow-brand-primary/20"
                >
                  {sample.status === "COMPLETED" ? "Analysis Archived" : "Initiate Lab Run"}
                </LabButton>
              </>
            )}
          </footer>
        </div>
      </LabPanel>
    );
  }
);

/* Compact Sub-Components */

const DetailTile = ({ icon: Icon, label, value, highlight, className }: any) => (
  <motion.div layout className={`p-4 rounded-2xl border transition-all ${className} ${
    highlight ? "bg-brand-primary/5 border-brand-primary/20" : "bg-white border-brand-sage/5"
  }`}>
    <div className={`flex items-center gap-1.5 text-[8px] font-black uppercase tracking-tighter mb-1 ${highlight ? 'text-brand-primary' : 'text-brand-sage'}`}>
      <Icon size={10} /> {label}
    </div>
    <div className="text-xs font-black text-brand-deep uppercase truncate">{value || "N/A"}</div>
  </motion.div>
);

const EditField = ({ icon: Icon, label, value, onChange }: any) => (
  <div className="p-4 bg-white border-2 border-brand-primary/10 rounded-2xl focus-within:border-brand-primary transition-all">
    <label className="flex items-center gap-1.5 text-[9px] font-black text-brand-primary uppercase tracking-widest mb-1">
      <Icon size={10} /> {label}
    </label>
    <input 
      className="w-full bg-transparent text-xs font-bold text-brand-deep outline-none"
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
    />
  </div>
);

SampleDetails.displayName = "SampleDetails";