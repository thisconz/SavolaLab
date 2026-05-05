import React, { memo, useState, useEffect, useRef } from "react";
import {
  Zap,
  Plus,
  AlertCircle,
  Clock,
  CheckCircle2,
  Factory,
  FileText,
  ArrowRight,
  Activity,
  RefreshCw,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { LabPanel } from "../../../shared/components/LabPanel";
import { MetricCard } from "../../../shared/components/MetricCard";
import { StatApi } from "../api/stat.api";
import { type StatRequest } from "../../../core/types";
import { useRealtime } from "../../../core/providers/RealtimeProvider";
import clsx from "clsx";
import { toast } from "sonner";

export const StatFeature: React.FC = memo(() => {
  const [stats, setStats] = useState<StatRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showNewForm, setShowNewForm] = useState(false);
  const [formData, setFormData] = useState({
    department: "",
    reason: "",
    urgency: "NORMAL",
  });
  const [submitting, setSubmitting] = useState(false);
  const [selectedStat, setSelectedStat] = useState<StatRequest | undefined>(undefined);
  const [newStatIds, setNewStatIds] = useState<Set<number>>(new Set()); // highlight newly arrived

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const { on } = useRealtime();

  const fetchStats = async (silent = false) => {
    if (!silent) setLoading(true);
    else setIsRefreshing(true);
    try {
      const data = await StatApi.getStats();
      setStats(data);
      if (data.length > 0 && !selectedStat && !showNewForm) setSelectedStat(data[0]);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  // Live updates via SSE
  useEffect(() => {
    const unsubCreated = on("STAT_CREATED", (data) => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
        debounceTimer.current = undefined;
      }
      debounceTimer.current = setTimeout(async () => {
        const updated = await StatApi.getStats();
        setStats(updated);
        // Mark newly arrived
        setNewStatIds((prev) => new Set([...prev, data.id]));
        setTimeout(
          () =>
            setNewStatIds((prev) => {
              const n = new Set(prev);
              n.delete(data.id);
              return n;
            }),
          3000,
        );
      }, 400);
    });

    const unsubUpdated = on("STAT_UPDATED", (data) => {
      setStats((prev) => prev.map((s) => (s.id === data.id ? { ...s, status: data.status as any } : s)));
      if (selectedStat?.id === data.id) {
        setSelectedStat((prev) => (prev ? { ...prev, status: data.status as any } : prev));
      }
    });

    return () => {
      unsubCreated();
      unsubUpdated();
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
        debounceTimer.current = undefined;
      }
    };
  }, [on, selectedStat]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.department.trim() || !formData.reason.trim()) return;
    setSubmitting(true);
    try {
      await StatApi.createStat(formData as any);
      setFormData({ department: "", reason: "", urgency: "NORMAL" });
      setShowNewForm(false);
      toast.success("STAT request submitted");
      // SSE will trigger a fetchStats automatically
    } finally {
      setSubmitting(false);
    }
  };

  const handleAcknowledge = async () => {
    if (!selectedStat) return;
    const newStatus = selectedStat.status === "OPEN" ? "IN_PROGRESS" : "CLOSED";
    await StatApi.updateStatStatus(selectedStat.id, newStatus);
    toast.success(`Request ${newStatus === "IN_PROGRESS" ? "acknowledged" : "closed"}`);
    // SSE will update state
  };

  const urgencyColor = (u?: string) =>
    ({
      CRITICAL: "text-red-500 bg-red-500/10 border-red-500/20",
      HIGH: "text-orange-500 bg-orange-500/10 border-orange-500/20",
      NORMAL: "text-brand-primary bg-brand-primary/10 border-brand-primary/20",
    })[u || "NORMAL"] ?? "text-brand-primary bg-brand-primary/10 border-brand-primary/20";

  const statusIcon = (s: string) =>
    ({
      CLOSED: <CheckCircle2 className="h-5 w-5 text-emerald-500" />,
      IN_PROGRESS: <Clock className="h-5 w-5 text-amber-500" />,
    })[s] ?? <AlertCircle className="text-brand-primary h-5 w-5" />;

  const active = stats.filter((s) => s.status !== "CLOSED").length;
  const critical = stats.filter((s) => s.urgency === "CRITICAL" && s.status !== "CLOSED").length;

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-3xl bg-(--color-zenthar-graphite)/30 p-2">
      {/* Header */}
      <div className="mb-4 flex shrink-0 items-center justify-between px-4">
        <div>
          <h2 className="font-display flex items-center gap-2 text-xl font-bold text-(--color-zenthar-text-primary)">
            <Zap className="text-brand-primary h-5 w-5" /> STATs
          </h2>
          <div className="mt-0.5 flex items-center gap-2">
            <p className="text-brand-sage font-mono text-[10px] tracking-widest uppercase">
              STAT requests for QC
            </p>
            {isRefreshing && (
              <span className="text-brand-primary flex items-center gap-1 text-[9px] font-bold">
                <RefreshCw size={9} className="animate-spin" /> Syncing
              </span>
            )}
          </div>
        </div>
        <button
          onClick={() => fetchStats(true)}
          className="border-brand-sage/20 group rounded-xl border bg-(--color-zenthar-graphite) p-2 transition-colors hover:bg-(--color-zenthar-graphite)/80"
        >
          <RefreshCw
            className={clsx(
              "text-brand-sage group-hover:text-brand-primary h-4 w-4",
              isRefreshing && "animate-spin",
            )}
          />
        </button>
      </div>

      {/* Metrics */}
      <div className="mb-6 grid shrink-0 grid-cols-3 gap-4">
        <MetricCard
          label="Active STATs"
          value={active}
          trend="Awaiting QC"
          icon={Activity}
          variant="primary"
        />

        <MetricCard
          label="Critical"
          value={critical}
          trend="Awaiting QC"
          icon={AlertCircle}
          variant="error"
        />

        <MetricCard
          label="Avg Response"
          value={"12 min"}
          trend="Awaiting QC"
          icon={Clock}
          variant="success"
        />
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-12 gap-6">
        {/* Queue */}
        <div className="col-span-5 flex flex-col gap-4 overflow-hidden">
          <LabPanel
            title="STAT Queue"
            icon={Zap}
            loading={loading}
            actions={
              <div className="flex items-center gap-2">
                {isRefreshing && <RefreshCw size={12} className="text-brand-sage animate-spin" />}
                <button
                  onClick={() => {
                    setShowNewForm(true);
                    setSelectedStat(undefined);
                  }}
                  className="bg-brand-primary hover:bg-brand-primary/90 flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-(--color-zenthar-void) shadow-md transition-all"
                >
                  <Plus className="h-3.5 w-3.5" /> New
                </button>
              </div>
            }
          >
            <div className="custom-scrollbar flex h-full flex-col gap-3 overflow-y-auto pr-2">
              {stats.length === 0 ? (
                <div className="text-brand-sage flex flex-1 flex-col items-center justify-center gap-4 py-10">
                  <Zap className="text-brand-primary h-10 w-10 opacity-20" />
                  <p className="text-xs font-black tracking-widest text-(--color-zenthar-text-primary) uppercase">
                    No STAT Requests
                  </p>
                </div>
              ) : (
                <AnimatePresence>
                  {stats.map((stat) => (
                    <motion.div
                      key={stat.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, height: 0 }}
                      onClick={() => {
                        setSelectedStat(stat);
                        setShowNewForm(false);
                      }}
                      className={clsx(
                        "group relative cursor-pointer overflow-hidden rounded-2xl border p-4 transition-all duration-300",
                        newStatIds.has(stat.id) && "ring-brand-primary ring-2 ring-offset-1",
                        selectedStat?.id === stat.id
                          ? "border-brand-primary scale-[1.01] bg-(--color-zenthar-carbon) shadow-lg"
                          : "border-brand-sage/20 hover:border-brand-primary/40 bg-(--color-zenthar-void)",
                      )}
                    >
                      {selectedStat?.id === stat.id && (
                        <motion.div
                          layoutId="activeStat"
                          className="bg-brand-primary absolute top-0 bottom-0 left-0 w-1.5 rounded-l-2xl"
                        />
                      )}
                      {newStatIds.has(stat.id) && (
                        <span className="text-brand-primary bg-brand-primary/10 absolute top-2 right-2 rounded px-1.5 py-0.5 text-[7px] font-black uppercase">
                          NEW
                        </span>
                      )}
                      <div className="mb-3 flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          {statusIcon(stat.status)}
                          <div>
                            <h4 className="group-hover:text-brand-primary text-sm font-bold tracking-tight text-(--color-zenthar-text-primary) transition-colors">
                              {stat.department}
                            </h4>
                            <span className="text-brand-sage/60 font-mono text-[9px] uppercase">
                              #{String(stat.id).padStart(4, "0")}
                            </span>
                          </div>
                        </div>
                        <span
                          className={clsx(
                            "rounded-full border px-2.5 py-1 text-[9px] font-black uppercase",
                            urgencyColor(stat.urgency),
                          )}
                        >
                          {stat.urgency ?? "NORMAL"}
                        </span>
                      </div>
                      <p className="line-clamp-2 pl-8 text-xs leading-relaxed text-(--color-zenthar-text-muted)">
                        {stat.reason}
                      </p>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>
          </LabPanel>
        </div>

        {/* Detail / Form */}
        <div className="col-span-7 flex flex-col overflow-hidden">
          <AnimatePresence mode="wait">
            {showNewForm ? (
              <motion.div
                key="form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="border-brand-sage/10 flex h-full flex-col rounded-2xl border bg-(--color-zenthar-carbon) p-8"
              >
                <div className="border-brand-sage/10 mb-8 flex items-center gap-4 border-b pb-6">
                  <div className="bg-brand-primary/10 border-brand-primary/20 text-brand-primary flex h-14 w-14 items-center justify-center rounded-2xl border">
                    <Zap className="h-7 w-7" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black tracking-tight text-(--color-zenthar-text-primary)">
                      New STAT Request
                    </h2>
                    <p className="text-brand-sage mt-1 text-xs font-bold tracking-widest uppercase">
                      Priority Analysis Required
                    </p>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-6">
                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <label className="text-brand-sage mb-2 block text-[9px] font-black tracking-widest uppercase">
                        Department *
                      </label>
                      <div className="relative">
                        <Factory className="text-brand-sage/40 absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2" />
                        <input
                          required
                          type="text"
                          value={formData.department}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              department: e.target.value,
                            })
                          }
                          placeholder="e.g. Refining Line A"
                          className="border-brand-sage/20 focus:border-brand-primary focus:ring-brand-primary/10 w-full rounded-xl border-2 bg-(--color-zenthar-void) py-3.5 pr-4 pl-11 text-sm font-bold text-(--color-zenthar-text-primary) transition-all outline-none focus:ring-4"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-brand-sage mb-2 block text-[9px] font-black tracking-widest uppercase">
                        Urgency
                      </label>
                      <div className="relative">
                        <AlertCircle className="text-brand-sage/40 absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2" />
                        <select
                          value={formData.urgency}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              urgency: e.target.value,
                            })
                          }
                          className="border-brand-sage/20 focus:border-brand-primary w-full cursor-pointer appearance-none rounded-xl border-2 bg-(--color-zenthar-void) py-3.5 pr-4 pl-11 text-sm font-bold text-(--color-zenthar-text-primary) outline-none"
                        >
                          <option value="NORMAL">Normal</option>
                          <option value="HIGH">High Priority</option>
                          <option value="CRITICAL">Critical Emergency</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-brand-sage mb-2 block text-[9px] font-black tracking-widest uppercase">
                      Reason *
                    </label>
                    <div className="relative">
                      <FileText className="text-brand-sage/40 absolute top-4 left-4 h-4 w-4" />
                      <textarea
                        required
                        value={formData.reason}
                        onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                        placeholder="Provide detailed reason for the STAT request..."
                        className="border-brand-sage/20 focus:border-brand-primary min-h-[120px] w-full resize-none rounded-xl border-2 bg-(--color-zenthar-void) py-3.5 pr-4 pl-11 text-sm font-bold text-(--color-zenthar-text-primary) outline-none"
                      />
                    </div>
                  </div>

                  <div className="mt-auto flex gap-3">
                    <button
                      type="button"
                      onClick={() => setShowNewForm(false)}
                      className="text-brand-sage rounded-xl px-6 py-3 text-xs font-bold transition-colors hover:bg-(--color-zenthar-void)"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting || !formData.department.trim() || !formData.reason.trim()}
                      className="bg-brand-primary hover:bg-brand-primary/90 flex items-center gap-2 rounded-xl px-6 py-3 text-xs font-bold text-(--color-zenthar-void) shadow-lg transition-all disabled:opacity-50"
                    >
                      {submitting ? (
                        <RefreshCw size={14} className="animate-spin" />
                      ) : (
                        <ArrowRight size={14} />
                      )}
                      {submitting ? "Submitting..." : "Submit Request"}
                    </button>
                  </div>
                </form>
              </motion.div>
            ) : selectedStat ? (
              <motion.div
                key={`detail-${selectedStat.id}`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="border-brand-sage/10 relative flex h-full flex-col overflow-hidden rounded-2xl border bg-(--color-zenthar-carbon) p-8"
              >
                <div className="border-brand-sage/10 mb-8 flex items-start justify-between border-b pb-6">
                  <div>
                    <div className="mb-3 flex items-center gap-3">
                      <span
                        className={clsx(
                          "rounded-full border px-3 py-1.5 text-[9px] font-black uppercase",
                          urgencyColor(selectedStat.urgency),
                        )}
                      >
                        {selectedStat.urgency ?? "NORMAL"}
                      </span>
                      <span className="font-mono text-[9px] text-(--color-zenthar-text-muted)">
                        STAT-{String(selectedStat.id).padStart(4, "0")}
                      </span>
                    </div>
                    <h2 className="text-3xl font-black tracking-tight text-(--color-zenthar-text-primary) uppercase">
                      {selectedStat.department}
                    </h2>
                  </div>
                  <div className="text-right">
                    <p className="text-brand-sage mb-1 text-[9px] font-black tracking-widest uppercase">
                      Submitted
                    </p>
                    <p className="font-mono text-sm text-(--color-zenthar-text-primary)">
                      {new Date(selectedStat.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="custom-scrollbar grid flex-1 grid-cols-12 gap-6 overflow-y-auto">
                  <div className="col-span-8 space-y-6">
                    <div>
                      <h3 className="text-brand-sage mb-3 flex items-center gap-2 text-[9px] font-black tracking-widest uppercase">
                        <FileText size={12} /> Request Details
                      </h3>
                      <div className="border-brand-sage/20 relative overflow-hidden rounded-2xl border bg-(--color-zenthar-void) p-6">
                        <div className="bg-brand-primary/30 absolute top-0 bottom-0 left-0 w-1.5" />
                        <p className="pl-2 text-sm leading-relaxed whitespace-pre-wrap text-(--color-zenthar-text-primary)">
                          {selectedStat.reason}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="col-span-4">
                    <div className="border-brand-sage/20 rounded-2xl border bg-(--color-zenthar-void) p-5">
                      <h3 className="text-brand-sage mb-4 text-[9px] font-black tracking-widest uppercase">
                        Status
                      </h3>
                      <div
                        className={clsx(
                          "flex flex-col items-center rounded-xl border p-5 text-center",
                          selectedStat.status === "CLOSED"
                            ? "border-emerald-500/30"
                            : selectedStat.status === "IN_PROGRESS"
                              ? "border-amber-500/30"
                              : "border-brand-primary/20",
                        )}
                      >
                        <div className="mb-3">{statusIcon(selectedStat.status)}</div>
                        <p className="text-sm font-bold text-(--color-zenthar-text-primary)">
                          {selectedStat.status}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {selectedStat.status !== "CLOSED" && (
                  <div className="border-brand-sage/10 mt-6 flex justify-end border-t pt-5">
                    <button
                      onClick={handleAcknowledge}
                      className="bg-brand-primary hover:bg-brand-primary/90 flex items-center gap-2 rounded-2xl px-6 py-3 text-sm font-bold text-(--color-zenthar-void) shadow-xl transition-all"
                    >
                      {selectedStat.status === "OPEN" ? "Acknowledge" : "Mark Completed"}
                      <ArrowRight size={16} />
                    </button>
                  </div>
                )}
              </motion.div>
            ) : (
              <div className="border-brand-sage/10 text-brand-sage flex h-full flex-col items-center justify-center gap-4 rounded-2xl border bg-(--color-zenthar-carbon)">
                <Zap className="text-brand-primary h-12 w-12 opacity-20" />
                <p className="text-sm font-black tracking-widest text-(--color-zenthar-text-primary) uppercase">
                  Select a STAT Request
                </p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
});

StatFeature.displayName = "StatFeature";
export default StatFeature;
