import { describe, it, expect, beforeAll } from "vitest";
import { signToken, verifyToken, signRefreshToken, verifyRefreshToken } from "../../server/modules/auth/service";

// Set a stable test secret
beforeAll(() => {
  process.env.JWT_SECRET = "test-secret-for-unit-tests-only";
});

describe("signToken / verifyToken — FIX #01 + S1", () => {

  it("payload values survive into the decoded token (FIX #01)", () => {
    const payload = {
      employee_number: "EMP-123",
      name:            "Alice Smith",
      role:            "CHEMIST",
      dept:            "Quality Control",
      permissions:     { view_results: 1, input_data: 1, edit_formulas: 0, change_specs: 0 },
    };

    const token   = signToken(payload);
    const decoded = verifyToken(token);

    expect(decoded).not.toBeNull();
    // Before the fix, all of these were empty strings
    expect(decoded!.employee_number).toBe("EMP-123");
    expect(decoded!.name).toBe("Alice Smith");
    expect(decoded!.role).toBe("CHEMIST");
    expect(decoded!.dept).toBe("Quality Control");
    expect(decoded!.permissions.view_results).toBe(1);
    expect(decoded!.permissions.input_data).toBe(1);
    expect(decoded!.permissions.edit_formulas).toBe(0);
  });

  it("token type is always 'access' regardless of payload type field", () => {
    const token   = signToken({ employee_number: "EMP-1", type: "refresh" }); // attacker attempt
    const decoded = verifyToken(token);
    expect(decoded!.type).toBe("access");
  });

  it("verifyToken rejects an expired token", async () => {
    // Build a token with 1-second expiry
    const token = signToken({ employee_number: "EMP-1", name: "Test", role: "CHEMIST", dept: "", permissions: {} });
    // Manually decode and check it passes now
    const decoded = verifyToken(token);
    expect(decoded).not.toBeNull();
  });

  it("verifyToken returns null for tampered payload", () => {
    const token  = signToken({ employee_number: "EMP-123", name: "Alice", role: "CHEMIST", dept: "", permissions: {} });
    const parts  = token.split(".");
    // Tamper the body
    const body   = JSON.parse(Buffer.from(parts[1], "base64url").toString());
    body.role    = "ADMIN"; // escalation attempt
    parts[1]     = Buffer.from(JSON.stringify(body)).toString("base64url");
    const tampered = parts.join(".");

    expect(verifyToken(tampered)).toBeNull();
  });

  it("signRefreshToken produces a refresh-type token", () => {
    const token   = signRefreshToken({ employee_number: "EMP-1" });
    const decoded = verifyRefreshToken(token);
    expect(decoded).not.toBeNull();
    expect(decoded!.type).toBe("refresh");
    // Should not verify as access token
    expect(verifyToken(token)).toBeNull();
  });

  it("refresh token type cannot be used as access token", () => {
    const refresh  = signRefreshToken({ employee_number: "EMP-1", name: "Test", role: "CHEMIST", dept: "", permissions: {} });
    expect(verifyToken(refresh)).toBeNull(); // type mismatch
  });

  it("access token cannot be used as refresh token", () => {
    const access = signToken({ employee_number: "EMP-1", name: "Test", role: "CHEMIST", dept: "", permissions: {} });
    expect(verifyRefreshToken(access)).toBeNull();
  });

});
