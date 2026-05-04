import { memo, type FC } from "react";
import clsx from "clsx";

export type StatusVariant =
  | "success"
  | "warning"
  | "error"
  | "info"
  | "primary"
  | "muted"
  | "critical"
  | "neutral";

interface StatusPillProps {
  label: string;
  variant?: StatusVariant;
  dot?: boolean;
  className?: string;
  size?: "xs" | "sm" | "md";
}

const PILL_CONFIG: Record<
  StatusVariant,
  { bg: string; border: string; color: string; dot: string; glow: string }
> = {
  success: {
    bg: "rgba(16,185,129,0.08)",
    border: "rgba(16,185,129,0.25)",
    color: "#10b981",
    dot: "#10b981",
    glow: "rgba(16,185,129,0.3)",
  },
  warning: {
    bg: "rgba(245,158,11,0.08)",
    border: "rgba(245,158,11,0.25)",
    color: "#f59e0b",
    dot: "#f59e0b",
    glow: "rgba(245,158,11,0.3)",
  },
  error: {
    bg: "rgba(239,68,68,0.08)",
    border: "rgba(239,68,68,0.25)",
    color: "#ef4444",
    dot: "#ef4444",
    glow: "rgba(239,68,68,0.3)",
  },
  info: {
    bg: "rgba(34,211,238,0.08)",
    border: "rgba(34,211,238,0.25)",
    color: "#22d3ee",
    dot: "#22d3ee",
    glow: "rgba(34,211,238,0.3)",
  },
  primary: {
    bg: "rgba(244,63,94,0.08)",
    border: "rgba(244,63,94,0.25)",
    color: "#f43f5e",
    dot: "#f43f5e",
    glow: "rgba(244,63,94,0.3)",
  },
  muted: {
    bg: "rgba(100,120,200,0.06)",
    border: "rgba(100,120,200,0.15)",
    color: "#8892b0",
    dot: "#8892b0",
    glow: "transparent",
  },
  critical: {
    bg: "rgba(244,63,94,0.12)",
    border: "rgba(244,63,94,0.35)",
    color: "#fb7185",
    dot: "#f43f5e",
    glow: "rgba(244,63,94,0.4)",
  },
  neutral: {
    bg: "rgba(100,120,200,0.04)",
    border: "rgba(100,120,200,0.1)",
    color: "#8892b0",
    dot: "#3d4a6b",
    glow: "transparent",
  },
};

const SIZE_STYLES = {
  xs: "px-2 py-0.5 text-[8px] gap-1",
  sm: "px-2.5 py-1 text-[9px] gap-1.5",
  md: "px-3 py-1.5 text-[10px] gap-2",
};

export const StatusPill: FC<StatusPillProps> = memo(
  ({ label, variant = "muted", dot = true, size = "sm", className }) => {
    const c = PILL_CONFIG[variant];

    return (
      <span
        className={clsx(
          "inline-flex items-center rounded-full font-black tracking-wider whitespace-nowrap uppercase",
          SIZE_STYLES[size],
          className,
        )}
        style={{
          background: c.bg,
          border: `1px solid ${c.border}`,
          color: c.color,
          boxShadow: c.glow !== "transparent" ? `0 0 8px ${c.glow}` : "none",
        }}
      >
        {dot && (
          <span
            className={clsx("shrink-0 rounded-full", size === "xs" ? "h-1 w-1" : "h-1.5 w-1.5")}
            style={{ background: c.dot, boxShadow: `0 0 4px ${c.dot}` }}
          />
        )}
        {label}
      </span>
    );
  },
);

StatusPill.displayName = "StatusPill";
