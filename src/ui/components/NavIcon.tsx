import React from "react";
import { LucideIcon } from "lucide-react";
import { motion } from "motion/react";

interface NavIconProps {
  icon: LucideIcon;
  active: boolean;
  onClick: () => void;
  label: string;
}

export const NavIcon: React.FC<NavIconProps> = ({
  icon: Icon,
  active,
  onClick,
  label,
}) => {
  return (
    <button
      onClick={onClick}
      className={`relative group flex flex-col items-center justify-center w-16 h-16 rounded-2xl transition-all duration-300 ${
        active
          ? "bg-brand-primary text-white shadow-lg shadow-brand-primary/30"
          : "text-brand-sage hover:bg-white/10 hover:text-white"
      }`}
    >
      <Icon
        className={`w-6 h-6 mb-1 transition-transform duration-300 ${active ? "scale-110" : "group-hover:scale-110"}`}
      />
      <span
        className={`text-[8px] font-bold uppercase tracking-widest transition-opacity duration-300 ${active ? "opacity-100" : "opacity-70 group-hover:opacity-100"}`}
      >
        {label}
      </span>
      {active && (
        <motion.div
          layoutId="activeNavIndicator"
          className="absolute -left-2 top-1/2 -translate-y-1/2 w-1 h-8 bg-brand-primary rounded-r-full"
        />
      )}
    </button>
  );
};
