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
  params?: Record<string, string | number | boolean>;
}

export class ApiClient {
  private static instance: ApiClient;
  private readonly baseUrl: string = "/api";

  private constructor() {}

  public static getInstance(): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient();
    }
    return ApiClient.instance;
  }

  private async request<T>(
    path: string,
    config: RequestConfig = {}
  ): Promise<T> {
    const { timeout = 10000, retries = 3, params, ...init } = config;
    
    // 1. Build URL with Query Parameters
    const urlObj = new URL(path, window.location.origin + this.baseUrl);
    if (params) {
      Object.entries(params).forEach(([key, value]) => 
        urlObj.searchParams.append(key, String(value))
      );
    }

    const method = (init.method ?? "GET").toUpperCase();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      // 2. Automatically Inject Auth Token
      const token = useAuthStore.getState().token;
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(init.headers as Record<string, string>),
      };

      const response = await fetch(urlObj.toString(), {
        ...init,
        headers,
        signal: controller.signal,
        credentials: "include",
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw this.handleError(response, errorData);
      }

      // Handle empty responses (204 No Content)
      if (response.status === 204) return {} as T;

      return await response.json();
    } catch (error: any) {
      clearTimeout(timeoutId);

      // 3. Robust Retry Logic & Timeout Handling
      if (error.name === "AbortError") {
        Telemetry.logError("API_TIMEOUT", { url: urlObj.pathname, timeout });
        throw new Error("Request timed out");
      }

      const isIdempotent = ["GET", "HEAD", "OPTIONS", "PUT", "DELETE"].includes(method);
      if (retries > 0 && isIdempotent) {
        const delay = Math.min(1000 * (4 - retries), 3000);
        await new Promise((resolve) => setTimeout(resolve, delay));
        
        Telemetry.logInfo("API_RETRY", { url: urlObj.pathname, remainingRetries: retries - 1 });
        
        return this.request<T>(path, { ...config, retries: retries - 1 });
      }

      throw error;
    }
  }

  private handleError(response: Response, data: any): ApiError {
    const message = data.message || data.error || response.statusText || "Unknown API Error";
    const error = new Error(message) as ApiError;
    
    error.code = data.code || `HTTP_${response.status}`;
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

  // Helper Methods
  public get<T>(path: string, config?: RequestConfig): Promise<T> {
    return this.request<T>(path, { ...config, method: "GET" });
  }

  public post<T>(path: string, body?: any, config?: RequestConfig): Promise<T> {
    return this.request<T>(path, {
      ...config,
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  public put<T>(path: string, body?: any, config?: RequestConfig): Promise<T> {
    return this.request<T>(path, {
      ...config,
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  public patch<T>(path: string, body?: any, config?: RequestConfig): Promise<T> {
    return this.request<T>(path, {
      ...config,
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  public delete<T>(path: string, config?: RequestConfig): Promise<T> {
    return this.request<T>(path, { ...config, method: "DELETE" });
  }
}

export const api = ApiClient.getInstance();