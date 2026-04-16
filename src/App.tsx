import React, { Suspense } from "react";
import { Toaster } from "sonner";
import { AppShell } from "./app/AppShell";
import { FeatureRouter } from "./app/router/router";
import { ErrorBoundary } from "./app/components/GlobalErrorBoundary";
import { motion, AnimatePresence } from "@/src/lib/motion";
import { Terminal } from "lucide-react";

/**
 * Zenthar Root Application Kernel
 * Orchestrates global providers, telemetry, and top-level layouts.
 */
export default function App() {
  return (
    <ErrorBoundary>
      {/* 1. Global Notification Engine (Sonner) */}
      <Toaster 
        position="top-right" 
        richColors 
        closeButton
        theme="dark"
        toastOptions={{
          style: {
            background: 'var(--color-zenthar-carbon)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            borderRadius: '1.25rem',
            color: '#fff',
            fontSize: '11px',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            fontFamily: 'var(--font-mono)',
          },
          className: "zenthar-toast",
        }}
      />

      {/* 2. Main Execution Context */}
      <AppShell>
        <Suspense fallback={<KernelLoadingSequence />}>
          <FeatureRouter />
        </Suspense>
      </AppShell>
    </ErrorBoundary>
  );
}

/**
 * Minimalist Loading Sequence for Module Hydration
 */
const KernelLoadingSequence = () => (
  <div className="fixed inset-0 bg-(--color-zenthar-void) flex flex-col items-center justify-center z-50">
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center gap-6"
    >
      <div className="relative w-16 h-16">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 border-2 border-brand-primary/20 border-t-brand-primary rounded-full"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <Terminal className="w-5 h-5 text-brand-primary animate-pulse" />
        </div>
      </div>
      
      <div className="flex flex-col items-center gap-1">
        <span className="text-[10px] font-black uppercase tracking-[0.5em] text-white">
          Initializing_Zenthar
        </span>
        <span className="text-[8px] font-mono font-bold text-brand-sage opacity-40 uppercase">
          Hydrating_Secure_Modules...
        </span>
      </div>
    </motion.div>
  </div>
);