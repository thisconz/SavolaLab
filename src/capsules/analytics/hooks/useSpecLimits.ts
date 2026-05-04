import { useState, useEffect } from "react";
import { api } from "../../../core/http/client";

export interface SpecLimit {
  id: number;
  test_type: string;
  sample_stage: string | null;
  usl: number;
  lsl: number;
  unit: string | null;
}

type SpecLimitsMap = Record<string, { usl: number; lsl: number; label: string }>;

const FALLBACK_LIMITS: SpecLimitsMap = {
  Brix: { lsl: 60, usl: 70, label: "Brix %" },
  Purity: { lsl: 95, usl: 100, label: "Purity %" },
  Colour: { lsl: 0, usl: 60, label: "Colour IU" },
};

/**
 * Fetches active spec limits from the DB via the Settings API.
 * Falls back to hardcoded values if the request fails (e.g. network error,
 * empty table) so the chart always renders something meaningful.
 */
export function useSpecLimits(): {
  limits: SpecLimitsMap;
  loading: boolean;
} {
  const [limits, setLimits] = useState<SpecLimitsMap>(FALLBACK_LIMITS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    api
      .get<{ success: boolean; data: SpecLimit[] }>("/settings/spec_limits")
      .then((res) => {
        if (cancelled) return;
        const rows = res.data ?? [];
        if (rows.length === 0) return; // keep fallback

        const mapped: SpecLimitsMap = {};
        for (const row of rows) {
          // Only use global limits (sample_stage = null) for SPC reference lines.
          // Stage-specific limits are used server-side for Cpk calculation.
          if (row.sample_stage !== null) continue;
          mapped[row.test_type] = {
            usl: row.usl,
            lsl: row.lsl,
            label: `${row.test_type}${row.unit ? ` (${row.unit})` : ""}`,
          };
        }
        if (Object.keys(mapped).length > 0) setLimits(mapped);
      })
      .catch(() => {
        // Silently fall back — chart still renders with defaults
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { limits, loading };
}
