import React, { useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Hexagon, ShieldCheck, Zap } from "lucide-react";
import clsx from "clsx";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  sidePanel?: React.ReactNode;
  maxWidth?: string;
  showShield?: boolean;
  accentColor?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen, onClose, title, subtitle, children, footer,
  sidePanel, maxWidth = "max-w-2xl", showShield = true,
  accentColor = "#f43f5e",
}) => {
  const modalRef = useRef<HTMLDivElement>(undefined);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") onClose();
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const original = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = original;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, handleKeyDown]);

  if (typeof document === "undefined") return undefined;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-8">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 cursor-zoom-out"
            style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(16px)" }}
          />

          {/* Modal frame */}
          <motion.div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0, scale: 0.94, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 20 }}
            transition={{ type: "spring", damping: 28, stiffness: 220 }}
            className={clsx("relative w-full flex flex-col md:flex-row overflow-hidden rounded-2xl", maxWidth)}
            style={{
              background: "linear-gradient(135deg, rgba(8,8,26,0.99) 0%, rgba(5,5,15,1) 100%)",
              border: `1px solid ${accentColor}33`,
              boxShadow: `0 0 60px ${accentColor}15, 0 24px 80px rgba(0,0,0,0.9), inset 0 1px 0 rgba(255,255,255,0.04)`,
            }}
          >
            {/* Grid */}
            <div className="absolute inset-0 instrument-grid opacity-40 pointer-events-none" />

            {/* Top border glow */}
            <div
              className="absolute top-0 left-0 right-0 h-px pointer-events-none z-10"
              style={{ background: `linear-gradient(90deg, transparent, ${accentColor}80, rgba(139,92,246,0.6), transparent)` }}
            />

            {/* Scan line */}
            <motion.div
              animate={{ top: ["-5%", "110%"] }}
              transition={{ repeat: Infinity, duration: 5, ease: "linear" }}
              className="absolute left-0 right-0 h-[8%] pointer-events-none z-20"
              style={{
                background: `linear-gradient(180deg, transparent, ${accentColor}06, transparent)`,
                borderTop: `1px solid ${accentColor}15`,
              }}
            />

            {/* Main panel */}
            <div className="flex-1 flex flex-col min-w-0 relative z-30">

              {/* Header */}
              <header
                className="flex items-center justify-between px-7 py-5 border-b"
                style={{
                  background: "rgba(8,8,26,0.6)",
                  borderColor: "rgba(100,120,200,0.1)",
                }}
              >
                <div className="flex items-center gap-4">
                  <div
                    className="relative w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden"
                    style={{
                      background: `${accentColor}12`,
                      border: `1px solid ${accentColor}30`,
                      boxShadow: `0 0 20px ${accentColor}15`,
                    }}
                  >
                    <Hexagon className="w-5 h-5" style={{ color: accentColor }} />
                    <motion.div
                      animate={{ opacity: [0.1, 0.3, 0.1] }}
                      transition={{ duration: 3, repeat: Infinity }}
                      className="absolute inset-0"
                      style={{ background: `linear-gradient(135deg, ${accentColor}20, transparent)` }}
                    />
                  </div>

                  <div>
                    <h3 className="text-[11px] font-black text-zenthar-text-primary uppercase tracking-[0.4em] leading-none mb-1.5">
                      {title}
                    </h3>
                    <div className="flex items-center gap-2">
                      <Zap size={9} style={{ color: `${accentColor}60` }} />
                      <span className="text-[9px] font-mono font-bold text-zenthar-text-muted uppercase tracking-widest">
                        {subtitle || "Protocol_Active"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {showShield && (
                    <div
                      className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest"
                      style={{
                        background: "rgba(16,185,129,0.08)",
                        border: "1px solid rgba(16,185,129,0.2)",
                        color: "#10b981",
                      }}
                    >
                      <ShieldCheck size={11} />
                      Verified
                    </div>
                  )}

                  <button
                    onClick={onClose}
                    className="p-2.5 rounded-xl transition-all text-zenthar-text-muted hover:text-red-400"
                    style={{
                      background: "rgba(8,8,26,0.8)",
                      border: "1px solid rgba(100,120,200,0.1)",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background = "rgba(239,68,68,0.1)";
                      (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(239,68,68,0.2)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background = "rgba(8,8,26,0.8)";
                      (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(100,120,200,0.1)";
                    }}
                  >
                    <X size={16} />
                  </button>
                </div>
              </header>

              {/* Body */}
              <main className="flex-1 overflow-y-auto p-7 custom-scrollbar">
                {children}
              </main>

              {/* Footer */}
              <footer
                className="px-7 py-4 flex items-center justify-between"
                style={{
                  background: "rgba(5,5,15,0.8)",
                  borderTop: "1px solid rgba(100,120,200,0.08)",
                }}
              >
                <div className="flex items-center gap-2 opacity-40">
                  <div
                    className="w-1.5 h-1.5 rounded-full animate-pulse"
                    style={{ background: accentColor }}
                  />
                  <span className="text-[7px] font-mono text-zenthar-text-muted uppercase tracking-widest">
                    Active_TX
                  </span>
                </div>
                <div className="flex items-center gap-3">{footer}</div>
              </footer>
            </div>

            {/* Side panel */}
            {sidePanel && (
              <aside
                className="w-full md:w-72 flex flex-col"
                style={{
                  background: "rgba(5,5,15,0.5)",
                  borderLeft: "1px solid rgba(100,120,200,0.08)",
                }}
              >
                <div
                  className="px-6 py-5 border-b"
                  style={{ borderColor: "rgba(100,120,200,0.08)" }}
                >
                  <span className="text-[8px] font-black text-zenthar-text-muted uppercase tracking-widest">
                    Metadata_Buffer
                  </span>
                </div>
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                  {sidePanel}
                </div>
              </aside>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
};