import React, { memo, useState, useEffect } from "react";
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
} from "lucide-react";
import { motion, AnimatePresence } from "@/src/lib/motion";
import { LabPanel } from "../../../ui/components/LabPanel";
import { StatApi } from "../api/stat.api";
import { StatRequest } from "../../../core/types";
import clsx from "@/src/lib/clsx";

/**
 * StatFeature Component
 *
 * This component manages the STAT (Short Turnaround Time) requests for the laboratory.
 * It provides a split-pane interface:
 * - Left pane: A list of active and historical STAT requests, sortable and filterable.
 * - Right pane: A detailed view of the selected request or a form to submit a new request.
 *
 * Features:
 * - Real-time status tracking (OPEN, IN_PROGRESS, CLOSED).
 * - Urgency level highlighting (NORMAL, HIGH, CRITICAL).
 * - Animated transitions between list items and detail views.
 * - Form validation and submission for new requests.
 */
export const StatFeature: React.FC = memo(() => {
  const [stats, setStats] = useState<StatRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewForm, setShowNewForm] = useState(false);
  const [formData, setFormData] = useState({
    department: "",
    reason: "",
    urgency: "NORMAL",
  });
  const [submitting, setSubmitting] = useState(false);
  const [selectedStat, setSelectedStat] = useState<StatRequest | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const data = await StatApi.getStats();
      setStats(data);
      if (data.length > 0 && !selectedStat && !showNewForm) {
        setSelectedStat(data[0]);
      }
    } catch (err) {
      console.error("Failed to fetch stats", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await StatApi.createStat(formData);
      setFormData({ department: "", reason: "", urgency: "NORMAL" });
      setShowNewForm(false);
      fetchStats();
    } catch (err) {
      console.error("Failed to create stat", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAcknowledge = async () => {
    if (!selectedStat) return;
    try {
      const newStatus =
        selectedStat.status === "OPEN" ? "IN_PROGRESS" : "CLOSED";
      await StatApi.updateStatStatus(selectedStat.id, newStatus);
      fetchStats();
      setSelectedStat({ ...selectedStat, status: newStatus as any });
    } catch (err) {
      console.error("Failed to update status", err);
    }
  };

  const getUrgencyColor = (urgency?: string) => {
    switch (urgency) {
      case "CRITICAL":
        return "text-red-500 bg-red-500/10 border-red-500/20";
      case "HIGH":
        return "text-orange-500 bg-orange-500/10 border-orange-500/20";
      default:
        return "text-brand-primary bg-brand-primary/10 border-brand-primary/20";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "CLOSED":
        return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      case "IN_PROGRESS":
        return <Clock className="w-5 h-5 text-amber-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-brand-primary" />;
    }
  };

  const activeStatsCount = stats.filter((s) => s.status !== "CLOSED").length;
  const criticalStatsCount = stats.filter(
    (s) => s.urgency === "CRITICAL" && s.status !== "CLOSED",
  ).length;

  return (
    <div className="h-full flex flex-col gap-6 overflow-hidden bg-(--color-zenthar-graphite)/30 p-2 rounded-3xl">
      {/* Header Metrics */}
      <div className="grid grid-cols-3 gap-6 shrink-0">
        <div className="bg-(--color-zenthar-carbon) p-6 rounded-2xl border border-brand-sage/10 shadow-sm flex items-center justify-between relative overflow-hidden group hover:shadow-md transition-all duration-500">
          <div className="absolute right-0 top-0 w-48 h-48 bg-linear-to-br from-brand-primary/10 to-transparent rounded-full blur-3xl -mr-20 -mt-20 transition-transform duration-700 group-hover:scale-150" />
          <div className="absolute left-0 bottom-0 w-full h-1 bg-linear-to-r from-brand-primary/50 to-transparent transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-brand-primary animate-pulse" />
              <p className="text-[10px] font-black text-brand-sage uppercase tracking-[0.2em]">
                Active STATs
              </p>
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-5xl font-light text-white tracking-tighter">
                {activeStatsCount}
              </p>
              <span className="text-xs font-bold text-brand-sage uppercase tracking-widest">
                Requests
              </span>
            </div>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-(--color-zenthar-void) border border-brand-sage/10 flex items-center justify-center text-brand-primary shadow-inner relative z-10 group-hover:rotate-12 transition-transform duration-500">
            <Activity className="w-7 h-7" />
          </div>
        </div>

        <div className="bg-(--color-zenthar-carbon) p-6 rounded-2xl border border-brand-sage/10 shadow-sm flex items-center justify-between relative overflow-hidden group hover:shadow-md transition-all duration-500">
          <div className="absolute right-0 top-0 w-48 h-48 bg-linear-to-br from-red-500/10 to-transparent rounded-full blur-3xl -mr-20 -mt-20 transition-transform duration-700 group-hover:scale-150" />
          <div className="absolute left-0 bottom-0 w-full h-1 bg-linear-to-r from-red-500/50 to-transparent transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <p className="text-[10px] font-black text-brand-sage uppercase tracking-[0.2em]">
                Critical Priority
              </p>
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-5xl font-light text-red-500 tracking-tighter">
                {criticalStatsCount}
              </p>
              <span className="text-xs font-bold text-red-500/70 uppercase tracking-widest">
                Urgent
              </span>
            </div>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 shadow-inner relative z-10 group-hover:rotate-12 transition-transform duration-500">
            <AlertCircle className="w-7 h-7" />
          </div>
        </div>

        <div className="bg-(--color-zenthar-carbon) p-6 rounded-2xl border border-brand-sage/10 shadow-sm flex items-center justify-between relative overflow-hidden group hover:shadow-md transition-all duration-500">
          <div className="absolute right-0 top-0 w-48 h-48 bg-linear-to-br from-emerald-500/10 to-transparent rounded-full blur-3xl -mr-20 -mt-20 transition-transform duration-700 group-hover:scale-150" />
          <div className="absolute left-0 bottom-0 w-full h-1 bg-linear-to-r from-emerald-500/50 to-transparent transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <p className="text-[10px] font-black text-brand-sage uppercase tracking-[0.2em]">
                Avg Response
              </p>
            </div>
            <div className="flex items-baseline gap-1">
              <p className="text-5xl font-light text-white tracking-tighter">
                12
              </p>
              <span className="text-sm font-bold text-emerald-500 uppercase tracking-widest">
                min
              </span>
            </div>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 shadow-inner relative z-10 group-hover:-rotate-12 transition-transform duration-500">
            <Clock className="w-7 h-7" />
          </div>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-12 gap-6 min-h-0">
        {/* Left Column: List */}
        <div className="col-span-5 flex flex-col gap-4 overflow-hidden">
          <LabPanel
            title="STAT Queue"
            icon={Zap}
            actions={
              <button
                onClick={() => {
                  setShowNewForm(true);
                  setSelectedStat(null);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-xl text-xs font-bold hover:bg-brand-primary/90 transition-all shadow-lg shadow-brand-primary/20 hover:shadow-brand-primary/40 hover:-translate-y-0.5"
              >
                <Plus className="w-4 h-4" />
                New Request
              </button>
            }
          >
            <div className="flex flex-col h-full overflow-y-auto custom-scrollbar pr-2 gap-3">
              {loading ? (
                <div className="flex justify-center p-8">
                  <div className="w-6 h-6 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : stats.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-brand-sage gap-6 bg-(--color-zenthar-void) rounded-3xl border border-brand-sage/10 relative overflow-hidden group">
                  <div className="absolute inset-0 bg-brand-primary/5 rounded-full blur-3xl scale-150 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                  <div className="p-6 bg-(--color-zenthar-carbon) rounded-full border border-brand-sage/20 relative z-10">
                    <Zap className="w-16 h-16 opacity-40 text-brand-primary group-hover:opacity-80 transition-opacity duration-300" />
                  </div>
                  <p className="text-sm font-black text-white uppercase tracking-[0.2em] relative z-10">
                    No STAT Requests Found
                  </p>
                </div>
              ) : (
                <AnimatePresence>
                  {stats.map((stat, index) => (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      key={stat.id}
                      onClick={() => {
                        setSelectedStat(stat);
                        setShowNewForm(false);
                      }}
                      className={clsx(
                        "p-5 rounded-2xl border transition-all duration-300 cursor-pointer group relative overflow-hidden",
                        selectedStat?.id === stat.id
                          ? "bg-(--color-zenthar-carbon) border-brand-primary shadow-lg shadow-brand-primary/10 scale-[1.02] z-10"
                          : "bg-(--color-zenthar-void) border-brand-sage/20 hover:bg-(--color-zenthar-carbon) hover:border-brand-primary/40 hover:shadow-md hover:scale-[1.01]",
                      )}
                    >
                      {selectedStat?.id === stat.id && (
                        <motion.div
                          layoutId="activeStat"
                          className="absolute left-0 top-0 bottom-0 w-1.5 bg-brand-primary rounded-l-2xl"
                        />
                      )}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <div
                            className={clsx(
                              "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-inner",
                              selectedStat?.id === stat.id
                                ? "bg-(--color-zenthar-void) scale-110"
                                : "bg-(--color-zenthar-carbon) border border-brand-sage/10 group-hover:scale-105",
                            )}
                          >
                            {getStatusIcon(stat.status)}
                          </div>
                          <div>
                            <h4 className="text-base font-bold text-white group-hover:text-brand-primary transition-colors tracking-tight">
                              {stat.department}
                            </h4>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] text-brand-sage font-mono uppercase tracking-widest bg-(--color-zenthar-void) px-2 py-0.5 rounded-md">
                                {new Date(stat.created_at).toLocaleTimeString(
                                  [],
                                  { hour: "2-digit", minute: "2-digit" },
                                )}
                              </span>
                              <span className="text-[10px] text-brand-sage font-mono uppercase tracking-widest">
                                ID: {stat.id.toString().padStart(4, "0")}
                              </span>
                            </div>
                          </div>
                        </div>
                        <span
                          className={clsx(
                            "px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border shadow-sm",
                            getUrgencyColor(stat.urgency),
                          )}
                        >
                          {stat.urgency || "NORMAL"}
                        </span>
                      </div>
                      <p className="text-sm text-white/80 line-clamp-2 leading-relaxed pl-16">
                        {stat.reason}
                      </p>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>
          </LabPanel>
        </div>

        {/* Right Column: Details or Form */}
        <div className="col-span-7 flex flex-col overflow-hidden">
          <AnimatePresence mode="wait">
            {showNewForm ? (
              <motion.div
                key="form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="h-full bg-(--color-zenthar-carbon) rounded-2xl border border-brand-sage/10 shadow-sm p-8 flex flex-col"
              >
                <div className="flex items-center gap-5 mb-8 pb-8 border-b border-brand-sage/10 relative z-10">
                  <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-brand-primary/20 to-brand-primary/5 border border-brand-primary/20 flex items-center justify-center text-brand-primary shadow-inner">
                    <Zap className="w-8 h-8" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-light text-white tracking-tight">
                      New STAT Request
                    </h2>
                    <p className="text-xs font-bold text-brand-sage uppercase tracking-[0.2em] mt-2">
                      Priority Analysis Required
                    </p>
                  </div>
                </div>

                <form
                  onSubmit={handleSubmit}
                  className="flex-1 flex flex-col relative z-10"
                >
                  <div className="grid grid-cols-2 gap-6 mb-8">
                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-[10px] font-black text-brand-sage uppercase tracking-[0.2em] mb-2">
                        Department
                      </label>
                      <div className="relative group">
                        <Factory className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-sage group-focus-within:text-brand-primary transition-colors" />
                        <input
                          type="text"
                          required
                          value={formData.department}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              department: e.target.value,
                            })
                          }
                          className="w-full bg-(--color-zenthar-void) border-2 border-brand-sage/20 rounded-xl pl-12 pr-4 py-3.5 text-sm font-bold text-white focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10 outline-none transition-all shadow-sm"
                          placeholder="e.g. Refining Line A"
                        />
                      </div>
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-[10px] font-black text-brand-sage uppercase tracking-[0.2em] mb-2">
                        Urgency Level
                      </label>
                      <div className="relative group">
                        <AlertCircle className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-sage group-focus-within:text-brand-primary transition-colors" />
                        <select
                          value={formData.urgency}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              urgency: e.target.value,
                            })
                          }
                          className="w-full bg-(--color-zenthar-void) border-2 border-brand-sage/20 rounded-xl pl-12 pr-4 py-3.5 text-sm font-bold text-white focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10 outline-none transition-all appearance-none shadow-sm cursor-pointer"
                        >
                          <option value="NORMAL">Normal Priority</option>
                          <option value="HIGH">High Priority</option>
                          <option value="CRITICAL">Critical Emergency</option>
                        </select>
                      </div>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[10px] font-black text-brand-sage uppercase tracking-[0.2em] mb-2">
                        Reason for Request
                      </label>
                      <div className="relative group">
                        <FileText className="absolute left-4 top-4 w-4 h-4 text-brand-sage group-focus-within:text-brand-primary transition-colors" />
                        <textarea
                          required
                          value={formData.reason}
                          onChange={(e) =>
                            setFormData({ ...formData, reason: e.target.value })
                          }
                          className="w-full bg-(--color-zenthar-void) border-2 border-brand-sage/20 rounded-xl pl-12 pr-4 py-3.5 text-sm font-bold text-white focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10 outline-none transition-all resize-none min-h-160px shadow-sm"
                          placeholder="Provide detailed reason for the STAT request..."
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-auto flex justify-end gap-3 pt-6 border-t border-brand-sage/10">
                    <button
                      type="button"
                      onClick={() => {
                        setShowNewForm(false);
                        if (stats.length > 0) setSelectedStat(stats[0]);
                      }}
                      className="px-6 py-3 text-xs font-bold text-brand-sage hover:bg-(--color-zenthar-void) rounded-xl transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex items-center gap-2 px-8 py-3 bg-brand-primary text-white text-xs font-bold rounded-xl hover:bg-brand-primary/90 transition-all shadow-lg shadow-brand-primary/20 hover:shadow-brand-primary/40 hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0"
                    >
                      {submitting ? "Submitting..." : "Submit Request"}
                      {!submitting && <ArrowRight className="w-4 h-4" />}
                    </button>
                  </div>
                </form>
              </motion.div>
            ) : selectedStat ? (
              <motion.div
                key="details"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="h-full bg-(--color-zenthar-carbon) rounded-2xl border border-brand-sage/10 shadow-sm p-8 flex flex-col relative overflow-hidden"
              >
                <div className="absolute right-0 top-0 w-96 h-96 bg-linear-to-br from-brand-primary/10 to-transparent rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
                <div className="absolute left-0 bottom-0 w-96 h-96 bg-linear-to-tr from-brand-mist to-transparent rounded-full blur-3xl -ml-32 -mb-32 pointer-events-none" />

                <div className="flex items-start justify-between mb-10 pb-8 border-b border-brand-sage/10 relative z-10">
                  <div>
                    <div className="flex items-center gap-4 mb-4">
                      <span
                        className={clsx(
                          "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border shadow-sm backdrop-blur-sm",
                          getUrgencyColor(selectedStat.urgency),
                        )}
                      >
                        {selectedStat.urgency || "NORMAL"}
                      </span>
                      <div className="flex items-center gap-2 bg-(--color-zenthar-void) px-3 py-1.5 rounded-lg border border-brand-sage/10 shadow-sm">
                        <span className="w-2 h-2 rounded-full bg-brand-primary animate-pulse" />
                        <span className="text-[10px] font-mono text-white uppercase tracking-widest font-bold">
                          ID: STAT-{selectedStat.id.toString().padStart(4, "0")}
                        </span>
                      </div>
                    </div>
                    <h2 className="text-4xl font-black text-white tracking-tight uppercase">
                      {selectedStat.department}
                    </h2>
                  </div>
                  <div className="text-right bg-(--color-zenthar-void) p-5 rounded-2xl border border-brand-sage/10 shadow-sm">
                    <p className="text-[10px] font-black text-brand-sage uppercase tracking-[0.2em] mb-2 flex items-center justify-end gap-1.5">
                      <Clock className="w-3.5 h-3.5" /> Requested At
                    </p>
                    <p className="text-2xl font-light text-white tracking-tight">
                      {new Date(selectedStat.created_at).toLocaleTimeString(
                        [],
                        { hour: "2-digit", minute: "2-digit" },
                      )}
                    </p>
                    <p className="text-[10px] font-bold text-brand-sage uppercase tracking-widest mt-1">
                      {new Date(selectedStat.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex-1 relative z-10 grid grid-cols-12 gap-8">
                  <div className="col-span-8 flex flex-col gap-8">
                    <div>
                      <h3 className="text-[10px] font-black text-brand-sage uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Request Details
                      </h3>
                      <div className="bg-(--color-zenthar-void) rounded-3xl p-8 border border-brand-sage/20 shadow-sm relative overflow-hidden">
                        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-brand-primary/20" />
                        <p className="text-base text-white/90 leading-relaxed whitespace-pre-wrap font-medium">
                          {selectedStat.reason}
                        </p>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-[10px] font-black text-brand-sage uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                        <Activity className="w-4 h-4" />
                        Timeline
                      </h3>
                      <div className="bg-(--color-zenthar-void) rounded-3xl p-8 border border-brand-sage/20 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                        <div className="relative pl-6 border-l-2 border-brand-sage/20 space-y-8">
                          <div className="relative group">
                            <div className="absolute -left-33px top-1 w-4 h-4 rounded-full bg-brand-primary border-4 border-(--color-zenthar-void) shadow-sm group-hover:scale-125 transition-transform" />
                            <p className="text-sm font-black text-white uppercase tracking-wider">
                              Request Submitted
                            </p>
                            <p className="text-[10px] font-bold text-brand-sage uppercase tracking-widest mt-1">
                              {new Date(
                                selectedStat.created_at,
                              ).toLocaleString()}
                            </p>
                          </div>
                          {selectedStat.status !== "OPEN" && (
                            <div className="relative group">
                              <div className="absolute -left-33px top-1 w-4 h-4 rounded-full bg-amber-500 border-4 border-(--color-zenthar-void) shadow-sm group-hover:scale-125 transition-transform" />
                              <p className="text-sm font-black text-white uppercase tracking-wider">
                                Analysis In Progress
                              </p>
                              <p className="text-[10px] font-bold text-brand-sage uppercase tracking-widest mt-1">
                                Acknowledged by Lab
                              </p>
                            </div>
                          )}
                          {selectedStat.status === "CLOSED" && (
                            <div className="relative group">
                              <div className="absolute -left-33px top-1 w-4 h-4 rounded-full bg-emerald-500 border-4 border-(--color-zenthar-void) shadow-sm group-hover:scale-125 transition-transform" />
                              <p className="text-sm font-black text-white uppercase tracking-wider">
                                Results Published
                              </p>
                              <p className="text-[10px] font-bold text-brand-sage uppercase tracking-widest mt-1">
                                Available in LIMS
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="col-span-4 flex flex-col gap-6">
                    <div className="bg-(--color-zenthar-graphite)/30 rounded-3xl p-6 border border-brand-sage/10">
                      <h3 className="text-[10px] font-black text-brand-sage uppercase tracking-[0.2em] mb-4">
                        Current Status
                      </h3>
                      <div
                        className={clsx(
                          "flex flex-col items-center text-center p-6 rounded-2xl border bg-(--color-zenthar-void) shadow-sm",
                          selectedStat.status === "CLOSED"
                            ? "border-emerald-500/30"
                            : selectedStat.status === "IN_PROGRESS"
                              ? "border-amber-500/30"
                              : "border-brand-primary/20",
                        )}
                      >
                        <div
                          className={clsx(
                            "w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-inner",
                            selectedStat.status === "CLOSED"
                              ? "bg-emerald-500/10 text-emerald-500"
                              : selectedStat.status === "IN_PROGRESS"
                                ? "bg-amber-500/10 text-amber-500"
                                : "bg-brand-primary/10 text-brand-primary",
                          )}
                        >
                          {getStatusIcon(selectedStat.status)}
                        </div>
                        <p className="text-lg font-bold text-white tracking-tight">
                          {selectedStat.status}
                        </p>
                        <p className="text-xs text-brand-sage mt-2 leading-relaxed">
                          {selectedStat.status === "OPEN"
                            ? "Awaiting lab acknowledgment and assignment"
                            : selectedStat.status === "IN_PROGRESS"
                              ? "Analysis currently underway in the lab"
                              : "Results have been published and verified"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {selectedStat.status !== "CLOSED" && (
                  <div className="mt-auto pt-8 border-t border-brand-sage/10 flex justify-end gap-4 relative z-10">
                    <button
                      onClick={handleAcknowledge}
                      className="px-8 py-4 bg-brand-primary text-white text-sm font-bold rounded-2xl hover:bg-brand-primary/90 transition-all shadow-xl shadow-brand-primary/20 hover:shadow-brand-primary/40 hover:-translate-y-1 flex items-center gap-3 group"
                    >
                      {selectedStat.status === "OPEN"
                        ? "Acknowledge Request"
                        : "Mark as Completed"}
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                )}
              </motion.div>
            ) : (
              <div className="h-full bg-(--color-zenthar-carbon) rounded-3xl border border-brand-sage/10 shadow-sm flex flex-col items-center justify-center text-brand-sage relative overflow-hidden group">
                <div className="absolute inset-0 bg-linear-to-br from-brand-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                <div className="p-8 bg-(--color-zenthar-void) rounded-full border border-brand-sage/20 relative z-10 mb-6 group-hover:scale-110 transition-transform duration-500">
                  <Zap className="w-16 h-16 text-brand-primary/40 group-hover:text-brand-primary transition-colors duration-300" />
                </div>
                <p className="text-lg font-black text-white uppercase tracking-widest relative z-10">
                  Select a STAT Request
                </p>
                <p className="text-xs font-bold text-brand-sage uppercase tracking-[0.2em] mt-2 relative z-10">
                  Choose a request from the queue to view details
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
