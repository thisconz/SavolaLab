import React, { memo, useRef } from "react";
import { LucideIcon, Loader2, Sparkles } from "lucide-react";
import { motion, AnimatePresence, useMotionTemplate, useMotionValue } from "@/src/lib/motion";
import clsx from "@/src/lib/clsx";

interface LabButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost" | "laser" | "neon";
  fullWidth?: boolean;
  loading?: boolean;
  icon?: LucideIcon;
  iconPosition?: "left" | "right";
  /** Adds a subtle pulse animation to suggest critical action */
  pulse?: boolean;
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
  pulse = false,
  ...props
}) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  
  // Mouse tracking for "Dynamic Glow"
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function handleMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  const baseStyles = clsx(
    "relative inline-flex items-center justify-center gap-3 px-8 py-4",
    "text-[10px] font-black uppercase tracking-[0.3em] rounded-2xl",
    "transition-all duration-500 outline-none select-none overflow-hidden group/btn",
    "disabled:opacity-40 disabled:cursor-not-allowed disabled:grayscale",
    fullWidth ? "w-full" : "w-fit"
  );

  const variants = {
    primary: "bg-brand-primary text-white shadow-[0_0_0_1px_rgba(255,255,255,0.1)_inset] hover:shadow-[0_20px_40px_-15px_rgba(var(--brand-primary-rgb),0.5)]",
    secondary: "bg-(--color-zenthar-carbon) text-white border border-white/10 hover:border-brand-primary/40 hover:bg-(--color-zenthar-graphite)",
    danger: "bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white hover:shadow-[0_0_30px_rgba(239,68,68,0.3)]",
    ghost: "bg-transparent text-brand-sage hover:bg-white/5 hover:text-white",
    laser: "bg-black text-brand-primary border border-brand-primary/30 shadow-[inset_0_0_12px_rgba(var(--brand-primary-rgb),0.1)]",
    neon: "bg-transparent text-white border border-white/20 hover:border-brand-primary hover:shadow-[0_0_20px_rgba(var(--brand-primary-rgb),0.4)]",
  };

  return (
    <motion.button
      ref={buttonRef}
      onMouseMove={handleMouseMove}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98, y: 0 }}
      className={clsx(baseStyles, variants[variant], pulse && "animate-pulse", className)}
      disabled={disabled || loading}
      {...props}
    >
      {/* --- LAYER 1: REACTIVE RADIAL GLOW --- */}
      <motion.div
        className="absolute inset-0 z-0 pointer-events-none opacity-0 group-hover/btn:opacity-100 transition-opacity duration-500"
        style={{
          background: useMotionTemplate`
            radial-gradient(
              400px circle at ${mouseX}px ${mouseY}px,
              rgba(var(--brand-primary-rgb), 0.15),
              transparent 80%
            )
          `,
        }}
      />

      {/* --- LAYER 2: TOP REFRACTION LINE --- */}
      <div className="absolute top-0 left-4 right-4 h-px bg-linear-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover/btn:opacity-100 transition-opacity" />

      {/* --- LAYER 3: CONTENT ORCHESTRATOR --- */}
      <div className={clsx(
        "relative z-10 flex items-center justify-center gap-2.5 transition-transform duration-500",
        loading && "opacity-80",
        iconPosition === "right" && "flex-row-reverse"
      )}>
        <AnimatePresence mode="popLayout" initial={false}>
          {loading ? (
            <motion.div
              key="loader"
              initial={{ opacity: 0, rotate: -180, scale: 0.5 }}
              animate={{ opacity: 1, rotate: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              className="flex items-center"
            >
              <Loader2 className="w-3.5 h-3.5 animate-spin stroke-[3px]" />
            </motion.div>
          ) : Icon ? (
            <motion.div
              key="icon"
              initial={{ opacity: 0, x: -5 }}
              animate={{ opacity: 1, x: 0 }}
              className="group-hover/btn:rotate-12 transition-transform duration-300"
            >
              <Icon className={clsx(
                "w-3.5 h-3.5",
                variant === "laser" && "drop-shadow-[0_0_5px_rgba(var(--brand-primary-rgb),0.8)]"
              )} />
            </motion.div>
          ) : null}
        </AnimatePresence>

        <span className="relative whitespace-nowrap overflow-hidden">
          {children}
          {/* Subtle "Data Stream" scan effect on text hover */}
          <motion.div 
            className="absolute bottom-0 left-0 h-[1px] bg-brand-primary"
            initial={{ x: "-100%" }}
            whileHover={{ x: "100%" }}
            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          />
        </span>
      </div>

      {/* --- LAYER 4: CORNER BRACKETS (Industrial Aesthetic) --- */}
      <div className="absolute top-2 left-2 w-1 h-1 border-t border-l border-white/10 group-hover/btn:border-brand-primary/50 transition-colors" />
      <div className="absolute bottom-2 right-2 w-1 h-1 border-b border-r border-white/10 group-hover/btn:border-brand-primary/50 transition-colors" />

      {/* --- LAYER 5: LASER SCANLINE --- */}
      {variant === "laser" && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-20">
          <motion.div 
            animate={{ y: ["-100%", "200%"] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="w-full h-[1px] bg-brand-primary shadow-[0_0_8px_var(--color-brand-primary)]"
          />
        </div>
      )}
    </motion.button>
  );
});

LabButton.displayName = "LabButton";