import React, { memo, useState, useEffect, useMemo, useCallback } from "react";
import {
  ListChecks,
  Search,
  Filter,
  Clock,
  CheckCircle2,
  XCircle,
  Play,
  History,
  AlertCircle,
} from "lucide-react";
import { LabPanel } from "../../../ui/components/LabPanel";
import { LabApi } from "../../lab/api/lab.api";
import { WorkflowApi } from "../api/workflow.api";
import { WorkflowExecution, Sample } from "../../../core/types";
import { motion, AnimatePresence } from "@/src/lib/motion";

type ExecutionWithWorkflow = WorkflowExecution & { workflow_name: string };

// --- Helpers ---
const formatDate = (dateStr?: string) => {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getCycleTime = (start?: string, end?: string) => {
  if (!start || !end) return "ACTIVE";
  const diff = new Date(end).getTime() - new Date(start).getTime();
  const mins = Math.floor(diff / 1000 / 60);
  const secs = Math.floor((diff / 1000) % 60);
  return `${mins}m ${secs}s`;
};

// --- Sub-Components ---

const StatusBadge = ({ status }: { status: string }) => {
  const styles: Record<string, string> = {
    COMPLETED: "bg-emerald-50 border-emerald-200 text-emerald-700",
    FAILED: "bg-rose-50 border-rose-200 text-rose-700",
    IN_PROGRESS: "bg-brand-mist border-brand-primary/20 text-brand-primary",
    DEFAULT: "bg-brand-mist border-brand-sage/20 text-brand-sage",
  };
  return (
    <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-widest border ${styles[status] || styles.DEFAULT}`}>
      {status}
    </span>
  );
};

export const WorkflowsFeature: React.FC = memo(() => {
  const [samples, setSamples] = useState<Sample[]>([]);
  const [selectedSample, setSelectedSample] = useState<Sample | null>(null);
  const [executions, setExecutions] = useState<ExecutionWithWorkflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Load Initial Samples
  useEffect(() => {
    const loadSamples = async () => {
      try {
        setLoading(true);
        const data = await LabApi.getSamples();
        setSamples(data);
      } catch (err: any) {
        setError("System failed to synchronize sample queue.");
      } finally {
        setLoading(false);
      }
    };
    loadSamples();
  }, []);

  // Load Executions when sample changes
  useEffect(() => {
    if (!selectedSample) {
      setExecutions([]);
      return;
    }
    const loadExecutions = async () => {
      try {
        const data = await WorkflowApi.getWorkflowExecutions(selectedSample.id);
        setExecutions(data);
      } catch (err) {
        console.error("Execution fetch error", err);
      }
    };
    loadExecutions();
  }, [selectedSample]);

  // Memoized Filtered Data
  const filteredSamples = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return samples.filter(s => 
      [s.batch_id, s.sugar_stage, s.source_stage].some(val => 
        String(val ?? "").toLowerCase().includes(query)
      )
    );
  }, [samples, searchQuery]);

  const filteredExecutions = useMemo(() => {
    if (statusFilter === "ALL") return executions;
    return executions.filter((e) => e.status === statusFilter);
  }, [executions, statusFilter]);

  const getStatusIcon = useCallback((status: string) => {
    switch (status) {
      case "COMPLETED": return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case "FAILED": return <XCircle className="w-4 h-4 text-lab-laser" />;
      case "IN_PROGRESS": return <Play className="w-4 h-4 text-brand-primary animate-pulse" />;
      default: return <Clock className="w-4 h-4 text-brand-sage" />;
    }
  }, []);

  return (
    <div className="grid grid-cols-12 gap-6 h-full overflow-hidden bg-brand-mist/5 p-4">
      
      {/* Sidebar: Sample Selection */}
      <aside className="col-span-4 flex flex-col gap-6 overflow-hidden">
        <LabPanel title="Sample Queue" icon={History} loading={loading}>
          <div className="flex flex-col h-full bg-white/50">
            <div className="p-4 border-b border-brand-sage/10 bg-white">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-brand-sage group-focus-within:text-brand-primary transition-colors" />
                <input
                  type="text"
                  placeholder="FILTER BATCH ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-brand-mist/20 border border-brand-sage/20 rounded-xl pl-9 pr-3 py-2.5 text-[10px] font-mono focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all"
                />
              </div>
            </div>

            <div className="flex-1 overflow-auto custom-scrollbar p-2 space-y-2">
              {filteredSamples.map((sample) => (
                <button
                  key={sample.id}
                  onClick={() => setSelectedSample(sample)}
                  className={`w-full text-left p-4 rounded-2xl transition-all border group relative overflow-hidden ${
                    selectedSample?.id === sample.id
                      ? "bg-brand-primary border-brand-primary text-white shadow-lg shadow-brand-primary/20"
                      : "bg-white border-brand-sage/10 hover:border-brand-primary/30 text-brand-deep"
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-xs font-black font-mono tracking-wider">{sample.batch_id}</span>
                    <span className={`text-[8px] px-1.5 py-0.5 rounded font-black uppercase ${selectedSample?.id === sample.id ? "bg-white/20" : "bg-brand-mist"}`}>
                      {sample.priority}
                    </span>
                  </div>
                  <div className={`text-[9px] uppercase font-bold opacity-70 ${selectedSample?.id === sample.id ? "text-white" : "text-brand-sage"}`}>
                    {sample.sugar_stage}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </LabPanel>
      </aside>

      {/* Main Content: Execution Details */}
      <main className="col-span-8 flex flex-col gap-6 overflow-hidden">
        <LabPanel 
          title={selectedSample ? `TRACEABILITY: ${selectedSample.batch_id}` : "Workflow Monitoring"} 
          icon={ListChecks}
        >
          {!selectedSample ? (
            <div className="h-full flex flex-col items-center justify-center text-brand-sage animate-in fade-in duration-500">
              <div className="p-8 bg-brand-mist rounded-full mb-4 border border-brand-sage/10">
                <ListChecks className="w-12 h-12 opacity-20 text-brand-primary" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-deep/40">Select source sample to initialize</p>
            </div>
          ) : (
            <div className="flex flex-col h-full bg-white">
              {/* Header Filters */}
              <div className="p-4 border-b border-brand-sage/10 flex items-center justify-between bg-brand-mist/5">
                <div className="flex items-center gap-4">
                  <span className="text-[10px] font-black text-brand-deep uppercase tracking-widest flex items-center gap-2">
                    <Filter className="w-3 h-3" /> Status Logic:
                  </span>
                  <div className="flex gap-1 bg-brand-mist/30 p-1 rounded-lg">
                    {["ALL", "IN_PROGRESS", "COMPLETED", "FAILED"].map((status) => (
                      <button
                        key={status}
                        onClick={() => setStatusFilter(status)}
                        className={`px-3 py-1 rounded-md text-[9px] font-black transition-all ${
                          statusFilter === status ? "bg-brand-deep text-white shadow-sm" : "text-brand-sage hover:text-brand-deep"
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="text-[10px] font-mono font-bold text-brand-primary bg-brand-primary/5 px-3 py-1 rounded-full border border-brand-primary/10">
                  ENGAGED: {filteredExecutions.length}
                </div>
              </div>

              {/* Scrollable List */}
              <div className="flex-1 overflow-auto custom-scrollbar p-6 space-y-6">
                <AnimatePresence mode="popLayout">
                  {filteredExecutions.map((execution, idx) => (
                    <motion.div
                      key={execution.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: idx * 0.04 }}
                      className="group bg-white border border-brand-sage/15 rounded-3xl p-6 hover:shadow-2xl hover:shadow-brand-primary/5 transition-all relative overflow-hidden"
                    >
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-4">
                          <div className={`p-3 rounded-2xl ${execution.status === 'FAILED' ? 'bg-rose-50' : 'bg-brand-mist'}`}>
                            {getStatusIcon(execution.status)}
                          </div>
                          <div>
                            <h4 className="text-sm font-black text-brand-deep uppercase tracking-tighter italic">
                              {execution.workflow_name}
                            </h4>
                            <div className="flex items-center gap-3 mt-1">
                              <StatusBadge status={execution.status} />
                              <span className="text-[9px] font-mono text-brand-sage opacity-40">#{execution.id}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[8px] font-black text-brand-sage uppercase tracking-widest opacity-60">Cycle Efficiency</p>
                          <p className="text-xs font-mono font-bold text-brand-deep">{getCycleTime(execution.started_at, execution.completed_at)}</p>
                        </div>
                      </div>

                      {/* Step Visualizer */}
                      <div className="grid grid-cols-1 gap-2">
                        {execution.step_executions?.map((step) => (
                          <div key={step.id} className="flex items-center justify-between p-3 rounded-xl bg-brand-mist/10 hover:bg-brand-mist/20 transition-colors group/step">
                            <div className="flex items-center gap-3">
                              <div className={`w-1.5 h-1.5 rounded-full ${step.status === 'COMPLETED' ? 'bg-emerald-500' : step.status === 'FAILED' ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]' : 'bg-brand-primary animate-pulse'}`} />
                              <span className="text-[10px] font-bold text-brand-deep uppercase group-hover/step:translate-x-1 transition-transform">
                                {step.test_type}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 font-mono text-[10px]">
                              {step.result_value && (
                                <span className="text-brand-primary font-bold">{step.result_value}</span>
                              )}
                              <span className="text-brand-sage opacity-60">
                                {getCycleTime(step.started_at, step.completed_at)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}
        </LabPanel>
      </main>
    </div>
  );
});

WorkflowsFeature.displayName = "WorkflowsFeature";
export default WorkflowsFeature;