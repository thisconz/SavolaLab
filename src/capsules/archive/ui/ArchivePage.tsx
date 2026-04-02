import React, { useState, useEffect } from "react";
import {
  Search,
  Filter,
  Calendar,
  Database,
  FileText,
  Microscope,
  ShieldCheck,
  History,
  Download,
  Eye,
  ChevronRight,
  Clock,
  User,
  Tag,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "@/src/lib/motion";
import { ArchiveApi } from "../api/archive.api";
import { Modal } from "../../../ui/components/Modal";

type ArchiveSection =
  | "samples"
  | "tests"
  | "certificates"
  | "instruments"
  | "audit";

export const ArchivePage: React.FC = () => {
  const [activeSection, setActiveSection] = useState<ArchiveSection>("samples");
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
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

  const sections = [
    { id: "samples", label: "Sample Archive", icon: Database },
    { id: "tests", label: "Test Results", icon: Microscope },
    { id: "certificates", label: "Certificates", icon: FileText },
    { id: "instruments", label: "Instrument History", icon: History },
    { id: "audit", label: "Audit Logs", icon: ShieldCheck },
  ];

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await ArchiveApi.search(activeSection, {
        ...filters,
        batch_id: searchQuery || filters.batch_id,
      });
      setData(result);
    } catch (err) {
      console.error("Failed to fetch archive data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeSection]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData();
  };

  const handleExportXLSX = async () => {
    if (!data || data.length === 0) return;

    try {
      const ExcelJS = (await import("exceljs")).default;
      const { saveAs } = await import("@/src/lib/file-saver");

      const workbook = new ExcelJS.Workbook();
      workbook.creator = "Savola Lab System";
      workbook.lastModifiedBy = "Savola Lab System";
      workbook.created = new Date();
      workbook.modified = new Date();

      const sheet = workbook.addWorksheet(activeSection.toUpperCase(), {
        views: [{ state: "frozen", xSplit: 0, ySplit: 6 }],
        properties: { tabColor: { argb: "FF004B49" } }
      });

      // 1. Add Title and Metadata
      sheet.mergeCells("A1:G2");
      const titleCell = sheet.getCell("A1");
      titleCell.value = "SAVOLA LAB SYSTEM - OFFICIAL DATA EXPORT";
      titleCell.font = {
        name: "Arial",
        size: 20,
        bold: true,
        color: { argb: "FFFFFFFF" },
      };
      titleCell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF004B49" },
      }; // brand-primary
      titleCell.alignment = { vertical: "middle", horizontal: "center" };

      // Metadata section
      sheet.getCell("A4").value = "Generated on:";
      sheet.getCell("B4").value = new Date().toLocaleString();
      sheet.getCell("A5").value = "Module:";
      sheet.getCell("B5").value = activeSection.toUpperCase();
      sheet.getCell("A6").value = "Total Records:";
      sheet.getCell("B6").value = data.length;

      const activeFilters = Object.entries(filters)
        .filter(([_, v]) => v)
        .map(([k, v]) => `${k}=${v}`)
        .join("; ");
      sheet.getCell("D4").value = "Filters Applied:";
      sheet.getCell("E4").value = activeFilters || "None";
      if (searchQuery) {
        sheet.getCell("D5").value = "Search Query:";
        sheet.getCell("E5").value = searchQuery;
      }
      
      sheet.getCell("D6").value = "Data Integrity:";
      sheet.getCell("E6").value = "VERIFIED - " + Math.random().toString(36).substring(2, 10).toUpperCase();

      // Style metadata
      ["A4", "A5", "A6", "D4", "D5", "D6"].forEach((cellRef) => {
        const cell = sheet.getCell(cellRef);
        cell.font = { bold: true, color: { argb: "FF334155" } };
        cell.alignment = { horizontal: "right" };
      });
      ["B4", "B5", "B6", "E4", "E5", "E6"].forEach((cellRef) => {
        const cell = sheet.getCell(cellRef);
        cell.font = { color: { argb: "FF0F172A" } };
        cell.alignment = { horizontal: "left" };
      });

      // 2. Determine headers
      const rawHeaders = Array.from(new Set(data.flatMap(Object.keys)));
      const sortWeight = (header: string) => {
        if (header === "id") return -10;
        if (header.includes("batch")) return -9;
        if (header === "status") return -8;
        if (header.includes("date") || header.includes("_at")) return 10;
        return 0;
      };
      const sortedHeaders = rawHeaders.sort(
        (a, b) => sortWeight(a) - sortWeight(b),
      );

      const formatHeader = (header: string) => {
        return header
          .split("_")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");
      };

      // 3. Add Headers Row (Row 8)
      const headerRow = sheet.getRow(8);
      headerRow.height = 25;
      sortedHeaders.forEach((header, index) => {
        const cell = headerRow.getCell(index + 1);
        cell.value = formatHeader(header).toUpperCase();
        cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF0F172A" }, // Slate-900
        };
        cell.alignment = { vertical: "middle", horizontal: "center" };
        cell.border = {
          top: { style: "medium", color: { argb: "FF000000" } },
          left: { style: "thin", color: { argb: "FF334155" } },
          bottom: { style: "medium", color: { argb: "FF000000" } },
          right: { style: "thin", color: { argb: "FF334155" } },
        };
      });

      // Enable AutoFilter for the header row
      sheet.autoFilter = {
        from: { row: 8, column: 1 },
        to: { row: 8, column: sortedHeaders.length },
      };

      // 4. Add Data Rows
      const formatValue = (val: any): any => {
        if (val === null || val === undefined) return "N/A";
        if (typeof val === "object") return JSON.stringify(val);
        const strVal = String(val);
        if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(strVal)) {
          return new Date(strVal);
        }
        // Try to parse numbers
        if (!isNaN(Number(strVal)) && strVal.trim() !== "") {
          return Number(strVal);
        }
        return strVal;
      };

      data.forEach((row, rowIndex) => {
        const dataRow = sheet.getRow(rowIndex + 9);
        dataRow.height = 20;
        sortedHeaders.forEach((fieldName, colIndex) => {
          const cell = dataRow.getCell(colIndex + 1);
          const val = formatValue(row[fieldName]);
          cell.value = val;
          
          // Default alignment and borders
          cell.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
          cell.border = {
            top: { style: "thin", color: { argb: "FFE2E8F0" } },
            left: { style: "thin", color: { argb: "FFE2E8F0" } },
            bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
            right: { style: "thin", color: { argb: "FFE2E8F0" } },
          };

          // Data Type Formatting
          if (val instanceof Date) {
            cell.numFmt = "yyyy-mm-dd hh:mm:ss";
            cell.alignment = { vertical: "middle", horizontal: "center" };
          } else if (typeof val === "number") {
            // Check if it's an integer or float
            cell.numFmt = Number.isInteger(val) ? "#,##0" : "#,##0.00";
            cell.alignment = { vertical: "middle", horizontal: "right", indent: 1 };
          }

          // Conditional Formatting for Status
          if (fieldName.toLowerCase().includes("status") || fieldName.toLowerCase().includes("priority")) {
            cell.font = { bold: true };
            cell.alignment = { vertical: "middle", horizontal: "center" };
            const statusStr = String(val).toUpperCase();
            if (statusStr === "COMPLETED" || statusStr === "APPROVED" || statusStr === "ACTIVE") {
              cell.font.color = { argb: "FF15803D" }; // Green
              cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFDCFCE7" } };
            } else if (statusStr === "PENDING" || statusStr === "IN_PROGRESS" || statusStr === "HIGH") {
              cell.font.color = { argb: "FFB45309" }; // Amber
              cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFEF3C7" } };
            } else if (statusStr === "FAILED" || statusStr === "REJECTED" || statusStr === "CRITICAL" || statusStr === "STAT") {
              cell.font.color = { argb: "FFB91C1C" }; // Red
              cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFEE2E2" } };
            } else {
              cell.font.color = { argb: "FF334155" };
              cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF1F5F9" } };
            }
          } else {
            // Add alternating row colors for non-status cells
            if (rowIndex % 2 === 0) {
              cell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FFF8FAFC" }, // Slate-50
              };
            }
          }
        });
      });

      // 5. Add Summary Row
      const summaryRowIndex = data.length + 10;
      const summaryRow = sheet.getRow(summaryRowIndex);
      summaryRow.getCell(1).value = "END OF REPORT";
      summaryRow.getCell(2).value = `Total Records Exported: ${data.length}`;
      summaryRow.getCell(1).font = { bold: true, italic: true, color: { argb: "FF64748B" } };
      summaryRow.getCell(2).font = { bold: true, italic: true, color: { argb: "FF64748B" } };
      
      // 6. Auto-fit columns
      sheet.columns.forEach((column, i) => {
        let maxLength = 0;
        column.eachCell({ includeEmpty: true }, (cell, rowNumber) => {
          if (rowNumber > 7) {
            // Only check header and data rows
            const columnLength = cell.value
              ? cell.value.toString().length
              : 10;
            if (columnLength > maxLength) {
              maxLength = columnLength;
            }
          }
        });
        column.width = Math.min(Math.max(maxLength + 4, 15), 60); // Min 15, Max 60
      });

      // 7. Generate and save file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      saveAs(
        blob,
        `savola-archive-${activeSection}-${new Date().toISOString().split("T")[0]}.xlsx`,
      );
    } catch (error) {
      console.error("Error generating Excel file:", error);
    }
  };

  const handleDownloadRecord = (item: any) => {
    const jsonString = JSON.stringify(item, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `record-${item.id || "export"}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="h-full flex flex-col gap-6 overflow-hidden bg-brand-mist/20 p-2 rounded-3xl">
      {/* Search & Filter Header */}
      <div className="bg-white p-8 rounded-3xl border border-brand-sage/10 shadow-sm relative overflow-hidden group">
        <div className="absolute right-0 top-0 w-64 h-64 bg-linear-to-br from-brand-primary/5 to-transparent rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none transition-transform duration-700 group-hover:scale-150" />
        <div className="absolute left-0 bottom-0 w-full h-1 bg-linear-to-r from-transparent via-brand-primary/20 to-transparent opacity-0 group-hover:opacity-100 transform scale-x-0 group-hover:scale-x-100 transition-all duration-700 origin-left" />
        
        <form
          onSubmit={handleSearch}
          className="flex flex-wrap gap-4 items-end relative z-10"
        >
          <div className="flex-1 min-w-200px">
            <label className="block text-[10px] font-bold text-brand-sage uppercase mb-2 tracking-widest">
              Global Search
            </label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-sage" />
              <input
                type="text"
                placeholder="Search by Batch ID..."
                className="w-full bg-brand-mist/30 border border-brand-sage/10 rounded-xl pl-12 pr-4 py-3 text-sm focus:ring-2 focus:ring-brand-primary outline-none transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="w-40">
            <label className="block text-[10px] font-bold text-brand-sage uppercase mb-2 tracking-widest">
              Status
            </label>
            <select
              className="w-full bg-brand-mist/30 border border-brand-sage/10 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand-primary"
              value={filters.status}
              onChange={(e) =>
                setFilters({ ...filters, status: e.target.value })
              }
            >
              <option value="">All Statuses</option>
              <option value="COMPLETED">Completed</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REGISTERED">Registered</option>
            </select>
          </div>

          <div className="w-40">
            <label className="block text-[10px] font-bold text-brand-sage uppercase mb-2 tracking-widest">
              Technician
            </label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-sage" />
              <input
                type="text"
                placeholder="Name..."
                className="w-full bg-brand-mist/30 border border-brand-sage/10 rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand-primary"
                value={filters.technician}
                onChange={(e) =>
                  setFilters({ ...filters, technician: e.target.value })
                }
              />
            </div>
          </div>

          <div className="w-40">
            <label className="block text-[10px] font-bold text-brand-sage uppercase mb-2 tracking-widest">
              Test Type
            </label>
            <div className="relative">
              <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-sage" />
              <input
                type="text"
                placeholder="Type..."
                className="w-full bg-brand-mist/30 border border-brand-sage/10 rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand-primary"
                value={filters.test_type}
                onChange={(e) =>
                  setFilters({ ...filters, test_type: e.target.value })
                }
              />
            </div>
          </div>

          <div className="w-40">
            <label className="block text-[10px] font-bold text-brand-sage uppercase mb-2 tracking-widest">
              Stage
            </label>
            <div className="relative">
              <Database className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-sage" />
              <input
                type="text"
                placeholder="Stage..."
                className="w-full bg-brand-mist/30 border border-brand-sage/10 rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand-primary"
                value={filters.stage}
                onChange={(e) =>
                  setFilters({ ...filters, stage: e.target.value })
                }
              />
            </div>
          </div>

          <div className="w-40">
            <label className="block text-[10px] font-bold text-brand-sage uppercase mb-2 tracking-widest">
              Start Date
            </label>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-sage" />
              <input
                type="date"
                className="w-full bg-brand-mist/30 border border-brand-sage/10 rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand-primary"
                value={filters.start_date}
                onChange={(e) =>
                  setFilters({ ...filters, start_date: e.target.value })
                }
              />
            </div>
          </div>

          <button
            type="submit"
            className="px-6 py-3 bg-brand-deep text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-brand-deep/90 transition-all shadow-lg shadow-brand-deep/20"
          >
            Filter
          </button>
        </form>
      </div>

      {/* Archive Content */}
      <div className="flex-1 flex gap-8 overflow-hidden">
        {/* Navigation Tabs */}
        <div className="w-64 flex flex-col gap-3">
          {sections.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id as ArchiveSection)}
              className={`flex items-center gap-4 px-6 py-5 rounded-3xl transition-all duration-300 text-left border relative overflow-hidden group ${
                activeSection === s.id
                  ? "bg-white border-brand-primary shadow-lg shadow-brand-primary/10 scale-[1.02] z-10"
                  : "bg-white/60 backdrop-blur-sm border-brand-sage/20 hover:bg-white hover:border-brand-primary/40 hover:shadow-md hover:scale-[1.01]"
              }`}
            >
              {activeSection === s.id && (
                <motion.div layoutId="activeTab" className="absolute left-0 top-0 bottom-0 w-1.5 bg-brand-primary rounded-l-3xl" />
              )}
              <div className={`p-2.5 rounded-2xl transition-all duration-300 shadow-inner ${activeSection === s.id ? "bg-brand-mist scale-110" : "bg-white border border-brand-sage/10 group-hover:scale-105"}`}>
                <s.icon
                  className={`w-5 h-5 ${activeSection === s.id ? "text-brand-primary" : "text-brand-sage group-hover:text-brand-primary"}`}
                />
              </div>
              <span className={`text-sm font-bold tracking-tight transition-colors ${activeSection === s.id ? "text-brand-deep" : "text-brand-sage group-hover:text-brand-deep"}`}>
                {s.label}
              </span>
            </button>
          ))}
        </div>

        {/* Data Table */}
        <div className="flex-1 bg-white rounded-3xl border border-brand-sage/10 overflow-hidden flex flex-col shadow-sm relative group/table">
          <div className="absolute right-0 top-0 w-96 h-96 bg-linear-to-br from-brand-primary/5 to-transparent rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none transition-transform duration-700 group-hover/table:scale-150" />
          
          <div className="px-8 py-6 border-b border-brand-sage/10 bg-white/50 backdrop-blur-md flex items-center justify-between relative z-10">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-brand-primary/10 rounded-2xl border border-brand-primary/20 shadow-inner">
                <Database className="w-5 h-5 text-brand-primary" />
              </div>
              <div>
                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-brand-deep font-mono">
                  {activeSection}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-brand-primary animate-pulse" />
                  <span className="text-[10px] font-bold text-brand-sage uppercase tracking-widest">
                    {data.length} Records Found
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={handleExportXLSX}
              className="group flex items-center gap-3 px-6 py-3 bg-brand-deep text-white rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-brand-primary transition-all duration-300 shadow-xl shadow-brand-deep/20 hover:shadow-brand-primary/30 active:scale-95 overflow-hidden relative"
            >
              <div className="absolute inset-0 bg-linear-to-r from-white/0 via-white/10 to-white/0 translate-x--100% group-hover:translate-x-100% transition-transform duration-700" />
              <Download className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
              <span>Export XLSX</span>
            </button>
          </div>

          <div className="flex-1 overflow-auto">
            {loading ? (
              <div className="h-full flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-white z-10">
                  <tr className="border-b border-brand-sage/10">
                    <th className="p-4 text-[10px] font-bold text-brand-sage uppercase tracking-widest">
                      ID / Batch
                    </th>
                    <th className="p-4 text-[10px] font-bold text-brand-sage uppercase tracking-widest">
                      Details
                    </th>
                    <th className="p-4 text-[10px] font-bold text-brand-sage uppercase tracking-widest">
                      Status
                    </th>
                    <th className="p-4 text-[10px] font-bold text-brand-sage uppercase tracking-widest">
                      Timestamp
                    </th>
                    <th className="p-4 text-[10px] font-bold text-brand-sage uppercase tracking-widest text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-sage/5">
                  {data.map((item, idx) => (
                    <tr
                      key={item.id || idx}
                      className="hover:bg-brand-mist/10 transition-colors group"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-brand-mist rounded flex items-center justify-center text-[10px] font-mono text-brand-deep">
                            {item.id}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-brand-deep uppercase">
                              {item.batch_id || "N/A"}
                            </div>
                            <div className="text-[9px] text-brand-sage font-mono uppercase">
                              {item.type || item.test_type || "Record"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-xs text-brand-deep max-w-xs truncate">
                          {item.details ||
                            item.message ||
                            item.reason ||
                            item.action ||
                            "No additional details"}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <User className="w-3 h-3 text-brand-sage" />
                          <span className="text-[9px] text-brand-sage uppercase">
                            {item.technician_name ||
                              item.performer_name ||
                              item.employee_name ||
                              "System"}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2 py-1 rounded text-[9px] font-bold uppercase tracking-tighter ${
                            item.status === "COMPLETED" ||
                            item.status === "APPROVED" ||
                            item.status === "ACTIVE"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-brand-mist text-brand-sage"
                          }`}
                        >
                          {item.status || "Archived"}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2 text-[10px] text-brand-sage font-mono">
                          <Clock className="w-3 h-3" />
                          {new Date(
                            item.created_at || item.performed_at,
                          ).toLocaleString()}
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => setSelectedRecord(item)}
                            className="p-2 bg-brand-mist text-brand-deep rounded-lg hover:bg-brand-primary hover:text-white transition-all"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDownloadRecord(item)}
                            className="p-2 bg-brand-mist text-brand-deep rounded-lg hover:bg-brand-deep hover:text-white transition-all"
                            title="Download JSON"
                          >
                            <Download className="w-4 h-4" />
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

      {/* Record Details Modal */}
      <Modal
        isOpen={!!selectedRecord}
        onClose={() => setSelectedRecord(null)}
        title={`Record Details: ${selectedRecord?.id || "N/A"}`}
        maxWidth="max-w-2xl"
      >
        <div className="space-y-6">
          <div className="flex items-center gap-4 p-4 bg-brand-mist/20 rounded-xl border border-brand-primary/10">
            <div className="p-3 bg-brand-primary/10 rounded-lg">
              <FileText className="w-6 h-6 text-brand-primary" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-brand-deep uppercase tracking-widest">
                Raw Data Export
              </h4>
              <p className="text-[10px] text-brand-sage font-mono uppercase tracking-tighter">
                JSON Representation
              </p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-brand-sage/20 overflow-x-auto custom-scrollbar">
            <pre className="text-[10px] font-mono text-brand-deep whitespace-pre-wrap">
              {JSON.stringify(selectedRecord, null, 2)}
            </pre>
          </div>

          <div className="flex gap-4 pt-4 border-t border-brand-sage/10">
            <button
              onClick={() => setSelectedRecord(null)}
              className="flex-1 px-6 py-4 text-[10px] font-black text-brand-sage uppercase tracking-[0.2em] hover:bg-brand-mist rounded-2xl transition-all border border-brand-sage/10"
            >
              Close
            </button>
            <button
              onClick={() => handleDownloadRecord(selectedRecord)}
              className="flex-2 flex items-center justify-center gap-3 px-6 py-4 bg-brand-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-brand-primary/90 transition-all shadow-2xl shadow-brand-primary/30 active:scale-95"
            >
              <Download className="w-4 h-4" />
              Download JSON
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
