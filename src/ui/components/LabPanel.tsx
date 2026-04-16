import React, { memo, useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "../../lib/motion";
import {
  LucideIcon,
  RefreshCw,
  AlertCircle,
  ChevronDown,
  Cpu,
  HardDrive,
  Hash,
  ShieldCheck,
  Radar,
  Dna,
  Terminal
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
        initial={{ opacity: 0, scale: 0.99 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ y: -4 }}
        className={clsx(
          "relative flex flex-col h-full overflow-hidden transition-all duration-500",
          "bg-[#050506] border border-white/5 rounded-[2.5rem]",
          "shadow-[0_20px_50px_rgba(0,0,0,0.5)] group/panel",
          className
        )}
      >
        {/* --- 1. THE "CORE" ATMOSPHERICS --- */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Circuitry Grid Pattern */}
          <svg className="absolute inset-0 w-full h-full opacity-[0.03] mix-blend-screen">
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" />
            </pattern>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>

          {/* Biometric Brackets (Corners) */}
          <div className="absolute top-8 left-8 w-4 h-4 border-t-2 border-l-2 border-white/10 rounded-tl-sm" />
          <div className="absolute top-8 right-8 w-4 h-4 border-t-2 border-r-2 border-white/10 rounded-tr-sm" />

          {/* Dynamic Core Glow */}
          <div className={clsx(
            "absolute -top-48 -left-48 w-160 h-160 blur-[150px] rounded-full transition-all duration-1000",
            error ? "bg-red-600/10" : loading ? "bg-brand-primary/15" : "bg-cyan-500/5"
          )} />
        </div>

        {/* --- 2. HEADER: COMMAND INTERFACE --- */}
        <header className="relative z-30 flex items-center justify-between pl-12 pr-8 py-8 border-b border-white/3 bg-black/40 backdrop-blur-2xl">
          <div className="flex items-center gap-6">
            {/* Status Nucleus */}
            <div className="relative flex items-center justify-center">
              <div className={clsx(
                "absolute inset-0 blur-md rounded-full transition-all duration-500",
                error ? "bg-red-500/40" : loading ? "bg-brand-primary/40 animate-pulse" : "bg-cyan-500/20"
              )} />
              <div className={clsx(
                "relative w-2.5 h-2.5 rounded-full border border-white/20 transition-colors duration-500",
                error ? "bg-red-500" : loading ? "bg-brand-primary shadow-[0_0_10px_#brand-primary]" : "bg-cyan-500/50"
              )} />
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-2 mb-1">
                <Terminal className="w-3 h-3 text-brand-primary/60" />
                <h3 className="text-[11px] font-black uppercase tracking-[0.5em] text-white">
                  {title}
                </h3>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[9px] font-mono font-bold text-zinc-500 tracking-tighter uppercase">
                  ID://{moduleId}
                </span>
                <div className="w-1 h-px bg-white/10" />
                <div className="flex items-center gap-1.5">
                    <Dna className="w-2.5 h-2.5 text-zinc-600" />
                    <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Sequence_V.2</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {showTelemetry && (
                <div className="hidden lg:flex flex-col items-end mr-4">
                    <span className="text-[7px] font-black text-zinc-600 uppercase tracking-[0.2em] mb-1">System_Uptime</span>
                    <div className="flex items-center gap-2">
                        <Radar className={clsx("w-3 h-3", loading ? "text-brand-primary animate-spin" : "text-zinc-500")} />
                        <span className="text-[10px] font-mono font-bold text-brand-sage">
                            {uptime.toString().padStart(6, '0')}
                        </span>
                    </div>
                </div>
            )}
            
            <div className="flex items-center gap-1.5 p-1.5 bg-white/2 border border-white/5 rounded-xl">
                {actions}
                {onRefresh && (
                    <button
                        onClick={onRefresh}
                        className="p-2.5 rounded-lg text-zinc-500 hover:bg-white/5 hover:text-brand-primary transition-all active:scale-90"
                    >
                        <RefreshCw size={14} className={clsx(loading && "animate-spin")} />
                    </button>
                )}
                {collapsible && (
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="p-2.5 rounded-lg text-zinc-500 hover:bg-white/5 transition-all"
                    >
                        <ChevronDown size={14} className={clsx("transition-transform duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]", !isExpanded && "-rotate-180")} />
                    </button>
                )}
            </div>
          </div>
        </header>

        {/* --- 3. THE VIEWPORT ENGINE --- */}
        <AnimatePresence initial={false}>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ type: "spring", duration: 0.8, bounce: 0.1 }}
              className="flex-1 flex flex-col min-h-0 relative"
            >
              {/* Kinetic Background Shard */}
              <div className="absolute top-0 right-0 w-1/2 h-full bg-linear-to-bl from-brand-primary/2 to-transparent pointer-events-none" />

              <div className={clsx(
                "flex-1 overflow-y-auto custom-scrollbar p-10 md:p-12 relative z-10",
                contentClassName
              )}>
                <motion.div 
                    animate={loading ? { scale: 0.99, opacity: 0.4, filter: 'blur(8px) grayscale(1)' } : { scale: 1, opacity: 1, filter: 'blur(0px) grayscale(0)' }}
                    transition={{ duration: 0.8 }}
                >
                  <ErrorBoundary name={moduleId}>
                    {children}
                  </ErrorBoundary>
                </motion.div>

                {/* System Critical Overlay */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 z-50 bg-[#080101]/90 backdrop-blur-2xl flex flex-col items-center justify-center p-12"
                    >
                      <div className="w-20 h-20 mb-8 relative">
                         <motion.div 
                            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                            transition={{ repeat: Infinity, duration: 2 }}
                            className="absolute inset-0 bg-red-600/20 blur-3xl rounded-full" 
                         />
                         <div className="relative w-full h-full flex items-center justify-center border-2 border-red-500/30 rounded-full bg-red-500/10">
                            <AlertCircle className="w-10 h-10 text-red-500" />
                         </div>
                      </div>
                      
                      <h4 className="text-[12px] font-black uppercase tracking-[0.6em] text-white mb-4">CRITICAL_SYSTEM_FAILURE</h4>
                      <div className="bg-red-500/5 border border-red-500/20 p-4 rounded-xl mb-10">
                        <code className="text-[11px] font-mono text-red-400/90">{error}</code>
                      </div>
                      
                      <button 
                        onClick={onRefresh} 
                        className="px-10 py-4 bg-red-600 hover:bg-red-500 text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-full transition-all hover:shadow-[0_0_30px_rgba(220,38,38,0.5)] active:scale-95"
                      >
                        Initiate Hard Reset
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* --- 4. FOOTER: DIAGNOSTICS --- */}
              <footer className="px-12 py-6 bg-black/60 border-t border-white/3 flex items-center justify-between">
                <div className="flex items-center gap-10">
                    {footer || (
                        <div className="flex items-center gap-8 opacity-40 group-hover/panel:opacity-80 transition-opacity duration-700">
                             <div className="flex items-center gap-3">
                                <ShieldCheck size={14} className="text-brand-primary" />
                                <div className="flex flex-col">
                                    <span className="text-[7px] font-black text-zinc-500 uppercase">Integrity</span>
                                    <span className="text-[9px] font-bold text-zinc-200">SECURE</span>
                                </div>
                             </div>
                             <div className="hidden sm:flex items-center gap-3 border-l border-white/5 pl-8">
                                <HardDrive size={14} className="text-zinc-500" />
                                <div className="flex flex-col">
                                    <span className="text-[7px] font-black text-zinc-500 uppercase">Memory</span>
                                    <span className="text-[9px] font-bold text-zinc-200">BUFFER_OK</span>
                                </div>
                             </div>
                        </div>
                    )}
                </div>

                {/* Heat Dissipation Array */}
                <div className="flex gap-2">
                    {[...Array(8)].map((_, i) => (
                        <motion.div 
                            key={i} 
                            animate={loading ? { opacity: [0.1, 0.5, 0.1] } : {}}
                            transition={{ delay: i * 0.1, repeat: Infinity }}
                            className="w-1 h-4 bg-white/5 rounded-full" 
                        />
                    ))}
                </div>
              </footer>
            </motion.div>
          )}
        </AnimatePresence>

        {/* --- 5. DATA STREAM BAR --- */}
        <div className="absolute bottom-0 left-0 w-full h-1 bg-white/2">
            <AnimatePresence>
                {loading && (
                    <motion.div
                        initial={{ x: "-100%" }}
                        animate={{ x: "100%" }}
                        transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
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