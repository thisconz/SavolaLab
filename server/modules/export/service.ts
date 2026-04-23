import ExcelJS from "exceljs";
import { ExportType, ExportOptions } from "../../core/types";
import { db } from "../../core/database";
import { logger } from "../../core/logger";

// ─────────────────────────────────────────────
// Query builders per export type
// ─────────────────────────────────────────────

async function fetchRows(opts: ExportOptions): Promise<any[]> {
  const limit = Math.min(opts.limit ?? 5000, 10_000);

  switch (opts.type) {
    case "samples":
      return db.query(
        `SELECT s.id, s.batch_id, s.sample_type, s.source_stage,
                s.priority, s.status, s.created_at,
                e.name AS technician_name
         FROM samples s
         LEFT JOIN employees e ON s.technician_id = e.employee_number
         ORDER BY s.created_at DESC
         LIMIT $1`,
        [limit],
      );

    case "tests":
      return db.query(
        `SELECT t.id, s.batch_id, t.test_type,
                t.raw_value, t.calculated_value, t.unit,
                t.status, t.performed_at,
                ep.name AS performer_name,
                er.name AS reviewer_name,
                t.review_comment, t.notes
         FROM tests t
         JOIN  samples    s  ON t.sample_id   = s.id
         LEFT JOIN employees ep ON t.performer_id = ep.employee_number
         LEFT JOIN employees er ON t.reviewer_id  = er.employee_number
         ORDER BY t.performed_at DESC
         LIMIT $1`,
        [limit],
      );

    case "audit":
      return db.query(
        `SELECT a.id, a.employee_number,
                e.name AS employee_name,
                a.action, a.details, a.ip_address, a.created_at
         FROM audit_logs a
         LEFT JOIN employees e ON a.employee_number = e.employee_number
         ORDER BY a.created_at DESC
         LIMIT $1`,
        [limit],
      );

    case "certificates":
      return db.query(
        `SELECT c.id, c.batch_id, c.status, c.version, c.created_at,
                e.name AS approved_by_name
         FROM certificates c
         LEFT JOIN employees e ON c.approved_by = e.employee_number
         ORDER BY c.created_at DESC
         LIMIT $1`,
        [limit],
      );

    case "instruments":
      return db.query(
        `SELECT id, name, model, serial_number, status,
                last_calibration, next_calibration
         FROM instruments
         ORDER BY name ASC
         LIMIT $1`,
        [limit],
      );

    case "inventory":
      return db.query(
        `SELECT id, name, type, quantity, unit, min_stock, expiry_date
         FROM inventory
         ORDER BY name ASC
         LIMIT $1`,
        [limit],
      );

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
    ["System", "Zenthar LIMS v2"],
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
