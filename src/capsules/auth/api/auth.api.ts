import { api } from "../../../core/http/client";
import { User } from "../../../core/types";

export const AuthApi = {
  /**
   * Returns the public user list (name, role, initials) for the login screen.
   * Uses the unauthenticated /public endpoint — no token required.
   */
  getUsers: async (): Promise<Pick<User, "id" | "name" | "role" | "initials">[]> => {
    const response = await api.get<{ success: boolean; data: User[] }>(
      "/v1/directory/users/public",
    );
    return (response.data ?? []) as any;
  },

  /** Returns the full profile for the currently authenticated user. */
  getMe: async (): Promise<User> => {
    const response = await api.get<{ success: boolean; data: User }>("/v1/directory/me");
    return response.data;
  },

  /** Admin: reset an employee's credentials to temp PIN 0000. */
  resetCredentials: async (id: string): Promise<{ success: boolean; message: string }> => {
    return api.post(`/v1/directory/reset-credentials/${id}`, {});
  },

  /** Authenticate with employee number + PIN or password. */
  login: async (payload: {
    employee_number: string | number;
    pin?: string;
    password?: string;
  }): Promise<{ success: boolean; user: User; token: string }> => {
    return api.post("/v1/directory/login", payload);
  },

  /** Step 1 of registration: verify identity and trigger OTP dispatch. */
  verifyEmployee: async (payload: {
    employee_number: string;
    national_id: string;
    dob: string;
  }): Promise<{ success: boolean; name: string; dept: string }> => {
    return api.post("/v1/directory/verify-employee", payload);
  },

  /** Step 2 of registration: confirm the 6-digit OTP. */
  confirmOtp: async (
    employeeNumber: string,
    otp: string,
  ): Promise<{ success: boolean }> => {
    return api.post("/v1/directory/confirm-otp", {
      employee_number: employeeNumber,
      code: otp,
    });
  },

  /** Step 3 of registration: set password and PIN to activate the account. */
  setupCredentials: async (payload: {
    employee_number: string;
    pin: string;
    password?: string;
  }): Promise<{ success: boolean }> => {
    return api.post("/v1/directory/setup-credentials", payload);
  },
};
