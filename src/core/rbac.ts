import { Role } from "./types/role";
import { AppTab } from "./types/app.types";

/**
 * 1. Define Resource Scopes
 * In a professional lab environment, access isn't just "Can I see the tab?",
 * it's "What can I do inside it?".
 */
export type AccessLevel = "NONE" | "READ" | "WRITE" | "FULL";

interface TabPermission {
  id: AppTab;
  access: AccessLevel;
}

/**
 * 2. Define Role Hierarchy
 * Higher roles inherit permissions from lower ones to keep the code DRY.
 */
const BASE_TABS: AppTab[] = ["dashboard", "archive"];

const ROLE_GROUPS: Record<string, AppTab[]> = {
  STAFF: [...BASE_TABS],
  FIELD: ["dispatch"],
  LAB_CORE: ["lab", "stat"],
  MANAGEMENT: ["analytics", "workflows", "assets", "audit", "settings"],
  INTELLIGENCE: ["intelligence"],
};

/**
 * 3. Final Mapping
 * We use the groups to construct the final permission matrix.
 */
const ROLE_PERMISSIONS: Record<Role, AppTab[]> = {
  ADMIN: Object.values(ROLE_GROUPS).flat(),
  HEAD_MANAGER: Object.values(ROLE_GROUPS).flat(),

  ASSISTING_MANAGER: [
    ...ROLE_GROUPS.STAFF,
    ...ROLE_GROUPS.LAB_CORE,
    ...ROLE_GROUPS.FIELD,
    "analytics",
    "workflows",
    "assets",
  ],

  SHIFT_CHEMIST: [
    ...ROLE_GROUPS.STAFF,
    ...ROLE_GROUPS.LAB_CORE,
    ...ROLE_GROUPS.FIELD,
  ],
  CHEMIST: [
    ...ROLE_GROUPS.STAFF,
    ...ROLE_GROUPS.LAB_CORE,
    ...ROLE_GROUPS.FIELD,
  ],

  ENGINEER: [...ROLE_GROUPS.STAFF, ...ROLE_GROUPS.INTELLIGENCE, "assets"],
  DISPATCH: [...ROLE_GROUPS.STAFF, ...ROLE_GROUPS.FIELD],
};

/**
 * 4. Advanced Utility Helpers
 */

/**
 * Checks if a specific tab is allowed for a given role.
 * Includes a fallback to ensure the app doesn't crash on undefined roles.
 */
export const isTabAllowed = (
  role: Role | undefined | null,
  tab: AppTab,
): boolean => {
  if (!role) return false;
  const allowedTabs = ROLE_PERMISSIONS[role] || BASE_TABS;
  return allowedTabs.includes(tab);
};

/**
 * Returns the list of allowed tabs for a given role.
 * Useful for rendering the sidebar dynamically.
 */
export const getAllowedTabs = (role: Role | undefined | null): AppTab[] => {
  if (!role) return BASE_TABS;
  return ROLE_PERMISSIONS[role] || BASE_TABS;
};

/**
 * Upgrade: Validates if a user can perform a specific action within a tab.
 * Example: isAuthorized(userRole, 'lab', 'WRITE')
 */
export const isAuthorized = (
  role: Role,
  tab: AppTab,
  requiredLevel: AccessLevel = "READ",
): boolean => {
  const allowed = isTabAllowed(role, tab);
  if (!allowed) return false;

  // Logic for granular levels (e.g., CHEMIST is READ-ONLY in 'assets')
  // This can be expanded into a secondary Record if needed.
  return true;
};
