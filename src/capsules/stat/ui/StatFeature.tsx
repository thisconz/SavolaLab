import React, { memo, useState, useEffect } from "react";
import { Zap, Plus, AlertCircle, Clock, CheckCircle2, Factory, FileText, ArrowRight, Activity } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { LabPanel } from "../../../ui/components/LabPanel";
import { StatApi } from "../api/stat.api";
import { StatRequest } from "../../../core/types";
import clsx from "clsx";

export const StatFeature: React.FC = memo(() => {
  const [stats, setStats] = useState<StatRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewForm, setShowNewForm] = useState(false);
  const [formData, setFormData] = useState({ department: "", reason: "", urgency: "NORMAL" });
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

  const getUrgencyColor = (urgency?: string) => {
    switch (urgency) {
      case "CRITICAL": return "text-red-500 bg-red-500/10 border-red-500/20";
      case "HIGH": return "text-orange-500 bg-orange-500/10 border-orange-500/20";
      default: return "text-brand-primary bg-brand-primary/10 border-brand-primary/20";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "CLOSED": return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      case "IN_PROGRESS": return <Clock className="w-5 h-5 text-amber-500" />;
      default: return <AlertCircle className="w-5 h-5 text-brand-primary" />;
    }
  };

  const activeStatsCount = stats.filter(s => s.status !== "CLOSED").length;
  const criticalStatsCount = stats.filter(s => s.urgency === "CRITICAL" && s.status !== "CLOSED").length;

  return (
    <div className="h-full flex flex-col gap-6 overflow-hidden">
      {/* Header Metrics */}
      <div className="grid grid-cols-3 gap-6 shrink-0">
        <div className="bg-white p-6 rounded-2xl border border-brand-sage/10 shadow-sm flex items-center justify-between relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-32 h-32 bg-brand-primary/5 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-150" />
          <div>
            <p className="text-[10px] font-black text-brand-sage uppercase tracking-[0.2em] mb-1">Active STATs</p>
            <p className="text-4xl font-light text-brand-deep tracking-tight">{activeStatsCount}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-brand-mist flex items-center justify-center text-brand-primary">
            <Activity className="w-6 h-6" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-brand-sage/10 shadow-sm flex items-center justify-between relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-32 h-32 bg-red-500/5 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-150" />
          <div>
            <p className="text-[10px] font-black text-brand-sage uppercase tracking-[0.2em] mb-1">Critical Priority</p>
            <p className="text-4xl font-light text-red-500 tracking-tight">{criticalStatsCount}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center text-red-500">
            <AlertCircle className="w-6 h-6" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-brand-sage/10 shadow-sm flex items-center justify-between relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-150" />
          <div>
            <p className="text-[10px] font-black text-brand-sage uppercase tracking-[0.2em] mb-1">Avg Response</p>
            <p className="text-4xl font-light text-brand-deep tracking-tight">12<span className="text-lg text-brand-sage ml-1">min</span></p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500">
            <Clock className="w-6 h-6" />
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
                <div className="flex-1 flex flex-col items-center justify-center text-brand-sage gap-4">
                  <Zap className="w-12 h-12 opacity-20" />
                  <p className="text-xs font-mono uppercase tracking-widest">
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
                        "p-4 rounded-2xl border transition-all cursor-pointer group relative overflow-hidden",
                        selectedStat?.id === stat.id
                          ? "bg-brand-primary/5 border-brand-primary shadow-md"
                          : "bg-white border-brand-sage/20 hover:border-brand-primary/40 hover:shadow-sm"
                      )}
                    >
                      {selectedStat?.id === stat.id && (
                        <motion.div layoutId="activeStat" className="absolute left-0 top-0 bottom-0 w-1 bg-brand-primary" />
                      )}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={clsx(
                            "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                            selectedStat?.id === stat.id ? "bg-white shadow-sm" : "bg-brand-mist"
                          )}>
                            {getStatusIcon(stat.status)}
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-brand-deep group-hover:text-brand-primary transition-colors">{stat.department}</h4>
                            <p className="text-[10px] text-brand-sage font-mono uppercase tracking-wider mt-0.5">
                              {new Date(stat.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                        <span className={clsx(
                          "px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border",
                          getUrgencyColor(stat.urgency)
                        )}>
                          {stat.urgency || "NORMAL"}
                        </span>
                      </div>
                      <p className="text-xs text-brand-deep/70 line-clamp-2 leading-relaxed">{stat.reason}</p>
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
                className="h-full bg-white rounded-2xl border border-brand-sage/10 shadow-sm p-8 flex flex-col"
              >
                <div className="flex items-center gap-4 mb-8 pb-6 border-b border-brand-sage/10">
                  <div className="w-12 h-12 rounded-2xl bg-brand-primary/10 flex items-center justify-center text-brand-primary">
                    <Zap className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-light text-brand-deep tracking-tight">New STAT Request</h2>
                    <p className="text-xs font-bold text-brand-sage uppercase tracking-widest mt-1">Priority Analysis Required</p>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
                  <div className="grid grid-cols-2 gap-6 mb-8">
                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-[10px] font-black text-brand-sage uppercase tracking-[0.2em] mb-2">Department</label>
                      <div className="relative">
                        <Factory className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-sage" />
                        <input
                          type="text"
                          required
                          value={formData.department}
                          onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                          className="w-full bg-brand-mist/30 border border-brand-sage/20 rounded-xl pl-12 pr-4 py-3.5 text-sm focus:ring-2 focus:ring-brand-primary outline-none transition-all"
                          placeholder="e.g. Refining Line A"
                        />
                      </div>
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-[10px] font-black text-brand-sage uppercase tracking-[0.2em] mb-2">Urgency Level</label>
                      <div className="relative">
                        <AlertCircle className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-sage" />
                        <select
                          value={formData.urgency}
                          onChange={(e) => setFormData({ ...formData, urgency: e.target.value })}
                          className="w-full bg-brand-mist/30 border border-brand-sage/20 rounded-xl pl-12 pr-4 py-3.5 text-sm focus:ring-2 focus:ring-brand-primary outline-none transition-all appearance-none"
                        >
                          <option value="NORMAL">Normal Priority</option>
                          <option value="HIGH">High Priority</option>
                          <option value="CRITICAL">Critical Emergency</option>
                        </select>
                      </div>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[10px] font-black text-brand-sage uppercase tracking-[0.2em] mb-2">Reason for Request</label>
                      <div className="relative">
                        <FileText className="absolute left-4 top-4 w-4 h-4 text-brand-sage" />
                        <textarea
                          required
                          value={formData.reason}
                          onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                          className="w-full bg-brand-mist/30 border border-brand-sage/20 rounded-xl pl-12 pr-4 py-3.5 text-sm focus:ring-2 focus:ring-brand-primary outline-none transition-all resize-none min-h-[160px]"
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
                      className="px-6 py-3 text-xs font-bold text-brand-sage hover:bg-brand-mist rounded-xl transition-colors"
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
                className="h-full bg-white rounded-2xl border border-brand-sage/10 shadow-sm p-8 flex flex-col relative overflow-hidden"
              >
                <div className="absolute right-0 top-0 w-64 h-64 bg-brand-primary/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
                
                <div className="flex items-start justify-between mb-8 pb-6 border-b border-brand-sage/10 relative z-10">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className={clsx(
                        "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                        getUrgencyColor(selectedStat.urgency)
                      )}>
                        {selectedStat.urgency || "NORMAL"}
                      </span>
                      <span className="text-[10px] font-mono text-brand-sage uppercase tracking-widest">
                        ID: STAT-{selectedStat.id.toString().padStart(4, '0')}
                      </span>
                    </div>
                    <h2 className="text-3xl font-light text-brand-deep tracking-tight">{selectedStat.department}</h2>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-brand-sage uppercase tracking-[0.2em] mb-1">Requested At</p>
                    <p className="text-sm font-bold text-brand-deep">
                      {new Date(selectedStat.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="flex-1 relative z-10">
                  <div className="mb-8">
                    <h3 className="text-[10px] font-black text-brand-sage uppercase tracking-[0.2em] mb-3">Request Details</h3>
                    <div className="bg-brand-mist/30 rounded-2xl p-6 border border-brand-sage/10">
                      <p className="text-sm text-brand-deep leading-relaxed whitespace-pre-wrap">
                        {selectedStat.reason}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-[10px] font-black text-brand-sage uppercase tracking-[0.2em] mb-3">Current Status</h3>
                    <div className="flex items-center gap-4 bg-white border border-brand-sage/20 rounded-2xl p-4 shadow-sm">
                      <div className={clsx(
                        "w-12 h-12 rounded-xl flex items-center justify-center",
                        selectedStat.status === "CLOSED" ? "bg-emerald-50 text-emerald-500" :
                        selectedStat.status === "IN_PROGRESS" ? "bg-amber-50 text-amber-500" :
                        "bg-brand-primary/10 text-brand-primary"
                      )}>
                        {getStatusIcon(selectedStat.status)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-brand-deep">{selectedStat.status}</p>
                        <p className="text-xs text-brand-sage mt-0.5">
                          {selectedStat.status === "OPEN" ? "Awaiting lab acknowledgment" :
                           selectedStat.status === "IN_PROGRESS" ? "Analysis currently underway" :
                           "Results have been published"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {selectedStat.status !== "CLOSED" && (
                  <div className="mt-auto pt-6 border-t border-brand-sage/10 flex justify-end gap-3 relative z-10">
                    <button className="px-6 py-3 bg-brand-deep text-white text-xs font-bold rounded-xl hover:bg-brand-deep/90 transition-all shadow-lg shadow-brand-deep/20 hover:shadow-brand-deep/40 hover:-translate-y-0.5">
                      Acknowledge Request
                    </button>
                  </div>
                )}
              </motion.div>
            ) : (
              <div className="h-full bg-white rounded-2xl border border-brand-sage/10 shadow-sm flex flex-col items-center justify-center text-brand-sage">
                <Zap className="w-16 h-16 opacity-10 mb-4" />
                <p className="text-sm font-bold text-brand-deep">Select a STAT Request</p>
                <p className="text-xs mt-1">Choose a request from the queue to view details</p>
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
