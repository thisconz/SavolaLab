import { Telemetry } from "../telemetry/telemetry.util";
import { useAuthStore } from "../../orchestrator/state/auth.store";

export interface ApiError extends Error {
  code: string;
  status: number;
  details?: any;
}

export interface RequestConfig extends RequestInit {
  timeout?: number;
  retries?: number;
}

export class ApiClient {
  private static instance: ApiClient;
  private baseUrl: string = "/api";

  private constructor() {}

  public static getInstance(): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient();
    }
    return ApiClient.instance;
  }

  private async request<T>(
    path: string,
    config: RequestConfig = {},
  ): Promise<T> {
    const { timeout = 10000, retries = 3, ...init } = config;
    const url = `${this.baseUrl}${path}`;
    const method = (init.method ?? "GET").toUpperCase();

    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    try {
      const token = useAuthStore.getState().token;
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(init.headers as Record<string, string>),
      };

      const response = await fetch(url, {
        ...init,
        credentials: "include",
        signal: controller.signal,
        headers,
      });

      clearTimeout(id);

      if (!response.ok) {
        let errorData;
        try {
          const text = await response.text();
          if (response.status !== 401) {
            console.error(`[DEBUG] API Error Response Text for ${url}:`, text);
          }
          errorData = JSON.parse(text);
        } catch (e) {
          errorData = {};
        }
        throw this.handleError(response, errorData);
      }

      const text = await response.text();
      try {
        return JSON.parse(text);
      } catch (e) {
        console.error(`[DEBUG] API Success Response Parse Error for ${url}. Raw text:`, text);
        throw e;
      }
    } catch (error: any) {
      clearTimeout(id);

      if (error.name === "AbortError") {
        Telemetry.logError("API_TIMEOUT", { url, timeout });
        throw new Error("Request timed out");
      }

      if (retries > 0 && method === "GET") {
        const delay = Math.min(1000 * (4 - retries), 3000);
        await new Promise((r) => setTimeout(r, delay));
        Telemetry.logInfo("API_RETRY", { url, remainingRetries: retries - 1 });
        return this.request<T>(path, { ...config, retries: retries - 1 });
      }

      throw error;
    }
  }

  private handleError(response: Response, data: any): ApiError {
    const message = data.error || response.statusText || "Unknown API Error";
    const error = new Error(message) as ApiError;
    error.code = data.code || "UNKNOWN_ERROR";
    error.status = response.status;
    error.details = data.details;

    Telemetry.logError("API_FAILURE", {
      message: error.message,
      code: error.code,
      status: error.status,
    });

    if (response.status === 401) {
      useAuthStore.getState().logout();
    }

    return error;
  }

  public get<T>(path: string, config?: RequestConfig): Promise<T> {
    return this.request<T>(path, { ...config, method: "GET" });
  }

  public post<T>(path: string, body: any, config?: RequestConfig): Promise<T> {
    return this.request<T>(path, {
      ...config,
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  public put<T>(path: string, body: any, config?: RequestConfig): Promise<T> {
    return this.request<T>(path, {
      ...config,
      method: "PUT",
      body: JSON.stringify(body),
    });
  }

  public delete<T>(path: string, config?: RequestConfig): Promise<T> {
    return this.request<T>(path, { ...config, method: "DELETE" });
  }
}

export const api = ApiClient.getInstance();
