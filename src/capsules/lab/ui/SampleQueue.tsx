import React, {
  memo,
  useState,
  useMemo,
  useRef,
  useCallback,
  useEffect,
  useLayoutEffect,
} from "react";
import {
  Search,
  RotateCcw,
  SlidersHorizontal,
  Beaker,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
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

    // FIX: measured values instead of hardcoded
    const [containerHeight, setContainerHeight] = useState(
      DEFAULT_CARD_HEIGHT * 4,
    );
    const [cardHeight, setCardHeight] = useState(DEFAULT_CARD_HEIGHT);

    const containerRef = useRef<HTMLDivElement>(null);
    const firstCardRef = useRef<HTMLDivElement>(null);
    const resizeObserver = useRef<ResizeObserver | null>(null);

    // ── Measure container height with ResizeObserver ──────────────────────
    useLayoutEffect(() => {
      if (!containerRef.current) return;

      resizeObserver.current = new ResizeObserver((entries) => {
        for (const entry of entries) {
          setContainerHeight(entry.contentRect.height);
        }
      });

      resizeObserver.current.observe(containerRef.current);

      return () => resizeObserver.current?.disconnect();
    }, []);

    // ── Measure first card height once rendered ───────────────────────────
    useEffect(() => {
      if (firstCardRef.current) {
        const h = firstCardRef.current.getBoundingClientRect().height;
        if (h > 0) setCardHeight(h + 12); // +12 for gap
      }
    });

    // ── Filtering ─────────────────────────────────────────────────────────
    const filtered = useMemo(() => {
      const q = searchQuery.toLowerCase().trim();
      return samples.filter((s) => {
        const matchSearch =
          !q ||
          [s.batch_id, s.source_stage, s.sample_type, String(s.id)].some((v) =>
            (v ?? "").toLowerCase().includes(q),
          );
        const matchPriority =
          priorityFilter === "ALL" || s.priority === priorityFilter;
        const matchStatus = statusFilter === "ALL" || s.status === statusFilter;
        return matchSearch && matchPriority && matchStatus;
      });
    }, [samples, searchQuery, priorityFilter, statusFilter]);

    // ── Virtual scroll calculation ────────────────────────────────────────
    const totalHeight = filtered.length * cardHeight;
    const startIndex = Math.max(
      0,
      Math.floor(scrollTop / cardHeight) - OVERSCAN,
    );
    const endIndex = Math.min(
      filtered.length - 1,
      Math.floor((scrollTop + containerHeight) / cardHeight) + OVERSCAN,
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
      const viewBot = scrollTop + containerHeight;
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

    const activeFilterCount =
      (priorityFilter !== "ALL" ? 1 : 0) + (statusFilter !== "ALL" ? 1 : 0);

    const resetFilters = () => {
      setSearchQuery("");
      setPriorityFilter("ALL");
      setStatusFilter("ALL");
    };

    return (
      <div
        className="flex flex-col h-full w-full bg-(--color-zenthar-graphite)/80 backdrop-blur-xl rounded-4xl overflow-hidden ring-1 ring-inset ring-white/5"
        onKeyDown={handleKeyDown}
      >
        {/* Header */}
        <header className="flex-none p-5 pb-3 border-b border-brand-sage/5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-1 h-3 bg-brand-primary rounded-full" />
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-white">
                Live_Queue
              </span>
              <span className="px-2 py-0.5 bg-(--color-zenthar-void) text-white rounded text-[9px] font-mono font-bold">
                {filtered.length.toString().padStart(3, "0")}
              </span>
            </div>
            {activeFilterCount > 0 && (
              <button
                onClick={resetFilters}
                className="flex items-center gap-1.5 text-brand-primary hover:text-white transition-colors text-[9px] font-black uppercase"
              >
                <RotateCcw className="w-3 h-3" /> Reset
              </button>
            )}
          </div>

          {/* Search */}
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-brand-sage/40 group-focus-within:text-brand-primary transition-colors" />
            <input
              type="text"
              placeholder="Filter by Batch, Stage, or ID…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Filter samples"
              className="w-full bg-(--color-zenthar-carbon)/30 border border-brand-sage/5 rounded-xl pl-9 pr-4 py-2.5 text-xs font-mono focus:outline-none focus:ring-4 focus:ring-brand-primary/5 focus:border-brand-primary/20 transition-all placeholder:text-brand-sage/30 text-white"
            />
          </div>

          {/* Filter chips */}
          <div className="flex items-center gap-2 flex-wrap">
            {(["ALL", "STAT", "HIGH", "NORMAL"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPriorityFilter(p)}
                aria-pressed={priorityFilter === p}
                className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all border ${
                  priorityFilter === p
                    ? "bg-brand-primary border-brand-primary text-white shadow-lg shadow-brand-primary/20"
                    : "bg-transparent border-brand-sage/10 text-brand-sage hover:border-brand-primary/40"
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
                className="bg-(--color-zenthar-carbon)/50 border border-brand-sage/10 text-brand-sage text-[9px] font-black uppercase pl-3 pr-7 py-1.5 rounded-lg appearance-none cursor-pointer focus:outline-none"
              >
                <option value="ALL">All Status</option>
                {Object.values(SampleStatus).map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <SlidersHorizontal className="absolute right-2 top-1/2 -translate-y-1/2 w-2.5 h-2.5 text-brand-sage pointer-events-none" />
            </div>
          </div>

          {/* Keyboard hint */}
          {selectedSampleId != null && (
            <div className="flex items-center gap-2 text-[8px] font-mono text-brand-sage/40">
              <ChevronUp size={10} />
              <ChevronDown size={10} />
              <span>Navigate with arrow keys</span>
            </div>
          )}
        </header>

        {/* Virtualised list */}
        <div
          ref={containerRef}
          className="flex-1 overflow-y-auto custom-scrollbar p-4"
          onScroll={handleScroll}
          role="listbox"
          aria-label="Sample queue"
          tabIndex={0}
        >
          {filtered.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center animate-in fade-in duration-300">
              <div className="p-4 bg-(--color-zenthar-carbon)/20 rounded-full mb-3">
                <Beaker className="w-7 h-7 text-brand-sage/20" />
              </div>
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-brand-sage/40">
                No Samples Found
              </p>
              {activeFilterCount > 0 && (
                <button
                  onClick={resetFilters}
                  className="mt-3 text-[9px] text-brand-primary hover:underline"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            // FIX: phantom container uses measured cardHeight, not hardcoded 132
            <div style={{ height: totalHeight, position: "relative" }}>
              {visibleItems.map((sample, localIdx) => {
                const absoluteIdx = startIndex + localIdx;
                return (
                  <div
                    key={sample.id}
                    ref={absoluteIdx === 0 ? firstCardRef : undefined}
                    style={{
                      position: "absolute",
                      top: absoluteIdx * cardHeight,
                      left: 0,
                      right: 0,
                      paddingBottom: 12,
                    }}
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
