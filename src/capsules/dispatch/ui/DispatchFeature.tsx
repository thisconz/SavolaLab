import React, { memo, useEffect, useState } from "react";
import {
  Truck,
  MapPin,
  Clock,
  Package,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { LabPanel } from "../../../ui/components/LabPanel";
import { api } from "../../../core/http/client";

/**
 * DispatchFeature Component
 *
 * Provides a real-time overview of the dispatch and logistics operations.
 * It integrates with the laboratory's QC release process to ensure only approved
 * batches are shipped.
 *
 * Features:
 * - High-level metrics for pending, in-transit, and delivered shipments.
 * - A detailed view of active shipments, including destination and ETA.
 * - A QC Release Queue that links production batches to their laboratory testing status,
 *   visually indicating whether a batch is ready for release or still pending analysis.
 */
import { MetricCard } from "../../../ui/components/MetricCard";
import { DataListRow } from "../../../ui/components/DataListRow";

export const DispatchFeature: React.FC = memo(() => {
  const [dispatchData, setDispatchData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDispatch = async () => {
      try {
        const res = await api.get<any>("/dispatch");
        setDispatchData(res.data);
      } catch (err) {
        console.error("Failed to fetch dispatch data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDispatch();
  }, []);

  if (loading || !dispatchData) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-(--color-zenthar-graphite)/30 p-2 rounded-3xl">
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-8 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 shrink-0">
          <MetricCard
            label="Pending Shipments"
            value={dispatchData.metrics.pending}
            trend="Awaiting QC"
            icon={Package}
            variant="primary"
          />
          <MetricCard
            label="In Transit"
            value={dispatchData.metrics.inTransit}
            trend="On Schedule"
            icon={Truck}
            variant="success"
          />
          <MetricCard
            label="Delayed"
            value={dispatchData.metrics.delayed}
            trend="Traffic/Weather"
            icon={Clock}
            variant="warning"
          />
          <MetricCard
            label="Critical Issues"
            value={dispatchData.metrics.critical}
            trend="All Clear"
            icon={AlertCircle}
            variant="error"
          />
        </div>

        <div className="grid grid-cols-12 gap-8 shrink-0">
          <div className="col-span-12 lg:col-span-8">
            <LabPanel title="Active Shipments" icon={Truck}>
              <div className="flex flex-col gap-4 p-4">
                {dispatchData.activeShipments.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-zenthar-text-secondary gap-6 bg-zenthar-carbon/50 rounded-3xl border border-white/5 relative overflow-hidden group py-12">
                    <div className="absolute inset-0 bg-brand-primary/5 rounded-full blur-3xl scale-150 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                    <div className="p-6 bg-zenthar-void rounded-full border border-white/10 relative z-10">
                      <Truck className="w-16 h-16 opacity-40 text-brand-primary group-hover:opacity-80 transition-opacity duration-300" />
                    </div>
                    <div className="text-center relative z-10">
                      <p className="text-sm font-black text-white uppercase tracking-[0.2em]">
                        No Active Shipments
                      </p>
                      <p className="text-xs text-zenthar-text-secondary mt-2 font-medium">
                        Logistics_Pipeline_Standby
                      </p>
                    </div>
                  </div>
                ) : (
                  dispatchData.activeShipments.map((shipment: any, i: number) => (
                    <DataListRow
                      key={i}
                      id={shipment.id}
                      title={shipment.client}
                      subtitle={shipment.destination}
                      icon={Truck}
                      status={{
                        label: shipment.status,
                        variant: shipment.status === "In Transit" ? "success" : shipment.status === "Delayed" ? "warning" : "info"
                      }}
                      metrics={[
                        { label: "Status", value: shipment.status },
                        { label: "ETA", value: shipment.eta }
                      ]}
                    />
                  ))
                )}
              </div>
            </LabPanel>
          </div>
          <div className="col-span-4">
            <LabPanel title="QC Release Queue" icon={CheckCircle2}>
              <div className="flex flex-col gap-4 p-4">
                {dispatchData.qcQueue.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-brand-sage gap-6 bg-(--color-zenthar-carbon)/50 rounded-3xl border border-brand-sage/10 relative overflow-hidden group py-12">
                    <div className="absolute inset-0 bg-brand-primary/5 rounded-full blur-3xl scale-150 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                    <div className="p-6 bg-(--color-zenthar-void) rounded-full border border-brand-sage/20 relative z-10">
                      <CheckCircle2 className="w-16 h-16 opacity-40 text-brand-primary group-hover:opacity-80 transition-opacity duration-300" />
                    </div>
                    <div className="text-center relative z-10">
                      <p className="text-sm font-black text-white uppercase tracking-[0.2em]">
                        Queue Empty
                      </p>
                      <p className="text-xs text-brand-sage mt-2 font-medium">
                        No batches awaiting QC release.
                      </p>
                    </div>
                  </div>
                ) : (
                  dispatchData.qcQueue.map((item: any, i: number) => {
                    const isReleased = item.status === "Released";
                    const colorClass = isReleased ? "emerald" : "amber";

                    return (
                      <div
                        key={i}
                        className="p-5 bg-(--color-zenthar-carbon) border border-brand-sage/20 rounded-2xl hover:border-brand-primary/30 hover:shadow-md transition-all duration-300 cursor-pointer group"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-sm font-black text-white uppercase tracking-wider">
                            {item.batch}
                          </h4>
                          <span
                            className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-[0.2em] border ${
                              isReleased
                                ? "text-emerald-400 bg-emerald-900/30 border-emerald-500/20"
                                : "text-amber-400 bg-amber-900/30 border-amber-500/20"
                            }`}
                          >
                            {item.status}
                          </span>
                        </div>
                        <p className="text-xs text-brand-sage font-medium mb-4">
                          Client: {item.client}
                        </p>
                        <div className="w-full bg-(--color-zenthar-void) rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-2 rounded-full transition-all duration-1000 ease-out ${isReleased ? "bg-emerald-500" : "bg-amber-500"}`}
                            style={{ width: `${item.progress}%` }}
                          ></div>
                        </div>
                        <p className="text-[9px] text-brand-sage font-mono font-bold uppercase tracking-[0.2em] mt-3 text-right">
                          {isReleased
                            ? "Ready for Dispatch"
                            : `${item.testsCompleted}/${item.totalTests} Tests Completed`}
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

DispatchFeature.displayName = "DispatchFeature";
export default DispatchFeature;
