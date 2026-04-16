import React, { memo } from "react";
import { ShieldAlert } from "lucide-react";
import { LabPanel } from "../../../ui/components/LabPanel";

export const AuditFeature: React.FC = memo(() => {
  return (
    <div className="flex flex-col h-full overflow-hidden bg-(--color-zenthar-graphite)/30 p-2 rounded-3xl">
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-8 pb-8">
        <div className="grid grid-cols-12 gap-8 shrink-0 h-full">
          <div className="col-span-12 flex flex-col gap-8 overflow-hidden h-full">
            <LabPanel title="Audit & Traceability" icon={ShieldAlert}>
              <div className="h-full min-h-400px flex flex-col items-center justify-center text-brand-sage gap-6">
                <div className="p-6 bg-(--color-zenthar-void) rounded-full border border-brand-sage/20 relative group">
                  <div className="absolute inset-0 bg-emerald-500/10 rounded-full blur-xl scale-150 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                  <ShieldAlert className="w-16 h-16 opacity-40 relative z-10 text-emerald-500 group-hover:opacity-80 transition-opacity duration-300" />
                </div>
                <p className="text-sm font-black text-white uppercase tracking-[0.2em]">
                  Governance, Audit, and Traceability
                </p>
                <p className="text-xs text-brand-sage font-medium max-w-md text-center">
                  Immutable records and comprehensive tracking for compliance
                  and quality assurance.
                </p>
              </div>
            </LabPanel>
          </div>
        </div>
      </div>
    </div>
  );
});

AuditFeature.displayName = "AuditFeature";
export default AuditFeature;
