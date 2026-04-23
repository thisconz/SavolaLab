import { describe as d3, it as it3, expect as e3 } from "vitest";
import { isTabAllowed } from "../../src/core/rbac";
import { Role } from "../../src/core/types/role";
import type { AppTab } from "../../src/core/types/app.types";

d3("isTabAllowed — RBAC matrix", () => {
  it3("ADMIN can access all tabs", () => {
    const allTabs: AppTab[] = [
      "dashboard",
      "lab",
      "stat",
      "dispatch",
      "analytics",
      "workflows",
      "intelligence",
      "assets",
      "audit",
      "settings",
      "archive",
    ];
    allTabs.forEach((tab) => {
      e3(isTabAllowed(Role.ADMIN, tab), `ADMIN should access ${tab}`).toBe(true);
    });
  });

  it3("DISPATCH cannot access lab, analytics, settings, or audit", () => {
    e3(isTabAllowed(Role.DISPATCH, "lab")).toBe(false);
    e3(isTabAllowed(Role.DISPATCH, "analytics")).toBe(false);
    e3(isTabAllowed(Role.DISPATCH, "settings")).toBe(false);
    e3(isTabAllowed(Role.DISPATCH, "audit")).toBe(false);
  });

  it3("DISPATCH can access dashboard, dispatch, archive", () => {
    e3(isTabAllowed(Role.DISPATCH, "dashboard")).toBe(true);
    e3(isTabAllowed(Role.DISPATCH, "dispatch")).toBe(true);
    e3(isTabAllowed(Role.DISPATCH, "archive")).toBe(true);
  });

  it3("ENGINEER can access intelligence and assets but not lab", () => {
    e3(isTabAllowed(Role.ENGINEER, "intelligence")).toBe(true);
    e3(isTabAllowed(Role.ENGINEER, "assets")).toBe(true);
    e3(isTabAllowed(Role.ENGINEER, "lab")).toBe(false);
    e3(isTabAllowed(Role.ENGINEER, "settings")).toBe(false);
  });

  it3("CHEMIST can access lab, stat, dispatch, archive", () => {
    e3(isTabAllowed(Role.CHEMIST, "lab")).toBe(true);
    e3(isTabAllowed(Role.CHEMIST, "stat")).toBe(true);
    e3(isTabAllowed(Role.CHEMIST, "dispatch")).toBe(true);
    e3(isTabAllowed(Role.CHEMIST, "archive")).toBe(true);
  });

  it3("null role returns false for everything except dashboard", () => {
    e3(isTabAllowed(null, "dashboard")).toBe(false);
    e3(isTabAllowed(null, "lab")).toBe(false);
  });
});
