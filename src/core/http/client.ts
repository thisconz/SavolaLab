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
  /** Skip token-refresh retry on 401 (used internally to prevent loops) */
  _noRefresh?: boolean;
}

const BASE_URL = "/api";

class ApiClient {
  private static instance: ApiClient;
  private refreshing: Promise<boolean> | null = null; // dedup concurrent refresh attempts

  private constructor() {}

  static getInstance(): ApiClient {
    if (!ApiClient.instance) ApiClient.instance = new ApiClient();
    return ApiClient.instance;
  }

  private async request<T>(
    path: string,
    config: RequestConfig = {},
  ): Promise<T> {
    const {
      timeout = 10_000,
      retries = 3,
      _noRefresh = false,
      ...init
    } = config;

    const url = `${BASE_URL}${path}`;
    const method = (init.method ?? "GET").toUpperCase();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    try {
      const token = useAuthStore.getState().token;
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(init.headers as Record<string, string>),
      };

      const response = await fetch(url, {
        ...init,
        credentials: "include", // sends httpOnly cookies
        signal: controller.signal,
        headers,
      });

      clearTimeout(timer);

      // ── 401: try to refresh once ───────────────────────────────────────
      if (response.status === 401 && !_noRefresh) {
        const refreshed = await this.tryRefresh();
        if (refreshed) {
          // Retry original request with new token
          return this.request<T>(path, { ...config, _noRefresh: true });
        }
        // Refresh failed → force logout
        useAuthStore.getState().logout();
        throw this.makeError(response, {
          error: "Session expired. Please log in again.",
        });
      }

      if (!response.ok) {
        let data: any = {};
        try {
          data = await response.json();
        } catch {}
        throw this.makeError(response, data);
      }

      const contentType = response.headers.get("content-type");

      if (contentType?.includes("application/json")) {
        return await response.json();
      }

      return (await response.text()) as unknown as T;
    } catch (err: any) {
      clearTimeout(timer);

      if (err.name === "AbortError") {
        Telemetry.logError("API_TIMEOUT", { url, timeout });
        throw Object.assign(new Error("Request timed out"), {
          code: "TIMEOUT",
          status: 0,
        });
      }

      if (retries > 0 && method === "GET" && !(err as ApiError).status) {
        // Network error only — don't retry 4xx/5xx
        const delay = Math.min(500 * (4 - retries), 3000);
        await new Promise((r) => setTimeout(r, delay));
        return this.request<T>(path, { ...config, retries: retries - 1 });
      }

      throw err;
    }
  }

  /**
   * Attempt to refresh the access token using the refresh_token cookie.
   * Deduplicates concurrent calls so only one refresh request fires at a time.
   */
  private tryRefresh(): Promise<boolean> {
    if (this.refreshing) return this.refreshing;

    this.refreshing = (async () => {
      try {
        const res = await fetch(`${BASE_URL}/v1/directory/refresh`, {
          method: "POST",
          credentials: "include",
        });
        if (!res.ok) return false;

        const data = await res.json();
        if (data.success && data.token) {
          useAuthStore.getState().setToken(data.token);
          return true;
        }
        return false;
      } catch {
        return false;
      } finally {
        this.refreshing = null;
      }
    })();

    return this.refreshing;
  }

  private makeError(response: Response, data: any): ApiError {
    const message = data?.error || response.statusText || "Unknown error";
    const err = Object.assign(new Error(message), {
      code: data?.code || "API_ERROR",
      status: response.status,
      details: data?.details,
    }) as ApiError;

    Telemetry.logError("API_FAILURE", {
      message: err.message,
      code: err.code,
      status: err.status,
    });

    return err;
  }

  get<T>(path: string, config?: RequestConfig) {
    return this.request<T>(path, { ...config, method: "GET" });
  }
  post<T>(path: string, body: any, config?: RequestConfig) {
    return this.request<T>(path, {
      ...config,
      method: "POST",
      body: JSON.stringify(body),
    });
  }
  put<T>(path: string, body: any, config?: RequestConfig) {
    return this.request<T>(path, {
      ...config,
      method: "PUT",
      body: JSON.stringify(body),
    });
  }
  delete<T>(path: string, config?: RequestConfig) {
    return this.request<T>(path, { ...config, method: "DELETE" });
  }
}

export const api = ApiClient.getInstance();
