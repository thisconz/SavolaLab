import React, { memo, useEffect, useState } from "react";
import { BarChart3, TrendingUp, Activity } from "lucide-react";
import { LabPanel } from "../../../ui/components/LabPanel";
import { api } from "../../../core/http/client";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const mockQualityData = [
  { time: "08:00", brix: 65.2, purity: 99.1, color: 45 },
  { time: "10:00", brix: 65.5, purity: 99.2, color: 42 },
  { time: "12:00", brix: 64.8, purity: 98.9, color: 48 },
  { time: "14:00", brix: 65.1, purity: 99.3, color: 40 },
  { time: "16:00", brix: 65.4, purity: 99.4, color: 38 },
  { time: "18:00", brix: 65.3, purity: 99.2, color: 41 },
];

const mockVolumeData = [
  { day: "Mon", volume: 1200, target: 1000 },
  { day: "Tue", volume: 1350, target: 1000 },
  { day: "Wed", volume: 1100, target: 1000 },
  { day: "Thu", volume: 1400, target: 1000 },
  { day: "Fri", volume: 1250, target: 1000 },
  { day: "Sat", volume: 900, target: 1000 },
  { day: "Sun", volume: 850, target: 1000 },
];

/**
 * AnalyticsFeature Component
 * 
 * Provides high-level dashboards and visualizations for laboratory and production data.
 * This module is crucial for plant managers and quality assurance teams to monitor
 * trends, process capabilities, and overall production volumes.
 * 
 * Features:
 * - Statistical Process Control (SPC) charts for key quality indicators (Brix, Purity, Color).
 * - Production volume tracking against targets.
 * - Process Capability (Cpk) indices to measure how well the process is performing within specification limits.
 */
export const AnalyticsFeature: React.FC = memo(() => {
  const [qualityData, setQualityData] = useState<any[]>([]);
  const [volumeData, setVolumeData] = useState<any[]>([]);
  const [capability, setCapability] = useState<any>({ brixCpk: 0, purityCpk: 0, colorCpk: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const [qRes, vRes, cRes] = await Promise.all([
          api.get<any>("/analytics/quality"),
          api.get<any>("/analytics/volume"),
          api.get<any>("/analytics/capability")
        ]);
        setQualityData(qRes.data);
        setVolumeData(vRes.data);
        setCapability(cRes.data);
      } catch (err) {
        console.error("Failed to fetch analytics", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-brand-mist/20 p-2 rounded-3xl">
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-8 pb-8">
        <div className="grid grid-cols-12 gap-8 shrink-0">
          <div className="col-span-12">
            <LabPanel title="SPC Quality Monitoring" icon={TrendingUp}>
              <div className="h-96 w-full p-4">
                {qualityData.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <div className="p-4 bg-brand-mist rounded-full mb-4">
                      <TrendingUp className="w-8 h-8 text-brand-sage/50" />
                    </div>
                    <p className="text-sm font-bold text-brand-deep">No Quality Data</p>
                    <p className="text-xs text-brand-sage mt-1">No completed tests found in the last 24 hours.</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={qualityData} margin={{ top: 20, right: 30, left: 10, bottom: 10 }}>
                      <defs>
                        <linearGradient id="colorBrix" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorPurity" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                      <XAxis dataKey="time" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} dy={10} />
                      <YAxis yAxisId="left" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} domain={['dataMin - 1', 'dataMax + 1']} dx={-10} />
                      <YAxis yAxisId="right" orientation="right" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} dx={10} />
                      <Tooltip
                        contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '16px', border: '1px solid rgba(226, 232, 240, 0.8)', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)', backdropFilter: 'blur(8px)' }}
                        itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                        labelStyle={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}
                      />
                      <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '11px', fontWeight: 'bold' }} />
                      <Line yAxisId="left" type="monotone" dataKey="brix" stroke="#0ea5e9" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6, strokeWidth: 0 }} name="Brix %" />
                      <Line yAxisId="left" type="monotone" dataKey="purity" stroke="#10b981" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6, strokeWidth: 0 }} name="Purity %" />
                      <Line yAxisId="right" type="monotone" dataKey="color" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6, strokeWidth: 0 }} name="Color (ICUMSA)" />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </LabPanel>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-8 shrink-0">
          <div className="col-span-6">
            <LabPanel title="Production Volume (Tons)" icon={BarChart3}>
              <div className="h-80 w-full p-4">
                {volumeData.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <div className="p-4 bg-brand-mist rounded-full mb-4">
                      <BarChart3 className="w-8 h-8 text-brand-sage/50" />
                    </div>
                    <p className="text-sm font-bold text-brand-deep">No Volume Data</p>
                    <p className="text-xs text-brand-sage mt-1">No samples registered in the last 7 days.</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={volumeData} margin={{ top: 20, right: 10, left: -10, bottom: 10 }}>
                      <defs>
                        <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#3b82f6" stopOpacity={1}/>
                          <stop offset="100%" stopColor="#2563eb" stopOpacity={0.8}/>
                        </linearGradient>
                        <linearGradient id="colorTarget" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#cbd5e1" stopOpacity={0.6}/>
                          <stop offset="100%" stopColor="#94a3b8" stopOpacity={0.4}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                      <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} dy={10} />
                      <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} dx={-10} />
                      <Tooltip
                        cursor={{ fill: 'rgba(241, 245, 249, 0.5)' }}
                        contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '16px', border: '1px solid rgba(226, 232, 240, 0.8)', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)', backdropFilter: 'blur(8px)' }}
                        itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                        labelStyle={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}
                      />
                      <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '11px', fontWeight: 'bold' }} />
                      <Bar dataKey="volume" fill="url(#colorVolume)" radius={[6, 6, 0, 0]} name="Actual Volume" maxBarSize={40} />
                      <Bar dataKey="target" fill="url(#colorTarget)" radius={[6, 6, 0, 0]} name="Target" maxBarSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </LabPanel>
          </div>
          <div className="col-span-6">
            <LabPanel title="Process Capability (Cpk)" icon={Activity}>
               <div className="h-80 flex flex-col items-center justify-center gap-8 p-6 relative overflow-hidden">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(var(--brand-primary-rgb),0.03)_0%,transparent_70%)]" />
                  
                  <div className="flex items-center gap-12 relative z-10 w-full justify-center">
                    <div className="text-center group">
                      <div className="relative mb-4">
                        <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full scale-0 group-hover:scale-150 transition-transform duration-500" />
                        <p className="text-5xl font-black text-emerald-500 relative z-10 tracking-tighter">{capability.brixCpk}</p>
                      </div>
                      <p className="text-[10px] font-black text-brand-sage uppercase tracking-[0.2em] group-hover:text-emerald-600 transition-colors">Brix Cpk</p>
                    </div>
                    <div className="w-px h-24 bg-linear-to-b from-transparent via-brand-sage/20 to-transparent" />
                    <div className="text-center group">
                      <div className="relative mb-4">
                        <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full scale-0 group-hover:scale-150 transition-transform duration-500" />
                        <p className="text-5xl font-black text-emerald-500 relative z-10 tracking-tighter">{capability.purityCpk}</p>
                      </div>
                      <p className="text-[10px] font-black text-brand-sage uppercase tracking-[0.2em] group-hover:text-emerald-600 transition-colors">Purity Cpk</p>
                    </div>
                    <div className="w-px h-24 bg-linear-to-b from-transparent via-brand-sage/20 to-transparent" />
                    <div className="text-center group">
                      <div className="relative mb-4">
                        <div className="absolute inset-0 bg-amber-500/20 blur-xl rounded-full scale-0 group-hover:scale-150 transition-transform duration-500" />
                        <p className="text-5xl font-black text-amber-500 relative z-10 tracking-tighter">{capability.colorCpk}</p>
                      </div>
                      <p className="text-[10px] font-black text-brand-sage uppercase tracking-[0.2em] group-hover:text-amber-600 transition-colors">Color Cpk</p>
                    </div>
                  </div>
                  
                  <div className="w-full max-w-md mt-6 p-4 bg-amber-50 rounded-2xl border border-amber-200/50 flex items-start gap-3 relative z-10">
                    <div className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 animate-pulse" />
                    <p className="text-xs text-amber-800 font-medium leading-relaxed">
                      Color Cpk is below the target threshold of 1.33. Recommend reviewing clarification process parameters.
                    </p>
                  </div>
               </div>
            </LabPanel>
          </div>
        </div>
      </div>
    </div>
  );
});

AnalyticsFeature.displayName = "AnalyticsFeature";
export default AnalyticsFeature;
