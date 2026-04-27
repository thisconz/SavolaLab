import type { Context, Next, MiddlewareHandler } from "hono";
import { getCookie } from "hono/cookie";
import { createHmac, randomBytes } from "crypto";

const CSRF_HEADER = "X-CSRF-Token";
const CSRF_COOKIE = "csrf_token";
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

function generateCsrfToken(sessionId: string): string {
  // Token = HMAC(secret, sessionId + timestamp-rounded-to-hour)
  // Rotating hourly prevents token replay beyond 1 hour
  const hourSlot = Math.floor(Date.now() / 3_600_000);
  const secret = process.env.JWT_SECRET ?? "insecure-dev-secret";
  return createHmac("sha256", secret)
    .update(`${sessionId}:${hourSlot}`)
    .digest("hex");
}

function verifyCsrfToken(
  sessionId: string,
  submittedToken: string
): boolean {
  // Accept current hour and previous hour to handle clock edge cases
  const secret = process.env.JWT_SECRET ?? "insecure-dev-secret";
  const hourSlot = Math.floor(Date.now() / 3_600_000);

  for (const slot of [hourSlot, hourSlot - 1]) {
    const expected = createHmac("sha256", secret)
      .update(`${sessionId}:${slot}`)
      .digest("hex");

    // Constant-time comparison
    if (
      expected.length === submittedToken.length &&
      createHmac("sha256", secret).update(expected).digest("hex") ===
        createHmac("sha256", secret).update(submittedToken).digest("hex")
    ) {
      return true;
    }
  }
  return false;
}

export const csrfProtection: MiddlewareHandler = async (
  c: Context,
  next: Next
) => {
  const method = c.req.method.toUpperCase();

  // Safe methods don't need CSRF protection
  if (SAFE_METHODS.has(method)) {
    await next();
    return;
  }

  // Auth endpoints that don't use the session cookie yet are exempt
  // (login itself cannot be CSRF-attacked — it doesn't use an existing session)
  const path = c.req.path;
  const CSRF_EXEMPT = ["/api/v1/directory/login", "/api/v1/directory/refresh"];
  if (CSRF_EXEMPT.some((p) => path.startsWith(p))) {
    await next();
    return;
  }

  const sessionId = getCookie(c, "token") ?? "";
  const submittedToken = c.req.header(CSRF_HEADER) ?? "";

  if (!submittedToken || !verifyCsrfToken(sessionId, submittedToken)) {
    return c.json(
      { error: "CSRF token invalid or missing", code: "CSRF_REJECTED" },
      403
    );
  }

  await next();
};

// Export token generator for the /me endpoint to return to the client
export { generateCsrfToken };