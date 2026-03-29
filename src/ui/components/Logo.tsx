import React, { createContext, useContext, memo } from "react";
import { Hexagon } from "lucide-react";
import clsx from "clsx";

/* ============================= */
/* Types */
/* ============================= */

type LogoVariant = "dark" | "light";
type LogoSize = "xs" | "sm" | "md" | "lg" | "xl";
type LogoDirection = "row" | "column";

interface LogoContextValue {
  size: LogoSize;
  variant: LogoVariant;
}

/* ============================= */
/* Context */
/* ============================= */

const LogoContext = createContext<LogoContextValue | null>(null);

function useLogo() {
  const ctx = useContext(LogoContext);
  if (!ctx) {
    throw new Error("Logo components must be used inside <LogoRoot>");
  }
  return ctx;
}

/* ============================= */
/* Size System */
/* ============================= */

const sizeConfig = {
  xs: { icon: 15, title: "text-sm", subtitle: "text-[8px]", gap: "gap-1.5" },
  sm: { icon: 20, title: "text-lg", subtitle: "text-[10px]", gap: "gap-2" },
  md: { icon: 30, title: "text-2xl", subtitle: "text-xs", gap: "gap-3" },
  lg: { icon: 40, title: "text-4xl", subtitle: "text-sm", gap: "gap-3.5" },
  xl: { icon: 60, title: "text-5xl", subtitle: "text-base", gap: "gap-4" },
} as const;

/* ============================= */
/* Root */
/* ============================= */

interface LogoRootProps {
  children: React.ReactNode;
  className?: string;
  size?: LogoSize;
  variant?: LogoVariant;
  direction?: LogoDirection;
  align?: "start" | "center" | "end";
}

export const LogoRoot: React.FC<LogoRootProps> = memo(
  ({
    children,
    className,
    size = "md",
    variant = "dark",
    direction = "row",
    align = "center",
  }) => {
    const config = sizeConfig[size];

    return (
      <LogoContext.Provider value={{ size, variant }}>
        <div
          role="img"
          aria-label="Logo"
          className={clsx(
            "flex items-center select-none",
            direction === "row" ? "flex-row" : "flex-col",
            align === "center" && "items-center",
            align === "start" && "items-start",
            align === "end" && "items-end",
            config.gap,
            className,
          )}
        >
          {children}
        </div>
      </LogoContext.Provider>
    );
  },
);

/* ============================= */
/* Icon */
/* ============================= */

interface LogoIconProps {
  animated?: boolean;
  interactive?: boolean;
  className?: string;
}

export const LogoIcon: React.FC<LogoIconProps> = memo(
  ({ animated = false, interactive = false, className }) => {
    const { size } = useLogo();
    const config = sizeConfig[size];

    return (
      <div
        className={clsx(
          "relative flex items-center justify-center text-brand-primary",
          interactive && "transition-transform duration-300 hover:scale-110",
          className,
        )}
      >
        {/* Rotating hex */}
        <Hexagon
          size={config.icon}
          strokeWidth={2.2}
          className={clsx(
            animated && "animate-[spin_12s_linear_infinite]",
            "opacity-90",
          )}
        />

        {/* Pulse ring */}
        {animated && (
          <span className="absolute h-full w-full rounded-full border border-current opacity-20 animate-ping" />
        )}

        {/* Core node */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-1.5 h-1.5 bg-current rounded-full shadow-[0_0_6px_currentColor]" />
        </div>
      </div>
    );
  },
);

/* ============================= */
/* Text */
/* ============================= */

interface LogoTextProps {
  title?: string;
  subtitle?: string;
  className?: string;
}

export const LogoText: React.FC<LogoTextProps> = memo(
  ({ title = "SavolaLab", subtitle = "QC Platform v1.0", className }) => {
    const { size, variant } = useLogo();
    const config = sizeConfig[size];

    const isLight = variant === "light";
    const textColor = isLight ? "text-white" : "text-brand-deep";

    const [primary, accent] = splitTitle(title);

    return (
      <div className={clsx("flex flex-col leading-none", className)}>
        {/* Title */}
        <span
          className={clsx(
            "font-black uppercase tracking-tight",
            config.title,
            textColor,
          )}
        >
          {primary}
          <span className="text-brand-primary relative">
            {accent}
            <span className="absolute inset-0 blur-sm opacity-30">
              {accent}
            </span>
          </span>
        </span>

        {/* Subtitle */}
        {subtitle && (
          <span
            className={clsx(
              "font-mono uppercase tracking-[0.3em] opacity-70 mt-1 text-[10px]",
              config.subtitle,
              textColor,
            )}
          >
            {subtitle}
          </span>
        )}
      </div>
    );
  },
);

/* ============================= */
/* Utils */
/* ============================= */

function splitTitle(title: string): [string, string] {
  const index = title.toLowerCase().lastIndexOf("lab");
  if (index === -1) return [title, ""];
  return [title.slice(0, index), title.slice(index)];
}
