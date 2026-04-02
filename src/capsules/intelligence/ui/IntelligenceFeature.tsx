import React, { memo, useEffect, useState } from "react";
import { Factory, Activity, AlertTriangle, CheckCircle2, Zap, Clock } from "lucide-react";
import { LabPanel } from "../../../ui/components/LabPanel";
import { api } from "../../../core/http/client";

/**
 * IntelligenceFeature Component
 * 
 * Acts as the central nervous system for plant operations, providing real-time
 * insights into equipment status, predictive maintenance alerts, and overall
 * operational efficiency (OEE).
 * 
 * Features:
 * - Live monitoring of production line statuses (Running, Warning, Stopped).
 * - Predictive maintenance alerts to prevent unplanned downtime.
 * - Key performance indicators (KPIs) like OEE, Energy Efficiency, and Yield.
 */
export const IntelligenceFeature: React.FC = memo(() => {
  const [intelData, setIntelData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchIntel = async () => {
      try {
        const res = await api.get<any>("/operational/plant-intel");
        setIntelData(res.data);
      } catch (err) {
        console.error("Failed to fetch plant intel", err);
      } finally {
        setLoading(false);
      }
    };
    fetchIntel();
  }, []);

  if (loading || !intelData) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-brand-mist/20 p-2 rounded-3xl">
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-8 pb-8">
        {/* Top Metrics */}
        <div className="grid grid-cols-4 gap-8 shrink-0">
          <div className="bg-white p-8 rounded-3xl border border-brand-sage/10 shadow-sm flex flex-col gap-3 relative overflow-hidden group">
            <div className="absolute right-0 top-0 w-32 h-32 bg-linear-to-br from-emerald-500/10 to-transparent rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none transition-transform duration-700 group-hover:scale-150" />
            <div className="flex items-center justify-between relative z-10">
              <p className="text-[10px] font-black text-brand-sage uppercase tracking-[0.2em]">Overall Equipment Effectiveness</p>
              <div className="p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20 shadow-inner">
                <Activity className="w-5 h-5 text-emerald-500" />
              </div>
            </div>
            <p className="text-4xl font-black text-brand-deep tracking-tighter relative z-10">{intelData.metrics.oee}</p>
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-500 relative z-10">
              <span className="bg-emerald-500/10 px-2 py-0.5 rounded-md">+2.1%</span>
              <span className="text-brand-sage font-medium uppercase tracking-wider text-[10px]">vs last week</span>
            </div>
          </div>
          <div className="bg-white p-8 rounded-3xl border border-brand-sage/10 shadow-sm flex flex-col gap-3 relative overflow-hidden group">
            <div className="absolute right-0 top-0 w-32 h-32 bg-linear-to-br from-brand-primary/10 to-transparent rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none transition-transform duration-700 group-hover:scale-150" />
            <div className="flex items-center justify-between relative z-10">
              <p className="text-[10px] font-black text-brand-sage uppercase tracking-[0.2em]">Plant Yield</p>
              <div className="p-2 bg-brand-primary/10 rounded-xl border border-brand-primary/20 shadow-inner">
                <Factory className="w-5 h-5 text-brand-primary" />
              </div>
            </div>
            <p className="text-4xl font-black text-brand-deep tracking-tighter relative z-10">{intelData.metrics.yield}</p>
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-500 relative z-10">
              <span className="bg-emerald-500/10 px-2 py-0.5 rounded-md">+0.5%</span>
              <span className="text-brand-sage font-medium uppercase tracking-wider text-[10px]">vs target</span>
            </div>
          </div>
          <div className="bg-white p-8 rounded-3xl border border-brand-sage/10 shadow-sm flex flex-col gap-3 relative overflow-hidden group">
            <div className="absolute right-0 top-0 w-32 h-32 bg-linear-to-br from-amber-500/10 to-transparent rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none transition-transform duration-700 group-hover:scale-150" />
            <div className="flex items-center justify-between relative z-10">
              <p className="text-[10px] font-black text-brand-sage uppercase tracking-[0.2em]">Energy Consumption</p>
              <div className="p-2 bg-amber-500/10 rounded-xl border border-amber-500/20 shadow-inner">
                <Zap className="w-5 h-5 text-amber-500" />
              </div>
            </div>
            <p className="text-4xl font-black text-brand-deep tracking-tighter relative z-10">{intelData.metrics.energy} <span className="text-lg font-medium text-brand-sage tracking-normal">kWh/t</span></p>
            <div className="flex items-center gap-2 text-xs font-bold text-amber-500 relative z-10">
              <span className="bg-amber-500/10 px-2 py-0.5 rounded-md">+1.2%</span>
              <span className="text-brand-sage font-medium uppercase tracking-wider text-[10px]">vs target</span>
            </div>
          </div>
          <div className="bg-white p-8 rounded-3xl border border-brand-sage/10 shadow-sm flex flex-col gap-3 relative overflow-hidden group">
            <div className="absolute right-0 top-0 w-32 h-32 bg-linear-to-br from-rose-500/10 to-transparent rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none transition-transform duration-700 group-hover:scale-150" />
            <div className="flex items-center justify-between relative z-10">
              <p className="text-[10px] font-black text-brand-sage uppercase tracking-[0.2em]">Active Alarms</p>
              <div className="p-2 bg-rose-500/10 rounded-xl border border-rose-500/20 shadow-inner">
                <AlertTriangle className="w-5 h-5 text-rose-500" />
              </div>
            </div>
            <p className="text-4xl font-black text-brand-deep tracking-tighter relative z-10">{intelData.metrics.activeAlarms}</p>
            <div className="flex items-center gap-2 text-xs font-bold text-rose-500 relative z-10">
              <span className="bg-rose-500/10 px-2 py-0.5 rounded-md">Critical</span>
              <span className="text-brand-sage font-medium uppercase tracking-wider text-[10px]">attention required</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-8 shrink-0">
          <div className="col-span-8">
            <LabPanel title="Line Status" icon={Factory}>
              <div className="flex flex-col gap-4 p-4">
                {intelData.lines.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="p-4 bg-brand-mist rounded-full mb-4">
                      <Factory className="w-8 h-8 text-brand-sage/50" />
                    </div>
                    <p className="text-sm font-bold text-brand-deep">No Production Lines</p>
                    <p className="text-xs text-brand-sage mt-1">No production lines are currently configured.</p>
                  </div>
                ) : (
                  intelData.lines.map((line: any, i: number) => {
                    const isRunning = line.status === 'Running';
                    const isWarning = line.status === 'Warning';
                    const isStopped = line.status === 'Stopped';
                    
                    const icon = isRunning ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : 
                                 isWarning ? <AlertTriangle className="w-5 h-5 text-amber-500" /> : 
                                 <AlertTriangle className="w-5 h-5 text-rose-500" />;
                    
                    const bg = isRunning ? "bg-emerald-500/5" : isWarning ? "bg-amber-500/5" : "bg-rose-500/5";
                    const border = isRunning ? "border-emerald-500/20" : isWarning ? "border-amber-500/20" : "border-rose-500/20";
                    const dotColor = isRunning ? "bg-emerald-500" : isWarning ? "bg-amber-500" : "bg-rose-500";

                    return (
                    <div key={i} className={`flex items-center justify-between p-5 rounded-2xl border ${bg} ${border} hover:shadow-md transition-all duration-300 group`}>
                      <div className="flex items-center gap-5">
                        <div className="p-2.5 bg-white rounded-xl shadow-sm group-hover:scale-110 transition-transform duration-300">
                          {icon}
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-brand-deep uppercase tracking-wider">{line.name}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <div className={`w-1.5 h-1.5 rounded-full ${dotColor} animate-pulse`} />
                            <p className="text-[10px] text-brand-sage font-mono font-bold uppercase tracking-[0.2em]">Status: {line.status}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-12 pr-4">
                        <div className="text-right">
                          <p className="text-lg font-black text-brand-deep tracking-tight">{line.uptime}</p>
                          <p className="text-[9px] text-brand-sage font-bold uppercase tracking-[0.2em]">Uptime</p>
                        </div>
                        <div className="w-px h-8 bg-brand-sage/20" />
                        <div className="text-right">
                          <p className="text-lg font-black text-brand-deep tracking-tight">{line.oee}</p>
                          <p className="text-[9px] text-brand-sage font-bold uppercase tracking-[0.2em]">OEE</p>
                        </div>
                      </div>
                    </div>
                  )})
                )}
              </div>
            </LabPanel>
          </div>
          <div className="col-span-4">
            <LabPanel title="Predictive Maintenance" icon={Activity}>
              <div className="flex flex-col gap-4 p-4">
                <div className="p-5 bg-amber-500/10 border border-amber-500/30 rounded-2xl relative overflow-hidden group">
                  <div className="absolute right-0 top-0 w-24 h-24 bg-linear-to-br from-amber-500/20 to-transparent rounded-full blur-xl -mr-12 -mt-12 pointer-events-none transition-transform duration-700 group-hover:scale-150" />
                  <div className="flex items-center gap-3 mb-3 relative z-10">
                    <div className="p-2 bg-amber-500/20 rounded-lg">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                    </div>
                    <h4 className="text-[10px] font-black text-amber-700 uppercase tracking-[0.2em]">Warning</h4>
                  </div>
                  <p className="text-sm text-brand-deep font-black mb-2 relative z-10">Centrifuge C-101 Vibration</p>
                  <p className="text-xs text-brand-sage font-medium leading-relaxed relative z-10">Vibration levels increasing. Predicted failure in 48 hours if unaddressed.</p>
                </div>
              <div className="p-5 bg-brand-mist border border-brand-sage/20 rounded-2xl relative overflow-hidden group hover:shadow-md transition-all duration-300">
                <div className="absolute right-0 top-0 w-24 h-24 bg-linear-to-br from-brand-primary/10 to-transparent rounded-full blur-xl -mr-12 -mt-12 pointer-events-none transition-transform duration-700 group-hover:scale-150" />
                <div className="flex items-center gap-3 mb-3 relative z-10">
                  <div className="p-2 bg-white rounded-lg shadow-sm">
                    <Clock className="w-4 h-4 text-brand-primary" />
                  </div>
                  <h4 className="text-[10px] font-black text-brand-primary uppercase tracking-[0.2em]">Scheduled</h4>
                </div>
                <p className="text-sm text-brand-deep font-black mb-2 relative z-10">Evaporator E-202 Cleaning</p>
                <p className="text-xs text-brand-sage font-medium leading-relaxed relative z-10">Routine CIP scheduled for next shift (15:00).</p>
              </div>
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
