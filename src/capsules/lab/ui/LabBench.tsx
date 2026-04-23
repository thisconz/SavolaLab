import React, { memo, useState, useCallback, useRef, useEffect } from "react";
import {
  FlaskConical,
  CheckCircle2,
  AlertTriangle,
  Info,
  Activity,
  Save,
  ThumbsDown,
  ThumbsUp,
  ChevronDown,
  ChevronUp,
  Keyboard,
  RotateCcw,
  Eye,
  EyeOff,
} from "lucide-react";
import { Sample, TestResult, TestType } from "../../../core/types";
import { LabPanel } from "../../../shared/components/LabPanel";
import { useLabBench } from "../hooks/useLabBench";
import { TEST_VALIDATION_RULES } from "../constants/validation.constants";
import { motion, AnimatePresence } from "@/src/lib/motion";
import { StatusPill } from "../../../shared/components/StatusPill";
import clsx from "@/src/lib/clsx";

interface LabBenchProps {
  sample: Sample;
  onComplete: () => void;
}

// ─────────────────────────────────────────────
// TestCard sub-component (unchanged)
// ─────────────────────────────────────────────

interface TestCardProps {
  test: TestResult;
  value: string;
  note: string;
  error?: string;
  colourParams?: { absorbance: string; brix: string; cellLength: string };
  previousResults?: any[];
  isReviewing: boolean;
  reviewComment: string;
  onValueChange: (val: string) => void;
  onNoteChange: (val: string) => void;
  onColourParam: (param: "absorbance" | "brix" | "cellLength", val: string) => void;
  onReviewStart: () => void;
  onReviewCancel: () => void;
  onReviewComment: (val: string) => void;
  onApprove: () => void;
  onDisapprove: () => void;
  inputRef?: React.RefObject<HTMLInputElement | null>;
}

const TestCard: React.FC<TestCardProps> = ({
  test,
  value,
  note,
  error,
  colourParams,
  previousResults = [],
  isReviewing,
  reviewComment,
  onValueChange,
  onNoteChange,
  onColourParam,
  onReviewStart,
  onReviewCancel,
  onReviewComment,
  onApprove,
  onDisapprove,
  inputRef,
}) => {
  const [showHistory, setShowHistory] = useState(false);
  const rule = TEST_VALIDATION_RULES[test.test_type as TestType];

  const canInput = test.status === "PENDING" || test.status === "VALIDATING" || test.id < 0;
  const canReview = test.status === "VALIDATING" && test.id > 0;

  const numVal = parseFloat(value);
  const hasValue = !isNaN(numVal) && value !== "";
  const rangePercent =
    rule && hasValue
      ? Math.min(100, Math.max(0, ((numVal - rule.min) / (rule.max - rule.min)) * 100))
      : null;
  const isOutOfRange = rule && hasValue && (numVal < rule.min || numVal > rule.max);

  const statusConfig = {
    PENDING: { variant: "info" as const, label: "Pending" },
    VALIDATING: { variant: "warning" as const, label: "Validating" },
    APPROVED: { variant: "success" as const, label: "Approved" },
    DISAPPROVED: { variant: "critical" as const, label: "Rejected" },
    COMPLETED: { variant: "success" as const, label: "Completed" },
  }[test.status] ?? { variant: "neutral" as const, label: test.status };

  return (
    <motion.div
      layout
      className={clsx(
        "rounded-2xl border transition-all duration-300 overflow-hidden",
        error
          ? "border-red-400/40 bg-red-500/5"
          : isOutOfRange
            ? "border-amber-400/40 bg-amber-500/5"
            : hasValue && !error
              ? "border-emerald-400/20 bg-emerald-500/5"
              : "border-(--color-zenthar-steel) bg-(--color-zenthar-carbon)/60",
      )}
    >
      {/* Card Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-(--color-zenthar-steel)/40">
        <div className="flex items-center gap-3">
          <div
            className={clsx(
              "w-2 h-2 rounded-full",
              error
                ? "bg-red-400"
                : isOutOfRange
                  ? "bg-amber-400"
                  : hasValue
                    ? "bg-emerald-400"
                    : "bg-brand-sage/30",
            )}
          />
          <span className="text-[11px] font-black text-(--color-zenthar-text-primary) uppercase tracking-wider">
            {test.test_type}
          </span>
          {rule?.description && (
            <div className="group relative">
              <Info
                size={12}
                className="text-brand-sage/40 hover:text-brand-primary cursor-help transition-colors"
              />
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-(--color-zenthar-carbon) border border-(--color-zenthar-steel) text-[10px] rounded-xl opacity-0 group-hover:opacity-100 whitespace-nowrap z-30 shadow-xl pointer-events-none">
                {rule.description} — Range: {rule.min}–{rule.max} {rule.unit}
              </div>
            </div>
          )}
          {rule?.suggestion && (
            <span className="text-[8px] font-mono text-brand-primary/50 bg-brand-primary/5 px-2 py-0.5 rounded border border-brand-primary/10">
              {rule.suggestion}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {previousResults.length > 0 && (
            <button
              onClick={() => setShowHistory((v) => !v)}
              className="text-[8px] font-bold text-brand-sage/60 hover:text-brand-primary uppercase tracking-widest flex items-center gap-1 transition-colors"
            >
              History {showHistory ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
            </button>
          )}
          <StatusPill label={statusConfig.label} variant={statusConfig.variant} />
        </div>
      </div>

      {/* Previous results */}
      <AnimatePresence>
        {showHistory && previousResults.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-b border-(--color-zenthar-steel)/30 bg-(--color-zenthar-void)/50"
          >
            <div className="px-5 py-3 flex gap-4 flex-wrap">
              <span className="text-[8px] font-black text-brand-sage/50 uppercase tracking-widest w-full">
                Previous results for this stage:
              </span>
              {previousResults.slice(0, 5).map((r: any, i: number) => (
                <div key={i} className="flex items-center gap-2 text-[10px] font-mono">
                  <span className="text-brand-primary font-bold">{r.raw_value}</span>
                  <span className="text-brand-sage/50">{rule?.unit}</span>
                  <span className="text-brand-sage/30 text-[8px]">
                    {new Date(r.performed_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Area */}
      <div className="p-5 grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-4 items-start">
        <div className="flex flex-col gap-2">
          <label className="text-[8px] font-black text-brand-sage uppercase tracking-widest">
            Measurement
          </label>
          {test.test_type === "Colour" ? (
            <div className="flex flex-col gap-2">
              {(["absorbance", "brix", "cellLength"] as const).map((param) => (
                <input
                  key={param}
                  type="number"
                  step="0.001"
                  value={colourParams?.[param] ?? ""}
                  onChange={(e) => onColourParam(param, e.target.value)}
                  placeholder={
                    param === "absorbance"
                      ? "Absorbance"
                      : param === "brix"
                        ? "Brix %"
                        : "Cell Length (cm)"
                  }
                  disabled={!canInput}
                  className="w-full bg-(--color-zenthar-void) border border-(--color-zenthar-steel) rounded-xl px-3 py-2.5 text-xs font-mono focus:outline-none focus:border-brand-primary disabled:opacity-40 text-(--color-zenthar-text-primary)"
                />
              ))}
            </div>
          ) : (
            <div className="relative">
              <input
                ref={inputRef}
                type="number"
                step={rule?.step ?? "any"}
                value={value}
                onChange={(e) => onValueChange(e.target.value)}
                placeholder={rule ? `${rule.min} – ${rule.max}` : "Value"}
                disabled={!canInput}
                className={clsx(
                  "w-full bg-(--color-zenthar-void) border rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 transition-all disabled:opacity-40 text-(--color-zenthar-text-primary) placeholder:text-brand-sage/30",
                  error
                    ? "border-red-400/60 focus:border-red-400 focus:ring-red-400/20 text-red-400"
                    : isOutOfRange
                      ? "border-amber-400/60 focus:border-amber-400 focus:ring-amber-400/20"
                      : "border-(--color-zenthar-steel) focus:border-brand-primary focus:ring-brand-primary/10",
                )}
              />
              {hasValue && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  {isOutOfRange ? (
                    <AlertTriangle size={14} className="text-amber-400" />
                  ) : (
                    <CheckCircle2 size={14} className="text-emerald-400" />
                  )}
                  <span className="text-[9px] font-mono text-brand-sage/60">{rule?.unit}</span>
                </div>
              )}
            </div>
          )}
          {error && (
            <p className="text-[10px] font-bold text-red-400 flex items-center gap-1">
              <AlertTriangle size={10} /> {error}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[8px] font-black text-brand-sage uppercase tracking-widest">
            Range Check
          </label>
          <div className="h-[50px] flex flex-col justify-center gap-2">
            <div className="text-center">
              <span
                className={clsx(
                  "text-xl font-mono font-black",
                  !hasValue
                    ? "text-brand-sage/30"
                    : isOutOfRange
                      ? "text-amber-400"
                      : "text-emerald-400",
                )}
              >
                {hasValue ? value : "—"}
              </span>
              {rule && hasValue && (
                <span className="text-[9px] font-mono text-brand-sage/50 ml-1">{rule.unit}</span>
              )}
            </div>
            {rule && (
              <>
                <div className="flex justify-between text-[8px] font-mono text-brand-sage/40">
                  <span>{rule.min}</span>
                  <span>{rule.max}</span>
                </div>
                <div className="relative h-1.5 w-full bg-(--color-zenthar-steel) rounded-full overflow-hidden">
                  <div className="absolute inset-x-[25%] inset-y-0 bg-emerald-500/20 rounded-full" />
                  {rangePercent !== null && (
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${rangePercent}%` }}
                      className={clsx(
                        "absolute left-0 h-full rounded-full transition-colors",
                        isOutOfRange ? "bg-amber-400" : "bg-emerald-500",
                      )}
                    />
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2 min-w-[140px]">
          <label className="text-[8px] font-black text-brand-sage uppercase tracking-widest">
            Notes
          </label>
          <input
            type="text"
            value={note}
            onChange={(e) => onNoteChange(e.target.value)}
            placeholder="Optional..."
            disabled={!canInput}
            className="w-full bg-(--color-zenthar-void) border border-(--color-zenthar-steel) rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-brand-primary disabled:opacity-40 text-(--color-zenthar-text-primary)"
          />
          {canReview &&
            (isReviewing ? (
              <div className="flex flex-col gap-2 mt-1">
                <input
                  autoFocus
                  type="text"
                  value={reviewComment}
                  onChange={(e) => onReviewComment(e.target.value)}
                  placeholder="Review comment..."
                  className="w-full bg-(--color-zenthar-void) border border-(--color-zenthar-steel) rounded-lg px-2.5 py-2 text-xs focus:outline-none focus:border-brand-primary text-(--color-zenthar-text-primary)"
                />
                <div className="grid grid-cols-2 gap-1">
                  <button
                    onClick={onApprove}
                    className="flex items-center justify-center gap-1 py-1.5 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-500 hover:text-white border border-emerald-500/30 rounded-lg text-[9px] font-black uppercase transition-all"
                  >
                    <ThumbsUp size={10} /> Pass
                  </button>
                  <button
                    onClick={onDisapprove}
                    className="flex items-center justify-center gap-1 py-1.5 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/30 rounded-lg text-[9px] font-black uppercase transition-all"
                  >
                    <ThumbsDown size={10} /> Fail
                  </button>
                </div>
                <button
                  onClick={onReviewCancel}
                  className="text-[8px] font-bold text-brand-sage/50 hover:text-brand-sage uppercase text-center transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={onReviewStart}
                className="mt-1 px-3 py-2 bg-brand-primary/10 hover:bg-brand-primary text-brand-primary hover:text-white border border-brand-primary/20 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all"
              >
                Review
              </button>
            ))}
        </div>
      </div>
    </motion.div>
  );
};

// ─────────────────────────────────────────────
// Main LabBench — keyboard fix applied
// ─────────────────────────────────────────────

export const LabBench: React.FC<LabBenchProps> = memo(({ sample, onComplete }) => {
  const {
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
  } = useLabBench(sample, onComplete);

  const [reviewState, setReviewState] = useState<{
    id: number | null;
    comment: string;
  }>({ id: null, comment: "" });
  const [showShortcuts, setShowShortcuts] = useState(false);

  const firstInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (!loading && tests.length > 0) {
      setTimeout(() => firstInputRef.current?.focus(), 150);
    }
  }, [loading, tests.length]);

  const hasErrors = Object.values(errors).some(Boolean);
  const filledCount = tests.filter((t) => {
    if (t.test_type === "Colour") {
      const p = colourParams[t.id];
      return p?.absorbance && p?.brix && p?.cellLength;
    }
    return (values[t.id] ?? "") !== "";
  }).length;
  const allFilled = tests.length > 0 && filledCount === tests.length;
  const progress = tests.length > 0 ? (filledCount / tests.length) * 100 : 0;

  // ─── FIX #04: proper dependency array prevents listener accumulation ─────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        if (!hasErrors && allFilled && !isSaving) handleSave();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [hasErrors, allFilled, isSaving, handleSave]); // ← FIX: was missing

  return (
    <LabPanel
      title="Lab Bench"
      icon={FlaskConical}
      loading={loading}
      actions={
        <button
          onClick={() => setShowShortcuts((v) => !v)}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-(--color-zenthar-steel) text-brand-sage hover:text-brand-primary text-[9px] font-bold uppercase tracking-widest transition-colors"
        >
          <Keyboard size={12} /> Shortcuts
        </button>
      }
    >
      <div className="flex flex-col h-full gap-5">
        <AnimatePresence>
          {showShortcuts && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="p-4 bg-(--color-zenthar-void) border border-brand-primary/20 rounded-2xl text-[10px] font-mono grid grid-cols-2 gap-2"
            >
              <div className="flex justify-between gap-4">
                <span className="text-brand-sage/60">Save analysis</span>
                <kbd className="px-2 py-0.5 bg-(--color-zenthar-steel) rounded text-brand-primary">
                  ⌘ + Enter
                </kbd>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-brand-sage/60">Next field</span>
                <kbd className="px-2 py-0.5 bg-(--color-zenthar-steel) rounded text-brand-primary">
                  Tab
                </kbd>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sample info banner */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-5 bg-linear-to-r from-brand-primary/10 via-brand-primary/5 to-transparent rounded-3xl border border-brand-primary/20">
          <div className="p-3 bg-(--color-zenthar-void) rounded-2xl border border-brand-primary/20 shrink-0">
            <Activity className="w-6 h-6 text-brand-primary animate-pulse" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-base font-black text-(--color-zenthar-text-primary) uppercase tracking-tight">
              {sample.batch_id ?? `Sample #${sample.id}`}
            </h4>
            <div className="flex flex-wrap items-center gap-2 mt-1 text-[10px] font-mono text-brand-sage uppercase">
              <span className="bg-(--color-zenthar-void) px-2 py-0.5 rounded border border-brand-primary/10 text-brand-primary">
                {sample.source_stage ?? sample.sample_type ?? "—"}
              </span>
              <span className="bg-(--color-zenthar-void) px-2 py-0.5 rounded border border-(--color-zenthar-steel)">
                {tests.length} tests
              </span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <span className="text-[9px] font-black text-brand-sage/60 uppercase tracking-widest">
              {filledCount}/{tests.length} filled
            </span>
            <div className="w-32 h-1.5 bg-(--color-zenthar-steel) rounded-full overflow-hidden">
              <motion.div
                animate={{ width: `${progress}%` }}
                transition={{ type: "spring", stiffness: 80 }}
                className={clsx(
                  "h-full rounded-full",
                  progress === 100 ? "bg-emerald-400" : "bg-brand-primary",
                )}
              />
            </div>
          </div>
        </div>

        {/* Test cards */}
        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-1">
          {tests.map((test, idx) => (
            <TestCard
              key={test.id}
              test={test}
              value={values[test.id] ?? ""}
              note={notes[test.id] ?? ""}
              error={errors[test.id]}
              colourParams={colourParams[test.id]}
              previousResults={previousResults[test.test_type] ?? []}
              isReviewing={reviewState.id === test.id}
              reviewComment={reviewState.comment}
              onValueChange={(v) => handleValueChange(test.id, v, test.test_type)}
              onNoteChange={(v) => handleNoteChange(test.id, v)}
              onColourParam={(p, v) => handleColourParamChange(test.id, p, v)}
              onReviewStart={() => setReviewState({ id: test.id, comment: "" })}
              onReviewCancel={() => setReviewState({ id: null, comment: "" })}
              onReviewComment={(v) => setReviewState((s) => ({ ...s, comment: v }))}
              onApprove={() => {
                handleReview(test.id, "APPROVED", reviewState.comment || undefined);
                setReviewState({ id: null, comment: "" });
              }}
              onDisapprove={() => {
                handleReview(test.id, "DISAPPROVED", reviewState.comment || undefined);
                setReviewState({ id: null, comment: "" });
              }}
              inputRef={idx === 0 ? firstInputRef : undefined}
            />
          ))}
        </div>

        {/* Save footer */}
        <div className="pt-5 border-t border-(--color-zenthar-steel)/40 space-y-3">
          {hasErrors && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
              <AlertTriangle size={14} className="text-red-400 shrink-0" />
              <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest">
                Fix validation errors before finalising
              </p>
            </div>
          )}
          <button
            onClick={handleSave}
            disabled={hasErrors || !allFilled || isSaving}
            className={clsx(
              "w-full py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-xs transition-all",
              "flex items-center justify-center gap-3 shadow-xl",
              hasErrors || !allFilled || isSaving
                ? "bg-(--color-zenthar-carbon) text-brand-sage/40 cursor-not-allowed border border-(--color-zenthar-steel) shadow-none"
                : "bg-brand-primary text-(--color-zenthar-void) shadow-brand-primary/30 hover:bg-brand-primary/90 active:scale-[0.98]",
            )}
          >
            {isSaving ? (
              <div className="w-5 h-5 border-2 border-(--color-zenthar-void)/30 border-t-(--color-zenthar-void) rounded-full animate-spin" />
            ) : (
              <>
                <Save className="w-5 h-5" /> Finalise Analysis{" "}
                <kbd className="text-[8px] opacity-60">⌘+Enter</kbd>
              </>
            )}
          </button>
          <p className="text-[9px] text-brand-sage/40 font-mono text-center uppercase tracking-widest">
            Results are immutable once submitted — double-check before saving
          </p>
        </div>
      </div>
    </LabPanel>
  );
});

LabBench.displayName = "LabBench";
