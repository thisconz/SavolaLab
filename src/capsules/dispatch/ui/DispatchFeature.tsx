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
        <div className="grid grid-cols-4 gap-8 shrink-0">
          <div className="bg-(--color-zenthar-carbon) p-8 rounded-3xl border border-brand-sage/10 shadow-sm flex flex-col gap-3 relative overflow-hidden group">
            <div className="absolute right-0 top-0 w-32 h-32 bg-linear-to-br from-brand-primary/10 to-transparent rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none transition-transform duration-700 group-hover:scale-150" />
            <div className="flex items-center justify-between relative z-10">
              <p className="text-[10px] font-black text-brand-sage uppercase tracking-[0.2em]">
                Pending Shipments
              </p>
              <div className="p-2 bg-brand-primary/10 rounded-xl border border-brand-primary/20 shadow-inner">
                <Package className="w-5 h-5 text-brand-primary" />
              </div>
            </div>
            <p className="text-4xl font-black text-white tracking-tighter relative z-10">
              {dispatchData.metrics.pending}
            </p>
            <div className="flex items-center gap-2 text-xs font-bold text-brand-sage relative z-10">
              <span className="bg-(--color-zenthar-void) px-2 py-0.5 rounded-md text-[10px] uppercase tracking-wider">
                Awaiting QC Release
              </span>
            </div>
          </div>
          <div className="bg-(--color-zenthar-carbon) p-8 rounded-3xl border border-brand-sage/10 shadow-sm flex flex-col gap-3 relative overflow-hidden group">
            <div className="absolute right-0 top-0 w-32 h-32 bg-linear-to-br from-emerald-500/10 to-transparent rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none transition-transform duration-700 group-hover:scale-150" />
            <div className="flex items-center justify-between relative z-10">
              <p className="text-[10px] font-black text-brand-sage uppercase tracking-[0.2em]">
                In Transit
              </p>
              <div className="p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20 shadow-inner">
                <Truck className="w-5 h-5 text-emerald-500" />
              </div>
            </div>
            <p className="text-4xl font-black text-white tracking-tighter relative z-10">
              {dispatchData.metrics.inTransit}
            </p>
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-500 relative z-10">
              <span className="bg-emerald-500/10 px-2 py-0.5 rounded-md text-[10px] uppercase tracking-wider">
                On Schedule
              </span>
            </div>
          </div>
          <div className="bg-(--color-zenthar-carbon) p-8 rounded-3xl border border-brand-sage/10 shadow-sm flex flex-col gap-3 relative overflow-hidden group">
            <div className="absolute right-0 top-0 w-32 h-32 bg-linear-to-br from-amber-500/10 to-transparent rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none transition-transform duration-700 group-hover:scale-150" />
            <div className="flex items-center justify-between relative z-10">
              <p className="text-[10px] font-black text-brand-sage uppercase tracking-[0.2em]">
                Delayed
              </p>
              <div className="p-2 bg-amber-500/10 rounded-xl border border-amber-500/20 shadow-inner">
                <Clock className="w-5 h-5 text-amber-500" />
              </div>
            </div>
            <p className="text-4xl font-black text-white tracking-tighter relative z-10">
              {dispatchData.metrics.delayed}
            </p>
            <div className="flex items-center gap-2 text-xs font-bold text-amber-500 relative z-10">
              <span className="bg-amber-500/10 px-2 py-0.5 rounded-md text-[10px] uppercase tracking-wider">
                Traffic / Weather
              </span>
            </div>
          </div>
          <div className="bg-(--color-zenthar-carbon) p-8 rounded-3xl border border-brand-sage/10 shadow-sm flex flex-col gap-3 relative overflow-hidden group">
            <div className="absolute right-0 top-0 w-32 h-32 bg-linear-to-br from-emerald-500/10 to-transparent rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none transition-transform duration-700 group-hover:scale-150" />
            <div className="flex items-center justify-between relative z-10">
              <p className="text-[10px] font-black text-brand-sage uppercase tracking-[0.2em]">
                Critical Issues
              </p>
              <div className="p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20 shadow-inner">
                <AlertCircle className="w-5 h-5 text-emerald-500" />
              </div>
            </div>
            <p className="text-4xl font-black text-white tracking-tighter relative z-10">
              {dispatchData.metrics.critical}
            </p>
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-500 relative z-10">
              <span className="bg-emerald-500/10 px-2 py-0.5 rounded-md text-[10px] uppercase tracking-wider">
                All clear
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-8 shrink-0">
          <div className="col-span-8">
            <LabPanel title="Active Shipments" icon={Truck}>
              <div className="flex flex-col gap-4 p-4">
                {dispatchData.activeShipments.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-brand-sage gap-6 bg-(--color-zenthar-carbon)/50 rounded-3xl border border-brand-sage/10 relative overflow-hidden group py-12">
                    <div className="absolute inset-0 bg-brand-primary/5 rounded-full blur-3xl scale-150 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                    <div className="p-6 bg-(--color-zenthar-void) rounded-full border border-brand-sage/20 relative z-10">
                      <Truck className="w-16 h-16 opacity-40 text-brand-primary group-hover:opacity-80 transition-opacity duration-300" />
                    </div>
                    <div className="text-center relative z-10">
                      <p className="text-sm font-black text-white uppercase tracking-[0.2em]">
                        No Active Shipments
                      </p>
                      <p className="text-xs text-brand-sage mt-2 font-medium">
                        There are currently no shipments in transit or pending.
                      </p>
                    </div>
                  </div>
                ) : (
                  dispatchData.activeShipments.map(
                    (shipment: any, i: number) => {
                      const isTransit = shipment.status === "In Transit";
                      const isLoading = shipment.status === "Loading";
                      const isDelayed = shipment.status === "Delayed";
                      const isDelivered = shipment.status === "Delivered";

                      const icon = isTransit ? (
                        <Truck className="w-5 h-5 text-emerald-500" />
                      ) : isLoading ? (
                        <Package className="w-5 h-5 text-brand-primary" />
                      ) : isDelayed ? (
                        <Clock className="w-5 h-5 text-amber-500" />
                      ) : (
                        <CheckCircle2 className="w-5 h-5 text-brand-sage" />
                      );

                      const bg = isTransit
                        ? "bg-emerald-500/5"
                        : isLoading
                          ? "bg-brand-primary/5"
                          : isDelayed
                            ? "bg-amber-500/5"
                            : "bg-(--color-zenthar-void)";
                      const border = isTransit
                        ? "border-emerald-500/20"
                        : isLoading
                          ? "border-brand-primary/20"
                          : isDelayed
                            ? "border-amber-500/20"
                            : "border-brand-sage/20";

                      return (
                        <div
                          key={i}
                          className={`flex items-center justify-between p-5 rounded-2xl border ${bg} ${border} hover:shadow-md transition-all duration-300 group`}
                        >
                          <div className="flex items-center gap-5">
                            <div className="p-2.5 bg-(--color-zenthar-carbon) rounded-xl shadow-sm group-hover:scale-110 transition-transform duration-300 border border-brand-sage/10">
                              {icon}
                            </div>
                            <div>
                              <h4 className="text-sm font-black text-white uppercase tracking-wider">
                                {shipment.id} - {shipment.client}
                              </h4>
                              <div className="flex items-center gap-2 mt-1">
                                <MapPin className="w-3 h-3 text-brand-sage" />
                                <p className="text-[10px] text-brand-sage font-mono font-bold uppercase tracking-[0.2em]">
                                  {shipment.destination}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-12 pr-4">
                            <div className="text-right">
                              <p className="text-lg font-black text-white tracking-tight">
                                {shipment.status}
                              </p>
                              <p className="text-[9px] text-brand-sage font-bold uppercase tracking-[0.2em]">
                                Status
                              </p>
                            </div>
                            <div className="w-px h-8 bg-brand-sage/20" />
                            <div className="text-right">
                              <p className="text-lg font-black text-white tracking-tight">
                                {shipment.eta}
                              </p>
                              <p className="text-[9px] text-brand-sage font-bold uppercase tracking-[0.2em]">
                                ETA
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    },
                  )
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
