import { AuditService } from "@/server/modules/audit/service";
import { AuthService } from "@/server/modules/auth/service";
import { describe as d3, it as it3, expect as e3, vi as vi3 } from "vitest";

d3("Auth service — IP propagation (ZTH-002)", () => {
  it3("LOGIN_SUCCESS audit log uses the passed IP, not 127.0.0.1", async () => {
    const auditSpy = vi3.spyOn(AuditService, "createLog");
    await AuthService.login("ADMIN", "Z3nthar!2025", undefined, "203.0.113.42");
    const successCall = auditSpy.mock.calls.find((c) => c[1] === "LOGIN_SUCCESS");
    e3(successCall?.[3]).toBe("203.0.113.42");
    e3(successCall?.[3]).not.toBe("127.0.0.1");
  });
});
