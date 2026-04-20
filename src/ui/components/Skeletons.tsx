import React from "react";
import clsx   from "@/src/lib/clsx";

// ─────────────────────────────────────────────
// Base skeleton pulse
// ─────────────────────────────────────────────

interface SkeletonProps {
  className?: string;
  rounded?:   "sm" | "md" | "lg" | "xl" | "2xl" | "full";
}

export const Skeleton: React.FC<SkeletonProps> = ({ className, rounded = "lg" }) => (
  <div
    className={clsx(
      "animate-pulse bg-brand-sage/10",
      `rounded-${rounded}`,
      className,
    )}
  />
);

// ─────────────────────────────────────────────
// Sample card skeleton
// ─────────────────────────────────────────────

export const SampleCardSkeleton: React.FC = () => (
  <div className="rounded-[1.25rem] border border-(--color-zenthar-steel) bg-(--color-zenthar-carbon)/60 p-4 pl-6 space-y-3">
    <div className="flex items-center justify-between">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-5 w-16" rounded="full" />
    </div>
    <div className="flex items-center gap-4">
      <Skeleton className="h-11 w-11 shrink-0" rounded="xl" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3 w-3/4" />
        <Skeleton className="h-2.5 w-1/2" />
      </div>
    </div>
    <div className="flex items-center justify-between pt-2 border-t border-(--color-zenthar-steel)/40">
      <div className="flex items-center gap-3">
        <Skeleton className="h-2 w-12" />
        <Skeleton className="h-2 w-14" />
      </div>
      <Skeleton className="h-5 w-20" rounded="xl" />
    </div>
  </div>
);

// ─────────────────────────────────────────────
// Sample queue skeleton (3 cards)
// ─────────────────────────────────────────────

export const SampleQueueSkeleton: React.FC<{ count?: number }> = ({ count = 4 }) => (
  <div className="p-4 space-y-3">
    {Array.from({ length: count }).map((_, i) => (
      <SampleCardSkeleton key={i} />
    ))}
  </div>
);

// ─────────────────────────────────────────────
// Metric card skeleton
// ─────────────────────────────────────────────

export const MetricCardSkeleton: React.FC = () => (
  <div className="bg-(--color-zenthar-carbon) border border-(--color-zenthar-steel) rounded-[1.25rem] p-6 space-y-4">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Skeleton className="h-2 w-2" rounded="full" />
        <Skeleton className="h-2.5 w-20" />
      </div>
      <Skeleton className="h-5 w-12" rounded="full" />
    </div>
    <div className="flex items-end justify-between">
      <Skeleton className="h-10 w-20" />
      <Skeleton className="h-12 w-12" rounded="xl" />
    </div>
  </div>
);

// ─────────────────────────────────────────────
// Table skeleton
// ─────────────────────────────────────────────

interface TableSkeletonProps {
  rows?:    number;
  columns?: number;
}

export const TableSkeleton: React.FC<TableSkeletonProps> = ({ rows = 6, columns = 5 }) => (
  <div className="flex flex-col">
    {/* Header */}
    <div className="flex gap-4 px-6 py-4 border-b border-(--color-zenthar-steel)">
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton key={i} className="h-2.5 flex-1" />
      ))}
    </div>
    {/* Rows */}
    {Array.from({ length: rows }).map((_, ri) => (
      <div key={ri} className="flex gap-4 px-6 py-4 border-b border-(--color-zenthar-steel)/40">
        {Array.from({ length: columns }).map((_, ci) => (
          <Skeleton
            key={ci}
            className={clsx("h-3 flex-1", ci === 0 && "max-w-[80px]")}
          />
        ))}
      </div>
    ))}
  </div>
);

// ─────────────────────────────────────────────
// Chart skeleton
// ─────────────────────────────────────────────

export const ChartSkeleton: React.FC<{ height?: string }> = ({ height = "h-64" }) => (
  <div className={clsx("flex flex-col gap-3 p-4", height)}>
    <div className="flex items-end gap-2 flex-1">
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton
          key={i}
          className={clsx("flex-1 rounded-t-lg")}
          style={{ height: `${25 + Math.random() * 60}%` } as React.CSSProperties}
          rounded="md"
        />
      ))}
    </div>
    <div className="flex gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton key={i} className="h-2 flex-1" />
      ))}
    </div>
  </div>
);

// ─────────────────────────────────────────────
// Lab bench skeleton
// ─────────────────────────────────────────────

export const LabBenchSkeleton: React.FC = () => (
  <div className="space-y-4 p-2">
    {/* Header banner */}
    <div className="p-5 rounded-3xl border border-brand-primary/20 bg-brand-primary/5">
      <div className="flex items-center gap-4">
        <Skeleton className="h-12 w-12" rounded="2xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-32" />
          <div className="flex gap-2">
            <Skeleton className="h-5 w-20" rounded="lg" />
            <Skeleton className="h-5 w-16" rounded="lg" />
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Skeleton className="h-2.5 w-16" />
          <Skeleton className="h-1.5 w-32" rounded="full" />
        </div>
      </div>
    </div>

    {/* Test cards */}
    {[1, 2, 3].map((i) => (
      <div key={i} className="rounded-2xl border border-(--color-zenthar-steel) bg-(--color-zenthar-carbon)/60 p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-(--color-zenthar-steel)/40 pb-3">
          <div className="flex items-center gap-3">
            <Skeleton className="h-2 w-2" rounded="full" />
            <Skeleton className="h-3 w-16" />
          </div>
          <Skeleton className="h-5 w-20" rounded="lg" />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Skeleton className="h-2 w-20" />
            <Skeleton className="h-10 w-full" rounded="xl" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-2 w-20" />
            <Skeleton className="h-8 w-full" rounded="xl" />
            <Skeleton className="h-1.5 w-full" rounded="full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-2 w-16" />
            <Skeleton className="h-10 w-full" rounded="xl" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

// ─────────────────────────────────────────────
// Dashboard metrics row skeleton
// ─────────────────────────────────────────────

export const DashboardSkeleton: React.FC = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => <MetricCardSkeleton key={i} />)}
    </div>
    <div className="grid grid-cols-12 gap-6">
      <div className="col-span-8">
        <div className="bg-white/70 rounded-[2.5rem] border border-white p-8">
          <Skeleton className="h-4 w-40 mb-6" />
          <ChartSkeleton height="h-60" />
        </div>
      </div>
      <div className="col-span-4 space-y-6">
        <div className="bg-white/70 rounded-[2.5rem] border border-white p-8 space-y-3">
          <Skeleton className="h-4 w-32 mb-4" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3 p-3 rounded-xl border border-(--color-zenthar-steel)/40">
              <Skeleton className="h-8 w-8" rounded="lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-2.5 w-3/4" />
                <Skeleton className="h-2 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);