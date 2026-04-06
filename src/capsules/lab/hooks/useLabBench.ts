import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { LabApi } from "../api/lab.api";
import { WorkflowApi } from "../../workflows/api/workflow.api";
import { Sample } from "../model/sample.model";
import type { TestResult, TestType } from "../../../core/types";
import { calculateICUMSA } from "../../../core/utils/calculations.util";
import { TEST_VALIDATION_RULES } from "../constants/validation.constants";
import { SampleStatus, SamplePriority, WorkflowStepExecutionStatus } from "../../../core/types";

export const useLabBench = (sample: Sample, onComplete?: () => void) => {
  const [tests, setTests] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [values, setValues] = useState<Record<number, string>>({});
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [errors, setErrors] = useState<Record<number, string>>({});
  const [suggestions, setSuggestions] = useState<Record<number, string>>({});
  const [colourParams, setColourParams] = useState<
    Record<number, { absorbance: string; brix: string; cellLength: string }>
  >({});
  const [previousResults, setPreviousResults] = useState<Record<string, any[]>>({});
  const [isSaving, setIsSaving] = useState(false);

  const loadTests = useCallback(async () => {
    setLoading(true);
    try {
      const data = await LabApi.getSampleTests(sample.id);
      setTests(data);
      const initialValues: Record<number, string> = {};
      const initialNotes: Record<number, string> = {};
      const initialColourParams: Record<number, { absorbance: string; brix: string; cellLength: string }> = {};
      const historyPromises: Promise<void>[] = [];

      data.forEach((t) => {
        initialValues[t.id] = t.raw_value?.toString() || "";
        initialNotes[t.id] = t.notes || "";
        
        if (t.test_type === "Colour") {
          let p = { absorbance: "", brix: "50", cellLength: "1" };
          if (t.params) {
            try {
              const parsed = typeof t.params === "string" ? JSON.parse(t.params) : t.params;
              p = { ...p, ...parsed };
            } catch (e) {
              console.warn(`Failed to parse colour params for test ${t.id}:`, e);
            }
          }
          initialColourParams[t.id] = p;
        }

        // Fetch history for each test type
        if (!previousResults[t.test_type]) {
          historyPromises.push(
            LabApi.getPreviousResults(sample.source_stage, t.test_type, 3).then((results) => {
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
  }, [sample.id, sample.source_stage, previousResults]);

  useEffect(() => {
    loadTests();
  }, [sample.id, sample.source_stage]); // Removed loadTests from dependency array to prevent infinite loop if loadTests changes

  const validateField = (testId: number, value: string, testType: string) => {
    if (!value) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[testId];
        return newErrors;
      });
      setSuggestions((prev) => {
        const newSuggestions = { ...prev };
        delete newSuggestions[testId];
        return newSuggestions;
      });
      return;
    }

    const rule = TEST_VALIDATION_RULES[testType as TestType];
    if (!rule) return;

    const numValue = parseFloat(value);
    if (isNaN(numValue)) {
      setErrors((prev) => ({ ...prev, [testId]: "Invalid numeric format" }));
      setSuggestions((prev) => ({ ...prev, [testId]: "Please enter a valid number (e.g. 12.5)" }));
      return;
    }

    if (numValue < rule.min) {
      setErrors((prev) => ({ ...prev, [testId]: `Value (${numValue} ${rule.unit}) is below minimum threshold` }));
      setSuggestions((prev) => ({ ...prev, [testId]: `Input must be at least ${rule.min} ${rule.unit}. Check sample dilution or instrument zeroing.` }));
    } else if (numValue > rule.max) {
      setErrors((prev) => ({ ...prev, [testId]: `Value (${numValue} ${rule.unit}) exceeds maximum limit` }));
      setSuggestions((prev) => ({ ...prev, [testId]: `Input must be no more than ${rule.max} ${rule.unit}. Verify calibration or check for contamination.` }));
    } else {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[testId];
        return newErrors;
      });
      setSuggestions((prev) => {
        const newSuggestions = { ...prev };
        delete newSuggestions[testId];
        return newSuggestions;
      });
    }
  };

  const handleValueChange = (testId: number, value: string, testType: string) => {
    setValues((prev) => ({ ...prev, [testId]: value }));
    validateField(testId, value, testType);
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
        handleValueChange(testId, Math.round(icumsa).toString(), "Colour");
      } else {
        handleValueChange(testId, "", "Colour");
      }

      return { ...prev, [testId]: updated };
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const executions = await WorkflowApi.getWorkflowExecutions(sample.id);
      const activeExec = executions.find((e) => e.status === "IN_PROGRESS");

      // PASS 1: Parallel Data Persistence (Fast)
      const savedTests = await Promise.all(
        tests.map(async (test) => {
          const rawValue = parseFloat(values[test.id]);
          let savedTestId = test.id;

          const payload: Partial<TestResult> = {
            sample_id: sample.id,
            test_type: test.test_type,
            raw_value: rawValue,
            calculated_value: rawValue,
            unit: TEST_VALIDATION_RULES[test.test_type as TestType]?.unit || "N/A",
            status: "VALIDATING" as any,
            notes: notes[test.id] || undefined,
            params: test.test_type === "Colour" ? colourParams[test.id] : undefined,
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
      if (activeExec?.step_executions) {
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

      toast.success("Analysis finalized and sent for validation.");

      if (onComplete) {
        onComplete();
      }
    } catch (err) {
      console.error("Failed to save test results", err);
      toast.error("Failed to save test results. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return {
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
  };
};
