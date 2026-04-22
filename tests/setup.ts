/**
 * Vitest global setup file.
 * Runs before every test suite.
 * Imported via vitest.config.ts → test.setupFiles
 */

import "@testing-library/jest-dom";
import { vi, afterEach } from "vitest";

/* ── Mock browser APIs not available in happy-dom ─────────────────────── */

// SSE / EventSource
if (!globalThis.EventSource) {
  (globalThis as any).EventSource = class {
    static CONNECTING = 0;
    static OPEN = 1;
    static CLOSED = 2;
    readyState = 0;
    onopen: any = null;
    onerror: any = null;
    addEventListener = vi.fn();
    removeEventListener = vi.fn();
    close = vi.fn();
  };
}

// matchMedia (not supported in happy-dom)
if (!globalThis.matchMedia) {
  Object.defineProperty(globalThis, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

// ResizeObserver
if (!globalThis.ResizeObserver) {
  (globalThis as any).ResizeObserver = class {
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
  };
}

// IntersectionObserver
if (!globalThis.IntersectionObserver) {
  (globalThis as any).IntersectionObserver = class {
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
  };
}

/* ── Reset mocks between tests ─────────────────────────────────────────── */

afterEach(() => {
  vi.clearAllMocks();
});
