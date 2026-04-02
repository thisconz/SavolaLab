import React from "react";
import { motion, AnimatePresence } from "@/src/lib/motion";
import {
  Shield,
  Key,
  Lock,
  ChevronRight,
  UserPlus,
  Cpu,
  Fingerprint,
} from "lucide-react";
import { LogoRoot, LogoIcon, LogoText } from "../../../ui/components/Logo";
import { RegistrationFlow } from "./RegistrationFlow";
import { useAuthFlow } from "../hooks/useAuthFlow";

export const LoginPage: React.FC = () => {
  const {
    users,
    selectedUser,
    setSelectedUser,
    authMode,
    setAuthMode,
    inputValue,
    setInputValue,
    error,
    setError,
    loading,
    isRegistering,
    setIsRegistering,
    fetchUsers,
    handleUserSelect,
    handleSubmit,
  } = useAuthFlow();

  // Safety utility to prevent Object-as-Child errors
  const safeRenderRole = (role: any) => {
    if (typeof role === "string") return role;
    if (role && typeof role === "object") return "Authorized Operator";
    return "Standard Access";
  };

  return (
    <div className="min-h-screen w-full bg-brand-deep flex items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Background Layering */}
      <div className="scanline opacity-10 pointer-events-none" />
      <div className="absolute inset-0 instrument-grid opacity-[0.03] pointer-events-none" />

      {/* Dynamic Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-brand-primary/10 rounded-full blur-[150px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-brand-sage/5 rounded-full blur-[150px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-md"
      >
        <header className="text-center mb-10 relative z-10">
          <LogoRoot
            className="justify-center mb-4 transform scale-110"
            size="xl"
            variant="light"
            direction="column"
            align="center"
          >
            <LogoIcon animated={true} />
            <LogoText className="mt-2 tracking-[0.3em] font-black" />
          </LogoRoot>
        </header>

        <main className="bg-white/95 backdrop-blur-2xl backdrop-saturate-150 rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] overflow-hidden border border-white/20 relative">
          {/* Tech UI Accents */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand-primary/40 to-transparent" />
          <div className="absolute top-8 right-8 flex gap-1 opacity-30">
            <div className="w-1 h-1 rounded-full bg-brand-primary" />
            <div className="w-1 h-1 rounded-full bg-brand-primary" />
            <div className="w-1 h-1 rounded-full bg-brand-primary" />
          </div>

          <div className="p-10 relative z-10">
            <AnimatePresence mode="wait">
              {isRegistering ? (
                <motion.div
                  key="registration"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.02 }}
                >
                  <RegistrationFlow
                    onBack={() => setIsRegistering(false)}
                    onSuccess={() => {
                      setIsRegistering(false);
                      fetchUsers();
                    }}
                  />
                </motion.div>
              ) : !selectedUser ? (
                <motion.div
                  key="user-list"
                  className="space-y-8"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div className="text-center">
                    <span className="inline-block px-3 py-1 rounded-full bg-brand-deep/5 text-[9px] font-black text-brand-deep uppercase tracking-[0.25em] mb-3">
                      Authentication Required
                    </span>
                    <div className="flex items-center justify-center gap-2">
                      <div className="flex space-x-1">
                        {[1, 2, 3].map((i) => (
                          <div
                            key={i}
                            className="w-0.5 h-3 bg-brand-primary/30 rounded-full"
                          />
                        ))}
                      </div>
                      <p className="text-[10px] text-brand-sage font-mono uppercase tracking-widest">
                        Node: QC_PRIMARY_TERMINAL
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 max-h-[350px] overflow-y-auto custom-scrollbar pr-1">
                    {loading ? (
                      <div className="flex flex-col items-center justify-center py-12 gap-4">
                        <Cpu className="w-6 h-6 text-brand-primary animate-spin" />
                        <span className="text-[10px] font-bold text-brand-primary uppercase tracking-[0.2em]">
                          Syncing Personnel Data...
                        </span>
                      </div>
                    ) : (
                      users.map((user) => (
                        <button
                          key={user.id}
                          onClick={() => handleUserSelect(user)}
                          className="w-full flex items-center justify-between p-4 rounded-2xl border border-brand-sage/10 bg-brand-mist/5 hover:border-brand-primary/40 hover:bg-white hover:shadow-xl hover:shadow-brand-primary/10 transition-all duration-400 group text-left"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-brand-deep text-white flex items-center justify-center font-black text-xs group-hover:bg-brand-primary transition-colors shadow-inner">
                              {user.initials}
                            </div>
                            <div>
                              <div className="text-xs font-black text-brand-deep uppercase tracking-wider group-hover:text-brand-primary transition-colors">
                                {user.name}
                              </div>
                              <div className="text-[9px] text-brand-sage font-mono font-bold uppercase tracking-tighter mt-0.5 opacity-80">
                                {safeRenderRole(user.role)}
                              </div>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-brand-sage group-hover:text-brand-primary group-hover:translate-x-1 transition-all" />
                        </button>
                      ))
                    )}
                  </div>

                  <button
                    onClick={() => setIsRegistering(true)}
                    className="w-full flex items-center justify-center gap-3 py-5 rounded-2xl border border-dashed border-brand-sage/30 text-brand-sage hover:text-brand-primary hover:border-brand-primary/50 hover:bg-brand-primary/5 transition-all duration-300 group"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                      Register New Personnel
                    </span>
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  key="auth-input"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-8"
                >
                  <div className="flex items-center gap-4 p-4 bg-brand-deep rounded-2xl border border-white/5 shadow-lg relative overflow-hidden group">
                    <div className="w-12 h-12 rounded-lg bg-brand-primary text-white flex items-center justify-center font-black text-xs shadow-lg group-hover:scale-105 transition-transform">
                      {selectedUser.initials}
                    </div>
                    <div className="flex-1">
                      <div className="text-[11px] font-black text-white uppercase tracking-wider">
                        {selectedUser.name}
                      </div>
                      <div className="text-[8px] text-brand-sage font-mono uppercase tracking-[0.1em] opacity-80">
                        {safeRenderRole(selectedUser.role)}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedUser(null);
                        setError("");
                      }}
                      className="px-3 py-1.5 rounded-lg text-[9px] font-black text-brand-primary uppercase hover:bg-brand-primary/10 transition-colors"
                    >
                      Exit
                    </button>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="flex p-1.5 bg-brand-mist/40 rounded-2xl border border-brand-sage/5">
                      {(["pin", "password"] as const).map((mode) => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => {
                            setAuthMode(mode);
                            setInputValue("");
                            setError("");
                          }}
                          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                            authMode === mode
                              ? "bg-white text-brand-primary shadow-md"
                              : "text-brand-sage hover:text-brand-deep"
                          }`}
                        >
                          {mode === "pin" ? (
                            <Key className="w-3 h-3" />
                          ) : (
                            <Lock className="w-3 h-3" />
                          )}
                          {mode}
                        </button>
                      ))}
                    </div>

                    <div className="space-y-4">
                      <div className="relative group">
                        <input
                          autoFocus
                          type={authMode === "pin" ? "password" : "text"}
                          maxLength={authMode === "pin" ? 4 : undefined}
                          value={inputValue}
                          onChange={(e) => {
                            setInputValue(e.target.value);
                            setError("");
                          }}
                          className={`w-full bg-brand-mist/30 border-2 rounded-2xl py-5 px-6 text-center text-2xl font-mono tracking-[0.5em] focus:outline-none transition-all duration-300 ${
                            error
                              ? "border-red-500/50 bg-red-50/10 text-red-600 focus:ring-4 focus:ring-red-500/10"
                              : "border-transparent focus:border-brand-primary focus:bg-white focus:ring-4 focus:ring-brand-primary/10 text-brand-deep"
                          }`}
                          placeholder={authMode === "pin" ? "••••" : "••••••••"}
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-20 group-focus-within:opacity-100 transition-opacity">
                          <Fingerprint className="w-5 h-5 text-brand-primary" />
                        </div>
                      </div>

                      {error && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-center justify-center gap-2 text-red-600 bg-red-50 py-3 rounded-xl border border-red-100"
                        >
                          <Shield className="w-3.5 h-3.5" />
                          <span className="text-[10px] font-black uppercase tracking-widest">
                            {error}
                          </span>
                        </motion.div>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={!inputValue || loading}
                      className={`w-full py-5 rounded-2xl font-black uppercase tracking-[0.25em] text-[11px] transition-all duration-500 flex items-center justify-center gap-3 relative overflow-hidden group ${
                        !inputValue || loading
                          ? "bg-brand-sage/10 text-brand-sage cursor-not-allowed"
                          : "bg-brand-deep text-white hover:bg-brand-primary shadow-xl shadow-brand-deep/20 hover:shadow-brand-primary/30 active:scale-95"
                      }`}
                    >
                      {loading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <span>Verify Protocol</span>
                          <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <footer className="px-10 py-6 bg-brand-mist/20 border-t border-brand-sage/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[9px] text-brand-sage font-mono font-bold uppercase tracking-widest">
                System_Secure
              </span>
            </div>
            <p className="text-[8px] text-brand-sage/60 font-mono font-bold uppercase tracking-[0.15em]">
              v1.0.0
            </p>
          </footer>
        </main>
      </motion.div>
    </div>
  );
};
