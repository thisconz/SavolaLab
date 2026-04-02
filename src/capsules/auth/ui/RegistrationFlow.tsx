import React, { useState } from "react";
import { motion, AnimatePresence } from "@/src/lib/motion";
import { ArrowLeft, UserPlus, CheckCircle2, ShieldAlert, Fingerprint, KeyRound, UserCheck } from "lucide-react";
import { AuthApi } from "../api/auth.api";

interface RegistrationFlowProps {
  onBack: () => void;
  onSuccess: () => void;
}

type Step = "verify" | "otp" | "credentials";

export const RegistrationFlow: React.FC<RegistrationFlowProps> = ({
  onBack,
  onSuccess,
}) => {
  const [step, setStep] = useState<Step>("verify");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  // Form State
  const [employeeNumber, setEmployeeNumber] = useState("");
  const [nationalId, setNationalId] = useState("");
  const [dob, setDob] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pin, setPin] = useState("");

  const steps: { id: Step; label: string; icon: any }[] = [
    { id: "verify", label: "Identity", icon: UserPlus },
    { id: "otp", label: "Verification", icon: ShieldAlert },
    { id: "credentials", label: "Security", icon: Fingerprint },
  ];

  const currentStepIndex = steps.findIndex((s) => s.id === step);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await AuthApi.verifyEmployee({
        employee_number: employeeNumber,
        national_id: nationalId,
        dob,
      });
      setStep("otp");
    } catch (err: any) {
      setError(err.message || "Verification failed. Check system records.");
    } finally {
      setLoading(false);
    }
  };

  const handleOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await AuthApi.confirmOtp(employeeNumber, otp);
      setStep("credentials");
    } catch (err: any) {
      setError(err.message || "Invalid security token.");
    } finally {
      setLoading(false);
    }
  };

  const handleCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Credentials mismatch");
      return;
    }
    if (pin.length !== 4) {
      setError("PIN must be 4 digits");
      return;
    }

    setLoading(true);
    setError("");
    try {
      await AuthApi.setupCredentials({
        employee_number: employeeNumber,
        password,
        pin,
      });
      setIsSuccess(true);
      setTimeout(onSuccess, 2200);
    } catch (err: any) {
      setError(err.message || "Registry synchronization failed.");
    } finally {
      setLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center py-10 text-center"
      >
        <div className="relative mb-8">
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", damping: 12 }}
            className="w-24 h-24 bg-emerald-500 rounded-3xl flex items-center justify-center border-4 border-white shadow-2xl shadow-emerald-500/20"
          >
            <CheckCircle2 className="w-12 h-12 text-white" />
          </motion.div>
          <div className="absolute inset-0 bg-emerald-500 blur-2xl opacity-20 -z-10" />
        </div>
        
        <h2 className="text-lg font-black text-brand-deep uppercase tracking-[0.3em] mb-3">
          Access Granted
        </h2>
        <p className="text-[10px] text-brand-sage font-mono uppercase tracking-widest max-w-[280px] leading-relaxed">
          Registry synchronization complete. Secure environment initializing...
        </p>

        <div className="mt-10 w-full max-w-[200px] h-1 bg-brand-mist/30 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ duration: 2, ease: "easeInOut" }}
            className="h-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
          />
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header & Step Progress */}
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="group flex items-center gap-2 text-[10px] font-black text-brand-sage uppercase tracking-widest hover:text-brand-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back
          </button>
          <div className="flex gap-1.5">
            {steps.map((_, idx) => (
              <div
                key={idx}
                className={`h-1 rounded-full transition-all duration-700 ${
                  idx <= currentStepIndex ? "w-8 bg-brand-primary shadow-[0_0_10px_rgba(177,190,155,0.4)]" : "w-4 bg-brand-mist"
                }`}
              />
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-brand-mist/30 flex items-center justify-center border border-brand-sage/10 text-brand-primary">
            {React.createElement(steps[currentStepIndex].icon, { className: "w-5 h-5" })}
          </div>
          <div>
            <h2 className="text-xs font-black text-brand-deep uppercase tracking-[0.25em]">
              {steps[currentStepIndex].label} Protocol
            </h2>
            <p className="text-[9px] text-brand-sage font-mono uppercase tracking-widest opacity-60">
              Registry Phase {currentStepIndex + 1} of 3
            </p>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          <form 
            onSubmit={step === "verify" ? handleVerify : step === "otp" ? handleOtp : handleCredentials} 
            className="space-y-5"
          >
            {step === "verify" && (
              <>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-brand-sage uppercase tracking-widest ml-1">Personnel ID</label>
                  <input
                    type="text"
                    required
                    value={employeeNumber}
                    onChange={(e) => setEmployeeNumber(e.target.value)}
                    className="w-full bg-brand-mist/10 border-2 border-brand-sage/5 rounded-2xl px-5 py-4 text-sm font-mono font-bold text-brand-deep focus:border-brand-primary/40 focus:bg-white focus:outline-none transition-all placeholder:text-brand-sage/20"
                    placeholder="EMP-XXXXX"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-brand-sage uppercase tracking-widest ml-1">Government ID</label>
                  <input
                    type="text"
                    required
                    value={nationalId}
                    onChange={(e) => setNationalId(e.target.value)}
                    className="w-full bg-brand-mist/10 border-2 border-brand-sage/5 rounded-2xl px-5 py-4 text-sm font-mono font-bold text-brand-deep focus:border-brand-primary/40 focus:bg-white focus:outline-none transition-all"
                    placeholder="National Identification"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-brand-sage uppercase tracking-widest ml-1">Birth Date</label>
                  <input
                    type="date"
                    required
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full bg-brand-mist/10 border-2 border-brand-sage/5 rounded-2xl px-5 py-4 text-sm font-mono font-bold text-brand-deep focus:border-brand-primary/40 focus:bg-white focus:outline-none transition-all"
                  />
                </div>
              </>
            )}

            {step === "otp" && (
              <div className="space-y-6">
                <div className="p-6 bg-brand-deep/5 rounded-[2rem] border border-brand-primary/10 text-center relative overflow-hidden">
                  <KeyRound className="w-6 h-6 text-brand-primary mx-auto mb-3 opacity-60" />
                  <p className="text-[10px] text-brand-sage font-mono uppercase tracking-widest leading-relaxed">
                    A secure 6-digit token has been transmitted to your mobile device.
                  </p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-brand-sage uppercase tracking-widest block text-center">Enter Security Token</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    className="w-full bg-white border-2 border-brand-sage/10 rounded-2xl py-5 text-center text-3xl tracking-[0.6em] font-mono font-black text-brand-primary focus:border-brand-primary focus:outline-none transition-all"
                    placeholder="000000"
                  />
                </div>
              </div>
            )}

            {step === "credentials" && (
              <>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-brand-sage uppercase tracking-widest ml-1">Master Password</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-brand-mist/10 border-2 border-brand-sage/5 rounded-2xl px-5 py-4 text-sm font-mono font-bold text-brand-deep focus:border-brand-primary/40 focus:bg-white focus:outline-none transition-all"
                    placeholder="••••••••"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-brand-sage uppercase tracking-widest ml-1">Confirm Credentials</label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-brand-mist/10 border-2 border-brand-sage/5 rounded-2xl px-5 py-4 text-sm font-mono font-bold text-brand-deep focus:border-brand-primary/40 focus:bg-white focus:outline-none transition-all"
                    placeholder="••••••••"
                  />
                </div>
                <div className="space-y-1.5 pt-2">
                  <div className="flex justify-between items-center ml-1">
                    <label className="text-[9px] font-black text-brand-sage uppercase tracking-widest">Quick-Switch PIN</label>
                    <span className="text-[8px] font-bold text-brand-primary/60 uppercase">4 Digits</span>
                  </div>
                  <input
                    type="password"
                    required
                    maxLength={4}
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                    className="w-full bg-white border-2 border-brand-sage/10 rounded-2xl py-4 text-center text-2xl tracking-[0.5em] font-mono font-black text-brand-deep focus:border-brand-primary focus:outline-none transition-all"
                    placeholder="0000"
                  />
                </div>
              </>
            )}

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-2xl"
              >
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <p className="text-[9px] text-red-600 font-black uppercase tracking-widest leading-tight">
                  {error}
                </p>
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-5 rounded-2xl font-black uppercase tracking-[0.25em] text-[10px] transition-all duration-500 bg-brand-deep text-white hover:bg-brand-primary shadow-xl shadow-brand-deep/20 hover:shadow-brand-primary/30 active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Processing...</span>
                </div>
              ) : (
                <span>{step === "credentials" ? "Finalize Account" : "Initiate Next Phase"}</span>
              )}
            </button>
          </form>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};