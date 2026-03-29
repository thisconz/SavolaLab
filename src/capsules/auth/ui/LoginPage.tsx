import React from "react";
import { motion } from "motion/react";
import { Shield, Key, Lock, ChevronRight, UserPlus } from "lucide-react";
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

  return (
    <div className="min-h-screen w-full bg-brand-deep flex items-center justify-center p-6 relative overflow-hidden">
      <div className="scanline opacity-20" />
      <div className="absolute inset-0 instrument-grid opacity-10" />

      {/* Ambient Background Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-primary/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-brand-sage/10 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="relative w-full max-w-md"
      >
        <div className="text-center mb-12 relative z-10">
          <LogoRoot
            className="justify-center mb-6"
            size="xl"
            variant="light"
            direction="column"
            align="center"
          >
            <LogoIcon animated={true} />
            <LogoText />
          </LogoRoot>
        </div>

        <div className="bg-white/95 backdrop-blur-3xl rounded-[3rem] shadow-2xl overflow-hidden border border-brand-sage/20 relative">
          {/* Decorative Corner Accents */}
          <div className="absolute top-0 left-0 w-16 h-16 border-t-2 border-l-2 border-brand-primary/30 rounded-tl-[3rem] pointer-events-none" />
          <div className="absolute top-0 right-0 w-16 h-16 border-t-2 border-r-2 border-brand-primary/30 rounded-tr-[3rem] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-16 h-16 border-b-2 border-l-2 border-brand-primary/30 rounded-bl-[3rem] pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-16 h-16 border-b-2 border-r-2 border-brand-primary/30 rounded-br-[3rem] pointer-events-none" />

          {/* Top Gradient Bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-transparent via-brand-primary/50 to-transparent" />

          <div className="p-10 relative z-10">
            {isRegistering ? (
              <RegistrationFlow
                onBack={() => setIsRegistering(false)}
                onSuccess={() => {
                  setIsRegistering(false);
                  fetchUsers(); // Refresh user list
                }}
              />
            ) : !selectedUser ? (
              <div className="space-y-8">
                <div className="text-center mb-10">
                  <h2 className="text-sm font-black text-brand-deep uppercase tracking-[0.2em]">
                    Operator Terminal
                  </h2>
                  <div className="flex items-center justify-center gap-2 mt-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                    <p className="text-[10px] text-brand-sage font-mono uppercase tracking-widest">
                      System Online • Select Account
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 max-h-[40vh] overflow-y-auto custom-scrollbar pr-2">
                  {loading ? (
                    <div className="flex flex-col items-center justify-center p-12 space-y-4">
                      <div className="w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
                      <span className="text-[9px] font-black text-brand-primary uppercase tracking-[0.2em]">
                        Initializing Auth...
                      </span>
                    </div>
                  ) : users.length === 0 ? (
                    <div className="text-center p-8 bg-brand-mist/20 rounded-2xl border border-dashed border-brand-sage/20">
                      <p className="text-[10px] font-black text-brand-sage uppercase tracking-widest">
                        No active accounts found
                      </p>
                    </div>
                  ) : (
                    users.map((user) => (
                      <button
                        key={user.id}
                        onClick={() => handleUserSelect(user)}
                        className="flex items-center justify-between p-5 rounded-2xl border border-brand-sage/10 hover:border-brand-primary/40 bg-white hover:bg-white hover:shadow-xl hover:shadow-brand-primary/10 transition-all duration-300 group relative overflow-hidden hover:-translate-y-0.5"
                      >
                        {/* Hover Accent */}
                        <div className="absolute inset-0 bg-linear-to-r from-brand-primary/0 via-brand-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                        <div className="flex items-center gap-5 relative z-10">
                          <div className="w-12 h-12 rounded-xl bg-brand-mist/50 text-brand-sage flex items-center justify-center font-black text-xs group-hover:bg-brand-primary group-hover:text-white transition-all duration-300 shadow-inner group-hover:scale-110">
                            {user.initials}
                          </div>
                          <div className="text-left">
                            <div className="text-xs font-black text-brand-deep uppercase tracking-wider group-hover:text-brand-primary transition-colors">
                              {user.name}
                            </div>
                            <div className="text-[9px] text-brand-sage font-mono font-bold uppercase tracking-tighter mt-0.5">
                              {user.role}
                            </div>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-brand-sage group-hover:text-brand-primary group-hover:translate-x-1 transition-all relative z-10" />
                      </button>
                    ))
                  )}
                </div>

                <div className="mt-10 pt-8 border-t border-brand-sage/10">
                  <button
                    onClick={() => setIsRegistering(true)}
                    className="w-full flex items-center justify-center gap-3 p-5 rounded-2xl border-2 border-dashed border-brand-sage/20 text-brand-sage hover:text-brand-primary hover:border-brand-primary/40 hover:bg-brand-primary/5 transition-all duration-300 group hover:shadow-lg hover:shadow-brand-primary/5"
                  >
                    <UserPlus className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                      Provision New Account
                    </span>
                  </button>
                </div>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
              >
                <div className="flex items-center gap-5 mb-10 p-5 bg-white/50 backdrop-blur-sm rounded-2xl border border-brand-primary/20 relative overflow-hidden shadow-sm">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-linear-to-br from-brand-primary/10 to-transparent rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                  <div className="w-14 h-14 rounded-xl bg-brand-primary text-white flex items-center justify-center font-black text-sm shadow-lg shadow-brand-primary/20 relative z-10">
                    {selectedUser.initials}
                  </div>
                  <div className="relative z-10">
                    <div className="text-sm font-black text-brand-deep uppercase tracking-wider">
                      {selectedUser.name}
                    </div>
                    <div className="text-[10px] text-brand-sage font-mono font-bold uppercase tracking-tighter mt-0.5">
                      {selectedUser.role}
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedUser(null)}
                    className="ml-auto text-[10px] font-black text-brand-primary uppercase tracking-widest hover:text-brand-deep transition-colors px-3 py-1.5 rounded-lg hover:bg-brand-primary/10 relative z-10"
                  >
                    Change
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                  <div className="flex p-1.5 bg-brand-mist/50 backdrop-blur-sm rounded-2xl mb-8 border border-brand-sage/10">
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode("pin");
                        setInputValue("");
                        setError("");
                      }}
                      className={`flex-1 flex items-center justify-center gap-3 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${
                        authMode === "pin"
                          ? "bg-white text-brand-primary shadow-lg shadow-brand-primary/10"
                          : "text-brand-sage hover:text-brand-deep hover:bg-white/50"
                      }`}
                    >
                      <Key className="w-4 h-4" /> PIN
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode("password");
                        setInputValue("");
                        setError("");
                      }}
                      className={`flex-1 flex items-center justify-center gap-3 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${
                        authMode === "password"
                          ? "bg-white text-brand-primary shadow-lg shadow-brand-primary/10"
                          : "text-brand-sage hover:text-brand-deep hover:bg-white/50"
                      }`}
                    >
                      <Lock className="w-4 h-4" /> Password
                    </button>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-brand-sage uppercase tracking-[0.2em] ml-2 flex items-center gap-2">
                      <Shield className="w-3 h-3" />
                      Verify{" "}
                      {authMode === "pin" ? "4-Digit PIN" : "Access Password"}
                    </label>
                    <input
                      autoFocus
                      type={authMode === "pin" ? "password" : "text"}
                      maxLength={authMode === "pin" ? 4 : undefined}
                      value={inputValue}
                      onChange={(e) => {
                        setInputValue(e.target.value);
                        setError("");
                      }}
                      className={`w-full bg-brand-mist/50 border-2 rounded-2xl px-8 py-5 text-center text-2xl font-mono tracking-[0.5em] focus:outline-none focus:ring-4 transition-all ${
                        error
                          ? "border-lab-laser/50 focus:ring-lab-laser/10 text-lab-laser"
                          : "border-brand-sage/10 focus:ring-brand-primary/10 text-brand-deep"
                      }`}
                      placeholder={authMode === "pin" ? "••••" : "••••••••"}
                    />
                    {error && (
                      <motion.p
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-[10px] font-black text-lab-laser uppercase tracking-0.1em text-center mt-3 bg-lab-laser/5 py-2 rounded-lg border border-lab-laser/10"
                      >
                        {error}
                      </motion.p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={!inputValue || loading}
                    className={`w-full py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-sm transition-all flex items-center justify-center gap-4 relative overflow-hidden group ${
                      !inputValue || loading
                        ? "bg-brand-sage/10 text-brand-sage cursor-not-allowed border border-brand-sage/10"
                        : "bg-brand-primary text-white shadow-2xl shadow-brand-primary/40 hover:bg-brand-primary/90 active:scale-[0.98]"
                    }`}
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Authenticate Access</span>
                        <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                </form>
              </motion.div>
            )}
          </div>

          <div className="p-8 bg-brand-mist/20 border-t border-brand-sage/10 text-center relative">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-1 bg-brand-primary/20 rounded-full" />
            <p className="text-[9px] text-brand-sage font-mono font-bold uppercase tracking-[0.2em]">
              Secure Terminal Access • Quality Control Division • v2.4.0
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
