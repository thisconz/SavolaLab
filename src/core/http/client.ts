import { Telemetry } from "../telemetry/telemetry.util";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export interface ApiError extends Error {
  code: string;
  status: number;
  details?: unknown;
}

export interface RequestConfig extends RequestInit {
  timeout?: number;
  retries?: number;
  _noRefresh?: boolean; // used internally to disable token refresh
}

// ─────────────────────────────────────────────
// ApiClient singleton
// ─────────────────────────────────────────────

const BASE_URL = "/api";

function getCsrfTokenFromCookie(): string {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : "";
}

class ApiClient {
  private static instance: ApiClient;
  private refreshPromise: Promise<boolean> | null = null;
  
  // Dependency Injections
  private onLogout: () => void = () => {};
  private onTokenUpdate: (token: string) => void = () => {};

  static getInstance(): ApiClient {
    if (!ApiClient.instance) ApiClient.instance = new ApiClient();
    return ApiClient.instance;
  }

  /** Inject logout behavior (e.g., authStore.logout()) */
  setLogoutHandler(fn: () => void): void {
    this.onLogout = fn;
  }

  /** Inject token update behavior (e.g., authStore.setToken()) */
  setTokenHandler(fn: (token: string) => void): void {
    this.onTokenUpdate = fn;
  }

  private async request<T>(path: string, config: RequestConfig = {}): Promise<T> {
    const { timeout = 30_000, retries = 3, _noRefresh = false, ...init } = config;

    const url = `${BASE_URL}${path}`;
    const method = (init.method ?? "GET").toUpperCase();
    
    // ... logic for CSRF and controller ...
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(init.headers as Record<string, string> | undefined),
      };

      const response = await fetch(url, {
        ...init,
        credentials: "include",
        signal: controller.signal,
        headers,
      });

      clearTimeout(timer);

      // ── 401: attempt silent token refresh ───────────────────────────
      if (response.status === 401 && !_noRefresh) {
        const refreshed = await this.tryRefresh();
        if (refreshed) {
          return this.request<T>(path, { ...config, _noRefresh: true });
        }
        
        // Use the injected dependency instead of the store directly
        this.onLogout(); 
        throw this.makeError(response, { error: "Session expired. Please log in again." });
      }

      if (!response.ok) {
        let body: any = {};
        try { body = await response.json(); } catch { /* empty */ }
        throw this.makeError(response, body);
      }

      const contentType = response.headers.get("content-type") ?? "";
      if (contentType.includes("application/json")) return response.json() as Promise<T>;
      return response.text() as unknown as Promise<T>;

    } catch (err: any) {
      clearTimeout(timer);
      // ... Retry logic ...
      throw err;
    }
  }

  private tryRefresh(): Promise<boolean> {
    if (this.refreshPromise) return this.refreshPromise;

    this.refreshPromise = (async () => {
      try {
        const res = await fetch(`${BASE_URL}/v1/directory/refresh`, {
          method: "POST",
          credentials: "include",
        });
        if (!res.ok) return false;
        
        const data = await res.json();
        if (data.success && data.token) {
          // Use the injected dependency
          this.onTokenUpdate(data.token); 
          return true;
        }
        return false;
      } catch {
        return false;
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  private makeError(response: Response, body: any): ApiError {
    let message = "Unknown error";
    if (typeof body?.error === "string") {
      message = body.error;
    } else if (body?.error?.message) {
      message = body.error.message;
    } else if (body?.message) {
      message = body.message;
    } else if (response.statusText) {
      message = response.statusText;
    }

    const err = Object.assign(new Error(message), {
      code: body?.code ?? "API_ERROR",
      status: response.status,
      details: body?.details,
    }) as ApiError;

    Telemetry.logError("API_FAILURE", {
      message: err.message,
      code: err.code,
      status: err.status,
    });

    return err;
  }

  // ── Public methods ────────────────────────────────────────────────────────

  get<T>(path: string, config?: RequestConfig) {
    return this.request<T>(path, { ...config, method: "GET" });
  }

  post<T>(path: string, body: unknown, config?: RequestConfig) {
    return this.request<T>(path, { ...config, method: "POST", body: JSON.stringify(body) });
  }

  put<T>(path: string, body: unknown, config?: RequestConfig) {
    return this.request<T>(path, { ...config, method: "PUT", body: JSON.stringify(body) });
  }

  delete<T>(path: string, config?: RequestConfig) {
    return this.request<T>(path, { ...config, method: "DELETE" });
  }
}

export const api = ApiClient.getInstance();
