import React, { memo, useState, useEffect, useMemo } from "react";
import {
  ListChecks,
  Search,
  Filter,
  Clock,
  CheckCircle2,
  XCircle,
  Play,
  History,
} from "lucide-react";
import { LabPanel } from "../../../ui/components/LabPanel";
import { LabApi } from "../../lab/api/lab.api";
import { WorkflowApi } from "../api/workflow.api";
import { WorkflowExecution } from "../../../core/types";
import type { Sample } from "../../../core/types";
import { motion, AnimatePresence } from "motion/react";

type ExecutionWithWorkflow = WorkflowExecution & { workflow_name: string };

/**
 * WorkflowsFeature Component
 * 
 * Manages and visualizes the execution of laboratory workflows for specific samples.
 * It provides a detailed view of the step-by-step progress of complex testing procedures.
 * 
 * Features:
 * - Sample selection with search and filtering capabilities.
 * - Visualization of workflow executions associated with a selected sample.
 * - Detailed status tracking for individual workflow steps (e.g., IN_PROGRESS, COMPLETED, FAILED).
 * - Historical execution data for audit and traceability purposes.
 */
export const WorkflowsFeature: React.FC = memo(() => {
  const [samples, setSamples] = useState<Sample[]>([]);
  const [selectedSample, setSelectedSample] = useState<Sample | null>(null);
  const [executions, setExecutions] = useState<ExecutionWithWorkflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  useEffect(() => {
    const loadSamples = async () => {
      try {
        const data = await LabApi.getSamples();
        setSamples(data);
      } catch (err: any) {
        if (err?.status !== 401 && err?.status !== 403) {
          console.error("Failed to load samples", err);
        }
      } finally {
        setLoading(false);
      }
    };
    loadSamples();
  }, []);

  useEffect(() => {
    if (selectedSample) {
      const loadExecutions = async () => {
        try {
          const data = await WorkflowApi.getWorkflowExecutions(
            selectedSample.id,
          );
          setExecutions(data);
        } catch (err: any) {
          if (err?.status !== 401 && err?.status !== 403) {
            console.error("Failed to load executions", err);
          }
        }
      };
      loadExecutions();
    } else {
      setExecutions([]);
    }
  }, [selectedSample]);

  const filteredSamples = useMemo(() => {
    return samples.filter(
      (s) =>
        (s.batch_id &&
          String(s.batch_id)
            .toLowerCase()
            .includes(searchQuery.toLowerCase())) ||
        (s.sugar_stage &&
          String(s.sugar_stage)
            .toLowerCase()
            .includes(searchQuery.toLowerCase())) ||
        (s.source_stage &&
          String(s.source_stage)
            .toLowerCase()
            .includes(searchQuery.toLowerCase())),
    );
  }, [samples, searchQuery]);

  const filteredExecutions = useMemo(() => {
    if (statusFilter === "ALL") return executions;
    return executions.filter((e) => e.status === statusFilter);
  }, [executions, statusFilter]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case "FAILED":
        return <XCircle className="w-4 h-4 text-lab-laser" />;
      case "IN_PROGRESS":
        return <Play className="w-4 h-4 text-brand-primary animate-pulse" />;
      default:
        return <Clock className="w-4 h-4 text-brand-sage" />;
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="grid grid-cols-12 gap-6 h-full overflow-hidden">
      {/* Sample List Sidebar */}
      <div className="col-span-4 flex flex-col gap-6 overflow-hidden">
        <LabPanel title="Sample Queue" icon={History} loading={loading}>
          <div className="flex flex-col h-full">
            <div className="p-4 border-b border-brand-sage/10 bg-brand-mist/10">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-brand-sage" />
                <input
                  type="text"
                  placeholder="Search Batch ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white border border-brand-sage/20 rounded-lg pl-9 pr-3 py-2 text-[10px] font-mono focus:outline-none focus:ring-2 focus:ring-brand-primary/20 text-brand-deep transition-all"
                />
              </div>
            </div>

            <div className="flex-1 overflow-auto custom-scrollbar">
              {filteredSamples.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-brand-sage opacity-50 py-20">
                  <div className="p-4 bg-brand-mist rounded-full mb-4">
                    <Search className="w-6 h-6 text-brand-sage/50" />
                  </div>
                  <p className="text-[10px] font-mono uppercase tracking-widest">
                    No samples found
                  </p>
                </div>
              ) : (
                <div className="p-2 space-y-1">
                  {filteredSamples.map((sample) => (
                    <button
                      key={sample.id}
                      onClick={() => setSelectedSample(sample)}
                      className={`w-full text-left p-4 rounded-2xl transition-all border relative overflow-hidden group ${
                        selectedSample?.id === sample.id
                          ? "bg-brand-primary border-brand-primary text-white shadow-xl shadow-brand-primary/20"
                          : "bg-white border-brand-sage/10 hover:border-brand-primary/30 text-brand-deep hover:shadow-md"
                      }`}
                    >
                      {/* Corner Accent */}
                      <div
                        className={`absolute top-0 right-0 w-6 h-6 pointer-events-none overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity ${selectedSample?.id === sample.id ? "opacity-100" : ""}`}
                      >
                        <div className="absolute top-0 right-0 w-full h-full bg-white/20 rotate-45 translate-x-1/2 -translate-y-1/2" />
                      </div>

                      <div className="flex justify-between items-start mb-2 relative z-10">
                        <span className="text-xs font-black font-mono tracking-wider">
                          {sample.batch_id}
                        </span>
                        <span
                          className={`text-[8px] px-1.5 py-0.5 rounded font-black uppercase tracking-widest ${
                            selectedSample?.id === sample.id
                              ? "bg-white/20"
                              : "bg-brand-mist/50"
                          }`}
                        >
                          {sample.priority}
                        </span>
                      </div>
                      <div
                        className={`text-[9px] uppercase tracking-0.1em font-bold opacity-70 relative z-10 ${
                          selectedSample?.id === sample.id
                            ? "text-white"
                            : "text-brand-sage"
                        }`}
                      >
                        {sample.sugar_stage}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </LabPanel>
      </div>

      {/* Execution History Main Area */}
      <div className="col-span-8 flex flex-col gap-6 overflow-hidden">
        <LabPanel
          title={
            selectedSample
              ? `Execution History: ${selectedSample.batch_id}`
              : "Workflow Executions"
          }
          icon={ListChecks}
        >
          {!selectedSample ? (
            <div className="h-full flex flex-col items-center justify-center text-brand-sage gap-6 bg-white/50 rounded-3xl border border-brand-sage/10 relative overflow-hidden group">
              <div className="absolute inset-0 bg-brand-primary/5 rounded-full blur-3xl scale-150 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              <div className="p-6 bg-brand-mist rounded-full border border-brand-sage/20 relative z-10">
                <ListChecks className="w-16 h-16 opacity-40 text-brand-primary group-hover:opacity-80 transition-opacity duration-300" />
              </div>
              <p className="text-sm font-black text-brand-deep uppercase tracking-[0.2em] relative z-10">
                Select a sample to view history
              </p>
            </div>
          ) : (
            <div className="flex flex-col h-full">
              {/* Filters */}
              <div className="p-4 border-b border-brand-sage/10 flex items-center justify-between bg-brand-mist/5">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Filter className="w-3.5 h-3.5 text-brand-sage" />
                    <span className="text-[10px] font-bold text-brand-deep uppercase tracking-widest">
                      Filter Status:
                    </span>
                  </div>
                  <div className="flex gap-1">
                    {[
                      "ALL",
                      "PENDING",
                      "IN_PROGRESS",
                      "COMPLETED",
                      "FAILED",
                    ].map((status) => (
                      <button
                        key={status}
                        onClick={() => setStatusFilter(status)}
                        className={`px-2 py-1 rounded text-[9px] font-bold uppercase tracking-tighter transition-all ${
                          statusFilter === status
                            ? "bg-brand-deep text-white"
                            : "bg-brand-mist/50 text-brand-sage hover:bg-brand-mist"
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="text-[10px] font-mono text-brand-sage uppercase">
                  Total: {filteredExecutions.length}
                </div>
              </div>

              {/* Executions List */}
              <div className="flex-1 overflow-auto custom-scrollbar p-6">
                <AnimatePresence mode="wait">
                  {filteredExecutions.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="h-full flex flex-col items-center justify-center text-brand-sage opacity-50 py-20"
                    >
                      <div className="p-4 bg-brand-mist rounded-full mb-4">
                        <Filter className="w-6 h-6 text-brand-sage/50" />
                      </div>
                      <p className="text-[10px] font-mono uppercase tracking-widest">
                        No executions found for this filter
                      </p>
                    </motion.div>
                  ) : (
                    <div className="space-y-4">
                      {filteredExecutions.map((execution, idx) => (
                        <motion.div
                          key={execution.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="group bg-white border border-brand-sage/10 rounded-2xl p-6 hover:border-brand-primary/30 transition-all hover:shadow-2xl hover:shadow-brand-mist/50 relative overflow-hidden"
                        >
                          {/* Corner Accent */}
                          <div
                            className={`absolute top-0 right-0 w-12 h-12 pointer-events-none overflow-hidden opacity-10`}
                          >
                            <div
                              className={`absolute top-0 right-0 w-full h-full rotate-45 translate-x-1/2 -translate-y-1/2 ${
                                execution.status === "COMPLETED"
                                  ? "bg-emerald-500"
                                  : execution.status === "FAILED"
                                    ? "bg-rose-500"
                                    : "bg-brand-primary"
                              }`}
                            />
                          </div>

                          <div className="flex items-center justify-between mb-6 relative z-10">
                            <div className="flex items-center gap-4">
                              <div
                                className={`p-3 rounded-xl transition-all duration-500 ${
                                  execution.status === "COMPLETED"
                                    ? "bg-emerald-50 text-emerald-600 shadow-sm"
                                    : execution.status === "FAILED"
                                      ? "bg-rose-50 text-rose-600 shadow-sm"
                                      : "bg-brand-mist text-brand-primary"
                                }`}
                              >
                                {getStatusIcon(execution.status)}
                              </div>
                              <div>
                                <h4 className="text-sm font-black text-brand-deep uppercase tracking-0.1em">
                                  {execution.workflow_name}
                                </h4>
                                <div className="flex items-center gap-2 mt-1">
                                  <span
                                    className={`text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-widest border ${
                                      execution.status === "COMPLETED"
                                        ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                                        : execution.status === "FAILED"
                                          ? "bg-rose-50 border-rose-200 text-rose-700"
                                          : execution.status === "IN_PROGRESS"
                                            ? "bg-brand-mist border-brand-primary/20 text-brand-primary"
                                            : "bg-brand-mist border-brand-sage/20 text-brand-sage"
                                    }`}
                                  >
                                    {execution.status}
                                  </span>
                                  <span className="text-[9px] font-mono text-brand-sage uppercase tracking-tighter opacity-50">
                                    EXEC_ID: #{execution.id}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-[9px] font-black text-brand-sage uppercase tracking-[0.2em] mb-1 opacity-50">
                                Cycle Time
                              </div>
                              <div className="text-xs font-mono font-bold text-brand-deep">
                                {execution.completed_at
                                  ? `${Math.round((new Date(execution.completed_at).getTime() - new Date(execution.started_at).getTime()) / 1000 / 60)}m ${Math.round(((new Date(execution.completed_at).getTime() - new Date(execution.started_at).getTime()) / 1000) % 60)}s`
                                  : "ACTIVE"}
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-8 pt-6 border-t border-brand-sage/5 mb-6 relative z-10">
                            <div className="space-y-1.5">
                              <div className="text-[8px] font-black text-brand-sage uppercase tracking-[0.2em] flex items-center gap-1.5 opacity-50">
                                <Clock className="w-2.5 h-2.5" /> Start Sequence
                              </div>
                              <div className="text-[11px] font-black text-brand-deep uppercase font-mono tracking-tight">
                                {formatDate(execution.started_at)}
                              </div>
                            </div>
                            <div className="space-y-1.5">
                              <div className="text-[8px] font-black text-brand-sage uppercase tracking-[0.2em] flex items-center gap-1.5 opacity-50">
                                <CheckCircle2 className="w-2.5 h-2.5" /> End
                                Sequence
                              </div>
                              <div className="text-[11px] font-black text-brand-deep uppercase font-mono tracking-tight">
                                {formatDate(execution.completed_at)}
                              </div>
                            </div>
                          </div>

                          {/* Step Tracking */}
                          {execution.step_executions &&
                            execution.step_executions.length > 0 && (
                              <div className="bg-brand-mist/10 rounded-2xl p-5 space-y-4 border border-brand-sage/5 relative z-10">
                                <div className="text-[9px] font-black text-brand-deep uppercase tracking-[0.2em] mb-2 border-b border-brand-sage/10 pb-3 flex justify-between items-center">
                                  <span>Step-Level Performance Metrics</span>
                                  <span className="text-[8px] font-mono text-brand-sage opacity-50">
                                    {execution.step_executions.length} STEPS
                                    TOTAL
                                  </span>
                                </div>
                                <div className="space-y-3">
                                  {execution.step_executions.map(
                                    (step, sIdx) => (
                                      <div
                                        key={step.id}
                                        className="flex items-center justify-between text-[10px] group/step"
                                      >
                                        <div className="flex items-center gap-3">
                                          <div
                                            className={`w-2 h-2 rounded-full shadow-sm ${
                                              step.status === "COMPLETED"
                                                ? "bg-emerald-500"
                                                : step.status === "FAILED"
                                                  ? "bg-rose-500"
                                                  : step.status ===
                                                      "IN_PROGRESS"
                                                    ? "bg-brand-primary animate-pulse"
                                                    : "bg-brand-sage/30"
                                            }`}
                                          />
                                          <span className="font-black text-brand-deep uppercase tracking-tight group-hover/step:text-brand-primary transition-colors">
                                            S{step.sequence_order} •{" "}
                                            {step.test_type}
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-6 font-mono text-brand-sage">
                                          {step.result_value !== undefined &&
                                            step.result_value !== null && (
                                              <span className="text-brand-primary font-bold bg-brand-primary/5 px-2 py-0.5 rounded border border-brand-primary/10">
                                                {step.result_value}
                                              </span>
                                            )}
                                          <span
                                            className={`text-[9px] font-bold ${step.status === "FAILED" ? "text-rose-500" : ""}`}
                                          >
                                            {step.status}
                                          </span>
                                          <span className="w-20 text-right font-bold text-brand-deep">
                                            {step.started_at &&
                                            step.completed_at
                                              ? `${Math.round((new Date(step.completed_at).getTime() - new Date(step.started_at).getTime()) / 1000)}s`
                                              : step.started_at
                                                ? "..."
                                                : "-"}
                                          </span>
                                        </div>
                                      </div>
                                    ),
                                  )}
                                </div>
                              </div>
                            )}
                        </motion.div>
                      ))}
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}
        </LabPanel>
      </div>
    </div>
  );
});

WorkflowsFeature.displayName = "WorkflowsFeature";
export default WorkflowsFeature;
