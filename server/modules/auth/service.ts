/**
 * server/modules/auth/service.ts
 *
 * Handles password hashing, JWT generation/verification,
 * OTP lifecycle, and user authentication flow.
 *
 * FIXES:
 *  - Correct import paths for generateOtp/storeOtp/verifyOtp
 *  - JWT signing uses createHmac (not createHash) — timing-safe verification
 *  - signToken: payload values always override defaults (not the other way around)
 */
import { createHmac, timingSafeEqual, randomBytes } from "crypto";
import { dbOrm } from "../../core/db/orm";
import { users, employees, userPermissions } from "../../core/db/schema";
import { generateOtp, storeOtp, verifyOtp } from "../../core/db/security";
import { AuditService } from "../audit/service";
import argon2 from "argon2";
import { eq, and, asc } from "drizzle-orm";

// ─────────────────────────────────────────────
// Argon2id password helpers
// ─────────────────────────────────────────────

export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4,
  });
}

export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, password);
  } catch {
    return false;
  }
}

// ─────────────────────────────────────────────
// JWT — HMAC-SHA256
// ─────────────────────────────────────────────

function getSecret(): string {
  const s = process.env.JWT_SECRET;
  if (!s || s === "insecure-dev-secret") {
    if (process.env.NODE_ENV === "production") {
      throw new Error("JWT_SECRET must be set in production");
    }
  }
  return s ?? "insecure-dev-secret";
}

export interface JWTPayload {
  sub: string;
  employee_number: string;
  name: string;
  role: string;
  dept: string;
  permissions: PermissionFlags;
  iat: number;
  exp: number;
  jti: string;
  type: "access" | "refresh";
}

function signPayload(header: string, body: string): string {
  return createHmac("sha256", getSecret()).update(`${header}.${body}`).digest("base64url");
}

function buildJWT(payload: Omit<JWTPayload, "iat" | "exp" | "jti">, expiresInSec: number): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const body = Buffer.from(
    JSON.stringify({
      ...payload,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + expiresInSec,
      jti: randomBytes(16).toString("hex"),
    }),
  ).toString("base64url");
  return `${header}.${body}.${signPayload(header, body)}`;
}

/**
 * Sign an access token.
 * IMPORTANT: caller-provided payload values always win over defaults.
 */
export function signToken(payload: Record<string, any>): string {
  return buildJWT(
    {
      sub: payload.employee_number ?? "",
      employee_number: payload.employee_number ?? "",
      name: payload.name ?? "",
      role: payload.role ?? "",
      dept: payload.dept ?? "",
      permissions: payload.permissions ?? {
        view_results: 0,
        input_data: 0,
        edit_formulas: 0,
        change_specs: 0,
      },
      ...payload,
      type: "access" as const, // always forced
    },
    8 * 3600,
  );
}

export function signRefreshToken(payload: Record<string, any>): string {
  return buildJWT(
    {
      sub: payload.employee_number ?? "",
      employee_number: payload.employee_number ?? "",
      name: payload.name ?? "",
      role: payload.role ?? "",
      dept: payload.dept ?? "",
      permissions: payload.permissions ?? {
        view_results: 0,
        input_data: 0,
        edit_formulas: 0,
        change_specs: 0,
      },
      ...payload,
      type: "refresh" as const,
    },
    30 * 24 * 3600,
  );
}

function verifySignature(header: string, body: string, sig: string): boolean {
  const expected = signPayload(header, body);
  const sigBuf = Buffer.from(sig, "base64url");
  const expBuf = Buffer.from(expected, "base64url");
  if (sigBuf.length !== expBuf.length) return false;
  return timingSafeEqual(sigBuf, expBuf);
}

export function verifyToken(token: string): Record<string, any> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [header, body, sig] = parts;
    if (!verifySignature(header, body, sig)) return null;
    const payload = JSON.parse(Buffer.from(body, "base64url").toString()) as JWTPayload;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    if (payload.type !== "access") return null;
    return payload;
  } catch {
    return null;
  }
}

export function verifyRefreshToken(token: string): JWTPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [header, body, sig] = parts;
    if (!verifySignature(header, body, sig)) return null;
    const payload = JSON.parse(Buffer.from(body, "base64url").toString()) as JWTPayload;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    if (payload.type !== "refresh") return null;
    return payload;
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

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

// ─────────────────────────────────────────────
// AuthService
// ─────────────────────────────────────────────

export const AuthService = {
  getUsers: async (): Promise<UserPayload[]> => {
    try {
      const rows = await dbOrm
        .select({
          employee_number: employees.employee_number,
          name: employees.name,
          role: employees.role,
          dept: employees.department,
          view_results: userPermissions.view_results,
          input_data: userPermissions.input_data,
          edit_formulas: userPermissions.edit_formulas,
          change_specs: userPermissions.change_specs,
        })
        .from(users)
        .innerJoin(employees, eq(users.employee_number, employees.employee_number))
        .innerJoin(userPermissions, eq(employees.role, userPermissions.role as any))
        .where(eq(users.status, 'ACTIVE'))
        .orderBy(asc(employees.name));
        
      return rows.map(mapToPayload);
    } catch (err: any) {
      if (err.message === "Database not connected") return mockUsers();
      console.warn("getUsers DB error:", err.message);
      return mockUsers();
    }
  },

  resetCredentials: async (employeeNumber: string): Promise<boolean> => {
    // Generate a new temporary PIN '0000' and clear password to force reset
    // In a real app we might send an email, but here we just reset the state
    const tempPinHash = await hashPassword("0000");
    await dbOrm
      .update(users)
      .set({ password_hash: null as any, pin_hash: tempPinHash, failed_attempts: 0, locked_until: null as any })
      .where(eq(users.employee_number, employeeNumber));

    await AuditService.createLog(
      employeeNumber,
      "ACCOUNT_RESET",
      "Administrator initiated credential reset",
      "127.0.0.1"
    );

    return true;
  },

  getMe: async (employeeNumber: string): Promise<UserPayload> => {
    try {
      const rows = await dbOrm
        .select({
          employee_number: employees.employee_number,
          name: employees.name,
          role: employees.role,
          dept: employees.department,
          view_results: userPermissions.view_results,
          input_data: userPermissions.input_data,
          edit_formulas: userPermissions.edit_formulas,
          change_specs: userPermissions.change_specs,
        })
        .from(employees)
        .innerJoin(userPermissions, eq(employees.role, userPermissions.role as any))
        .where(eq(employees.employee_number, employeeNumber));
        
      if (!rows.length) throw new Error("User not found");
      return mapToPayload(rows[0]);
    } catch (err: any) {
      if (err.message === "Database not connected") return mockUsers()[0];
      throw err;
    }
  },

  getInitials: (fullName: string): string => {
    const parts = fullName.trim().split(/\s+/);
    const first = parts[0]?.[0] ?? "";
    const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
    return (first + last).toUpperCase();
  },

  verifyEmployee: async (employeeNumber: string, nationalId: string, dob: string) => {
    const records = await dbOrm.select().from(employees).where(and(eq(employees.employee_number, employeeNumber), eq(employees.national_id, nationalId), eq(employees.dob, dob)));
    const employee = records[0];

    if (!employee) {
      await AuditService.createLog(
        employeeNumber,
        "VERIFICATION_FAILED",
        "Invalid identity credentials",
        "127.0.0.1",
      );
      return null;
    }
    const usrRecords = await dbOrm.select().from(users).where(eq(users.employee_number, employeeNumber));
    const existingUser = usrRecords[0];

    if (existingUser?.status === "ACTIVE") throw new Error("Account already active. Please login.");

    const otp = generateOtp();
    await storeOtp(employeeNumber, otp, 5);
    console.log(`[OTP for ${employeeNumber}]: ${otp}`);
    await AuditService.createLog(
      employeeNumber,
      "OTP_SENT",
      "OTP generated for identity verification",
      "127.0.0.1",
    );
    return { employee_number: employeeNumber };
  },

  confirmOtp: async (employeeNumber: string, code: string): Promise<boolean> => {
    const valid = await verifyOtp(employeeNumber, code);
    await AuditService.createLog(
      employeeNumber,
      "OTP_CONFIRMATION",
      valid ? "OTP confirmed successfully" : "OTP failed or expired",
      "127.0.0.1",
    );
    return valid;
  },

  setupCredentials: async (
    employeeNumber: string,
    password: string,
    pin?: string,
  ): Promise<boolean> => {
    const passwordHash = await hashPassword(password);
    const pinHash = pin ? await hashPassword(pin) : null;
    
    // UPSERT polyfill using Drizzle depending on postgres dialect
    await dbOrm.insert(users).values({
      employee_number: employeeNumber,
      password_hash: passwordHash,
      pin_hash: pinHash,
      status: 'ACTIVE'
    }).onConflictDoUpdate({
      target: users.employee_number,
      set: {
        password_hash: passwordHash,
        pin_hash: pinHash,
        status: 'ACTIVE'
      }
    });
    
    await AuditService.createLog(
      employeeNumber,
      "ACCOUNT_ACTIVATED",
      "User completed credential setup",
      "127.0.0.1",
    );
    return true;
  },

  login: async (
    employeeNumber: string,
    password?: string,
    pin?: string,
  ): Promise<{ token: string; refreshToken: string; user: UserPayload } | null> => {
    try {
      const rows = await dbOrm
        .select({
          password_hash: users.password_hash,
          pin_hash: users.pin_hash,
          status: users.status,
          locked_until: users.locked_until,
          failed_attempts: users.failed_attempts,
          employee_number: users.employee_number,
          name: employees.name,
          role: employees.role,
          dept: employees.department,
          view_results: userPermissions.view_results,
          input_data: userPermissions.input_data,
          edit_formulas: userPermissions.edit_formulas,
          change_specs: userPermissions.change_specs,
        })
        .from(users)
        .innerJoin(employees, eq(users.employee_number, employees.employee_number))
        .innerJoin(userPermissions, eq(employees.role, userPermissions.role as any))
        .where(eq(users.employee_number, employeeNumber));

      const row = rows[0];

      if (!row || row.status !== "ACTIVE") return null;

      const now = new Date();
      if (row.locked_until && new Date(row.locked_until) > now) {
        const mins = Math.ceil((new Date(row.locked_until).getTime() - now.getTime()) / 60_000);
        throw new Error(`Account locked. Try again in ${mins} minute${mins !== 1 ? "s" : ""}.`);
      }

      let isValid = false;
      if (password) isValid = await verifyPassword(row.password_hash as any, password);
      else if (pin && row.pin_hash) isValid = await verifyPassword(row.pin_hash, pin);

      if (!isValid) {
        const attempts = (row.failed_attempts || 0) + 1;
        if (attempts >= 5) {
          const lockUntil = new Date(Date.now() + 30 * 60_000);
          await dbOrm.update(users).set({ failed_attempts: attempts, locked_until: lockUntil }).where(eq(users.employee_number, employeeNumber));
          
          await AuditService.createLog(
            employeeNumber,
            "ACCOUNT_LOCKED",
            "Locked after 5 failed attempts",
            "127.0.0.1",
          );
          throw new Error("Account locked for 30 minutes after 5 failed attempts.");
        }
        await dbOrm.update(users).set({ failed_attempts: attempts }).where(eq(users.employee_number, employeeNumber));
        
        await AuditService.createLog(
          employeeNumber,
          "LOGIN_FAILED",
          "Incorrect credentials",
          "127.0.0.1",
        );
        return null;
      }

      await dbOrm.update(users).set({ failed_attempts: 0, locked_until: null, last_login: new Date() }).where(eq(users.employee_number, employeeNumber));

      const payload = mapToPayload(row);
      const token = signToken(payload as any);
      const refresh = signRefreshToken({ sub: employeeNumber, employee_number: employeeNumber });
      await AuditService.createLog(employeeNumber, "LOGIN_SUCCESS", "User logged in", "127.0.0.1");
      return { token, refreshToken: refresh, user: payload };
    } catch (err: any) {
      if (err.message?.includes("locked") || err.message?.includes("Invalid")) throw err;
      if (err.message === "Database not connected") {
        if (process.env.NODE_ENV === "production") {
          throw new Error("Database unavailable - cannot authenticate");
        }
        const mockUser =
          mockUsers().find((u) => u.employee_number === employeeNumber) ?? mockUsers()[0];
        const token = signToken(mockUser as any);
        const refresh = signRefreshToken({
          sub: mockUser.employee_number,
          employee_number: mockUser.employee_number,
        });
        return { token, refreshToken: refresh, user: mockUser };
      }
      throw err;
    }
  },

  refreshAccess: async (refreshToken: string): Promise<{ token: string } | null> => {
    const payload = verifyRefreshToken(refreshToken);
    if (!payload) return null;
    try {
      const rows = await dbOrm
        .select({
          employee_number: employees.employee_number,
          name: employees.name,
          role: employees.role,
          dept: employees.department,
          view_results: userPermissions.view_results,
          input_data: userPermissions.input_data,
          edit_formulas: userPermissions.edit_formulas,
          change_specs: userPermissions.change_specs,
        })
        .from(users)
        .innerJoin(employees, eq(users.employee_number, employees.employee_number))
        .innerJoin(userPermissions, eq(employees.role, userPermissions.role as any))
        .where(and(eq(users.employee_number, payload.employee_number), eq(users.status, 'ACTIVE')));

      const row = rows[0];
      if (!row) return null;
      return { token: signToken(mapToPayload(row) as any) };
    } catch {
      return null;
    }
  },
};

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function mapToPayload(row: any): UserPayload {
  return {
    id: row.employee_number,
    employee_number: row.employee_number,
    name: row.name,
    role: row.role,
    dept: row.dept ?? row.department ?? "",
    permissions: {
      view_results: row.view_results ?? 0,
      input_data: row.input_data ?? 0,
      edit_formulas: row.edit_formulas ?? 0,
      change_specs: row.change_specs ?? 0,
    },
    initials: AuthService.getInitials(row.name ?? ""),
  };
}

function mockUsers(): UserPayload[] {
  return [
    {
      id: "ADMIN",
      employee_number: "ADMIN",
      name: "Administrator",
      role: "ADMIN",
      dept: "IT",
      permissions: { view_results: 1, input_data: 1, edit_formulas: 1, change_specs: 1 },
      initials: "AD",
    },
    {
      id: "CHEMIST",
      employee_number: "CHEMIST",
      name: "Lab Chemist",
      role: "CHEMIST",
      dept: "Quality Control",
      permissions: { view_results: 1, input_data: 1, edit_formulas: 0, change_specs: 0 },
      initials: "LC",
    },
  ];
}
