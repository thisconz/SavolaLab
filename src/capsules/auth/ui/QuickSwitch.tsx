import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "@/src/lib/motion";
import { X, LogOut, Shield, User, Activity, ChevronRight, Fingerprint } from "lucide-react";
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

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-99 flex items-center justify-center p-6 bg-brand-deep/80 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            transition={{ type: "spring", damping: 20, stiffness: 200 }}
            className="bg-white rounded-[3rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] w-full max-w-xl overflow-hidden border border-white/20 relative"
          >
            {/* Structural Header */}
            <div className="relative p-10 pb-8 overflow-hidden bg-linear-to-b from-brand-mist/20 to-transparent">
              <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-transparent via-brand-primary to-transparent opacity-50" />
              
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 rounded-2xl bg-brand-deep flex items-center justify-center shadow-lg ring-4 ring-brand-primary/10">
                    <Fingerprint className="w-7 h-7 text-brand-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-brand-deep uppercase tracking-[0.25em]">
                      Labrix Auth
                    </h2>
                    <div className="flex items-center gap-2 mt-1.5">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <p className="text-[10px] text-brand-sage font-mono font-bold uppercase tracking-widest opacity-70">
                        System Identity Manager
                      </p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="w-10 h-10 flex items-center justify-center text-brand-sage hover:text-brand-deep hover:bg-brand-mist rounded-full transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Profile Grid */}
            <div className="px-10 pb-4 max-h-[55vh] overflow-y-auto custom-scrollbar">
              <p className="text-[9px] font-black text-brand-sage/50 uppercase tracking-[0.3em] mb-4 ml-2">
                Authorized Profiles
              </p>
              <div className="grid gap-4">
                {users.map((user, index) => {
                  const isActive = String(currentUser?.id) === String(user.id);
                  return (
                    <motion.button
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      key={user.id}
                      onClick={() => {
                        handleUserSelect(user);
                        onClose();
                      }}
                      className={clsx(
                        "w-full flex items-center p-1 rounded-3xl border transition-all duration-500 group relative",
                        isActive
                          ? "border-brand-primary/30 bg-white shadow-xl shadow-brand-primary/5"
                          : "border-transparent bg-brand-mist/30 hover:bg-white hover:border-brand-primary/20 hover:shadow-lg"
                      )}
                    >
                      <div className="flex items-center gap-4 w-full p-3">
                        <div className={clsx(
                          "w-14 h-14 rounded-2xl flex items-center justify-center font-black text-lg transition-all",
                          isActive ? "bg-brand-primary text-white shadow-lg shadow-brand-primary/20" : "bg-white text-brand-sage shadow-sm"
                        )}>
                          {user.initials}
                        </div>

                        <div className="flex-1 text-left">
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-black text-brand-deep uppercase tracking-wide group-hover:text-brand-primary transition-colors">
                              {user.name}
                            </span>
                            {isActive && (
                              <span className="text-[8px] font-black text-brand-primary border border-brand-primary/20 px-2 py-0.5 rounded-full uppercase tracking-tighter">
                                Current
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[9px] text-brand-sage font-bold uppercase tracking-widest">
                              {user.role}
                            </span>
                            <span className="w-1 h-1 rounded-full bg-brand-sage/30" />
                            <span className="text-[9px] text-brand-primary/60 font-bold uppercase tracking-widest">
                              {user.roleType}
                            </span>
                          </div>
                        </div>

                        <div className={clsx(
                          "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                          isActive ? "bg-brand-primary/10 text-brand-primary" : "opacity-0 group-hover:opacity-100 bg-brand-mist text-brand-sage"
                        )}>
                          <ChevronRight className="w-5 h-5" />
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Footer / Exit Action */}
            <div className="p-10 bg-brand-mist/20 mt-4">
              <button
                onClick={() => {
                  logout();
                  onClose();
                }}
                className="w-full flex items-center justify-between p-6 rounded-3xl bg-white border border-lab-laser/10 text-lab-laser hover:bg-lab-laser hover:text-white transition-all group shadow-sm hover:shadow-xl hover:shadow-lab-laser/20"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-lab-laser/10 rounded-xl group-hover:bg-white/20 transition-colors">
                    <LogOut className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-black uppercase tracking-[0.3em]">
                    Terminate All Sessions
                  </span>
                </div>
                <div className="px-3 py-1 rounded-lg border border-current text-[10px] font-black opacity-50">
                  SEC-LEVEL 4
                </div>
              </button>
              
              <p className="text-center mt-6 text-[9px] font-bold text-brand-sage/40 uppercase tracking-[0.5em]">
                Labrix Security Protocol v1.0.0
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};