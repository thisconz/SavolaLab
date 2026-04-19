import { Hono } from "hono";
import { setCookie, deleteCookie } from "hono/cookie";
import { AuthService } from "./service";
import { authenticateToken } from "../../core/middleware";
import type { Variables } from "../../core/types";
import { logger } from "../../core/logger";
import { z } from "zod";
import {
  GetUsersResponseSchema,
  GetMeResponseSchema,
} from "../../../src/shared/schemas/auth.schema";

const app = new Hono<{ Variables: Variables }>();

// ── Input schemas ────────────────────────────────────────────────────────────

const EmployeeVerifySchema = z.object({
  employee_number: z.union([z.string(), z.number()]).transform(String),
  national_id:     z.union([z.string(), z.number()]).transform(String),
  dob:             z.union([z.string(), z.number()]).transform(String),
});

const ConfirmOtpSchema = z.object({
  employee_number: z.union([z.string(), z.number()]).transform(String),
  code:            z.union([z.string(), z.number()]).transform(String),
});

const SetupCredentialsSchema = z.object({
  employee_number: z.union([z.string(), z.number()]).transform(String),
  password:        z.union([z.string(), z.number()]).transform(String),
  pin:             z.union([z.string(), z.number()]).optional().transform((v) =>
    v !== undefined ? String(v) : undefined
  ),
});

const LoginSchema = z
  .object({
    employee_number: z.union([z.string(), z.number()]).transform(String),
    password:        z.union([z.string(), z.number()]).optional().transform((v) =>
      v !== undefined ? String(v) : undefined
    ),
    pin:             z.union([z.string(), z.number()]).optional().transform((v) =>
      v !== undefined ? String(v) : undefined
    ),
  })
  .refine((d) => d.password || d.pin, {
    message: "Either password or pin is required",
  });

// ── Helper ──────────────────────────────────────────────────────────────────

function toMsg(err: unknown): string {
  return err instanceof Error ? err.message : "An unexpected error occurred.";
}

// ── Routes ───────────────────────────────────────────────────────────────────

// List active users (public — used on login screen)
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

// Verify employee identity + issue OTP
app.post("/verify-employee", async (c) => {
  const requestId = c.get("requestId");
  try {
    const body   = await c.req.json();
    const parsed = EmployeeVerifySchema.parse(body);
    const result = await AuthService.verifyEmployee(
      parsed.employee_number,
      parsed.national_id,
      parsed.dob,
    );
    if (!result) {
      return c.json({ success: false, error: "Employee not found in registry" });
    }
    return c.json({ success: true, message: "OTP dispatched", ...result });
  } catch (err) {
    logger.error({ err, requestId }, "verify-employee failed");
    return c.json({ success: false, error: toMsg(err) }, 400);
  }
});

// Confirm OTP code
app.post("/confirm-otp", async (c) => {
  const requestId = c.get("requestId");
  try {
    const body   = await c.req.json();
    const parsed = ConfirmOtpSchema.parse(body);
    const valid  = await AuthService.confirmOtp(parsed.employee_number, parsed.code);
    if (!valid) return c.json({ success: false, error: "Invalid or expired OTP" });
    return c.json({ success: true, message: "Identity confirmed" });
  } catch (err) {
    logger.error({ err, requestId }, "confirm-otp failed");
    return c.json({ success: false, error: toMsg(err) }, 400);
  }
});

// Setup password + PIN credentials
app.post("/setup-credentials", async (c) => {
  const requestId = c.get("requestId");
  try {
    const body   = await c.req.json();
    const parsed = SetupCredentialsSchema.parse(body);
    await AuthService.setupCredentials(
      parsed.employee_number,
      parsed.password,
      parsed.pin,
    );
    return c.json({ success: true, message: "Account activated successfully" });
  } catch (err) {
    logger.error({ err, requestId }, "setup-credentials failed");
    return c.json({ success: false, error: toMsg(err) }, 400);
  }
});

// Login
app.post("/login", async (c) => {
  const requestId = c.get("requestId");
  try {
    const body   = await c.req.json();
    const parsed = LoginSchema.parse(body);
    const result = await AuthService.login(
      parsed.employee_number,
      parsed.password,
      parsed.pin,
    );

    if (!result) {
      return c.json({ success: false, error: "Invalid credentials" }, 401);
    }

    setCookie(c, "token", result.token, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge:   8 * 60 * 60,
      path:     "/",
    });

    return c.json({ success: true, ...result });
  } catch (err) {
    logger.error({ err, requestId }, "login failed");
    // Propagate business logic messages (account locked, etc.)
    const msg = toMsg(err);
    const status = msg.toLowerCase().includes("locked") ? 423 : 400;
    return c.json({ success: false, error: msg }, status as any);
  }
});

// Current user
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

// Logout
app.post("/logout", async (c) => {
  deleteCookie(c, "token", {
    httpOnly: true,
    secure:   process.env.NODE_ENV === "production",
    sameSite: "lax",
    path:     "/",
  });
  return c.json({ success: true });
});

export default app;