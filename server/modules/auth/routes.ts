import { Hono } from "hono";
import { setCookie, deleteCookie } from "hono/cookie";
import { AuthService } from "./service";
import { authenticateToken } from "../../core/middleware";
import type { Variables } from "../../core/types";
import { logger } from "../../core/logger";
import { 
  EmployeeSchema, 
  SetupSchema, 
  LoginSchema, 
  GetUsersResponseSchema, 
  GetMeResponseSchema 
} from "../../../src/shared/schemas/auth.schema";

const app = new Hono<{ Variables: Variables }>();

function toMsg(err: unknown): string {
  if (err instanceof Error) return err.message;
  return "An unexpected error occurred.";
}

// --- Routes ---

// List all users (public for login screen)
app.get("/users", async (c) => {
  const requestId = c.get("requestId");
  try {
    const users = await AuthService.getUsers();
    return c.json(GetUsersResponseSchema.parse({ success: true, data: users }));
  } catch (err: unknown) {
    console.error("[DEBUG] /users route error:", err);
    logger.error({ err, requestId }, "Failed to fetch users");
    return c.json({ success: false, error: toMsg(err) }, 400);
  }
});

// Verify employee and send OTP
app.post("/verify-employee", async (c) => {
  const requestId = c.get("requestId");
  try {
    const body = await c.req.json();
    const { employee_number, national_id, dob } = EmployeeSchema.parse(body);
    const result = await AuthService.verifyEmployee(
      employee_number,
      national_id,
      dob,
    );
    if (!result) {
      return c.json({
        success: false,
        error: "Employee not found in registry",
      });
    }
    return c.json({
      success: true,
      message: "OTP sent to registered mobile/email",
      ...result,
    });
  } catch (err: unknown) {
    logger.error({ err, requestId }, "Failed to verify employee");
    return c.json({ success: false, error: toMsg(err) }, 400);
  }
});

// Confirm OTP
app.post("/confirm-otp", async (c) => {
  const requestId = c.get("requestId");
  try {
    const body = await c.req.json();
    const { employee_number, code } = body;
    if (!employee_number || !code)
      return c.json({
        success: false,
        error: "Missing employee_number or code",
      });

    const success = await AuthService.confirmOtp(
      employee_number.toString().trim(),
      code.toString().trim(),
    );
    if (!success)
      return c.json({ success: false, error: "Invalid or expired OTP" });

    return c.json({ success: true, message: "Identity confirmed" });
  } catch (err: unknown) {
    logger.error({ err, requestId }, "Failed to confirm OTP");
    return c.json({ success: false, error: toMsg(err) }, 400);
  }
});

// Setup credentials (password + PIN)
app.post("/setup-credentials", async (c) => {
  const requestId = c.get("requestId");
  try {
    const body = await c.req.json();
    const { employee_number, password, pin } = SetupSchema.parse(body);
    await AuthService.setupCredentials(employee_number, password, pin);
    return c.json({ success: true, message: "Account activated successfully" });
  } catch (err: unknown) {
    logger.error({ err, requestId }, "Failed to setup credentials");
    return c.json({ success: false, error: toMsg(err) }, 400);
  }
});

// Login
app.post("/login", async (c) => {
  const requestId = c.get("requestId");
  try {
    const body = await c.req.json();
    const { employee_number, password, pin } = LoginSchema.parse(body);
    const result = await AuthService.login(employee_number, password, pin);

    if (!result) {
      return c.json({ success: false, error: "Invalid credentials" }, 401);
    }

    setCookie(c, "token", result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 8 * 60 * 60, // 8 hours in seconds for Hono
      path: "/",
    });

    return c.json({ success: true, ...result });
  } catch (err: unknown) {
    logger.error({ err, requestId }, "Failed to login");
    return c.json({ success: false, error: toMsg(err) }, 400);
  }
});

// Get current user
app.get("/me", authenticateToken, async (c) => {
  const requestId = c.get("requestId");
  try {
    const user = c.get("user");
    if (!user) throw new Error("Unauthorized");
    const me = await AuthService.getMe(user.employee_number);
    return c.json(GetMeResponseSchema.parse({ success: true, data: me }));
  } catch (err: unknown) {
    logger.error({ err, requestId }, "Failed to fetch current user");
    return c.json({ success: false, error: toMsg(err) }, 400);
  }
});

// Logout
app.post("/logout", async (c) => {
  const requestId = c.get("requestId");
  try {
    deleteCookie(c, "token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
    });
    return c.json({ success: true });
  } catch (err: unknown) {
    logger.error({ err, requestId }, "Failed to logout");
    return c.json({ success: false, error: toMsg(err) }, 400);
  }
});

export default app;
