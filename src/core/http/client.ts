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
  /** Request timeout in milliseconds (default: 30 000) */
  timeout?: number;
  /** Max retry attempts for network-level / 5xx failures (default: 3) */
  retries?: number;
  /** Internal flag — disables token refresh loop on recursive retry */
  _noRefresh?: boolean;
  /** Current attempt number (internal — do not set manually) */
  _attempt?: number;
}

// ─────────────────────────────────────────────
// ApiClient singleton
// ─────────────────────────────────────────────

const BASE_URL = "/api";

/** Exponential backoff: 1s, 2s, 4s, capped at 8s */
function backoffDelay(attempt: number): number {
  return Math.min(1_000 * 2 ** (attempt - 1), 8_000);
}

class ApiClient {
  private static instance: ApiClient;
  private refreshPromise: Promise<boolean> | undefined = undefined;

  // ── Injected dependencies (set once at app boot) ──────────────────────
  private onLogout: () => void = () => { /* empty */ };
  private onTokenUpdate: (token: string) => void = () => { /* empty */ };

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

  // ── Core request ────────────────────────────────────────────────────────
  private async request<T>(path: string, config: RequestConfig = {}): Promise<T> {
    const { timeout = 30_000, retries = 3, _noRefresh = false, _attempt = 1, ...init } = config;

    const url = `${BASE_URL}${path}`;
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

      // ── 401: attempt one silent token refresh ────────────────────────
      if (response.status === 401 && !_noRefresh) {
        const refreshed = await this.tryRefresh();
        if (refreshed) {
          // Re-issue the original request — disable refresh to prevent loops
          return this.request<T>(path, { ...config, _noRefresh: true });
        }
        // Refresh failed — session is truly expired
        this.onLogout();
        const body = await response.json().catch(() => ({}));
        throw this.makeError(response, {
          ...body,
          error: "Session expired. Please log in again.",
        });
      }

      // ── Client errors (4xx) — do NOT retry, fail immediately ────────
      if (response.status >= 400 && response.status < 500) {
        const body = await response.json().catch(() => ({}));
        throw this.makeError(response, body);
      }

      // ── Server errors (5xx) — retry with exponential backoff ─────────
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        if (_attempt < retries) {
          await new Promise((r) => setTimeout(r, backoffDelay(_attempt)));
          return this.request<T>(path, {
            ...config,
            _attempt: _attempt + 1,
          });
        }
        throw this.makeError(response, body);
      }

      // ── Success ───────────────────────────────────────────────────────
      const contentType = response.headers.get("content-type") ?? "";
      if (contentType.includes("application/json")) {
        return response.json() as Promise<T>;
      }
      return response.text() as unknown as Promise<T>;
    } catch (err: any) {
      clearTimeout(timer);

      // Timeout — do not retry (the server may already be processing)
      if (err.name === "AbortError") {
        throw Object.assign(new Error(`Request timed out after ${timeout}ms: ${path}`), {
          code: "TIMEOUT",
          status: 408,
        } as Partial<ApiError>);
      }

      // Already a typed ApiError (from makeError) — propagate immediately
      if ("code" in err && "status" in err) throw err;

      // Network failure (no response) — retry
      if (_attempt < retries && !_noRefresh) {
        await new Promise((r) => setTimeout(r, backoffDelay(_attempt)));
        return this.request<T>(path, { ...config, _attempt: _attempt + 1 });
      }

      // Max retries exhausted
      Telemetry.logError("API_NETWORK_FAILURE", { path, attempt: _attempt, error: err.message });
      throw Object.assign(err, { code: "NETWORK_ERROR", status: 0 } as Partial<ApiError>);
    }
  }

  // ── Token refresh (singleton promise — deduplicates concurrent calls) ──

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
          this.onTokenUpdate(data.token);
          return true;
        }
        return false;
      } catch {
        return false;
      } finally {
        this.refreshPromise = undefined;
      }
    })();

    return this.refreshPromise;
  }

  // ── Error factory ────────────────────────────────────────────────────────

  private makeError(response: Response, body: any): ApiError {
    let message = "Unknown error";
    if (typeof body?.error === "string") message = body.error;
    else if (body?.error?.message) message = body.error.message;
    else if (body?.message) message = body.message;
    else if (response.statusText) message = response.statusText;

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

  // ── Public HTTP verbs ─────────────────────────────────────────────────

  get<T>(path: string, config?: RequestConfig): Promise<T> {
    return this.request<T>(path, { ...config, method: "GET" });
  }

  post<T>(path: string, body: unknown, config?: RequestConfig): Promise<T> {
    return this.request<T>(path, {
      ...config,
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  put<T>(path: string, body: unknown, config?: RequestConfig): Promise<T> {
    return this.request<T>(path, {
      ...config,
      method: "PUT",
      body: JSON.stringify(body),
    });
  }

  delete<T>(path: string, config?: RequestConfig): Promise<T> {
    return this.request<T>(path, { ...config, method: "DELETE" });
  }
}

export const api = ApiClient.getInstance();
