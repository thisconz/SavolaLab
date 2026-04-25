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
import { motion, AnimatePresence } from "@/src/lib/motion";
import { LabPanel } from "../../../shared/components/LabPanel";
import { MetricCard } from "../../../shared/components/MetricCard";
import { StatApi } from "../api/stat.api";
import { StatRequest } from "../../../core/types";
import { useRealtime } from "../../../core/providers/RealtimeProvider";
import clsx from "@/src/lib/clsx";
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
  const [selectedStat, setSelectedStat] = useState<StatRequest | null>(null);
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
      setStats((prev) =>
        prev.map((s) => (s.id === data.id ? { ...s, status: data.status as any } : s)),
      );
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
      CLOSED: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
      IN_PROGRESS: <Clock className="w-5 h-5 text-amber-500" />,
    })[s] ?? <AlertCircle className="w-5 h-5 text-brand-primary" />;

  const active = stats.filter((s) => s.status !== "CLOSED").length;
  const critical = stats.filter((s) => s.urgency === "CRITICAL" && s.status !== "CLOSED").length;

  return (
    <div className="flex flex-col h-full overflow-hidden bg-(--color-zenthar-graphite)/30 p-2 rounded-3xl">
      {/* Header */}
      <div className="flex items-center justify-between px-4 mb-4 shrink-0">
        <div>
          <h2 className="text-xl font-display font-bold text-(--color-zenthar-text-primary) flex items-center gap-2">
            <Zap className="w-5 h-5 text-brand-primary" /> STATs
          </h2>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-[10px] font-mono text-brand-sage uppercase tracking-widest">
              STAT requests for QC
            </p>
            {isRefreshing && (
              <span className="flex items-center gap-1 text-[9px] font-bold text-brand-primary">
                <RefreshCw size={9} className="animate-spin" /> Syncing
              </span>
            )}
          </div>
        </div>
        <button
          onClick={() => fetchStats(true)}
          className="p-2 rounded-xl border border-brand-sage/20 bg-(--color-zenthar-graphite) hover:bg-(--color-zenthar-graphite)/80 transition-colors group"
        >
          <RefreshCw
            className={clsx(
              "w-4 h-4 text-brand-sage group-hover:text-brand-primary",
              isRefreshing && "animate-spin",
            )}
          />
        </button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-4 shrink-0 mb-6">
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

      <div className="flex-1 grid grid-cols-12 gap-6 min-h-0">
        {/* Queue */}
        <div className="col-span-5 flex flex-col gap-4 overflow-hidden">
          <LabPanel
            title="STAT Queue"
            icon={Zap}
            loading={loading}
            actions={
              <div className="flex items-center gap-2">
                {isRefreshing && <RefreshCw size={12} className="animate-spin text-brand-sage" />}
                <button
                  onClick={() => {
                    setShowNewForm(true);
                    setSelectedStat(null);
                  }}
                  className="flex items-center gap-2 px-3 py-2 bg-brand-primary text-(--color-zenthar-void) rounded-xl text-xs font-bold hover:bg-brand-primary/90 transition-all shadow-md"
                >
                  <Plus className="w-3.5 h-3.5" /> New
                </button>
              </div>
            }
          >
            <div className="flex flex-col h-full overflow-y-auto custom-scrollbar pr-2 gap-3">
              {stats.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-4 text-brand-sage py-10">
                  <Zap className="w-10 h-10 opacity-20 text-brand-primary" />
                  <p className="text-xs font-black uppercase tracking-widest text-(--color-zenthar-text-primary)">
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
                        "p-4 rounded-2xl border transition-all duration-300 cursor-pointer group relative overflow-hidden",
                        newStatIds.has(stat.id) && "ring-2 ring-brand-primary ring-offset-1",
                        selectedStat?.id === stat.id
                          ? "bg-(--color-zenthar-carbon) border-brand-primary shadow-lg scale-[1.01]"
                          : "bg-(--color-zenthar-void) border-brand-sage/20 hover:border-brand-primary/40",
                      )}
                    >
                      {selectedStat?.id === stat.id && (
                        <motion.div
                          layoutId="activeStat"
                          className="absolute left-0 top-0 bottom-0 w-1.5 bg-brand-primary rounded-l-2xl"
                        />
                      )}
                      {newStatIds.has(stat.id) && (
                        <span className="absolute top-2 right-2 text-[7px] font-black text-brand-primary uppercase bg-brand-primary/10 px-1.5 py-0.5 rounded">
                          NEW
                        </span>
                      )}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          {statusIcon(stat.status)}
                          <div>
                            <h4 className="text-sm font-bold text-(--color-zenthar-text-primary) group-hover:text-brand-primary transition-colors tracking-tight">
                              {stat.department}
                            </h4>
                            <span className="text-[9px] font-mono text-brand-sage/60 uppercase">
                              #{String(stat.id).padStart(4, "0")}
                            </span>
                          </div>
                        </div>
                        <span
                          className={clsx(
                            "px-2.5 py-1 rounded-full text-[9px] font-black uppercase border",
                            urgencyColor(stat.urgency),
                          )}
                        >
                          {stat.urgency ?? "NORMAL"}
                        </span>
                      </div>
                      <p className="text-xs text-(--color-zenthar-text-muted) line-clamp-2 leading-relaxed pl-8">
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
                className="h-full bg-(--color-zenthar-carbon) rounded-2xl border border-brand-sage/10 p-8 flex flex-col"
              >
                <div className="flex items-center gap-4 mb-8 pb-6 border-b border-brand-sage/10">
                  <div className="w-14 h-14 rounded-2xl bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center text-brand-primary">
                    <Zap className="w-7 h-7" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-(--color-zenthar-text-primary) tracking-tight">
                      New STAT Request
                    </h2>
                    <p className="text-xs font-bold text-brand-sage uppercase tracking-widest mt-1">
                      Priority Analysis Required
                    </p>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 flex flex-col gap-6">
                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <label className="text-[9px] font-black text-brand-sage uppercase tracking-widest block mb-2">
                        Department *
                      </label>
                      <div className="relative">
                        <Factory className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-sage/40" />
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
                          className="w-full bg-(--color-zenthar-void) border-2 border-brand-sage/20 rounded-xl pl-11 pr-4 py-3.5 text-sm font-bold text-(--color-zenthar-text-primary) focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10 outline-none transition-all"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[9px] font-black text-brand-sage uppercase tracking-widest block mb-2">
                        Urgency
                      </label>
                      <div className="relative">
                        <AlertCircle className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-sage/40" />
                        <select
                          value={formData.urgency}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              urgency: e.target.value,
                            })
                          }
                          className="w-full bg-(--color-zenthar-void) border-2 border-brand-sage/20 rounded-xl pl-11 pr-4 py-3.5 text-sm font-bold text-(--color-zenthar-text-primary) focus:border-brand-primary outline-none appearance-none cursor-pointer"
                        >
                          <option value="NORMAL">Normal</option>
                          <option value="HIGH">High Priority</option>
                          <option value="CRITICAL">Critical Emergency</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-[9px] font-black text-brand-sage uppercase tracking-widest block mb-2">
                      Reason *
                    </label>
                    <div className="relative">
                      <FileText className="absolute left-4 top-4 w-4 h-4 text-brand-sage/40" />
                      <textarea
                        required
                        value={formData.reason}
                        onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                        placeholder="Provide detailed reason for the STAT request..."
                        className="w-full bg-(--color-zenthar-void) border-2 border-brand-sage/20 rounded-xl pl-11 pr-4 py-3.5 text-sm font-bold text-(--color-zenthar-text-primary) focus:border-brand-primary outline-none resize-none min-h-[120px]"
                      />
                    </div>
                  </div>

                  <div className="mt-auto flex gap-3">
                    <button
                      type="button"
                      onClick={() => setShowNewForm(false)}
                      className="px-6 py-3 text-xs font-bold text-brand-sage hover:bg-(--color-zenthar-void) rounded-xl transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={
                        submitting || !formData.department.trim() || !formData.reason.trim()
                      }
                      className="flex items-center gap-2 px-6 py-3 bg-brand-primary text-(--color-zenthar-void) text-xs font-bold rounded-xl hover:bg-brand-primary/90 transition-all shadow-lg disabled:opacity-50"
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
                className="h-full bg-(--color-zenthar-carbon) rounded-2xl border border-brand-sage/10 p-8 flex flex-col relative overflow-hidden"
              >
                <div className="flex items-start justify-between mb-8 pb-6 border-b border-brand-sage/10">
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <span
                        className={clsx(
                          "px-3 py-1.5 rounded-full text-[9px] font-black uppercase border",
                          urgencyColor(selectedStat.urgency),
                        )}
                      >
                        {selectedStat.urgency ?? "NORMAL"}
                      </span>
                      <span className="text-[9px] font-mono text-(--color-zenthar-text-muted)">
                        STAT-{String(selectedStat.id).padStart(4, "0")}
                      </span>
                    </div>
                    <h2 className="text-3xl font-black text-(--color-zenthar-text-primary) tracking-tight uppercase">
                      {selectedStat.department}
                    </h2>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-black text-brand-sage uppercase tracking-widest mb-1">
                      Submitted
                    </p>
                    <p className="text-sm font-mono text-(--color-zenthar-text-primary)">
                      {new Date(selectedStat.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="flex-1 grid grid-cols-12 gap-6 overflow-y-auto custom-scrollbar">
                  <div className="col-span-8 space-y-6">
                    <div>
                      <h3 className="text-[9px] font-black text-brand-sage uppercase tracking-widest mb-3 flex items-center gap-2">
                        <FileText size={12} /> Request Details
                      </h3>
                      <div className="bg-(--color-zenthar-void) rounded-2xl p-6 border border-brand-sage/20 relative overflow-hidden">
                        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-brand-primary/30" />
                        <p className="text-sm text-(--color-zenthar-text-primary) leading-relaxed whitespace-pre-wrap pl-2">
                          {selectedStat.reason}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="col-span-4">
                    <div className="bg-(--color-zenthar-void) rounded-2xl p-5 border border-brand-sage/20">
                      <h3 className="text-[9px] font-black text-brand-sage uppercase tracking-widest mb-4">
                        Status
                      </h3>
                      <div
                        className={clsx(
                          "flex flex-col items-center text-center p-5 rounded-xl border",
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
                  <div className="mt-6 pt-5 border-t border-brand-sage/10 flex justify-end">
                    <button
                      onClick={handleAcknowledge}
                      className="flex items-center gap-2 px-6 py-3 bg-brand-primary text-(--color-zenthar-void) text-sm font-bold rounded-2xl hover:bg-brand-primary/90 transition-all shadow-xl"
                    >
                      {selectedStat.status === "OPEN" ? "Acknowledge" : "Mark Completed"}
                      <ArrowRight size={16} />
                    </button>
                  </div>
                )}
              </motion.div>
            ) : (
              <div className="h-full bg-(--color-zenthar-carbon) rounded-2xl border border-brand-sage/10 flex flex-col items-center justify-center text-brand-sage gap-4">
                <Zap className="w-12 h-12 opacity-20 text-brand-primary" />
                <p className="text-sm font-black text-(--color-zenthar-text-primary) uppercase tracking-widest">
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
