import React, { memo, useEffect, useState, useCallback, useRef } from "react";
import {
  Factory,
  Activity,
  AlertTriangle,
  Zap,
  Clock,
  RefreshCw,
  TrendingUp,
} from "lucide-react";
import { LabPanel } from "../../../shared/components/LabPanel";
import { MetricCard } from "../../../shared/components/MetricCard";
import { DataListRow } from "../../../shared/components/DataListRow";
import { AlertCard } from "../../../shared/components/AlertCard";
import { api } from "../../../core/http/client";
import { useRealtime } from "../../../core/providers/RealtimeProvider";
import clsx from "clsx";

interface PlantData {
  metrics: { oee: string; yield: string; energy: number; activeAlarms: number };
  lines: { name: string; status: string; uptime: string; oee: string }[];
}

export const IntelligenceFeature: React.FC = memo(() => {
  const [data, setData] = useState<PlantData | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const { on } = useRealtime();

  const fetchIntel = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setIsRefreshing(true);
    try {
      const res = await api.get<any>("/operational/plant-intel");
      setData(res.data);
    } catch (err) {
      console.error("Failed to fetch plant intel", err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchIntel();
  }, [fetchIntel]);

  // Refresh alarm count when audit events fire
  useEffect(() => {
    const refresh = () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => fetchIntel(true), 1200);
    };
    const unsub = on("SYSTEM_ALERT", refresh);
    return () => {
      unsub();
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [on, fetchIntel]);

  const statusVariant = (s: string): "success" | "warning" | "error" | "info" =>
    (({ Running: "success", Warning: "warning", Stopped: "error" })[s] ?? "info") as any;

  if (loading || !data) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="border-brand-primary h-10 w-10 animate-spin rounded-full border-b-2" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-3xl bg-(--color-zenthar-graphite)/30 p-2">
      <div className="mb-4 flex shrink-0 items-center justify-between px-4">
        <div>
          <h2 className="font-display flex items-center gap-2 text-xl font-bold text-(--color-zenthar-text-primary)">
            <Factory className="text-brand-primary h-5 w-5" /> Plant Intelligence
          </h2>
          <div className="mt-0.5 flex items-center gap-2">
            <p className="text-brand-sage font-mono text-[10px] tracking-widest uppercase">
              Real-time OEE & line status
            </p>
            {isRefreshing && (
              <span className="text-brand-primary flex items-center gap-1 text-[9px] font-bold">
                <RefreshCw size={9} className="animate-spin" /> Syncing
              </span>
            )}
          </div>
        </div>
        <button
          onClick={() => fetchIntel(true)}
          className="border-brand-sage/20 group rounded-xl border bg-(--color-zenthar-graphite) p-2 transition-colors hover:bg-(--color-zenthar-graphite)/80"
        >
          <RefreshCw
            className={clsx(
              "text-brand-sage group-hover:text-brand-primary h-4 w-4",
              isRefreshing && "animate-spin",
            )}
          />
        </button>
      </div>

      <div className="custom-scrollbar flex-1 space-y-6 overflow-y-auto pr-2 pb-6">
        {/* KPI metrics */}
        <div className="grid shrink-0 grid-cols-2 gap-4 lg:grid-cols-4">
          <MetricCard
            label="OEE"
            value={data.metrics.oee}
            trend="+2.1% weekly"
            icon={TrendingUp}
            variant="success"
          />
          <MetricCard
            label="Plant Yield"
            value={data.metrics.yield}
            trend="+2.1% weekly"
            icon={Factory}
            variant="primary"
          />
          <MetricCard
            label="Energy Consumption"
            value={`${data.metrics.energy.toFixed(2).concat(" KWh/t")}`}
            trend="Monitor"
            icon={Zap}
            variant="warning"
          />
          <MetricCard
            label="Active Alarms"
            value={data.metrics.activeAlarms}
            trend={data.metrics.activeAlarms > 0 ? "Investigate" : "All clear"}
            icon={AlertTriangle}
            variant={data.metrics.activeAlarms > 0 ? "error" : "success"}
          />
        </div>

        <div className="grid shrink-0 grid-cols-12 gap-6">
          {/* Line status */}
          <div className="col-span-12 lg:col-span-8">
            <LabPanel title="Production Line Status" icon={Factory}>
              <div className="flex flex-col gap-3 p-4">
                {data.lines.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <Factory className="text-brand-sage/20 mx-auto mb-2 h-8 w-8" />
                    <p className="text-sm font-bold tracking-wider text-white uppercase">
                      No production lines configured
                    </p>
                  </div>
                ) : (
                  data.lines.map((line, i) => (
                    <DataListRow
                      key={i}
                      title={line.name}
                      subtitle={`Status: ${line.status}`}
                      icon={Factory}
                      status={{
                        label: line.status,
                        variant: statusVariant(line.status),
                      }}
                      metrics={[
                        { label: "Uptime", value: line.uptime },
                        { label: "OEE", value: line.oee },
                      ]}
                    />
                  ))
                )}
              </div>
            </LabPanel>
          </div>

          {/* Predictive maintenance */}
          <div className="col-span-12 lg:col-span-4">
            <LabPanel title="Predictive Maintenance" icon={Activity}>
              <div className="flex flex-col gap-4 p-4">
                <AlertCard
                  title="Centrifuge C-101 Vibration"
                  message="Vibration levels increasing. Predicted failure in 48h if unaddressed."
                  type="warning"
                  icon={AlertTriangle}
                />
                <AlertCard
                  title="Evaporator E-202 Cleaning"
                  message="Routine CIP scheduled for next shift (15:00)."
                  type="info"
                  icon={Clock}
                />
                {data.metrics.activeAlarms > 0 && (
                  <AlertCard
                    title={`${data.metrics.activeAlarms} Active Alarm${data.metrics.activeAlarms > 1 ? "s" : ""}`}
                    message="Check audit logs for details on recent error events."
                    type="error"
                    icon={AlertTriangle}
                  />
                )}
              </div>
            </LabPanel>
          </div>
        </div>
      </div>
    </div>
  );
});

IntelligenceFeature.displayName = "IntelligenceFeature";
export default IntelligenceFeature;
