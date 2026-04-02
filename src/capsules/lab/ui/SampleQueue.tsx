import React, {
  memo,
  useState,
  useMemo,
  useRef,
  useCallback,
  CSSProperties,
} from "react";
import { useVirtualizer } from "@/src/lib/react-virtual";
import {
  Search,
  Filter,
  X,
  ListFilter,
  RotateCcw,
  SlidersHorizontal,
  Beaker,
} from "lucide-react";
import { SampleCard } from "./SampleCard";
import { Sample, SampleStatus } from "../../../core/types";

interface RowProps {
  samples: Sample[];
  selectedSampleId?: number | null;
  onSampleSelect: (sample: Sample) => void;
}

export const SampleQueue: React.FC<RowProps> = memo(
  ({ samples, selectedSampleId, onSampleSelect }) => {
    const [searchQuery, setSearchQuery] = useState("");
    const [priorityFilter, setPriorityFilter] = useState<string>("ALL");
    const [statusFilter, setStatusFilter] = useState<string>("ALL");
    const parentRef = useRef<HTMLDivElement>(null);
    const CARD_HEIGHT = 124; // Base height + Gap
    const MAX_VISIBLE_SAMPLES = 5;

    // Optimized Filtering Logic
    const filteredSamples = useMemo(() => {
      const searchLower = searchQuery.toLowerCase().trim();
      return samples.filter((sample) => {
        const matchesSearch =
          !searchLower ||
          [
            sample.batch_id,
            sample.sugar_stage,
            sample.source_stage,
            sample.id,
          ].some((val) => String(val).toLowerCase().includes(searchLower));

        const matchesPriority =
          priorityFilter === "ALL" || sample.priority === priorityFilter;
        const matchesStatus =
          statusFilter === "ALL" || sample.status === statusFilter;

        return matchesSearch && matchesPriority && matchesStatus;
      });
    }, [samples, searchQuery, priorityFilter, statusFilter]);

    // Virtualizer adjusted for the compact SampleCard height (approx 120px with padding)
    const rowVirtualizer = useVirtualizer({
      count: filteredSamples.length,
      getScrollElement: () => parentRef.current,
      estimateSize: useCallback(() => CARD_HEIGHT, []),
      overscan: 10,
    });

    const containerStyle: CSSProperties = useMemo(() => {
      const isScrollable = filteredSamples.length > MAX_VISIBLE_SAMPLES;
      return {
        // If > 5 samples, cap at 5.5 to show a "peek" of the 6th, or exactly 5.
        maxHeight: isScrollable
          ? `${CARD_HEIGHT * MAX_VISIBLE_SAMPLES}px`
          : "auto",
        height: !isScrollable
          ? `${filteredSamples.length * CARD_HEIGHT}px`
          : "auto",
        overflowY: isScrollable ? "auto" : "hidden",
      };
    }, [filteredSamples.length]);

    const activeFilterCount =
      (priorityFilter !== "ALL" ? 1 : 0) + (statusFilter !== "ALL" ? 1 : 0);

    const clearFilters = () => {
      setSearchQuery("");
      setPriorityFilter("ALL");
      setStatusFilter("ALL");
    };

    return (
      <div className="flex flex-col h-full w-full bg-white/80 backdrop-blur-md border border-brand-sage/10 rounded-4xl overflow-hidden">
        {/* Compact Header */}
        <header className="flex-none p-4 pb-2 border-b border-brand-sage/5 space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <ListFilter className="w-3.5 h-3.5 text-brand-primary" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-deep">
                Active Queue
              </span>
              <span className="px-1.5 py-0.5 bg-brand-primary/10 text-brand-primary rounded text-[9px] font-bold tabular-nums">
                {filteredSamples.length}
              </span>
            </div>

            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="group flex items-center gap-1.5 text-brand-sage hover:text-brand-primary transition-colors text-[9px] font-bold uppercase"
              >
                <RotateCcw className="w-3 h-3 group-hover:rotate-45 transition-transform" />
                Reset
              </button>
            )}
          </div>

          {/* Integrated Search */}
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-brand-sage group-focus-within:text-brand-primary transition-colors pointer-events-none" />
            <input
              type="text"
              placeholder="Search Batch ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-brand-mist/40 border border-brand-sage/5 rounded-xl pl-9 pr-8 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-primary/10 focus:border-brand-primary/20 transition-all placeholder:text-brand-sage/50"
            />
          </div>

          {/* Quick Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            {["ALL", "STAT", "HIGH", "NORMAL"].map((p) => (
              <button
                key={p}
                onClick={() => setPriorityFilter(p)}
                className={`
                  whitespace-nowrap px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all
                  ${
                    priorityFilter === p
                      ? "bg-brand-primary text-white shadow-sm shadow-brand-primary/20"
                      : "bg-brand-mist/60 text-brand-sage hover:bg-brand-mist"
                  }
                `}
              >
                {p}
              </button>
            ))}
            <div className="w-px h-3 bg-brand-sage/20 shrink-0 mx-1" />
            <div className="relative shrink-0">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-brand-mist/60 text-brand-sage text-[9px] font-black uppercase tracking-wider pl-2 pr-6 py-1 rounded-lg appearance-none cursor-pointer focus:outline-none"
              >
                <option value="ALL">All Status</option>
                {Object.values(SampleStatus).map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <SlidersHorizontal className="absolute right-2 top-1/2 -translate-y-1/2 w-2.5 h-2.5 pointer-events-none" />
            </div>
          </div>
        </header>

        {/* Scrollable Area */}
        <div
          ref={parentRef}
          style={containerStyle}
          className="flex-1 min-h-0 custom-scrollbar p-3 pt-2"
        >
          {filteredSamples.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center opacity-40 grayscale py-20">
              <Beaker size={32} />
              <p className="text-[10px] font-black uppercase tracking-widest text-brand-deep">
                No Matches
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
                const isActive = selectedSampleId === sample.id;

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
                      active={isActive}
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
  },
);

SampleQueue.displayName = "SampleQueue";
