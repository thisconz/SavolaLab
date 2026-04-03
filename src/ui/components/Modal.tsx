import React, { useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "@/src/lib/motion";
import { X, Hexagon, Terminal, Activity } from "lucide-react";
import clsx from "@/src/lib/clsx";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string; // New: Adds to the Lab aesthetic
  children: React.ReactNode;
  footer?: React.ReactNode; // New: Explicit footer slot
  maxWidth?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxWidth = "max-w-2xl",
}) => {
  // Memoized escape handler
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") onClose();
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, handleKeyDown]);

  const modalContent = (
    <AnimatePresence mode="wait">
      {isOpen && (
        <div className="fixed inset-0 z-9999 flex items-center justify-center p-4 md:p-8">
          {/* 1. BACKDROP: Deep Glassmorphism */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-brand-deep/60 backdrop-blur-md cursor-zoom-out"
          />

          {/* 2. MODAL CORE */}
          <motion.div
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={clsx(
              "relative w-full bg-white rounded-[3rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.4)]",
              "flex flex-col max-h-[90vh] overflow-hidden border border-white/20",
              maxWidth
            )}
          >
            {/* Industrial Textures */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />

            {/* 3. HEADER: Terminal Style */}
            <header className="relative z-10 flex items-center justify-between px-10 py-8 border-b border-brand-sage/10 bg-white/50 backdrop-blur-sm">
              <div className="flex items-center gap-6">
                <div className="relative group/hex">
                  <div className="absolute inset-0 bg-brand-primary/20 blur-xl rounded-full scale-150 animate-pulse" />
                  <div className="relative w-12 h-12 rounded-2xl bg-brand-deep flex items-center justify-center shadow-lg border border-white/10 group-hover/hex:-rotate-12 transition-transform duration-500">
                    <Hexagon className="w-5 h-5 text-brand-primary fill-brand-primary/10" />
                  </div>
                </div>

                <div className="flex flex-col">
                  <h3 className="text-sm font-black uppercase tracking-[0.3em] text-brand-deep">
                    {title}
                  </h3>
                  {subtitle && (
                    <div className="flex items-center gap-2 mt-1.5 opacity-40">
                      <Terminal className="w-3 h-3 text-brand-primary" />
                      <span className="text-[9px] font-mono font-bold uppercase tracking-widest">{subtitle}</span>
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={onClose}
                className="group relative p-4 rounded-full text-brand-sage hover:text-red-500 transition-colors"
              >
                <div className="absolute inset-0 bg-red-50 rounded-full scale-0 group-hover:scale-100 transition-transform duration-300" />
                <X className="relative w-5 h-5 group-active:scale-90 transition-transform" />
              </button>
            </header>

            {/* 4. MAIN VIEWPORT */}
            <div className="relative flex-1 overflow-y-auto p-12 custom-scrollbar z-10 bg-linear-to-b from-white to-brand-mist/10">
              {children}
            </div>

            {/* 5. FOOTER: System Telemetry */}
            <footer className="relative z-10 px-10 py-5 bg-brand-deep border-t border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-4 text-white/30">
                <Activity className="w-3.5 h-3.5 animate-pulse" />
                <span className="text-[8px] font-mono font-bold uppercase tracking-[0.2em]">
                  Secure Protocol Active
                </span>
              </div>
              
              {footer ? (
                <div className="flex-1 flex justify-end">{footer}</div>
              ) : (
                <div className="h-1 w-20 bg-white/10 rounded-full overflow-hidden">
                  <motion.div 
                    animate={{ x: ["-100%", "100%"] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    className="h-full w-1/2 bg-brand-primary/40" 
                  />
                </div>
              )}
            </footer>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  // Render into portal to ensure z-index priority over all layout elements
  if (typeof document === "undefined") return null;
  return createPortal(modalContent, document.body);
};