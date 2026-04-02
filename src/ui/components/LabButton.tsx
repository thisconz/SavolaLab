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
    "relative inline-flex items-center justify-center gap-2 px-8 py-4 text-[11px] font-black uppercase tracking-[0.2em] rounded-2xl transition-all duration-300 outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden group select-none";

  const variants = {
    primary:
      "bg-brand-primary text-white hover:bg-brand-primary/90 shadow-xl shadow-brand-primary/20 focus:ring-brand-primary border-b-4 border-brand-deep/20 active:border-b-0 active:translate-y-[2px]",
    secondary:
      "bg-white text-brand-deep hover:bg-brand-mist/80 focus:ring-brand-mist border-b-4 border-brand-sage/20 shadow-lg shadow-brand-sage/5 active:border-b-0 active:translate-y-[2px]",
    danger:
      "bg-red-500 text-white hover:bg-red-600 shadow-xl shadow-red-500/20 focus:ring-red-500 border-b-4 border-red-700/30 active:border-b-0 active:translate-y-[2px]",
    ghost:
      "bg-transparent text-brand-sage hover:bg-brand-mist/50 hover:text-brand-deep focus:ring-brand-mist active:scale-[0.97]",
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${fullWidth ? "w-full" : ""} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {/* High-End Gloss Sweep Effect */}
      {variant !== "ghost" && (
        <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500">
          <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent -skew-x-12 -translate-x-[200%] group-hover:translate-x-[200%] transition-transform duration-1000 ease-in-out" />
        </div>
      )}

      {/* Inner Shadow for "Pressed" Depth */}
      <div className="absolute inset-0 bg-black/5 opacity-0 group-active:opacity-100 transition-opacity pointer-events-none" />

      <div className="relative z-10 flex items-center justify-center">
        {/* Fixed-Width Icon Container to prevent layout shift */}
        <div
          className={`flex items-center justify-center transition-all duration-300 ${loading || Icon ? "w-5 mr-1" : "w-0"}`}
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin stroke-[3px]" />
          ) : Icon ? (
            <Icon className="w-4 h-4 transition-transform group-hover:scale-110 group-hover:-rotate-12" />
          ) : null}
        </div>

        <span className="relative">
          {children}
          {/* Subtle underline hover effect */}
          <span className="absolute -bottom-1 left-0 w-0 h-[1.5px] bg-current opacity-30 group-hover:w-full transition-all duration-500" />
        </span>
      </div>
    </button>
  );
};
