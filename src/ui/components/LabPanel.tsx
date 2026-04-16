import React, { memo, useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "../../lib/motion";
import {
  LucideIcon,
  RefreshCw,
  AlertCircle,
  ChevronDown,
  Terminal,
  Activity,
  Cpu,
  Zap,
  HardDrive,
  Hash
} from "lucide-react";
import { ErrorBoundary } from "./ErrorBoundary";
import clsx from "@/src/lib/clsx";

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
  /** Shows a live 'uptime' counter in the footer */
  showTelemetry?: boolean;
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
    showTelemetry = true,
  }) => {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);
    const [uptime, setUptime] = useState(0);

    // Mock telemetry logic
    useEffect(() => {
      const interval = setInterval(() => setUptime((u) => u + 1), 1000);
      return () => clearInterval(interval);
    }, []);

    const moduleId = useMemo(() => {
      const str = typeof title === 'string' ? title : 'Node';
      return `LBX-${str.substring(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
    }, [title]);

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.99, y: 5 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className={clsx(
          "relative flex flex-col h-full overflow-hidden transition-all duration-700",
          "bg-(--color-zenthar-carbon) border border-white/4 rounded-[2.5rem]",
          "hover:border-white/8 hover:shadow-2xl shadow-black/50",
          "group/panel",
          className
        )}
      >
        {/* --- 1. ATMOSPHERICS & TEXTURE --- */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay" />
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/5 blur-[120px] rounded-full" />
        </div>

        {/* --- 2. HEADER: COMMAND MODULE --- */}
        <header className="relative z-30 flex items-center justify-between pl-10 pr-6 py-5 border-b border-white/3 bg-white/1 backdrop-blur-md">
          <div className="flex items-center gap-5">
            {/* Status LED */}
            <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-8 pointer-events-none overflow-hidden">
                <div className={clsx(
                    "w-1 h-full rounded-full transition-colors duration-500",
                    error ? "bg-red-500 shadow-[0_0_12px_#ef4444]" : 
                    loading ? "bg-brand-primary animate-pulse" : "bg-brand-sage/20"
                )} />
            </div>

            <div className="relative">
              <div className="p-3 bg-white/3 rounded-2xl border border-white/5 shadow-inner group-hover/panel:border-white/10 transition-colors">
                {Icon ? (
                  <Icon className={clsx("w-4 h-4", loading ? "text-brand-primary animate-pulse" : "text-white/80")} />
                ) : (
                  <Cpu className="w-4 h-4 text-white/40" />
                )}
              </div>
            </div>

            <div className="flex flex-col">
              <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-white/90">
                {title}
              </h3>
              <div className="flex items-center gap-2 mt-1 opacity-40 group-hover/panel:opacity-80 transition-opacity">
                <Hash className="w-2.5 h-2.5 text-brand-primary" />
                <span className="text-[9px] font-mono font-bold text-brand-sage tracking-tighter">
                  {moduleId}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center mr-2 px-3 py-1 bg-black/20 rounded-lg border border-white/2">
                 <Activity className="w-3 h-3 text-brand-primary mr-2" />
                 <span className="text-[9px] font-mono font-bold text-white/30 tracking-widest">{uptime}s</span>
            </div>
            
            <div className="h-6 w-px bg-white/5 mx-2" />
            
            {actions}
            
            {onRefresh && (
              <button
                onClick={onRefresh}
                className="p-2 rounded-xl text-brand-sage hover:bg-white/5 hover:text-brand-primary transition-all active:scale-90"
              >
                <RefreshCw className={clsx("w-3.5 h-3.5", loading && "animate-spin")} />
              </button>
            )}
            
            {collapsible && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-2 rounded-xl text-brand-sage hover:bg-white/5 transition-all"
              >
                <ChevronDown className={clsx("w-3.5 h-3.5 transition-transform duration-500", !isExpanded && "-rotate-180")} />
              </button>
            )}
          </div>
        </header>

        {/* --- 3. VIEWPORT ENGINE --- */}
        <AnimatePresence initial={false}>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ type: "spring", duration: 0.5, bounce: 0 }}
              className="flex-1 flex flex-col min-h-0 relative"
            >
              <div className={clsx(
                "flex-1 overflow-y-auto custom-scrollbar p-8 md:p-10",
                contentClassName
              )}>
                {/* Internal Mask for Loading State */}
                <div className={clsx(
                    "transition-all duration-700",
                    loading && "blur-sm opacity-20 scale-[0.99] grayscale pointer-events-none"
                )}>
                    <ErrorBoundary name={moduleId}>
                        {children}
                    </ErrorBoundary>
                </div>

                {/* System Error Overlay */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 z-50 bg-black/60 backdrop-blur-xl flex flex-col items-center justify-center p-10"
                    >
                      <div className="p-4 bg-red-500/10 rounded-2xl border border-red-500/20 mb-6">
                        <AlertCircle className="w-8 h-8 text-red-500" />
                      </div>
                      <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-white mb-2">Protocol_Violation</h4>
                      <p className="text-[11px] font-mono text-red-400 text-center max-w-xs mb-8">
                        {error}
                      </p>
                      <button onClick={onRefresh} className="px-6 py-2 bg-red-600 text-white text-[9px] font-black uppercase tracking-widest rounded-lg">
                        Retry Initialisation
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* --- 4. FOOTER: TELEMETRY & VENTS --- */}
              <footer className="px-8 py-4 bg-black/20 border-t border-white/3 flex items-center justify-between">
                <div className="flex items-center gap-6">
                    {footer || (
                        <div className="flex items-center gap-4 opacity-40">
                             <div className="flex items-center gap-2">
                                <Zap size={10} className="text-brand-primary" />
                                <span className="text-[8px] font-black uppercase tracking-tighter">Status: Active</span>
                             </div>
                             <div className="flex items-center gap-2">
                                <HardDrive size={10} />
                                <span className="text-[8px] font-black uppercase tracking-tighter">Buffer: Nominal</span>
                             </div>
                        </div>
                    )}
                </div>

                {/* Thermal Vent Decoration */}
                <div className="flex gap-1">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="w-1 h-3 bg-white/5 rounded-full" />
                    ))}
                </div>
              </footer>
            </motion.div>
          )}
        </AnimatePresence>

        {/* --- 5. PROGRESS SCAN-BAR --- */}
        <div className="absolute bottom-0 left-0 w-full h-0.5 bg-white/2">
            <AnimatePresence>
                {loading && (
                    <motion.div
                        initial={{ left: "-100%" }}
                        animate={{ left: "100%" }}
                        transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                        className="absolute top-0 h-full w-1/3 bg-linear-to-r from-transparent via-brand-primary to-transparent"
                    />
                )}
            </AnimatePresence>
        </div>
      </motion.div>
    );
  }
);

LabPanel.displayName = "LabPanel";