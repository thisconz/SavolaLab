import { Hono } from "hono";
import type { Variables } from "../../core/types";
import { setCookie, deleteCookie, getCookie } from "hono/cookie";
import { AuthService, verifyRefreshToken } from "./service";
import { authenticateToken, requireRoles } from "../../core/middleware";
import { authRateLimit } from "../../core/rateLimit";
import { z } from "zod";
import {
  GetUsersResponseSchema,
  GetMeResponseSchema,
} from "../../../src/shared/schemas/auth.schema";
import { logger } from "../../core/logger";

const app = new Hono<{ Variables: Variables }>();

// ── Input schemas ──────────────────────────────────────────────────────────

const EmployeeVerifySchema = z.object({
  employee_number: z.union([z.string(), z.number()]).transform(String),
  national_id: z.union([z.string(), z.number()]).transform(String),
  dob: z.union([z.string(), z.number()]).transform(String),
});

const ConfirmOtpSchema = z.object({
  employee_number: z.union([z.string(), z.number()]).transform(String),
  code: z.union([z.string(), z.number()]).transform(String),
});

const SetupCredentialsSchema = z.object({
  employee_number: z.union([z.string(), z.number()]).transform(String),
  password: z.union([z.string(), z.number()]).transform(String),
  pin: z
    .union([z.string(), z.number()])
    .optional()
    .transform((v) => (v !== undefined ? String(v) : undefined)),
});

const LoginSchema = z
  .object({
    employee_number: z.union([z.string(), z.number()]).transform(String),
    password: z
      .union([z.string(), z.number()])
      .optional()
      .transform((v) => (v !== undefined ? String(v) : undefined)),
    pin: z
      .union([z.string(), z.number()])
      .optional()
      .transform((v) => (v !== undefined ? String(v) : undefined)),
  })
  .refine((d) => d.password || d.pin, {
    message: "Either password or pin is required",
  });

// ── Helper ─────────────────────────────────────────────────────────────────

function toMsg(err: unknown): string {
  return err instanceof Error ? err.message : "An unexpected error occurred.";
}

const COOKIE_OPTS_BASE = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
};

// ── Routes ─────────────────────────────────────────────────────────────────

app.get("/users", async (c) => {
  const requestId = c.get("requestId");
  try {
    const users = await AuthService.getUsers();
    return c.json(GetUsersResponseSchema.parse({ success: true, data: users }));
  } catch (err) {
    logger.error({ err, requestId }, "Failed to fetch users");
    return c.json({ success: false, error: toMsg(err) }, 400);
  }
});

app.post("/verify-employee", async (c) => {
  const requestId = c.get("requestId");
  try {
    const body = await c.req.json();
    const parsed = EmployeeVerifySchema.parse(body);
    const result = await AuthService.verifyEmployee(
      parsed.employee_number,
      parsed.national_id,
      parsed.dob,
    );
    if (!result)
      return c.json({
        success: false,
        error: "Employee not found in registry",
      });
    return c.json({ success: true, message: "OTP dispatched", ...result });
  } catch (err) {
    logger.error({ err, requestId }, "verify-employee failed");
    return c.json({ success: false, error: toMsg(err) }, 400);
  }
});

app.post("/confirm-otp", async (c) => {
  const requestId = c.get("requestId");
  try {
    const body = await c.req.json();
    const parsed = ConfirmOtpSchema.parse(body);
    const valid = await AuthService.confirmOtp(parsed.employee_number, parsed.code);
    if (!valid) return c.json({ success: false, error: "Invalid or expired OTP" });
    return c.json({ success: true, message: "Identity confirmed" });
  } catch (err) {
    logger.error({ err, requestId }, "confirm-otp failed");
    return c.json({ success: false, error: toMsg(err) }, 400);
  }
});

app.post("/setup-credentials", async (c) => {
  const requestId = c.get("requestId");
  try {
    const body = await c.req.json();
    const parsed = SetupCredentialsSchema.parse(body);
    await AuthService.setupCredentials(parsed.employee_number, parsed.password, parsed.pin);
    return c.json({ success: true, message: "Account activated successfully" });
  } catch (err) {
    logger.error({ err, requestId }, "setup-credentials failed");
    return c.json({ success: false, error: toMsg(err) }, 400);
  }
});

app.post("/login", async (c) => {
  const requestId = c.get("requestId");
  try {
    const body = await c.req.json();
    const parsed = LoginSchema.parse(body);
    const result = await AuthService.login(parsed.employee_number, parsed.password, parsed.pin);

    if (!result) return c.json({ success: false, error: "Invalid credentials" }, 401);

    const isProd = process.env.NODE_ENV === "production";

    // Access token cookie (8h)
    setCookie(c, "token", result.token, {
      ...COOKIE_OPTS_BASE,
      secure: isProd,
      maxAge: 8 * 60 * 60,
    });

    // Refresh token cookie (30d) — httpOnly, not readable by JS
    setCookie(c, "refresh_token", result.refreshToken, {
      ...COOKIE_OPTS_BASE,
      secure: isProd,
      maxAge: 30 * 24 * 60 * 60,
    });

    return c.json({ success: true, token: result.token, user: result.user });
  } catch (err) {
    logger.error({ err, requestId }, "login failed");
    const msg = toMsg(err);
    const status = msg.toLowerCase().includes("locked") ? 423 : 400;
    return c.json({ success: false, error: msg }, status as any);
  }
});

/**
 * Refresh endpoint — exchanges a valid refresh cookie for a new access token.
 * No body required; reads the httpOnly refresh_token cookie automatically.
 */
app.post("/refresh", authRateLimit, async (c) => {
  const refresh = getCookie(c, "refresh_token");
  if (!refresh) return c.json({ success: false, error: "No refresh token" }, 401);

  const result = await AuthService.refreshAccess(refresh);
  if (!result) return c.json({ success: false, error: "Invalid or expired refresh token" }, 401);

  const isProd = process.env.NODE_ENV === "production";
  setCookie(c, "token", result.token, {
    ...COOKIE_OPTS_BASE,
    secure: isProd,
    maxAge: 8 * 60 * 60,
  });

  return c.json({ success: true, token: result.token });
});

app.post("/reset-credentials/:id", authenticateToken, requireRoles("ADMIN", "HEAD_MANAGER"), async (c) => {
  const requestId = c.get("requestId");
  try {
    const employeeNumber = c.req.param("id");
    if (!employeeNumber) return c.json({ success: false, error: "Employee number is required" }, 400);
    await AuthService.resetCredentials(employeeNumber);
    return c.json({ success: true, message: "Credentials reset. Temp PIN: 0000" });
  } catch (err) {
    logger.error({ err, requestId }, "reset-credentials failed");
    return c.json({ success: false, error: toMsg(err) }, 400);
  }
});

app.get("/me", authenticateToken, async (c) => {
  const requestId = c.get("requestId");
  try {
    const user = c.get("user");
    if (!user) throw new Error("Unauthorized");
    const me = await AuthService.getMe(user.employee_number);
    return c.json(GetMeResponseSchema.parse({ success: true, data: me }));
  } catch (err) {
    logger.error({ err, requestId }, "get /me failed");
    return c.json({ success: false, error: toMsg(err) }, 400);
  }
});

app.post("/logout", async (c) => {
  const isProd = process.env.NODE_ENV === "production";

  const rawRefresh = getCookie(c, "refresh_token");
  if (rawRefresh) {
    try {
      await AuthService.revokeRefreshToken(rawRefresh);
    } catch {
      // Non-fatal — cookie deletion still proceeds
    }
  }
  
  deleteCookie(c, "token", { ...COOKIE_OPTS_BASE, secure: isProd });
  deleteCookie(c, "refresh_token", { ...COOKIE_OPTS_BASE, secure: isProd });
  return c.json({ success: true });
});

export default app;
