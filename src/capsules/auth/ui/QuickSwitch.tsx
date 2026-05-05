import React, { useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  LogOut,
  ChevronRight,
  Fingerprint,
  ShieldCheck,
  Globe,
  Radio,
  Zap,
  RefreshCw,
} from "lucide-react";
import { useAuthStore } from "../../../orchestrator/state/auth.store";
import { useAuthFlow } from "../hooks/useAuthFlow";
import clsx from "clsx";

interface QuickSwitchProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QuickSwitch: React.FC<QuickSwitchProps> = ({ isOpen, onClose }) => {
  const { currentUser, logout } = useAuthStore();
  const {
    users,
    selectedUser,
    handleUserSelect,
    inputValue,
    setInputValue,
    handleSubmit,
    loading,
    error,
    resetState,
  } = useAuthFlow({
    onSuccess: () => {
      onClose();
    },
    isOpen,
  });

  // const isBrowser = typeof window !== "undefined";

  // Filter out current user from the list if you want a "Switch To" focus,
  // or keep them to show status. Here we keep them but highlight differently.
  const sortedUsers = useMemo(() => {
    return [...users].sort((a, b) => (String(a.id) === String(currentUser?.id) ? -1 : 1));
  }, [users, currentUser]);

  useEffect(() => {
    if (!isOpen) {
      resetState();
    }
  }, [isOpen, resetState]);

  if (!isOpen || typeof document === "undefined") return undefined;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="bg-brand-deep/60 fixed inset-0 z-100 flex items-center justify-center p-4 backdrop-blur-md sm:p-6"
        >
          {/* Backdrop Click-to-Close */}
          <div className="absolute inset-0" onClick={onClose} />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 40, rotateX: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0, rotateX: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="border-brand-sage/10 preserve-3d relative w-full max-w-lg overflow-hidden rounded-[2.5rem] border bg-(--color-zenthar-carbon) shadow-[0_40px_100px_-20px_rgba(0,0,0,0.8)]"
          >
            {/* Structural Header */}
            <div className="relative overflow-hidden bg-(--color-zenthar-graphite)/30 p-8 pb-6">
              <div className="via-brand-primary absolute top-0 left-0 h-1 w-full bg-linear-to-r from-transparent to-transparent" />

              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="group relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-(--color-zenthar-void) shadow-inner">
                    <Fingerprint className="text-brand-primary h-6 w-6 transition-transform group-hover:scale-110" />
                    <motion.div
                      animate={{ y: [-20, 40] }}
                      transition={{
                        repeat: Infinity,
                        duration: 2,
                        ease: "linear",
                      }}
                      className="bg-brand-primary/40 absolute top-0 left-0 h-0.5 w-full blur-[2px]"
                    />
                  </div>
                  <div>
                    <h2 className="text-sm font-black tracking-[0.3em] text-(--color-zenthar-text-primary) uppercase">
                      {selectedUser ? "Verify Credentials" : "Switch Personnel"}
                    </h2>
                    <div className="mt-1 flex items-center gap-2">
                      <Radio className="h-3 w-3 animate-pulse text-emerald-400" />
                      <p className="text-brand-sage font-mono text-[9px] font-bold tracking-widest uppercase opacity-80">
                        Node: {currentUser?.dept || "GENERAL_LAB"}
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={onClose}
                  className="text-brand-sage flex h-10 w-10 items-center justify-center rounded-2xl transition-all hover:bg-(--color-zenthar-graphite) hover:text-(--color-zenthar-text-primary) active:scale-90"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Content Area */}
            <div className="custom-scrollbar max-h-[60vh] overflow-y-auto px-8 py-2">
              <AnimatePresence mode="wait">
                {selectedUser ? (
                  <motion.div
                    key="auth-input"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-8 py-6"
                  >
                    {/* User Identity Highlight */}
                    <div className="bg-brand-primary/5 border-brand-primary/10 flex items-center gap-4 rounded-2xl border p-4">
                      <div className="bg-brand-primary flex h-14 w-14 items-center justify-center rounded-xl text-sm font-black text-(--color-zenthar-void) shadow-lg">
                        {selectedUser.initials}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-sm font-black tracking-wider text-(--color-zenthar-text-primary) uppercase">
                          {selectedUser.name}
                        </h3>
                        <p className="text-brand-sage text-[10px] font-bold tracking-widest uppercase opacity-60">
                          {typeof selectedUser.role === "string"
                            ? selectedUser.role
                            : (selectedUser.role as any)?.name}
                        </p>
                      </div>
                      <button
                        onClick={() => resetState()}
                        className="text-brand-sage hover:text-brand-primary p-2 transition-colors"
                      >
                        <RefreshCw size={16} />
                      </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="space-y-4">
                        <label className="text-brand-primary block text-center text-[9px] font-black tracking-[0.3em] uppercase">
                          Input Security PIN
                        </label>
                        <div className="relative">
                          <input
                            autoFocus
                            type="password"
                            inputMode="numeric"
                            maxLength={4}
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            className={clsx(
                              "w-full rounded-2xl border-2 bg-(--color-zenthar-graphite)/30 px-4 py-6 text-center font-mono text-3xl tracking-[0.8em] transition-all focus:outline-none",
                              error
                                ? "border-brand-primary/50 bg-brand-primary/5 text-brand-primary ring-brand-primary/10 ring-4"
                                : "border-brand-sage/10 focus:border-brand-primary focus:ring-brand-primary/10 text-(--color-zenthar-text-primary) focus:bg-(--color-zenthar-graphite) focus:ring-4",
                            )}
                            placeholder="••••"
                          />
                        </div>
                        {error && (
                          <p className="text-brand-primary animate-shake text-center text-[10px] font-bold tracking-widest uppercase">
                            {error}
                          </p>
                        )}
                      </div>

                      <button
                        type="submit"
                        disabled={inputValue.length < 4 || loading}
                        className={clsx(
                          "flex w-full items-center justify-center gap-3 rounded-2xl py-5 text-[11px] font-black tracking-[0.3em] uppercase transition-all",
                          inputValue.length < 4 || loading
                            ? "text-brand-sage bg-(--color-zenthar-graphite) opacity-50"
                            : "bg-brand-primary shadow-brand-primary/20 text-(--color-zenthar-void) shadow-2xl hover:-translate-y-0.5 active:scale-95",
                        )}
                      >
                        {loading ? (
                          <RefreshCw className="h-5 w-5 animate-spin" />
                        ) : (
                          <>
                            <Zap className="h-4 w-4" />
                            <span>Confirm Swap</span>
                            <ChevronRight className="h-4 w-4" />
                          </>
                        )}
                      </button>
                    </form>
                  </motion.div>
                ) : (
                  <motion.div
                    key="user-list"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="space-y-3 py-4"
                  >
                    {sortedUsers.map((user, index) => {
                      const isActive = String(currentUser?.id) === String(user.id);
                      const userRole = typeof user.role === "string" ? user.role : (user.role as any)?.name;

                      return (
                        <motion.button
                          key={user.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.03 }}
                          onClick={() => handleUserSelect(user)}
                          className={clsx(
                            "group relative flex w-full items-center rounded-2xl border p-2 transition-all duration-300",
                            isActive
                              ? "border-brand-primary/40 bg-brand-primary/10 ring-brand-primary/20 shadow-sm ring-1"
                              : "border-brand-sage/10 hover:border-brand-primary/30 bg-(--color-zenthar-graphite)/30 hover:bg-(--color-zenthar-graphite) hover:shadow-md",
                          )}
                        >
                          <div className="flex w-full items-center gap-4 p-2">
                            {/* Avatar Cell */}
                            <div className="relative">
                              <div
                                className={clsx(
                                  "flex h-12 w-12 items-center justify-center rounded-xl text-sm font-black transition-all",
                                  isActive
                                    ? "bg-brand-primary text-(--color-zenthar-void) shadow-lg"
                                    : "text-brand-sage border-brand-sage/10 border bg-(--color-zenthar-void)",
                                )}
                              >
                                {user.initials}
                              </div>
                              {isActive && (
                                <div className="absolute -right-1 -bottom-1 rounded-full bg-(--color-zenthar-carbon) p-0.5">
                                  <ShieldCheck className="text-brand-primary h-3.5 w-3.5" />
                                </div>
                              )}
                            </div>

                            {/* Text Content */}
                            <div className="min-w-0 flex-1 text-left">
                              <div className="mb-0.5 flex items-center gap-2">
                                <span
                                  className={clsx(
                                    "truncate text-[11px] font-black tracking-wider uppercase",
                                    isActive ? "text-brand-primary" : "text-(--color-zenthar-text-primary)",
                                  )}
                                >
                                  {user.name}
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
                                <span className="text-brand-sage text-[9px] font-bold tracking-tighter uppercase opacity-70">
                                  {userRole}
                                </span>
                                <span className="bg-brand-sage/20 h-1 w-1 rounded-full" />
                                <span className="text-brand-primary/60 font-mono text-[9px] font-bold uppercase">
                                  {user.status || "IDLE"}
                                </span>
                              </div>
                            </div>

                            {/* Action Hint */}
                            <div
                              className={clsx(
                                "flex h-8 w-8 items-center justify-center rounded-lg transition-all",
                                isActive
                                  ? "bg-brand-primary/10 text-brand-primary"
                                  : "text-brand-sage bg-(--color-zenthar-void) opacity-0 group-hover:opacity-100",
                              )}
                            >
                              {isActive ? <Zap className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            </div>
                          </div>
                        </motion.button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Termination Zone */}
            <div className={`p-8 ${selectedUser ? "pt-0" : "pt-4"}`}>
              <div className="via-brand-sage/10 mb-6 h-px w-full bg-linear-to-r from-transparent to-transparent" />

              {!selectedUser && (
                <button
                  onClick={() => {
                    logout();
                    onClose();
                  }}
                  className="group flex w-full items-center justify-between rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-red-500 shadow-sm transition-all duration-500 hover:bg-red-600 hover:text-white hover:shadow-red-500/20"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-(--color-zenthar-void) shadow-sm transition-colors group-hover:bg-white/20">
                      <LogOut className="h-4 w-4" />
                    </div>
                    <div className="text-left">
                      <span className="block text-[10px] leading-none font-black tracking-[0.2em] uppercase">
                        Emergency Sign-Out
                      </span>
                      <span className="mt-1 block text-[8px] font-bold uppercase opacity-60">
                        Clear all local cached tokens
                      </span>
                    </div>
                  </div>
                  <div className="hidden sm:block">
                    <Globe className="animate-spin-slow h-4 w-4 opacity-20 group-hover:opacity-100" />
                  </div>
                </button>
              )}

              <div className="text-brand-sage/40 mt-6 flex items-center justify-center gap-4 text-[8px] font-bold tracking-[0.4em] uppercase">
                <span>Sec_Protocol: 88-Alpha</span>
                <span className="bg-brand-sage/20 h-1 w-1 rounded-full" />
                <span>Node_Auth: Verified</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
};
