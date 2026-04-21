import React, { memo, useState, useEffect, useCallback, useMemo } from "react";
import {
  ShieldAlert, Search, Download, RefreshCw, AlertTriangle,
  CheckCircle2, ChevronLeft, ChevronRight, Shield, LogIn, LogOut,
  FileEdit, Trash2, Database, Zap, Activity, User, Clock, X, Eye,
  Info, Wifi,
} from "lucide-react";
import { motion, AnimatePresence } from "@/src/lib/motion";
import { MetricCard }   from "../../../shared/components/MetricCard";
import { TableSkeleton } from "../../../shared/components/Skeletons";
import { api }          from "../../../core/http/client";
import { useRealtime }  from "../../../core/providers/RealtimeProvider";
import { AuditLog }     from "../model/audit.model";
import clsx             from "@/src/lib/clsx";
import { toast }        from "sonner";

// ─────────────────────────────────────────────
// Action config registry
// ─────────────────────────────────────────────

interface ActionConfig { color: string; bg: string; icon: React.ElementType; category: string; }

const ACTIONS: Record<string, ActionConfig> = {
  LOGIN_SUCCESS:        { color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200", icon: LogIn,        category: "Auth"     },
  LOGIN_FAILED:         { color: "text-red-700",     bg: "bg-red-50 border-red-200",         icon: AlertTriangle, category: "Auth"    },
  LOGOUT:               { color: "text-slate-600",   bg: "bg-slate-50 border-slate-200",     icon: LogOut,        category: "Auth"    },
  OTP_SENT:             { color: "text-violet-700",  bg: "bg-violet-50 border-violet-200",   icon: Shield,        category: "Auth"    },
  OTP_CONFIRMATION:     { color: "text-violet-700",  bg: "bg-violet-50 border-violet-200",   icon: Shield,        category: "Auth"    },
  ACCOUNT_ACTIVATED:    { color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200", icon: CheckCircle2,  category: "Auth"    },
  ACCOUNT_LOCKED:       { color: "text-red-700",     bg: "bg-red-50 border-red-200",         icon: AlertTriangle, category: "Security"},
  SAMPLE_UPDATED:       { color: "text-blue-700",    bg: "bg-blue-50 border-blue-200",       icon: FileEdit,      category: "Sample"  },
  TEST_CREATED:         { color: "text-indigo-700",  bg: "bg-indigo-50 border-indigo-200",   icon: Database,      category: "Test"    },
  TEST_UPDATED:         { color: "text-indigo-700",  bg: "bg-indigo-50 border-indigo-200",   icon: FileEdit,      category: "Test"    },
  TEST_DELETE_ATTEMPT:  { color: "text-red-700",     bg: "bg-red-50 border-red-200",         icon: Trash2,        category: "Security"},
  STAT_REQUEST_CREATED: { color: "text-amber-700",   bg: "bg-amber-50 border-amber-200",     icon: Zap,           category: "STAT"    },
  STAT_REQUEST_UPDATED: { color: "text-amber-700",   bg: "bg-amber-50 border-amber-200",     icon: Zap,           category: "STAT"    },
  VERIFICATION_FAILED:  { color: "text-red-700",     bg: "bg-red-50 border-red-200",         icon: AlertTriangle, category: "Security"},
};

const DEFAULT_ACTION: ActionConfig = { color: "text-slate-600", bg: "bg-slate-50 border-slate-200", icon: Activity, category: "System" };
const getAction = (a: string) => ACTIONS[a] || DEFAULT_ACTION;

// ─────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────

const ActionBadge: React.FC<{ action: string }> = ({ action }) => {
  const cfg  = getAction(action);
  const Icon = cfg.icon;
  return (
    <span className={clsx("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[9px] font-black uppercase tracking-wider whitespace-nowrap", cfg.bg, cfg.color)}>
      <Icon className="w-3 h-3 shrink-0" /> {action.replace(/_/g, " ")}
    </span>
  );
};

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────

const PAGE_SIZE       = 25;
const ANOMALY_ACTIONS = new Set(["LOGIN_FAILED", "TEST_DELETE_ATTEMPT", "VERIFICATION_FAILED", "ACCOUNT_LOCKED"]);
const INITIAL_FILTERS = { search: "", action: "", employee_number: "", start_date: "", end_date: "" };

// ─────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────

export const AuditFeature: React.FC = memo(() => {
  const [logs,        setLogs]        = useState<AuditLog[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [isRefreshing,setIsRefreshing] = useState(false);
  const [page,        setPage]        = useState(0);
  const [filters,     setFilters]     = useState(INITIAL_FILTERS);
  const [selected,    setSelected]    = useState<AuditLog | null>(null);
  const [stats,       setStats]       = useState({ total: 0, today: 0, uniqueUsers: 0, anomalies: 0 });

  const { on } = useRealtime();

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchLogs = useCallback(async (silent = false) => {
    if (!silent) setLoading(true); else setIsRefreshing(true);
    try {
      const params = new URLSearchParams();
      if (filters.employee_number) params.set("employee_number", filters.employee_number);
      if (filters.action)          params.set("action",          filters.action);
      if (filters.start_date)      params.set("start_date",      filters.start_date);
      if (filters.end_date)        params.set("end_date",        filters.end_date);
      params.set("limit", "500"); params.set("offset", "0");

      const res  = await api.get<{ success: boolean; data: AuditLog[] }>(`/audit-logs?${params}`);
      const data = res.data || [];
      setLogs(data);

      const today = new Date().toDateString();
      setStats({
        total:       data.length,
        today:       data.filter((l) => new Date(l.created_at).toDateString() === today).length,
        uniqueUsers: new Set(data.map((l) => l.employee_number)).size,
        anomalies:   data.filter((l) => ANOMALY_ACTIONS.has(l.action)).length,
      });
    } catch (err) { toast.error("Could not load audit logs"); }
    finally { setLoading(false); setIsRefreshing(false); }
  }, [filters.employee_number, filters.action, filters.start_date, filters.end_date]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  // SSE: refresh on any security / test event
  useEffect(() => {
    const events = ["TEST_SUBMITTED","TEST_REVIEWED","SAMPLE_UPDATED","STAT_CREATED","STAT_UPDATED"] as const;
    const unsubs = events.map((e) => on(e, () => setTimeout(() => fetchLogs(true), 800)));
    return () => unsubs.forEach((u) => u());
  }, [on, fetchLogs]);

  // ── Derived ────────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    if (!filters.search) return logs;
    const q = filters.search.toLowerCase();
    return logs.filter((l) =>
      l.action.toLowerCase().includes(q) ||
      l.employee_number.toLowerCase().includes(q) ||
      l.details.toLowerCase().includes(q) ||
      (l.ip_address || "").includes(q)
    );
  }, [logs, filters.search]);

  const paged          = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages     = Math.ceil(filtered.length / PAGE_SIZE);
  const uniqueActions  = useMemo(() => [...new Set(logs.map((l) => l.action))].sort(), [logs]);
  const hasFilters     = Object.values(filters).some(Boolean);

  // ── Export CSV ──────────────────────────────────────────────────────────────
  const exportCSV = () => {
    const headers = ["ID", "Employee", "Action", "Details", "IP", "Timestamp"];
    const rows    = filtered.map((l) => [l.id, l.employee_number, l.action, `"${l.details.replace(/"/g, '""')}"`, l.ip_address || "", l.created_at]);
    const csv     = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const a       = Object.assign(document.createElement("a"), { href: URL.createObjectURL(new Blob([csv], { type: "text/csv" })), download: `audit-${new Date().toISOString().split("T")[0]}.csv` });
    a.click();
    toast.success(`Exported ${filtered.length} records`);
  };

  const exportXLSX = async () => {
    try {
      const res = await fetch("/api/export/audit?limit=10000", { credentials: "include" });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const a    = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: `zenthar-audit-${new Date().toISOString().split("T")[0]}.xlsx` });
      a.click();
      toast.success("XLSX exported");
    } catch (err: any) { toast.error(err.message); }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-6 h-full overflow-hidden bg-(--color-zenthar-graphite)/30 p-2 rounded-3xl">

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
        <MetricCard label="Total Events"   value={stats.total}       icon={Activity}      variant="primary"   trend="Last fetch"   />
        <MetricCard label="Today"          value={stats.today}       icon={Clock}         variant="secondary" trend="24h window"   />
        <MetricCard label="Unique Users"   value={stats.uniqueUsers} icon={User}          variant="success"   trend="Active accounts" />
        <MetricCard label="Anomalies"      value={stats.anomalies}   icon={AlertTriangle} variant="error"     trend="Failed / blocked" />
      </div>

      {/* Filter bar */}
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white p-5 shadow-sm shrink-0">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[180px]">
            <label className="text-[9px] font-black text-brand-sage uppercase tracking-widest block mb-1.5">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-brand-sage/40" />
              <input type="text" placeholder="Action, employee, IP..."
                value={filters.search} onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
                className="w-full bg-zenthar-void border border-zenthar-steel rounded-xl pl-9 pr-3 py-2.5 text-xs focus:outline-none focus:border-brand-primary text-zenthar-text-primary" />
            </div>
          </div>
          <div className="w-48">
            <label className="text-[9px] font-black text-brand-sage uppercase tracking-widest block mb-1.5">Action Type</label>
            <select value={filters.action} onChange={(e) => { setFilters((f) => ({ ...f, action: e.target.value })); setPage(0); }}
              className="w-full bg-zenthar-void border border-zenthar-steel rounded-xl px-3 py-2.5 text-xs focus:outline-none text-zenthar-text-primary">
              <option value="">All Actions</option>
              {uniqueActions.map((a) => <option key={a} value={a}>{a.replace(/_/g, " ")}</option>)}
            </select>
          </div>
          <div className="w-36">
            <label className="text-[9px] font-black text-brand-sage uppercase tracking-widest block mb-1.5">Employee ID</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-brand-sage/40" />
              <input type="text" placeholder="EMP-ID..." value={filters.employee_number}
                onChange={(e) => { setFilters((f) => ({ ...f, employee_number: e.target.value })); setPage(0); }}
                className="w-full bg-zenthar-void border border-zenthar-steel rounded-xl pl-8 pr-3 py-2.5 text-xs focus:outline-none text-zenthar-text-primary" />
            </div>
          </div>
          <div className="w-32">
            <label className="text-[9px] font-black text-brand-sage uppercase tracking-widest block mb-1.5">From</label>
            <input type="date" value={filters.start_date} onChange={(e) => { setFilters((f) => ({ ...f, start_date: e.target.value })); setPage(0); }}
              className="w-full bg-zenthar-void border border-zenthar-steel rounded-xl px-3 py-2.5 text-xs focus:outline-none text-zenthar-text-primary" />
          </div>
          <div className="w-32">
            <label className="text-[9px] font-black text-brand-sage uppercase tracking-widest block mb-1.5">To</label>
            <input type="date" value={filters.end_date} onChange={(e) => { setFilters((f) => ({ ...f, end_date: e.target.value })); setPage(0); }}
              className="w-full bg-zenthar-void border border-zenthar-steel rounded-xl px-3 py-2.5 text-xs focus:outline-none text-zenthar-text-primary" />
          </div>
          <div className="flex gap-2 ml-auto flex-wrap">
            {hasFilters && (
              <button onClick={() => { setFilters(INITIAL_FILTERS); setPage(0); }}
                className="px-3 py-2.5 text-xs font-bold text-brand-sage border border-zenthar-steel rounded-xl hover:bg-zenthar-void transition-all">Reset</button>
            )}
            <button onClick={exportCSV} disabled={!filtered.length}
              className="flex items-center gap-1.5 px-3 py-2.5 bg-zenthar-text-primary text-white text-xs font-bold rounded-xl hover:opacity-90 disabled:opacity-30">
              <Download className="w-3.5 h-3.5" /> CSV
            </button>
            <button onClick={exportXLSX} disabled={!filtered.length}
              className="flex items-center gap-1.5 px-3 py-2.5 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-500 disabled:opacity-30">
              <Download className="w-3.5 h-3.5" /> XLSX
            </button>
            <button onClick={() => fetchLogs(true)} className="p-2.5 border border-zenthar-steel rounded-xl hover:bg-zenthar-void transition-all">
              <RefreshCw className={clsx("w-4 h-4 text-brand-sage", isRefreshing && "animate-spin")} />
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 bg-white/80 backdrop-blur-xl rounded-3xl border border-white shadow-sm overflow-hidden flex flex-col min-h-0">
        <div className="px-7 py-5 border-b border-zenthar-steel flex items-center justify-between shrink-0 bg-white/50">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 text-brand-primary" />
            <h3 className="text-xs font-black uppercase tracking-widest text-zenthar-text-primary">Audit Trail</h3>
          </div>
          <div className="flex items-center gap-3">
            {isRefreshing && <span className="flex items-center gap-1 text-[9px] font-bold text-brand-primary"><Wifi size={10} className="animate-pulse" /> Live</span>}
            <span className="text-[10px] font-mono text-brand-sage">
              {filtered.length.toLocaleString()} records · showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)}
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-auto custom-scrollbar">
          {loading ? <TableSkeleton rows={8} columns={5} /> : (
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-white/95 backdrop-blur-sm z-10">
                <tr className="border-b border-zenthar-steel">
                  {["Employee", "Action", "Details", "IP", "Timestamp", ""].map((h) => (
                    <th key={h} className="px-5 py-3.5 text-[9px] font-black uppercase tracking-widest text-brand-sage">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zenthar-steel/40">
                {paged.map((log) => (
                  <tr key={log.id} className="hover:bg-zenthar-graphite/20 transition-colors group cursor-pointer" onClick={() => setSelected(log)}>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center text-[9px] font-black text-brand-primary">
                          {log.employee_number.slice(0, 2).toUpperCase()}
                        </div>
                        <span className="text-xs font-bold text-zenthar-text-primary">{log.employee_number}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5"><ActionBadge action={log.action} /></td>
                    <td className="px-5 py-3.5 max-w-xs"><span className="text-xs text-zenthar-text-secondary line-clamp-2">{log.details}</span></td>
                    <td className="px-5 py-3.5"><span className="text-[10px] font-mono text-brand-sage">{log.ip_address || "—"}</span></td>
                    <td className="px-5 py-3.5">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-mono font-bold text-zenthar-text-primary">{new Date(log.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span>
                        <span className="text-[9px] font-mono text-brand-sage/60">{new Date(log.created_at).toLocaleDateString([], { day: "2-digit", month: "short", year: "numeric" })}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <button className="p-2 rounded-lg border border-transparent group-hover:border-zenthar-steel opacity-0 group-hover:opacity-100 transition-all">
                        <Eye className="w-3.5 h-3.5 text-brand-sage" />
                      </button>
                    </td>
                  </tr>
                ))}
                {paged.length === 0 && !loading && (
                  <tr><td colSpan={6} className="px-6 py-16 text-center">
                    <Shield className="w-8 h-8 text-brand-sage/20 mx-auto mb-2" />
                    <p className="text-xs font-black text-brand-sage uppercase">No records match your filters</p>
                  </td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        <div className="px-7 py-4 border-t border-zenthar-steel flex items-center justify-between bg-white/50 shrink-0">
          <span className="text-[10px] font-mono text-brand-sage">Page {page + 1} of {Math.max(1, totalPages)}</span>
          <div className="flex items-center gap-1.5">
            <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}
              className="p-2 rounded-xl border border-zenthar-steel hover:bg-zenthar-void disabled:opacity-30 transition-all">
              <ChevronLeft className="w-4 h-4 text-brand-sage" />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const num = Math.max(0, Math.min(page - 2, totalPages - 5)) + i;
              if (num >= totalPages) return null;
              return (
                <button key={num} onClick={() => setPage(num)}
                  className={clsx("w-8 h-8 rounded-lg text-[10px] font-black transition-all", page === num ? "bg-brand-primary text-white" : "border border-zenthar-steel text-brand-sage hover:bg-zenthar-void")}>
                  {num + 1}
                </button>
              );
            })}
            <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
              className="p-2 rounded-xl border border-zenthar-steel hover:bg-zenthar-void disabled:opacity-30 transition-all">
              <ChevronRight className="w-4 h-4 text-brand-sage" />
            </button>
          </div>
        </div>
      </div>

      {/* Slide-over detail panel */}
      <AnimatePresence>
        {selected && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-end bg-black/20 backdrop-blur-sm"
            onClick={() => setSelected(null)}>
            <motion.div initial={{ x: "100%", opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: "100%", opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
              className="h-full w-full max-w-sm bg-white shadow-2xl border-l border-zenthar-steel flex flex-col">
              <div className="px-7 py-6 border-b border-zenthar-steel flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-brand-primary/10 rounded-xl border border-brand-primary/20"><Info className="w-4 h-4 text-brand-primary" /></div>
                  <div>
                    <h4 className="text-sm font-black text-zenthar-text-primary uppercase tracking-wider">Event #{selected.id}</h4>
                    <p className="text-[9px] font-mono text-brand-sage">{getAction(selected.action).category}</p>
                  </div>
                </div>
                <button onClick={() => setSelected(null)} className="p-2 rounded-xl hover:bg-zenthar-graphite/30 text-brand-sage transition-all"><X className="w-4 h-4" /></button>
              </div>
              <div className="px-7 py-5 border-b border-zenthar-steel bg-zenthar-graphite/20 shrink-0">
                <ActionBadge action={selected.action} />
              </div>
              <div className="flex-1 overflow-y-auto p-7 space-y-5">
                {[
                  ["Employee",  selected.employee_number],
                  ["IP Address",selected.ip_address || "Not recorded"],
                  ["Timestamp", new Date(selected.created_at).toLocaleString()],
                ].map(([label, value]) => (
                  <div key={label} className="flex flex-col gap-1">
                    <span className="text-[9px] font-black text-brand-sage uppercase tracking-widest">{label}</span>
                    <span className="text-xs font-mono text-zenthar-text-primary bg-zenthar-graphite/30 px-3 py-2 rounded-xl border border-zenthar-steel break-all">{value}</span>
                  </div>
                ))}
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-black text-brand-sage uppercase tracking-widest">Details</span>
                  <p className="text-xs text-zenthar-text-secondary bg-zenthar-graphite/30 px-4 py-3 rounded-xl border border-zenthar-steel leading-relaxed">{selected.details}</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

AuditFeature.displayName = "AuditFeature";
export default AuditFeature;