import React, { memo, useState, useMemo } from "react";
import { motion, AnimatePresence } from "@/src/lib/motion";
import {
  LucideIcon,
  RefreshCw,
  AlertCircle,
  ChevronDown,
  Terminal,
  Activity,
  Cpu
} from "lucide-react";
import { ErrorBoundary } from "./ErrorBoundary";
import clsx from "@/src/lib/clsx"; // Assuming you use a utility like clsx or tailwind-merge

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

    // Generate a pseudo-unique ID for that "Industrial" look
    const moduleId = useMemo(() => {
      const str = typeof title === 'string' ? title : 'Module';
      return `LBX-${str.substring(0, 3).toUpperCase()}-${Math.floor(Math.random() * 1000)}`;
    }, [title]);

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className={clsx(
          "relative flex flex-col h-full overflow-hidden transition-all duration-500",
          "bg-white border border-brand-sage/15 rounded-[2.5rem]",
          "hover:border-brand-primary/40 hover:shadow-[0_32px_64px_-16px_rgba(177,190,155,0.2)]",
          "group/panel",
          className
        )}
      >
        {/* --- 1. LAYER: INDUSTRIAL TEXTURE --- */}
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none mix-blend-multiply bg-[url('https://www.transparenttextures.com/patterns/pinstriped-suit.png')]" />

        {/* --- 2. LAYER: SYSTEM STATUS INDICATOR (LED) --- */}
        <div className="absolute top-6 left-6 z-30 flex items-center gap-1.5 pointer-events-none">
          <div className={clsx(
            "w-1.5 h-1.5 rounded-full transition-all duration-500",
            error ? "bg-red-500 shadow-[0_0_8px_#ef4444]" : 
            loading ? "bg-brand-primary animate-pulse shadow-[0_0_8px_#B1BE9B]" : 
            "bg-brand-primary/40"
          )} />
        </div>

        {/* --- 3. HEADER ENGINE --- */}
        <div className="relative z-20 flex items-center justify-between pl-12 pr-8 py-6 border-b border-brand-sage/5 bg-white/80 backdrop-blur-xl">
          <div className="flex items-center gap-5">
            {/* Terminal-Style Icon Container */}
            <div className="relative group-hover/panel:-translate-y-0.5 transition-transform duration-500">
              <div className={clsx(
                "absolute inset-0 blur-xl rounded-full transition-all duration-700 opacity-0 group-hover/panel:opacity-100",
                error ? "bg-red-500/20" : "bg-brand-primary/30"
              )} />
              <div className="relative p-3 bg-brand-deep rounded-2xl shadow-inner-lg border border-white/10">
                {Icon ? (
                  <Icon className={clsx("w-5 h-5", loading ? "text-brand-primary animate-pulse" : "text-white")} />
                ) : (
                  <Cpu className="w-5 h-5 text-white/50" />
                )}
              </div>
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-3">
                <h3 className="text-[13px] font-black uppercase tracking-[0.25em] text-brand-deep leading-none">
                  {title}
                </h3>
                <span className="hidden md:block text-[9px] font-mono font-bold text-brand-sage/30 tracking-tighter">
                  {moduleId}
                </span>
              </div>
              {subtitle && (
                <div className="flex items-center gap-2 mt-1.5">
                  <Terminal className="w-2.5 h-2.5 text-brand-primary" />
                  <span className="text-[9px] font-mono font-bold text-brand-sage/60 uppercase tracking-widest leading-none">
                    {subtitle}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {actions}
            {onRefresh && (
              <button
                onClick={onRefresh}
                disabled={loading}
                className="p-2.5 rounded-xl text-brand-sage hover:bg-brand-mist hover:text-brand-deep transition-all active:scale-90 disabled:opacity-30"
              >
                <RefreshCw className={clsx("w-4 h-4", loading && "animate-spin")} />
              </button>
            )}
            {collapsible && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-2.5 rounded-xl text-brand-sage hover:bg-brand-mist transition-all"
              >
                <ChevronDown className={clsx("w-4 h-4 transition-transform duration-500", !isExpanded && "-rotate-180")} />
              </button>
            )}
          </div>
        </div>

        {/* --- 4. VIEWPORT ENGINE --- */}
        <AnimatePresence initial={false}>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ type: "spring", duration: 0.6, bounce: 0, stiffness: 120 }}
              className="flex-1 flex flex-col min-h-0"
            >
              <div className={clsx(
                "flex-1 overflow-y-auto custom-scrollbar p-10 relative",
                contentClassName
              )}>
                {/* Active Scanline */}
                {loading && (
                  <div className="absolute inset-0 z-30 pointer-events-none overflow-hidden">
                    <div className="w-full h-24 bg-linear-to-b from-brand-primary/5 to-transparent animate-scanline-fast opacity-50" />
                  </div>
                )}

                <ErrorBoundary name={`Lab_Module_${moduleId}`}>
                  <div className={clsx(
                    "transition-all duration-1000 cubic-bezier(0.16, 1, 0.3, 1)",
                    loading && "opacity-30 blur-sm grayscale scale-[0.99] pointer-events-none"
                  )}>
                    {children}
                  </div>
                </ErrorBoundary>

                {/* System Error Overlay */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="absolute inset-0 z-50 bg-white/95 backdrop-blur-md flex flex-col items-center justify-center p-12 text-center"
                    >
                      <div className="p-5 bg-red-50 rounded-full mb-6 border border-red-100 shadow-[0_0_40px_rgba(239,68,68,0.1)]">
                        <AlertCircle className="w-8 h-8 text-red-500" />
                      </div>
                      <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-brand-deep mb-3">Kernel Panic Detected</h4>
                      <p className="text-[12px] font-medium text-brand-sage mb-8 max-w-xs leading-relaxed italic px-4">
                        "{error}"
                      </p>
                      <button 
                        onClick={onRefresh}
                        className="group flex items-center gap-3 px-8 py-3 bg-brand-deep text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-red-500 transition-all shadow-xl"
                      >
                        <RefreshCw className="w-3.5 h-3.5 group-hover:rotate-180 transition-transform duration-500" />
                        Re-Initialize System
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* --- 5. FOOTER: TELEMETRY SLOT --- */}
              {footer && (
                <div className="px-10 py-5 bg-brand-mist/5 border-t border-brand-sage/5 flex items-center justify-between">
                  <div className="flex-1 italic">{footer}</div>
                  <div className="flex items-center gap-4 opacity-30">
                    <Activity className="w-3.5 h-3.5 text-brand-sage" />
                    <div className="h-4 w-px bg-brand-sage/20" />
                    <Terminal className="w-3.5 h-3.5 text-brand-sage" />
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* --- 6. BOTTOM SCAN BAR --- */}
        <div className="absolute bottom-0 left-0 w-full h-px bg-brand-sage/10 overflow-hidden">
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: loading ? "0%" : "-100%" }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="h-full w-full bg-brand-primary"
          />
        </div>
      </motion.div>
    );
  }
);

LabPanel.displayName = "LabPanel";