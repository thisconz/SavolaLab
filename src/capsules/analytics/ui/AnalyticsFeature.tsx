import React, { memo, useEffect, useState, useMemo } from "react";
import {
  BarChart3,
  TrendingUp,
  Activity,
  Info,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
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
  Area,
  AreaChart,
} from "@/src/lib/recharts";

// --- Sub-components for specialized UI ---

const CpkMetric = ({
  label,
  value,
  target = 1.33,
}: {
  label: string;
  value: number;
  target?: number;
}) => {
  const isOptimal = value >= target;
  const statusColor = isOptimal ? "text-emerald-500" : "text-amber-500";
  const glowColor = isOptimal ? "bg-emerald-500/20" : "bg-amber-500/20";

  return (
    <div className="text-center group relative px-4">
      <div className="relative mb-3">
        <div
          className={`absolute inset-0 ${glowColor} blur-2xl rounded-full scale-0 group-hover:scale-150 transition-transform duration-700 opacity-50`}
        />
        <p
          className={`text-6xl font-black ${statusColor} relative z-10 tracking-tighter tabular-nums transition-all duration-500 group-hover:scale-110`}
        >
          {value.toFixed(2)}
        </p>
      </div>
      <p className="text-[10px] font-black text-brand-sage uppercase tracking-[0.2em] group-hover:text-brand-deep transition-colors">
        {label}
      </p>
      <div className="flex items-center justify-center gap-1 mt-2">
        {isOptimal ? (
          <ChevronUp className="w-3 h-3 text-emerald-500" />
        ) : (
          <ChevronDown className="w-3 h-3 text-amber-500" />
        )}
        <span className="text-[9px] font-bold text-brand-sage/60 uppercase tracking-tighter">
          Target: {target}
        </span>
      </div>
    </div>
  );
};

const EmptyState = ({
  icon: Icon,
  title,
  description,
}: {
  icon: any;
  title: string;
  description: string;
}) => (
  <div className="flex flex-col items-center justify-center h-full text-center p-8">
    <div className="relative mb-6">
      <div className="absolute inset-0 bg-brand-primary/10 blur-2xl rounded-full animate-pulse" />
      <div className="relative p-5 bg-white border border-brand-sage/10 rounded-3xl shadow-sm">
        <Icon className="w-10 h-10 text-brand-sage/40" />
      </div>
    </div>
    <h4 className="text-sm font-black uppercase tracking-widest text-brand-deep mb-2">
      {title}
    </h4>
    <p className="text-xs text-brand-sage/70 max-w-[200px] leading-relaxed italic">
      {description}
    </p>
  </div>
);

// --- Main Feature Component ---

export const AnalyticsFeature: React.FC = memo(() => {
  const [qualityData, setQualityData] = useState<any[]>([]);
  const [volumeData, setVolumeData] = useState<any[]>([]);
  const [capability, setCapability] = useState<any>({
    brixCpk: 0,
    purityCpk: 0,
    colorCpk: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const [qRes, vRes, cRes] = await Promise.all([
          api.get<any>("/analytics/quality"),
          api.get<any>("/analytics/volume"),
          api.get<any>("/analytics/capability"),
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

  const chartTheme = useMemo(
    () => ({
      text: {
        fontSize: 10,
        fontWeight: 700,
        fill: "#94a3b8",
        fontFamily: "inherit",
      },
      grid: { stroke: "#f1f5f9", strokeDasharray: "4 4" },
      tooltip: {
        contentStyle: {
          backgroundColor: "rgba(255, 255, 255, 0.95)",
          borderRadius: "20px",
          border: "1px solid #f1f5f9",
          boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1)",
          backdropFilter: "blur(10px)",
          padding: "12px 16px",
        },
        labelStyle: {
          fontSize: "9px",
          fontWeight: 900,
          textTransform: "uppercase",
          letterSpacing: "0.15em",
          color: "#64748b",
          marginBottom: "8px",
        },
      },
    }),
    [],
  );

  return (
    <div className="h-full bg-brand-mist/10 p-4 rounded-[2.5rem] overflow-hidden flex flex-col">
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-6">
        {/* Main Quality SPC Chart */}
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12">
            <LabPanel
              title="Statistical Process Control (SPC)"
              icon={TrendingUp}
              loading={loading}
              onRefresh={() => {
                /* trigger fetch */
              }}
            >
              <div className="h-[450px] w-full pt-6">
                {qualityData.length === 0 ? (
                  <EmptyState
                    icon={Activity}
                    title="No Telemetry"
                    description="System is awaiting verified lab samples from the production floor."
                  />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={qualityData}
                      margin={{ top: 10, right: 20, left: 0, bottom: 20 }}
                    >
                      <defs>
                        <linearGradient
                          id="areaBrix"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#0ea5e9"
                            stopOpacity={0.1}
                          />
                          <stop
                            offset="95%"
                            stopColor="#0ea5e9"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid {...chartTheme.grid} vertical={false} />
                      <XAxis
                        dataKey="time"
                        {...chartTheme.text}
                        axisLine={false}
                        tickLine={false}
                        dy={15}
                      />
                      <YAxis
                        yAxisId="left"
                        {...chartTheme.text}
                        axisLine={false}
                        tickLine={false}
                        dx={-10}
                        domain={["auto", "auto"]}
                      />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        {...chartTheme.text}
                        axisLine={false}
                        tickLine={false}
                        dx={10}
                      />
                      <Tooltip {...chartTheme.tooltip} />
                      <Legend
                        verticalAlign="top"
                        align="right"
                        iconType="circle"
                        wrapperStyle={{
                          paddingBottom: 20,
                          fontSize: 10,
                          fontWeight: 800,
                          textTransform: "uppercase",
                          letterSpacing: "0.1em",
                        }}
                      />

                      <Area
                        yAxisId="left"
                        type="monotone"
                        dataKey="brix"
                        stroke="#0ea5e9"
                        strokeWidth={3}
                        fill="url(#areaBrix)"
                        name="Brix %"
                        activeDot={{ r: 6, strokeWidth: 0 }}
                      />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="purity"
                        stroke="#10b981"
                        strokeWidth={3}
                        dot={false}
                        name="Purity %"
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="color"
                        stroke="#f59e0b"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        dot={false}
                        name="Color Index"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </LabPanel>
          </div>
        </div>

        {/* Volume & Capability Grid */}
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-7">
            <LabPanel
              title="Cycle Volume vs Target"
              icon={BarChart3}
              loading={loading}
            >
              <div className="h-80 w-full pt-6">
                {volumeData.length === 0 ? (
                  <EmptyState
                    icon={BarChart3}
                    title="Volume Halted"
                    description="No throughput data detected for current cycle."
                  />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={volumeData}
                      margin={{ top: 10, right: 10, left: -10, bottom: 20 }}
                    >
                      <CartesianGrid {...chartTheme.grid} vertical={false} />
                      <XAxis
                        dataKey="day"
                        {...chartTheme.text}
                        axisLine={false}
                        tickLine={false}
                        dy={15}
                      />
                      <YAxis
                        {...chartTheme.text}
                        axisLine={false}
                        tickLine={false}
                        dx={-5}
                      />
                      <Tooltip
                        {...chartTheme.tooltip}
                        cursor={{ fill: "#f8fafc", radius: 12 }}
                      />
                      <Bar
                        dataKey="volume"
                        fill="#0ea5e9"
                        radius={[10, 10, 0, 0]}
                        name="Volume"
                        maxBarSize={32}
                      />
                      <Bar
                        dataKey="target"
                        fill="#e2e8f0"
                        radius={[10, 10, 0, 0]}
                        name="Threshold"
                        maxBarSize={32}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </LabPanel>
          </div>

          <div className="col-span-12 lg:col-span-5">
            <LabPanel
              title="Efficiency Index"
              icon={Activity}
              loading={loading}
            >
              <div className="h-80 flex flex-col items-center justify-between py-6">
                <div className="flex items-center justify-around w-full px-4">
                  <CpkMetric label="Brix Cpk" value={capability.brixCpk} />
                  <div className="w-px h-16 bg-brand-sage/10" />
                  <CpkMetric label="Color Cpk" value={capability.colorCpk} />
                </div>

                {/* Tactical Alert Box */}
                <div className="w-[90%] mx-auto p-4 bg-white border border-brand-sage/10 rounded-3xl shadow-xs relative overflow-hidden group/alert transition-all hover:border-amber-200">
                  <div className="absolute top-0 left-0 w-1 h-full bg-amber-500 opacity-40" />
                  <div className="flex gap-4 items-start relative z-10">
                    <div className="p-2 bg-amber-50 rounded-xl">
                      <Info className="w-4 h-4 text-amber-600" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-widest text-brand-deep">
                        System Recommendation
                      </p>
                      <p className="text-xs text-brand-sage/80 leading-relaxed font-medium">
                        Process drift detected in{" "}
                        <span className="text-amber-600 font-bold">
                          Color Index
                        </span>
                        . Optimization required in the clarification circuit.
                      </p>
                    </div>
                  </div>
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
