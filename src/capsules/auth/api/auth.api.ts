import { api } from "../../../core/http/client";
import { User } from "../../../core/types";

export const AuthApi = {
  getUsers: async () => {
    const response = await api.get<{ success: boolean; data: User[] }>(
      "/auth/users",
    );
    return response.data || [];
  },

  getMe: async () => {
    const response = await api.get<{ success: boolean; data: User }>(
      "/auth/me",
    );
    return response.data;
  },

  login: async (payload: {
    employee_number: string | number;
    pin?: string;
    password?: string;
  }) => {
    return api.post<{ success: boolean; user: any; token: string }>(
      "/auth/login",
      payload,
    );
  },

  verifyEmployee: async (payload: {
    employee_number: string;
    national_id: string;
    dob: string;
  }) => {
    return api.post<{ success: boolean; name: string; dept: string }>(
      "/auth/verify-employee",
      payload,
    );
  },

  confirmOtp: async (employeeNumber: string, otp: string) => {
    return api.post<{ success: boolean }>("/auth/confirm-otp", {
      employee_number: employeeNumber,
      code: otp,
    });
  },

  setupCredentials: async (payload: {
    employee_number: string;
    pin: string;
    password?: string;
  }) => {
    return api.post<{ success: boolean }>("/auth/setup-credentials", payload);
  },
};
