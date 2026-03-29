import React from "react";
import { LucideIcon, Loader2 } from "lucide-react";

interface LabButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  fullWidth?: boolean;
  loading?: boolean;
  icon?: LucideIcon;
}

export const LabButton: React.FC<LabButtonProps> = ({
  children,
  variant = "primary",
  fullWidth = false,
  loading = false,
  icon: Icon,
  className = "",
  disabled,
  ...props
}) => {
  const baseStyles =
    "relative inline-flex items-center justify-center gap-2 px-6 py-4 text-[11px] font-black uppercase tracking-[0.15em] rounded-2xl transition-all duration-300 outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-[0.98] overflow-hidden group";

  const variants = {
    primary:
      "bg-brand-primary text-white hover:bg-brand-primary/90 shadow-xl shadow-brand-primary/20 focus:ring-brand-primary border-b-4 border-brand-deep/20",
    secondary:
      "bg-white text-brand-deep hover:bg-brand-mist/80 focus:ring-brand-mist border-b-4 border-brand-sage/20 shadow-lg shadow-brand-sage/5",
    danger:
      "bg-red-500 text-white hover:bg-red-600 shadow-xl shadow-red-500/20 focus:ring-red-500 border-b-4 border-red-700/30",
    ghost:
      "bg-transparent text-brand-sage hover:bg-brand-mist/50 hover:text-brand-deep focus:ring-brand-mist",
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${fullWidth ? "w-full" : ""} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {/* Hover Gradient Effect */}
      {variant !== "ghost" && (
        <div className="absolute inset-0 bg-linear-to-r from-white/0 via-white/10 to-white/0 translate-x--100% group-hover:translate-x-100% transition-transform duration-700 ease-in-out" />
      )}
      
      <div className="relative z-10 flex items-center gap-2">
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : Icon ? (
          <Icon className="w-4 h-4 transition-transform group-hover:scale-110" />
        ) : null}
        {children}
      </div>
    </button>
  );
};
