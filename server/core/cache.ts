/**
 * Zenthar In-Memory TTL Cache
 *
 * A lightweight key-value store with per-entry TTLs.
 * Used for analytics aggregations and telemetry queries that don't need
 * to hit the DB on every request.
 *
 * NOT a replacement for Redis in production multi-instance deployments —
 * but eliminates the most egregious repeated queries in a single-node setup.
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export class TTLCache {
  private readonly store = new Map<string, CacheEntry<any>>();
  private readonly cleanupInterval: ReturnType<typeof setInterval>;

  constructor(cleanupIntervalMs = 60_000) {
    this.cleanupInterval = setInterval(() => this.sweep(), cleanupIntervalMs);
    if (this.cleanupInterval.unref) this.cleanupInterval.unref();
  }

  /** Store a value with a TTL in milliseconds */
  set<T>(key: string, value: T, ttlMs: number): void {
    this.store.set(key, { value, expiresAt: Date.now() + ttlMs });
  }

  /** Retrieve a value — returns undefined if missing or expired */
  get<T>(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value as T;
  }

  has(key: string): boolean {
    return this.get(key) !== undefined;
  }

  invalidate(key: string): void {
    this.store.delete(key);
  }

  invalidatePrefix(prefix: string): void {
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) this.store.delete(key);
    }
  }

  flush(): void {
    this.store.clear();
  }

  get size(): number {
    this.sweep();
    return this.store.size;
  }

  async getOrSet<T>(key: string, fn: () => Promise<T>, ttlMs: number): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== undefined) return cached;
    const value = await fn();
    this.set(key, value, ttlMs);
    return value;
  }

  private sweep(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.expiresAt) this.store.delete(key);
    }
  }

  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.store.clear();
  }
}

// ─── Module-level singletons ─────────────────────────────────────────────────

export const analyticsCache = new TTLCache();
export const telemetryCache = new TTLCache();
export const operationalCache = new TTLCache();

/** Named TTL durations (milliseconds) */
export const TTL = {
  SECONDS_30: 30_000,
  MINUTES_1: 60_000,
  MINUTES_5: 5 * 60_000,
  MINUTES_15: 15 * 60_000,
  MINUTES_30: 30 * 60_000,
  HOURS_1: 60 * 60_000,
} as const;
