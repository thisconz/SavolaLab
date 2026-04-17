import React, { memo, useEffect, useState } from "react";
import {
  Factory,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Zap,
  Clock,
} from "lucide-react";
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
import { MetricCard } from "../../../ui/components/MetricCard";
import { DataListRow } from "../../../ui/components/DataListRow";
import { AlertCard } from "../../../ui/components/AlertCard";

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
    <div className="flex flex-col h-full overflow-hidden bg-(--color-zenthar-graphite)/30 p-2 rounded-3xl">
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-8 pb-8">
        {/* Top Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 shrink-0">
          <MetricCard
            label="Overall Equipment Effectiveness"
            value={intelData.metrics.oee}
            trend="+2.1% WEEKLY"
            icon={Activity}
            variant="success"
          />
          <MetricCard
            label="Plant Yield"
            value={intelData.metrics.yield}
            trend="+0.5% TARGET"
            icon={Factory}
            variant="primary"
          />
          <MetricCard
            label="Energy Consumption"
            value={`${intelData.metrics.energy} kWh/t`}
            trend="+1.2% TARGET"
            icon={Zap}
            variant="warning"
          />
          <MetricCard
            label="Active Alarms"
            value={intelData.metrics.activeAlarms}
            trend="CRITICAL REQ"
            icon={AlertTriangle}
            variant="error"
          />
        </div>

        <div className="grid grid-cols-12 gap-8 shrink-0">
          <div className="col-span-12 lg:col-span-8">
            <LabPanel title="Line Status" icon={Factory}>
              <div className="flex flex-col gap-4 p-4">
                {intelData.lines.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center bg-zenthar-carbon/50 rounded-2xl border border-dashed border-white/5">
                    <div className="p-4 bg-zenthar-void rounded-full mb-4">
                      <Factory className="w-8 h-8 text-zenthar-text-muted" />
                    </div>
                    <p className="text-sm font-bold text-white uppercase tracking-wider">
                      No Production Lines
                    </p>
                    <p className="text-[10px] text-zenthar-text-secondary mt-1 font-mono">
                      CONFIGURE_RESOURCES_PENDING
                    </p>
                  </div>
                ) : (
                  intelData.lines.map((line: any, i: number) => (
                    <DataListRow
                      key={i}
                      title={line.name}
                      subtitle={`Status: ${line.status}`}
                      icon={Factory}
                      status={{
                        label: line.status,
                        variant: line.status === "Running" ? "success" : line.status === "Warning" ? "warning" : "error"
                      }}
                      metrics={[
                        { label: "Uptime", value: line.uptime },
                        { label: "OEE", value: line.oee }
                      ]}
                    />
                  ))
                )}
              </div>
            </LabPanel>
          </div>
          <div className="col-span-12 lg:col-span-4">
            <LabPanel title="Predictive Maintenance" icon={Activity}>
              <div className="flex flex-col gap-4 p-4">
                <AlertCard
                  title="Centrifuge C-101 Vibration"
                  message="Vibration levels increasing. Predicted failure in 48 hours if unaddressed."
                  type="warning"
                  icon={AlertTriangle}
                />
                <AlertCard
                  title="Evaporator E-202 Cleaning"
                  message="Routine CIP scheduled for next shift (15:00)."
                  type="info"
                  icon={Clock}
                />
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
