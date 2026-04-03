import React, { memo } from "react";
import { LucideIcon, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "@/src/lib/motion";
import clsx from "@/src/lib/clsx";

interface LabButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost" | "laser";
  fullWidth?: boolean;
  loading?: boolean;
  icon?: LucideIcon;
  iconPosition?: "left" | "right";
}

export const LabButton: React.FC<LabButtonProps> = memo(({
  children,
  variant = "primary",
  fullWidth = false,
  loading = false,
  icon: Icon,
  iconPosition = "left",
  className = "",
  disabled,
  ...props
}) => {
  
  const baseStyles = clsx(
    "relative inline-flex items-center justify-center gap-2.5 px-8 py-4",
    "text-[10px] font-black uppercase tracking-[0.25em] rounded-2xl",
    "transition-all duration-300 outline-none select-none overflow-hidden group",
    "disabled:opacity-50 disabled:cursor-not-allowed disabled:grayscale-[0.5]",
    fullWidth ? "w-full" : "w-fit"
  );

  const variants = {
    primary: "bg-brand-primary text-white shadow-[0_10px_20px_-10px_rgba(var(--brand-primary-rgb),0.5),inset_0_1px_0_rgba(255,255,255,0.2)] hover:bg-brand-primary/90",
    secondary: "bg-white text-brand-deep border border-brand-sage/20 shadow-[0_4px_12px_rgba(0,0,0,0.05)] hover:bg-brand-mist/50",
    danger: "bg-red-500 text-white shadow-[0_10px_20px_-10px_rgba(239,68,68,0.5)] hover:bg-red-600",
    ghost: "bg-transparent text-brand-sage hover:bg-brand-mist/40 hover:text-brand-deep",
    laser: "bg-brand-deep text-brand-primary border border-brand-primary/30 shadow-[0_0_15px_rgba(var(--brand-primary-rgb),0.2)] hover:shadow-[0_0_25px_rgba(var(--brand-primary-rgb),0.4)]",
  };

  return (
    <motion.button
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.97, y: 1 }}
      className={clsx(baseStyles, variants[variant], className)}
      disabled={disabled || loading}
      {...props}
    >
      {/* --- LAYER 1: GLOSS SWEEP (Surface Detail) --- */}
      {variant !== "ghost" && (
        <div className="absolute inset-0 pointer-events-none z-0">
          <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/10 to-transparent -skew-x-25 -translate-x-[250%] group-hover:translate-x-[250%] transition-transform duration-1000 ease-out" />
        </div>
      )}

      {/* --- LAYER 2: INTERACTIVE DEPTH --- */}
      <div className="absolute inset-0 bg-black/5 opacity-0 group-active:opacity-100 transition-opacity" />

      {/* --- LAYER 3: CONTENT --- */}
      <div className={clsx(
        "relative z-10 flex items-center justify-center gap-2",
        iconPosition === "right" && "flex-row-reverse"
      )}>
        <AnimatePresence mode="wait">
          {(loading || Icon) && (
            <motion.div
              initial={{ width: 0, opacity: 0, scale: 0.5 }}
              animate={{ width: "auto", opacity: 1, scale: 1 }}
              exit={{ width: 0, opacity: 0, scale: 0.5 }}
              className="flex items-center justify-center"
            >
              {loading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin stroke-[3px]" />
              ) : Icon ? (
                <Icon className="w-3.5 h-3.5 transition-transform group-hover:scale-110 group-hover:-rotate-6" />
              ) : null}
            </motion.div>
          )}
        </AnimatePresence>

        <span className="relative whitespace-nowrap">
          {children}
          {/* Kinetic Underline Accent */}
          <motion.span 
            className="absolute -bottom-1 left-0 h-px bg-current opacity-20"
            initial={{ width: 0 }}
            whileHover={{ width: "100%" }}
            transition={{ duration: 0.4, ease: "circOut" }}
          />
        </span>
      </div>

      {/* --- LAYER 4: SCANLINE FX (Laser Variant Only) --- */}
      {variant === "laser" && (
        <div className={clsx(
          "absolute inset-0 opacity-[0.05] pointer-events-none",
          "bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))]",
          "bg-size-[100%_2px,3px_100%]"
        )} />
      )}
    </motion.button>
  );
});

LabButton.displayName = "LabButton";