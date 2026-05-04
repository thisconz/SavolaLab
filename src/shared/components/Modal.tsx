import React, { useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Hexagon, Activity, ShieldCheck, Zap, Radar, Fingerprint } from "lucide-react";
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
        <div className="fixed inset-0 z-9999 flex items-center justify-center overflow-hidden p-4 perspective-[2000px] md:p-8 lg:p-16">
          {/* 1. ATMOSPHERIC BACKDROP */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 cursor-zoom-out bg-black/80 backdrop-blur-2xl"
          >
            {/* Vignette Overlay */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.8)_100%)]" />
            {/* Grainy Texture */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay" />
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
              "relative flex w-full flex-col rounded-[3rem] bg-[#080809] shadow-[0_0_80px_-20px_rgba(0,0,0,1)] md:flex-row",
              "overflow-hidden border border-white/6 backdrop-blur-3xl",
              maxWidth,
            )}
          >
            {/* HUD Scanline Effect */}
            <motion.div
              initial={{ top: "-10%" }}
              animate={{ top: "110%" }}
              transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
              className="via-brand-primary/5 border-brand-primary/10 pointer-events-none absolute right-0 left-0 z-40 h-[10%] border-t bg-linear-to-b from-transparent to-transparent"
            />

            {/* MAIN INTERFACE */}
            <div className="relative flex min-w-0 flex-1 flex-col">
              {/* Biometric Brackets */}
              <div className="pointer-events-none absolute top-6 left-6 h-3 w-3 rounded-tl-xs border-t border-l border-white/10" />
              <div className="pointer-events-none absolute top-6 right-6 h-3 w-3 rounded-tr-xs border-t border-r border-white/10" />

              {/* HEADER: COMMAND MODULE */}
              <header className="relative z-10 flex items-center justify-between border-b border-white/3 bg-white/1 px-10 py-8">
                <div className="flex items-center gap-6">
                  <div className="group relative">
                    <div className="bg-brand-primary/20 absolute inset-0 animate-pulse rounded-full blur-xl" />
                    <div className="relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-black/60 transition-transform group-hover:scale-105">
                      <Hexagon className="text-brand-primary relative z-10 h-6 w-6" />
                      <motion.div
                        animate={{ opacity: [0.1, 0.4, 0.1] }}
                        transition={{ duration: 3, repeat: Infinity }}
                        className="from-brand-primary/40 absolute inset-0 bg-linear-to-tr to-transparent"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col">
                    <h3 className="mb-2 text-[12px] leading-none font-black tracking-[0.6em] text-white uppercase">
                      {title}
                    </h3>
                    <div className="flex items-center gap-3">
                      <Radar className="text-brand-primary/50 h-3.5 w-3.5 animate-pulse" />
                      <span className="font-mono text-[10px] leading-none font-bold tracking-widest text-zinc-500 uppercase">
                        {subtitle || "Protocol_Initialized"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {showShield && (
                    <div className="border-brand-primary/10 hidden items-center gap-2.5 rounded-full border bg-black/40 px-4 py-2 shadow-inner sm:flex">
                      <ShieldCheck size={12} className="text-brand-primary" />
                      <span className="text-[9px] font-black tracking-widest text-zinc-400 uppercase">
                        Verified_Link
                      </span>
                    </div>
                  )}
                  <button
                    onClick={onClose}
                    className="group relative rounded-2xl bg-white/3 p-3 text-zinc-500 transition-all hover:text-red-500 active:scale-90"
                    title="Close Interface"
                  >
                    <div className="absolute inset-0 rounded-full bg-red-500/0 blur-md transition-all group-hover:bg-red-500/10" />
                    <X size={20} className="relative z-10" />
                  </button>
                </div>
              </header>

              {/* VIEWPORT ENGINE */}
              <main className="custom-scrollbar relative flex-1 overflow-y-auto bg-linear-to-b from-transparent to-black/20 p-10 lg:p-14">
                <div className="relative z-10">{children}</div>
                {/* Decorative Grid Shard */}
                <div className="bg-brand-primary/1 pointer-events-none absolute right-0 bottom-0 h-64 w-64 rounded-full blur-3xl" />
              </main>

              {/* FOOTER: TELEMETRY BAR */}
              <footer className="relative z-10 flex items-center justify-between border-t border-white/3 bg-black/40 px-10 py-5">
                <div className="flex items-center gap-8">
                  <div className="flex items-center gap-3 opacity-40 transition-opacity hover:opacity-100">
                    <Activity size={14} className="text-brand-primary animate-pulse" />
                    <div className="flex flex-col">
                      <span className="text-[7px] font-black text-zinc-600 uppercase">Stream</span>
                      <span className="text-[9px] font-bold text-zinc-300">ACTIVE_TX</span>
                    </div>
                  </div>
                  <div className="h-6 w-px bg-white/5" />
                  <div className="flex items-center gap-3 opacity-40 transition-opacity hover:opacity-100">
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
              <aside className="relative flex w-full flex-col border-l border-white/4 bg-black/30 md:w-80">
                {/* Side Panel Header */}
                <div className="flex items-center gap-3 border-b border-white/3 px-8 py-6">
                  <Fingerprint size={14} className="text-brand-primary/40" />
                  <span className="text-[9px] font-black tracking-widest text-zinc-500 uppercase">
                    Metadata_Buffer
                  </span>
                </div>
                {/* Side Panel Content */}
                <div className="custom-scrollbar flex-1 overflow-y-auto p-8">{sidePanel}</div>
                {/* Side Panel Decorative Vents */}
                <div className="flex justify-center gap-1 p-4 opacity-20">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-3 w-1 rounded-full bg-white/20" />
                  ))}
                </div>
              </aside>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  if (typeof document === "undefined") return undefined;
  return createPortal(modalContent, document.body);
};
