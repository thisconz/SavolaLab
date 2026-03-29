import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, UserPlus, CheckCircle2, ShieldAlert } from "lucide-react";
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

  // Verify State
  const [employeeNumber, setEmployeeNumber] = useState("");
  const [nationalId, setNationalId] = useState("");
  const [dob, setDob] = useState("");

  // OTP State
  const [otp, setOtp] = useState("");

  // Credentials State
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pin, setPin] = useState("");

  const steps: { id: Step; label: string }[] = [
    { id: "verify", label: "Identity" },
    { id: "otp", label: "Verification" },
    { id: "credentials", label: "Security" },
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
      setError(
        err.message || "Verification failed. Please check your details.",
      );
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
      setError(err.message || "Invalid OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (pin.length !== 4) {
      setError("PIN must be exactly 4 digits");
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
      setTimeout(() => {
        onSuccess();
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Failed to setup credentials.");
    } finally {
      setLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center py-12 text-center"
      >
        <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mb-6 border-2 border-emerald-100 shadow-xl shadow-emerald-500/10">
          <CheckCircle2 className="w-10 h-10 text-emerald-500" />
        </div>
        <h2 className="text-xl font-black text-brand-deep uppercase tracking-widest mb-2">
          Registry Complete
        </h2>
        <p className="text-xs text-brand-sage font-mono uppercase tracking-tighter max-w-240px">
          Your credentials have been securely provisioned. Redirecting to
          terminal...
        </p>
        <div className="mt-8 w-48 h-1 bg-brand-mist rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ duration: 2 }}
            className="h-full bg-emerald-500"
          />
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2.5 hover:bg-brand-mist/50 rounded-xl text-brand-sage transition-all duration-300 hover:text-brand-deep border border-transparent hover:border-brand-sage/20 hover:shadow-sm"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-sm font-black text-brand-deep uppercase tracking-[0.2em]">
              Account Registry
            </h2>
            <p className="text-[9px] text-brand-sage font-mono uppercase mt-0.5 opacity-60 tracking-widest">
              Secure Enrollment Protocol
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {steps.map((s, idx) => (
            <div
              key={s.id}
              className={`h-1.5 w-8 rounded-full transition-all duration-500 ${
                idx <= currentStepIndex
                  ? "bg-brand-primary shadow-[0_0_12px_rgba(177,190,155,0.6)]"
                  : "bg-brand-mist"
              }`}
            />
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {step === "verify" && (
          <motion.div
            key="verify"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            <form onSubmit={handleVerify} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[9px] font-black text-brand-sage uppercase tracking-[0.2em] ml-1">
                  Employee Number
                </label>
                <input
                  type="text"
                  required
                  value={employeeNumber}
                  onChange={(e) => setEmployeeNumber(e.target.value)}
                  className="w-full bg-white/50 backdrop-blur-sm border-2 border-brand-sage/10 rounded-2xl px-5 py-4 text-sm font-mono font-bold text-brand-deep focus:outline-none focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary/30 transition-all placeholder:opacity-30 placeholder:font-normal"
                  placeholder="e.g. EMP001"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black text-brand-sage uppercase tracking-[0.2em] ml-1">
                  National ID
                </label>
                <input
                  type="text"
                  required
                  value={nationalId}
                  onChange={(e) => setNationalId(e.target.value)}
                  className="w-full bg-white/50 backdrop-blur-sm border-2 border-brand-sage/10 rounded-2xl px-5 py-4 text-sm font-mono font-bold text-brand-deep focus:outline-none focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary/30 transition-all placeholder:opacity-30 placeholder:font-normal"
                  placeholder="Enter National ID"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black text-brand-sage uppercase tracking-[0.2em] ml-1">
                  Date of Birth
                </label>
                <input
                  type="date"
                  required
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full bg-white/50 backdrop-blur-sm border-2 border-brand-sage/10 rounded-2xl px-5 py-4 text-sm font-mono font-bold text-brand-deep focus:outline-none focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary/30 transition-all"
                />
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="p-4 bg-rose-50/80 backdrop-blur-sm border border-rose-200 rounded-2xl"
                >
                  <p className="text-[10px] text-rose-600 font-black uppercase tracking-widest text-center leading-relaxed">
                    {error}
                  </p>
                </motion.div>
              )}

              <button
                type="submit"
                disabled={loading || !employeeNumber || !nationalId || !dob}
                className="w-full py-5 mt-6 rounded-1.5rem font-black uppercase tracking-[0.2em] text-[10px] transition-all duration-300 bg-brand-primary text-white shadow-xl shadow-brand-primary/20 hover:bg-brand-primary/90 hover:shadow-2xl hover:shadow-brand-primary/30 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-xl active:scale-95"
              >
                {loading ? "Verifying Protocol..." : "Continue to Verification"}
              </button>
            </form>
          </motion.div>
        )}

        {step === "otp" && (
          <motion.div
            key="otp"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            <form onSubmit={handleOtp} className="space-y-6">
              <div className="p-8 bg-white/50 backdrop-blur-sm rounded-2rem border-2 border-brand-sage/10 mb-8 text-center relative overflow-hidden shadow-sm">
                <div className="absolute top-0 right-0 w-32 h-32 bg-linear-to-br from-brand-primary/10 to-transparent rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                <div className="w-16 h-16 bg-brand-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-brand-primary/20 shadow-inner">
                  <ShieldAlert className="w-8 h-8 text-brand-primary" />
                </div>
                <p className="text-xs text-brand-deep font-black uppercase tracking-widest">
                  Verification Code Sent
                </p>
                <p className="text-[10px] text-brand-sage font-mono mt-3 leading-relaxed opacity-80 max-w-240px mx-auto">
                  Please enter the 6-digit code sent to your registered contact.
                </p>
                <div className="mt-6 inline-block px-4 py-2 bg-brand-primary/10 border border-brand-primary/20 rounded-xl shadow-sm">
                  <p className="text-[9px] text-brand-primary font-black uppercase tracking-widest">
                    Demo Bypass: 123456
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[9px] font-black text-brand-sage uppercase tracking-[0.2em] ml-1">
                  6-Digit OTP
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  className="w-full bg-white/50 backdrop-blur-sm border-2 border-brand-sage/10 rounded-2xl px-5 py-5 text-center text-3xl tracking-[0.5em] font-mono font-black text-brand-deep focus:outline-none focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary/30 transition-all placeholder:opacity-20"
                  placeholder="------"
                />
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="p-4 bg-rose-50/80 backdrop-blur-sm border border-rose-200 rounded-2xl"
                >
                  <p className="text-[10px] text-rose-600 font-black uppercase tracking-widest text-center leading-relaxed">
                    {error}
                  </p>
                </motion.div>
              )}

              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="w-full py-5 mt-6 rounded-1.5rem font-black uppercase tracking-[0.2em] text-[10px] transition-all duration-300 bg-brand-primary text-white shadow-xl shadow-brand-primary/20 hover:bg-brand-primary/90 hover:shadow-2xl hover:shadow-brand-primary/30 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-xl active:scale-95"
              >
                {loading ? "Validating Token..." : "Confirm Identity"}
              </button>
            </form>
          </motion.div>
        )}

        {step === "credentials" && (
          <motion.div
            key="credentials"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            <form onSubmit={handleCredentials} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[9px] font-black text-brand-sage uppercase tracking-[0.2em] ml-1">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/50 backdrop-blur-sm border-2 border-brand-sage/10 rounded-2xl px-5 py-4 text-sm font-mono font-bold text-brand-deep focus:outline-none focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary/30 transition-all placeholder:opacity-30 placeholder:font-normal"
                  placeholder="Minimum 8 characters"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black text-brand-sage uppercase tracking-[0.2em] ml-1">
                  Confirm Password
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-white/50 backdrop-blur-sm border-2 border-brand-sage/10 rounded-2xl px-5 py-4 text-sm font-mono font-bold text-brand-deep focus:outline-none focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary/30 transition-all placeholder:opacity-30 placeholder:font-normal"
                  placeholder="Confirm password"
                />
              </div>
              <div className="space-y-2 pt-2">
                <label className="text-[9px] font-black text-brand-sage uppercase tracking-[0.2em] ml-1">
                  4-Digit PIN (Quick Switch)
                </label>
                <input
                  type="password"
                  required
                  maxLength={4}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                  className="w-full bg-white/50 backdrop-blur-sm border-2 border-brand-sage/10 rounded-2xl px-5 py-4 text-center text-2xl tracking-[0.5em] font-mono font-black text-brand-deep focus:outline-none focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary/30 transition-all placeholder:opacity-20"
                  placeholder="----"
                />
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="p-4 bg-rose-50/80 backdrop-blur-sm border border-rose-200 rounded-2xl"
                >
                  <p className="text-[10px] text-rose-600 font-black uppercase tracking-widest text-center leading-relaxed">
                    {error}
                  </p>
                </motion.div>
              )}

              <button
                type="submit"
                disabled={
                  loading || !password || !confirmPassword || pin.length !== 4
                }
                className="w-full py-5 mt-6 rounded-1.5rem font-black uppercase tracking-[0.2em] text-[10px] transition-all duration-300 bg-brand-primary text-white shadow-xl shadow-brand-primary/20 hover:bg-brand-primary/90 hover:shadow-2xl hover:shadow-brand-primary/30 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-xl active:scale-95"
              >
                {loading ? "Finalizing Setup..." : "Complete Registry"}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
