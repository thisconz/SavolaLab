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

const LogoContext = createContext<LogoContextValue | undefined>(undefined);

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
  ({ children, className, size = "md", variant = "dark", direction = "row", align = "center" }) => {
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
          "text-brand-primary relative flex items-center justify-center transition-all duration-500 ease-out",
          "isolation-auto will-change-transform", // Performance optimization
          interactive && "cursor-pointer hover:scale-110 hover:rotate-3 active:scale-95",
          className,
        )}
      >
        {/* Ambient Glow - Subtle breathing effect behind the icon */}
        {animated && (
          <div className="absolute inset-0 animate-pulse rounded-full bg-current opacity-10 blur-xl" />
        )}

        {/* Rotating hex - Now using backface-visibility for smoother rendering */}
        <div
          className={clsx(
            "relative z-10 transition-transform duration-700",
            animated && "animate-[spin_12s_linear_infinite]",
          )}
          style={{ backfaceVisibility: "hidden" }}
        >
          <Hexagon
            size={config.icon}
            strokeWidth={2.2}
            className="opacity-90 drop-shadow-[0_0_8px_rgba(var(--brand-primary-rgb),0.5)]"
          />
        </div>

        {/* Multi-stage Pulse - More premium than a single standard ping */}
        {animated && (
          <>
            <span className="absolute h-full w-full animate-[ping_2.5s_cubic-bezier(0,0,0.2,1)_infinite] rounded-full border border-current opacity-20" />
            <span className="absolute h-[70%] w-[70%] animate-[ping_3.5s_linear_infinite] rounded-full border border-current opacity-10" />
          </>
        )}

        {/* Core node - Enhanced with a blurred pseudo-glow */}
        <div className="absolute inset-0 z-20 flex items-center justify-center">
          <div className="relative h-1.5 w-1.5 rounded-full bg-current shadow-[0_0_10px_currentColor]">
            <div className="absolute inset-0 animate-pulse rounded-full bg-current opacity-60 blur-[2px]" />
          </div>
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
  ({
    title = "Zenthar",
    subtitle = `Quality Control Platform ${import.meta.env.VITE_ZENTHAR_VERSION}`,
    className,
  }) => {
    const { size, variant } = useLogo();
    const config = sizeConfig[size];

    const isLight = variant === "light";
    const textColor = isLight
      ? "text-(--color-zenthar-text-primary)"
      : "text-(--color-zenthar-text-secondary)";

    const [primary, accent] = splitTitle(title);

    return (
      <div className={clsx("flex flex-col leading-none", className)}>
        {/* Title */}
        <span className={clsx("font-black tracking-tight uppercase", config.title, textColor)}>
          {primary}
          <span className="text-brand-primary relative">
            {accent}
            <span className="absolute inset-0 opacity-30 blur-sm">{accent}</span>
          </span>
        </span>

        {/* Subtitle */}
        {subtitle && (
          <span
            className={clsx(
              "mt-1 font-mono text-[9px] tracking-[0.3em] uppercase opacity-70",
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
  const index = title.toLowerCase().lastIndexOf("thar");
  if (index === -1) return [title, ""];
  return [title.slice(0, index), title.slice(index)];
}
