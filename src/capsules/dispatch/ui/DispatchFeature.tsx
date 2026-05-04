import React, { memo, useEffect, useState, useCallback, useRef } from "react";
import { Truck, Package, Clock, AlertCircle, CheckCircle2, RefreshCw, MapPin, Wifi } from "lucide-react";
import { LabPanel } from "../../../shared/components/LabPanel";
import { MetricCard } from "../../../shared/components/MetricCard";
import { DataListRow } from "../../../shared/components/DataListRow";
import { api } from "../../../core/http/client";
import { useRealtime } from "../../../core/providers/RealtimeProvider";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";

interface DispatchData {
  metrics: {
    pending: number;
    inTransit: number;
    delayed: number;
    critical: number;
  };
  activeShipments: {
    id: string;
    client: string;
    destination: string;
    status: string;
    eta: string;
  }[];
  qcQueue: {
    batch: string;
    client: string;
    status: string;
    progress: number;
    testsCompleted: number;
    totalTests: number;
  }[];
}

export const DispatchFeature: React.FC = memo(() => {
  const [data, setData] = useState<DispatchData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const { on } = useRealtime();

  const fetchDispatch = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setIsRefreshing(true);
    try {
      const res = await api.get<any>("/dispatch");
      setData(res.data);
    } catch (err) {
      console.error("Failed to fetch dispatch data", err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDispatch();
  }, [fetchDispatch]);

  // Refresh QC queue when samples/tests update via SSE
  useEffect(() => {
    const refresh = () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
        debounceTimer.current = undefined;
      }
      debounceTimer.current = setTimeout(() => fetchDispatch(true), 800);
    };
    const unsubs = [on("SAMPLE_STATUS_CHANGED", refresh), on("TEST_REVIEWED", refresh)];
    return () => {
      unsubs.forEach((u) => u());
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
        debounceTimer.current = undefined;
      }
    };
  }, [on, fetchDispatch]);

  if (loading || !data) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="border-brand-primary h-10 w-10 animate-spin rounded-full border-b-2" />
      </div>
    );
  }

  const statusVariant = (s: string): "success" | "warning" | "error" | "info" =>
    (({ "In Transit": "success", Delayed: "warning", Critical: "error" })[s] ?? "info") as any;

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-3xl bg-(--color-zenthar-graphite)/30 p-2">
      {/* Header */}
      <div className="mb-4 flex shrink-0 items-center justify-between px-4">
        <div>
          <h2 className="font-display flex items-center gap-2 text-xl font-bold text-(--color-zenthar-text-primary)">
            <Truck className="text-brand-primary h-5 w-5" /> Dispatch
          </h2>
          <div className="mt-0.5 flex items-center gap-2">
            <p className="text-brand-sage font-mono text-[10px] tracking-widest uppercase">
              Logistics & QC Release
            </p>
            {isRefreshing && (
              <span className="text-brand-primary flex items-center gap-1 text-[9px] font-bold">
                <RefreshCw size={9} className="animate-spin" /> Syncing
              </span>
            )}
          </div>
        </div>
        <button
          onClick={() => fetchDispatch(true)}
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
        {/* Metrics */}
        <div className="grid shrink-0 grid-cols-2 gap-4 lg:grid-cols-4">
          <MetricCard
            label="Pending"
            value={data.metrics.pending}
            trend="Awaiting QC"
            icon={Package}
            variant="primary"
          />
          <MetricCard
            label="In Transit"
            value={data.metrics.inTransit}
            trend="On Schedule"
            icon={Truck}
            variant="success"
          />
          <MetricCard
            label="Delayed"
            value={data.metrics.delayed}
            trend="Under review"
            icon={Clock}
            variant="warning"
          />
          <MetricCard
            label="Critical"
            value={data.metrics.critical}
            trend="Needs action"
            icon={AlertCircle}
            variant="error"
          />
        </div>

        <div className="grid shrink-0 grid-cols-12 gap-6">
          {/* Active shipments */}
          <div className="col-span-12 lg:col-span-7">
            <LabPanel title="Active Shipments" icon={Truck}>
              <div className="flex flex-col gap-3 p-4">
                {data.activeShipments.length === 0 ? (
                  <EmptyState
                    icon={Truck}
                    title="No Active Shipments"
                    subtitle="Logistics_Pipeline_Standby"
                  />
                ) : (
                  data.activeShipments.map((s, i) => (
                    <DataListRow
                      key={i}
                      id={s.id}
                      title={s.client}
                      subtitle={s.destination}
                      icon={MapPin}
                      status={{
                        label: s.status,
                        variant: statusVariant(s.status),
                      }}
                      metrics={[{ label: "ETA", value: s.eta }]}
                    />
                  ))
                )}
              </div>
            </LabPanel>
          </div>

          {/* QC Release Queue */}
          <div className="col-span-12 lg:col-span-5">
            <LabPanel title="QC Release Queue" icon={CheckCircle2}>
              <div className="flex flex-col gap-4 p-4">
                {data.qcQueue.length === 0 ? (
                  <EmptyState
                    icon={CheckCircle2}
                    title="Queue Empty"
                    subtitle="No batches awaiting QC release"
                  />
                ) : (
                  data.qcQueue.map((item, i) => {
                    const released = item.status === "Released";
                    return (
                      <div
                        key={i}
                        className="border-brand-sage/20 hover:border-brand-primary/30 group rounded-2xl border bg-(--color-zenthar-carbon) p-5 transition-all hover:shadow-sm"
                      >
                        <div className="mb-3 flex items-center justify-between">
                          <h4 className="text-sm font-black tracking-tight text-white uppercase">
                            {item.batch}
                          </h4>
                          <span
                            className={clsx(
                              "rounded-md border px-2.5 py-1 text-[9px] font-black uppercase",
                              released
                                ? "border-emerald-500/20 bg-emerald-900/30 text-emerald-400"
                                : "border-amber-500/20 bg-amber-900/30 text-amber-400",
                            )}
                          >
                            {item.status}
                          </span>
                        </div>
                        <div className="mb-2 h-1.5 w-full overflow-hidden rounded-full bg-(--color-zenthar-void)">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${item.progress}%` }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className={clsx(
                              "h-full rounded-full",
                              released ? "bg-emerald-500" : "bg-amber-500",
                            )}
                          />
                        </div>
                        <p className="text-brand-sage text-right font-mono text-[9px] font-bold tracking-widest uppercase">
                          {released
                            ? "Ready for Dispatch"
                            : `${item.testsCompleted}/${item.totalTests} Tests`}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>
            </LabPanel>
          </div>
        </div>
      </div>
    </div>
  );
});

const EmptyState: React.FC<{
  icon: React.ElementType;
  title: string;
  subtitle: string;
}> = ({ icon: Icon, title, subtitle }) => (
  <div className="text-brand-sage group relative flex flex-col items-center justify-center gap-4 overflow-hidden py-12">
    <div className="border-brand-sage/20 relative z-10 rounded-full border bg-(--color-zenthar-void) p-6">
      <Icon className="text-brand-primary h-10 w-10 opacity-30" />
    </div>
    <p className="text-sm font-black tracking-widest text-white uppercase">{title}</p>
    <p className="text-brand-sage/60 font-mono text-[9px]">{subtitle}</p>
  </div>
);

DispatchFeature.displayName = "DispatchFeature";
export default DispatchFeature;
