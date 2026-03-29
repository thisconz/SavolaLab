import { db } from "./client";
import bcrypt from "bcrypt";
import { randomInt } from "crypto";

/**
 * Generate a 6-digit OTP
 */
export function generateOtp(): string {
  return randomInt(100000, 999999).toString();
}

/**
 * Store OTP securely, expires in `expiresMinutes` (default 10)
 */
export async function storeOtp(
  employeeNumber: string,
  code: string,
  expiresMinutes = 10,
) {
  const hash = await bcrypt.hash(code, 10);

  // Remove existing OTPs to enforce single-use
  await db.execute("DELETE FROM otp_codes WHERE employee_number = $1", [
    employeeNumber,
  ]);

  await db.execute(
    `
    INSERT INTO otp_codes (employee_number, code, expires_at)
    VALUES ($1, $2, NOW() + interval '1 minute' * $3)
  `,
    [employeeNumber, hash, expiresMinutes],
  );
}

/**
 * Verify OTP; consumes it if valid
 */
export async function verifyOtp(
  employeeNumber: string,
  input: string,
): Promise<boolean> {
  const row = await db.queryOne<{ code?: string }>(
    `
    SELECT code FROM otp_codes
    WHERE employee_number = $1 AND expires_at > NOW()
    ORDER BY id DESC LIMIT 1
  `,
    [employeeNumber],
  );

  if (!row?.code) return false;

  const isValid = await bcrypt.compare(input, row.code);

  if (isValid) await removeOtp(employeeNumber);

  return isValid;
}

/**
 * Remove OTP explicitly
 */
export async function removeOtp(employeeNumber: string) {
  await db.execute("DELETE FROM otp_codes WHERE employee_number = $1", [
    employeeNumber,
  ]);
}

/**
 * Initialize security triggers
 */
export async function initSecurityTriggers() {
  // PostgreSQL triggers require functions
  await db.execute(`
    -- Function to prevent extra sample types
    CREATE OR REPLACE FUNCTION check_sample_type_limit()
    RETURNS TRIGGER AS $$
    BEGIN
      IF (SELECT COUNT(*) FROM sample_types) >= 20 THEN
        RAISE EXCEPTION 'Maximum sample types reached.';
      END IF;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    DROP TRIGGER IF EXISTS prevent_extra_sample_types ON sample_types;
    CREATE TRIGGER prevent_extra_sample_types
    BEFORE INSERT ON sample_types
    FOR EACH ROW EXECUTE FUNCTION check_sample_type_limit();

    -- Function to protect samples
    CREATE OR REPLACE FUNCTION protect_completed_sample()
    RETURNS TRIGGER AS $$
    BEGIN
      IF OLD.status IN ('COMPLETED', 'APPROVED') THEN
        RAISE EXCEPTION 'Cannot update or delete a completed or approved sample.';
      END IF;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    DROP TRIGGER IF EXISTS prevent_sample_update ON samples;
    CREATE TRIGGER prevent_sample_update
    BEFORE UPDATE OR DELETE ON samples
    FOR EACH ROW EXECUTE FUNCTION protect_completed_sample();

    -- Function to protect tests
    CREATE OR REPLACE FUNCTION protect_completed_test()
    RETURNS TRIGGER AS $$
    BEGIN
      IF OLD.status IN ('COMPLETED', 'APPROVED') THEN
        RAISE EXCEPTION 'Cannot update a completed or approved test.';
      END IF;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    DROP TRIGGER IF EXISTS prevent_test_update ON tests;
    CREATE TRIGGER prevent_test_update
    BEFORE UPDATE ON tests
    FOR EACH ROW EXECUTE FUNCTION protect_completed_test();

    -- Function to prevent test deletion
    CREATE OR REPLACE FUNCTION prevent_test_deletion()
    RETURNS TRIGGER AS $$
    BEGIN
      INSERT INTO audit_logs (employee_number, action, details)
      VALUES ('SYSTEM', 'TEST_DELETE_ATTEMPT', 'Attempted to delete test ' || OLD.id);
      RAISE EXCEPTION 'Test results cannot be deleted.';
    END;
    $$ LANGUAGE plpgsql;

    DROP TRIGGER IF EXISTS prevent_test_delete ON tests;
    CREATE TRIGGER prevent_test_delete
    BEFORE DELETE ON tests
    FOR EACH ROW EXECUTE FUNCTION prevent_test_deletion();

    -- Function to protect audit logs
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
