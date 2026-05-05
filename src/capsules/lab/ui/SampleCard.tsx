import React, { memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FlaskConical,
  Clock,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  ListChecks,
  Activity,
  Tag,
  Zap,
} from "lucide-react";
import { type Sample, SampleStatus } from "../../../core/types";
import { PriorityBadge } from "../../../shared/components/PriorityBadge";

interface SampleCardProps {
  sample: Sample;
  active: boolean;
  onClick: () => void;
}

export const SampleCard: React.FC<SampleCardProps> = memo(({ sample, active, onClick }) => {
  const isStat = sample.priority === "STAT";
  const isTesting = sample.status === SampleStatus.VALIDATING;
  const testCount = sample.test_count ?? 0;

  // Derive a readable stage label from available fields
  const stageLabel = sample.source_stage ?? sample.sample_type ?? "Standard Sample";

  return (
    <motion.button
      layout
      whileHover={{ x: 6 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`group relative w-full overflow-hidden rounded-[1.25rem] border text-left transition-all duration-300 outline-none ${
        active
          ? "border-brand-primary/40 shadow-brand-primary/10 ring-brand-primary/5 bg-(--color-zenthar-graphite) shadow-xl ring-1"
          : "border-brand-sage/10 hover:border-brand-primary/20 bg-(--color-zenthar-carbon)/80 shadow-sm"
      } `}
    >
      {/* STAT / ACTIVE / IDLE indicator strip */}
      <div
        className={`absolute top-0 bottom-0 left-0 z-20 w-1.5 transition-all duration-500 ${
          isStat
            ? "bg-lab-laser animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.5)]"
            : active
              ? "bg-brand-primary"
              : "bg-brand-sage/20"
        } `}
      />

      <div className="relative z-10 flex flex-col gap-3 p-4 pl-6">
        {/* TOP ROW: ID & PRIORITY */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={`font-mono text-[10px] font-black tracking-widest tabular-nums ${active ? "text-white" : "text-brand-sage"}`}
            >
              #{sample.batch_id ?? `ID-${sample.id}`}
            </span>
            {isStat && (
              <span className="bg-lab-laser/10 text-lab-laser flex items-center gap-1 rounded px-1.5 py-0.5 text-[8px] font-black tracking-tighter uppercase">
                <Zap size={8} fill="currentColor" />
                STAT
              </span>
            )}
          </div>
          <PriorityBadge priority={sample.priority as any} />
        </div>

        {/* MAIN ROW: ICON + TYPE */}
        <div className="flex items-center gap-4">
          <div
            className={`flex h-11 w-11 items-center justify-center rounded-xl transition-all duration-500 ${
              active
                ? isStat
                  ? "bg-lab-laser shadow-lab-laser/30 text-white shadow-lg"
                  : "bg-brand-primary shadow-brand-primary/30 text-white shadow-lg"
                : "text-brand-sage border-brand-sage/5 border bg-(--color-zenthar-void)"
            } `}
          >
            <FlaskConical size={20} className={isTesting && active ? "animate-pulse" : ""} />
          </div>

          <div className="min-w-0 flex-1">
            <h4
              className={`truncate text-xs font-black tracking-tight uppercase ${active ? "text-white" : "text-white/70"}`}
            >
              {sample.sample_type ?? "Unknown Type"}
            </h4>
            <div className="text-brand-sage/80 mt-1 flex items-center gap-2 text-[10px] font-bold tracking-wider uppercase">
              <Tag size={10} className="text-brand-primary/40 shrink-0" />
              <span className="truncate">{stageLabel}</span>
            </div>
          </div>
        </div>

        {/* FOOTER ROW: TIME + TEST COUNT + STATUS */}
        <div
          className={`mt-1 flex items-center justify-between border-t pt-3 ${active ? "border-brand-primary/10" : "border-brand-sage/5"}`}
        >
          <div className="text-brand-sage/60 flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Clock size={11} />
              <span className="text-[9px] font-black tabular-nums">
                {new Date(sample.created_at).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <ListChecks size={11} />
              <span className="text-[9px] font-black uppercase">
                {testCount} Test{testCount !== 1 ? "s" : ""}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <StatusIndicator status={sample.status as SampleStatus} />
            <ChevronRight
              size={14}
              className={`transition-all duration-300 ${active ? "text-brand-primary translate-x-0" : "-translate-x-2 opacity-0"}`}
            />
          </div>
        </div>
      </div>

      {/* Active overlay glow */}
      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="from-brand-primary/5 pointer-events-none absolute inset-0 bg-linear-to-r via-transparent to-transparent"
          />
        )}
      </AnimatePresence>
    </motion.button>
  );
});

const StatusIndicator = ({ status }: { status: SampleStatus }) => {
  const isDone = status === SampleStatus.COMPLETED || status === SampleStatus.APPROVED;
  const isTesting = status === SampleStatus.VALIDATING || status === SampleStatus.TESTING;

  return (
    <div
      className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[8px] font-black tracking-widest uppercase ${
        isDone
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
          : isTesting
            ? "bg-brand-primary/10 border-brand-primary/20 text-brand-primary"
            : "border-brand-sage/10 text-brand-sage/70 bg-(--color-zenthar-void)"
      } `}
    >
      {isDone ? (
        <CheckCircle2 size={10} strokeWidth={3} />
      ) : isTesting ? (
        <Activity size={10} className="animate-pulse" strokeWidth={3} />
      ) : (
        <AlertCircle size={10} strokeWidth={3} />
      )}
      {status}
    </div>
  );
};

SampleCard.displayName = "SampleCard";
