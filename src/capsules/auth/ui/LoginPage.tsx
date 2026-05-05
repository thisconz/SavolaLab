import React, { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";
import {
  Shield,
  Key,
  Lock,
  ChevronRight,
  UserPlus,
  Fingerprint,
  AlertTriangle,
  RefreshCw,
  Hexagon,
  Zap,
} from "lucide-react";
import { LogoRoot, LogoIcon, LogoText } from "../../../shared/components/Logo";
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

  const renderedRole = useMemo(() => {
    if (!selectedUser) return "";
    const role = selectedUser.role;
    if (typeof role === "string") return role.replace(/_/g, " ");
    return (role as any)?.name || "Authorized Operator";
  }, [selectedUser]);

  return (
    <div className="zenthar-bg-mesh relative flex min-h-screen w-full items-center justify-center overflow-hidden p-6 font-sans">
      {/* Animated grid */}
      <div className="instrument-grid-fine pointer-events-none absolute inset-0 opacity-100" />

      {/* Scanlines */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.025]"
        style={{
          background:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.5) 2px, rgba(0,0,0,0.5) 4px)",
        }}
      />

      {/* Ambient glows */}
      <div
        className="pointer-events-none absolute top-0 left-1/4 h-[600px] w-[600px] rounded-full blur-[160px]"
        style={{ background: "rgba(244,63,94,0.06)", animation: "pulse 4s ease-in-out infinite" }}
      />
      <div
        className="pointer-events-none absolute right-1/4 bottom-0 h-[400px] w-[400px] rounded-full blur-[120px]"
        style={{ background: "rgba(139,92,246,0.05)", animation: "pulse 5s ease-in-out infinite 2s" }}
      />

      {/* Corner decorations */}
      {[
        ["top-6 left-6", ""],
        ["top-6 right-6", "rotate-90"],
        ["bottom-6 left-6", "-rotate-90"],
        ["bottom-6 right-6", "rotate-180"],
      ].map(([pos, rot], i) => (
        <div key={i} className={`absolute ${pos} pointer-events-none`}>
          <div
            className={`h-8 w-8 ${rot}`}
            style={{
              borderTop: "1px solid rgba(244,63,94,0.3)",
              borderLeft: "1px solid rgba(244,63,94,0.3)",
            }}
          />
        </div>
      ))}

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Logo */}
        <header className="mb-8 text-center">
          <LogoRoot
            className="mb-4 justify-center"
            size="xl"
            variant="dark"
            direction="column"
            align="center"
          >
            <LogoIcon animated />
            <LogoText className="mt-2 font-black tracking-[0.4em]" subtitle="" />
          </LogoRoot>
          <div className="mt-1 flex items-center justify-center gap-3">
            <div
              className="h-px w-12"
              style={{ background: "linear-gradient(90deg, transparent, rgba(244,63,94,0.5))" }}
            />
            <span className="text-zenthar-text-muted font-mono text-[9px] tracking-[0.3em] uppercase">
              Secure Terminal {import.meta.env.VITE_ZENTHAR_VERSION}
            </span>
            <div
              className="h-px w-12"
              style={{ background: "linear-gradient(90deg, rgba(244,63,94,0.5), transparent)" }}
            />
          </div>
        </header>

        {/* Main card */}
        <main
          className="relative overflow-hidden rounded-2xl"
          style={{
            background: "linear-gradient(135deg, rgba(8,8,26,0.98) 0%, rgba(5,5,15,0.99) 100%)",
            border: "1px solid rgba(100,120,200,0.15)",
            boxShadow:
              "0 0 60px rgba(244,63,94,0.08), 0 24px 80px rgba(0,0,0,0.9), inset 0 1px 0 rgba(255,255,255,0.04)",
          }}
        >
          {/* Grid inside card */}
          <div className="instrument-grid pointer-events-none absolute inset-0 opacity-50" />

          {/* Top border glow */}
          <div
            className="pointer-events-none absolute top-0 right-0 left-0 h-px"
            style={{
              background:
                "linear-gradient(90deg, transparent, rgba(244,63,94,0.8), rgba(139,92,246,0.8), transparent)",
            }}
          />

          {/* Progress bar */}
          <div className="absolute top-0 left-0 h-[2px] w-full overflow-hidden">
            <motion.div
              animate={loading ? { x: ["-100%", "100%"] } : { x: "-100%" }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
              className="h-full w-1/3"
              style={{ background: "linear-gradient(90deg, transparent, #f43f5e, transparent)" }}
            />
          </div>

          <div className="relative z-10 p-8">
            <AnimatePresence mode="wait">
              {isRegistering ? (
                <motion.div
                  key="reg"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
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
                  key="list"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-5"
                >
                  <div className="flex items-end justify-between">
                    <div>
                      <h2 className="text-zenthar-text-primary text-[11px] font-black tracking-widest uppercase">
                        Select Personnel
                      </h2>
                      <p className="text-zenthar-text-muted mt-0.5 font-mono text-[8px] uppercase">
                        Active sync: {users.length} operators
                      </p>
                    </div>
                    <button
                      onClick={fetchUsers}
                      className="text-zenthar-text-muted hover:text-brand-primary rounded-lg p-2 transition-all"
                      style={{ background: "rgba(8,8,26,0.8)", border: "1px solid rgba(100,120,200,0.1)" }}
                    >
                      <RefreshCw className={clsx("h-3.5 w-3.5", loading && "animate-spin")} />
                    </button>
                  </div>

                  <div className="custom-scrollbar max-h-80 space-y-2 overflow-y-auto">
                    {loading && users.length === 0 ? (
                      <div className="flex flex-col items-center justify-center gap-4 py-16">
                        <div className="relative h-12 w-12">
                          <Hexagon size={48} className="text-brand-primary/20" />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Zap size={20} className="text-brand-primary animate-pulse" />
                          </div>
                        </div>
                        <span className="text-brand-primary text-[9px] font-black tracking-[0.3em] uppercase">
                          Decrypting Directory...
                        </span>
                      </div>
                    ) : (
                      users.map((user, i) => (
                        <motion.button
                          key={user.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.04 }}
                          whileHover={{ x: 4 }}
                          onClick={() => handleUserSelect(user)}
                          className="group flex w-full items-center justify-between rounded-xl p-4 transition-all"
                          style={{
                            background: "rgba(8,8,26,0.6)",
                            border: "1px solid rgba(100,120,200,0.1)",
                          }}
                          onMouseEnter={(e) => {
                            (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(244,63,94,0.3)";
                            (e.currentTarget as HTMLButtonElement).style.background = "rgba(244,63,94,0.06)";
                            (e.currentTarget as HTMLButtonElement).style.boxShadow =
                              "0 0 20px rgba(244,63,94,0.08)";
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLButtonElement).style.borderColor =
                              "rgba(100,120,200,0.1)";
                            (e.currentTarget as HTMLButtonElement).style.background = "rgba(8,8,26,0.6)";
                            (e.currentTarget as HTMLButtonElement).style.boxShadow = "none";
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="flex h-11 w-11 items-center justify-center rounded-xl text-xs font-black transition-all"
                              style={{
                                background: "rgba(244,63,94,0.1)",
                                border: "1px solid rgba(244,63,94,0.2)",
                                color: "#f43f5e",
                              }}
                            >
                              {user.initials}
                            </div>
                            <div className="text-left">
                              <div className="text-zenthar-text-primary group-hover:text-brand-primary text-[11px] font-black tracking-wider uppercase transition-colors">
                                {user.name}
                              </div>
                              <div className="text-zenthar-text-muted mt-0.5 font-mono text-[8px] tracking-widest uppercase opacity-70">
                                {typeof user.role === "string" ? user.role.replace(/_/g, " ") : "Staff"}
                              </div>
                            </div>
                          </div>
                          <ChevronRight className="text-zenthar-text-muted group-hover:text-brand-primary h-4 w-4 transition-all group-hover:translate-x-1" />
                        </motion.button>
                      ))
                    )}
                  </div>

                  <button
                    onClick={() => setIsRegistering(true)}
                    className="group flex w-full items-center justify-center gap-3 rounded-xl py-4 transition-all"
                    style={{
                      background: "transparent",
                      border: "1px dashed rgba(100,120,200,0.2)",
                      color: "rgba(136,146,176,0.6)",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(244,63,94,0.4)";
                      (e.currentTarget as HTMLButtonElement).style.background = "rgba(244,63,94,0.05)";
                      (e.currentTarget as HTMLButtonElement).style.color = "#f43f5e";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(100,120,200,0.2)";
                      (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                      (e.currentTarget as HTMLButtonElement).style.color = "rgba(136,146,176,0.6)";
                    }}
                  >
                    <UserPlus className="h-4 w-4 transition-transform group-hover:scale-110" />
                    <span className="text-[10px] font-black tracking-[0.2em] uppercase">
                      Initialize New Account
                    </span>
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  key="auth"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  {/* Selected user card */}
                  <div
                    className="relative overflow-hidden rounded-xl p-4"
                    style={{
                      background: "linear-gradient(135deg, rgba(244,63,94,0.08) 0%, rgba(8,8,26,0.95) 100%)",
                      border: "1px solid rgba(244,63,94,0.2)",
                    }}
                  >
                    <div className="relative z-10 flex items-center gap-4">
                      <div
                        className="flex h-14 w-14 items-center justify-center rounded-xl text-sm font-black"
                        style={{
                          background: "#f43f5e",
                          boxShadow: "0 0 20px rgba(244,63,94,0.4)",
                          color: "#fff",
                        }}
                      >
                        {selectedUser.initials}
                      </div>
                      <div className="flex-1">
                        <p className="text-brand-primary mb-1 font-mono text-[7px] tracking-[0.2em] uppercase opacity-70">
                          Personnel Verified
                        </p>
                        <h3 className="text-zenthar-text-primary text-sm leading-none font-black tracking-wider uppercase">
                          {selectedUser.name}
                        </h3>
                        <p className="text-zenthar-text-muted mt-1 font-mono text-[8px] tracking-tighter uppercase">
                          {renderedRole}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedUser(undefined);
                          setError("");
                        }}
                        className="text-zenthar-text-muted hover:text-zenthar-text-primary rounded-lg p-2 transition-colors"
                        style={{ background: "rgba(8,8,26,0.8)", border: "1px solid rgba(100,120,200,0.1)" }}
                      >
                        <RefreshCw className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="absolute top-0 right-0 opacity-5">
                      <Fingerprint size={80} className="text-white" />
                    </div>
                  </div>

                  {/* Auth mode tabs */}
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div
                      className="flex rounded-xl p-1"
                      style={{ background: "rgba(8,8,26,0.8)", border: "1px solid rgba(100,120,200,0.1)" }}
                    >
                      {(["pin", "password"] as const).map((mode) => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => {
                            setAuthMode(mode);
                            setInputValue("");
                            setError("");
                          }}
                          className="flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-[10px] font-black tracking-widest uppercase transition-all"
                          style={{
                            background: authMode === mode ? "rgba(244,63,94,0.15)" : "transparent",
                            color: authMode === mode ? "#f43f5e" : "rgba(136,146,176,0.5)",
                            border:
                              authMode === mode ? "1px solid rgba(244,63,94,0.3)" : "1px solid transparent",
                            boxShadow: authMode === mode ? "0 0 12px rgba(244,63,94,0.1)" : "none",
                          }}
                        >
                          {mode === "pin" ? (
                            <Key className="h-3.5 w-3.5" />
                          ) : (
                            <Lock className="h-3.5 w-3.5" />
                          )}
                          {mode}
                        </button>
                      ))}
                    </div>

                    {/* Input */}
                    <div className="space-y-3">
                      <input
                        autoFocus
                        type={authMode === "pin" ? "password" : "text"}
                        inputMode={authMode === "pin" ? "numeric" : "text"}
                        maxLength={authMode === "pin" ? 4 : undefined}
                        value={inputValue}
                        onChange={(e) => {
                          setInputValue(e.target.value);
                          if (error) setError("");
                        }}
                        className="w-full rounded-xl px-5 py-5 text-center font-mono text-3xl tracking-[0.6em] transition-all focus:outline-none"
                        style={{
                          background: error ? "rgba(239,68,68,0.06)" : "rgba(8,8,26,0.8)",
                          border: error
                            ? "2px solid rgba(239,68,68,0.5)"
                            : "2px solid rgba(100,120,200,0.15)",
                          color: error ? "#ef4444" : "#f0f4ff",
                          boxShadow: error
                            ? "0 0 20px rgba(239,68,68,0.15), inset 0 0 10px rgba(239,68,68,0.05)"
                            : "none",
                        }}
                        onFocus={(e) => {
                          if (!error) {
                            (e.target as HTMLInputElement).style.borderColor = "rgba(244,63,94,0.5)";
                            (e.target as HTMLInputElement).style.boxShadow = "0 0 20px rgba(244,63,94,0.1)";
                          }
                        }}
                        onBlur={(e) => {
                          if (!error) {
                            (e.target as HTMLInputElement).style.borderColor = "rgba(100,120,200,0.15)";
                            (e.target as HTMLInputElement).style.boxShadow = "none";
                          }
                        }}
                        placeholder={authMode === "pin" ? "••••" : "••••••••"}
                      />

                      {error && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          className="flex items-center justify-center gap-2 rounded-xl px-4 py-2.5"
                          style={{
                            background: "rgba(239,68,68,0.08)",
                            border: "1px solid rgba(239,68,68,0.2)",
                          }}
                        >
                          <AlertTriangle className="h-3.5 w-3.5 text-red-400" />
                          <span className="text-[10px] font-black tracking-widest text-red-400 uppercase">
                            {error}
                          </span>
                        </motion.div>
                      )}
                    </div>

                    {/* Submit */}
                    <motion.button
                      type="submit"
                      disabled={!inputValue || loading}
                      whileHover={inputValue && !loading ? { scale: 1.02 } : undefined}
                      whileTap={inputValue && !loading ? { scale: 0.98 } : undefined}
                      className="relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-xl py-4 text-[11px] font-black tracking-[0.3em] uppercase transition-all duration-300"
                      style={{
                        background:
                          !inputValue || loading
                            ? "rgba(8,8,26,0.8)"
                            : "linear-gradient(135deg, #f43f5e, #fb7185)",
                        color: !inputValue || loading ? "rgba(136,146,176,0.5)" : "#fff",
                        border:
                          !inputValue || loading
                            ? "1px solid rgba(100,120,200,0.1)"
                            : "1px solid rgba(244,63,94,0.3)",
                        boxShadow:
                          !inputValue || loading
                            ? "none"
                            : "0 0 30px rgba(244,63,94,0.3), 0 4px 20px rgba(0,0,0,0.4)",
                      }}
                    >
                      {/* Shimmer */}
                      {inputValue && !loading && (
                        <motion.div
                          animate={{ x: ["-100%", "200%"] }}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                          className="absolute inset-y-0 w-1/4 -skew-x-12"
                          style={{
                            background:
                              "linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)",
                          }}
                        />
                      )}

                      {loading ? (
                        <RefreshCw className="h-5 w-5 animate-spin" />
                      ) : (
                        <>
                          <Shield className="h-4 w-4" />
                          <span className="relative">Authorize Access</span>
                          <ChevronRight className="h-4 w-4" />
                        </>
                      )}
                    </motion.button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer */}
          <footer
            className="flex items-center justify-between px-8 py-4"
            style={{
              background: "rgba(5,5,15,0.8)",
              borderTop: "1px solid rgba(100,120,200,0.08)",
            }}
          >
            <div className="flex items-center gap-2">
              <div
                className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500"
                style={{ boxShadow: "0 0 6px rgba(16,185,129,0.6)" }}
              />
              <span className="font-mono text-[8px] font-bold tracking-widest text-emerald-400/60 uppercase">
                Network Stable
              </span>
            </div>
            <p className="text-zenthar-text-muted font-mono text-[8px] font-bold tracking-widest uppercase">
              Zenthar_OS {import.meta.env.VITE_ZENTHAR_VERSION}
            </p>
          </footer>
        </main>
      </motion.div>
    </div>
  );
};
