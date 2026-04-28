import { Hono } from "hono";
import type { Variables } from "../../core/types";
import { authenticateToken, handleRouteError, requireRoles } from "../../core/middleware";
import { db } from "../../core/database";
import { logger } from "../../core/logger";

const app = new Hono<{ Variables: Variables }>();

// ─────────────────────────────────────────────
// List
// ─────────────────────────────────────────────

app.get("/", authenticateToken, async (c) => {
  try {
    const rows = await db.query(`
      SELECT c.*, e.name AS approved_by_name
      FROM certificates c
      LEFT JOIN employees e ON c.approved_by = e.employee_number
      ORDER BY c.created_at DESC
      LIMIT 100
    `);
    return c.json({ success: true, data: rows });
  } catch (err: any) {
    logger.error({ err }, "Failed to list certificates");
    return handleRouteError(err, c, "CertificatesRoutes.list");
  }
});

// ─────────────────────────────────────────────
// Single — with associated test results
// ─────────────────────────────────────────────

app.get("/:id", authenticateToken, async (c) => {
  const id = Number(c.req.param("id"));
  if (!id) return c.json({ success: false, error: "Invalid ID" }, 400);

  try {
    const cert = await db.queryOne(
      `
      SELECT c.*, e.name AS approved_by_name
      FROM certificates c
      LEFT JOIN employees e ON c.approved_by = e.employee_number
      WHERE c.id = $1
    `,
      [id],
    );

    if (!cert) return c.json({ success: false, error: "Certificate not found" }, 404);

    // Find samples matching this batch
    const samples = await db.query(
      `
      SELECT s.*, COUNT(t.id)::int AS test_count
      FROM samples s
      LEFT JOIN tests t ON t.sample_id = s.id
      WHERE s.batch_id = $1
      GROUP BY s.id
    `,
      [(cert as any).batch_id],
    );

    // Get all tests for those samples
    const tests =
      samples.length > 0
        ? await db.query(
            `
          SELECT t.*, e.name AS performer_name, r.name AS reviewer_name
          FROM tests t
          JOIN samples s ON t.sample_id = s.id
          LEFT JOIN employees e ON t.performer_id = e.employee_number
          LEFT JOIN employees r ON t.reviewer_id  = r.employee_number
          WHERE s.batch_id = $1
          ORDER BY s.id, t.sequence_order
        `,
            [(cert as any).batch_id],
          )
        : [];

    return c.json({ success: true, data: { ...cert, samples, tests } });
  } catch (err: any) {
    logger.error({ err, id }, "Failed to fetch certificate");
    return handleRouteError(err, c, "CertificatesRoutes.get:id");
  }
});

// ─────────────────────────────────────────────
// PDF generation
// ─────────────────────────────────────────────

app.get("/:id/pdf", authenticateToken, async (c) => {
  const id = Number(c.req.param("id"));
  if (!id) return c.json({ success: false, error: "Invalid ID" }, 400);

  try {
    // ── 1. Fetch full certificate data ──────────────────────────────────
    const cert = await db.queryOne<any>(
      `
      SELECT c.*, e.name AS approved_by_name, e.role AS approved_by_role
      FROM certificates c
      LEFT JOIN employees e ON c.approved_by = e.employee_number
      WHERE c.id = $1
    `,
      [id],
    );

    if (!cert) return c.json({ success: false, error: "Certificate not found" }, 404);

    const tests = await db.query<any>(
      `
      SELECT
        t.test_type,
        t.raw_value,
        t.calculated_value,
        t.unit,
        t.status,
        t.performed_at,
        t.review_comment,
        ep.name AS performer_name,
        er.name AS reviewer_name,
        s.source_stage,
        s.sample_type
      FROM tests t
      JOIN  samples    s  ON t.sample_id   = s.id
      LEFT JOIN employees ep ON t.performer_id = ep.employee_number
      LEFT JOIN employees er ON t.reviewer_id  = er.employee_number
      WHERE s.batch_id = $1 AND t.status IN ('APPROVED', 'COMPLETED')
      ORDER BY s.id, t.id
    `,
      [cert.batch_id],
    );

    // ── 2. Build PDF content ────────────────────────────────────────────
    // Using a simple HTML-like string that gets converted.
    // In production replace with pdfmake or puppeteer.
    const htmlContent = buildCertificateHTML(cert, tests);

    // ── 3. Stream HTML as download ─────────────────────────────────────
    // NOTE: For a real PDF, install puppeteer or pdfmake and convert htmlContent.
    // For now we serve HTML that the browser can print-to-PDF (Ctrl+P).
    const filename = `Certificate-${cert.batch_id ?? id}-v${cert.version}.html`;

    c.header("Content-Type", "text/html; charset=utf-8");
    c.header("Content-Disposition", `attachment; filename="${filename}"`);
    c.header("Cache-Control", "no-store");

    return c.body(htmlContent);
  } catch (err: any) {
    logger.error({ err, id }, "Failed to generate certificate PDF");
    return handleRouteError(err, c, "CertificatesRoutes.get:id/pdf");
  }
});

// ─────────────────────────────────────────────
// Approve
// ─────────────────────────────────────────────

app.put(
  "/:id/approve",
  authenticateToken,
  requireRoles("ADMIN", "HEAD_MANAGER", "SHIFT_CHEMIST"),
  async (c) => {
    const id = Number(c.req.param("id"));
    const user = c.get("user");

    if (!id) return c.json({ success: false, error: "Invalid ID" }, 400);

    try {
      const cert = await db.queryOne("SELECT * FROM certificates WHERE id = $1", [id]);
      if (!cert) return c.json({ success: false, error: "Certificate not found" }, 404);

      if ((cert as any).status === "RELEASED") {
        return c.json({ success: false, error: "Certificate already released" }, 400);
      }

      await db.execute(
        `UPDATE certificates
         SET status = 'APPROVED', approved_by = $1
         WHERE id = $2`,
        [user.employee_number, id],
      );

      await db.execute(
        `INSERT INTO audit_logs (employee_number, action, details)
         VALUES ($1, 'CERTIFICATE_APPROVED', $2)`,
        [user.employee_number, `Certificate #${id} approved`],
      );

      return c.json({ success: true });
    } catch (err: any) {
      logger.error({ err, id }, "Failed to approve certificate");
      return handleRouteError(err, c, "CertificatesRoutes.put:id/approve");
    }
  },
);

export default app;

// ─────────────────────────────────────────────
// HTML certificate template
// ─────────────────────────────────────────────

function buildCertificateHTML(cert: any, tests: any[]): string {
  const now = new Date().toLocaleString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const testRows = tests
    .map(
      (t) => `
    <tr>
      <td>${t.test_type ?? "—"}</td>
      <td>${t.source_stage ?? t.sample_type ?? "—"}</td>
      <td style="font-family:monospace">${t.raw_value ?? "—"} ${t.unit ?? ""}</td>
      <td style="font-family:monospace">${t.calculated_value ?? "—"} ${t.unit ?? ""}</td>
      <td style="color:${t.status === "APPROVED" ? "#10b981" : "#94a3b8"};font-weight:600">${t.status}</td>
      <td>${t.performer_name ?? "—"}</td>
      <td>${t.reviewer_name ?? "—"}</td>
    </tr>
  `,
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>Certificate of Analysis — ${cert.batch_id}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: "Helvetica Neue", sans-serif; font-size: 11px; color: #1a1a2e; background: #fff; padding: 40px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; padding-bottom: 24px; border-bottom: 2px solid #0f172a; }
  .company { font-size: 20px; font-weight: 900; letter-spacing: -0.5px; color: #0f172a; }
  .sub { font-size: 9px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; color: #64748b; margin-top: 2px; }
  .cert-title { font-size: 14px; font-weight: 700; color: #0f172a; text-align: right; }
  .cert-num   { font-size: 10px; color: #64748b; text-align: right; margin-top: 4px; font-family: monospace; }
  .meta { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 28px; padding: 20px; background: #f8fafc; border-radius: 8px; }
  .meta-item label { font-size: 8px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #64748b; display: block; margin-bottom: 4px; }
  .meta-item span  { font-size: 12px; font-weight: 600; color: #0f172a; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 28px; font-size: 10px; }
  thead tr { background: #0f172a; color: #fff; }
  th { padding: 8px 12px; text-align: left; font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; }
  td { padding: 8px 12px; border-bottom: 1px solid #e2e8f0; }
  tbody tr:nth-child(even) { background: #f8fafc; }
  .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: flex-start; }
  .sig { text-align: center; min-width: 160px; }
  .sig-line { border-top: 1px solid #0f172a; padding-top: 8px; margin-top: 40px; font-size: 10px; font-weight: 600; }
  .sig-sub   { font-size: 8px; color: #64748b; text-transform: uppercase; letter-spacing: 0.1em; margin-top: 2px; }
  .badge { display: inline-block; padding: 3px 10px; border-radius: 4px; font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; }
  .badge-approved { background: #dcfce7; color: #16a34a; }
  .badge-draft    { background: #fef3c7; color: #b45309; }
  @media print { body { padding: 20px; } .no-print { display: none; } }
</style>
</head>
<body>

<div class="header">
  <div>
    <div class="company">Zenthar LIMS</div>
    <div class="sub">Quality Control Laboratory System</div>
  </div>
  <div>
    <div class="cert-title">Certificate of Analysis</div>
    <div class="cert-num">COA-${String(cert.id).padStart(6, "0")} · Rev ${cert.version ?? 1}</div>
    <div class="cert-num" style="margin-top:6px">
      <span class="badge ${cert.status === "APPROVED" || cert.status === "RELEASED" ? "badge-approved" : "badge-draft"}">${cert.status}</span>
    </div>
  </div>
</div>

<div class="meta">
  <div class="meta-item"><label>Batch ID</label><span>${cert.batch_id ?? "—"}</span></div>
  <div class="meta-item"><label>Issued</label><span>${new Date(cert.created_at).toLocaleDateString("en-GB")}</span></div>
  <div class="meta-item"><label>Approved By</label><span>${cert.approved_by_name ?? "Pending"}</span></div>
  <div class="meta-item"><label>Generated</label><span>${now}</span></div>
</div>

<table>
  <thead>
    <tr>
      <th>Test</th>
      <th>Stage</th>
      <th>Raw Value</th>
      <th>Calculated</th>
      <th>Status</th>
      <th>Analyst</th>
      <th>Reviewer</th>
    </tr>
  </thead>
  <tbody>
    ${testRows || "<tr><td colspan='7' style='text-align:center;color:#94a3b8'>No approved test results found for this batch</td></tr>"}
  </tbody>
</table>

<div class="footer">
  <div>
    <p style="font-size:9px;color:#64748b;max-width:300px;line-height:1.6">
      This certificate was generated by the Zenthar Laboratory Information Management System.
      Results are immutable once approved and cannot be modified retroactively.
      All test data is preserved in the audit log.
    </p>
  </div>
  <div class="sig">
    <div class="sig-line">${cert.approved_by_name ?? "________________________"}</div>
    <div class="sig-sub">Authorized Signatory · ${cert.approved_by_role ?? "Quality Control"}</div>
  </div>
</div>

<p class="no-print" style="margin-top:24px;text-align:center;font-size:9px;color:#94a3b8">
  Use <strong>Ctrl+P</strong> or <strong>File → Print → Save as PDF</strong> to generate a PDF.
</p>

</body>
</html>`;
}
