import React, { memo } from "react";
import { LucideIcon } from "lucide-react";
import { motion, AnimatePresence } from "@/src/lib/motion";
import clsx from "@/src/lib/clsx";

interface NavIconProps {
  icon: LucideIcon;
  active: boolean;
  onClick: () => void;
  label: string;
  badge?: number | string; // New: Added for notifications/status
}

export const NavIcon: React.FC<NavIconProps> = memo(({
  icon: Icon,
  active,
  onClick,
  label,
  badge,
}) => {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "relative group flex flex-col items-center justify-center w-20 h-20 rounded-4xl",
        "transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]",
        "outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/50",
        active
          ? "bg-brand-deep text-white shadow-[0_20px_40px_-12px_rgba(0,0,0,0.3)] scale-105"
          : "text-brand-sage hover:bg-brand-mist/10 hover:text-brand-deep"
      )}
    >
      {/* 1. AMBIENT GLOW (Active State) */}
      <AnimatePresence>
        {active && (
          <motion.div
            layoutId="navGlow"
            className="absolute inset-0 bg-brand-primary/20 blur-2xl rounded-full pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
        )}
      </AnimatePresence>

      {/* 2. ICON CONTAINER */}
      <div className="relative z-10 flex flex-col items-center gap-1.5">
        <Icon
          className={clsx(
            "w-6 h-6 transition-all duration-500",
            active 
              ? "text-brand-primary scale-110 drop-shadow-[0_0_8px_rgba(177,190,155,0.5)]" 
              : "group-hover:scale-110 group-hover:text-brand-deep"
          )}
          strokeWidth={active ? 2.5 : 2}
        />
        
        {/* 3. LABEL: Monospace Industrial Style */}
        <span
          className={clsx(
            "text-[7px] font-black uppercase tracking-[0.3em] transition-all duration-500",
            active ? "text-white opacity-100" : "text-brand-sage/60 group-hover:text-brand-deep group-hover:opacity-100"
          )}
        >
          {label}
        </span>
      </div>

      {/* 4. NOTIFICATION BADGE */}
      {badge && (
        <span className="absolute top-4 right-4 flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-primary opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-primary"></span>
        </span>
      )}

      {/* 5. ACTIVE INDICATOR (The "Pill") */}
      {active && (
        <motion.div
          layoutId="activeNavIndicator"
          className="absolute -left-1 top-1/2 -translate-y-1/2 w-1.5 h-10 bg-brand-primary rounded-r-full shadow-[0_0_15px_#B1BE9B]"
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
      )}

      {/* 6. HOVER TOOLTIP (Optional Desktop Polish) */}
      <div className="absolute left-full ml-4 px-3 py-1.5 bg-brand-deep text-white text-[9px] font-black uppercase tracking-widest rounded-lg opacity-0 -translate-x-2.5 pointer-events-none group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 z-50">
        {label}
        <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-brand-deep rotate-45" />
      </div>
    </button>
  );
});

NavIcon.displayName = "NavIcon";