import React, { useEffect, useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "@/src/lib/motion";
import {
  X,
  LogOut,
  ChevronRight,
  Fingerprint,
  ShieldCheck,
  Globe,
  Radio,
  Zap
} from "lucide-react";
import { useAuthStore } from "../../../orchestrator/state/auth.store";
import { useAuthFlow } from "../hooks/useAuthFlow";
import clsx from "@/src/lib/clsx";

interface QuickSwitchProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QuickSwitch: React.FC<QuickSwitchProps> = ({ isOpen, onClose }) => {
  const { currentUser, logout } = useAuthStore();
  const { users, handleUserSelect } = useAuthFlow();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Filter out current user from the list if you want a "Switch To" focus, 
  // or keep them to show status. Here we keep them but highlight differently.
  const sortedUsers = useMemo(() => {
    return [...users].sort((a, b) => (String(a.id) === String(currentUser?.id) ? -1 : 1));
  }, [users, currentUser]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-100 flex items-center justify-center p-4 sm:p-6 bg-brand-deep/60 backdrop-blur-md"
        >
          {/* Backdrop Click-to-Close */}
          <div className="absolute inset-0" onClick={onClose} />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 40, rotateX: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0, rotateX: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="bg-(--color-zenthar-carbon) rounded-[2.5rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.8)] w-full max-w-lg overflow-hidden border border-brand-sage/10 relative preserve-3d"
          >
            {/* Structural Header */}
            <div className="relative p-8 pb-6 overflow-hidden bg-(--color-zenthar-graphite)/30">
              <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-transparent via-brand-primary to-transparent" />
              
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-(--color-zenthar-void) flex items-center justify-center shadow-inner group overflow-hidden relative">
                    <Fingerprint className="w-6 h-6 text-brand-primary group-hover:scale-110 transition-transform" />
                    <motion.div 
                      animate={{ y: [-20, 40] }} 
                      transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                      className="absolute top-0 left-0 w-full h-0.5 bg-brand-primary/40 blur-[2px]"
                    />
                  </div>
                  <div>
                    <h2 className="text-sm font-black text-(--color-zenthar-text-primary) uppercase tracking-[0.3em]">
                      Switch Personnel
                    </h2>
                    <div className="flex items-center gap-2 mt-1">
                      <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
                      <p className="text-[9px] text-brand-sage font-mono font-bold uppercase tracking-widest opacity-80">
                        Node: {currentUser?.dept || "GENERAL_LAB"}
                      </p>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={onClose}
                  className="w-10 h-10 flex items-center justify-center text-brand-sage hover:text-(--color-zenthar-text-primary) hover:bg-(--color-zenthar-graphite) rounded-2xl transition-all active:scale-90"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Profiles Container */}
            <div className="px-8 py-2 max-h-[50vh] overflow-y-auto custom-scrollbar">
              <div className="space-y-3 py-4">
                {sortedUsers.map((user, index) => {
                  const isActive = String(currentUser?.id) === String(user.id);
                  const userRole = typeof user.role === 'string' ? user.role : (user.role as any)?.name;

                  return (
                    <motion.button
                      key={user.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03 }}
                      onClick={() => {
                        handleUserSelect(user);
                        onClose();
                      }}
                      className={clsx(
                        "w-full flex items-center p-2 rounded-2xl border transition-all duration-300 group relative",
                        isActive
                          ? "border-brand-primary/40 bg-brand-primary/10 ring-1 ring-brand-primary/20 shadow-sm"
                          : "border-brand-sage/10 bg-(--color-zenthar-graphite)/30 hover:bg-(--color-zenthar-graphite) hover:border-brand-primary/30 hover:shadow-md"
                      )}
                    >
                      <div className="flex items-center gap-4 w-full p-2">
                        {/* Avatar Cell */}
                        <div className="relative">
                          <div className={clsx(
                            "w-12 h-12 rounded-xl flex items-center justify-center font-black text-sm transition-all",
                            isActive ? "bg-brand-primary text-(--color-zenthar-void) shadow-lg" : "bg-(--color-zenthar-void) text-brand-sage border border-brand-sage/10"
                          )}>
                            {user.initials}
                          </div>
                          {isActive && (
                            <div className="absolute -bottom-1 -right-1 p-0.5 bg-(--color-zenthar-carbon) rounded-full">
                              <ShieldCheck className="w-3.5 h-3.5 text-brand-primary" />
                            </div>
                          )}
                        </div>

                        {/* Text Content */}
                        <div className="flex-1 text-left min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className={clsx(
                              "text-[11px] font-black uppercase tracking-wider truncate",
                              isActive ? "text-brand-primary" : "text-(--color-zenthar-text-primary)"
                            )}>
                              {user.name}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] text-brand-sage font-bold uppercase tracking-tighter opacity-70">
                              {userRole}
                            </span>
                            <span className="w-1 h-1 rounded-full bg-brand-sage/20" />
                            <span className="text-[9px] font-mono text-brand-primary/60 font-bold uppercase">
                              {user.status || "IDLE"}
                            </span>
                          </div>
                        </div>

                        {/* Action Hint */}
                        <div className={clsx(
                          "w-8 h-8 rounded-lg flex items-center justify-center transition-all",
                          isActive ? "bg-brand-primary/10 text-brand-primary" : "opacity-0 group-hover:opacity-100 bg-(--color-zenthar-void) text-brand-sage"
                        )}>
                          {isActive ? <Zap className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Termination Zone */}
            <div className="p-8 pt-4">
              <div className="h-px w-full bg-linear-to-r from-transparent via-brand-sage/10 to-transparent mb-6" />
              
              <button
                onClick={() => { logout(); onClose(); }}
                className="w-full group flex items-center justify-between p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-600 hover:text-white transition-all duration-500 shadow-sm hover:shadow-red-500/20"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-(--color-zenthar-void) group-hover:bg-white/20 transition-colors shadow-sm">
                    <LogOut className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <span className="block text-[10px] font-black uppercase tracking-[0.2em] leading-none">
                      Emergency Sign-Out
                    </span>
                    <span className="text-[8px] uppercase font-bold opacity-60 mt-1 block">
                      Clear all local cached tokens
                    </span>
                  </div>
                </div>
                <div className="hidden sm:block">
                   <Globe className="w-4 h-4 opacity-20 group-hover:opacity-100 animate-spin-slow" />
                </div>
              </button>

              <div className="mt-6 flex items-center justify-center gap-4 text-[8px] font-bold text-brand-sage/40 uppercase tracking-[0.4em]">
                <span>Sec_Protocol: 88-Alpha</span>
                <span className="w-1 h-1 rounded-full bg-brand-sage/20" />
                <span>Node_Auth: Verified</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};