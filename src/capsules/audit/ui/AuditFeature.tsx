import React, { memo, useState, useEffect, useCallback, useMemo } from "react";
import {
  ShieldAlert,
  Search,
  Download,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Shield,
  LogIn,
  LogOut,
  FileEdit,
  Trash2,
  Database,
  Zap,
  Activity,
  User,
  Clock,
  X,
  Eye,
  Info,
} from "lucide-react";
import { motion, AnimatePresence } from "@/src/lib/motion";
import { MetricCard } from "../../../ui/components/MetricCard";
import { api } from "../../../core/http/client";
import { AuditLog } from "../model/audit.model";
import clsx from "@/src/lib/clsx";
import { toast } from "sonner";

// ─────────────────────────────────────────────────────────────────────────────
// Action Configuration Registry
// ─────────────────────────────────────────────────────────────────────────────

interface ActionConfig {
  color: string;
  bg: string;
  dot: string;
  icon: React.ElementType;
  category: string;
}

const ACTION_REGISTRY: Record<string, ActionConfig> = {
  LOGIN_SUCCESS: {
    color: "text-emerald-700",
    bg: "bg-emerald-50 border-emerald-200",
    dot: "bg-emerald-500",
    icon: LogIn,
    category: "Auth",
  },
  LOGIN_FAILED: {
    color: "text-red-700",
    bg: "bg-red-50 border-red-200",
    dot: "bg-red-500",
    icon: AlertTriangle,
    category: "Auth",
  },
  LOGOUT: {
    color: "text-slate-600",
    bg: "bg-slate-50 border-slate-200",
    dot: "bg-slate-400",
    icon: LogOut,
    category: "Auth",
  },
  OTP_SENT: {
    color: "text-violet-700",
    bg: "bg-violet-50 border-violet-200",
    dot: "bg-violet-500",
    icon: Shield,
    category: "Auth",
  },
  OTP_CONFIRMATION: {
    color: "text-violet-700",
    bg: "bg-violet-50 border-violet-200",
    dot: "bg-violet-500",
    icon: Shield,
    category: "Auth",
  },
  ACCOUNT_ACTIVATED: {
    color: "text-emerald-700",
    bg: "bg-emerald-50 border-emerald-200",
    dot: "bg-emerald-500",
    icon: CheckCircle2,
    category: "Auth",
  },
  SAMPLE_UPDATED: {
    color: "text-blue-700",
    bg: "bg-blue-50 border-blue-200",
    dot: "bg-blue-500",
    icon: FileEdit,
    category: "Sample",
  },
  TEST_CREATED: {
    color: "text-indigo-700",
    bg: "bg-indigo-50 border-indigo-200",
    dot: "bg-indigo-500",
    icon: Database,
    category: "Test",
  },
  TEST_UPDATED: {
    color: "text-indigo-700",
    bg: "bg-indigo-50 border-indigo-200",
    dot: "bg-indigo-500",
    icon: FileEdit,
    category: "Test",
  },
  TEST_DELETE_ATTEMPT: {
    color: "text-red-700",
    bg: "bg-red-50 border-red-200",
    dot: "bg-red-500",
    icon: Trash2,
    category: "Security",
  },
  STAT_REQUEST_CREATED: {
    color: "text-amber-700",
    bg: "bg-amber-50 border-amber-200",
    dot: "bg-amber-500",
    icon: Zap,
    category: "STAT",
  },
  STAT_REQUEST_UPDATED: {
    color: "text-amber-700",
    bg: "bg-amber-50 border-amber-200",
    dot: "bg-amber-500",
    icon: Zap,
    category: "STAT",
  },
  FETCH_PRODUCTION_LINES: {
    color: "text-teal-700",
    bg: "bg-teal-50 border-teal-200",
    dot: "bg-teal-500",
    icon: Activity,
    category: "System",
  },
  VERIFICATION_FAILED: {
    color: "text-red-700",
    bg: "bg-red-50 border-red-200",
    dot: "bg-red-500",
    icon: AlertTriangle,
    category: "Security",
  },
};

const DEFAULT_ACTION_CONFIG: ActionConfig = {
  color: "text-slate-600",
  bg: "bg-slate-50 border-slate-200",
  dot: "bg-slate-400",
  icon: Activity,
  category: "System",
};

const getActionConfig = (action: string): ActionConfig =>
  ACTION_REGISTRY[action] || DEFAULT_ACTION_CONFIG;

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface FilterState {
  search: string;
  action: string;
  employee_number: string;
  start_date: string;
  end_date: string;
}

interface AuditStats {
  total: number;
  today: number;
  uniqueUsers: number;
  anomalies: number;
}

const ITEMS_PER_PAGE = 25;
const INITIAL_FILTERS: FilterState = {
  search: "",
  action: "",
  employee_number: "",
  start_date: "",
  end_date: "",
};

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

const ActionBadge: React.FC<{ action: string }> = ({ action }) => {
  const config = getActionConfig(action);
  const Icon = config.icon;
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[9px] font-black uppercase tracking-wider whitespace-nowrap",
        config.bg,
        config.color,
      )}
    >
      <Icon className="w-3 h-3 shrink-0" />
      {action.replace(/_/g, " ")}
    </span>
  );
};

const StatRow: React.FC<{ label: string; value: string }> = ({
  label,
  value,
}) => (
  <div className="flex flex-col gap-1">
    <span className="text-[9px] font-black text-brand-sage uppercase tracking-widest">
      {label}
    </span>
    <span className="text-xs font-mono text-zenthar-text-primary bg-zenthar-graphite/30 px-3 py-2 rounded-xl border border-zenthar-steel break-all">
      {value}
    </span>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

export const AuditFeature: React.FC = memo(() => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTERS);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [stats, setStats] = useState<AuditStats>({
    total: 0,
    today: 0,
    uniqueUsers: 0,
    anomalies: 0,
  });

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.employee_number)
        params.set("employee_number", filters.employee_number);
      if (filters.action) params.set("action", filters.action);
      if (filters.start_date) params.set("start_date", filters.start_date);
      if (filters.end_date) params.set("end_date", filters.end_date);
      params.set("limit", "500"); // fetch a larger batch for client-side stats
      params.set("offset", "0");

      const res = await api.get<{ success: boolean; data: AuditLog[] }>(
        `/audit-logs?${params}`,
      );
      const data = res.data || [];
      setLogs(data);

      const todayStr = new Date().toDateString();
      const ANOMALY_ACTIONS = [
        "LOGIN_FAILED",
        "TEST_DELETE_ATTEMPT",
        "VERIFICATION_FAILED",
      ];

      setStats({
        total: data.length,
        today: data.filter(
          (l) => new Date(l.created_at).toDateString() === todayStr,
        ).length,
        uniqueUsers: new Set(data.map((l) => l.employee_number)).size,
        anomalies: data.filter((l) => ANOMALY_ACTIONS.includes(l.action))
          .length,
      });
    } catch (err) {
      console.error("Failed to fetch audit logs", err);
      toast.error("Could not load audit logs");
    } finally {
      setLoading(false);
    }
  }, [
    filters.employee_number,
    filters.action,
    filters.start_date,
    filters.end_date,
  ]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // ── Derived / filtered data ────────────────────────────────────────────────

  const filteredLogs = useMemo(() => {
    if (!filters.search) return logs;
    const q = filters.search.toLowerCase();
    return logs.filter(
      (l) =>
        l.action.toLowerCase().includes(q) ||
        l.employee_number.toLowerCase().includes(q) ||
        l.details.toLowerCase().includes(q) ||
        (l.ip_address || "").toLowerCase().includes(q),
    );
  }, [logs, filters.search]);

  const pagedLogs = useMemo(() => {
    const start = page * ITEMS_PER_PAGE;
    return filteredLogs.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredLogs, page]);

  const totalPages = Math.ceil(filteredLogs.length / ITEMS_PER_PAGE);

  const uniqueActionTypes = useMemo(
    () => Array.from(new Set(logs.map((l) => l.action))).sort(),
    [logs],
  );

  // ── Export ─────────────────────────────────────────────────────────────────

  const handleExportCSV = () => {
    const headers = ["ID", "Employee", "Action", "Details", "IP", "Timestamp"];
    const rows = filteredLogs.map((l) => [
      l.id,
      l.employee_number,
      l.action,
      `"${l.details.replace(/"/g, '""')}"`,
      l.ip_address || "",
      l.created_at,
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${filteredLogs.length} records`);
  };

  // ── Reset filters ──────────────────────────────────────────────────────────

  const handleReset = () => {
    setFilters(INITIAL_FILTERS);
    setPage(0);
  };

  const hasActiveFilters = Object.values(filters).some((v) => v !== "");

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6 h-full overflow-hidden bg-(--color-zenthar-graphite)/30 p-2 rounded-3xl">
      {/* ── Stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
        <MetricCard
          label="Total Events"
          value={stats.total}
          icon={Activity}
          variant="primary"
          trend={`Last fetch`}
        />
        <MetricCard
          label="Today"
          value={stats.today}
          icon={Clock}
          variant="secondary"
          trend="24h window"
        />
        <MetricCard
          label="Unique Users"
          value={stats.uniqueUsers}
          icon={User}
          variant="success"
          trend="Active accounts"
        />
        <MetricCard
          label="Anomalies"
          value={stats.anomalies}
          icon={AlertTriangle}
          variant="error"
          trend="Failed / blocked"
        />
      </div>

      {/* ── Filter Bar ── */}
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white p-6 shadow-sm shrink-0">
        <div className="flex flex-wrap gap-3 items-end">
          {/* Search */}
          <div className="flex-1 min-w-52">
            <label className="text-[9px] font-black text-brand-sage uppercase tracking-widest block mb-2">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-brand-sage/50" />
              <input
                type="text"
                placeholder="Action, employee, details, IP..."
                value={filters.search}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, search: e.target.value }))
                }
                className="w-full bg-zenthar-void border border-zenthar-steel rounded-xl pl-9 pr-3 py-2.5 text-xs focus:outline-none focus:border-brand-primary text-zenthar-text-primary transition-all"
              />
            </div>
          </div>

          {/* Action type */}
          <div className="w-52">
            <label className="text-[9px] font-black text-brand-sage uppercase tracking-widest block mb-2">
              Action Type
            </label>
            <select
              value={filters.action}
              onChange={(e) => {
                setFilters((f) => ({ ...f, action: e.target.value }));
                setPage(0);
              }}
              className="w-full bg-zenthar-void border border-zenthar-steel rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-brand-primary text-zenthar-text-primary"
            >
              <option value="">All Actions</option>
              {uniqueActionTypes.map((a) => (
                <option key={a} value={a}>
                  {a.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </div>

          {/* Employee */}
          <div className="w-40">
            <label className="text-[9px] font-black text-brand-sage uppercase tracking-widest block mb-2">
              Employee ID
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-brand-sage/50" />
              <input
                type="text"
                placeholder="EMP-ID..."
                value={filters.employee_number}
                onChange={(e) => {
                  setFilters((f) => ({
                    ...f,
                    employee_number: e.target.value,
                  }));
                  setPage(0);
                }}
                className="w-full bg-zenthar-void border border-zenthar-steel rounded-xl pl-9 pr-3 py-2.5 text-xs focus:outline-none focus:border-brand-primary text-zenthar-text-primary"
              />
            </div>
          </div>

          {/* Date range */}
          <div className="w-36">
            <label className="text-[9px] font-black text-brand-sage uppercase tracking-widest block mb-2">
              From
            </label>
            <input
              type="date"
              value={filters.start_date}
              onChange={(e) => {
                setFilters((f) => ({ ...f, start_date: e.target.value }));
                setPage(0);
              }}
              className="w-full bg-zenthar-void border border-zenthar-steel rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-brand-primary text-zenthar-text-primary"
            />
          </div>
          <div className="w-36">
            <label className="text-[9px] font-black text-brand-sage uppercase tracking-widest block mb-2">
              To
            </label>
            <input
              type="date"
              value={filters.end_date}
              onChange={(e) => {
                setFilters((f) => ({ ...f, end_date: e.target.value }));
                setPage(0);
              }}
              className="w-full bg-zenthar-void border border-zenthar-steel rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-brand-primary text-zenthar-text-primary"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 ml-auto">
            {hasActiveFilters && (
              <button
                onClick={handleReset}
                className="px-4 py-2.5 text-xs font-bold text-brand-sage border border-zenthar-steel rounded-xl hover:bg-zenthar-void transition-all"
              >
                Reset
              </button>
            )}
            <button
              onClick={handleExportCSV}
              disabled={filteredLogs.length === 0}
              className="flex items-center gap-2 px-4 py-2.5 bg-zenthar-text-primary text-white text-xs font-bold rounded-xl hover:opacity-90 transition-all disabled:opacity-30"
            >
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </button>
            <button
              onClick={fetchLogs}
              className="p-2.5 border border-zenthar-steel rounded-xl hover:bg-zenthar-void transition-all"
              title="Refresh"
            >
              <RefreshCw
                className={clsx(
                  "w-4 h-4 text-brand-sage",
                  loading && "animate-spin",
                )}
              />
            </button>
          </div>
        </div>
      </div>

      {/* ── Table Panel ── */}
      <div className="flex-1 bg-white/80 backdrop-blur-xl rounded-3xl border border-white shadow-sm overflow-hidden flex flex-col min-h-0">
        {/* Table header */}
        <div className="px-8 py-5 border-b border-zenthar-steel flex items-center justify-between shrink-0 bg-white/50">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 text-brand-primary" />
            <h3 className="text-xs font-black uppercase tracking-widest text-zenthar-text-primary">
              Audit Trail
            </h3>
          </div>
          <span className="text-[10px] font-mono text-brand-sage">
            {filteredLogs.length.toLocaleString()} records ·{" "}
            {page * ITEMS_PER_PAGE + 1}–
            {Math.min((page + 1) * ITEMS_PER_PAGE, filteredLogs.length)} shown
          </span>
        </div>

        {/* Scrollable table */}
        <div className="flex-1 overflow-auto custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-48 gap-4">
              <div className="w-8 h-8 border-4 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin" />
              <span className="text-[10px] font-black text-brand-sage uppercase tracking-widest">
                Loading records...
              </span>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-white/95 backdrop-blur-sm z-10">
                <tr className="border-b border-zenthar-steel">
                  {[
                    "Employee",
                    "Action",
                    "Details",
                    "IP Address",
                    "Timestamp",
                    "",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-5 py-3.5 text-[9px] font-black uppercase tracking-widest text-brand-sage"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zenthar-steel/40">
                {pagedLogs.map((log) => {
                  const config = getActionConfig(log.action);
                  return (
                    <tr
                      key={log.id}
                      className="hover:bg-zenthar-graphite/20 transition-colors group cursor-pointer"
                      onClick={() => setSelectedLog(log)}
                    >
                      {/* Employee */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-lg bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center text-[9px] font-black text-brand-primary shrink-0">
                            {log.employee_number.substring(0, 2).toUpperCase()}
                          </div>
                          <span className="text-xs font-bold text-zenthar-text-primary">
                            {log.employee_number}
                          </span>
                        </div>
                      </td>

                      {/* Action */}
                      <td className="px-5 py-3.5">
                        <ActionBadge action={log.action} />
                      </td>

                      {/* Details */}
                      <td className="px-5 py-3.5 max-w-xs">
                        <span className="text-xs text-zenthar-text-secondary line-clamp-2 leading-relaxed">
                          {log.details}
                        </span>
                      </td>

                      {/* IP */}
                      <td className="px-5 py-3.5">
                        <span className="text-[10px] font-mono text-brand-sage">
                          {log.ip_address || "—"}
                        </span>
                      </td>

                      {/* Timestamp */}
                      <td className="px-5 py-3.5">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-mono font-bold text-zenthar-text-primary">
                            {new Date(log.created_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                              second: "2-digit",
                            })}
                          </span>
                          <span className="text-[9px] font-mono text-brand-sage/60">
                            {new Date(log.created_at).toLocaleDateString([], {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                      </td>

                      {/* View */}
                      <td className="px-5 py-3.5">
                        <button className="p-2 rounded-lg border border-transparent group-hover:border-zenthar-steel hover:bg-zenthar-void transition-all opacity-0 group-hover:opacity-100">
                          <Eye className="w-3.5 h-3.5 text-brand-sage" />
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {pagedLogs.length === 0 && !loading && (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center">
                      <Shield className="w-10 h-10 text-brand-sage/20 mx-auto mb-3" />
                      <p className="text-xs font-black text-brand-sage uppercase tracking-widest">
                        No records match your filters
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination footer */}
        <div className="px-8 py-4 border-t border-zenthar-steel flex items-center justify-between bg-white/50 shrink-0">
          <span className="text-[10px] font-mono text-brand-sage">
            Page {page + 1} of {Math.max(1, totalPages)}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="p-2 rounded-xl border border-zenthar-steel hover:bg-zenthar-void disabled:opacity-30 transition-all"
            >
              <ChevronLeft className="w-4 h-4 text-brand-sage" />
            </button>
            {/* Page numbers */}
            <div className="flex gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum =
                  Math.max(0, Math.min(page - 2, totalPages - 5)) + i;
                if (pageNum >= totalPages) return null;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={clsx(
                      "w-8 h-8 rounded-lg text-[10px] font-black transition-all",
                      page === pageNum
                        ? "bg-brand-primary text-white"
                        : "border border-zenthar-steel text-brand-sage hover:bg-zenthar-void",
                    )}
                  >
                    {pageNum + 1}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="p-2 rounded-xl border border-zenthar-steel hover:bg-zenthar-void disabled:opacity-30 transition-all"
            >
              <ChevronRight className="w-4 h-4 text-brand-sage" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Log Detail Slide-over ── */}
      <AnimatePresence>
        {selectedLog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-end bg-black/20 backdrop-blur-sm"
            onClick={() => setSelectedLog(null)}
          >
            <motion.div
              initial={{ x: "100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "100%", opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}
              className="h-full w-full max-w-md bg-white shadow-2xl border-l border-zenthar-steel flex flex-col"
            >
              {/* Header */}
              <div className="px-8 py-6 border-b border-zenthar-steel flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-brand-primary/10 rounded-xl border border-brand-primary/20">
                    <Info className="w-4 h-4 text-brand-primary" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-zenthar-text-primary uppercase tracking-wider">
                      Event Detail
                    </h4>
                    <p className="text-[9px] font-mono text-brand-sage">
                      #{selectedLog.id}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="p-2 rounded-xl hover:bg-zenthar-graphite/30 text-brand-sage transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Action badge */}
              <div className="px-8 py-5 border-b border-zenthar-steel bg-zenthar-graphite/20 shrink-0">
                <ActionBadge action={selectedLog.action} />
              </div>

              {/* Fields */}
              <div className="flex-1 overflow-y-auto p-8 space-y-5">
                <StatRow label="Employee" value={selectedLog.employee_number} />
                <StatRow label="Action" value={selectedLog.action} />
                <StatRow
                  label="IP Address"
                  value={selectedLog.ip_address || "Not recorded"}
                />
                <StatRow
                  label="Timestamp"
                  value={new Date(selectedLog.created_at).toLocaleString()}
                />
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-black text-brand-sage uppercase tracking-widest">
                    Details
                  </span>
                  <p className="text-xs text-zenthar-text-secondary bg-zenthar-graphite/30 px-4 py-3 rounded-xl border border-zenthar-steel leading-relaxed font-medium">
                    {selectedLog.details}
                  </p>
                </div>

                {/* Category chip */}
                <div className="pt-2">
                  <span className="text-[9px] font-black text-brand-sage uppercase tracking-widest block mb-2">
                    Category
                  </span>
                  <span className="px-3 py-1.5 rounded-lg bg-brand-primary/10 border border-brand-primary/20 text-[10px] font-black text-brand-primary uppercase tracking-wider">
                    {getActionConfig(selectedLog.action).category}
                  </span>
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