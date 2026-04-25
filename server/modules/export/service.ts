import ExcelJS from "exceljs";
import { ExportType, ExportOptions } from "../../core/types";
import { dbOrm } from "../../core/db/orm";
import { 
  samples, tests, auditLogs, certificates, 
  instruments, inventory, employees 
} from "../../core/db/schema";
import { logger } from "../../core/logger";
import { eq, desc, asc } from "drizzle-orm";

async function fetchRows(opts: ExportOptions): Promise<any[]> {
  const limit = Math.min(opts.limit ?? 5000, 10_000);

  switch (opts.type) {
    case "samples":
      return await dbOrm
        .select({
          id: samples.id,
          batch_id: samples.batch_id,
          sample_type: samples.sample_type,
          source_stage: samples.source_stage,
          priority: samples.priority,
          status: samples.status,
          created_at: samples.created_at,
          technician_name: employees.name,
        })
        .from(samples)
        .leftJoin(employees, eq(samples.technician_id, employees.employee_number))
        .orderBy(desc(samples.created_at))
        .limit(limit);

    case "tests":
      return await dbOrm
        .select({
          id: tests.id,
          batch_id: samples.batch_id,
          test_type: tests.test_type,
          raw_value: tests.raw_value,
          calculated_value: tests.calculated_value,
          unit: tests.unit,
          status: tests.status,
          performed_at: tests.performed_at,
          performer_name: employees.name, // Will alias correctly when processed
          review_comment: tests.review_comment,
          notes: tests.notes
        })
        .from(tests)
        .innerJoin(samples, eq(tests.sample_id, samples.id))
        .leftJoin(employees, eq(tests.performer_id, employees.employee_number))
        .orderBy(desc(tests.performed_at))
        .limit(limit);

    case "audit":
      return await dbOrm
        .select({
          id: auditLogs.id,
          employee_number: auditLogs.employee_number,
          employee_name: employees.name,
          action: auditLogs.action,
          details: auditLogs.details,
          ip_address: auditLogs.ip_address,
          created_at: auditLogs.created_at,
        })
        .from(auditLogs)
        .leftJoin(employees, eq(auditLogs.employee_number, employees.employee_number))
        .orderBy(desc(auditLogs.created_at))
        .limit(limit);

    case "certificates":
      return await dbOrm
        .select({
          id: certificates.id,
          batch_id: certificates.batch_id,
          status: certificates.status,
          version: certificates.version,
          created_at: certificates.created_at,
          approved_by_name: employees.name,
        })
        .from(certificates)
        .leftJoin(employees, eq(certificates.approved_by, employees.employee_number))
        .orderBy(desc(certificates.created_at))
        .limit(limit);

    case "instruments":
      return await dbOrm
        .select({
          id: instruments.id,
          name: instruments.name,
          model: instruments.model,
          serial_number: instruments.serial_number,
          status: instruments.status,
          last_calibration: instruments.last_calibration,
          next_calibration: instruments.next_calibration,
        })
        .from(instruments)
        .orderBy(asc(instruments.name))
        .limit(limit);

    case "inventory":
      return await dbOrm
        .select({
          id: inventory.id,
          name: inventory.name,
          type: inventory.type,
          quantity: inventory.quantity,
          unit: inventory.unit,
          min_stock: inventory.min_stock,
          expiry_date: inventory.expiry_date,
        })
        .from(inventory)
        .orderBy(asc(inventory.name))
        .limit(limit);

    default:
      throw new Error(`Unknown export type: ${opts.type}`);
  }
}

// ─────────────────────────────────────────────
// Excel builder
// ─────────────────────────────────────────────

export async function buildExcelExport(opts: ExportOptions): Promise<Buffer> {
  const rows = await fetchRows(opts);
  if (rows.length === 0) {
    throw new Error("No data found for the requested export.");
  }

  const wb = new ExcelJS.Workbook();
  wb.creator = "Zenthar LIMS";
  wb.created = new Date();
  wb.modified = new Date();

  const ws = wb.addWorksheet(opts.type.toUpperCase(), {
    properties: { tabColor: { argb: "FF004B49" } },
    pageSetup: { orientation: "landscape", fitToPage: true, fitToWidth: 1 },
    views: [{ state: "frozen", xSplit: 0, ySplit: 7 }],
  });

  // ── Banner row ────────────────────────────────────────────────────────────
  const headers = Object.keys(rows[0]);
  ws.mergeCells(`A1:${colLetter(headers.length)}2`);
  const title = ws.getCell("A1");
  title.value = `ZENTHAR QC LIMS — ${opts.type.toUpperCase()} REPORT`;
  title.font = {
    name: "Arial",
    size: 16,
    bold: true,
    color: { argb: "FFFFFFFF" },
  };
  title.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF004B49" },
  };
  title.alignment = { vertical: "middle", horizontal: "center" };

  // ── Metadata ──────────────────────────────────────────────────────────────
  const meta: [string, string][] = [
    ["Generated on", new Date().toLocaleString()],
    ["Export type", opts.type.toUpperCase()],
    ["Total records", String(rows.length)],
    ["System", "Zenthar LIMS v1.0.0"],
  ];

  meta.forEach(([label, value], i) => {
    const row = i + 3;
    ws.getCell(`A${row}`).value = label;
    ws.getCell(`B${row}`).value = value;
    ws.getCell(`A${row}`).font = { bold: true, color: { argb: "FF334155" } };
    ws.getCell(`B${row}`).font = { color: { argb: "FF0F172A" } };
  });

  // ── Column headers (row 8) ────────────────────────────────────────────────
  const headerRow = ws.getRow(8);
  headerRow.height = 24;

  headers.forEach((h, i) => {
    const cell = headerRow.getCell(i + 1);
    cell.value = formatHeader(h);
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 10 };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF0F172A" },
    };
    cell.alignment = { vertical: "middle", horizontal: "center" };
    cell.border = BORDER_MEDIUM;
  });

  ws.autoFilter = {
    from: { row: 8, column: 1 },
    to: { row: 8, column: headers.length },
  };

  // ── Data rows ─────────────────────────────────────────────────────────────
  rows.forEach((row, ri) => {
    const dataRow = ws.getRow(ri + 9);
    dataRow.height = 18;

    headers.forEach((field, ci) => {
      const cell = dataRow.getCell(ci + 1);
      const raw = row[field];

      // Coerce value
      if (raw === null || raw === undefined) {
        cell.value = "";
      } else if (raw instanceof Date) {
        cell.value = raw;
        cell.numFmt = "yyyy-mm-dd hh:mm:ss";
      } else if (typeof raw === "string" && /^\d{4}-\d{2}-\d{2}T/.test(raw)) {
        cell.value = new Date(raw);
        cell.numFmt = "yyyy-mm-dd hh:mm:ss";
      } else if (typeof raw === "number") {
        cell.value = raw;
        cell.numFmt = Number.isInteger(raw) ? "#,##0" : "#,##0.00";
        cell.alignment = { horizontal: "right" };
      } else {
        cell.value = String(raw);
      }

      cell.border = BORDER_THIN;
      cell.fill =
        ri % 2 === 0
          ? { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8FAFC" } }
          : (undefined as any);

      // Status colouring
      if (field.toLowerCase().includes("status") || field.toLowerCase().includes("priority")) {
        const s = String(raw ?? "").toUpperCase();
        cell.font = { bold: true };
        cell.alignment = { horizontal: "center" };
        if (["COMPLETED", "APPROVED", "ACTIVE"].includes(s)) {
          cell.font.color = { argb: "FF15803D" };
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFDCFCE7" },
          };
        } else if (["PENDING", "IN_PROGRESS", "HIGH", "WARNING"].includes(s)) {
          cell.font.color = { argb: "FFB45309" };
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFFEF3C7" },
          };
        } else if (["FAILED", "CRITICAL", "STAT", "DISAPPROVED"].includes(s)) {
          cell.font.color = { argb: "FFB91C1C" };
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFFEE2E2" },
          };
        }
      }
    });
  });

  // ── Auto-fit columns ──────────────────────────────────────────────────────
  ws.columns.forEach((col, i) => {
    let maxLen = formatHeader(headers[i]).length;
    col.eachCell?.({ includeEmpty: false }, (cell, rowNum) => {
      if (rowNum >= 8) {
        const len = cell.value ? String(cell.value).length : 0;
        if (len > maxLen) maxLen = len;
      }
    });
    col.width = Math.min(Math.max(maxLen + 4, 12), 50);
  });

  // ── Summary row ───────────────────────────────────────────────────────────
  const summaryRow = ws.getRow(rows.length + 10);
  summaryRow.getCell(1).value = "END OF REPORT";
  summaryRow.getCell(2).value = `${rows.length} records exported`;
  summaryRow.getCell(1).font = {
    bold: true,
    italic: true,
    color: { argb: "FF64748B" },
  };
  summaryRow.getCell(2).font = {
    bold: true,
    italic: true,
    color: { argb: "FF64748B" },
  };

  const buf = await wb.xlsx.writeBuffer();
  logger.info({ type: opts.type, rows: rows.length }, "Excel export generated");
  return Buffer.from(buf);
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function colLetter(n: number): string {
  let s = "";
  while (n > 0) {
    n--;
    s = String.fromCharCode(65 + (n % 26)) + s;
    n = Math.floor(n / 26);
  }
  return s;
}

function formatHeader(h: string): string {
  return h
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

const BORDER_MEDIUM: ExcelJS.Borders = {
  top: { style: "medium", color: { argb: "FF000000" } },
  bottom: { style: "medium", color: { argb: "FF000000" } },
  left: { style: "thin", color: { argb: "FF334155" } },
  right: { style: "thin", color: { argb: "FF334155" } },
  diagonal: { style: "thin", color: { argb: "FF334155" } },
};

const BORDER_THIN: ExcelJS.Borders = {
  top: { style: "thin", color: { argb: "FFE2E8F0" } },
  bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
  left: { style: "thin", color: { argb: "FFE2E8F0" } },
  right: { style: "thin", color: { argb: "FFE2E8F0" } },
  diagonal: { style: "thin", color: { argb: "FFE2E8F0" } },
};
