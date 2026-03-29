import jwt, { type JwtPayload } from "jsonwebtoken";
import type { Context, Next } from "hono";
import { getCookie } from "hono/cookie";
import type { Variables, User, UserRole, PermissionFlags } from "./types";

// ─────────────────────────────────────────────
// JWT payload
// ─────────────────────────────────────────────
export interface AuthTokenPayload extends JwtPayload {
  employee_number: string;
  name: string;
  role: UserRole;
  dept: string;
  permissions: PermissionFlags;
  initials: string;
  iat: number;
  exp: number;
}

// ─────────────────────────────────────────────
// Secret
// ─────────────────────────────────────────────
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  if (process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET env var is required in production.");
  }
  console.warn(
    "⚠️  JWT_SECRET not set — using insecure dev default. DO NOT use in production.",
  );
}

const SECRET = JWT_SECRET!;

// ─────────────────────────────────────────────
// Token extraction (header > cookie)
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

  try {
    const decoded = jwt.verify(token, SECRET, {
      algorithms: ["HS256"],
    }) as AuthTokenPayload;

    if (!decoded.employee_number || !decoded.role) {
      return c.json({ error: "Malformed token payload." }, 403);
    }

    // Expose as strongly typed User
    c.set("user", {
      employee_number: decoded.employee_number,
      name: decoded.name,
      role: decoded.role,
      dept: decoded.dept,
      permissions: decoded.permissions,
    } satisfies User);

    await next();
  } catch (err: unknown) {
    if (err instanceof jwt.TokenExpiredError) {
      return c.json({ error: "Session expired. Please log in again." }, 401);
    }
    if (err instanceof jwt.JsonWebTokenError) {
      return c.json({ error: "Invalid token." }, 403);
    }
    console.error("❌ AUTH ERROR", err);
    return c.json({ error: "Authentication failed." }, 403);
  }
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
      return c.json({ error: `Permission denied: '${perm}' required.` }, 403);
    }
    await next();
  };
}
