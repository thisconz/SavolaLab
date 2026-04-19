import React, { memo, useState } from "react";
import {
  FlaskConical, CheckCircle2, AlertTriangle, Info,
  Activity, TestTube2, Save, ThumbsDown, ThumbsUp,
} from "lucide-react";
import { Sample, TestResult, TestType } from "../../../core/types";
import { LabPanel } from "../../../ui/components/LabPanel";
import { useLabBench } from "../hooks/useLabBench";
import { TEST_VALIDATION_RULES } from "../constants/validation.constants";
import { motion, AnimatePresence } from "@/src/lib/motion";
import { StatusPill } from "../../../ui/components/StatusPill";

interface LabBenchProps {
  sample:     Sample;
  onComplete: () => void;
}

export const LabBench: React.FC<LabBenchProps> = memo(({ sample, onComplete }) => {
  const {
    tests, loading, values, notes, errors, colourParams,
    previousResults, isSaving,
    handleValueChange, handleNoteChange, handleColourParamChange,
    handleSave, handleReview,
  } = useLabBench(sample, onComplete);

  const [reviewingId, setReviewingId] = useState<number | null>(null);
  const [reviewComment, setReviewComment] = useState("");

  const hasErrors  = Object.values(errors).some(Boolean);
  const allFilled  = tests.length > 0 && tests.every((t) => {
    if (t.test_type === "Colour") {
      const p = colourParams[t.id];
      return p?.absorbance && p?.brix && p?.cellLength;
    }
    return (values[t.id] ?? "") !== "";
  });

  const renderRange = (testType: string, value: string) => {
    const rule = TEST_VALIDATION_RULES[testType as TestType];
    if (!rule) return null;

    const num  = parseFloat(value);
    const hasV = !isNaN(num);
    const pct  = hasV
      ? Math.min(100, Math.max(0, ((num - rule.min) / (rule.max - rule.min)) * 100))
      : 50;
    const isWarn = hasV && (num < rule.min || num > rule.max);

    return (
      <div className="mt-3 space-y-1">
        <div className="flex justify-between text-[9px] font-mono text-zenthar-text-muted">
          <span>{rule.min}</span>
          <span className="opacity-50">{rule.unit}</span>
          <span>{rule.max}</span>
        </div>
        <div className="relative h-2 w-full bg-(--color-zenthar-void) rounded-full overflow-hidden border border-(--color-zenthar-border)/30">
          <div className="absolute left-1/4 right-1/4 h-full bg-brand-primary/10" />
          {hasV && (
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ type: "spring", stiffness: 80 }}
              className={`absolute left-0 h-full rounded-full ${isWarn ? "bg-lab-laser" : "bg-brand-primary"}`}
            />
          )}
        </div>
      </div>
    );
  };

  return (
    <LabPanel title="Lab Bench" icon={FlaskConical} loading={loading || isSaving}>
      <div className="flex flex-col h-full gap-6">

        {/* Header banner */}
        <div className="flex items-center gap-4 p-5 bg-linear-to-r from-brand-primary/10 via-brand-primary/5 to-transparent rounded-3xl border border-brand-primary/20">
          <div className="p-3 bg-(--color-zenthar-void) rounded-2xl border border-brand-primary/20">
            <Activity className="w-6 h-6 text-brand-primary animate-pulse" />
          </div>
          <div>
            <h4 className="text-lg font-black text-(--color-zenthar-text-primary) uppercase tracking-tight">
              Analysis in Progress
            </h4>
            <div className="flex items-center gap-3 text-[11px] font-mono text-zenthar-text-muted uppercase mt-1">
              <span className="font-bold text-brand-primary bg-(--color-zenthar-void) px-2 py-0.5 rounded border border-brand-primary/10">
                {sample.batch_id ?? `#${sample.id}`}
              </span>
              <span className="bg-(--color-zenthar-void) px-2 py-0.5 rounded border border-(--color-zenthar-border)/20">
                {sample.source_stage ?? sample.sample_type ?? "—"}
              </span>
            </div>
          </div>
        </div>

        {/* Test table */}
        <div className="flex-1 overflow-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-(--color-zenthar-steel)">
                {["Test", "Input", "Value / Range", "Unit", "Status", "Notes", "Action"].map((h) => (
                  <th key={h} className="p-3 text-[9px] font-black text-zenthar-text-muted uppercase tracking-widest whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-(--color-zenthar-steel)/50">
              {tests.map((test) => {
                const rule    = TEST_VALIDATION_RULES[test.test_type as TestType];
                const errMsg  = errors[test.id];
                const canInput = test.status === "PENDING" || test.status === "VALIDATING" || test.id < 0;
                const canReview = test.status === "VALIDATING" && test.id > 0;

                return (
                  <tr key={test.id} className="hover:bg-(--color-zenthar-carbon) transition-colors">

                    {/* Test name */}
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-(--color-zenthar-text-primary) uppercase">
                          {test.test_type}
                        </span>
                        {rule?.description && (
                          <div className="group relative">
                            <Info className="w-3 h-3 text-zenthar-text-muted cursor-help hover:text-brand-primary" />
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-(--color-zenthar-carbon) border border-(--color-zenthar-steel) text-[10px] rounded-xl opacity-0 group-hover:opacity-100 whitespace-nowrap z-30 shadow-xl pointer-events-none">
                              {rule.description} ({rule.min}–{rule.max} {rule.unit})
                            </div>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Input */}
                    <td className="p-3 min-w-[180px]">
                      {test.test_type === "Colour" ? (
                        <div className="flex flex-col gap-1.5">
                          {(["absorbance", "brix", "cellLength"] as const).map((param) => (
                            <input
                              key={param}
                              type="number"
                              step="0.001"
                              value={colourParams[test.id]?.[param] ?? ""}
                              onChange={(e) => handleColourParamChange(test.id, param, e.target.value)}
                              placeholder={param === "absorbance" ? "Abs." : param === "brix" ? "Brix" : "Cell L."}
                              disabled={!canInput}
                              className={`w-full bg-(--color-zenthar-void) border border-(--color-zenthar-steel) rounded-lg px-2.5 py-1.5 text-xs font-mono focus:outline-none focus:border-brand-primary disabled:opacity-40 text-(--color-zenthar-text-primary)`}
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="relative">
                          <input
                            type="number"
                            step={rule?.step ?? "any"}
                            value={values[test.id] ?? ""}
                            onChange={(e) => handleValueChange(test.id, e.target.value, test.test_type)}
                            placeholder="Value"
                            disabled={!canInput}
                            className={`w-full bg-(--color-zenthar-void) border rounded-lg px-3 py-2 text-xs font-mono focus:outline-none transition-all disabled:opacity-40
                              ${errMsg
                                ? "border-lab-laser/50 text-lab-laser focus:ring-2 focus:ring-lab-laser/20"
                                : "border-(--color-zenthar-steel) focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 text-(--color-zenthar-text-primary)"
                              }`}
                          />
                          {errMsg && (
                            <AlertTriangle className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-lab-laser" />
                          )}
                        </div>
                      )}
                    </td>

                    {/* Calculated value + range bar */}
                    <td className="p-3 min-w-[160px]">
                      <div className="text-center font-mono font-black text-sm text-(--color-zenthar-text-primary) bg-(--color-zenthar-void) rounded-lg py-1 border border-(--color-zenthar-steel)">
                        {values[test.id] || "—"}
                      </div>
                      {renderRange(test.test_type, values[test.id] ?? "")}
                    </td>

                    {/* Unit */}
                    <td className="p-3">
                      <span className="text-[10px] font-mono text-zenthar-text-muted uppercase">
                        {rule?.unit ?? "—"}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="p-3">
                      <StatusPill
                        label={test.status}
                        variant={
                          test.status === "APPROVED"    ? "success"
                          : test.status === "DISAPPROVED" ? "critical"
                          : test.status === "VALIDATING"  ? "warning"
                          : test.status === "COMPLETED"   ? "success"
                          : "info"
                        }
                      />
                    </td>

                    {/* Notes */}
                    <td className="p-3">
                      <input
                        type="text"
                        value={notes[test.id] ?? ""}
                        onChange={(e) => handleNoteChange(test.id, e.target.value)}
                        placeholder="Notes..."
                        disabled={!canInput}
                        className="w-28 bg-(--color-zenthar-void) border border-(--color-zenthar-steel) rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-brand-primary disabled:opacity-40 text-(--color-zenthar-text-primary)"
                      />
                    </td>

                    {/* Review actions */}
                    <td className="p-3">
                      {canReview && (
                        reviewingId === test.id ? (
                          <div className="flex flex-col gap-2 min-w-[160px]">
                            <input
                              autoFocus
                              type="text"
                              value={reviewComment}
                              onChange={(e) => setReviewComment(e.target.value)}
                              placeholder="Comment (optional)"
                              className="w-full bg-(--color-zenthar-void) border border-(--color-zenthar-steel) rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-brand-primary text-(--color-zenthar-text-primary)"
                            />
                            <div className="flex gap-1">
                              <button
                                onClick={() => {
                                  handleReview(test.id, "APPROVED", reviewComment || undefined);
                                  setReviewingId(null);
                                  setReviewComment("");
                                }}
                                className="flex-1 flex items-center justify-center gap-1 py-1 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-500 hover:text-white border border-emerald-500/30 rounded-lg text-[9px] font-black uppercase transition-all"
                              >
                                <ThumbsUp className="w-3 h-3" /> Pass
                              </button>
                              <button
                                onClick={() => {
                                  handleReview(test.id, "DISAPPROVED", reviewComment || undefined);
                                  setReviewingId(null);
                                  setReviewComment("");
                                }}
                                className="flex-1 flex items-center justify-center gap-1 py-1 bg-lab-laser/10 hover:bg-lab-laser text-lab-laser hover:text-white border border-lab-laser/30 rounded-lg text-[9px] font-black uppercase transition-all"
                              >
                                <ThumbsDown className="w-3 h-3" /> Fail
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => setReviewingId(test.id)}
                            className="px-3 py-1.5 bg-brand-primary/10 hover:bg-brand-primary text-brand-primary hover:text-white border border-brand-primary/20 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all"
                          >
                            Review
                          </button>
                        )
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Save footer */}
        <div className="pt-5 border-t border-(--color-zenthar-border)/20 mt-auto space-y-3">
          {hasErrors && (
            <p className="text-[10px] font-bold text-lab-laser text-center uppercase tracking-widest">
              ⚠ Fix validation errors before finalising
            </p>
          )}
          <button
            onClick={handleSave}
            disabled={hasErrors || !allFilled || isSaving}
            className={`w-full py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-xs transition-all flex items-center justify-center gap-3 shadow-xl ${
              hasErrors || !allFilled || isSaving
                ? "bg-(--color-zenthar-carbon) text-zenthar-text-muted cursor-not-allowed border border-(--color-zenthar-border)/20 shadow-none"
                : "bg-brand-primary text-(--color-zenthar-void) shadow-brand-primary/30 hover:bg-brand-primary/90 active:scale-[0.98]"
            }`}
          >
            {isSaving ? (
              <div className="w-5 h-5 border-2 border-(--color-zenthar-void)/30 border-t-(--color-zenthar-void) rounded-full animate-spin" />
            ) : (
              <>
                <Save className="w-5 h-5" />
                Finalise_Analysis
              </>
            )}
          </button>
          <p className="text-[10px] text-zenthar-text-muted font-mono text-center uppercase tracking-widest opacity-70">
            Results will be sent for validation and logged in the audit trail
          </p>
        </div>
      </div>
    </LabPanel>
  );
});

LabBench.displayName = "LabBench";