import { z } from "zod";
import { Role } from "../../core/types/role";

export const RoleSchema = z.nativeEnum(Role);

export const EmployeeSchema = z.object({
  employee_number: z.union([z.string(), z.number()]).transform(String),
  national_id: z.union([z.string(), z.number()]).transform(String),
  dob: z.union([z.string(), z.number()]).transform(String),
});

export const SetupSchema = z.object({
  employee_number: z.union([z.string(), z.number()]).transform(String),
  password: z.union([z.string(), z.number()]).transform(String),
  pin: z.union([z.string(), z.number()]).transform(String),
});

export const LoginSchema = z
  .object({
    employee_number: z.union([z.string(), z.number()]).transform(String),
    password: z
      .union([z.string(), z.number()])
      .optional()
      .transform((v) => (v ? String(v) : undefined)),
    pin: z
      .union([z.string(), z.number()])
      .optional()
      .transform((v) => (v ? String(v) : undefined)),
  })
  .refine((data) => data.password || data.pin, {
    message: "Missing password or pin",
    path: ["password", "pin"],
  });

export const UserPermissionsSchema = z.object({
  view_results: z.number().optional(),
  input_data: z.number().optional(),
  edit_formulas: z.number().optional(),
  change_specs: z.number().optional(),
});

export const UserSchema = z.object({
  id: z.string(),
  employee_number: z.string(),
  name: z.string(),
  role: RoleSchema,
  dept: z.string().optional(),
  initials: z.string().optional(),
  permissions: UserPermissionsSchema.optional(),
  avatar_url: z.string().optional(),
  is_active: z.boolean().optional(),
  status: z.enum(["online", "offline", "busy"]).optional(),
  online: z.boolean().optional(),
});

export const GetUsersResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(UserSchema),
});

export const GetMeResponseSchema = z.object({
  success: z.boolean(),
  data: UserSchema,
});
