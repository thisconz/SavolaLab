import { Role } from "./types/role";
import { AppTab } from "./types/app.types";

/**
 * RBAC Configuration: Defines which tabs are accessible by each role.
 */
const ROLE_PERMISSIONS: Record<Role, AppTab[]> = {
  ADMIN: [
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
  ],
  HEAD_MANAGER: [
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
  ],
  ASSISTING_MANAGER: [
    "dashboard",
    "lab",
    "stat",
    "dispatch",
    "analytics",
    "workflows",
    "assets",
    "archive",
  ],
  SHIFT_CHEMIST: ["dashboard", "lab", "stat", "dispatch", "archive"],
  CHEMIST: ["dashboard", "lab", "stat", "dispatch", "archive"],
  ENGINEER: ["dashboard", "assets", "intelligence", "archive"],
  DISPATCH: ["dashboard", "dispatch", "archive"],
};

/**
 * Checks if a specific tab is allowed for a given role.
 */
export const isTabAllowed = (role: Role, tab: AppTab): boolean => {
  const allowedTabs = ROLE_PERMISSIONS[role] || ["dashboard"];
  return allowedTabs.includes(tab);
};

/**
 * Returns the list of allowed tabs for a given role.
 */
export const getAllowedTabs = (role: Role): AppTab[] => {
  return ROLE_PERMISSIONS[role] || ["dashboard"];
};
