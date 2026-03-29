import React, { memo, useState, useMemo, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Search, Filter, X } from "lucide-react";
import { SampleCard } from "./SampleCard";
import { Sample } from "../../../core/types";

interface RowProps {
  samples: Sample[];
  selectedSampleId?: number;
  onSampleSelect: (sample: Sample) => void;
}

/**
 * Feature Component: SampleQueue
 * Implements virtualization for the sample list to handle large datasets efficiently.
 * Includes search and filtering capabilities.
 */
export const SampleQueue: React.FC<RowProps> = memo(
  ({ samples, selectedSampleId, onSampleSelect }) => {
    const [searchQuery, setSearchQuery] = useState("");
    const [priorityFilter, setPriorityFilter] = useState<string>("ALL");
    const [statusFilter, setStatusFilter] = useState<string>("ALL");
    const parentRef = useRef<HTMLDivElement>(null);

    const filteredSamples = useMemo(() => {
      return samples.filter((sample) => {
        const searchLower = searchQuery.toLowerCase();
        const matchesSearch =
          (sample.batch_id &&
            String(sample.batch_id).toLowerCase().includes(searchLower)) ||
          (sample.sugar_stage &&
            String(sample.sugar_stage).toLowerCase().includes(searchLower)) ||
          (sample.source_stage &&
            String(sample.source_stage).toLowerCase().includes(searchLower));

        const matchesPriority =
          priorityFilter === "ALL" || sample.priority === priorityFilter;
        const matchesStatus =
          statusFilter === "ALL" || sample.status === statusFilter;

        return matchesSearch && matchesPriority && matchesStatus;
      });
    }, [samples, searchQuery, priorityFilter, statusFilter]);

    const rowVirtualizer = useVirtualizer({
      count: filteredSamples.length,
      getScrollElement: () => parentRef.current,
      estimateSize: () => 100,
    });

    const clearFilters = () => {
      setSearchQuery("");
      setPriorityFilter("ALL");
      setStatusFilter("ALL");
    };

    return (
      <div className="flex flex-col h-full w-full bg-white/50 rounded-3xl overflow-hidden border border-brand-sage/10">
        {/* Search and Filters */}
        <div className="p-5 border-b border-brand-sage/10 space-y-4 bg-linear-to-b from-brand-mist/30 to-transparent relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-brand-primary/20 via-emerald-500/20 to-brand-primary/20" />
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-sage group-focus-within:text-brand-primary transition-colors" />
            <input
              type="text"
              placeholder="Search Batch ID or Stage..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/80 backdrop-blur-sm border border-brand-sage/20 rounded-xl pl-11 pr-4 py-3 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary/30 text-brand-deep transition-all shadow-sm placeholder:text-brand-sage/50"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-sage hover:text-brand-deep bg-brand-mist p-1 rounded-full transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="flex gap-3">
            <div className="flex-1 relative group">
              <Filter 
                className={`absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 transition-all duration-300 pointer-events-none
                  ${priorityFilter !== "ALL" 
                    ? "text-brand-primary scale-110 drop-shadow-[0_0_3px_rgba(var(--brand-primary-rgb),0.4)]" 
                    : "text-brand-sage group-focus-within:text-brand-primary group-focus-within:scale-110"
                  }`} 
              />
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="w-full bg-white/80 backdrop-blur-sm border border-brand-sage/20 rounded-xl pl-9 pr-3 py-2.5 text-[10px] font-bold text-brand-deep uppercase tracking-[0.15em] focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary/30 appearance-none cursor-pointer shadow-sm transition-all"
              >
                <option value="ALL">All Priorities</option>
                <option value="NORMAL">Normal</option>
                <option value="HIGH">High</option>
                <option value="STAT">STAT</option>
              </select>
            </div>

            <div className="flex-1 relative group">
              <Filter 
                className={`absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 transition-all duration-300 pointer-events-none
                  ${statusFilter !== "ALL" 
                    ? "text-brand-primary scale-110 drop-shadow-[0_0_3px_rgba(var(--brand-primary-rgb),0.4)]" 
                    : "text-brand-sage group-focus-within:text-brand-primary group-focus-within:scale-110"
                  }`} 
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full bg-white/80 backdrop-blur-sm border border-brand-sage/20 rounded-xl pl-9 pr-3 py-2.5 text-[10px] font-bold text-brand-deep uppercase tracking-[0.15em] focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary/30 appearance-none cursor-pointer shadow-sm transition-all"
              >
                <option value="ALL">All Statuses</option>
                <option value="REGISTERED">Registered</option>
                <option value="TESTING">Testing</option>
                <option value="VALIDATING">Validating</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Virtualized List */}
        <div
          ref={parentRef}
          className="flex-1 min-h-0 pt-2 overflow-auto custom-scrollbar"
        >
          {filteredSamples.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-brand-sage opacity-50 py-20">
              <p className="text-[10px] font-mono uppercase tracking-widest">
                No matching samples
              </p>
              {(searchQuery ||
                priorityFilter !== "ALL" ||
                statusFilter !== "ALL") && (
                <button
                  onClick={clearFilters}
                  className="mt-2 text-[9px] font-bold text-brand-primary underline uppercase tracking-widest"
                >
                  Clear Filters
                </button>
              )}
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
                      padding: "0 12px 8px 12px",
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
  },
);

SampleQueue.displayName = "SampleQueue";
