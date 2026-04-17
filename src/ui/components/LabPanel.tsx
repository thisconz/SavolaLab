import React, { memo, useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "../../lib/motion";
import {
  LucideIcon, RefreshCw, AlertCircle, ChevronDown, 
  Cpu, HardDrive, Hash, ShieldCheck, Radar, Dna, Terminal, Activity
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
  showTelemetry?: boolean;
}

export const LabPanel: React.FC<LabPanelProps> = memo(({
  title, subtitle, icon: Icon, children, className = "", contentClassName = "",
  actions, footer, loading = false, error = null, onRefresh,
  collapsible = false, defaultExpanded = true, showTelemetry = true,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [uptime, setUptime] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setUptime((u) => u + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const moduleId = useMemo(() => {
    const str = typeof title === 'string' ? title : 'Node';
    return `ZNT-${str.substring(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
  }, [title]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className={clsx(
        "relative flex flex-col h-full overflow-hidden transition-all duration-500",
        /* Light Theme Core: Frosted Apricot Glass */
        "bg-white/70 backdrop-blur-3xl border border-white rounded-[2.5rem]",
        "shadow-[0_20px_40px_rgba(69,9,32,0.04),inset_0_1px_2px_white] group/panel",
        className
      )}
    >
      {/* --- 1. ATMOSPHERICS (LIGHT MODE) --- */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Subtle Warm Grid */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.05]">
          <pattern id="light-grid" width="32" height="32" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="1" fill="#450920" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#light-grid)" />
        </svg>

        {/* Floating Gradient Bloom */}
        <div className={clsx(
          "absolute -top-24 -right-24 w-96 h-96 blur-[100px] rounded-full transition-all duration-1000 opacity-20",
          error ? "bg-crimson-violet/20" : loading ? "bg-blush-rose/30" : "bg-soft-apricot/40"
        )} />
      </div>

      {/* --- 2. HEADER: EDITORIAL INTERFACE --- */}
      <header className="relative z-30 flex items-center justify-between px-10 py-7 border-b border-crimson-violet/5 bg-white/30 backdrop-blur-md">
        <div className="flex items-center gap-5">
          {/* Status Indicator */}
          <div className="relative flex items-center justify-center w-3 h-3">
            <div className={clsx(
              "absolute inset-0 blur-md rounded-full transition-all duration-500",
              error ? "bg-cherry-rose/50" : loading ? "bg-blush-rose/50 animate-pulse" : "bg-soft-apricot"
            )} />
            <div className={clsx(
              "relative w-2 h-2 rounded-full border border-white transition-colors duration-500",
              error ? "bg-crimson-violet" : loading ? "bg-blush-rose" : "bg-soft-apricot shadow-sm"
            )} />
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h3 className="text-[12px] font-display font-black uppercase tracking-[0.3em] text-crimson-violet">
                {title}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-mono font-bold text-cherry-rose/60 tracking-tight">
                SYS_REF//{moduleId}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {showTelemetry && (
            <div className="hidden sm:flex flex-col items-end px-4 border-r border-crimson-violet/5">
              <span className="text-[7px] font-black text-cherry-rose/40 uppercase tracking-widest">Active_Uptime</span>
              <div className="flex items-center gap-2 text-crimson-violet font-mono text-[10px] font-bold">
                <Activity size={10} className={loading ? "animate-bounce" : ""} />
                {uptime.toString().padStart(5, '0')}s
              </div>
            </div>
          )}
          
          <div className="flex items-center gap-1">
            {actions}
            {onRefresh && (
              <button
                onClick={onRefresh}
                className="p-2 rounded-xl text-cherry-rose/40 hover:bg-white hover:text-blush-rose shadow-sm transition-all active:scale-90"
              >
                <RefreshCw size={14} className={clsx(loading && "animate-spin")} />
              </button>
            )}
            {collapsible && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-2 rounded-xl text-cherry-rose/40 hover:bg-white transition-all"
              >
                <ChevronDown size={14} className={clsx("transition-transform duration-500", !isExpanded && "-rotate-180")} />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* --- 3. VIEWPORT ENGINE --- */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="flex-1 flex flex-col relative"
          >
            <div className={clsx(
              "flex-1 overflow-y-auto p-8 md:p-10 relative z-10",
              contentClassName
            )}>
              <motion.div 
                animate={loading ? { opacity: 0.5, y: 5 } : { opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <ErrorBoundary name={moduleId}>
                  {children}
                </ErrorBoundary>
              </motion.div>

              {/* Error State Overlay */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-50 bg-white/95 backdrop-blur-xl flex flex-col items-center justify-center p-12 text-center"
                  >
                    <div className="w-16 h-16 mb-6 flex items-center justify-center border border-crimson-violet/10 rounded-3xl bg-soft-apricot/30">
                      <AlertCircle className="w-8 h-8 text-cherry-rose" />
                    </div>
                    <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-crimson-violet mb-2">Segment_Fault</h4>
                    <p className="text-[10px] font-mono text-cherry-rose mb-8 max-w-xs">{error}</p>
                    <button 
                      onClick={onRefresh} 
                      className="px-8 py-3 bg-crimson-violet text-soft-apricot text-[9px] font-black uppercase tracking-widest rounded-full hover:scale-105 transition-transform"
                    >
                      Re-Initialize
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* --- 4. FOOTER: LIGHT DIAGNOSTICS --- */}
            <footer className="px-10 py-5 bg-soft-apricot/10 border-t border-crimson-violet/5 flex items-center justify-between">
              <div className="flex items-center gap-6">
                {footer || (
                  <div className="flex items-center gap-6 opacity-60">
                    <div className="flex items-center gap-2">
                      <ShieldCheck size={12} className="text-blush-rose" />
                      <span className="text-[8px] font-bold text-crimson-violet uppercase tracking-tight">Verified</span>
                    </div>
                    <div className="h-3 w-px bg-crimson-violet/10" />
                    <div className="flex items-center gap-2">
                      <HardDrive size={12} className="text-cherry-rose" />
                      <span className="text-[8px] font-bold text-crimson-violet uppercase tracking-tight">Node_Ready</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Visual Heat Sink Bars */}
              <div className="flex gap-1">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="w-0.5 h-3 bg-crimson-violet/10 rounded-full" />
                ))}
              </div>
            </footer>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress Streamer */}
      <div className="absolute bottom-0 left-0 w-full h-0.5 bg-crimson-violet/5">
        <AnimatePresence>
          {loading && (
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: "100%" }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
              className="absolute top-0 h-full w-1/4 bg-linear-to-r from-transparent via-blush-rose to-transparent"
            />
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
});

LabPanel.displayName = "LabPanel_Light";