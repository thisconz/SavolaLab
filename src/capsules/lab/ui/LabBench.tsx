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
import { TEST_VALIDATION_RULES } from "../constants/validation.constants";
import { calculateICUMSA } from "../../../core/utils/calculations.util";
import { motion, AnimatePresence } from "@/src/lib/motion";

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
    const [tests, setTests] = useState<TestResult[]>([]);
    const [loading, setLoading] = useState(true);
    const [values, setValues] = useState<Record<number, string>>({});
    const [notes, setNotes] = useState<Record<number, string>>({});
    const [errors, setErrors] = useState<Record<number, string>>({});
    const [suggestions, setSuggestions] = useState<Record<number, string>>({});
    const [colourParams, setColourParams] = useState<
      Record<number, { absorbance: string; brix: string; cellLength: string }>
    >({});
    const [previousResults, setPreviousResults] = useState<
      Record<string, any[]>
    >({});
    const [expandedNotes, setExpandedNotes] = useState<Record<number, boolean>>(
      {},
    );
    const [expandedHistory, setExpandedHistory] = useState<
      Record<number, boolean>
    >({});

    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
      const loadTests = async () => {
        try {
          const data = await LabApi.getSampleTests(sample.id);
          setTests(data);
          const initialValues: Record<number, string> = {};
          const initialNotes: Record<number, string> = {};
          const initialColourParams: Record<
            number,
            { absorbance: string; brix: string; cellLength: string }
          > = {};

          const historyPromises: Promise<void>[] = [];

          data.forEach((t) => {
            initialValues[t.id] = t.raw_value?.toString() || "";
            initialNotes[t.id] = t.notes || "";

            if (t.test_type === "Colour") {
              let p = { absorbance: "", brix: "50", cellLength: "1" };
              if (t.params) {
                try {
                  const parsed =
                    typeof t.params === "string"
                      ? JSON.parse(t.params)
                      : t.params;
                  p = { ...p, ...parsed };
                } catch (e) {
                  console.warn(
                    `Failed to parse colour params for test ${t.id}:`,
                    e,
                  );
                }
              }
              initialColourParams[t.id] = p;
            }

            // Fetch history for each test type
            if (!previousResults[t.test_type]) {
              historyPromises.push(
                LabApi.getPreviousResults(
                  sample.source_stage,
                  t.test_type,
                  3,
                ).then((results) => {
                  setPreviousResults((prev) => ({
                    ...prev,
                    [t.test_type]: results,
                  }));
                }),
              );
            }
          });

          setValues(initialValues);
          setNotes(initialNotes);
          setColourParams(initialColourParams);
          await Promise.all(historyPromises);
        } catch (err) {
          console.error("Failed to load tests", err);
        } finally {
          setLoading(false);
        }
      };
      loadTests();
    }, [sample.id, sample.source_stage]);

    const validate = (testId: number, value: string, testType: string) => {
      if (!value) return null;

      const rule = TEST_VALIDATION_RULES[testType as TestType];
      if (!rule) return null;

      const numValue = parseFloat(value);
      if (isNaN(numValue))
        return {
          message: "Invalid numeric format",
          suggestion: "Please enter a valid number (e.g. 12.5)",
        };

      if (numValue < rule.min)
        return {
          message: `Value (${numValue} ${rule.unit}) is below minimum threshold`,
          suggestion: `Input must be at least ${rule.min} ${rule.unit}. Check sample dilution or instrument zeroing.`,
        };

      if (numValue > rule.max)
        return {
          message: `Value (${numValue} ${rule.unit}) exceeds maximum limit`,
          suggestion: `Input must be no more than ${rule.max} ${rule.unit}. Verify calibration or check for contamination.`,
        };

      return null;
    };

    const handleInputChange = (
      testId: number,
      value: string,
      testType: string,
    ) => {
      setValues((prev) => ({ ...prev, [testId]: value }));
      const error = validate(testId, value, testType);
      setErrors((prev) => ({ ...prev, [testId]: error ? error.message : "" }));
      setSuggestions((prev) => ({
        ...prev,
        [testId]: error ? error.suggestion : "",
      }));
    };

    const handleNoteChange = (testId: number, value: string) => {
      setNotes((prev) => ({ ...prev, [testId]: value }));
    };

    const handleColourParamChange = (
      testId: number,
      param: "absorbance" | "brix" | "cellLength",
      val: string,
    ) => {
      setColourParams((prev) => {
        const current = prev[testId] || {
          absorbance: "",
          brix: "50",
          cellLength: "1",
        };
        const updated = { ...current, [param]: val };

        const abs = parseFloat(updated.absorbance);
        const bx = parseFloat(updated.brix);
        const cl = parseFloat(updated.cellLength);

        if (!isNaN(abs) && !isNaN(bx) && !isNaN(cl) && cl > 0) {
          const icumsa = calculateICUMSA(abs, bx, cl);
          handleInputChange(testId, Math.round(icumsa).toString(), "Colour");
        } else {
          handleInputChange(testId, "", "Colour");
        }

        return { ...prev, [testId]: updated };
      });
    };

    const handleComplete = async () => {
      setIsSaving(true);
      try {
        const executions = await WorkflowApi.getWorkflowExecutions(sample.id);
        const activeExec = executions.find((e) => e.status === "IN_PROGRESS");

        // PASS 1: Parallel Data Persistence (Fast)
        // We save/create all the test records first.
        // We do NOT touch workflows here to avoid race conditions.
        const savedTests = await Promise.all(
          tests.map(async (test) => {
            const rawValue = parseFloat(values[test.id]);
            let savedTestId = test.id;

            const payload = {
              sample_id: sample.id,
              test_type: test.test_type,
              raw_value: rawValue,
              calculated_value: rawValue,
              unit:
                TEST_VALIDATION_RULES[test.test_type as TestType]?.unit ||
                "N/A",
              status: "VALIDATING",
              notes: notes[test.id] || null,
              params:
                test.test_type === "Colour" ? colourParams[test.id] : null,
            };

            if (test.id < 0) {
              const res = await LabApi.createTest(payload);
              savedTestId = res.id;
            } else {
              await LabApi.updateTest(test.id, payload);
            }

            return { id: savedTestId, type: test.test_type, value: rawValue };
          }),
        );

        // PASS 2: Sequential Workflow Completion (Safe)
        // Now that data is saved, we iterate through the results one by one.
        if (activeExec?.step_executions) {
          // Keep a local tracking copy of step statuses to avoid "double-completing"
          const localSteps = [...activeExec.step_executions];

          for (const result of savedTests) {
            const stepIndex = localSteps.findIndex(
              (se) =>
                se.test_type === result.type &&
                (se.status === "IN_PROGRESS" || se.status === "PENDING"),
            );

            if (stepIndex !== -1) {
              const step = localSteps[stepIndex];

              await WorkflowApi.completeStep(activeExec.id, step.step_id, {
                status: "COMPLETED",
                test_id: result.id,
                result_value: result.value,
              });

              // CRITICAL: Update local state so the next iteration doesn't find this step again
              localSteps[stepIndex] = {
                ...step,
                status: WorkflowStepExecutionStatus.COMPLETED,
              };
            }
          }
        }

        // Final Sample Update
        await LabApi.updateSample(sample.id, {
          status: SampleStatus.VALIDATING,
          priority: SamplePriority.NORMAL,
        });

        onComplete();
      } catch (err) {
        console.error("Failed to save test results", err);
        // Suggestion: Add a toast notification here for better UX
      } finally {
        setIsSaving(false);
      }
    };

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
        <div className="mt-5 pt-5 border-t border-brand-sage/10">
          <div className="flex justify-between text-[10px] font-black text-brand-sage uppercase tracking-widest mb-3">
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
          <div className="relative h-3 w-full bg-brand-mist/50 rounded-full overflow-hidden border border-brand-sage/10 shadow-inner">
            {/* Target Zone */}
            <div className="absolute left-1/4 right-1/4 h-full bg-brand-primary/10" />

            {/* Fill Bar */}
            {hasValue && (
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ type: "spring", stiffness: 100, damping: 20 }}
                className={`absolute left-0 top-0 h-full ${isWarning ? "bg-lab-laser" : "bg-brand-primary"}`}
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
                className={`absolute top-0 -translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-full border-[3px] border-white shadow-md ${isWarning ? "bg-lab-laser" : "bg-brand-primary"}`}
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

            <div className="p-4 bg-white/80 backdrop-blur-sm rounded-2xl shadow-md shadow-brand-primary/10 border border-brand-primary/20 relative z-10">
              <Activity className="w-6 h-6 text-brand-primary animate-pulse" />
            </div>
            <div className="relative z-10">
              <h4 className="text-xl font-black text-brand-deep uppercase tracking-0.1em mb-1.5">
                Analysis in Progress
              </h4>
              <div className="flex items-center gap-3 text-[11px] font-mono text-brand-sage uppercase tracking-widest">
                <span className="font-bold text-brand-primary bg-white/80 backdrop-blur-sm px-3 py-1 rounded-lg shadow-sm border border-brand-primary/10">
                  {sample.batch_id}
                </span>
                <span className="bg-white/80 backdrop-blur-sm px-3 py-1 rounded-lg shadow-sm border border-brand-sage/10">
                  {sample.source_stage}
                </span>
              </div>
            </div>
          </div>

          {/* Tests List */}
          <div className="flex-1 overflow-auto custom-scrollbar pr-2 pb-4">
            <div className="grid gap-6">
              {tests.map((test) => {
                const rule = TEST_VALIDATION_RULES[test.test_type as TestType];
                const error = errors[test.id];
                const history = previousResults[test.test_type] || [];
                const isFilled = values[test.id] !== "";

                return (
                  <motion.div
                    key={test.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-5 rounded-3xl border transition-all duration-300 group ${
                      isFilled && !error
                        ? "bg-linear-to-br from-brand-primary/5 to-transparent border-brand-primary/20 shadow-md shadow-brand-primary/5"
                        : error
                          ? "bg-lab-laser/5 border-lab-laser/20 shadow-md shadow-lab-laser/5"
                          : "bg-white/50 backdrop-blur-sm border-brand-sage/10 hover:border-brand-primary/30 hover:shadow-lg hover:-translate-y-0.5"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-5">
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${
                            isFilled && !error
                              ? "bg-brand-primary text-white shadow-lg shadow-brand-primary/30"
                              : error
                                ? "bg-lab-laser text-white shadow-lg shadow-lab-laser/30"
                                : "bg-brand-mist text-brand-primary group-hover:bg-brand-primary/10"
                          }`}
                        >
                          <TestTube2 className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-base font-black text-brand-deep uppercase tracking-0.1em">
                              {test.test_type}
                            </span>
                            {rule && (
                              <div className="group/info relative">
                                <Info className="w-4 h-4 text-brand-sage cursor-help hover:text-brand-primary transition-colors" />
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-4 py-3 bg-brand-deep text-white text-[11px] rounded-xl opacity-0 group-hover/info:opacity-100 transition-opacity whitespace-nowrap z-20 pointer-events-none shadow-2xl">
                                  <p className="font-bold mb-1">
                                    {rule.description}
                                  </p>
                                  <p className="opacity-70 font-mono">
                                    Range: {rule.min} - {rule.max} {rule.unit}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-brand-sage font-mono uppercase tracking-widest mt-1">
                            {rule?.unit || "-"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        {values[test.id] && (
                          <div
                            className={`px-3.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] border shadow-sm ${
                              error
                                ? "bg-lab-laser/10 text-lab-laser border-lab-laser/20"
                                : "bg-brand-primary/10 text-brand-primary border-brand-primary/20"
                            }`}
                          >
                            {error ? "Out of Range" : "Valid"}
                          </div>
                        )}
                        <div className="flex gap-2 bg-brand-mist/50 p-1.5 rounded-2xl border border-brand-sage/10">
                          <button
                            onClick={() =>
                              setExpandedHistory((prev) => ({
                                ...prev,
                                [test.id]: !prev[test.id],
                              }))
                            }
                            className={`p-2.5 rounded-xl transition-all ${expandedHistory[test.id] ? "bg-white text-brand-primary shadow-sm" : "text-brand-sage hover:text-brand-deep hover:bg-white/50"}`}
                            title="View History"
                          >
                            <History className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() =>
                              setExpandedNotes((prev) => ({
                                ...prev,
                                [test.id]: !prev[test.id],
                              }))
                            }
                            className={`p-2.5 rounded-xl transition-all ${expandedNotes[test.id] ? "bg-white text-brand-primary shadow-sm" : "text-brand-sage hover:text-brand-deep hover:bg-white/50"}`}
                            title="Add Notes"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* History Section */}
                    <AnimatePresence>
                      {expandedHistory[test.id] && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="mb-5 p-5 bg-white/80 backdrop-blur-sm rounded-2xl border border-brand-sage/10 shadow-sm">
                            <div className="text-[10px] font-black text-brand-sage uppercase tracking-widest mb-4 flex items-center gap-2">
                              <History className="w-4 h-4" /> Previous Results (
                              {sample.source_stage})
                            </div>
                            <div className="space-y-4">
                              {history.length > 0 ? (
                                <>
                                  <div className="h-36 w-full mt-2 mb-5">
                                    <ResponsiveContainer
                                      width="100%"
                                      height="100%"
                                    >
                                      <AreaChart
                                        data={[...history].reverse()}
                                        margin={{
                                          top: 10,
                                          right: 10,
                                          left: -20,
                                          bottom: 0,
                                        }}
                                      >
                                        <defs>
                                          <linearGradient
                                            id={`colorValue-${test.id}`}
                                            x1="0"
                                            y1="0"
                                            x2="0"
                                            y2="1"
                                          >
                                            <stop
                                              offset="5%"
                                              stopColor="#b1be9b"
                                              stopOpacity={0.3}
                                            />
                                            <stop
                                              offset="95%"
                                              stopColor="#b1be9b"
                                              stopOpacity={0}
                                            />
                                          </linearGradient>
                                        </defs>
                                        <CartesianGrid
                                          strokeDasharray="3 3"
                                          stroke="#e5e7eb"
                                          vertical={false}
                                        />
                                        <XAxis dataKey="batch_id" hide />
                                        <YAxis
                                          domain={[
                                            rule?.min || 0,
                                            rule?.max || 100,
                                          ]}
                                          tick={{
                                            fontSize: 10,
                                            fill: "#8a9a73",
                                            fontFamily: "monospace",
                                          }}
                                          tickLine={false}
                                          axisLine={false}
                                        />
                                        <Tooltip
                                          content={({ active, payload }) => {
                                            if (
                                              active &&
                                              payload &&
                                              payload.length
                                            ) {
                                              return (
                                                <div className="bg-brand-deep text-white p-3 rounded-xl text-[11px] font-mono shadow-xl border border-white/10">
                                                  <p className="font-bold mb-1 opacity-70">
                                                    {
                                                      payload[0].payload
                                                        .batch_id
                                                    }
                                                  </p>
                                                  <p className="text-brand-primary text-sm font-black">
                                                    {payload[0].value}{" "}
                                                    {rule?.unit}
                                                  </p>
                                                </div>
                                              );
                                            }
                                            return null;
                                          }}
                                        />
                                        <Area
                                          type="monotone"
                                          dataKey="raw_value"
                                          stroke="#b1be9b"
                                          strokeWidth={3}
                                          fillOpacity={1}
                                          fill={`url(#colorValue-${test.id})`}
                                          activeDot={{
                                            r: 6,
                                            strokeWidth: 0,
                                            fill: "#8a9a73",
                                          }}
                                        />
                                      </AreaChart>
                                    </ResponsiveContainer>
                                  </div>
                                  <div className="grid gap-2">
                                    {history.map((h, i) => (
                                      <div
                                        key={i}
                                        className="flex items-center justify-between text-[11px] font-mono p-3 rounded-xl hover:bg-brand-mist/50 transition-colors border border-transparent hover:border-brand-sage/10"
                                      >
                                        <span className="text-brand-sage font-bold">
                                          {h.batch_id}
                                        </span>
                                        <div className="flex items-center gap-4">
                                          <span className="font-black text-brand-deep">
                                            {h.raw_value} {rule?.unit}
                                          </span>
                                          <span className="text-[9px] opacity-50 bg-white px-2 py-1 rounded-md">
                                            {new Date(
                                              h.performed_at,
                                            ).toLocaleDateString()}
                                          </span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </>
                              ) : (
                                <p className="text-[11px] text-brand-sage italic text-center py-6 bg-brand-mist/30 rounded-xl">
                                  No previous data found
                                </p>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {test.test_type === "Colour" ? (
                      <div className="space-y-5">
                        <div className="grid grid-cols-3 gap-5">
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-brand-sage uppercase tracking-widest flex justify-between items-center">
                              <span>Absorbance</span>
                              {history[0] && (
                                <button
                                  onClick={() => {
                                    let prevAbs = "";
                                    if (history[0].params) {
                                      try {
                                        const p =
                                          typeof history[0].params === "string"
                                            ? JSON.parse(history[0].params)
                                            : history[0].params;
                                        prevAbs = p.absorbance || "";
                                      } catch (e) {}
                                    }
                                    handleColourParamChange(
                                      test.id,
                                      "absorbance",
                                      prevAbs,
                                    );
                                  }}
                                  className="text-[9px] text-brand-primary hover:underline bg-brand-primary/10 px-2 py-1 rounded-md transition-colors hover:bg-brand-primary/20"
                                >
                                  Copy Prev
                                </button>
                              )}
                            </label>
                            <input
                              type="number"
                              step="0.001"
                              value={colourParams[test.id]?.absorbance || ""}
                              onChange={(e) =>
                                handleColourParamChange(
                                  test.id,
                                  "absorbance",
                                  e.target.value,
                                )
                              }
                              placeholder="0.000"
                              className="w-full bg-brand-mist/30 border-2 border-brand-sage/20 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10 text-brand-deep transition-all shadow-inner"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="block text-[10px] font-black text-brand-sage uppercase tracking-widest">
                              Brix (%)
                            </label>
                            <input
                              type="number"
                              step="0.1"
                              value={colourParams[test.id]?.brix || ""}
                              onChange={(e) =>
                                handleColourParamChange(
                                  test.id,
                                  "brix",
                                  e.target.value,
                                )
                              }
                              className="w-full bg-brand-mist/30 border-2 border-brand-sage/20 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10 text-brand-deep transition-all shadow-inner"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="block text-[10px] font-black text-brand-sage uppercase tracking-widest">
                              Cell (cm)
                            </label>
                            <input
                              type="number"
                              step="0.1"
                              value={colourParams[test.id]?.cellLength || ""}
                              onChange={(e) =>
                                handleColourParamChange(
                                  test.id,
                                  "cellLength",
                                  e.target.value,
                                )
                              }
                              className="w-full bg-brand-mist/30 border-2 border-brand-sage/20 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10 text-brand-deep transition-all shadow-inner"
                            />
                          </div>
                        </div>
                        <div className="flex items-center justify-between bg-brand-deep px-5 py-4 rounded-2xl shadow-xl relative overflow-hidden">
                          <div className="absolute inset-0 bg-linear-to-r from-brand-primary/20 to-transparent opacity-50" />
                          <span className="text-[11px] font-black text-brand-mist uppercase tracking-widest flex items-center gap-2 relative z-10">
                            <Target className="w-5 h-5 text-brand-primary" />{" "}
                            Calculated Colour
                          </span>
                          <span
                            className={`text-xl font-mono font-black relative z-10 ${error ? "text-lab-laser" : "text-brand-primary"}`}
                          >
                            {values[test.id] ? `${values[test.id]} IU` : "---"}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="relative">
                        <div className="flex justify-between mb-3">
                          <label className="text-[11px] font-black text-brand-sage uppercase tracking-widest">
                            Result Value
                          </label>
                        </div>
                        <div className="relative group/input">
                          <input
                            type="number"
                            step={rule?.step || "any"}
                            value={values[test.id] || ""}
                            onChange={(e) =>
                              handleInputChange(
                                test.id,
                                e.target.value,
                                test.test_type,
                              )
                            }
                            placeholder={`Enter ${test.test_type} value`}
                            className={`w-full bg-brand-mist/30 border-2 rounded-2xl px-5 py-4 text-xl font-mono focus:outline-none focus:ring-4 transition-all shadow-inner ${
                              error
                                ? "border-lab-laser/50 focus:ring-lab-laser/10 text-lab-laser"
                                : "border-brand-sage/20 focus:border-brand-primary focus:ring-brand-primary/10 text-brand-deep"
                            }`}
                          />
                          {history[0] && (
                            <button
                              onClick={() =>
                                handleInputChange(
                                  test.id,
                                  history[0].raw_value.toString(),
                                  test.test_type,
                                )
                              }
                              className="absolute right-4 top-1/2 -translate-y-1/2 px-4 py-2 bg-white border border-brand-sage/20 rounded-xl text-brand-sage hover:bg-brand-primary hover:text-white hover:border-brand-primary opacity-0 group-hover/input:opacity-100 transition-all text-[10px] font-black uppercase tracking-widest shadow-sm"
                            >
                              Copy Prev
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {renderVisualRange(test.test_type, values[test.id])}

                    {/* Notes Section */}
                    <AnimatePresence>
                      {expandedNotes[test.id] && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-4">
                            <textarea
                              value={notes[test.id]}
                              onChange={(e) =>
                                handleNoteChange(test.id, e.target.value)
                              }
                              placeholder="Add analytical notes or observations..."
                              className="w-full bg-white/80 backdrop-blur-sm border-2 border-brand-sage/10 rounded-2xl p-4 text-sm font-mono focus:outline-none focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10 text-brand-deep min-h-24 resize-none shadow-sm transition-all"
                            />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Error Message */}
                    <AnimatePresence>
                      {error && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="mt-4 p-4 bg-lab-laser/5 rounded-2xl border border-lab-laser/20 space-y-2"
                        >
                          <div className="flex items-center gap-2 text-lab-laser">
                            <AlertTriangle className="w-5 h-5" />
                            <span className="text-[11px] font-black uppercase tracking-widest">
                              {error}
                            </span>
                          </div>
                          {suggestions[test.id] && (
                            <p className="text-[11px] text-brand-sage italic pl-7 leading-relaxed">
                              {suggestions[test.id]}
                            </p>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-5 border-t border-brand-sage/10 mt-auto">
            <button
              onClick={handleComplete}
              disabled={hasErrors || !allFilled || isSaving}
              className={`w-full py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-xs transition-all flex items-center justify-center gap-3 shadow-xl ${
                hasErrors || !allFilled || isSaving
                  ? "bg-brand-mist text-brand-sage cursor-not-allowed border border-brand-sage/20 shadow-none"
                  : "bg-brand-deep text-white shadow-brand-deep/30 hover:bg-brand-deep/90 active:scale-[0.98]"
              }`}
            >
              {isSaving ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>Finalize Analysis</span>
                </>
              )}
            </button>
            <p className="text-[10px] text-brand-sage font-mono text-center mt-4 uppercase tracking-widest opacity-70">
              All results will be sent for validation and audit logging
            </p>
          </div>
        </div>
      </LabPanel>
    );
  },
);

LabBench.displayName = "LabBench";
