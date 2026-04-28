import { db } from "../../core/database";

export const CertificateService = {
  list: () =>
    db.query(`
      SELECT c.*, e.name AS approved_by_name
      FROM certificates c
      LEFT JOIN employees e ON c.approved_by = e.employee_number
      ORDER BY c.created_at DESC LIMIT 100
    `),

  getWithTests: async (id: number) => {
    const cert = await db.queryOne<any>(
      `SELECT c.*, e.name AS approved_by_name, e.role AS approved_by_role
       FROM certificates c
       LEFT JOIN employees e ON c.approved_by = e.employee_number
       WHERE c.id = $1`,
      [id],
    );
    if (!cert) return null;

    const tests = await db.query<any>(
      `SELECT t.test_type, t.raw_value, t.calculated_value, t.unit, t.status,
              t.performed_at, ep.name AS performer_name, er.name AS reviewer_name
       FROM tests t
       JOIN samples s ON t.sample_id = s.id
       LEFT JOIN employees ep ON t.performer_id = ep.employee_number
       LEFT JOIN employees er ON t.reviewer_id = er.employee_number
       WHERE s.batch_id = $1 AND t.status IN ('APPROVED', 'COMPLETED')
       ORDER BY s.id, t.id`,
      [cert.batch_id],
    );
    return { ...cert, tests };
  },

  approve: async (id: number, employeeNumber: string) => {
    const cert = await db.queryOne<any>("SELECT status FROM certificates WHERE id = $1", [id]);
    if (!cert) throw new Error("Certificate not found");
    if (cert.status === "RELEASED") throw new Error("Certificate already released");

    await db.execute(
      "UPDATE certificates SET status = 'APPROVED', approved_by = $1 WHERE id = $2",
      [employeeNumber, id],
    );
    await db.execute(
      "INSERT INTO audit_logs (employee_number, action, details) VALUES ($1, 'CERTIFICATE_APPROVED', $2)",
      [employeeNumber, `Certificate #${id} approved`],
    );
  },
};