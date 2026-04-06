import React, { memo } from "react";
import { motion, AnimatePresence } from "@/src/lib/motion";
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
import { Sample, SampleStatus } from "../../../core/types";
import { PriorityBadge } from "../../../ui/components/PriorityBadge";

interface SampleCardProps {
  sample: Sample;
  active: boolean;
  onClick: () => void;
}

export const SampleCard: React.FC<SampleCardProps> = memo(
  ({ sample, active, onClick }) => {
    const isStat = sample.priority === "STAT";
    const isTesting = sample.status === SampleStatus.VALIDATING;

    return (
      <motion.button
        layout
        whileHover={{ x: 6, backgroundColor: "rgba(255, 255, 255, 1)" }}
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        className={`
          relative w-full text-left rounded-[1.25rem] transition-all duration-300 group overflow-hidden outline-none border
          ${
            active
              ? "bg-white border-brand-primary/40 shadow-xl shadow-brand-primary/10 ring-1 ring-brand-primary/5"
              : "bg-white/40 border-brand-sage/10 hover:border-brand-primary/20 shadow-sm"
          }
        `}
      >
        {/* INDICATOR STRIP: STAT vs ACTIVE vs PENDING */}
        <div
          className={`
          absolute left-0 top-0 bottom-0 w-1.5 transition-all duration-500 z-20
          ${isStat ? "bg-lab-laser animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.5)]" : active ? "bg-brand-primary" : "bg-brand-sage/20"}
        `}
        />

        <div className="p-4 pl-6 relative z-10 flex flex-col gap-3">
          {/* TOP ROW: ID & PRIORITY */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className={`text-[10px] font-black tracking-widest tabular-nums font-mono ${active ? "text-brand-deep" : "text-brand-sage"}`}
              >
                #{sample.batch_id}
              </span>
              {isStat && (
                <div className="flex items-center gap-1 bg-lab-laser/10 px-1.5 py-0.5 rounded text-[8px] font-black text-lab-laser uppercase tracking-tighter">
                  <Zap size={8} fill="currentColor" />
                  Stat_Priority
                </div>
              )}
            </div>
            <PriorityBadge priority={sample.priority as any} />
          </div>

          {/* MAIN ROW: TYPE & ICON */}
          <div className="flex items-center gap-4">
            <div
              className={`
              w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-500
              ${
                active
                  ? isStat
                    ? "bg-lab-laser text-white shadow-lg shadow-lab-laser/30"
                    : "bg-brand-primary text-white shadow-lg shadow-brand-primary/30"
                  : "bg-brand-mist/80 text-brand-sage border border-brand-sage/5"
              }
            `}
            >
              <FlaskConical
                size={20}
                className={isTesting && active ? "animate-pulse" : ""}
              />
            </div>

            <div className="flex-1 min-w-0">
              <h4
                className={`text-xs font-black uppercase tracking-tight truncate ${active ? "text-brand-deep" : "text-brand-deep/70"}`}
              >
                {sample.sample_type}
              </h4>
              <div className="flex items-center gap-2 mt-1 text-[10px] text-brand-sage/80 font-bold uppercase tracking-wider">
                <Tag size={10} className="text-brand-primary/40" />
                <span className="truncate">
                  {sample.sugar_stage ?? (sample as any).source_stage ?? "Standard_Unit"}
                </span>
              </div>
            </div>
          </div>

          {/* FOOTER ROW: METRICS & STATUS */}
          <div
            className={`flex items-center justify-between pt-3 border-t mt-1 ${active ? "border-brand-primary/10" : "border-brand-sage/5"}`}
          >
            <div className="flex items-center gap-3 text-brand-sage/60">
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
                  {sample.test_count} Tests
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <StatusIndicator status={sample.status as any} />
              <ChevronRight
                size={14}
                className={`transition-all duration-300 ${active ? "translate-x-0 text-brand-primary" : "-translate-x-2 opacity-0"}`}
              />
            </div>
          </div>
        </div>

        {/* ACTIVE OVERLAY GLOW */}
        <AnimatePresence>
          {active && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-linear-to-r from-brand-primary/5 via-transparent to-transparent pointer-events-none"
            />
          )}
        </AnimatePresence>
      </motion.button>
    );
  },
);

/**
 * MINI-COMPONENT: STATUS INDICATOR
 * Displays the current lifecycle phase of the sample.
 */
const StatusIndicator = ({ status }: { status: SampleStatus }) => {
  const isDone = status === SampleStatus.COMPLETED;
  const isTesting = status === SampleStatus.VALIDATING;

  return (
    <div
      className={`
      flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border
      ${
        isDone
          ? "bg-emerald-50 border-emerald-200/50 text-emerald-600"
          : isTesting
            ? "bg-brand-primary/10 border-brand-primary/20 text-brand-primary"
            : "bg-brand-mist border-brand-sage/10 text-brand-sage/70"
      }
    `}
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
