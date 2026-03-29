import { Hono } from "hono";
import { setCookie, deleteCookie } from "hono/cookie";
import { AuthService } from "./service";
import { authenticateToken } from "../../core/middleware";
import type { Variables } from "../../core/types";

const app = new Hono<{ Variables: Variables }>();

/**
 * Simple input validators
 */
function validateEmployeeInput(body: any) {
  if (!body || typeof body !== "object")
    throw new Error("Invalid request body");
  const { employee_number, national_id, dob } = body;
  if (!employee_number || !national_id || !dob)
    throw new Error("Missing required fields");
  return {
    employee_number: employee_number.toString().trim(),
    national_id: national_id.toString().trim(),
    dob: dob.toString().trim(),
  };
}

function validateSetupInput(body: any) {
  if (!body || typeof body !== "object")
    throw new Error("Invalid request body");
  const { employee_number, password, pin } = body;
  if (!employee_number || !password || !pin)
    throw new Error("Missing required fields");
  return {
    employee_number: employee_number.toString().trim(),
    password: password.toString(),
    pin: pin.toString(),
  };
}

function validateLoginInput(body: any) {
  if (!body || typeof body !== "object")
    throw new Error("Invalid request body");
  const { employee_number, password, pin } = body;
  if (!employee_number) throw new Error("Missing employee_number");
  if (!password && !pin) throw new Error("Missing password or pin");
  return {
    employee_number: employee_number.toString().trim(),
    password: password?.toString(),
    pin: pin?.toString(),
  };
}

// --- Routes ---

// List all users (public for login screen)
app.get("/users", async (c) => {
  try {
    const users = await AuthService.getUsers();
    return c.json({ success: true, data: users });
  } catch (err: any) {
    return c.json(
      { success: false, error: err.message || "An error occurred" },
      400,
    );
  }
});

// Verify employee and send OTP
app.post("/verify-employee", async (c) => {
  try {
    const body = await c.req.json();
    const { employee_number, national_id, dob } = validateEmployeeInput(body);
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
  } catch (err: any) {
    return c.json(
      { success: false, error: err.message || "An error occurred" },
      400,
    );
  }
});

// Confirm OTP
app.post("/confirm-otp", async (c) => {
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
  } catch (err: any) {
    return c.json(
      { success: false, error: err.message || "An error occurred" },
      400,
    );
  }
});

// Setup credentials (password + PIN)
app.post("/setup-credentials", async (c) => {
  try {
    const body = await c.req.json();
    const { employee_number, password, pin } = validateSetupInput(body);
    await AuthService.setupCredentials(employee_number, password, pin);
    return c.json({ success: true, message: "Account activated successfully" });
  } catch (err: any) {
    return c.json(
      { success: false, error: err.message || "An error occurred" },
      400,
    );
  }
});

// Login
app.post("/login", async (c) => {
  try {
    const body = await c.req.json();
    const { employee_number, password, pin } = validateLoginInput(body);
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
  } catch (err: any) {
    return c.json(
      { success: false, error: err.message || "An error occurred" },
      400,
    );
  }
});

// Get current user
app.get("/me", authenticateToken, async (c) => {
  try {
    const user = c.get("user");
    if (!user) throw new Error("Unauthorized");
    const me = await AuthService.getMe(user.employee_number);
    return c.json({ success: true, data: me });
  } catch (err: any) {
    return c.json(
      { success: false, error: err.message || "An error occurred" },
      400,
    );
  }
});

// Logout
app.post("/logout", async (c) => {
  try {
    deleteCookie(c, "token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
    });
    return c.json({ success: true });
  } catch (err: any) {
    return c.json(
      { success: false, error: err.message || "An error occurred" },
      400,
    );
  }
});

export default app;
