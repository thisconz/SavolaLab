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
import { motion } from "@/src/lib/motion";
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
    <div className="h-full flex flex-col gap-5 overflow-hidden bg-(--color-zenthar-graphite)/30 p-2 rounded-3xl">
      {/* ── Filter bar ── */}
      <div className="bg-(--color-zenthar-carbon) p-6 rounded-3xl border border-brand-sage/10 shrink-0">
        <form onSubmit={handleSearch} className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[180px]">
            <label className="text-[9px] font-black text-brand-sage uppercase tracking-widest block mb-2">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-sage/40" />
              <input
                type="text"
                placeholder="Batch ID..."
                className="w-full bg-(--color-zenthar-void) border border-brand-sage/10 rounded-xl pl-11 pr-4 py-3 text-sm focus:ring-2 focus:ring-brand-primary outline-none text-white"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="w-36">
            <label className="text-[9px] font-black text-brand-sage uppercase tracking-widest block mb-2">
              Status
            </label>
            <select
              className="w-full bg-(--color-zenthar-void) border border-brand-sage/10 rounded-xl px-3 py-3 text-sm outline-none text-white"
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
            <label className="text-[9px] font-black text-brand-sage uppercase tracking-widest block mb-2">
              Start Date
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-sage/40" />
              <input
                type="date"
                className="w-full bg-(--color-zenthar-void) border border-brand-sage/10 rounded-xl pl-10 pr-3 py-3 text-sm outline-none text-white"
                value={filters.start_date}
                onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
              />
            </div>
          </div>
          <button
            type="submit"
            className="px-5 py-3 bg-(--color-zenthar-graphite) text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-brand-primary transition-all"
          >
            Filter
          </button>
        </form>
      </div>

      {/* ── Content ── */}
      <div className="flex-1 flex gap-6 overflow-hidden min-h-0">
        {/* Section tabs */}
        <div className="w-56 flex flex-col gap-2 shrink-0">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id as ArchiveSection)}
              className={`flex items-center gap-3 px-5 py-4 rounded-3xl transition-all border text-left group ${
                activeSection === s.id
                  ? "bg-(--color-zenthar-carbon) border-brand-primary shadow-lg scale-[1.01]"
                  : "bg-(--color-zenthar-carbon)/60 border-brand-sage/20 hover:border-brand-primary/40"
              }`}
            >
              {activeSection === s.id && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute left-0 top-0 bottom-0 w-1.5 bg-brand-primary rounded-l-3xl"
                />
              )}
              <div
                className={`p-2 rounded-xl transition-all ${activeSection === s.id ? "bg-(--color-zenthar-graphite)" : "bg-(--color-zenthar-void) border border-brand-sage/10"}`}
              >
                <s.icon
                  className={`w-4 h-4 ${activeSection === s.id ? "text-brand-primary" : "text-brand-sage"}`}
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
        <div className="flex-1 bg-(--color-zenthar-carbon) rounded-3xl border border-brand-sage/10 overflow-hidden flex flex-col min-h-0">
          <div className="px-7 py-5 border-b border-brand-sage/10 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-brand-primary/10 rounded-xl border border-brand-primary/20">
                <Database className="w-4 h-4 text-brand-primary" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white uppercase font-mono">
                  {activeSection}
                </h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-brand-primary animate-pulse" />
                  <span className="text-[9px] font-bold text-brand-sage uppercase tracking-widest">
                    {data.length} records
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={handleExport}
              disabled={exporting || data.length === 0}
              className="flex items-center gap-2 px-5 py-2.5 bg-(--color-zenthar-graphite) text-white rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-brand-primary transition-all disabled:opacity-40 border border-brand-sage/10"
            >
              <Download className={`w-4 h-4 ${exporting ? "animate-bounce" : ""}`} />
              {exporting ? "Exporting..." : "Export XLSX"}
            </button>
          </div>

          <div className="flex-1 overflow-auto custom-scrollbar">
            {loading ? (
              <TableSkeleton rows={8} columns={5} />
            ) : data.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 gap-3 text-brand-sage/40">
                <Database className="w-10 h-10" />
                <p className="text-xs font-black uppercase tracking-widest">No records found</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-(--color-zenthar-carbon) z-10">
                  <tr className="border-b border-brand-sage/10">
                    {["ID / Batch", "Details", "Status", "Timestamp", ""].map((h) => (
                      <th
                        key={h}
                        className="p-4 text-[9px] font-black text-brand-sage uppercase tracking-widest"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-sage/5">
                  {data.map((item, idx) => (
                    <tr
                      key={item.id ?? idx}
                      className="hover:bg-(--color-zenthar-graphite)/50 transition-colors group"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-(--color-zenthar-void) rounded flex items-center justify-center text-[9px] font-mono text-white border border-brand-sage/10">
                            {item.id}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-white uppercase">
                              {item.batch_id || "N/A"}
                            </div>
                            <div className="text-[9px] text-brand-sage font-mono">
                              {item.test_type || item.type || "Record"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 max-w-xs">
                        <div className="text-xs text-white truncate">
                          {item.details || item.message || item.reason || item.action || "—"}
                        </div>
                        <div className="flex items-center gap-1.5 mt-1">
                          <User className="w-3 h-3 text-brand-sage/40" />
                          <span className="text-[9px] text-brand-sage">
                            {item.technician_name ||
                              item.performer_name ||
                              item.employee_name ||
                              "System"}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2 py-1 rounded text-[9px] font-bold uppercase ${
                            ["COMPLETED", "APPROVED", "ACTIVE"].includes(item.status)
                              ? "bg-emerald-900/30 text-emerald-400 border border-emerald-500/20"
                              : "bg-(--color-zenthar-void) text-brand-sage border border-brand-sage/10"
                          }`}
                        >
                          {item.status || "—"}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1.5 text-[10px] text-brand-sage font-mono">
                          <Clock className="w-3 h-3" />
                          {new Date(item.created_at || item.performed_at).toLocaleString()}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => setSelectedRecord(item)}
                            className="p-2 bg-(--color-zenthar-void) text-brand-sage rounded-lg hover:bg-brand-primary hover:text-white transition-all border border-brand-sage/10"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDownloadRecord(item)}
                            className="p-2 bg-(--color-zenthar-void) text-brand-sage rounded-lg hover:bg-(--color-zenthar-graphite) hover:text-white transition-all border border-brand-sage/10"
                          >
                            <Download className="w-3.5 h-3.5" />
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
          <div className="bg-(--color-zenthar-void) p-4 rounded-xl border border-brand-sage/20 overflow-x-auto custom-scrollbar max-h-96">
            <pre className="text-[10px] font-mono text-brand-sage whitespace-pre-wrap">
              {JSON.stringify(selectedRecord, null, 2)}
            </pre>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setSelectedRecord(null)}
              className="flex-1 px-5 py-3.5 text-[10px] font-black text-brand-sage hover:bg-(--color-zenthar-graphite) rounded-2xl transition-all border border-brand-sage/10 uppercase tracking-widest"
            >
              Close
            </button>
            <button
              onClick={() => handleDownloadRecord(selectedRecord)}
              className="flex-1 flex items-center justify-center gap-2 px-5 py-3.5 bg-brand-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-widest"
            >
              <Download className="w-3.5 h-3.5" /> Download JSON
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ArchivePage;
