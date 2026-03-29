import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { db, generateOtp, storeOtp, verifyOtp } from "../../core/database";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required.");
}

export type PermissionFlags = {
  view_results: number;
  input_data: number;
  edit_formulas: number;
  change_specs: number;
};

export type UserPayload = {
  id: string;
  employee_number: string;
  name: string;
  role: string;
  dept: string;
  permissions: PermissionFlags;
  initials: string;
};

export const AuthService = {
  // --- Get all active users with permissions ---
  getUsers: async (): Promise<UserPayload[]> => {
    const rows = await db.query(
      `
      SELECT 
        e.employee_number,
        e.name,
        e.role,
        e.department AS dept,
        p.view_results,
        p.input_data,
        p.edit_formulas,
        p.change_specs
      FROM users u
      JOIN employees e ON u.employee_number = e.employee_number
      JOIN user_permissions p ON e.role = p.role
      WHERE u.status = 'ACTIVE'
    `,
    );
    return rows.map((user: any) => ({
      id: user.employee_number,
      employee_number: user.employee_number,
      name: user.name,
      role: user.role,
      dept: user.dept,
      permissions: {
        view_results: user.view_results,
        input_data: user.input_data,
        edit_formulas: user.edit_formulas,
        change_specs: user.change_specs,
      },
      initials: AuthService.getInitials(user.name),
    }));
  },

  // --- Get a single user by employee_number ---
  getMe: async (employeeNumber: string): Promise<UserPayload> => {
    const user = await db.queryOne(
      `
      SELECT 
        e.employee_number,
        e.name,
        e.role,
        e.department AS dept,
        p.view_results,
        p.input_data,
        p.edit_formulas,
        p.change_specs
      FROM employees e
      JOIN user_permissions p ON e.role = p.role
      WHERE e.employee_number = $1
    `,
      [employeeNumber],
    );

    if (!user) throw new Error("User not found");

    return {
      id: user.employee_number,
      employee_number: user.employee_number,
      name: user.name,
      role: user.role,
      dept: user.dept,
      permissions: {
        view_results: user.view_results,
        input_data: user.input_data,
        edit_formulas: user.edit_formulas,
        change_specs: user.change_specs,
      },
      initials: AuthService.getInitials(user.name),
    };
  },

  // --- Generate initials helper ---
  getInitials: (fullName: string) => {
    const parts = fullName.trim().split(" ");
    return parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : "");
  },

  // --- Verify employee identity and generate OTP ---
  verifyEmployee: async (
    employeeNumber: string,
    nationalId: string,
    dob: string,
  ) => {
    const employee = await db.queryOne(
      `SELECT * FROM employees WHERE employee_number = $1 AND national_id = $2 AND dob = $3`,
      [employeeNumber, nationalId, dob],
    );

    if (!employee) {
      await db.execute(
        `INSERT INTO audit_logs (employee_number, action, details) VALUES ($1, 'VERIFICATION_FAILED', 'Invalid credentials provided')`,
        [employeeNumber],
      );
      return null;
    }

    const user = await db.queryOne(
      "SELECT * FROM users WHERE employee_number = $1",
      [employeeNumber],
    );

    if (user && user.status === "ACTIVE") {
      throw new Error("Account already active. Please login.");
    }

    const otp = generateOtp();
    await storeOtp(employeeNumber, otp, 5); // 5 minutes
    console.log(`[OTP for ${employeeNumber}]: ${otp}`);

    await db.execute(
      `INSERT INTO audit_logs (employee_number, action, details) VALUES ($1, 'OTP_SENT', 'OTP generated and sent for verification')`,
      [employeeNumber],
    );

    return { employee_number: employeeNumber };
  },

  // --- Confirm OTP ---
  confirmOtp: async (
    employeeNumber: string,
    code: string,
  ): Promise<boolean> => {
    const valid = await verifyOtp(employeeNumber, code);
    await db.execute(
      `INSERT INTO audit_logs (employee_number, action, details) VALUES ($1, 'OTP_CONFIRMATION', $2)`,
      [
        employeeNumber,
        valid ? "OTP confirmed successfully" : "OTP failed/expired",
      ],
    );
    return valid;
  },

  // --- Set up credentials ---
  setupCredentials: async (
    employeeNumber: string,
    password: string,
    pin?: string,
  ) => {
    const password_hash = await bcrypt.hash(password, 12);
    const pin_hash = pin ? await bcrypt.hash(pin, 12) : null;

    // Insert or update without overwriting last_login
    await db.execute(
      `
      INSERT INTO users (employee_number, password_hash, pin_hash, status)
      VALUES ($1, $2, $3, 'ACTIVE')
      ON CONFLICT(employee_number) DO UPDATE SET 
        password_hash=excluded.password_hash,
        pin_hash=excluded.pin_hash,
        status='ACTIVE'
    `,
      [employeeNumber, password_hash, pin_hash],
    );

    await db.execute(
      `INSERT INTO audit_logs (employee_number, action, details) VALUES ($1, 'ACCOUNT_ACTIVATED', 'User completed credential setup')`,
      [employeeNumber],
    );

    return true;
  },

  // --- Login (password or PIN) ---
  login: async (
    employeeNumber: string,
    password?: string,
    pin?: string,
  ): Promise<{ token: string; user: UserPayload } | null> => {
    const user = await db.queryOne(
      `
      SELECT u.*, e.name, e.role, e.department AS dept,
             p.view_results, p.input_data, p.edit_formulas, p.change_specs
      FROM users u
      JOIN employees e ON u.employee_number = e.employee_number
      JOIN user_permissions p ON e.role = p.role
      WHERE u.employee_number = $1
    `,
      [employeeNumber],
    );

    if (!user || user.status !== "ACTIVE") return null;

    const now = new Date();
    if (user.locked_until && new Date(user.locked_until) > now) {
      const mins = Math.ceil(
        (new Date(user.locked_until).getTime() - now.getTime()) / 60_000
      );
      throw new Error(`Account locked. Try again in ${mins} minute${mins !== 1 ? "s" : ""}.`);
    }

    const isValid = password
      ? await bcrypt.compare(password, user.password_hash)
      : pin && user.pin_hash
        ? await bcrypt.compare(pin, user.pin_hash)
        : false;

    if (!isValid) {
      const attempts = (user.failed_attempts || 0) + 1;
      if (attempts >= 5) {
        const lockUntil = new Date(Date.now() + 30 * 60 * 1000);
        await db.execute(
          "UPDATE users SET failed_attempts=$1, locked_until=$2 WHERE employee_number=$3",
          [attempts, lockUntil, employeeNumber]
        );
        throw new Error("Account locked for 30 minutes after 5 failed attempts.");
      }
      await db.execute(
        "UPDATE users SET failed_attempts=$1 WHERE employee_number=$2",
        [attempts, employeeNumber]
      );
      await db.execute(
        `INSERT INTO audit_logs (employee_number, action, details)
        VALUES ($1, 'LOGIN_FAILED', 'Incorrect password or PIN')`,
        [employeeNumber],
      );
      return null;
    }

    await db.execute(
    "UPDATE users SET failed_attempts=0, locked_until=NULL, last_login=CURRENT_TIMESTAMP WHERE employee_number=$1",
    [employeeNumber]
  );

    const payload: UserPayload = {
      id: user.employee_number,
      employee_number: user.employee_number,
      name: user.name,
      role: user.role,
      dept: user.dept,
      permissions: {
        view_results: user.view_results,
        input_data: user.input_data,
        edit_formulas: user.edit_formulas,
        change_specs: user.change_specs,
      },
      initials: AuthService.getInitials(user.name),
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "8h" });

    await db.execute(
      "UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE employee_number = $1",
      [employeeNumber],
    );

    await db.execute(
      `INSERT INTO audit_logs (employee_number, action, details) VALUES ($1, 'LOGIN_SUCCESS', 'User logged in successfully')`,
      [employeeNumber],
    );

    return { token, user: payload };
  },
};
