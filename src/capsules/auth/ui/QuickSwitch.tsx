import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { X, LogOut, Shield, User, Activity } from "lucide-react";
import { useAuthStore } from "../../../orchestrator/state/auth.store";
import { useAuthFlow } from "../hooks/useAuthFlow";
import clsx from "clsx";

interface QuickSwitchProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QuickSwitch: React.FC<QuickSwitchProps> = ({
  isOpen,
  onClose,
}) => {
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
          initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
          animate={{ opacity: 1, backdropFilter: "blur(24px)" }}
          exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-99 flex items-center justify-center p-4 bg-brand-deep/60"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{
              type: "spring",
              damping: 25,
              stiffness: 300,
              delay: 0.1,
            }}
            className="bg-white/95 backdrop-blur-3xl rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden border border-brand-sage/20 relative"
          >
            {/* Decorative Header Background */}
            <div className="absolute top-0 left-0 right-0 h-32 bg-linear-to-b from-brand-primary/10 via-brand-mist/50 to-transparent pointer-events-none" />
            <div className="absolute top-0 left-0 w-full h-1px bg-linear-to-r from-transparent via-brand-primary/30 to-transparent" />

            <div className="p-8 pb-6 border-b border-brand-sage/10 flex items-start justify-between relative z-10">
              <div className="flex gap-4 items-center">
                <div className="w-12 h-12 rounded-2xl bg-brand-primary/10 flex items-center justify-center border border-brand-primary/20 shadow-inner">
                  <Shield className="w-6 h-6 text-brand-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-brand-deep uppercase tracking-widest">
                    Access Control
                  </h2>
                  <div className="flex items-center gap-2 mt-1">
                    <Activity className="w-3 h-3 text-emerald-500 animate-pulse" />
                    <p className="text-[10px] text-brand-sage font-mono font-bold uppercase tracking-[0.2em]">
                      Select Authorization Profile
                    </p>
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-brand-sage hover:text-brand-deep hover:bg-brand-sage/10 rounded-xl transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 max-h-[50vh] overflow-y-auto custom-scrollbar bg-brand-mist/10 relative z-10">
              <div className="grid gap-3">
                {users.map((user) => {
                  const isActive = String(currentUser?.id) === String(user.id);
                  return (
                    <button
                      key={user.id}
                      onClick={() => {
                        handleUserSelect(user);
                        onClose();
                      }}
                      className={clsx(
                        "w-full flex items-center p-4 rounded-2xl border transition-all duration-300 group relative overflow-hidden text-left",
                        isActive
                          ? "border-brand-primary bg-white shadow-md shadow-brand-primary/5"
                          : "border-brand-sage/10 bg-white/50 hover:bg-white hover:border-brand-primary/40 hover:shadow-xl hover:shadow-brand-primary/10 hover:-translate-y-0.5",
                      )}
                    >
                      {/* Hover Gradient */}
                      {!isActive && (
                        <div className="absolute inset-0 bg-linear-to-r from-brand-primary/0 via-brand-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                      )}

                      {isActive && (
                        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-brand-primary" />
                      )}

                      <div className="flex items-center gap-5 w-full pl-2">
                        <div
                          className={clsx(
                            "w-12 h-12 rounded-xl flex items-center justify-center font-black text-sm transition-all shadow-inner",
                            isActive
                              ? "bg-brand-primary text-white"
                              : "bg-brand-mist text-brand-sage group-hover:bg-brand-primary/10 group-hover:text-brand-primary",
                          )}
                        >
                          {user.initials}
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-black text-brand-deep uppercase tracking-wider group-hover:text-brand-primary transition-colors">
                              {user.name}
                            </span>
                            {isActive && (
                              <span className="text-[9px] font-black text-white bg-brand-primary px-2 py-1 rounded-lg uppercase tracking-widest shadow-sm">
                                Active Session
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] text-brand-sage font-mono font-bold uppercase tracking-widest flex items-center gap-1.5">
                              <User className="w-3 h-3" />
                              {user.role}
                            </span>
                            <span className="w-1 h-1 rounded-full bg-brand-sage/30" />
                            <span className="text-[10px] text-brand-primary font-mono font-bold uppercase tracking-widest">
                              {user.roleType}
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="p-5 border-t border-brand-sage/10 bg-white">
              <button
                onClick={() => {
                  logout();
                  onClose();
                }}
                className="w-full flex items-center justify-center gap-3 p-4 rounded-xl text-lab-laser hover:bg-lab-laser hover:text-white transition-all group border border-transparent hover:border-lab-laser/20 hover:shadow-lg hover:shadow-lab-laser/10"
              >
                <LogOut className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
                <span className="text-xs font-black uppercase tracking-[0.2em]">
                  Terminate All Sessions
                </span>
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
};
