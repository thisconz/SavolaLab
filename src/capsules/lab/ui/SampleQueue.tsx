import React, { memo, useState, useMemo, useRef, useCallback } from "react";
import { useVirtualizer } from "@/src/lib/react-virtual";
import {
  Search,
  ListFilter,
  RotateCcw,
  SlidersHorizontal,
  Beaker,
} from "lucide-react";
import { SampleCard } from "./SampleCard";
import { Sample, SampleStatus } from "../../../core/types";

interface SampleQueueProps {
  samples: Sample[];
  selectedSampleId?: number | null;
  onSampleSelect: (sample: Sample) => void;
}

export const SampleQueue: React.FC<SampleQueueProps> = memo(
  ({ samples, selectedSampleId, onSampleSelect }) => {
    const [searchQuery, setSearchQuery] = useState("");
    const [priorityFilter, setPriorityFilter] = useState<string>("ALL");
    const [statusFilter, setStatusFilter] = useState<string>("ALL");
    
    const parentRef = useRef<HTMLDivElement>(null);
    const CARD_HEIGHT = 124; 
    const MAX_VISIBLE_SAMPLES = 5;

    // 1. ADVANCED FILTERING LOGIC
    const filteredSamples = useMemo(() => {
      const query = searchQuery.toLowerCase().trim();
      return samples.filter((s) => {
        const matchesSearch = !query || [
          s.batch_id, 
          s.sugar_stage, 
          s.source_stage, 
          s.id
        ].some(v => String(v).toLowerCase().includes(query));

        const matchesPriority = priorityFilter === "ALL" || s.priority === priorityFilter;
        const matchesStatus = statusFilter === "ALL" || s.status === statusFilter;

        return matchesSearch && matchesPriority && matchesStatus;
      });
    }, [samples, searchQuery, priorityFilter, statusFilter]);

    // 2. VIRTUALIZATION ENGINE
    const rowVirtualizer = useVirtualizer({
      count: filteredSamples.length,
      getScrollElement: () => parentRef.current,
      estimateSize: useCallback(() => CARD_HEIGHT, []),
      overscan: 5,
    });

    const activeFilterCount = (priorityFilter !== "ALL" ? 1 : 0) + (statusFilter !== "ALL" ? 1 : 0);

    return (
      <div className="flex flex-col h-full w-full bg-white/80 backdrop-blur-xl border border-brand-sage/10 rounded-4xl overflow-hidden shadow-inner">
        
        {/* HEADER: OPERATIONAL FILTERS */}
        <header className="flex-none p-5 pb-3 border-b border-brand-sage/5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-1 h-3 bg-brand-primary rounded-full" />
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-brand-deep">
                Live_Queue
              </span>
              <span className="px-2 py-0.5 bg-brand-deep text-white rounded text-[9px] font-mono font-bold">
                {filteredSamples.length.toString().padStart(3, '0')}
              </span>
            </div>

            {activeFilterCount > 0 && (
              <button
                onClick={() => { setSearchQuery(""); setPriorityFilter("ALL"); setStatusFilter("ALL"); }}
                className="flex items-center gap-1.5 text-brand-primary hover:text-brand-deep transition-colors text-[9px] font-black uppercase tracking-tighter"
              >
                <RotateCcw className="w-3 h-3" />
                Reset_Filters
              </button>
            )}
          </div>

          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-brand-sage/40 group-focus-within:text-brand-primary transition-colors" />
            <input
              type="text"
              placeholder="Filter by Batch, Stage, or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-brand-mist/30 border border-brand-sage/5 rounded-xl pl-9 pr-4 py-2.5 text-xs font-mono focus:outline-none focus:ring-4 focus:ring-brand-primary/5 focus:border-brand-primary/20 transition-all placeholder:text-brand-sage/30"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            {["ALL", "STAT", "HIGH", "NORMAL"].map((p) => (
              <button
                key={p}
                onClick={() => setPriorityFilter(p)}
                className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all border ${
                  priorityFilter === p
                    ? "bg-brand-primary border-brand-primary text-white shadow-lg shadow-brand-primary/20"
                    : "bg-transparent border-brand-sage/10 text-brand-sage hover:border-brand-primary/40"
                }`}
              >
                {p}
              </button>
            ))}
            <div className="w-px h-3 bg-brand-sage/20 shrink-0 mx-1" />
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-brand-mist/50 border border-brand-sage/10 text-brand-sage text-[9px] font-black uppercase tracking-widest pl-3 pr-8 py-1.5 rounded-lg appearance-none cursor-pointer focus:outline-none focus:border-brand-primary/40"
              >
                <option value="ALL">Status_All</option>
                {Object.values(SampleStatus).map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <SlidersHorizontal className="absolute right-2.5 top-1/2 -translate-y-1/2 w-2.5 h-2.5 text-brand-sage pointer-events-none" />
            </div>
          </div>
        </header>

        {/* VIRTUALIZED LIST AREA */}
        <div
          ref={parentRef}
          className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-4"
        >
          {filteredSamples.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center py-20 animate-in fade-in zoom-in duration-500">
              <div className="p-5 bg-brand-mist/20 rounded-full mb-4">
                <Beaker className="w-8 h-8 text-brand-sage/20" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-sage/40">
                Zero_Intercepts
              </p>
            </div>
          ) : (
            <div
              style={{
                height: `${rowVirtualizer.getTotalSize()}px`,
                width: "100%",
                position: "relative",
              }}
            >
              {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const sample = filteredSamples[virtualRow.index];
                return (
                  <div
                    key={virtualRow.key}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: `${virtualRow.size}px`,
                      transform: `translateY(${virtualRow.start}px)`,
                      paddingBottom: "12px",
                    }}
                  >
                    <SampleCard
                      sample={sample}
                      active={selectedSampleId === sample.id}
                      onClick={() => onSampleSelect(sample)}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }
);

SampleQueue.displayName = "SampleQueue";