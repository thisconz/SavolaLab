import React, { useEffect } from "react";
import { motion, AnimatePresence } from "@/src/lib/motion";
import { X, Hexagon } from "lucide-react";
import clsx from "@/src/lib/clsx";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = "max-w-2xl",
}) => {
  // Lock body scroll when open & handle ESC key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-9999 flex items-center justify-center p-4 sm:p-6 sm:pb-20">
          {/* Backdrop with enhanced blur and smoother fade */}
          <motion.div
            initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
            animate={{ opacity: 1, backdropFilter: "blur(12px)" }}
            exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
            className="absolute inset-0 bg-brand-deep/40 cursor-zoom-out"
            aria-hidden="true"
          />

          {/* Modal Container */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            initial={{ opacity: 0, scale: 0.98, y: 10, filter: "blur(10px)" }}
            animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 0.98, y: 15, filter: "blur(5px)" }}
            transition={{
              type: "spring",
              damping: 28,
              stiffness: 260,
              filter: { duration: 0.2 },
            }}
            className={clsx(
              "relative w-full bg-white/95 rounded-[2.5rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.2)]",
              "flex flex-col max-h-[90vh] overflow-hidden border border-brand-sage/20",
              "selection:bg-brand-primary/10",
              maxWidth,
            )}
          >
            {/* Visual Header Accents */}
            <div className="absolute top-0 left-0 right-0 h-40 bg-linear-to-b from-brand-primary/5 via-transparent to-transparent pointer-events-none" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-1px bg-linear-to-r from-transparent via-brand-primary/40 to-transparent" />

            {/* Header */}
            <header className="flex items-center justify-between px-10 py-7 border-b border-brand-sage/5 relative z-10">
              <div className="flex items-center gap-5">
                <div className="group relative">
                  <div className="absolute inset-0 bg-brand-primary/20 blur-xl rounded-full scale-0 group-hover:scale-150 transition-transform duration-700" />
                  <div className="relative w-11 h-11 rounded-2xl bg-white border border-brand-sage/10 flex items-center justify-center shadow-xs group-hover:-rotate-6 transition-transform duration-500">
                    <Hexagon className="w-5 h-5 text-brand-primary fill-brand-primary/5" />
                  </div>
                </div>

                <div className="flex flex-col">
                  <h3
                    id="modal-title"
                    className="text-sm font-black uppercase tracking-[0.2em] text-brand-deep leading-none"
                  >
                    {title}
                  </h3>
                  <div className="h-0.5 w-8 bg-brand-primary/30 mt-2 rounded-full" />
                </div>
              </div>

              <button
                onClick={onClose}
                aria-label="Close modal"
                className="group relative p-3 rounded-2xl text-brand-sage hover:text-brand-deep transition-colors"
              >
                <div className="absolute inset-0 bg-brand-sage/5 rounded-2xl scale-75 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-300" />
                <X className="relative w-5 h-5 group-active:scale-90 transition-transform" />
              </button>
            </header>

            {/* Content Area */}
            <div className="relative flex-1 overflow-y-auto p-10 custom-scrollbar overscroll-contain z-10">
              {children}
            </div>

            {/* Optional subtle footer fade indicator */}
            <div className="h-4 w-full bg-linear-to-t from-white/50 to-transparent pointer-events-none absolute bottom-0 left-0 z-20" />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
