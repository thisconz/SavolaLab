import React, { useMemo } from "react";
import { motion, AnimatePresence } from "@/src/lib/motion";
import {
  Shield,
  Key,
  Lock,
  ChevronRight,
  UserPlus,
  Cpu,
  Fingerprint,
  AlertTriangle,
  RefreshCw
} from "lucide-react";
import { LogoRoot, LogoIcon, LogoText } from "../../../shared/components/Logo";
import { RegistrationFlow } from "./RegistrationFlow";
import { useAuthFlow } from "../hooks/useAuthFlow";

// Utility for staggered list animations
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.2 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: { opacity: 1, x: 0 },
};

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

  // Memoized role renderer to avoid recalculation
  const renderedRole = useMemo(() => {
    if (!selectedUser) return "";
    const role = selectedUser.role;
    if (typeof role === "string") return role;
    return (role as any)?.name || "Authorized Operator";
  }, [selectedUser]);

  return (
    <div className={`min-h-screen w-full flex items-center justify-center p-6 relative overflow-hidden font-sans transition-colors duration-700 ${error ? 'bg-red-950/20' : 'bg-(--color-zenthar-void)'}`}>
      
      {/* Background FX Layers */}
      <div className="scanline opacity-[0.07] pointer-events-none" />
      <div className="absolute inset-0 instrument-grid opacity-[0.03] pointer-events-none" />

      {/* Atmospheric Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-brand-primary/10 rounded-full blur-[120px] pointer-events-none animate-pulse" />
      <div className={`absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full blur-[150px] pointer-events-none transition-colors duration-1000 ${error ? 'bg-red-500/10' : 'bg-brand-sage/5'}`} />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative w-full max-w-md z-10"
      >
        <header className="text-center mb-10">
          <LogoRoot className="justify-center mb-4 transform scale-110" size="xl" variant="dark" direction="column" align="center">
            <LogoIcon animated={true} />
            <LogoText className="mt-2 tracking-[0.4em] font-black uppercase text-(--color-zenthar-text-primary)" />
          </LogoRoot>
          <div className="flex items-center justify-center gap-3 mt-2">
             <div className="h-px w-8 bg-linear-to-r from-transparent to-brand-primary/40" />
             <span className="text-[10px] font-mono text-brand-sage tracking-[0.3em] uppercase opacity-60">Secure Terminal Protocol</span>
             <div className="h-px w-8 bg-linear-to-l from-transparent to-brand-primary/40" />
          </div>
        </header>

        <main className="bg-(--color-zenthar-carbon)/95 backdrop-blur-3xl rounded-[2.5rem] shadow-[0_40px_80px_-15px_rgba(0,0,0,0.8)] overflow-hidden border border-brand-sage/10 relative">
          {/* Top Interface Bar */}
          <div className="absolute top-0 left-0 w-full h-1.5 bg-(--color-zenthar-graphite)/30 overflow-hidden">
            <motion.div 
              animate={loading ? { x: ["-100%", "100%"] } : { x: "-100%" }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
              className="w-1/3 h-full bg-brand-primary shadow-[0_0_10px_rgba(var(--brand-primary-rgb),0.5)]"
            />
          </div>

          <div className="p-8 sm:p-10">
            <AnimatePresence mode="wait">
              {isRegistering ? (
                <motion.div key="registration" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <RegistrationFlow 
                    onBack={() => setIsRegistering(false)} 
                    onSuccess={() => { setIsRegistering(false); fetchUsers(); }} 
                  />
                </motion.div>
              ) : !selectedUser ? (
                <motion.div key="user-list" variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
                  <div className="flex justify-between items-end mb-2">
                    <div>
                       <h2 className="text-[11px] font-black text-(--color-zenthar-text-primary) uppercase tracking-widest">Select Personnel</h2>
                       <p className="text-[9px] text-brand-sage font-mono uppercase mt-1">Active Sync: {users.length} Users</p>
                    </div>
                    <button onClick={fetchUsers} className="p-2 hover:bg-(--color-zenthar-graphite) rounded-lg transition-colors group">
                       <RefreshCw className={`w-3.5 h-3.5 text-brand-sage group-hover:text-brand-primary ${loading && 'animate-spin'}`} />
                    </button>
                  </div>

                  <div className="space-y-2.5 max-h-95 overflow-y-auto pr-2 custom-scrollbar">
                    {loading && users.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <div className="relative">
                          <Cpu className="w-8 h-8 text-brand-primary animate-pulse" />
                          <div className="absolute inset-0 bg-brand-primary/20 blur-xl animate-ping rounded-full" />
                        </div>
                        <span className="text-[9px] font-black text-brand-primary uppercase tracking-[0.3em]">Decrypting Personnel_DB...</span>
                      </div>
                    ) : (
                      users.map((user) => (
                        <motion.button
                          key={user.id}
                          variants={itemVariants}
                          whileHover={{ x: 4 }}
                          onClick={() => handleUserSelect(user)}
                          className="w-full flex items-center justify-between p-4 rounded-2xl border border-brand-sage/10 bg-(--color-zenthar-graphite)/30 hover:border-brand-primary/40 hover:bg-(--color-zenthar-graphite) hover:shadow-xl hover:shadow-brand-primary/5 transition-all group"
                        >
                          <div className="flex items-center gap-4">
                            <div className="relative">
                              <div className="w-12 h-12 rounded-xl bg-(--color-zenthar-void) text-(--color-zenthar-text-primary) flex items-center justify-center font-black text-xs group-hover:bg-brand-primary group-hover:text-white transition-colors">
                                {user.initials}
                              </div>
                              {user.status === "online" && <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 border-2 border-(--color-zenthar-carbon) rounded-full" />}
                            </div>
                            <div>
                              <div className="text-[11px] font-black text-(--color-zenthar-text-primary) uppercase tracking-wider group-hover:text-brand-primary transition-colors">
                                {user.name}
                              </div>
                              <div className="text-[9px] text-brand-sage font-mono font-bold uppercase tracking-tight opacity-70">
                                {typeof user.role === 'string' ? user.role : 'Staff'}
                              </div>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-brand-sage group-hover:text-brand-primary group-hover:translate-x-1 transition-all" />
                        </motion.button>
                      ))
                    )}
                  </div>

                  <button
                    onClick={() => setIsRegistering(true)}
                    className="w-full py-5 flex items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-brand-sage/20 text-brand-sage hover:text-brand-primary hover:border-brand-primary/40 hover:bg-brand-primary/5 transition-all group"
                  >
                    <UserPlus className="w-4 h-4 transition-transform group-hover:scale-110" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Initialize New Handshake</span>
                  </button>
                </motion.div>
              ) : (
                <motion.div key="auth-input" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                  {/* Selected User Identity Card */}
                  <div className="p-5 bg-(--color-zenthar-void) rounded-2xl border border-brand-sage/10 shadow-2xl relative overflow-hidden">
                    <div className="flex items-center gap-4 relative z-10">
                      <div className="w-14 h-14 rounded-xl bg-brand-primary text-white flex items-center justify-center font-black text-sm shadow-lg shadow-brand-primary/20">
                        {selectedUser.initials}
                      </div>
                      <div className="flex-1">
                        <p className="text-[8px] font-mono text-brand-primary uppercase tracking-[0.2em] mb-1">Personnel Verified</p>
                        <h3 className="text-sm font-black text-(--color-zenthar-text-primary) uppercase tracking-wider leading-none">{selectedUser.name}</h3>
                        <p className="text-[9px] text-brand-sage font-mono uppercase tracking-tighter mt-1.5">{renderedRole}</p>
                      </div>
                      <button
                        onClick={() => { setSelectedUser(null); setError(""); }}
                        className="p-2 text-brand-sage hover:text-(--color-zenthar-text-primary) transition-colors bg-(--color-zenthar-graphite) rounded-lg"
                        title="Cancel"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="absolute top-0 right-0 p-2 opacity-10"><Fingerprint className="w-12 h-12 text-(--color-zenthar-text-primary)" /></div>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="flex p-1.5 bg-(--color-zenthar-graphite)/50 rounded-2xl border border-brand-sage/5">
                      {(["pin", "password"] as const).map((mode) => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => { setAuthMode(mode); setInputValue(""); setError(""); }}
                          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                            authMode === mode ? "bg-(--color-zenthar-carbon)] text-brand-primary shadow-lg border border-brand-sage/10" : "text-brand-sage hover:text-(--color-zenthar-text-primary)"
                          }`}
                        >
                          {mode === "pin" ? <Key className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                          {mode}
                        </button>
                      ))}
                    </div>

                    <div className="relative space-y-4">
                      <div className="relative group">
                        <input
                          autoFocus
                          type={authMode === "pin" ? "password" : "text"}
                          inputMode={authMode === "pin" ? "numeric" : "text"}
                          maxLength={authMode === "pin" ? 4 : undefined}
                          value={inputValue}
                          onChange={(e) => { setInputValue(e.target.value); if(error) setError(""); }}
                          className={`w-full bg-(--color-zenthar-graphite)/30 border-2 rounded-2xl py-6 px-6 text-center text-3xl font-mono tracking-[0.6em] focus:outline-none transition-all ${
                            error ? "border-red-500/50 bg-red-500/5 text-red-500 ring-4 ring-red-500/10" : "border-brand-sage/10 focus:border-brand-primary focus:bg-(--color-zenthar-graphite) focus:ring-4 focus:ring-brand-primary/10 text-(--color-zenthar-text-primary)"
                          }`}
                          placeholder={authMode === "pin" ? "••••" : "•••••••"}
                        />
                      </div>

                      {error && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} className="flex items-center justify-center gap-2 text-red-500 bg-red-500/10 backdrop-blur-sm py-3 px-4 rounded-xl border border-red-500/20 shadow-sm">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span className="text-[10px] font-black uppercase tracking-widest">{error}</span>
                        </motion.div>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={!inputValue || loading}
                      className={`w-full py-5 rounded-2xl font-black uppercase tracking-[0.3em] text-[11px] transition-all duration-500 flex items-center justify-center gap-3 relative overflow-hidden group ${
                        !inputValue || loading
                          ? "bg-(--color-zenthar-graphite) text-brand-sage"
                          : "bg-brand-primary text-(--color-zenthar-void) hover:bg-brand-primary/90 shadow-2xl shadow-brand-primary/20 hover:-translate-y-0.5 active:scale-95"
                      }`}
                    >
                      {loading ? (
                        <RefreshCw className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <Shield className="w-4 h-4 opacity-70 group-hover:opacity-100 group-hover:scale-110 transition-all" />
                          <span>Authorize Access</span>
                          <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <footer className="px-10 py-5 bg-(--color-zenthar-graphite)/30 border-t border-brand-sage/5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)] animate-pulse" />
              <span className="text-[9px] text-brand-sage font-mono font-bold uppercase tracking-[0.2em]">Network_Stable</span>
            </div>
            <div className="h-4 w-px bg-brand-sage/20" />
            <p className="text-[9px] text-brand-sage/60 font-mono font-bold uppercase tracking-widest">Zenthar_OS v1.0</p>
          </footer>
        </main>
      </motion.div>
    </div>
  );
};