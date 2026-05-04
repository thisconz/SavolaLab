import React, { useState, useEffect, useCallback } from "react";
import {
  Search,
  Calendar,
  Database,
  FileText,
  Microscope,
  ShieldCheck,
  History,
  Download,
  Eye,
  Clock,
  User,
  Tag,
} from "lucide-react";
import { motion } from "framer-motion";
import { ArchiveApi } from "../api/archive.api";
import { Modal } from "../../../shared/components/Modal";
import { TableSkeleton } from "../../../shared/components/Skeletons";
import { toast } from "sonner";

type ArchiveSection = "samples" | "tests" | "certificates" | "instruments" | "audit";

const SECTIONS = [
  { id: "samples", label: "Sample Archive", icon: Database },
  { id: "tests", label: "Test Results", icon: Microscope },
  { id: "certificates", label: "Certificates", icon: FileText },
  { id: "instruments", label: "Instrument History", icon: History },
  { id: "audit", label: "Audit Logs", icon: ShieldCheck },
] as const;

export const ArchivePage: React.FC = () => {
  const [activeSection, setActiveSection] = useState<ArchiveSection>("samples");
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    batch_id: "",
    status: "",
    start_date: "",
    end_date: "",
    test_type: "",
    technician: "",
    stage: "",
  });
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await ArchiveApi.search(activeSection as any, {
        ...filters,
        batch_id: searchQuery || filters.batch_id,
      });
      setData(result);
    } catch (err) {
      toast.error("Failed to fetch archive data");
    } finally {
      setLoading(false);
    }
  }, [activeSection, filters, searchQuery]);

  useEffect(() => {
    fetchData();
  }, [activeSection]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData();
  };

  // ── Server-side XLSX export ─────────────────────────────────────────────
  const handleExport = async () => {
    setExporting(true);
    try {
      const exportType =
        activeSection === "tests" ? "tests" : activeSection === "audit" ? "audit" : activeSection;
      const response = await fetch(`/api/export/${exportType}?limit=5000`, {
        credentials: "include",
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Export failed");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `zenthar-${activeSection}-${new Date().toISOString().split("T")[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("Export downloaded successfully");
    } catch (err: any) {
      toast.error(err.message || "Export failed");
    } finally {
      setExporting(false);
    }
  };

  const handleDownloadRecord = (item: any) => {
    const blob = new Blob([JSON.stringify(item, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `record-${item.id ?? "export"}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Record downloaded");
  };

  return (
    <div className="flex h-full flex-col gap-5 overflow-hidden rounded-3xl bg-(--color-zenthar-graphite)/30 p-2">
      {/* ── Filter bar ── */}
      <div className="border-brand-sage/10 shrink-0 rounded-3xl border bg-(--color-zenthar-carbon) p-6">
        <form onSubmit={handleSearch} className="flex flex-wrap items-end gap-3">
          <div className="min-w-[180px] flex-1">
            <label className="text-brand-sage mb-2 block text-[9px] font-black tracking-widest uppercase">
              Search
            </label>
            <div className="relative">
              <Search className="text-brand-sage/40 absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Batch ID..."
                className="border-brand-sage/10 focus:ring-brand-primary w-full rounded-xl border bg-(--color-zenthar-void) py-3 pr-4 pl-11 text-sm text-white outline-none focus:ring-2"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="w-36">
            <label className="text-brand-sage mb-2 block text-[9px] font-black tracking-widest uppercase">
              Status
            </label>
            <select
              className="border-brand-sage/10 w-full rounded-xl border bg-(--color-zenthar-void) px-3 py-3 text-sm text-white outline-none"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              <option value="">All</option>
              <option value="COMPLETED">Completed</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
            </select>
          </div>
          <div className="w-36">
            <label className="text-brand-sage mb-2 block text-[9px] font-black tracking-widest uppercase">
              Start Date
            </label>
            <div className="relative">
              <Calendar className="text-brand-sage/40 absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
              <input
                type="date"
                className="border-brand-sage/10 w-full rounded-xl border bg-(--color-zenthar-void) py-3 pr-3 pl-10 text-sm text-white outline-none"
                value={filters.start_date}
                onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
              />
            </div>
          </div>
          <button
            type="submit"
            className="hover:bg-brand-primary rounded-xl bg-(--color-zenthar-graphite) px-5 py-3 text-xs font-bold tracking-widest text-white uppercase transition-all"
          >
            Filter
          </button>
        </form>
      </div>

      {/* ── Content ── */}
      <div className="flex min-h-0 flex-1 gap-6 overflow-hidden">
        {/* Section tabs */}
        <div className="flex w-56 shrink-0 flex-col gap-2">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id as ArchiveSection)}
              className={`group flex items-center gap-3 rounded-3xl border px-5 py-4 text-left transition-all ${
                activeSection === s.id
                  ? "border-brand-primary scale-[1.01] bg-(--color-zenthar-carbon) shadow-lg"
                  : "border-brand-sage/20 hover:border-brand-primary/40 bg-(--color-zenthar-carbon)/60"
              }`}
            >
              {activeSection === s.id && (
                <motion.div
                  layoutId="activeTab"
                  className="bg-brand-primary absolute top-0 bottom-0 left-0 w-1.5 rounded-l-3xl"
                />
              )}
              <div
                className={`rounded-xl p-2 transition-all ${activeSection === s.id ? "bg-(--color-zenthar-graphite)" : "border-brand-sage/10 border bg-(--color-zenthar-void)"}`}
              >
                <s.icon
                  className={`h-4 w-4 ${activeSection === s.id ? "text-brand-primary" : "text-brand-sage"}`}
                />
              </div>
              <span
                className={`text-sm font-bold ${activeSection === s.id ? "text-white" : "text-brand-sage"}`}
              >
                {s.label}
              </span>
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="border-brand-sage/10 flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl border bg-(--color-zenthar-carbon)">
          <div className="border-brand-sage/10 flex shrink-0 items-center justify-between border-b px-7 py-5">
            <div className="flex items-center gap-3">
              <div className="bg-brand-primary/10 border-brand-primary/20 rounded-xl border p-2">
                <Database className="text-brand-primary h-4 w-4" />
              </div>
              <div>
                <h3 className="font-mono text-sm font-black text-white uppercase">{activeSection}</h3>
                <div className="mt-0.5 flex items-center gap-2">
                  <div className="bg-brand-primary h-1.5 w-1.5 animate-pulse rounded-full" />
                  <span className="text-brand-sage text-[9px] font-bold tracking-widest uppercase">
                    {data.length} records
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={handleExport}
              disabled={exporting || data.length === 0}
              className="hover:bg-brand-primary border-brand-sage/10 flex items-center gap-2 rounded-2xl border bg-(--color-zenthar-graphite) px-5 py-2.5 text-xs font-bold tracking-widest text-white uppercase transition-all disabled:opacity-40"
            >
              <Download className={`h-4 w-4 ${exporting ? "animate-bounce" : ""}`} />
              {exporting ? "Exporting..." : "Export XLSX"}
            </button>
          </div>

          <div className="custom-scrollbar flex-1 overflow-auto">
            {loading ? (
              <TableSkeleton rows={8} columns={5} />
            ) : data.length === 0 ? (
              <div className="text-brand-sage/40 flex h-48 flex-col items-center justify-center gap-3">
                <Database className="h-10 w-10" />
                <p className="text-xs font-black tracking-widest uppercase">No records found</p>
              </div>
            ) : (
              <table className="w-full border-collapse text-left">
                <thead className="sticky top-0 z-10 bg-(--color-zenthar-carbon)">
                  <tr className="border-brand-sage/10 border-b">
                    {["ID / Batch", "Details", "Status", "Timestamp", ""].map((h) => (
                      <th
                        key={h}
                        className="text-brand-sage p-4 text-[9px] font-black tracking-widest uppercase"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-brand-sage/5 divide-y">
                  {data.map((item, idx) => (
                    <tr
                      key={item.id ?? idx}
                      className="group transition-colors hover:bg-(--color-zenthar-graphite)/50"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="border-brand-sage/10 flex h-8 w-8 items-center justify-center rounded border bg-(--color-zenthar-void) font-mono text-[9px] text-white">
                            {item.id}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-white uppercase">
                              {item.batch_id || "N/A"}
                            </div>
                            <div className="text-brand-sage font-mono text-[9px]">
                              {item.test_type || item.type || "Record"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="max-w-xs p-4">
                        <div className="truncate text-xs text-white">
                          {item.details || item.message || item.reason || item.action || "—"}
                        </div>
                        <div className="mt-1 flex items-center gap-1.5">
                          <User className="text-brand-sage/40 h-3 w-3" />
                          <span className="text-brand-sage text-[9px]">
                            {item.technician_name || item.performer_name || item.employee_name || "System"}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span
                          className={`rounded px-2 py-1 text-[9px] font-bold uppercase ${
                            ["COMPLETED", "APPROVED", "ACTIVE"].includes(item.status)
                              ? "border border-emerald-500/20 bg-emerald-900/30 text-emerald-400"
                              : "text-brand-sage border-brand-sage/10 border bg-(--color-zenthar-void)"
                          }`}
                        >
                          {item.status || "—"}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="text-brand-sage flex items-center gap-1.5 font-mono text-[10px]">
                          <Clock className="h-3 w-3" />
                          {new Date(item.created_at || item.performed_at).toLocaleString()}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                          <button
                            onClick={() => setSelectedRecord(item)}
                            className="text-brand-sage hover:bg-brand-primary border-brand-sage/10 rounded-lg border bg-(--color-zenthar-void) p-2 transition-all hover:text-white"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDownloadRecord(item)}
                            className="text-brand-sage border-brand-sage/10 rounded-lg border bg-(--color-zenthar-void) p-2 transition-all hover:bg-(--color-zenthar-graphite) hover:text-white"
                          >
                            <Download className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Detail modal */}
      <Modal
        isOpen={!!selectedRecord}
        onClose={() => setSelectedRecord(null)}
        title={`Record #${selectedRecord?.id ?? "—"}`}
        maxWidth="max-w-2xl"
      >
        <div className="space-y-5">
          <div className="border-brand-sage/20 custom-scrollbar max-h-96 overflow-x-auto rounded-xl border bg-(--color-zenthar-void) p-4">
            <pre className="text-brand-sage font-mono text-[10px] whitespace-pre-wrap">
              {JSON.stringify(selectedRecord, null, 2)}
            </pre>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setSelectedRecord(null)}
              className="text-brand-sage border-brand-sage/10 flex-1 rounded-2xl border px-5 py-3.5 text-[10px] font-black tracking-widest uppercase transition-all hover:bg-(--color-zenthar-graphite)"
            >
              Close
            </button>
            <button
              onClick={() => handleDownloadRecord(selectedRecord)}
              className="bg-brand-primary flex flex-1 items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-[10px] font-black tracking-widest text-white uppercase"
            >
              <Download className="h-3.5 w-3.5" /> Download JSON
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ArchivePage;
