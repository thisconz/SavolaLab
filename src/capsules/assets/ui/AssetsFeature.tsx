import React, { memo } from "react";
import { Database } from "lucide-react";
import { LabPanel } from "../../../ui/components/LabPanel";

export const AssetsFeature: React.FC = memo(() => {
  return (
    <div className="flex flex-col h-full overflow-hidden bg-(--color-zenthar-graphite)/30 p-2 rounded-3xl">
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-8 pb-8">
        <div className="grid grid-cols-12 gap-8 shrink-0 h-full">
          <div className="col-span-12 flex flex-col gap-8 overflow-hidden h-full">
            <LabPanel title="Asset Reliability" icon={Database}>
              <div className="h-full min-h-400px flex flex-col items-center justify-center text-brand-sage gap-6">
                <div className="p-6 bg-(--color-zenthar-void) rounded-full border border-brand-sage/20 relative group">
                  <div className="absolute inset-0 bg-brand-primary/10 rounded-full blur-xl scale-150 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                  <Database className="w-16 h-16 opacity-40 relative z-10 text-brand-primary group-hover:opacity-80 transition-opacity duration-300" />
                </div>
                <p className="text-sm font-black text-white uppercase tracking-[0.2em]">
                  Asset Reliability & Equipment Intelligence
                </p>
                <p className="text-xs text-brand-sage font-medium max-w-md text-center">
                  Comprehensive tracking and predictive maintenance insights for
                  all laboratory and plant equipment.
                </p>
              </div>
            </LabPanel>
          </div>
        </div>
      </div>
    </div>
  );
});

AssetsFeature.displayName = "AssetsFeature";
export default AssetsFeature;
