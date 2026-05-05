import React, { memo } from "react";
import { type LucideIcon, Loader2 } from "lucide-react";
import { motion, type HTMLMotionProps } from "framer-motion";
import clsx from "clsx";

interface LabButtonProps extends HTMLMotionProps<"button"> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  fullWidth?: boolean;
  loading?: boolean;
  icon?: LucideIcon;
  iconPosition?: "left" | "right";
}

const VARIANT_STYLES = {
  primary: {
    base: {
      background: "linear-gradient(135deg, #f43f5e, #fb7185)",
      border: "1px solid rgba(244,63,94,0.3)",
      color: "#fff",
      boxShadow: "0 0 24px rgba(244,63,94,0.3), 0 4px 16px rgba(0,0,0,0.4)",
    },
    hover: {
      background: "linear-gradient(135deg, #fb7185, #f43f5e)",
      boxShadow: "0 0 36px rgba(244,63,94,0.5), 0 4px 20px rgba(0,0,0,0.5)",
    },
    disabled: {
      background: "rgba(8,8,26,0.8)",
      border: "1px solid rgba(100,120,200,0.1)",
      color: "rgba(136,146,176,0.4)",
      boxShadow: "none",
    },
  },
  secondary: {
    base: {
      background: "rgba(8,8,26,0.8)",
      border: "1px solid rgba(100,120,200,0.15)",
      color: "#8892b0",
      boxShadow: "none",
    },
    hover: {
      background: "rgba(244,63,94,0.06)",
      border: "1px solid rgba(244,63,94,0.25)",
      color: "#f43f5e",
    },
    disabled: {
      background: "rgba(8,8,26,0.6)",
      border: "1px solid rgba(100,120,200,0.08)",
      color: "rgba(136,146,176,0.3)",
      boxShadow: "none",
    },
  },
  danger: {
    base: {
      background: "rgba(239,68,68,0.08)",
      border: "1px solid rgba(239,68,68,0.25)",
      color: "#ef4444",
      boxShadow: "none",
    },
    hover: {
      background: "#ef4444",
      border: "1px solid rgba(239,68,68,0.5)",
      color: "#fff",
      boxShadow: "0 0 20px rgba(239,68,68,0.3)",
    },
    disabled: {
      background: "rgba(239,68,68,0.04)",
      border: "1px solid rgba(239,68,68,0.1)",
      color: "rgba(239,68,68,0.3)",
      boxShadow: "none",
    },
  },
  ghost: {
    base: {
      background: "transparent",
      border: "1px solid transparent",
      color: "rgba(136,146,176,0.6)",
      boxShadow: "none",
    },
    hover: {
      background: "rgba(244,63,94,0.05)",
      color: "#f43f5e",
    },
    disabled: {
      background: "transparent",
      border: "1px solid transparent",
      color: "rgba(136,146,176,0.2)",
      boxShadow: "none",
    },
  },
};

export const LabButton: React.FC<LabButtonProps> = memo(({
  children, variant = "primary", fullWidth = false, loading = false,
  icon: Icon, iconPosition = "left", className = "", disabled, ...props
}) => {
  const s = VARIANT_STYLES[variant];
  const isDisabled = disabled || loading;

  return (
    <motion.button
      whileHover={!isDisabled ? { scale: 1.02, y: -1 } : undefined}
      whileTap={!isDisabled ? { scale: 0.98 } : undefined}
      disabled={isDisabled}
      className={clsx(
        "relative inline-flex items-center justify-center gap-2.5 px-6 py-3",
        "text-[10px] font-black uppercase tracking-[0.3em] rounded-xl",
        "transition-all duration-300 outline-none select-none overflow-hidden group",
        "disabled:cursor-not-allowed",
        fullWidth && "w-full",
        className,
      )}
      style={isDisabled ? s.disabled : s.base}
      onMouseEnter={(e) => {
        if (!isDisabled && s.hover) {
          const el = e.currentTarget as HTMLButtonElement;
          Object.entries(s.hover).forEach(([key, val]) => {
            (el.style as any)[key] = val;
          });
        }
      }}
      onMouseLeave={(e) => {
        if (!isDisabled) {
          const el = e.currentTarget as HTMLButtonElement;
          Object.entries(s.base).forEach(([key, val]) => {
            (el.style as any)[key] = val;
          });
        }
      }}
      {...(props as any)}
    >
      {/* Shimmer effect for primary */}
      {variant === "primary" && !isDisabled && (
        <motion.div
          animate={{ x: ["-120%", "220%"] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
          className="absolute inset-y-0 w-1/4 -skew-x-12 pointer-events-none"
          style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)" }}
        />
      )}

      {/* Content */}
      <div className={clsx("relative z-10 flex items-center gap-2.5", iconPosition === "right" && "flex-row-reverse")}>
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : Icon ? (
          <Icon size={14} className="transition-transform group-hover:scale-110" />
        ) : undefined}
        <span>{children as React.ReactNode}</span>
      </div>

      {/* Corner accents */}
      <div
        className="absolute top-0 left-0 w-2 h-2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ borderTop: "1px solid rgba(244,63,94,0.5)", borderLeft: "1px solid rgba(244,63,94,0.5)" }}
      />
      <div
        className="absolute bottom-0 right-0 w-2 h-2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ borderBottom: "1px solid rgba(244,63,94,0.5)", borderRight: "1px solid rgba(244,63,94,0.5)" }}
      />
    </motion.button>
  );
});

LabButton.displayName = "LabButton";