import React, { Suspense, useEffect } from "react";
import { Toaster } from "sonner";
import { AppShell } from "./app/AppShell";
import { FeatureRouter } from "./app/router/router";
import { ZentharKernelBoundary as ErrorBoundary } from "./shared/components/ErrorBoundary";
import { initializeApi } from "./orchestrator/initializer";
import { RealtimeProvider } from "./core/providers/RealtimeProvider";
import { motion } from "framer-motion";
import { Hexagon, Zap } from "lucide-react";

export default function App() {
  useEffect(() => {
    document.body.classList.add("zenthar-bg-mesh");
    initializeApi();
  }, []);

  return (
    <ErrorBoundary name="App Root">
      <Toaster
        position="top-right"
        richColors
        closeButton
        theme="dark"
        toastOptions={{
          style: {
            background: "rgba(8,8,26,0.98)",
            border: "1px solid rgba(244,63,94,0.25)",
            borderRadius: "1rem",
            color: "#f0f4ff",
            fontSize: "11px",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            fontFamily: "var(--font-mono)",
            backdropFilter: "blur(24px)",
            boxShadow: "0 0 20px rgba(244,63,94,0.15), 0 8px 32px rgba(0,0,0,0.8)",
          },
        }}
      />

      <RealtimeProvider>
        <AppShell>
          <Suspense fallback={<KernelLoadingSequence />}>
            <FeatureRouter />
          </Suspense>
        </AppShell>
      </RealtimeProvider>
    </ErrorBoundary>
  );
}

/* ── God-tier loading screen ── */
const KernelLoadingSequence = () => (
  <div className="zenthar-bg-mesh fixed inset-0 z-50 flex flex-col items-center justify-center">
    {/* Grid overlay */}
    <div className="instrument-grid-fine pointer-events-none absolute inset-0 opacity-100" />

    {/* Ambient glows */}
    <div className="bg-brand-primary/8 absolute top-1/4 left-1/4 h-96 w-96 animate-pulse rounded-full blur-[120px]" />
    <div
      className="bg-brand-cyan/8 absolute right-1/4 bottom-1/4 h-64 w-64 animate-pulse rounded-full blur-[100px]"
      style={{ animationDelay: "1s" }}
    />

    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="relative z-10 flex flex-col items-center gap-8"
    >
      {/* Logo */}
      <div className="relative">
        <div className="bg-brand-primary/30 absolute inset-0 scale-150 animate-pulse blur-2xl" />
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          className="relative flex h-20 w-20 items-center justify-center"
        >
          <Hexagon size={80} className="text-brand-primary/20" strokeWidth={1} />
        </motion.div>
        <div className="absolute inset-0 flex items-center justify-center">
          <Zap size={28} className="text-brand-primary" />
        </div>
      </div>

      {/* Title */}
      <div className="space-y-2 text-center">
        <h1 className="text-zenthar-text-primary hologram-text font-mono text-2xl font-black tracking-[0.6em] uppercase">
          ZENTHAR
        </h1>
        <p className="text-zenthar-text-muted font-mono text-[9px] font-bold tracking-[0.4em] uppercase">
          Initializing Secure Modules
        </p>
      </div>

      {/* Progress bar */}
      <div className="bg-zenthar-graphite h-[2px] w-64 overflow-hidden rounded-full">
        <motion.div
          initial={{ x: "-100%" }}
          animate={{ x: "100%" }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className="via-brand-primary h-full w-1/3 bg-gradient-to-r from-transparent to-transparent"
        />
      </div>

      {/* Status dots */}
      <div className="flex items-center gap-2">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            animate={{ opacity: [0.2, 1, 0.2] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
            className="bg-brand-primary h-1 w-1 rounded-full"
          />
        ))}
      </div>
    </motion.div>
  </div>
);
