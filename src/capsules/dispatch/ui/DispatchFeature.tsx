import React, { memo } from "react";
import { Truck, MapPin, Clock, Package, CheckCircle2, AlertCircle } from "lucide-react";
import { LabPanel } from "../../../ui/components/LabPanel";

export const DispatchFeature: React.FC = memo(() => {
  return (
    <div className="flex flex-col h-full overflow-hidden bg-brand-mist/20 p-2 rounded-3xl">
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-8 pb-8">
        <div className="grid grid-cols-4 gap-8 shrink-0">
          <div className="bg-white p-8 rounded-3xl border border-brand-sage/10 shadow-sm flex flex-col gap-3 relative overflow-hidden group">
            <div className="absolute right-0 top-0 w-32 h-32 bg-gradient-to-br from-brand-primary/10 to-transparent rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none transition-transform duration-700 group-hover:scale-150" />
            <div className="flex items-center justify-between relative z-10">
              <p className="text-[10px] font-black text-brand-sage uppercase tracking-[0.2em]">Pending Shipments</p>
              <div className="p-2 bg-brand-primary/10 rounded-xl border border-brand-primary/20 shadow-inner">
                <Package className="w-5 h-5 text-brand-primary" />
              </div>
            </div>
            <p className="text-4xl font-black text-brand-deep tracking-tighter relative z-10">12</p>
            <div className="flex items-center gap-2 text-xs font-bold text-brand-sage relative z-10">
              <span className="bg-brand-mist px-2 py-0.5 rounded-md text-[10px] uppercase tracking-wider">Awaiting QC Release</span>
            </div>
          </div>
          <div className="bg-white p-8 rounded-3xl border border-brand-sage/10 shadow-sm flex flex-col gap-3 relative overflow-hidden group">
            <div className="absolute right-0 top-0 w-32 h-32 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none transition-transform duration-700 group-hover:scale-150" />
            <div className="flex items-center justify-between relative z-10">
              <p className="text-[10px] font-black text-brand-sage uppercase tracking-[0.2em]">In Transit</p>
              <div className="p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20 shadow-inner">
                <Truck className="w-5 h-5 text-emerald-500" />
              </div>
            </div>
            <p className="text-4xl font-black text-brand-deep tracking-tighter relative z-10">8</p>
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-500 relative z-10">
              <span className="bg-emerald-500/10 px-2 py-0.5 rounded-md text-[10px] uppercase tracking-wider">On Schedule</span>
            </div>
          </div>
          <div className="bg-white p-8 rounded-3xl border border-brand-sage/10 shadow-sm flex flex-col gap-3 relative overflow-hidden group">
            <div className="absolute right-0 top-0 w-32 h-32 bg-gradient-to-br from-amber-500/10 to-transparent rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none transition-transform duration-700 group-hover:scale-150" />
            <div className="flex items-center justify-between relative z-10">
              <p className="text-[10px] font-black text-brand-sage uppercase tracking-[0.2em]">Delayed</p>
              <div className="p-2 bg-amber-500/10 rounded-xl border border-amber-500/20 shadow-inner">
                <Clock className="w-5 h-5 text-amber-500" />
              </div>
            </div>
            <p className="text-4xl font-black text-brand-deep tracking-tighter relative z-10">2</p>
            <div className="flex items-center gap-2 text-xs font-bold text-amber-500 relative z-10">
              <span className="bg-amber-500/10 px-2 py-0.5 rounded-md text-[10px] uppercase tracking-wider">Traffic / Weather</span>
            </div>
          </div>
          <div className="bg-white p-8 rounded-3xl border border-brand-sage/10 shadow-sm flex flex-col gap-3 relative overflow-hidden group">
            <div className="absolute right-0 top-0 w-32 h-32 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none transition-transform duration-700 group-hover:scale-150" />
            <div className="flex items-center justify-between relative z-10">
              <p className="text-[10px] font-black text-brand-sage uppercase tracking-[0.2em]">Critical Issues</p>
              <div className="p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20 shadow-inner">
                <AlertCircle className="w-5 h-5 text-emerald-500" />
              </div>
            </div>
            <p className="text-4xl font-black text-brand-deep tracking-tighter relative z-10">0</p>
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-500 relative z-10">
              <span className="bg-emerald-500/10 px-2 py-0.5 rounded-md text-[10px] uppercase tracking-wider">All clear</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-8 shrink-0">
          <div className="col-span-8">
            <LabPanel title="Active Shipments" icon={Truck}>
              <div className="flex flex-col gap-4 p-4">
                {[
                  { id: "SHP-2026-001", client: "Alpha Foods", destination: "Riyadh", status: "In Transit", eta: "14:30", icon: <Truck className="w-5 h-5 text-emerald-500" />, bg: "bg-emerald-500/5", border: "border-emerald-500/20" },
                  { id: "SHP-2026-002", client: "Beta Beverages", destination: "Jeddah", status: "Loading", eta: "18:00", icon: <Package className="w-5 h-5 text-brand-primary" />, bg: "bg-brand-primary/5", border: "border-brand-primary/20" },
                  { id: "SHP-2026-003", client: "Gamma Sweets", destination: "Dammam", status: "Delayed", eta: "Tomorrow 09:00", icon: <Clock className="w-5 h-5 text-amber-500" />, bg: "bg-amber-500/5", border: "border-amber-500/20" },
                  { id: "SHP-2026-004", client: "Delta Bakeries", destination: "Mecca", status: "Delivered", eta: "10:15", icon: <CheckCircle2 className="w-5 h-5 text-brand-sage" />, bg: "bg-brand-mist", border: "border-brand-sage/20" },
                ].map((shipment, i) => (
                  <div key={i} className={`flex items-center justify-between p-5 rounded-2xl border ${shipment.bg} ${shipment.border} hover:shadow-md transition-all duration-300 group`}>
                    <div className="flex items-center gap-5">
                      <div className="p-2.5 bg-white rounded-xl shadow-sm group-hover:scale-110 transition-transform duration-300">
                        {shipment.icon}
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-brand-deep uppercase tracking-wider">{shipment.id} - {shipment.client}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <MapPin className="w-3 h-3 text-brand-sage" />
                          <p className="text-[10px] text-brand-sage font-mono font-bold uppercase tracking-[0.2em]">{shipment.destination}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-12 pr-4">
                      <div className="text-right">
                        <p className="text-lg font-black text-brand-deep tracking-tight">{shipment.status}</p>
                        <p className="text-[9px] text-brand-sage font-bold uppercase tracking-[0.2em]">Status</p>
                      </div>
                      <div className="w-px h-8 bg-brand-sage/20" />
                      <div className="text-right">
                        <p className="text-lg font-black text-brand-deep tracking-tight">{shipment.eta}</p>
                        <p className="text-[9px] text-brand-sage font-bold uppercase tracking-[0.2em]">ETA</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </LabPanel>
          </div>
          <div className="col-span-4">
            <LabPanel title="QC Release Queue" icon={CheckCircle2}>
              <div className="flex flex-col gap-4 p-4">
                <div className="p-5 bg-white border border-brand-sage/20 rounded-2xl hover:border-brand-primary/30 hover:shadow-md transition-all duration-300 cursor-pointer group">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-black text-brand-deep uppercase tracking-wider">Batch #8821</h4>
                    <span className="px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-[0.2em] text-amber-600 bg-amber-500/10 border border-amber-500/20">Pending</span>
                  </div>
                  <p className="text-xs text-brand-sage font-medium mb-4">Client: Omega Snacks</p>
                  <div className="w-full bg-brand-mist rounded-full h-2 overflow-hidden">
                    <div className="bg-amber-500 h-2 rounded-full transition-all duration-1000 ease-out" style={{ width: "80%" }}></div>
                  </div>
                  <p className="text-[9px] text-brand-sage font-mono font-bold uppercase tracking-[0.2em] mt-3 text-right">4/5 Tests Completed</p>
                </div>
              <div className="p-5 bg-white border border-brand-sage/20 rounded-2xl hover:border-brand-primary/30 hover:shadow-md transition-all duration-300 cursor-pointer group">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-black text-brand-deep uppercase tracking-wider">Batch #8822</h4>
                  <span className="px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-[0.2em] text-emerald-600 bg-emerald-500/10 border border-emerald-500/20">Released</span>
                </div>
                <p className="text-xs text-brand-sage font-medium mb-4">Client: Sigma Foods</p>
                <div className="w-full bg-brand-mist rounded-full h-2 overflow-hidden">
                  <div className="bg-emerald-500 h-2 rounded-full transition-all duration-1000 ease-out" style={{ width: "100%" }}></div>
                </div>
                <p className="text-[9px] text-brand-sage font-mono font-bold uppercase tracking-[0.2em] mt-3 text-right">Ready for Dispatch</p>
              </div>
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
