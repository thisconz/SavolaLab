import { api } from "../../../core/http/client";
import { User } from "../../../core/types";

export const AuthApi = {
  getUsers: async () => {
    console.log("[DEBUG] AuthApi.getUsers calling /v1/directory/users");
    const response = await api.get<{ success: boolean; data: User[] }>("/v1/directory/users");
    console.log("[DEBUG] AuthApi.getUsers response:", response);
    return response.data || [];
  },

  getMe: async () => {
    const response = await api.get<{ success: boolean; data: User }>("/v1/directory/me");
    return response.data;
  },

  login: async (payload: { employee_number: string | number; pin?: string; password?: string }) => {
    return api.post<{ success: boolean; user: User; token: string }>(
      "/v1/directory/login",
      payload,
    );
  },

  verifyEmployee: async (payload: {
    employee_number: string;
    national_id: string;
    dob: string;
  }) => {
    return api.post<{ success: boolean; name: string; dept: string }>(
      "/v1/directory/verify-employee",
      payload,
    );
  },

  confirmOtp: async (employeeNumber: string, otp: string) => {
    return api.post<{ success: boolean }>("/v1/directory/confirm-otp", {
      employee_number: employeeNumber,
      code: otp,
    });
  },

  setupCredentials: async (payload: {
    employee_number: string;
    pin: string;
    password?: string;
  }) => {
    return api.post<{ success: boolean }>("/v1/directory/setup-credentials", payload);
  },
};
