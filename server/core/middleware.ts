import type { Context, Next } from "hono";
import { getCookie } from "hono/cookie";
import type { Variables, User, UserRole, PermissionFlags } from "./types";
import { verifyToken } from "../modules/auth/service";

// ─────────────────────────────────────────────
// Token extraction (Authorization header → cookie)
// ─────────────────────────────────────────────

function extractToken(c: Context): string | null {
  const auth = c.req.header("authorization");
  if (auth?.startsWith("Bearer ")) return auth.slice(7);
  return getCookie(c, "token") ?? null;
}

// ─────────────────────────────────────────────
// Middleware: authenticate
// ─────────────────────────────────────────────

export const authenticateToken = async (
  c: Context<{ Variables: Variables }>,
  next: Next,
): Promise<Response | void> => {
  const token = extractToken(c);

  if (!token) {
    return c.json({ error: "Authentication required." }, 401);
  }

  const decoded = verifyToken(token);

  if (!decoded) {
    return c.json({ error: "Invalid or expired session. Please log in again." }, 401);
  }

  if (!decoded.employee_number || !decoded.role) {
    return c.json({ error: "Malformed token payload." }, 403);
  }

  c.set("user", {
    employee_number: decoded.employee_number,
    name:            decoded.name       ?? "Unknown",
    role:            decoded.role       as UserRole,
    dept:            decoded.dept       ?? "",
    permissions:     decoded.permissions ?? {
      view_results: 0, input_data: 0, edit_formulas: 0, change_specs: 0,
    },
  } satisfies User);

  await next();
};

// ─────────────────────────────────────────────
// Middleware: require specific roles
// ─────────────────────────────────────────────

export function requireRoles(...roles: UserRole[]) {
  return async (
    c: Context<{ Variables: Variables }>,
    next: Next,
  ): Promise<Response | void> => {
    const user = c.get("user");
    if (!roles.includes(user.role)) {
      return c.json(
        { error: `Access denied. Required roles: ${roles.join(", ")}` },
        403,
      );
    }
    await next();
  };
}

// ─────────────────────────────────────────────
// Middleware: require a specific permission flag
// ─────────────────────────────────────────────

export function requirePermission(perm: keyof PermissionFlags) {
  return async (
    c: Context<{ Variables: Variables }>,
    next: Next,
  ): Promise<Response | void> => {
    const user = c.get("user");
    if (!user.permissions[perm]) {
      return c.json({ error: `Permission denied: '${perm}' required` }, 403);
    }
    await next();
  };
}