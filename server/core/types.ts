// server/core/types.ts

export type UserRole =
  | "ADMIN"
  | "CHEMIST"
  | "SHIFT_CHEMIST"
  | "ASSISTING_MANAGER"
  | "HEAD_MANAGER"
  | "ENGINEER"
  | "DISPATCH";

export type PermissionFlags = {
  view_results: 0 | 1;
  input_data: 0 | 1;
  edit_formulas: 0 | 1;
  change_specs: 0 | 1;
};

export type User = {
  employee_number: string;
  name: string;
  role: UserRole;
  dept: string;
  permissions: PermissionFlags;
};

export type Variables = {
  user: User;
};

// ─────────────────────────────────────────────
// Permission helpers
// ─────────────────────────────────────────────

export function can(user: User, perm: keyof PermissionFlags): boolean {
  return user.permissions[perm] === 1;
}

export const REVIEWER_ROLES: UserRole[] = ["SHIFT_CHEMIST", "HEAD_MANAGER"];

export function isReviewer(role: string): role is UserRole {
  return REVIEWER_ROLES.includes(role as UserRole);
}
