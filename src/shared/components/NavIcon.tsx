import React, { memo } from "react";
import { LucideIcon } from "lucide-react";
import { motion, AnimatePresence } from "@/src/lib/motion";
import clsx from "@/src/lib/clsx";

interface NavIconProps {
  icon: LucideIcon;
  active: boolean;
  onClick: () => void;
  label: string;
  badge?: number | string; // Support numeric or string badges
}

export const NavIcon: React.FC<NavIconProps> = memo(
  ({ icon: Icon, active, onClick, label, badge }) => {
    return (
      <button
        onClick={onClick}
        className={clsx(
          "relative group flex flex-col items-center justify-center w-20 h-20 rounded-3xl",
          "transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]",
          "outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/50",
          active
            ? "bg-(--color-brand-deep) text-white shadow-[0_20px_40px_-12px_rgba(0,0,0,0.35)] scale-105"
            : "text-zenthar-text-secondary hover:bg-(--color-zenthar-steel) hover:text-(--color-zenthar-text-primary)",
        )}
      >
        {/* 1️⃣ Ambient Glow */}
        <AnimatePresence>
          {active && (
            <motion.div
              layoutId="navGlow"
              className="absolute inset-0 bg-brand-primary/20 blur-3xl rounded-full pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            />
          )}
        </AnimatePresence>

        {/* 2️⃣ Icon Container */}
        <div className="relative z-10 flex flex-col items-center gap-1.5">
          <Icon
            className={clsx(
              "w-6 h-6 transition-all duration-500",
              active
                ? "text-brand-primary scale-110 drop-shadow-[0_0_12px_rgba(44,230,209,0.5)]"
                : "group-hover:scale-110 group-hover:text-(--color-zenthar-text-primary)",
            )}
            strokeWidth={active ? 2.5 : 2}
          />

          {/* 3️⃣ Label */}
          <span
            className={clsx(
              "text-[7px] font-black uppercase tracking-[0.3em] transition-all duration-500 select-none",
              active
                ? "text-white opacity-100"
                : "text-zenthar-text-secondary/60 group-hover:text-(--color-zenthar-text-primary) group-hover:opacity-100",
            )}
          >
            {label}
          </span>
        </div>

        {/* 4️⃣ Badge (dynamic) */}
        {badge && (
          <span className="absolute top-3 right-3 flex items-center justify-center">
            <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-brand-primary opacity-50"></span>
            <span className="relative inline-flex items-center justify-center h-3 min-w-3 px-0.5 rounded-full bg-brand-primary text-[6px] font-bold text-black">
              {badge}
            </span>
          </span>
        )}

        {/* 5️⃣ Active Indicator Pill */}
        <AnimatePresence>
          {active && (
            <motion.div
              layoutId="activeNavIndicator"
              className="absolute -left-1 top-1/2 -translate-y-1/2 w-1.5 h-10 bg-brand-primary rounded-r-full shadow-[0_0_15px_rgba(44,230,209,0.5)]"
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
          )}
        </AnimatePresence>

        {/* 6️⃣ Tooltip */}
        <div className="absolute left-full ml-4 px-3 py-1.5 bg-(--color-brand-deep) text-white text-[9px] font-black uppercase tracking-widest rounded-lg opacity-0 -translate-x-2.5 pointer-events-none group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 z-50">
          {label}
          <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-(--color-brand-deep) rotate-45" />
        </div>
      </button>
    );
  },
);

NavIcon.displayName = "NavIcon";
