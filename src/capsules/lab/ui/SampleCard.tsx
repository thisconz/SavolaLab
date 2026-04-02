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
    
    // FIX 1: Resolved Error 2367 by using valid enum members from your error message.
    // Assuming VALIDATING represents the "in-progress" testing phase.
    const isTesting = sample.status === SampleStatus.VALIDATING;

    return (
      <motion.button
        layout
        whileHover={{ x: 4 }}
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        className={`
          relative w-full text-left rounded-2xl transition-all duration-300 group overflow-hidden outline-none border
          ${active 
            ? "bg-white border-brand-primary/30 shadow-xl shadow-brand-primary/5 ring-1 ring-brand-primary/10" 
            : "bg-white/60 border-brand-sage/10 hover:border-brand-primary/20 hover:bg-white shadow-sm"
          }
        `}
      >
        {/* Status Vertical Strip */}
        <div className={`
          absolute left-0 top-0 bottom-0 w-1.5 transition-colors duration-500
          ${isStat ? 'bg-lab-laser animate-pulse' : active ? 'bg-brand-primary' : 'bg-brand-sage/20'}
        `} />

        <div className="p-4 pl-5 relative z-10 flex flex-col gap-3">
          
          {/* Header: ID and Priority */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`text-sm font-black tracking-tighter tabular-nums ${active ? 'text-brand-deep' : 'text-brand-sage'}`}>
                #{sample.batch_id}
              </span>
              {isStat && (
                <div className="flex items-center gap-1 bg-lab-laser/10 px-1.5 py-0.5 rounded text-[8px] font-black text-lab-laser uppercase tracking-tighter">
                  <Zap size={8} fill="currentColor" />
                  Urgent
                </div>
              )}
            </div>
            {/* FIX 2: Resolved Error 2322 by removing 'size' prop which doesn't exist on PriorityBadge */}
            <PriorityBadge priority={sample.priority} />
          </div>

          {/* Body: Sample Content */}
          <div className="flex items-center gap-3">
            <div className={`
              w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500
              ${active 
                ? isStat ? "bg-lab-laser text-white shadow-lg shadow-lab-laser/20" : "bg-brand-primary text-white shadow-lg shadow-brand-primary/20"
                : "bg-brand-mist text-brand-sage"
              }
            `}>
              <FlaskConical size={18} className={isTesting && active ? 'animate-pulse' : ''} />
            </div>

            <div className="flex-1 min-w-0">
              <h4 className={`text-xs font-bold truncate ${active ? 'text-brand-deep' : 'text-brand-deep/80'}`}>
                {sample.sample_type}
              </h4>
              <div className="flex items-center gap-2 mt-1 text-[10px] text-brand-sage font-medium">
                <Tag size={10} />
                <span className="truncate">{sample.sugar_stage ?? sample.source_stage}</span>
              </div>
            </div>
          </div>

          {/* Footer: Stats and Status */}
          <div className={`
            flex items-center justify-between pt-3 border-t mt-1
            ${active ? 'border-brand-primary/10' : 'border-brand-sage/5'}
          `}>
            <div className="flex items-center gap-2 text-brand-sage">
              <div className="flex items-center gap-1">
                <Clock size={10} />
                <span className="text-[9px] font-bold tabular-nums">
                  {new Date(sample.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <span className="opacity-20">•</span>
              <div className="flex items-center gap-1">
                <ListChecks size={10} />
                <span className="text-[9px] font-bold">{sample.test_count} Units</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <StatusIndicator status={sample.status} />
              <ChevronRight 
                size={14} 
                className={`transition-transform duration-300 ${active ? 'translate-x-0 text-brand-primary' : '-translate-x-1 opacity-0'}`} 
              />
            </div>
          </div>
        </div>

        <AnimatePresence>
          {active && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-linear-to-r from-brand-primary/5 to-transparent pointer-events-none"
            />
          )}
        </AnimatePresence>
      </motion.button>
    );
  }
);

const StatusIndicator = ({ status }: { status: SampleStatus }) => {
  const isDone = status === SampleStatus.COMPLETED;
  const isTesting = status === SampleStatus.VALIDATING;

  return (
    <div className={`
      flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider border
      ${isDone 
        ? "bg-emerald-50 border-emerald-100 text-emerald-600" 
        : isTesting 
          ? "bg-brand-primary/5 border-brand-primary/10 text-brand-primary"
          : "bg-brand-mist border-brand-sage/5 text-brand-sage"
      }
    `}>
      {isDone ? <CheckCircle2 size={8} /> : isTesting ? <Activity size={8} className="animate-spin-slow" /> : <AlertCircle size={8} />}
      {status}
    </div>
  );
};

SampleCard.displayName = "SampleCard";