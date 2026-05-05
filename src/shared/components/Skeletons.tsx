import React from "react";
import clsx from "clsx";

interface SkeletonProps {
  className?: string;
  rounded?: string;
  style?: React.CSSProperties;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className, rounded = "rounded-lg", style }) => (
  <div
    style={style}
    className={clsx("animate-pulse", rounded, className)}
    style={{
      background: "linear-gradient(90deg, rgba(8,8,26,0.8) 25%, rgba(13,13,36,0.9) 50%, rgba(8,8,26,0.8) 75%)",
      backgroundSize: "200% 100%",
      animation: "shimmer 1.8s infinite",
      ...style,
    }}
  />
);

export const SampleCardSkeleton: React.FC = () => (
  <div
    className="rounded-2xl p-4 pl-6 space-y-3"
    style={{ background: "rgba(8,8,26,0.8)", border: "1px solid rgba(100,120,200,0.1)" }}
  >
    <div className="flex items-center justify-between">
      <Skeleton className="h-2.5 w-24 rounded-lg" />
      <Skeleton className="h-5 w-16 rounded-full" />
    </div>
    <div className="flex items-center gap-4">
      <Skeleton className="h-11 w-11 shrink-0 rounded-xl" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3 w-3/4 rounded-lg" />
        <Skeleton className="h-2.5 w-1/2 rounded-lg" />
      </div>
    </div>
    <div className="flex items-center justify-between pt-2" style={{ borderTop: "1px solid rgba(100,120,200,0.08)" }}>
      <div className="flex items-center gap-3">
        <Skeleton className="h-2 w-12 rounded" />
        <Skeleton className="h-2 w-14 rounded" />
      </div>
      <Skeleton className="h-5 w-20 rounded-xl" />
    </div>
  </div>
);

export const SampleQueueSkeleton: React.FC<{ count?: number }> = ({ count = 4 }) => (
  <div className="p-4 space-y-3">
    {Array.from({ length: count }).map((_, i) => <SampleCardSkeleton key={i} />)}
  </div>
);

export const MetricCardSkeleton: React.FC = () => (
  <div
    className="rounded-2xl p-5 space-y-4"
    style={{ background: "rgba(8,8,26,0.8)", border: "1px solid rgba(100,120,200,0.1)" }}
  >
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Skeleton className="h-1.5 w-1.5 rounded-full" />
        <Skeleton className="h-2.5 w-20 rounded-lg" />
      </div>
      <Skeleton className="h-9 w-9 rounded-xl" />
    </div>
    <Skeleton className="h-10 w-20 rounded-xl" />
    <Skeleton className="h-2 w-28 rounded" />
  </div>
);

export const TableSkeleton: React.FC<{ rows?: number; columns?: number }> = ({ rows = 6, columns = 5 }) => (
  <div className="flex flex-col">
    <div className="flex gap-4 px-5 py-4" style={{ borderBottom: "1px solid rgba(100,120,200,0.08)" }}>
      {Array.from({ length: columns }).map((_, i) => <Skeleton key={i} className="h-2.5 flex-1 rounded-lg" />)}
    </div>
    {Array.from({ length: rows }).map((_, ri) => (
      <div key={ri} className="flex gap-4 px-5 py-4" style={{ borderBottom: "1px solid rgba(100,120,200,0.06)" }}>
        {Array.from({ length: columns }).map((_, ci) => (
          <Skeleton key={ci} className={clsx("h-3 flex-1 rounded", ci === 0 && "max-w-[80px]")} />
        ))}
      </div>
    ))}
  </div>
);

export const ChartSkeleton: React.FC<{ height?: string }> = ({ height = "h-64" }) => (
  <div className={clsx("flex flex-col gap-3 p-5", height)}>
    <div className="flex items-end gap-2 flex-1">
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton
          key={i}
          className="flex-1 rounded-t-lg"
          style={{ height: `${30 + ((i * 13) % 55)}%` }}
        />
      ))}
    </div>
    <div className="flex gap-4">
      {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-2 flex-1 rounded" />)}
    </div>
  </div>
);

export const LabBenchSkeleton: React.FC = () => (
  <div className="space-y-4 p-3">
    <div
      className="p-5 rounded-2xl flex items-center gap-4"
      style={{ background: "rgba(244,63,94,0.05)", border: "1px solid rgba(244,63,94,0.15)" }}
    >
      <Skeleton className="h-12 w-12 shrink-0 rounded-2xl" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-32 rounded-lg" />
        <div className="flex gap-2">
          <Skeleton className="h-5 w-20 rounded-lg" />
          <Skeleton className="h-5 w-16 rounded-lg" />
        </div>
      </div>
    </div>
    {[1, 2, 3].map((i) => (
      <div key={i} className="rounded-2xl p-5 space-y-3" style={{ background: "rgba(8,8,26,0.8)", border: "1px solid rgba(100,120,200,0.1)" }}>
        <div className="flex items-center justify-between pb-3" style={{ borderBottom: "1px solid rgba(100,120,200,0.08)" }}>
          <div className="flex items-center gap-2">
            <Skeleton className="h-2 w-2 rounded-full" />
            <Skeleton className="h-3 w-16 rounded-lg" />
          </div>
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2"><Skeleton className="h-2 w-20 rounded" /><Skeleton className="h-10 rounded-xl" /></div>
          <div className="space-y-2"><Skeleton className="h-2 w-20 rounded" /><Skeleton className="h-8 rounded-xl" /><Skeleton className="h-1.5 rounded-full" /></div>
          <div className="space-y-2"><Skeleton className="h-2 w-16 rounded" /><Skeleton className="h-10 rounded-xl" /></div>
        </div>
      </div>
    ))}
  </div>
);