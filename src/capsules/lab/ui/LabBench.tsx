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
import { motion, AnimatePresence } from "framer-motion";
import { StatusPill } from "../../../shared/components/StatusPill";
import clsx from "clsx";

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
    rule && hasValue ? Math.min(100, Math.max(0, ((numVal - rule.min) / (rule.max - rule.min)) * 100)) : null;
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
        "overflow-hidden rounded-2xl border transition-all duration-300",
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
      <div className="flex items-center justify-between border-b border-(--color-zenthar-steel)/40 px-5 py-3">
        <div className="flex items-center gap-3">
          <div
            className={clsx(
              "h-2 w-2 rounded-full",
              error
                ? "bg-red-400"
                : isOutOfRange
                  ? "bg-amber-400"
                  : hasValue
                    ? "bg-emerald-400"
                    : "bg-brand-sage/30",
            )}
          />
          <span className="text-[11px] font-black tracking-wider text-(--color-zenthar-text-primary) uppercase">
            {test.test_type}
          </span>
          {rule?.description && (
            <div className="group relative">
              <Info
                size={12}
                className="text-brand-sage/40 hover:text-brand-primary cursor-help transition-colors"
              />
              <div className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 -translate-x-1/2 rounded-xl border border-(--color-zenthar-steel) bg-(--color-zenthar-carbon) px-3 py-2 text-[10px] whitespace-nowrap opacity-0 shadow-xl group-hover:opacity-100">
                {rule.description} — Range: {rule.min}–{rule.max} {rule.unit}
              </div>
            </div>
          )}
          {rule?.suggestion && (
            <span className="text-brand-primary/50 bg-brand-primary/5 border-brand-primary/10 rounded border px-2 py-0.5 font-mono text-[8px]">
              {rule.suggestion}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {previousResults.length > 0 && (
            <button
              onClick={() => setShowHistory((v) => !v)}
              className="text-brand-sage/60 hover:text-brand-primary flex items-center gap-1 text-[8px] font-bold tracking-widest uppercase transition-colors"
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
            <div className="flex flex-wrap gap-4 px-5 py-3">
              <span className="text-brand-sage/50 w-full text-[8px] font-black tracking-widest uppercase">
                Previous results for this stage:
              </span>
              {previousResults.slice(0, 5).map((r: any, i: number) => (
                <div key={i} className="flex items-center gap-2 font-mono text-[10px]">
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
      <div className="grid grid-cols-1 items-start gap-4 p-5 md:grid-cols-[1fr_1fr_auto]">
        <div className="flex flex-col gap-2">
          <label className="text-brand-sage text-[8px] font-black tracking-widest uppercase">
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
                    param === "absorbance" ? "Absorbance" : param === "brix" ? "Brix %" : "Cell Length (cm)"
                  }
                  disabled={!canInput}
                  className="focus:border-brand-primary w-full rounded-xl border border-(--color-zenthar-steel) bg-(--color-zenthar-void) px-3 py-2.5 font-mono text-xs text-(--color-zenthar-text-primary) focus:outline-none disabled:opacity-40"
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
                  "placeholder:text-brand-sage/30 w-full rounded-xl border bg-(--color-zenthar-void) px-4 py-3 font-mono text-sm text-(--color-zenthar-text-primary) transition-all focus:ring-2 focus:outline-none disabled:opacity-40",
                  error
                    ? "border-red-400/60 text-red-400 focus:border-red-400 focus:ring-red-400/20"
                    : isOutOfRange
                      ? "border-amber-400/60 focus:border-amber-400 focus:ring-amber-400/20"
                      : "focus:border-brand-primary focus:ring-brand-primary/10 border-(--color-zenthar-steel)",
                )}
              />
              {hasValue && (
                <div className="absolute top-1/2 right-3 flex -translate-y-1/2 items-center gap-1">
                  {isOutOfRange ? (
                    <AlertTriangle size={14} className="text-amber-400" />
                  ) : (
                    <CheckCircle2 size={14} className="text-emerald-400" />
                  )}
                  <span className="text-brand-sage/60 font-mono text-[9px]">{rule?.unit}</span>
                </div>
              )}
            </div>
          )}
          {error && (
            <p className="flex items-center gap-1 text-[10px] font-bold text-red-400">
              <AlertTriangle size={10} /> {error}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-brand-sage text-[8px] font-black tracking-widest uppercase">
            Range Check
          </label>
          <div className="flex h-[50px] flex-col justify-center gap-2">
            <div className="text-center">
              <span
                className={clsx(
                  "font-mono text-xl font-black",
                  !hasValue ? "text-brand-sage/30" : isOutOfRange ? "text-amber-400" : "text-emerald-400",
                )}
              >
                {hasValue ? value : "—"}
              </span>
              {rule && hasValue && (
                <span className="text-brand-sage/50 ml-1 font-mono text-[9px]">{rule.unit}</span>
              )}
            </div>
            {rule && (
              <>
                <div className="text-brand-sage/40 flex justify-between font-mono text-[8px]">
                  <span>{rule.min}</span>
                  <span>{rule.max}</span>
                </div>
                <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-(--color-zenthar-steel)">
                  <div className="absolute inset-x-[25%] inset-y-0 rounded-full bg-emerald-500/20" />
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

        <div className="flex min-w-[140px] flex-col gap-2">
          <label className="text-brand-sage text-[8px] font-black tracking-widest uppercase">Notes</label>
          <input
            type="text"
            value={note}
            onChange={(e) => onNoteChange(e.target.value)}
            placeholder="Optional..."
            disabled={!canInput}
            className="focus:border-brand-primary w-full rounded-xl border border-(--color-zenthar-steel) bg-(--color-zenthar-void) px-3 py-2.5 text-xs text-(--color-zenthar-text-primary) focus:outline-none disabled:opacity-40"
          />
          {canReview &&
            (isReviewing ? (
              <div className="mt-1 flex flex-col gap-2">
                <input
                  autoFocus
                  type="text"
                  value={reviewComment}
                  onChange={(e) => onReviewComment(e.target.value)}
                  placeholder="Review comment..."
                  className="focus:border-brand-primary w-full rounded-lg border border-(--color-zenthar-steel) bg-(--color-zenthar-void) px-2.5 py-2 text-xs text-(--color-zenthar-text-primary) focus:outline-none"
                />
                <div className="grid grid-cols-2 gap-1">
                  <button
                    onClick={onApprove}
                    className="flex items-center justify-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 py-1.5 text-[9px] font-black text-emerald-500 uppercase transition-all hover:bg-emerald-500 hover:text-white"
                  >
                    <ThumbsUp size={10} /> Pass
                  </button>
                  <button
                    onClick={onDisapprove}
                    className="flex items-center justify-center gap-1 rounded-lg border border-red-500/30 bg-red-500/10 py-1.5 text-[9px] font-black text-red-500 uppercase transition-all hover:bg-red-500 hover:text-white"
                  >
                    <ThumbsDown size={10} /> Fail
                  </button>
                </div>
                <button
                  onClick={onReviewCancel}
                  className="text-brand-sage/50 hover:text-brand-sage text-center text-[8px] font-bold uppercase transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={onReviewStart}
                className="bg-brand-primary/10 hover:bg-brand-primary text-brand-primary border-brand-primary/20 mt-1 rounded-lg border px-3 py-2 text-[9px] font-black tracking-widest uppercase transition-all hover:text-white"
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
          className="text-brand-sage hover:text-brand-primary flex items-center gap-1.5 rounded-lg bg-(--color-zenthar-steel) px-2.5 py-1 text-[9px] font-bold tracking-widest uppercase transition-colors"
        >
          <Keyboard size={12} /> Shortcuts
        </button>
      }
    >
      <div className="flex h-full flex-col gap-5">
        <AnimatePresence>
          {showShortcuts && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="border-brand-primary/20 grid grid-cols-2 gap-2 rounded-2xl border bg-(--color-zenthar-void) p-4 font-mono text-[10px]"
            >
              <div className="flex justify-between gap-4">
                <span className="text-brand-sage/60">Save analysis</span>
                <kbd className="text-brand-primary rounded bg-(--color-zenthar-steel) px-2 py-0.5">
                  ⌘ + Enter
                </kbd>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-brand-sage/60">Next field</span>
                <kbd className="text-brand-primary rounded bg-(--color-zenthar-steel) px-2 py-0.5">Tab</kbd>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sample info banner */}
        <div className="from-brand-primary/10 via-brand-primary/5 border-brand-primary/20 flex flex-col items-start gap-4 rounded-3xl border bg-linear-to-r to-transparent p-5 sm:flex-row sm:items-center">
          <div className="border-brand-primary/20 shrink-0 rounded-2xl border bg-(--color-zenthar-void) p-3">
            <Activity className="text-brand-primary h-6 w-6 animate-pulse" />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-base font-black tracking-tight text-(--color-zenthar-text-primary) uppercase">
              {sample.batch_id ?? `Sample #${sample.id}`}
            </h4>
            <div className="text-brand-sage mt-1 flex flex-wrap items-center gap-2 font-mono text-[10px] uppercase">
              <span className="border-brand-primary/10 text-brand-primary rounded border bg-(--color-zenthar-void) px-2 py-0.5">
                {sample.source_stage ?? sample.sample_type ?? "—"}
              </span>
              <span className="rounded border border-(--color-zenthar-steel) bg-(--color-zenthar-void) px-2 py-0.5">
                {tests.length} tests
              </span>
            </div>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1.5">
            <span className="text-brand-sage/60 text-[9px] font-black tracking-widest uppercase">
              {filledCount}/{tests.length} filled
            </span>
            <div className="h-1.5 w-32 overflow-hidden rounded-full bg-(--color-zenthar-steel)">
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
        <div className="custom-scrollbar flex-1 space-y-3 overflow-y-auto pr-1">
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
        <div className="space-y-3 border-t border-(--color-zenthar-steel)/40 pt-5">
          {hasErrors && (
            <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-3">
              <AlertTriangle size={14} className="shrink-0 text-red-400" />
              <p className="text-[10px] font-bold tracking-widest text-red-400 uppercase">
                Fix validation errors before finalising
              </p>
            </div>
          )}
          <button
            onClick={handleSave}
            disabled={hasErrors || !allFilled || isSaving}
            className={clsx(
              "w-full rounded-2xl py-4 text-xs font-black tracking-[0.2em] uppercase transition-all",
              "flex items-center justify-center gap-3 shadow-xl",
              hasErrors || !allFilled || isSaving
                ? "text-brand-sage/40 cursor-not-allowed border border-(--color-zenthar-steel) bg-(--color-zenthar-carbon) shadow-none"
                : "bg-brand-primary shadow-brand-primary/30 hover:bg-brand-primary/90 text-(--color-zenthar-void) active:scale-[0.98]",
            )}
          >
            {isSaving ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-(--color-zenthar-void)/30 border-t-(--color-zenthar-void)" />
            ) : (
              <>
                <Save className="h-5 w-5" /> Finalise Analysis{" "}
                <kbd className="text-[8px] opacity-60">⌘+Enter</kbd>
              </>
            )}
          </button>
          <p className="text-brand-sage/40 text-center font-mono text-[9px] tracking-widest uppercase">
            Results are immutable once submitted — double-check before saving
          </p>
        </div>
      </div>
    </LabPanel>
  );
});

LabBench.displayName = "LabBench";
