import { useState, useEffect, useCallback, useRef } from "react";
import { LabApi } from "../api/lab.api";
import { Sample } from "../../../core/types";
import { useRealtime } from "../../../core/providers/RealtimeProvider";
import { toast } from "sonner";

interface UseLiveSamplesReturn {
  samples: Sample[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  lastUpdated: Date | null;
  /** True when a background SSE refresh is in-flight */
  isRefreshing: boolean;
}

/**
 * useLabSamples
 *
 * Fetches the sample queue on mount, then listens to the SSE bus for
 * SAMPLE_CREATED / SAMPLE_UPDATED / SAMPLE_STATUS_CHANGED events and
 * automatically refreshes with a small debounce to coalesce rapid events.
 */
export function useLabSamples(): UseLiveSamplesReturn {
  const [samples, setSamples] = useState<Sample[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const mountedRef = useRef(true);

  const { on } = useRealtime();

  const fetchSamples = useCallback(async (silent = false) => {
    if (!mountedRef.current) return;
    if (!silent) setLoading(true);
    else setIsRefreshing(true);

    try {
      const data = await LabApi.getSamples();
      if (!mountedRef.current) return;
      setSamples(data);
      setError(null);
      setLastUpdated(new Date());
    } catch (err: any) {
      if (!mountedRef.current) return;
      setError(err.message || "Failed to fetch samples");
    } finally {
      if (!mountedRef.current) return;
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // ── Initial load ─────────────────────────────────────────────────────────
  useEffect(() => {
    mountedRef.current = true;
    fetchSamples(false);
    return () => {
      mountedRef.current = false;
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
        debounceTimer.current = undefined;
      }
    };
  }, [fetchSamples]);

  // ── SSE subscriptions ─────────────────────────────────────────────────────
  useEffect(() => {
    const scheduleRefresh = (label: string) => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
        debounceTimer.current = undefined;
      }
      debounceTimer.current = setTimeout(() => {
        fetchSamples(true);
      }, 600); // 600 ms debounce
    };

    const unsubs = [
      on("SAMPLE_CREATED", (data) => {
        // Optimistic toast so users see instant feedback even before the
        // background re-fetch completes
        toast.info(`New sample registered: ${data.batch_id ?? `#${data.id}`}`, {
          duration: 3000,
          id: `sample-created-${data.id}`,
        });
        scheduleRefresh("SAMPLE_CREATED");
      }),

      on("SAMPLE_STATUS_CHANGED", (data) => {
        // Optimistically update the status in the local array so the card
        // updates instantly without waiting for the full re-fetch
        setSamples((prev) =>
          prev.map((s) => (s.id === data.id ? { ...s, status: data.new_status as any } : s)),
        );
        scheduleRefresh("SAMPLE_STATUS_CHANGED");
      }),

      on("SAMPLE_UPDATED", () => scheduleRefresh("SAMPLE_UPDATED")),
    ];

    return () => {
      unsubs.forEach((u) => u());
      clearTimeout(debounceTimer.current);
    };
  }, [on, fetchSamples]);

  return {
    samples,
    loading,
    error,
    refresh: () => fetchSamples(true),
    lastUpdated,
    isRefreshing,
  };
}
