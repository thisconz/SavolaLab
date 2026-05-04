import React from "react";
import clsx from "clsx";

// ─────────────────────────────────────────────
// Base skeleton atom
// ─────────────────────────────────────────────

interface SkeletonProps {
  className?: string;
  rounded?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
  style?: React.CSSProperties;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className, rounded = "lg", style }) => (
  <div
    style={style}
    className={clsx("animate-pulse bg-(--color-zenthar-graphite)", `rounded-${rounded}`, className)}
  />
);

// ─────────────────────────────────────────────
// Sample card skeleton
// ─────────────────────────────────────────────

export const SampleCardSkeleton: React.FC = () => (
  <div className="space-y-3 rounded-[1.25rem] border border-(--color-zenthar-steel) bg-(--color-zenthar-carbon)/60 p-4 pl-6">
    <div className="flex items-center justify-between">
      <Skeleton className="h-2.5 w-24" />
      <Skeleton className="h-5 w-16" rounded="full" />
    </div>
    <div className="flex items-center gap-4">
      <Skeleton className="h-11 w-11 shrink-0" rounded="xl" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3 w-3/4" />
        <Skeleton className="h-2.5 w-1/2" />
      </div>
    </div>
    <div className="flex items-center justify-between border-t border-(--color-zenthar-steel)/40 pt-2">
      <div className="flex items-center gap-3">
        <Skeleton className="h-2 w-12" />
        <Skeleton className="h-2 w-14" />
      </div>
      <Skeleton className="h-5 w-20" rounded="xl" />
    </div>
  </div>
);

// ─────────────────────────────────────────────
// Sample queue skeleton
// ─────────────────────────────────────────────

export const SampleQueueSkeleton: React.FC<{ count?: number }> = ({ count = 4 }) => (
  <div className="space-y-3 p-4">
    {Array.from({ length: count }).map((_, i) => (
      <SampleCardSkeleton key={i} />
    ))}
  </div>
);

// ─────────────────────────────────────────────
// Metric card skeleton
// ─────────────────────────────────────────────

export const MetricCardSkeleton: React.FC = () => (
  <div className="space-y-4 rounded-3xl border border-(--color-zenthar-steel) bg-(--color-zenthar-carbon) p-5">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-1.5">
        <Skeleton className="h-1.5 w-1.5" rounded="full" />
        <Skeleton className="h-2.5 w-20" />
      </div>
      <Skeleton className="h-9 w-9" rounded="2xl" />
    </div>
    <Skeleton className="h-10 w-20" rounded="xl" />
    <Skeleton className="h-2 w-28" />
  </div>
);

// ─────────────────────────────────────────────
// Table skeleton
// ─────────────────────────────────────────────

export const TableSkeleton: React.FC<{ rows?: number; columns?: number }> = ({ rows = 6, columns = 5 }) => (
  <div className="flex flex-col">
    <div className="flex gap-4 border-b border-(--color-zenthar-steel) px-6 py-4">
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton key={i} className="h-2.5 flex-1" />
      ))}
    </div>
    {Array.from({ length: rows }).map((_, ri) => (
      <div key={ri} className="flex gap-4 border-b border-(--color-zenthar-steel)/40 px-6 py-4">
        {Array.from({ length: columns }).map((_, ci) => (
          <Skeleton key={ci} className={clsx("h-3 flex-1", ci === 0 && "max-w-[80px]")} />
        ))}
      </div>
    ))}
  </div>
);

// ─────────────────────────────────────────────
// Chart skeleton
// ─────────────────────────────────────────────

export const ChartSkeleton: React.FC<{ height?: string }> = ({ height = "h-64" }) => (
  <div className={clsx("flex flex-col gap-3 p-5", height)}>
    <div className="flex flex-1 items-end gap-2">
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton
          key={i}
          className="flex-1 animate-pulse rounded-t-lg"
          style={{ height: `${30 + ((i * 13) % 55)}%` }}
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
  <div className="space-y-4 p-3">
    <div className="border-brand-primary/20 bg-brand-primary/5 flex items-center gap-4 rounded-3xl border p-5">
      <Skeleton className="h-12 w-12 shrink-0" rounded="2xl" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-32" />
        <div className="flex gap-2">
          <Skeleton className="h-5 w-20" rounded="lg" />
          <Skeleton className="h-5 w-16" rounded="lg" />
        </div>
      </div>
    </div>
    {[1, 2, 3].map((i) => (
      <div
        key={i}
        className="space-y-3 rounded-2xl border border-(--color-zenthar-steel) bg-(--color-zenthar-carbon)/60 p-5"
      >
        <div className="flex items-center justify-between border-b border-(--color-zenthar-steel)/40 pb-3">
          <div className="flex items-center gap-2">
            <Skeleton className="h-2 w-2" rounded="full" />
            <Skeleton className="h-3 w-16" />
          </div>
          <Skeleton className="h-5 w-20" rounded="lg" />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Skeleton className="h-2 w-20" />
            <Skeleton className="h-10" rounded="xl" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-2 w-20" />
            <Skeleton className="h-8" rounded="xl" />
            <Skeleton className="h-1.5" rounded="full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-2 w-16" />
            <Skeleton className="h-10" rounded="xl" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

// ─────────────────────────────────────────────
// Dashboard skeleton
// ─────────────────────────────────────────────

export const DashboardSkeleton: React.FC = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {[1, 2, 3, 4].map((i) => (
        <MetricCardSkeleton key={i} />
      ))}
    </div>
    <div className="grid grid-cols-12 gap-6">
      <div className="col-span-8">
        <div className="rounded-3xl border border-(--color-zenthar-steel) bg-(--color-zenthar-carbon) p-6">
          <Skeleton className="mb-6 h-4 w-40" />
          <ChartSkeleton height="h-60" />
        </div>
      </div>
      <div className="col-span-4 space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex gap-3 rounded-2xl border border-(--color-zenthar-steel) bg-(--color-zenthar-carbon) p-4"
          >
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
);
