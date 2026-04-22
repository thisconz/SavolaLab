import { db } from "./client";
import { randomInt } from "crypto";
import { createHash } from "crypto";

/**
 * Simple hash using SHA-256 - enough for short-lived OTPs.
 * In production replace with bcrypt for passwords.
 */
function hashCode(code: string): string {
  return createHash("sha256").update(`otp:${code}:zenthar`).digest("hex");
}

/**
 * Generate a cryptographically random 6-digit OTP
 */
export function generateOtp(): string {
  return randomInt(100000, 999999).toString();
}

/**
 * Store OTP (hashed), expiring in `expiresMinutes` (default: 10)
 */
export async function storeOtp(
  employeeNumber: string,
  code: string,
  expiresMinutes = 10,
): Promise<void> {
  const hashed = hashCode(code);

  // Remove any existing OTPs for this employee (single-use enforcement)
  await db.execute("DELETE FROM otp_codes WHERE employee_number = $1", [
    employeeNumber,
  ]);

  await db.execute(
    `INSERT INTO otp_codes (employee_number, code, expires_at)
     VALUES ($1, $2, NOW() + interval '1 minute' * $3)`,
    [employeeNumber, hashed, expiresMinutes],
  );
}

/**
 * Verify OTP — consumes it on success (prevents replay attacks)
 */
export async function verifyOtp(
  employeeNumber: string,
  input: string,
): Promise<boolean> {
  const row = await db.queryOne<{ id: number; code: string }>(
    `SELECT id, code FROM otp_codes
     WHERE employee_number = $1
       AND expires_at > NOW()
     ORDER BY id DESC LIMIT 1`,
    [employeeNumber],
  );

  if (!row) return false;

  const isValid = hashCode(input) === row.code;

  if (isValid) {
    await db.execute("DELETE FROM otp_codes WHERE id = $1", [row.id]);
  }

  return isValid;
}

/**
 * Explicitly remove all OTPs for an employee
 */
export async function removeOtp(employeeNumber: string): Promise<void> {
  await db.execute("DELETE FROM otp_codes WHERE employee_number = $1", [
    employeeNumber,
  ]);
}

/**
 * Initialize security triggers (called once at startup)
 */
export async function initSecurityTriggers(): Promise<void> {
  await db.execute(`
    -- Prevent exceeding max sample types
    CREATE OR REPLACE FUNCTION check_sample_type_limit()
    RETURNS TRIGGER AS $$
    BEGIN
      IF (SELECT COUNT(*) FROM sample_types) >= 50 THEN
        RAISE EXCEPTION 'Maximum sample types (50) reached.';
      END IF;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    DROP TRIGGER IF EXISTS prevent_extra_sample_types ON sample_types;
    CREATE TRIGGER prevent_extra_sample_types
    BEFORE INSERT ON sample_types
    FOR EACH ROW EXECUTE FUNCTION check_sample_type_limit();

    -- Protect completed / approved samples from modification
    CREATE OR REPLACE FUNCTION protect_completed_sample()
    RETURNS TRIGGER AS $$
    BEGIN
      IF OLD.status IN ('COMPLETED', 'APPROVED') THEN
        RAISE EXCEPTION 'Cannot update or delete a completed/approved sample (id=%).',OLD.id;
      END IF;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    DROP TRIGGER IF EXISTS prevent_sample_update ON samples;
    CREATE TRIGGER prevent_sample_update
    BEFORE UPDATE OR DELETE ON samples
    FOR EACH ROW EXECUTE FUNCTION protect_completed_sample();

    -- Protect completed / approved tests
    CREATE OR REPLACE FUNCTION protect_completed_test()
    RETURNS TRIGGER AS $$
    BEGIN
      IF OLD.status IN ('COMPLETED', 'APPROVED') THEN
        RAISE EXCEPTION 'Cannot update a completed/approved test (id=%).',OLD.id;
      END IF;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    DROP TRIGGER IF EXISTS prevent_test_update ON tests;
    CREATE TRIGGER prevent_test_update
    BEFORE UPDATE ON tests
    FOR EACH ROW EXECUTE FUNCTION protect_completed_test();

    -- Block test deletion (append-only audit trail)
    CREATE OR REPLACE FUNCTION prevent_test_deletion()
    RETURNS TRIGGER AS $$
    BEGIN
      INSERT INTO audit_logs (employee_number, action, details)
      VALUES ('SYSTEM', 'TEST_DELETE_ATTEMPT',
              format('Attempted to delete test %s', OLD.id));
      RAISE EXCEPTION 'Test results are immutable and cannot be deleted.';
    END;
    $$ LANGUAGE plpgsql;

    DROP TRIGGER IF EXISTS prevent_test_delete ON tests;
    CREATE TRIGGER prevent_test_delete
    BEFORE DELETE ON tests
    FOR EACH ROW EXECUTE FUNCTION prevent_test_deletion();

    -- Immutable audit logs
    CREATE OR REPLACE FUNCTION protect_audit_logs()
    RETURNS TRIGGER AS $$
    BEGIN
      RAISE EXCEPTION 'Audit logs are immutable.';
    END;
    $$ LANGUAGE plpgsql;

    DROP TRIGGER IF EXISTS prevent_audit_change ON audit_logs;
    CREATE TRIGGER prevent_audit_change
    BEFORE UPDATE OR DELETE ON audit_logs
    FOR EACH ROW EXECUTE FUNCTION protect_audit_logs();
  `);
}
