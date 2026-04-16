import React, { useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "@/src/lib/motion";
import { X, Hexagon, Terminal, Activity, ShieldCheck, Zap } from "lucide-react";
import clsx from "@/src/lib/clsx";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  sidePanel?: React.ReactNode; // New: Secondary info slot
  maxWidth?: string;
  showShield?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  sidePanel,
  maxWidth = "max-w-4xl",
  showShield = true,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  // --- Logic: Advanced Interaction ---
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") onClose();
    if (e.key === "Tab" && modalRef.current) {
      // Basic focus trap logic can be expanded here
    }
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;
    
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalStyle;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, handleKeyDown]);

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-9999 flex items-center justify-center p-4 md:p-12 overflow-hidden">
          {/* 1. BACKDROP: Deep Atmosphere */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-(--color-zenthar-void)/90 backdrop-blur-xl cursor-zoom-out"
          >
             <div className="absolute inset-0 bg-radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)" />
          </motion.div>

          {/* 2. MODAL FRAME */}
          <motion.div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0, scale: 0.9, y: 30, rotateX: 5 }}
            animate={{ opacity: 1, scale: 1, y: 0, rotateX: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            transition={{ type: "spring", damping: 20, stiffness: 200 }}
            className={clsx(
              "relative w-full flex flex-col md:flex-row bg-(--color-zenthar-carbon) rounded-[2.5rem] shadow-3xl overflow-hidden border border-white/5",
              maxWidth
            )}
          >
            {/* Aesthetic: Industrial Grid Overlay */}
            <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay" />

            {/* MAIN CONTAINER */}
            <div className="flex-1 flex flex-col min-w-0">
              
              {/* HEADER: Terminal Module */}
              <header className="relative z-10 flex items-center justify-between px-8 py-6 border-b border-white/3 bg-white/1">
                <div className="flex items-center gap-5">
                  <div className="relative">
                    <div className="absolute inset-0 bg-brand-primary/10 blur-lg rounded-full animate-pulse" />
                    <div className="relative w-11 h-11 rounded-xl bg-black/40 border border-white/10 flex items-center justify-center overflow-hidden">
                       <Hexagon className="w-5 h-5 text-brand-primary relative z-10" />
                       <motion.div 
                        animate={{ opacity: [0, 1, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute inset-0 bg-linear-to-tr from-brand-primary/20 to-transparent" 
                       />
                    </div>
                  </div>

                  <div className="flex flex-col">
                    <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-white/90 leading-none">
                      {title}
                    </h3>
                    <div className="flex items-center gap-2 mt-2">
                      <Terminal className="w-3 h-3 text-brand-primary/60" />
                      <span className="text-[9px] font-mono font-bold text-brand-sage opacity-40 uppercase tracking-widest leading-none">
                        {subtitle || "Accessing_Core_Buffer"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {showShield && (
                    <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-brand-primary/5 border border-brand-primary/10 rounded-full">
                      <ShieldCheck size={10} className="text-brand-primary" />
                      <span className="text-[8px] font-black uppercase text-brand-primary tracking-tighter">Verified</span>
                    </div>
                  )}
                  <button
                    onClick={onClose}
                    className="p-3 rounded-xl bg-white/3 text-brand-sage hover:bg-red-500/10 hover:text-red-500 transition-all active:scale-90"
                  >
                    <X size={18} />
                  </button>
                </div>
              </header>

              {/* VIEWPORT: Content Slot */}
              <main className="relative flex-1 overflow-y-auto p-8 md:p-12 custom-scrollbar bg-linear-to-b from-transparent to-black/20">
                {children}
              </main>

              {/* FOOTER: System Diagnostics */}
              <footer className="relative z-10 px-8 py-4 bg-black/40 border-t border-white/3 flex items-center justify-between">
                <div className="flex items-center gap-5">
                  <div className="flex items-center gap-2 opacity-30">
                    <Activity size={12} className="text-brand-primary animate-pulse" />
                    <span className="text-[8px] font-black uppercase tracking-[0.2em]">Telemetry: Nom</span>
                  </div>
                  <div className="h-4 w-px bg-white/10" />
                  <div className="flex items-center gap-2 opacity-30">
                    <Zap size={10} className="text-orange-400" />
                    <span className="text-[8px] font-black uppercase tracking-[0.2em]">Sync: 12ms</span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {footer}
                </div>
              </footer>
            </div>

            {/* OPTIONAL: Side Utility Panel */}
            {sidePanel && (
              <aside className="w-full md:w-72 bg-black/20 border-l border-white/3 p-8 flex flex-col gap-6">
                {sidePanel}
              </aside>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  if (typeof document === "undefined") return null;
  return createPortal(modalContent, document.body);
};