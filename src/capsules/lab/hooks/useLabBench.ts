import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import { LabApi } from "../api/lab.api";
import { WorkflowApi } from "../../workflows/api/workflow.api";
import type { Sample } from "../../../shared/schemas/sample.schema";
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
  const [colourParams, setColourParams] = useState<
    Record<number, { absorbance: string; brix: string; cellLength: string }>
  >({});
  const [previousResults, setPreviousResults] = useState<Record<string, any[]>>({});
  const [isSaving, setIsSaving] = useState(false);
  const mountedRef = useRef(true);

  // ─── Load tests ──────────────────────────────────────────────────────────

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const loadTests = useCallback(async () => {
    setLoading(true);
    const abortCtrl = new AbortController();
    try {
      const data = await LabApi.getSampleTests(sample.id);
      setTests(data);

      const initValues: Record<number, string> = {};
      const initNotes: Record<number, string> = {};
      const initColourParams: Record<number, any> = {};

      for (const t of data) {
        initValues[t.id] = t.raw_value?.toString() ?? "";
        initNotes[t.id] = t.notes ?? "";

        if (t.test_type === "Colour") {
          let p = { absorbance: "", brix: "50", cellLength: "1" };
          if (t.params) {
            try {
              const parsed = typeof t.params === "string" ? JSON.parse(t.params) : t.params;
              p = { ...p, ...parsed };
            } catch {
              /* ignore malformed params */
            }
          }
          initColourParams[t.id] = p;
        }
      }

      setValues(initValues);
      setNotes(initNotes);
      setColourParams(initColourParams);

      // Load history per test type (no duplicate fetches)
      const seen = new Set<string>();
      for (const t of data) {
        if (seen.has(t.test_type)) continue;
        seen.add(t.test_type);
        LabApi.getPreviousResults(sample.source_stage ?? "", t.test_type, 3)
          .then((res) => {
            if (!abortCtrl.signal.aborted && mountedRef.current) {
              setPreviousResults((prev) => ({ ...prev, [t.test_type]: res }));
            }
          })
          .catch((err) => {
            if (err.name !== "AbortError") console.warn("Previous results fetch failed", err);
          });
      }
    } catch (err) {
      console.error("Failed to load tests:", err);
      toast.error("Could not load test panel.");
    } finally {
      setLoading(false);
    }

    return () => abortCtrl.abort();
  }, [sample.id, sample.source_stage]);

  useEffect(() => {
    let cleanup: (() => void) | void;
    loadTests().then((c) => {
      cleanup = c;
    });
    return () => {
      if (typeof cleanup === "function") cleanup();
    };
  }, [sample.id]);

  // ─── Validation ──────────────────────────────────────────────────────────

  const validateField = (testId: number, value: string, testType: string) => {
    if (!value) {
      setErrors((p) => {
        const n = { ...p };
        delete n[testId];
        return n;
      });
      return;
    }

    const rule = TEST_VALIDATION_RULES[testType as TestType];
    if (!rule) return;

    const num = parseFloat(value);
    if (isNaN(num)) {
      setErrors((p) => ({ ...p, [testId]: "Invalid number" }));
      return;
    }

    if (num < rule.min || num > rule.max) {
      setErrors((p) => ({
        ...p,
        [testId]: `Out of range (${rule.min}–${rule.max} ${rule.unit})`,
      }));
    } else {
      setErrors((p) => {
        const n = { ...p };
        delete n[testId];
        return n;
      });
    }
  };

  const handleValueChange = (testId: number, value: string, testType: string) => {
    setValues((p) => ({ ...p, [testId]: value }));
    validateField(testId, value, testType);
  };

  const handleNoteChange = (testId: number, value: string) => {
    setNotes((p) => ({ ...p, [testId]: value }));
  };

  const handleColourParamChange = (
    testId: number,
    param: "absorbance" | "brix" | "cellLength",
    val: string,
  ) => {
    setColourParams((prev) => {
      const current = prev[testId] ?? {
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

  // ─── Save ─────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const executions = await WorkflowApi.getWorkflowExecutions(sample.id);
      const activeExec = executions.find((e) => e.status === "IN_PROGRESS");
      const localSteps = activeExec?.step_executions ? [...activeExec.step_executions] : [];

      // ── Pass 1: persist test data ─────────────────────────────────────────
      const savedTests: { id: number; type: string; value: number }[] = [];

      for (const test of tests) {
        const rawValue = parseFloat(values[test.id]);
        if (isNaN(rawValue)) continue;

        const payload: Partial<TestResult> = {
          sample_id: sample.id,
          test_type: test.test_type as any,
          raw_value: rawValue,
          calculated_value: rawValue,
          unit: TEST_VALIDATION_RULES[test.test_type as TestType]?.unit ?? "N/A",
          status: "VALIDATING" as any,
          notes: notes[test.id] || undefined,
          params: test.test_type === "Colour" ? colourParams[test.id] : undefined,
        };

        let savedId = test.id;

        if (test.id < 0) {
          // Template test — create it for real
          const res = await LabApi.createTest(payload);
          savedId = res.id;
        } else {
          await LabApi.updateTest(test.id, payload);
        }

        savedTests.push({ id: savedId, type: test.test_type, value: rawValue });
      }

      // ── Pass 2: advance workflow steps ────────────────────────────────────
      if (activeExec) {
        for (const result of savedTests) {
          const stepIdx = localSteps.findIndex(
            (s) => s.test_type === result.type && (s.status === "IN_PROGRESS" || s.status === "PENDING"),
          );
          if (stepIdx === -1) continue;

          const step = localSteps[stepIdx];
          await WorkflowApi.completeStep(activeExec.id, step.step_id, {
            status: "COMPLETED",
            test_id: result.id,
            result_value: result.value,
          });
          localSteps[stepIdx] = {
            ...step,
            status: WorkflowStepExecutionStatus.COMPLETED,
          };
        }
      }

      // ── Pass 3: advance sample status ─────────────────────────────────────
      await LabApi.updateSample(sample.id, {
        status: SampleStatus.VALIDATING,
        priority: SamplePriority.NORMAL,
      } as any);

      toast.success("Analysis finalised — sent for validation.");
      onComplete?.();
    } catch (err) {
      console.error("Failed to save test results:", err);
      toast.error("Save failed. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // ─── Review ────────────────────────────────────────────────────────────────

  const handleReview = async (testId: number, status: "APPROVED" | "DISAPPROVED", comment?: string) => {
    try {
      await LabApi.reviewTest(testId, status, comment);
      toast.success(`Test ${status.toLowerCase()} successfully.`);
      loadTests();
    } catch (err) {
      console.error("Failed to review test:", err);
      toast.error("Review failed.");
    }
  };

  return {
    tests,
    loading,
    values,
    notes,
    errors,
    colourParams,
    previousResults,
    isSaving,
    handleValueChange,
    handleNoteChange,
    handleColourParamChange,
    handleSave,
    handleReview,
  };
};
