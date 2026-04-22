import React, { memo, useRef } from "react";
import { LucideIcon, Loader2 } from "lucide-react";
import {
  motion,
  AnimatePresence,
  useMotionTemplate,
  useMotionValue,
  useSpring,
} from "@/src/lib/motion";
import clsx from "@/src/lib/clsx";

interface LabButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | "primary"
    | "secondary"
    | "danger"
    | "ghost"
    | "laser"
    | "neon"
    | "cyber";
  fullWidth?: boolean;
  loading?: boolean;
  icon?: LucideIcon;
  iconPosition?: "left" | "right";
  pulse?: boolean;
  glitch?: boolean;
}

export const LabButton: React.FC<LabButtonProps> = memo(
  ({
    children,
    variant = "primary",
    fullWidth = false,
    loading = false,
    icon: Icon,
    iconPosition = "left",
    className = "",
    disabled,
    pulse = false,
    glitch = false,
    ...props
  }) => {
    const buttonRef = useRef<HTMLButtonElement>(null);

    // 1. RECTIFIED MOTION VALUES
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    const springConfig = { damping: 20, stiffness: 150 };

    // Initialize MotionValues first, then pass to useSpring separately to satisfy TS
    const mX = useMotionValue(0);
    const mY = useMotionValue(0);
    const tx = useSpring(mX, springConfig);
    const ty = useSpring(mY, springConfig);

    function handleMouseMove({
      currentTarget,
      clientX,
      clientY,
    }: React.MouseEvent) {
      const { left, top, width, height } =
        currentTarget.getBoundingClientRect();
      const x = clientX - left;
      const y = clientY - top;

      mouseX.set(x);
      mouseY.set(y);

      const centerX = width / 2;
      const centerY = height / 2;
      mX.set((x - centerX) / 8);
      mY.set((y - centerY) / 8);
    }

    function handleMouseLeave() {
      mX.set(0);
      mY.set(0);
    }

    const baseStyles = clsx(
      "relative inline-flex items-center justify-center gap-3 px-10 py-4",
      "text-[11px] font-display font-bold uppercase tracking-[0.4em] rounded-xl",
      "transition-all duration-300 outline-none select-none overflow-hidden group/btn",
      "disabled:opacity-30 disabled:cursor-not-allowed disabled:grayscale",
      fullWidth ? "w-full" : "w-fit",
    );

    const variants = {
      primary:
        "bg-brand-primary text-white shadow-[0_0_20px_rgba(var(--brand-primary-rgb),0.3)] hover:shadow-[0_0_40px_rgba(var(--brand-primary-rgb),0.5)]",
      secondary:
        "bg-white/[0.03] text-zinc-400 border border-white/10 hover:border-white/30 hover:text-white backdrop-blur-md",
      danger:
        "bg-red-950/20 text-red-500 border border-red-500/30 hover:bg-red-600 hover:text-white shadow-[inset_0_0_15px_rgba(239,68,68,0.1)]",
      ghost:
        "bg-transparent text-zinc-500 hover:text-brand-primary hover:bg-brand-primary/5",
      laser:
        "bg-black text-brand-primary border border-brand-primary/50 shadow-[0_0_15px_rgba(var(--brand-primary-rgb),0.2)]",
      neon: "bg-transparent text-white border-2 border-white/10 hover:border-brand-primary hover:shadow-[0_0_25px_rgba(var(--brand-primary-rgb),0.6)]",
      cyber:
        "bg-black text-brand-sage border-r-4 border-b-4 border-brand-primary shadow-xl",
    };

    const glowBackground = useMotionTemplate`
    radial-gradient(
      120px circle at ${mouseX}px ${mouseY}px,
      rgba(var(--brand-primary-rgb), 0.25),
      transparent 80%
    )
  `;

    return (
      <motion.button
        ref={buttonRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.96 }}
        className={clsx(
          baseStyles,
          variants[variant],
          pulse && "animate-pulse",
          glitch && "hover:animate-[skew_0.2s_infinite]",
          className,
        )}
        disabled={disabled || loading}
        {...props}
      >
        <motion.div
          className="absolute inset-0 z-0 pointer-events-none opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"
          style={{ background: glowBackground }}
        />

        <div className="absolute inset-0 pointer-events-none">
          {/* CANONICAL TAILWIND FIX */}
          <div className="absolute inset-0 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000 bg-linear-to-r from-transparent via-white/10 to-transparent" />
        </div>

        <motion.div
          style={{ x: tx, y: ty }}
          className={clsx(
            "relative z-10 flex items-center justify-center gap-3 transition-colors",
            iconPosition === "right" && "flex-row-reverse",
          )}
        >
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="loader"
                initial={{ opacity: 0, rotate: -180 }}
                animate={{ opacity: 1, rotate: 0 }}
                exit={{ opacity: 0 }}
              >
                <Loader2 className="w-4 h-4 animate-spin stroke-[3px]" />
              </motion.div>
            ) : Icon ? (
              <motion.div
                key="icon"
                className="group-hover/btn:scale-110 transition-transform"
              >
                <Icon
                  size={16}
                  className={clsx(variant === "danger" && "animate-bounce")}
                />
              </motion.div>
            ) : null}
          </AnimatePresence>

          <span className="relative tracking-[0.4em]">{children}</span>
        </motion.div>

        {/* TACTICAL HUD ACCENT - CANONICAL H-0.5 */}
        <div className="absolute top-0 left-0 w-full h-0.5 bg-linear-to-r from-transparent via-brand-primary/40 to-transparent opacity-0 group-hover/btn:opacity-100 transition-opacity" />

        <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-white/5 group-hover/btn:border-brand-primary/60 transition-colors" />
        <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-white/5 group-hover/btn:border-brand-primary/60 transition-colors" />

        {variant === "laser" && (
          <motion.div
            animate={{ x: ["-100%", "100%"] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 w-1/2 bg-linear-to-r from-transparent via-brand-primary/10 to-transparent skew-x-12 pointer-events-none"
          />
        )}

        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 opacity-0 group-hover/btn:opacity-100 transition-all">
          <span className="text-[6px] text-brand-primary/40 font-mono tracking-widest">
            BT-PRTCL-09
          </span>
        </div>
      </motion.button>
    );
  },
);

LabButton.displayName = "LabButton";
