import React, { useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "@/src/lib/motion";
import { X, Hexagon, Terminal, Activity, ShieldCheck, Zap, Radar, Fingerprint } from "lucide-react";
import clsx from "@/src/lib/clsx";

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
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  sidePanel,
  maxWidth = "max-w-5xl",
  showShield = true,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose],
  );

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
        <div className="fixed inset-0 z-9999 flex items-center justify-center p-4 md:p-8 lg:p-16 overflow-hidden perspective-[2000px]">
          {/* 1. ATMOSPHERIC BACKDROP */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-2xl cursor-zoom-out"
          >
            {/* Vignette Overlay */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.8)_100%)]" />
            {/* Grainy Texture */}
            <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay" />
          </motion.div>

          {/* 2. TACTICAL MODAL FRAME */}
          <motion.div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0, scale: 0.95, y: 40, rotateX: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0, rotateX: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 40, rotateX: -5 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className={clsx(
              "relative w-full flex flex-col md:flex-row bg-[#080809] rounded-[3rem] shadow-[0_0_80px_-20px_rgba(0,0,0,1)]",
              "overflow-hidden border border-white/6 backdrop-blur-3xl",
              maxWidth,
            )}
          >
            {/* HUD Scanline Effect */}
            <motion.div
              initial={{ top: "-10%" }}
              animate={{ top: "110%" }}
              transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
              className="absolute left-0 right-0 h-[10%] bg-linear-to-b from-transparent via-brand-primary/5 to-transparent z-40 pointer-events-none border-t border-brand-primary/10"
            />

            {/* MAIN INTERFACE */}
            <div className="flex-1 flex flex-col min-w-0 relative">
              {/* Biometric Brackets */}
              <div className="absolute top-6 left-6 w-3 h-3 border-t border-l border-white/10 rounded-tl-xs pointer-events-none" />
              <div className="absolute top-6 right-6 w-3 h-3 border-t border-r border-white/10 rounded-tr-xs pointer-events-none" />

              {/* HEADER: COMMAND MODULE */}
              <header className="relative z-10 flex items-center justify-between px-10 py-8 border-b border-white/3 bg-white/1">
                <div className="flex items-center gap-6">
                  <div className="relative group">
                    <div className="absolute inset-0 bg-brand-primary/20 blur-xl rounded-full animate-pulse" />
                    <div className="relative w-14 h-14 rounded-2xl bg-black/60 border border-white/10 flex items-center justify-center overflow-hidden transition-transform group-hover:scale-105">
                      <Hexagon className="w-6 h-6 text-brand-primary relative z-10" />
                      <motion.div
                        animate={{ opacity: [0.1, 0.4, 0.1] }}
                        transition={{ duration: 3, repeat: Infinity }}
                        className="absolute inset-0 bg-linear-to-tr from-brand-primary/40 to-transparent"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col">
                    <h3 className="text-[12px] font-black uppercase tracking-[0.6em] text-white leading-none mb-2">
                      {title}
                    </h3>
                    <div className="flex items-center gap-3">
                      <Radar className="w-3.5 h-3.5 text-brand-primary/50 animate-pulse" />
                      <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest leading-none">
                        {subtitle || "Protocol_Initialized"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {showShield && (
                    <div className="hidden sm:flex items-center gap-2.5 px-4 py-2 bg-black/40 border border-brand-primary/10 rounded-full shadow-inner">
                      <ShieldCheck size={12} className="text-brand-primary" />
                      <span className="text-[9px] font-black uppercase text-zinc-400 tracking-widest">
                        Verified_Link
                      </span>
                    </div>
                  )}
                  <button
                    onClick={onClose}
                    className="group relative p-3 rounded-2xl bg-white/3 text-zinc-500 hover:text-red-500 transition-all active:scale-90"
                    title="Close Interface"
                  >
                    <div className="absolute inset-0 bg-red-500/0 group-hover:bg-red-500/10 blur-md rounded-full transition-all" />
                    <X size={20} className="relative z-10" />
                  </button>
                </div>
              </header>

              {/* VIEWPORT ENGINE */}
              <main className="relative flex-1 overflow-y-auto p-10 lg:p-14 custom-scrollbar bg-linear-to-b from-transparent to-black/20">
                <div className="relative z-10">{children}</div>
                {/* Decorative Grid Shard */}
                <div className="absolute bottom-0 right-0 w-64 h-64 bg-brand-primary/1 blur-3xl rounded-full pointer-events-none" />
              </main>

              {/* FOOTER: TELEMETRY BAR */}
              <footer className="relative z-10 px-10 py-5 bg-black/40 border-t border-white/3 flex items-center justify-between">
                <div className="flex items-center gap-8">
                  <div className="flex items-center gap-3 opacity-40 hover:opacity-100 transition-opacity">
                    <Activity size={14} className="text-brand-primary animate-pulse" />
                    <div className="flex flex-col">
                      <span className="text-[7px] font-black text-zinc-600 uppercase">Stream</span>
                      <span className="text-[9px] font-bold text-zinc-300">ACTIVE_TX</span>
                    </div>
                  </div>
                  <div className="h-6 w-px bg-white/5" />
                  <div className="flex items-center gap-3 opacity-40 hover:opacity-100 transition-opacity">
                    <Zap size={12} className="text-orange-400" />
                    <div className="flex flex-col">
                      <span className="text-[7px] font-black text-zinc-600 uppercase">Latency</span>
                      <span className="text-[9px] font-bold text-zinc-300">0.02ms</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">{footer}</div>
              </footer>
            </div>

            {/* OPTIONAL: SIDE UTILITY PANEL */}
            {sidePanel && (
              <aside className="w-full md:w-80 bg-black/30 border-l border-white/4 flex flex-col relative">
                {/* Side Panel Header */}
                <div className="px-8 py-6 border-b border-white/3 flex items-center gap-3">
                  <Fingerprint size={14} className="text-brand-primary/40" />
                  <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">
                    Metadata_Buffer
                  </span>
                </div>
                {/* Side Panel Content */}
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">{sidePanel}</div>
                {/* Side Panel Decorative Vents */}
                <div className="p-4 flex gap-1 justify-center opacity-20">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-1 h-3 bg-white/20 rounded-full" />
                  ))}
                </div>
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
