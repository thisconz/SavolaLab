import React, { memo, useEffect, useState, useCallback, useRef } from "react";
import {
  Truck, Package, Clock, AlertCircle, CheckCircle2,
  RefreshCw, MapPin, Wifi,
} from "lucide-react";
import { LabPanel }     from "../../../shared/components/LabPanel";
import { MetricCard }   from "../../../shared/components/MetricCard";
import { DataListRow }  from "../../../shared/components/DataListRow";
import { api }          from "../../../core/http/client";
import { useRealtime }  from "../../../core/providers/RealtimeProvider";
import { motion, AnimatePresence } from "@/src/lib/motion";
import clsx             from "@/src/lib/clsx";

interface DispatchData {
  metrics:         { pending: number; inTransit: number; delayed: number; critical: number };
  activeShipments: { id: string; client: string; destination: string; status: string; eta: string }[];
  qcQueue:         { batch: string; client: string; status: string; progress: number; testsCompleted: number; totalTests: number }[];
}

export const DispatchFeature: React.FC = memo(() => {
  const [data,         setData]        = useState<DispatchData | null>(null);
  const [loading,      setLoading]     = useState(true);
  const [isRefreshing, setIsRefreshing]= useState(false);

  const debounceTimer = useRef<ReturnType<typeof setTimeout>>();
  const { on }        = useRealtime();

  const fetchDispatch = useCallback(async (silent = false) => {
    if (!silent) setLoading(true); else setIsRefreshing(true);
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

  useEffect(() => { fetchDispatch(); }, [fetchDispatch]);

  // Refresh QC queue when samples/tests update via SSE
  useEffect(() => {
    const refresh = () => { clearTimeout(debounceTimer.current); debounceTimer.current = setTimeout(() => fetchDispatch(true), 800); };
    const unsubs  = [on("SAMPLE_STATUS_CHANGED", refresh), on("TEST_REVIEWED", refresh)];
    return () => { unsubs.forEach((u) => u()); clearTimeout(debounceTimer.current); };
  }, [on, fetchDispatch]);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-primary" />
      </div>
    );
  }

  const statusVariant = (s: string): "success" | "warning" | "error" | "info" => (
    { "In Transit": "success", "Delayed": "warning", "Critical": "error" }[s] ?? "info"
  ) as any;

  return (
    <div className="flex flex-col h-full overflow-hidden bg-(--color-zenthar-graphite)/30 p-2 rounded-3xl">
      {/* Header */}
      <div className="flex items-center justify-between px-4 mb-4 shrink-0">
        <div>
          <h2 className="text-xl font-display font-bold text-(--color-zenthar-text-primary) flex items-center gap-2">
            <Truck className="w-5 h-5 text-brand-primary" /> Dispatch
          </h2>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-[10px] font-mono text-brand-sage uppercase tracking-widest">Logistics & QC Release</p>
            {isRefreshing && <span className="flex items-center gap-1 text-[9px] font-bold text-brand-primary"><RefreshCw size={9} className="animate-spin" /> Syncing</span>}
          </div>
        </div>
        <button onClick={() => fetchDispatch(true)} className="p-2 rounded-xl border border-brand-sage/20 bg-(--color-zenthar-graphite) hover:bg-(--color-zenthar-graphite)/80 transition-colors group">
          <RefreshCw className={clsx("w-4 h-4 text-brand-sage group-hover:text-brand-primary", isRefreshing && "animate-spin")} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-6 pb-6">
        {/* Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
          <MetricCard label="Pending"     value={data.metrics.pending}   trend="Awaiting QC"   icon={Package}      variant="primary"   />
          <MetricCard label="In Transit"  value={data.metrics.inTransit} trend="On Schedule"   icon={Truck}        variant="success"   />
          <MetricCard label="Delayed"     value={data.metrics.delayed}   trend="Under review"  icon={Clock}        variant="warning"   />
          <MetricCard label="Critical"    value={data.metrics.critical}  trend="Needs action"  icon={AlertCircle}  variant="error"     />
        </div>

        <div className="grid grid-cols-12 gap-6 shrink-0">
          {/* Active shipments */}
          <div className="col-span-12 lg:col-span-7">
            <LabPanel title="Active Shipments" icon={Truck}>
              <div className="flex flex-col gap-3 p-4">
                {data.activeShipments.length === 0 ? (
                  <EmptyState icon={Truck} title="No Active Shipments" subtitle="Logistics_Pipeline_Standby" />
                ) : (
                  data.activeShipments.map((s, i) => (
                    <DataListRow key={i} id={s.id} title={s.client} subtitle={s.destination}
                      icon={MapPin}
                      status={{ label: s.status, variant: statusVariant(s.status) }}
                      metrics={[{ label: "ETA", value: s.eta }]} />
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
                  <EmptyState icon={CheckCircle2} title="Queue Empty" subtitle="No batches awaiting QC release" />
                ) : (
                  data.qcQueue.map((item, i) => {
                    const released = item.status === "Released";
                    return (
                      <div key={i} className="p-5 bg-(--color-zenthar-carbon) border border-brand-sage/20 rounded-2xl hover:border-brand-primary/30 hover:shadow-sm transition-all group">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-sm font-black text-white uppercase tracking-tight">{item.batch}</h4>
                          <span className={clsx("px-2.5 py-1 rounded-md text-[9px] font-black uppercase border",
                            released ? "text-emerald-400 bg-emerald-900/30 border-emerald-500/20" : "text-amber-400 bg-amber-900/30 border-amber-500/20")}>
                            {item.status}
                          </span>
                        </div>
                        <div className="w-full bg-(--color-zenthar-void) rounded-full h-1.5 overflow-hidden mb-2">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${item.progress}%` }} transition={{ duration: 0.8, ease: "easeOut" }}
                            className={clsx("h-full rounded-full", released ? "bg-emerald-500" : "bg-amber-500")} />
                        </div>
                        <p className="text-[9px] text-brand-sage font-mono font-bold uppercase tracking-widest text-right">
                          {released ? "Ready for Dispatch" : `${item.testsCompleted}/${item.totalTests} Tests`}
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

const EmptyState: React.FC<{ icon: React.ElementType; title: string; subtitle: string }> = ({ icon: Icon, title, subtitle }) => (
  <div className="flex flex-col items-center justify-center py-12 text-brand-sage gap-4 relative overflow-hidden group">
    <div className="p-6 bg-(--color-zenthar-void) rounded-full border border-brand-sage/20 relative z-10">
      <Icon className="w-10 h-10 opacity-30 text-brand-primary" />
    </div>
    <p className="text-sm font-black text-white uppercase tracking-widest">{title}</p>
    <p className="text-[9px] font-mono text-brand-sage/60">{subtitle}</p>
  </div>
);

DispatchFeature.displayName = "DispatchFeature";
export default DispatchFeature;