import React, { memo } from "react";
import { motion } from "motion/react";
import {
  FlaskConical,
  Clock,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  ListChecks,
  Activity,
} from "lucide-react";
import type { Sample } from "../../../core/types";
import { PriorityBadge } from "../../../ui/components/PriorityBadge";

interface SampleCardProps {
  sample: Sample;
  active: boolean;
  onClick: () => void;
}

/**
 * Feature Component: SampleCard
 * Displays a summary of a sample in the queue.
 * Optimized for performance with React.memo.
 */
export const SampleCard: React.FC<SampleCardProps> = memo(
  ({ sample, active, onClick }) => {
    const isStat = sample.priority === "STAT";

    return (
      <motion.button
        whileHover={{ y: -2, scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        className={`relative w-full text-left p-4 rounded-3xl border transition-all duration-300 group overflow-hidden ${
          active
            ? isStat
              ? "bg-white border-lab-laser shadow-xl shadow-lab-laser/20 ring-2 ring-lab-laser/40"
              : "bg-white border-brand-primary shadow-xl shadow-brand-primary/10 ring-1 ring-brand-primary/20"
            : isStat
              ? "bg-white border-lab-laser/50 shadow-md shadow-lab-laser/10 hover:border-lab-laser hover:shadow-lg hover:shadow-lab-laser/20"
              : "bg-white border-brand-sage/10 hover:border-brand-primary/30 hover:shadow-lg hover:shadow-brand-primary/5"
        }`}
      >
        {/* STAT Pulsing Border Animation */}
        {isStat && !active && (
          <div className="absolute inset-0 rounded-3xl border-2 border-lab-laser/30 animate-pulse pointer-events-none" />
        )}

        {/* Active Indicator Line */}
        {active && (
          <motion.div
            layoutId="activeIndicator"
            className={`absolute left-0 top-0 bottom-0 w-1.5 z-20 ${isStat ? "bg-lab-laser" : "bg-brand-primary"}`}
          />
        )}

        {/* Background Gradient for STAT */}
        {isStat && (
          <div className="absolute inset-0 bg-linear-to-br from-lab-laser/5 to-transparent pointer-events-none" />
        )}

        {/* Subtle hover gradient for normal cards */}
        {!isStat && !active && (
          <div className="absolute inset-0 bg-linear-to-br from-brand-primary/0 to-brand-primary/0 group-hover:from-brand-primary/5 group-hover:to-transparent transition-all duration-500 pointer-events-none" />
        )}

        <div className="flex items-start justify-between mb-3 relative z-10 pl-2">
          <div className="flex items-center gap-4">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-inner ${
                active
                  ? isStat
                    ? "bg-lab-laser text-white shadow-lab-laser/30"
                    : "bg-brand-primary text-white shadow-brand-primary/30"
                  : isStat
                    ? "bg-lab-laser/10 text-lab-laser"
                    : "bg-brand-mist text-brand-sage group-hover:bg-brand-primary/10 group-hover:text-brand-primary"
              }`}
            >
              <FlaskConical className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <div className="text-sm font-black text-brand-deep uppercase tracking-0.1em">
                  {sample.batch_id}
                </div>
                {isStat && (
                  <div className="relative flex items-center justify-center w-2 h-2 ml-1">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-lab-laser opacity-75"></span>
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-lab-laser"></span>
                  </div>
                )}
                {sample.status === "TESTING" && (
                  <Activity className="w-3.5 h-3.5 text-brand-primary animate-pulse" />
                )}
              </div>
              <div className="text-[10px] text-brand-sage font-mono uppercase tracking-widest flex items-center gap-2">
                <span className="bg-brand-mist/50 px-2 py-0.5 rounded-lg border border-brand-sage/10">
                  {sample.sugar_stage ?? sample.source_stage}
                </span>
                <span className="text-brand-sage/40">•</span>
                <span className="font-medium">{sample.sample_types ?? "—"}</span>
              </div>
            </div>
          </div>
          <PriorityBadge priority={sample.priority} />
        </div>

        <div className="flex items-center justify-between relative z-10 pt-3 border-t border-brand-sage/10 pl-2">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-brand-deep font-mono text-[10px] bg-brand-mist/30 px-2 py-1 rounded-lg">
              <Clock className="w-3.5 h-3.5 text-brand-sage" />
              <span>
                {new Date(sample.created_at).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>

            <div className="h-4 w-px bg-brand-sage/20" />

            <div className="flex items-center gap-1.5 text-brand-deep font-bold text-[10px] bg-brand-mist/30 px-2 py-1 rounded-lg">
              <ListChecks
                className={`w-3.5 h-3.5 ${active ? "text-brand-primary" : "text-brand-sage"}`}
              />
              <span className="tracking-[0.15em]">{sample.test_count} TESTS</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div
              className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 font-black uppercase tracking-[0.15em] text-[9px] shadow-sm ${
                sample.status === "COMPLETED"
                  ? "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-600/20"
                  : sample.status === "TESTING"
                    ? "bg-brand-primary/10 text-brand-primary ring-1 ring-brand-primary/20"
                    : "bg-brand-mist text-brand-sage ring-1 ring-brand-sage/20"
              }`}
            >
              {sample.status === "COMPLETED" ? (
                <CheckCircle2 className="w-3.5 h-3.5" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5" />
              )}
              {sample.status}
            </div>
            <div className={`p-1 rounded-full transition-all duration-300 ${active ? "bg-brand-primary/10" : "group-hover:bg-brand-mist"}`}>
              <ChevronRight
                className={`w-4 h-4 transition-all duration-300 ${
                  active
                    ? "translate-x-0 text-brand-primary"
                    : "-translate-x-1 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 text-brand-sage"
                }`}
              />
            </div>
          </div>
        </div>
      </motion.button>
    );
  },
);

SampleCard.displayName = "SampleCard";
