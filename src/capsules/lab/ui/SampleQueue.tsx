import React, { memo, useState, useMemo, useRef, useCallback, useEffect, useLayoutEffect } from "react";
import { Search, RotateCcw, SlidersHorizontal, Beaker, ChevronUp, ChevronDown } from "lucide-react";
import { SampleCard } from "./SampleCard";
import { Sample, SampleStatus } from "../../../core/types";

interface SampleQueueProps {
  samples: Sample[];
  selectedSampleId?: number | null;
  onSampleSelect: (sample: Sample) => void;
}

const DEFAULT_CARD_HEIGHT = 132;
const OVERSCAN = 3;

export const SampleQueue: React.FC<SampleQueueProps> = memo(
  ({ samples, selectedSampleId, onSampleSelect }) => {
    const [searchQuery, setSearchQuery] = useState("");
    const [priorityFilter, setPriorityFilter] = useState("ALL");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [scrollTop, setScrollTop] = useState(0);

    const sentinelRef = useRef<HTMLDivElement>(null);
    const [cardHeight, setCardHeight] = useState(DEFAULT_CARD_HEIGHT);

    const containerRef = useRef<HTMLDivElement>(null);
    const firstCardRef = useRef<HTMLDivElement>(null);
    const resizeObserver = useRef<ResizeObserver | null>(null);

    // ── Measure container height with ResizeObserver ──────────────────────
    useLayoutEffect(() => {
      if (!containerRef.current) return;

      resizeObserver.current = new ResizeObserver((entries) => {
        for (const entry of entries) {
          setCardHeight(entry.contentRect.height);
        }
      });

      resizeObserver.current.observe(containerRef.current);

      return () => resizeObserver.current?.disconnect();
    }, []);

    // ── Filtering ─────────────────────────────────────────────────────────
    const filtered = useMemo(() => {
      const q = searchQuery.toLowerCase().trim();
      return samples.filter((s) => {
        const matchSearch =
          !q ||
          [s.batch_id, s.source_stage, s.sample_type, String(s.id)].some((v) =>
            (v ?? "").toLowerCase().includes(q),
          );
        const matchPriority = priorityFilter === "ALL" || s.priority === priorityFilter;
        const matchStatus = statusFilter === "ALL" || s.status === statusFilter;
        return matchSearch && matchPriority && matchStatus;
      });
    }, [samples, searchQuery, priorityFilter, statusFilter]);

    // ── Measure first card height once rendered ───────────────────────────
    useLayoutEffect(() => {
      if (!firstCardRef.current) return;

      const observer = new ResizeObserver((entries) => {
        const entry = entries[0];
        if (entry) {
          const h = entry.contentRect.height;
          if (h > 0) setCardHeight(h + 12); // +12 for gap
        }
      });

      observer.observe(firstCardRef.current);
      return () => observer.disconnect();
    }, [filtered.length > 0]);

    // ── Virtual scroll calculation ────────────────────────────────────────
    const totalHeight = filtered.length * cardHeight;
    const startIndex = Math.max(0, Math.floor(scrollTop / cardHeight) - OVERSCAN);
    const endIndex = Math.min(
      filtered.length - 1,
      Math.floor((scrollTop + innerHeight) / cardHeight) + OVERSCAN,
    );
    const visibleItems = filtered.slice(startIndex, endIndex + 1);

    const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
      setScrollTop((e.target as HTMLDivElement).scrollTop);
    }, []);

    // ── Scroll selected item into view ────────────────────────────────────
    useEffect(() => {
      if (selectedSampleId == null || !containerRef.current) return;
      const idx = filtered.findIndex((s) => s.id === selectedSampleId);
      if (idx === -1) return;
      const itemTop = idx * cardHeight;
      const itemBot = itemTop + cardHeight;
      const viewTop = scrollTop;
      const viewBot = scrollTop + innerHeight;
      if (itemTop < viewTop || itemBot > viewBot) {
        containerRef.current.scrollTo({
          top: itemTop - cardHeight,
          behavior: "smooth",
        });
      }
    }, [selectedSampleId]); // only run when selection changes

    // ── Keyboard navigation ───────────────────────────────────────────────
    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
        if (!filtered.length) return;
        const currentIdx = filtered.findIndex((s) => s.id === selectedSampleId);
        if (e.key === "ArrowDown") {
          e.preventDefault();
          const next = filtered[Math.min(currentIdx + 1, filtered.length - 1)];
          if (next) onSampleSelect(next);
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          const prev = filtered[Math.max(currentIdx - 1, 0)];
          if (prev) onSampleSelect(prev);
        }
      },
      [filtered, selectedSampleId, onSampleSelect],
    );

    const activeFilterCount = (priorityFilter !== "ALL" ? 1 : 0) + (statusFilter !== "ALL" ? 1 : 0);

    const resetFilters = () => {
      setSearchQuery("");
      setPriorityFilter("ALL");
      setStatusFilter("ALL");
    };

    return (
      <div
        className="flex h-full w-full flex-col overflow-hidden rounded-4xl bg-(--color-zenthar-graphite)/80 ring-1 ring-white/5 backdrop-blur-xl ring-inset"
        onKeyDown={handleKeyDown}
      >
        {/* Stable measurement sentinel — always rendered, never visible */}
        {filtered[0] && (
          <div
            ref={sentinelRef}
            aria-hidden="true"
            style={{
              position: "absolute",
              visibility: "hidden",
              pointerEvents: "none",
              top: 0,
              left: 0,
              right: 0,
              zIndex: -1,
            }}
          >
            <SampleCard sample={filtered[0]} active={false} onClick={() => {}} />
          </div>
        )}
        {/* Header */}
        <header className="border-brand-sage/5 flex-none space-y-3 border-b p-5 pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="bg-brand-primary h-3 w-1 rounded-full" />
              <span className="text-[10px] font-black tracking-[0.25em] text-white uppercase">
                Live_Queue
              </span>
              <span className="rounded bg-(--color-zenthar-void) px-2 py-0.5 font-mono text-[9px] font-bold text-white">
                {filtered.length.toString().padStart(3, "0")}
              </span>
            </div>
            {activeFilterCount > 0 && (
              <button
                onClick={resetFilters}
                className="text-brand-primary flex items-center gap-1.5 text-[9px] font-black uppercase transition-colors hover:text-white"
              >
                <RotateCcw className="h-3 w-3" /> Reset
              </button>
            )}
          </div>

          {/* Search */}
          <div className="group relative">
            <Search className="text-brand-sage/40 group-focus-within:text-brand-primary absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 transition-colors" />
            <input
              type="text"
              placeholder="Filter by Batch, Stage, or ID…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Filter samples"
              className="border-brand-sage/5 focus:ring-brand-primary/5 focus:border-brand-primary/20 placeholder:text-brand-sage/30 w-full rounded-xl border bg-(--color-zenthar-carbon)/30 py-2.5 pr-4 pl-9 font-mono text-xs text-white transition-all focus:ring-4 focus:outline-none"
            />
          </div>

          {/* Filter chips */}
          <div className="flex flex-wrap items-center gap-2">
            {(["ALL", "STAT", "HIGH", "NORMAL"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPriorityFilter(p)}
                aria-pressed={priorityFilter === p}
                className={`rounded-lg border px-3 py-1.5 text-[9px] font-black tracking-widest uppercase transition-all ${
                  priorityFilter === p
                    ? "bg-brand-primary border-brand-primary shadow-brand-primary/20 text-white shadow-lg"
                    : "border-brand-sage/10 text-brand-sage hover:border-brand-primary/40 bg-transparent"
                }`}
              >
                {p}
              </button>
            ))}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                aria-label="Filter by status"
                className="border-brand-sage/10 text-brand-sage cursor-pointer appearance-none rounded-lg border bg-(--color-zenthar-carbon)/50 py-1.5 pr-7 pl-3 text-[9px] font-black uppercase focus:outline-none"
              >
                <option value="ALL">All Status</option>
                {Object.values(SampleStatus).map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <SlidersHorizontal className="text-brand-sage pointer-events-none absolute top-1/2 right-2 h-2.5 w-2.5 -translate-y-1/2" />
            </div>
          </div>

          {/* Keyboard hint */}
          {selectedSampleId != null && (
            <div className="text-brand-sage/40 flex items-center gap-2 font-mono text-[8px]">
              <ChevronUp size={10} />
              <ChevronDown size={10} />
              <span>Navigate with arrow keys</span>
            </div>
          )}
        </header>

        {/* Virtualised list */}
        <div
          ref={containerRef}
          className="custom-scrollbar flex-1 overflow-y-auto p-4"
          onScroll={handleScroll}
          role="listbox"
          aria-label="Sample queue"
          tabIndex={0}
        >
          {filtered.length === 0 ? (
            <div className="animate-in fade-in flex h-48 flex-col items-center justify-center duration-300">
              <div className="mb-3 rounded-full bg-(--color-zenthar-carbon)/20 p-4">
                <Beaker className="text-brand-sage/20 h-7 w-7" />
              </div>
              <p className="text-brand-sage/40 text-[9px] font-black tracking-[0.3em] uppercase">
                No Samples Found
              </p>
              {activeFilterCount > 0 && (
                <button onClick={resetFilters} className="text-brand-primary mt-3 text-[9px] hover:underline">
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <div style={{ height: totalHeight, position: "relative" }}>
              {visibleItems.map((sample, localIdx) => {
                const absoluteIdx = startIndex + localIdx;
                return (
                  <div
                    key={sample.id}
                    style={{
                      position: "absolute",
                      top: absoluteIdx * cardHeight,
                      left: 0,
                      right: 0,
                      paddingBottom: 12,
                    }}
                    ref={absoluteIdx === 0 ? firstCardRef : undefined}
                    role="option"
                    aria-selected={selectedSampleId === sample.id}
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
