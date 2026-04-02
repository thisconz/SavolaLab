import React, { memo, useState } from "react";
import { motion, AnimatePresence } from "@/src/lib/motion";
import {
  LucideIcon,
  RefreshCw,
  AlertCircle,
  ChevronDown,
  Maximize2,
} from "lucide-react";
import { ErrorBoundary } from "./ErrorBoundary";

interface LabPanelProps {
  title: React.ReactNode;
  subtitle?: string;
  icon?: LucideIcon;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
  actions?: React.ReactNode;
  footer?: React.ReactNode;
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  collapsible?: boolean;
  defaultExpanded?: boolean;
}

export const LabPanel: React.FC<LabPanelProps> = memo(
  ({
    title,
    subtitle,
    icon: Icon,
    children,
    className = "",
    contentClassName = "",
    actions,
    footer,
    loading = false,
    error = null,
    onRefresh,
    collapsible = false,
    defaultExpanded = true,
  }) => {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`
        relative flex flex-col h-full overflow-hidden transition-all duration-500
        bg-white border border-brand-sage/15 rounded-[2.5rem] 
        hover:border-brand-primary/30 hover:shadow-[0_20px_50px_rgba(177,190,155,0.15)]
        group/panel ${className}
      `}
      >
        {/* 1. LAYER: TECHNICAL TEXTURE (The "Labrix" Grid) */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] group-hover/panel:opacity-[0.05] transition-opacity" />

        {/* 2. LAYER: DYNAMIC GLOW */}
        <div
          className={`
        absolute -top-24 -right-24 w-64 h-64 blur-[80px] rounded-full pointer-events-none transition-all duration-1000
        ${error ? "bg-red-500/10" : loading ? "bg-brand-primary/20 animate-pulse" : "bg-brand-primary/5 group-hover/panel:bg-brand-primary/15"}
      `}
        />

        {/* 3. HEADER ENGINE */}
        <div className="relative z-10 flex items-center justify-between px-8 py-6 border-b border-brand-sage/5 bg-white/60 backdrop-blur-md">
          <div className="flex items-center gap-5">
            {/* Icon Terminal Style */}
            <div className="relative flex-shrink-0">
              <div
                className={`absolute inset-0 blur-lg rounded-xl transition-all duration-500 ${loading ? "bg-brand-primary/40 scale-125" : "bg-brand-primary/10 scale-0 group-hover/panel:scale-110"}`}
              />
              <div className="relative p-3.5 bg-brand-deep rounded-2xl shadow-lg border border-white/10 group-hover/panel:-translate-y-1 transition-transform duration-500">
                {Icon && (
                  <Icon
                    className={`w-5 h-5 ${loading ? "text-brand-primary animate-pulse" : "text-white"}`}
                  />
                )}
              </div>
            </div>

            <div className="space-y-1">
              <h3 className="text-[12px] font-black uppercase tracking-[0.3em] text-brand-deep group-hover/panel:text-brand-primary transition-colors">
                {title}
              </h3>
              {subtitle && (
                <p className="text-[9px] font-mono font-bold text-brand-sage/60 uppercase tracking-widest leading-none">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {actions}
            {onRefresh && (
              <button
                onClick={onRefresh}
                disabled={loading}
                className="p-2 rounded-xl text-brand-sage hover:bg-brand-primary/10 hover:text-brand-primary transition-all active:scale-90"
              >
                <RefreshCw
                  className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
                />
              </button>
            )}
            {collapsible && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className={`p-2 rounded-xl transition-transform duration-500 ${isExpanded ? "" : "-rotate-180"}`}
              >
                <ChevronDown className="w-4 h-4 text-brand-sage" />
              </button>
            )}
          </div>
        </div>

        {/* 4. CONTENT VIEWPORT */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="flex-1 flex flex-col min-h-0"
            >
              <div
                className={`flex-1 overflow-y-auto custom-scrollbar p-8 relative ${contentClassName}`}
              >
                {/* Scanline Effect during loading */}
                {loading && (
                  <div className="absolute inset-0 z-30 pointer-events-none overflow-hidden rounded-b-[2.5rem]">
                    <div className="w-full h-[200%] bg-linear-to-b from-transparent via-brand-primary/5 to-transparent animate-scanline" />
                  </div>
                )}

                <ErrorBoundary name={`Labrix_Module_${title}`}>
                  <div
                    className={`transition-all duration-700 ${loading ? "opacity-20 blur-[2px] grayscale" : "opacity-100"}`}
                  >
                    {children}
                  </div>
                </ErrorBoundary>

                {/* Error Overlay */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 z-40 bg-white/90 backdrop-blur-md flex flex-col items-center justify-center p-10 text-center"
                  >
                    <div className="w-16 h-16 rounded-3xl bg-red-50 flex items-center justify-center mb-6 border border-red-100">
                      <AlertCircle className="w-8 h-8 text-red-500" />
                    </div>
                    <h4 className="text-[11px] font-black uppercase tracking-widest text-brand-deep mb-2">
                      Protocol Violation
                    </h4>
                    <p className="text-xs font-mono text-brand-sage mb-8 max-w-[280px] italic">
                      {error}
                    </p>
                    <button
                      onClick={onRefresh}
                      className="px-8 py-3 bg-brand-deep text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-brand-primary transition-all shadow-xl shadow-brand-deep/20"
                    >
                      Re-Initialize
                    </button>
                  </motion.div>
                )}
              </div>

              {/* 5. FOOTER SLOT (Optional) */}
              {footer && (
                <div className="px-8 py-5 bg-brand-mist/20 border-t border-brand-sage/5">
                  {footer}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Progress Indicator Line */}
        <div className="absolute bottom-0 left-0 w-full h-[2px] bg-brand-mist/10">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: loading ? "100%" : "0%" }}
            className="h-full bg-brand-primary shadow-[0_0_10px_#B1BE9B]"
          />
        </div>
      </motion.div>
    );
  },
);

LabPanel.displayName = "LabPanel";
