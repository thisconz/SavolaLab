import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Hexagon } from "lucide-react";
import clsx from "clsx";

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
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-9999 flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-brand-deep/60 backdrop-blur-xl"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={clsx(
              "relative w-full bg-white/90 backdrop-blur-2xl rounded-2rem shadow-2xl overflow-hidden border border-brand-sage/20",
              maxWidth,
            )}
          >
            {/* Decorative Header Background */}
            <div className="absolute top-0 left-0 right-0 h-32 bg-linear-to-b from-brand-primary/10 via-brand-mist/50 to-transparent pointer-events-none" />
            <div className="absolute top-0 left-0 w-full h-1px bg-linear-to-r from-transparent via-brand-primary/30 to-transparent" />

            <div className="flex items-center justify-between px-8 py-6 border-b border-brand-sage/10 relative z-10">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-2xl bg-brand-primary/10 flex items-center justify-center border border-brand-primary/20 shadow-inner">
                  <Hexagon className="w-5 h-5 text-brand-primary" />
                </div>
                <h3 className="text-base font-black uppercase tracking-0.1em text-brand-deep">
                  {title}
                </h3>
              </div>
              <button
                onClick={onClose}
                className="p-3 hover:bg-brand-sage/10 rounded-2xl text-brand-sage hover:text-brand-deep transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-8 overflow-y-auto max-h-[80vh] custom-scrollbar relative z-10">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
