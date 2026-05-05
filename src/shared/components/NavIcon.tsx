import React, { memo } from "react";
import type { LucideIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";

interface NavIconProps {
  icon: LucideIcon;
  active: boolean;
  onClick: () => void;
  label: string;
  badge?: number | string; // Support numeric or string badges
}

export const NavIcon: React.FC<NavIconProps> = memo(({ icon: Icon, active, onClick, label, badge }) => {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "group relative flex h-20 w-20 flex-col items-center justify-center rounded-3xl",
        "transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]",
        "focus-visible:ring-brand-primary/50 outline-none focus-visible:ring-2",
        active
          ? "scale-105 bg-(--color-brand-deep) text-white shadow-[0_20px_40px_-12px_rgba(0,0,0,0.35)]"
          : "text-zenthar-text-secondary hover:bg-(--color-zenthar-steel) hover:text-(--color-zenthar-text-primary)",
      )}
    >
      {/* 1️⃣ Ambient Glow */}
      <AnimatePresence>
        {active && (
          <motion.div
            layoutId="navGlow"
            className="bg-brand-primary/20 pointer-events-none absolute inset-0 rounded-full blur-3xl"
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
            "h-6 w-6 transition-all duration-500",
            active
              ? "text-brand-primary scale-110 drop-shadow-[0_0_12px_rgba(44,230,209,0.5)]"
              : "group-hover:scale-110 group-hover:text-(--color-zenthar-text-primary)",
          )}
          strokeWidth={active ? 2.5 : 2}
        />

        {/* 3️⃣ Label */}
        <span
          className={clsx(
            "text-[7px] font-black tracking-[0.3em] uppercase transition-all duration-500 select-none",
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
          <span className="bg-brand-primary absolute inline-flex h-3 w-3 animate-ping rounded-full opacity-50" />
          <span className="bg-brand-primary relative inline-flex h-3 min-w-3 items-center justify-center rounded-full px-0.5 text-[6px] font-bold text-black">
            {badge}
          </span>
        </span>
      )}

      {/* 5️⃣ Active Indicator Pill */}
      <AnimatePresence>
        {active && (
          <motion.div
            layoutId="activeNavIndicator"
            className="bg-brand-primary absolute top-1/2 -left-1 h-10 w-1.5 -translate-y-1/2 rounded-r-full shadow-[0_0_15px_rgba(44,230,209,0.5)]"
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
        )}
      </AnimatePresence>

      {/* 6️⃣ Tooltip */}
      <div className="pointer-events-none absolute left-full z-50 ml-4 -translate-x-2.5 rounded-lg bg-(--color-brand-deep) px-3 py-1.5 text-[9px] font-black tracking-widest text-white uppercase opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100">
        {label}
        <div className="absolute top-1/2 -left-1 h-2 w-2 -translate-y-1/2 rotate-45 bg-(--color-brand-deep)" />
      </div>
    </button>
  );
});

NavIcon.displayName = "NavIcon";
