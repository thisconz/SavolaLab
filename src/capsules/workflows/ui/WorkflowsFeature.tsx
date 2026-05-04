import React, { memo, useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  ListChecks,
  Search,
  Clock,
  CheckCircle2,
  XCircle,
  Play,
  History,
  AlertCircle,
  Plus,
  RefreshCw,
  Zap,
} from "lucide-react";
import { LabPanel } from "../../../shared/components/LabPanel";
import { LabApi } from "../../lab/api/lab.api";
import { WorkflowApi } from "../api/workflow.api";
import { WorkflowExecution, Sample } from "../../../core/types";
import { useRealtime } from "../../../core/providers/RealtimeProvider";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";

type ExecutionWithWorkflow = WorkflowExecution & { workflow_name: string };

const formatDate = (d?: string) =>
  d
    ? new Date(d).toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

const getCycleTime = (start?: string, end?: string) => {
  if (!start) return "—";
  if (!end) return "Active";
  const ms = new Date(end).getTime() - new Date(start).getTime();
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${m}m ${s}s`;
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const styles: Record<string, string> = {
    COMPLETED: "bg-emerald-500/10 border-emerald-500/20 text-emerald-500",
    FAILED: "bg-rose-500/10    border-rose-500/20    text-rose-500",
    IN_PROGRESS: "bg-brand-primary/10 border-brand-primary/20 text-brand-primary",
  };
  return (
    <span
      className={clsx(
        "rounded border px-2 py-0.5 text-[9px] font-black tracking-widest uppercase",
        styles[status] ?? "border-brand-sage/20 text-brand-sage bg-(--color-zenthar-void)",
      )}
    >
      {status}
    </span>
  );
};

export const WorkflowsFeature: React.FC = memo(() => {
  const [samples, setSamples] = useState<Sample[]>([]);
  const [selectedSample, setSelectedSample] = useState<Sample | null>(null);
  const [executions, setExecutions] = useState<ExecutionWithWorkflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [exLoading, setExLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [liveExIds, setLiveExIds] = useState<Set<number>>(new Set()); // pulsing active executions

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const { on } = useRealtime();

  useEffect(() => {
    LabApi.getSamples()
      .then(setSamples)
      .finally(() => setLoading(false));
  }, []);

  const loadExecutions = useCallback(async (sample: Sample) => {
    setExLoading(true);
    setExecutions([]);
    try {
      const data = await WorkflowApi.getWorkflowExecutions(sample.id);
      setExecutions(data);
      // Mark in-progress executions
      const inProgress = new Set(data.filter((e) => e.status === "IN_PROGRESS").map((e) => e.id));
      setLiveExIds(inProgress);
    } finally {
      setExLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedSample) loadExecutions(selectedSample);
  }, [selectedSample, loadExecutions]);

  // Live SSE: refresh executions when workflow events arrive
  useEffect(() => {
    const refresh = () => {
      if (!selectedSample) return;
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
        debounceTimer.current = undefined;
      }
      debounceTimer.current = setTimeout(() => loadExecutions(selectedSample), 600);
    };

    const unsubs = [
      on("WORKFLOW_STARTED", refresh),
      on("WORKFLOW_COMPLETED", (data) => {
        setLiveExIds((prev) => {
          const n = new Set(prev);
          n.delete(data.execution_id);
          return n;
        });
        refresh();
      }),
      on("TEST_SUBMITTED", refresh),
    ];

    return () => {
      unsubs.forEach((u) => u());
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
        debounceTimer.current = undefined;
      }
    };
  }, [on, selectedSample, loadExecutions]);

  const filteredSamples = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return samples.filter(
      (s) =>
        !q ||
        [s.batch_id, s.source_stage, s.sample_type].some((v) =>
          String(v ?? "")
            .toLowerCase()
            .includes(q),
        ),
    );
  }, [samples, searchQuery]);

  const filteredExecutions = useMemo(
    () => (statusFilter === "ALL" ? executions : executions.filter((e) => e.status === statusFilter)),
    [executions, statusFilter],
  );

  const statusIcon = (status: string) =>
    ({
      COMPLETED: <CheckCircle2 className="h-4 w-4 text-emerald-500" />,
      FAILED: <XCircle className="h-4 w-4 text-rose-500" />,
      IN_PROGRESS: <Play className="text-brand-primary h-4 w-4 animate-pulse" />,
    })[status] ?? <Clock className="text-brand-sage h-4 w-4" />;

  return (
    <div className="grid h-full grid-cols-12 gap-6 overflow-hidden rounded-3xl bg-(--color-zenthar-graphite)/30 p-4">
      {/* Sample selector */}
      <aside className="col-span-12 flex flex-col gap-6 overflow-hidden lg:col-span-4">
        <LabPanel title="Sample Queue" icon={History} loading={loading}>
          <div className="flex h-full flex-col bg-(--color-zenthar-carbon)/50">
            <div className="border-brand-sage/10 border-b p-4">
              <div className="relative">
                <Search className="text-brand-sage/40 absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter batch ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="border-brand-sage/20 focus:ring-brand-primary/20 w-full rounded-xl border bg-(--color-zenthar-void) py-2.5 pr-3 pl-9 font-mono text-[10px] text-white transition-all outline-none focus:ring-2"
                />
              </div>
            </div>
            <div className="custom-scrollbar flex-1 space-y-2 overflow-auto p-3">
              {filteredSamples.map((sample) => (
                <button
                  key={sample.id}
                  onClick={() => setSelectedSample(sample)}
                  className={clsx(
                    "group w-full rounded-2xl border p-4 text-left transition-all",
                    selectedSample?.id === sample.id
                      ? "bg-brand-primary border-brand-primary text-white shadow-lg"
                      : "border-brand-sage/10 hover:border-brand-primary/30 bg-(--color-zenthar-void) text-white",
                  )}
                >
                  <div className="mb-1 flex items-start justify-between">
                    <span className="font-mono text-xs font-black tracking-wide">{sample.batch_id}</span>
                    <span
                      className={clsx(
                        "rounded px-1.5 py-0.5 text-[8px] font-black uppercase",
                        selectedSample?.id === sample.id ? "bg-white/20" : "bg-(--color-zenthar-carbon)",
                      )}
                    >
                      {sample.priority}
                    </span>
                  </div>
                  <div
                    className={clsx(
                      "text-[9px] font-bold uppercase opacity-70",
                      selectedSample?.id === sample.id ? "text-white" : "text-brand-sage",
                    )}
                  >
                    {sample.source_stage ?? sample.sample_type}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </LabPanel>
      </aside>

      {/* Execution viewer */}
      <main className="col-span-12 flex flex-col gap-6 overflow-hidden lg:col-span-8">
        <LabPanel
          title={selectedSample ? `Traceability: ${selectedSample.batch_id}` : "Workflow Monitor"}
          icon={ListChecks}
          loading={exLoading}
        >
          {!selectedSample ? (
            <div className="text-brand-sage flex h-full flex-col items-center justify-center gap-3">
              <ListChecks className="text-brand-primary h-12 w-12 opacity-20" />
              <p className="text-[10px] font-black tracking-[0.3em] text-white/40 uppercase">
                Select a sample to view executions
              </p>
            </div>
          ) : (
            <div className="flex h-full flex-col bg-(--color-zenthar-carbon)">
              {/* Filter toolbar */}
              <div className="border-brand-sage/10 flex flex-wrap items-center justify-between gap-3 border-b p-4">
                <div className="flex gap-1 rounded-xl bg-(--color-zenthar-void) p-1">
                  {["ALL", "IN_PROGRESS", "COMPLETED", "FAILED"].map((s) => (
                    <button
                      key={s}
                      onClick={() => setStatusFilter(s)}
                      className={clsx(
                        "rounded-lg px-3 py-1.5 text-[9px] font-black uppercase transition-all",
                        statusFilter === s
                          ? "bg-brand-primary text-white shadow-sm"
                          : "text-brand-sage hover:text-white",
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
                <span className="text-brand-primary font-mono text-[10px]">
                  {filteredExecutions.length} execution
                  {filteredExecutions.length !== 1 ? "s" : ""}
                </span>
              </div>

              {/* Execution list */}
              <div className="custom-scrollbar flex-1 space-y-5 overflow-auto p-5">
                <AnimatePresence mode="popLayout">
                  {filteredExecutions.length === 0 ? (
                    <div className="text-brand-sage flex h-48 flex-col items-center justify-center gap-3">
                      <ListChecks className="h-8 w-8 opacity-20" />
                      <p className="text-[10px] font-black tracking-widest uppercase opacity-50">
                        No executions found
                      </p>
                    </div>
                  ) : (
                    filteredExecutions.map((execution, idx) => (
                      <motion.div
                        key={execution.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ delay: idx * 0.04 }}
                        className={clsx(
                          "rounded-3xl border bg-(--color-zenthar-void) p-6 transition-all",
                          liveExIds.has(execution.id)
                            ? "border-brand-primary/40 shadow-brand-primary/10 shadow-lg"
                            : "border-brand-sage/15",
                        )}
                      >
                        {/* Execution header */}
                        <div className="mb-5 flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div
                              className={clsx(
                                "rounded-xl p-2.5",
                                execution.status === "FAILED"
                                  ? "bg-rose-500/10"
                                  : "bg-(--color-zenthar-carbon)",
                              )}
                            >
                              {statusIcon(execution.status)}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-sm font-black tracking-tight text-white uppercase">
                                  {(execution as any).workflow_name}
                                </h4>
                                {liveExIds.has(execution.id) && (
                                  <span className="text-brand-primary bg-brand-primary/10 flex items-center gap-1 rounded-full px-2 py-0.5 text-[8px] font-black uppercase">
                                    <Zap size={8} /> LIVE
                                  </span>
                                )}
                              </div>
                              <div className="mt-1 flex items-center gap-2">
                                <StatusBadge status={execution.status} />
                                <span className="text-brand-sage/40 font-mono text-[9px]">
                                  #{execution.id}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-brand-sage/50 text-[8px] font-black uppercase">Cycle Time</p>
                            <p className="font-mono text-xs font-bold text-white">
                              {getCycleTime(execution.started_at, execution.completed_at)}
                            </p>
                          </div>
                        </div>

                        {/* Steps */}
                        <div className="space-y-2">
                          {(execution as any).step_executions?.map((step: any) => (
                            <div
                              key={step.id}
                              className="flex items-center justify-between rounded-xl bg-(--color-zenthar-carbon)/50 p-3 transition-colors hover:bg-(--color-zenthar-carbon)"
                            >
                              <div className="flex items-center gap-3">
                                <div
                                  className={clsx(
                                    "h-2 w-2 rounded-full",
                                    step.status === "COMPLETED"
                                      ? "bg-emerald-500"
                                      : step.status === "FAILED"
                                        ? "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]"
                                        : step.status === "IN_PROGRESS"
                                          ? "bg-brand-primary animate-pulse"
                                          : "bg-brand-sage/20",
                                  )}
                                />
                                <span className="text-[10px] font-bold text-white uppercase">
                                  {step.test_type}
                                </span>
                                <span className="text-brand-sage/30 font-mono text-[8px]">
                                  step {step.sequence_order}
                                </span>
                              </div>
                              <div className="flex items-center gap-4 font-mono text-[10px]">
                                {step.result_value != null && (
                                  <span className="text-brand-primary font-bold">{step.result_value}</span>
                                )}
                                <span className="text-brand-sage/50">
                                  {getCycleTime(step.started_at, step.completed_at)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    ))
                  )}
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
