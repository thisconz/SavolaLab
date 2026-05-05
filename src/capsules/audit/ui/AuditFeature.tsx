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
  Activity,
  User,
  Clock,
  X,
  Eye,
  Info,
  Wifi,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { MetricCard } from "../../../shared/components/MetricCard";
import { TableSkeleton } from "../../../shared/components/Skeletons";
import { api } from "../../../core/http/client";
import { useRealtime } from "../../../core/providers/RealtimeProvider";
import type { AuditLog } from "../model/audit.model";
import clsx from "clsx";
import { toast } from "sonner";

// ─────────────────────────────────────────────
// Action config registry
// ─────────────────────────────────────────────

interface ActionConfig {
  color: string;
  bg: string;
  border: string;
  icon: React.ElementType;
}

const ACTIONS_MAP: Record<string, ActionConfig> = {
  SECURITY: { color: "text-rose-500", bg: "bg-rose-500/10", border: "border-rose-500/20", icon: ShieldAlert },
  SUCCESS: {
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    icon: CheckCircle2,
  },
  WARNING: {
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    icon: AlertTriangle,
  },
  NEUTRAL: { color: "text-slate-500", bg: "bg-slate-500/10", border: "border-slate-500/20", icon: Activity },
};

const getActionStyle = (action: string) => {
  if (action.includes("FAILED") || action.includes("LOCKED") || action.includes("ATTEMPT"))
    return ACTIONS_MAP.SECURITY;
  if (action.includes("SUCCESS") || action.includes("ACTIVATED") || action.includes("CREATED"))
    return ACTIONS_MAP.SUCCESS;
  if (action.includes("UPDATED") || action.includes("SENT")) return ACTIONS_MAP.WARNING;
  return ACTIONS_MAP.NEUTRAL;
};

// ─────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────

const ActionBadge = ({ action }: { action: string }) => {
  const style = getActionStyle(action);
  const Icon = style.icon;
  return (
    <div
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-bold tracking-tight uppercase",
        style.bg,
        style.color,
        style.border,
      )}
    >
      <Icon size={12} strokeWidth={2.5} />
      {action.replace(/_/g, " ")}
    </div>
  );
};

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────

const ANOMALY_ACTIONS = new Set([
  "LOGIN_FAILED",
  "TEST_DELETE_ATTEMPT",
  "VERIFICATION_FAILED",
  "ACCOUNT_LOCKED",
]);
const INITIAL_FILTERS = {
  search: "",
  action: "",
  employee_number: "",
  start_date: "",
  end_date: "",
};

// ─────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────

export const AuditFeature: React.FC = memo(() => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [page, setPage] = useState(0);
  const [filters, setFilters] = useState({
    search: "",
    action: "",
    employee_number: "",
    start_date: "",
    end_date: "",
  });
  const [selected, setSelected] = useState<AuditLog | undefined>(undefined);
  const [stats, setStats] = useState({ total: 0, today: 0, uniqueUsers: 0, anomalies: 0 });

  const { on } = useRealtime();
  const PAGE_SIZE = 15;

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchLogs = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      else setIsRefreshing(true);
      try {
        const params = new URLSearchParams();
        if (filters.employee_number) params.set("employee_number", filters.employee_number);
        if (filters.action) params.set("action", filters.action);
        if (filters.start_date) params.set("start_date", filters.start_date);
        if (filters.end_date) params.set("end_date", filters.end_date);
        params.set("limit", "500");
        params.set("offset", "0");

        const res = await api.get<{ success: boolean; data: AuditLog[] }>(`/audit-logs?${params}`);
        const data = res.data || [];
        setLogs(data);

        const today = new Date().toDateString();
        setStats({
          total: data.length,
          today: data.filter((l) => new Date(l.created_at).toDateString() === today).length,
          uniqueUsers: new Set(data.map((l) => l.employee_number)).size,
          anomalies: data.filter((l) => ANOMALY_ACTIONS.has(l.action)).length,
        });
      } catch (err) {
        toast.error("Could not load audit logs");
      } finally {
        setLoading(false);
        setIsRefreshing(false);
      }
    },
    [filters.employee_number, filters.action, filters.start_date, filters.end_date],
  );

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // SSE: refresh on any security / test event
  useEffect(() => {
    const events = [
      "TEST_SUBMITTED",
      "TEST_REVIEWED",
      "SAMPLE_UPDATED",
      "STAT_CREATED",
      "STAT_UPDATED",
    ] as const;
    const unsubs = events.map((e) => on(e, () => setTimeout(() => fetchLogs(true), 800)));
    return () => unsubs.forEach((u) => u());
  }, [on, fetchLogs]);

  // ── Derived ────────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    if (!filters.search) return logs;
    const q = filters.search.toLowerCase();
    return logs.filter(
      (l) =>
        l.action.toLowerCase().includes(q) ||
        l.employee_number.toLowerCase().includes(q) ||
        l.details.toLowerCase().includes(q) ||
        (l.ip_address || "").includes(q),
    );
  }, [logs, filters.search]);

  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const uniqueActions = useMemo(() => [...new Set(logs.map((l) => l.action))].sort(), [logs]);
  const hasFilters = Object.values(filters).some(Boolean);

  // ── Export CSV ──────────────────────────────────────────────────────────────
  const exportCSV = () => {
    const headers = ["ID", "Employee", "Action", "Details", "IP", "Timestamp"];
    const rows = filtered.map((l) => [
      l.id,
      l.employee_number,
      l.action,
      `"${l.details.replace(/"/g, '""')}"`,
      l.ip_address || "",
      l.created_at,
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const a = Object.assign(document.createElement("a"), {
      href: URL.createObjectURL(new Blob([csv], { type: "text/csv" })),
      download: `audit-${new Date().toISOString().split("T")[0]}.csv`,
    });
    a.click();
    toast.success(`Exported ${filtered.length} records`);
  };

  const exportXLSX = async () => {
    try {
      const res = await fetch("/api/export/audit?limit=10000", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const a = Object.assign(document.createElement("a"), {
        href: URL.createObjectURL(blob),
        download: `zenthar-audit-${new Date().toISOString().split("T")[0]}.xlsx`,
      });
      a.click();
      toast.success("XLSX exported");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-full flex-col gap-6 overflow-hidden rounded-3xl bg-(--color-zenthar-graphite)/30 p-2">
      {/* Stats */}
      <div className="grid shrink-0 grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard
          label="Total Events"
          value={stats.total}
          icon={Activity}
          variant="primary"
          trend="Last fetch"
        />
        <MetricCard label="Today" value={stats.today} icon={Clock} variant="secondary" trend="24h window" />
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

      {/* Filter bar */}
      <div className="shrink-0 rounded-3xl border border-white bg-white/80 p-5 shadow-sm backdrop-blur-xl">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[180px] flex-1">
            <label className="text-brand-sage mb-1.5 block text-[9px] font-black tracking-widest uppercase">
              Search
            </label>
            <div className="relative">
              <Search className="text-brand-sage/40 absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Action, employee, IP..."
                value={filters.search}
                onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
                className="bg-zenthar-void border-zenthar-steel focus:border-brand-primary text-zenthar-text-primary w-full rounded-xl border py-2.5 pr-3 pl-9 text-xs focus:outline-none"
              />
            </div>
          </div>
          <div className="w-48">
            <label className="text-brand-sage mb-1.5 block text-[9px] font-black tracking-widest uppercase">
              Action Type
            </label>
            <select
              value={filters.action}
              onChange={(e) => {
                setFilters((f) => ({ ...f, action: e.target.value }));
                setPage(0);
              }}
              className="bg-zenthar-void border-zenthar-steel text-zenthar-text-primary w-full rounded-xl border px-3 py-2.5 text-xs focus:outline-none"
            >
              <option value="">All Actions</option>
              {uniqueActions.map((a) => (
                <option key={a} value={a}>
                  {a.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </div>
          <div className="w-36">
            <label className="text-brand-sage mb-1.5 block text-[9px] font-black tracking-widest uppercase">
              Employee ID
            </label>
            <div className="relative">
              <User className="text-brand-sage/40 absolute top-1/2 left-3 h-3 w-3 -translate-y-1/2" />
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
                className="bg-zenthar-void border-zenthar-steel text-zenthar-text-primary w-full rounded-xl border py-2.5 pr-3 pl-8 text-xs focus:outline-none"
              />
            </div>
          </div>
          <div className="w-32">
            <label className="text-brand-sage mb-1.5 block text-[9px] font-black tracking-widest uppercase">
              From
            </label>
            <input
              type="date"
              value={filters.start_date}
              onChange={(e) => {
                setFilters((f) => ({ ...f, start_date: e.target.value }));
                setPage(0);
              }}
              className="bg-zenthar-void border-zenthar-steel text-zenthar-text-primary w-full rounded-xl border px-3 py-2.5 text-xs focus:outline-none"
            />
          </div>
          <div className="w-32">
            <label className="text-brand-sage mb-1.5 block text-[9px] font-black tracking-widest uppercase">
              To
            </label>
            <input
              type="date"
              value={filters.end_date}
              onChange={(e) => {
                setFilters((f) => ({ ...f, end_date: e.target.value }));
                setPage(0);
              }}
              className="bg-zenthar-void border-zenthar-steel text-zenthar-text-primary w-full rounded-xl border px-3 py-2.5 text-xs focus:outline-none"
            />
          </div>
          <div className="ml-auto flex flex-wrap gap-2">
            {hasFilters && (
              <button
                onClick={() => {
                  setFilters(INITIAL_FILTERS);
                  setPage(0);
                }}
                className="text-brand-sage border-zenthar-steel hover:bg-zenthar-void rounded-xl border px-3 py-2.5 text-xs font-bold transition-all"
              >
                Reset
              </button>
            )}
            <button
              onClick={exportCSV}
              disabled={!filtered.length}
              className="bg-zenthar-text-primary flex items-center gap-1.5 rounded-xl px-3 py-2.5 text-xs font-bold text-white hover:opacity-90 disabled:opacity-30"
            >
              <Download className="h-3.5 w-3.5" /> CSV
            </button>
            <button
              onClick={exportXLSX}
              disabled={!filtered.length}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2.5 text-xs font-bold text-white hover:bg-emerald-500 disabled:opacity-30"
            >
              <Download className="h-3.5 w-3.5" /> XLSX
            </button>
            <button
              onClick={() => fetchLogs(true)}
              className="border-zenthar-steel hover:bg-zenthar-void rounded-xl border p-2.5 transition-all"
            >
              <RefreshCw className={clsx("text-brand-sage h-4 w-4", isRefreshing && "animate-spin")} />
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-zenthar-void/50 flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl border border-white shadow-sm backdrop-blur-xl">
        <div className="border-zenthar-steel flex shrink-0 items-center justify-between border-b bg-white/50 px-7 py-5">
          <div className="flex items-center gap-3">
            <ShieldAlert className="text-brand-primary h-5 w-5" />
            <h3 className="text-zenthar-text-primary text-xs font-black tracking-widest uppercase">
              Audit Trail
            </h3>
          </div>
          <div className="flex items-center gap-3">
            {isRefreshing && (
              <span className="text-brand-primary flex items-center gap-1 text-[9px] font-bold">
                <Wifi size={10} className="animate-pulse" /> Live
              </span>
            )}
            <span className="text-brand-sage font-mono text-[10px]">
              {filtered.length.toLocaleString()} records · showing {page * PAGE_SIZE + 1}–
              {Math.min((page + 1) * PAGE_SIZE, filtered.length)}
            </span>
          </div>
        </div>

        <div className="custom-scrollbar flex-1 overflow-auto">
          {loading ? (
            <TableSkeleton rows={8} columns={5} />
          ) : (
            <table className="w-full border-collapse text-left">
              <thead className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm">
                <tr className="border-zenthar-steel border-b">
                  {["Employee", "Action", "Details", "IP", "Timestamp", ""].map((h) => (
                    <th
                      key={h}
                      className="text-brand-sage px-5 py-3.5 text-[9px] font-black tracking-widest uppercase"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-zenthar-steel/40 divide-y">
                {paged.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-zenthar-graphite/20 group cursor-pointer transition-colors"
                    onClick={() => setSelected(log)}
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="bg-brand-primary/10 border-brand-primary/20 text-brand-primary flex h-7 w-7 items-center justify-center rounded-lg border text-[9px] font-black">
                          {log.employee_number.slice(0, 2).toUpperCase()}
                        </div>
                        <span className="text-zenthar-text-primary text-xs font-bold">
                          {log.employee_number}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <ActionBadge action={log.action} />
                    </td>
                    <td className="max-w-xs px-5 py-3.5">
                      <span className="text-zenthar-text-secondary line-clamp-2 text-xs">{log.details}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-brand-sage font-mono text-[10px]">{log.ip_address || "—"}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex flex-col">
                        <span className="text-zenthar-text-primary font-mono text-[10px] font-bold">
                          {new Date(log.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })}
                        </span>
                        <span className="text-brand-sage/60 font-mono text-[9px]">
                          {new Date(log.created_at).toLocaleDateString([], {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <button className="group-hover:border-zenthar-steel rounded-lg border border-transparent p-2 opacity-0 transition-all group-hover:opacity-100">
                        <Eye className="text-brand-sage h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
                {paged.length === 0 && !loading && (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center">
                      <Shield className="text-brand-sage/20 mx-auto mb-2 h-8 w-8" />
                      <p className="text-brand-sage text-xs font-black uppercase">
                        No records match your filters
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        <div className="border-zenthar-steel flex shrink-0 items-center justify-between border-t bg-white/50 px-7 py-4">
          <span className="text-brand-sage font-mono text-[10px]">
            Page {page + 1} of {Math.max(1, totalPages)}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="border-zenthar-steel hover:bg-zenthar-void rounded-xl border p-2 transition-all disabled:opacity-30"
            >
              <ChevronLeft className="text-brand-sage h-4 w-4" />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const num = Math.max(0, Math.min(page - 2, totalPages - 5)) + i;
              if (num >= totalPages) return undefined;
              return (
                <button
                  key={num}
                  onClick={() => setPage(num)}
                  className={clsx(
                    "h-8 w-8 rounded-lg text-[10px] font-black transition-all",
                    page === num
                      ? "bg-brand-primary text-white"
                      : "border-zenthar-steel text-brand-sage hover:bg-zenthar-void border",
                  )}
                >
                  {num + 1}
                </button>
              );
            })}
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="border-zenthar-steel hover:bg-zenthar-void rounded-xl border p-2 transition-all disabled:opacity-30"
            >
              <ChevronRight className="text-brand-sage h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Slide-over detail panel */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-end bg-black/20 backdrop-blur-sm"
            onClick={() => setSelected(undefined)}
          >
            <motion.div
              initial={{ x: "100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "100%", opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
              className="border-zenthar-steel flex h-full w-full max-w-sm flex-col border-l bg-white shadow-2xl"
            >
              <div className="border-zenthar-steel flex shrink-0 items-center justify-between border-b px-7 py-6">
                <div className="flex items-center gap-3">
                  <div className="bg-brand-primary/10 border-brand-primary/20 rounded-xl border p-2.5">
                    <Info className="text-brand-primary h-4 w-4" />
                  </div>
                </div>
                <button
                  onClick={() => setSelected(undefined)}
                  className="hover:bg-zenthar-graphite/30 text-brand-sage rounded-xl p-2 transition-all"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="border-zenthar-steel bg-zenthar-graphite/20 shrink-0 border-b px-7 py-5">
                <ActionBadge action={selected.action} />
              </div>
              <div className="flex-1 space-y-5 overflow-y-auto p-7">
                {[
                  ["Employee", selected.employee_number],
                  ["IP Address", selected.ip_address || "Not recorded"],
                  ["Timestamp", new Date(selected.created_at).toLocaleString()],
                ].map(([label, value]) => (
                  <div key={label} className="flex flex-col gap-1">
                    <span className="text-brand-sage text-[9px] font-black tracking-widest uppercase">
                      {label}
                    </span>
                    <span className="text-zenthar-text-primary bg-zenthar-graphite/30 border-zenthar-steel rounded-xl border px-3 py-2 font-mono text-xs break-all">
                      {value}
                    </span>
                  </div>
                ))}
                <div className="flex flex-col gap-1">
                  <span className="text-brand-sage text-[9px] font-black tracking-widest uppercase">
                    Details
                  </span>
                  <p className="text-zenthar-text-secondary bg-zenthar-graphite/30 border-zenthar-steel rounded-xl border px-4 py-3 text-xs leading-relaxed">
                    {selected.details}
                  </p>
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
