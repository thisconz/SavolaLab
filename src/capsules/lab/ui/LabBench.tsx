import React, { memo, useState, useEffect } from "react";
import {
  FlaskConical,
  CheckCircle2,
  AlertTriangle,
  Info,
  History,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Activity,
  TestTube2,
  Save,
  Target,
} from "lucide-react";
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "@/src/lib/recharts";
import {
  Sample,
  TestResult,
  TestType,
  WorkflowStepExecutionStatus,
} from "../../../core/types";
import { SampleStatus, SamplePriority } from "../../../core/types";
import { LabPanel } from "../../../ui/components/LabPanel";
import { LabApi } from "../api/lab.api";
import { WorkflowApi } from "../../workflows/api/workflow.api";
import { useLabBench } from "../hooks/useLabBench";
import { TEST_VALIDATION_RULES } from "../constants/validation.constants";
import { calculateICUMSA } from "../../../core/utils/calculations.util";
import { motion, AnimatePresence } from "@/src/lib/motion";
import { StatusPill } from "../../../ui/components/StatusPill";

interface LabBenchProps {
  sample: Sample;
  onComplete: () => void;
}

/**
 * LabBench Component
 *
 * The core interface for laboratory technicians to enter and validate test results.
 * It provides a dynamic, interactive environment for data entry, including:
 * - Real-time validation against predefined limits (e.g., Brix, Purity, ICUMSA).
 * - Automatic calculations (e.g., ICUMSA Colour based on Absorbance, Brix, and Cell Length).
 * - Historical trend visualization for specific test types to aid in quality control.
 * - Integration with the workflow engine to update step execution statuses.
 *
 * @param {Sample} sample - The sample currently being tested.
 * @param {() => void} onComplete - Callback triggered when all tests are completed and saved.
 */
export const LabBench: React.FC<LabBenchProps> = memo(
  ({ sample, onComplete }) => {
    const {
      tests,
      loading,
      values,
      notes,
      errors,
      suggestions,
      colourParams,
      previousResults,
      isSaving,
      handleValueChange,
      handleNoteChange,
      handleColourParamChange,
      handleSave,
      handleReview,
    } = useLabBench(sample, onComplete);

    const [expandedNotes, setExpandedNotes] = useState<Record<number, boolean>>(
      {},
    );
    const [expandedHistory, setExpandedHistory] = useState<
      Record<number, boolean>
    >({});

    const hasErrors = Object.values(errors).some((e) => e !== "");
    const allFilled =
      tests.length > 0 && tests.every((t) => values[t.id] !== "");

    const renderVisualRange = (testType: string, value: string) => {
      const rule = TEST_VALIDATION_RULES[testType as TestType];
      if (!rule) return null;
      const num = parseFloat(value);

      // Calculate percentage even if empty for default position
      const percentage = isNaN(num)
        ? 50
        : Math.min(
            100,
            Math.max(0, ((num - rule.min) / (rule.max - rule.min)) * 100),
          );
      const isWarning = !isNaN(num) && (num < rule.min || num > rule.max);
      const hasValue = !isNaN(num);

      return (
        <div className="mt-5 pt-5 border-t border-(--color-zenthar-border)/20">
          <div className="flex justify-between text-[10px] font-black text-zenthar-text-muted uppercase tracking-widest mb-3">
            <span className="flex flex-col items-start gap-1">
              <span className="opacity-50">MIN</span>
              <span>{rule.min}</span>
            </span>
            <span className="flex flex-col items-center gap-1">
              <span className="opacity-50">TARGET</span>
              <span>{((rule.max + rule.min) / 2).toFixed(1)}</span>
            </span>
            <span className="flex flex-col items-end gap-1">
              <span className="opacity-50">MAX</span>
              <span>{rule.max}</span>
            </span>
          </div>
          <div className="relative h-3 w-full bg-(--color-zenthar-void) rounded-full overflow-hidden border border-(--color-zenthar-border)/30 shadow-inner">
            {/* Target Zone */}
            <div className="absolute left-1/4 right-1/4 h-full bg-brand-primary/10" />

            {/* Fill Bar */}
            {hasValue && (
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ type: "spring", stiffness: 100, damping: 20 }}
                className={`absolute left-0 top-0 h-full ${isWarning ? "bg-(--color-zenthar-critical)" : "bg-brand-primary"}`}
              />
            )}
          </div>
          {/* Indicator Pin */}
          {hasValue && (
            <motion.div
              initial={{ left: "50%" }}
              animate={{ left: `${percentage}%` }}
              transition={{ type: "spring", stiffness: 100, damping: 20 }}
              className="relative w-full h-0"
            >
              <div
                className={`absolute top-0 -translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-full border-[3px] border-(--color-zenthar-carbon) shadow-md ${isWarning ? "bg-(--color-zenthar-critical)" : "bg-brand-primary"}`}
              />
            </motion.div>
          )}
        </div>
      );
    };

    return (
      <LabPanel
        title={`Lab Bench`}
        icon={FlaskConical}
        loading={loading || isSaving}
      >
        <div className="flex flex-col h-full gap-6">
          {/* Header Section */}
          <div className="flex items-center gap-4 p-6 bg-linear-to-r from-brand-primary/10 via-brand-primary/5 to-transparent rounded-3xl border border-brand-primary/20 relative overflow-hidden shadow-sm">
            <div className="absolute top-0 right-0 w-48 h-48 bg-brand-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

            <div className="p-4 bg-(--color-zenthar-void)/80 backdrop-blur-sm rounded-2xl shadow-md shadow-brand-primary/10 border border-brand-primary/20 relative z-10">
              <Activity className="w-6 h-6 text-brand-primary animate-pulse" />
            </div>
            <div className="relative z-10">
              <h4 className="text-xl font-black text-(--color-zenthar-text-primary) uppercase tracking-0.1em mb-1.5">
                Analysis in Progress
              </h4>
              <div className="flex items-center gap-3 text-[11px] font-mono text-zenthar-text-muted uppercase tracking-widest">
                <span className="font-bold text-brand-primary bg-(--color-zenthar-void)/80 backdrop-blur-sm px-3 py-1 rounded-lg shadow-sm border border-brand-primary/10">
                  {sample.batch_id}
                </span>
                <span className="bg-(--color-zenthar-void)/80 backdrop-blur-sm px-3 py-1 rounded-lg shadow-sm border border-(--color-zenthar-border)/20">
                  {sample.source_stage}
                </span>
              </div>
            </div>
          </div>

          {/* Tests List */}
          <div className="flex-1 overflow-auto custom-scrollbar pr-2 pb-4">
            <div className="w-full overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-(--color-zenthar-steel)">
                    <th className="p-4 text-[10px] font-display font-bold text-zenthar-text-muted uppercase tracking-[0.2em]">Test Type</th>
                    <th className="p-4 text-[10px] font-display font-bold text-zenthar-text-muted uppercase tracking-[0.2em]">Raw Value</th>
                    <th className="p-4 text-[10px] font-display font-bold text-zenthar-text-muted uppercase tracking-[0.2em]">Calculated Value</th>
                    <th className="p-4 text-[10px] font-display font-bold text-zenthar-text-muted uppercase tracking-[0.2em]">Unit</th>
                    <th className="p-4 text-[10px] font-display font-bold text-zenthar-text-muted uppercase tracking-[0.2em]">Status</th>
                    <th className="p-4 text-[10px] font-display font-bold text-zenthar-text-muted uppercase tracking-[0.2em]">Performed At</th>
                    <th className="p-4 text-[10px] font-display font-bold text-zenthar-text-muted uppercase tracking-[0.2em]">Performer</th>
                    <th className="p-4 text-[10px] font-display font-bold text-zenthar-text-muted uppercase tracking-[0.2em]">Reviewer</th>
                    <th className="p-4 text-[10px] font-display font-bold text-zenthar-text-muted uppercase tracking-[0.2em]">Review Notes</th>
                    <th className="p-4 text-[10px] font-display font-bold text-zenthar-text-muted uppercase tracking-[0.2em]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-(--color-zenthar-steel)">
                  {tests.map((test) => {
                    const rule = TEST_VALIDATION_RULES[test.test_type as TestType];
                    const error = errors[test.id];
                    const isFilled = values[test.id] !== "";
                    
                    return (
                      <tr key={test.id} className="hover:bg-(--color-zenthar-carbon) transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-(--color-zenthar-text-primary) uppercase tracking-wider">{test.test_type}</span>
                            {rule && (
                              <div className="group/info relative">
                                <Info className="w-3 h-3 text-zenthar-text-muted cursor-help hover:text-brand-primary transition-colors" />
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-4 py-3 bg-(--color-zenthar-carbon) text-(--color-zenthar-text-primary) border border-(--color-zenthar-steel) text-[11px] rounded-xl opacity-0 group-hover/info:opacity-100 transition-opacity whitespace-nowrap z-20 pointer-events-none shadow-2xl">
                                  <p className="font-bold mb-1">{rule.description}</p>
                                  <p className="opacity-70 font-mono">Range: {rule.min} - {rule.max} {rule.unit}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="p-4 relative">
                          <div className="w-full min-w-[200px]">
                            {test.test_type === "Colour" ? (
                              <div className="flex flex-col gap-2">
                                <input
                                  type="number"
                                  step="0.001"
                                  value={colourParams[test.id]?.absorbance || ""}
                                  onChange={(e) => handleColourParamChange(test.id, "absorbance", e.target.value)}
                                  placeholder="Absorbance"
                                  className="w-full bg-(--color-zenthar-void) border border-(--color-zenthar-steel) rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:border-brand-primary text-(--color-zenthar-text-primary)"
                                />
                                <input
                                  type="number"
                                  step="0.1"
                                  value={colourParams[test.id]?.brix || ""}
                                  onChange={(e) => handleColourParamChange(test.id, "brix", e.target.value)}
                                  placeholder="Brix"
                                  className="w-full bg-(--color-zenthar-void) border border-(--color-zenthar-steel) rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:border-brand-primary text-(--color-zenthar-text-primary)"
                                />
                                <input
                                  type="number"
                                  step="0.1"
                                  value={colourParams[test.id]?.cellLength || ""}
                                  onChange={(e) => handleColourParamChange(test.id, "cellLength", e.target.value)}
                                  placeholder="Cell Length"
                                  className="w-full bg-(--color-zenthar-void) border border-(--color-zenthar-steel) rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:border-brand-primary text-(--color-zenthar-text-primary)"
                                />
                              </div>
                            ) : (
                              <input
                                type="number"
                                step={rule?.step || "any"}
                                value={values[test.id] || ""}
                                onChange={(e) => handleValueChange(test.id, e.target.value, test.test_type)}
                                placeholder={`Value`}
                                className={`w-full bg-(--color-zenthar-void) border rounded-lg px-3 py-2 text-xs font-mono focus:outline-none transition-all ${
                                  error ? "border-red-500/50 text-red-500 ring-2 ring-red-500/20" : "border-(--color-zenthar-steel) focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 text-(--color-zenthar-text-primary)"
                                }`}
                              />
                            )}
                            {error && (
                              <div className="absolute top-1/2 -translate-y-1/2 right-2 group/error z-10">
                                <AlertTriangle className="w-4 h-4 text-red-500 drop-shadow-md" />
                                <div className="absolute right-full mr-2 top-1/2 -translate-y-1/2 px-3 py-2 bg-red-950/90 border border-red-500/50 shadow-xl text-red-200 text-xs rounded-lg opacity-0 group-hover/error:opacity-100 whitespace-nowrap pointer-events-none transition-opacity">
                                  {error}
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="p-4 text-sm font-mono text-(--color-zenthar-text-primary) w-[250px]">
                          <div className="flex flex-col gap-1 w-full">
                            <span className="font-bold text-center block bg-(--color-zenthar-void) rounded-md py-1 border border-(--color-zenthar-steel)">
                              {test.test_type === "Colour" ? (values[test.id] ? values[test.id] : "---") : (values[test.id] ? values[test.id] : "---")}
                            </span>
                            {rule && renderVisualRange(test.test_type, values[test.id] || "")}
                          </div>
                        </td>
                        <td className="p-4 text-xs font-mono text-zenthar-text-muted uppercase">{rule?.unit || "-"}</td>
                        <td className="p-4">
                          <StatusPill
                            label={test.status}
                            variant={
                              test.status === "APPROVED" ? "success" : 
                              test.status === "VALIDATING" ? "warning" : 
                              test.status === "PENDING" ? "info" : "neutral"
                            }
                          />
                        </td>
                        <td className="p-4 text-xs font-mono text-zenthar-text-muted">
                          {test.performed_at ? new Date(test.performed_at).toLocaleString() : "-"}
                        </td>
                        <td className="p-4 text-xs text-(--color-zenthar-text-primary)">{test.performer_id || "-"}</td>
                        <td className="p-4 text-xs text-(--color-zenthar-text-primary)">{test.reviewer_id || "-"}</td>
                        <td className="p-4">
                          <input
                            type="text"
                            value={notes[test.id] || ""}
                            onChange={(e) => handleNoteChange(test.id, e.target.value)}
                            placeholder="Notes..."
                            className="w-32 bg-(--color-zenthar-void) border border-(--color-zenthar-steel) rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-brand-primary text-(--color-zenthar-text-primary)"
                          />
                        </td>
                        <td className="p-4">
                          {test.status === "VALIDATING" && (
                            <button 
                              onClick={() => handleReview(test.id, "APPROVED")}
                              className="px-3 py-1 bg-brand-primary/10 hover:bg-brand-primary/20 text-brand-primary border border-brand-primary/20 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-colors"
                            >
                              Review
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-5 border-t border-(--color-zenthar-border)/20 mt-auto">
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
                  <Save className="w-5 h-5 text-(--color-zenthar-void)" />
                  <span className="text-(--color-zenthar-void)">Finalize Analysis</span>
                </>
              )}
            </button>
            <p className="text-[10px] text-zenthar-text-muted font-mono text-center mt-4 uppercase tracking-widest opacity-70">
              All results will be sent for validation and audit logging
            </p>
          </div>
        </div>
      </LabPanel>
    );
  },
);

LabBench.displayName = "LabBench";
