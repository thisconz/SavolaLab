import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "@/src/lib/motion";
import {
  ArrowLeft,
  UserPlus,
  CheckCircle2,
  ShieldAlert,
  Fingerprint,
  KeyRound,
  Lock,
  Cpu,
  ScanFace,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { AuthApi } from "../api/auth.api";

interface RegistrationFlowProps {
  onBack: () => void;
  onSuccess: () => void;
}

type Step = "verify" | "otp" | "credentials";

const LAB_INPUT_CLASSES =
  "w-full bg-(--color-zenthar-graphite)/30 border-2 border-brand-sage/10 rounded-[1.25rem] p-5 font-mono text-sm font-bold transition-all duration-300 focus:outline-none focus:border-brand-primary/40 focus:bg-(--color-zenthar-graphite) focus:shadow-[0_10px_30px_-10px_rgba(0,0,0,0.2)] placeholder:text-brand-sage/30 text-(--color-zenthar-text-primary)";

// 2. HELPER COMPONENTS (Define outside so they have access to global constants)
type FieldProps = {
  label: string;
  icon?: React.ReactNode;
  value: string;
  onChange: (value: string) => void;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value">;

const Field: React.FC<FieldProps> = ({
  label,
  icon,
  value,
  onChange,
  ...rest
}) => (
  <div className="space-y-1.5">
    <label className="text-[9px] font-black text-brand-sage uppercase tracking-widest ml-1">
      {label}
    </label>

    <div className="relative group">
      <div className="absolute left-5 top-1/2 -translate-y-1/2 text-brand-sage group-focus-within:text-brand-primary transition-colors opacity-40">
        {icon}
      </div>

      <input
        {...rest}
        required
        value={value}
        onChange={(e) => onChange(e.target.value)} // ✅ FIX
        className={`${LAB_INPUT_CLASSES} pl-12`}
      />
    </div>
  </div>
);

export const RegistrationFlow: React.FC<RegistrationFlowProps> = ({ onBack, onSuccess }) => {
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

  const steps = useMemo(
    () => [
      {
        id: "verify",
        label: "Identity",
        icon: UserPlus,
        desc: "Personnel Validation",
      },
      {
        id: "otp",
        label: "Verification",
        icon: ShieldAlert,
        desc: "Token Handshake",
      },
      {
        id: "credentials",
        label: "Security",
        icon: Fingerprint,
        desc: "Credential Patch",
      },
    ],
    [],
  );

  const currentStepIndex = steps.findIndex((s) => s.id === step);
  const StepIcon = steps[currentStepIndex].icon;

  const getErrorMessage = (err: any) => {
    if (typeof err === "string") return err;
    if (err?.message && typeof err.message === "string") return err.message;
    if (err?.error && typeof err.error === "string") return err.error;
    return "An unexpected error occurred.";
  };

  // --- Handlers (Logic remains same as requested, UI wrapper updated) ---
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
      setError(getErrorMessage(err));
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
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) return setError("Passwords do not match.");
    if (pin.length !== 4) return setError("PIN must be exactly 4 digits.");

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
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  

  if (isSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center py-12 text-center"
      >
        <div className="relative mb-8">
          <motion.div
            initial={{ scale: 0.5, rotate: -45 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="w-24 h-24 bg-emerald-500 rounded-4xl flex items-center justify-center shadow-[0_20px_50px_rgba(16,185,129,0.3)] border-4 border-(--color-zenthar-carbon)"
          >
            <CheckCircle2 className="w-12 h-12 text-(--color-zenthar-void)" />
          </motion.div>
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.1, 0.3] }}
            transition={{ repeat: Infinity, duration: 3 }}
            className="absolute inset-0 bg-emerald-500 blur-3xl -z-10"
          />
        </div>
        <h2 className="text-xl font-black text-(--color-zenthar-text-primary) uppercase tracking-[0.4em] mb-3">
          Sync Complete
        </h2>
        <p className="text-[10px] text-brand-sage font-mono uppercase tracking-widest leading-relaxed opacity-70">
          Handshake verified. Redirecting to secure terminal...
        </p>
        <div className="mt-12 w-48 h-1 bg-(--color-zenthar-graphite) rounded-full overflow-hidden">
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: "0%" }}
            transition={{ duration: 2, ease: "easeInOut" }}
            className="h-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.8)]"
          />
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header & Step Progress */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="group flex items-center gap-2 text-[10px] font-black text-brand-sage uppercase tracking-widest hover:text-brand-primary transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
            Abort Request
          </button>

          <div className="flex gap-2">
            {steps.map((_, idx) => (
              <div key={idx} className="relative">
                <div
                  className={`h-1.5 rounded-full transition-all duration-700 ${idx <= currentStepIndex ? "w-10 bg-brand-primary" : "w-4 bg-(--color-zenthar-graphite)"}`}
                />
                {idx === currentStepIndex && (
                  <motion.div
                    layoutId="glow"
                    className="absolute inset-0 bg-brand-primary blur-[6px] opacity-40"
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-5 p-4 bg-(--color-zenthar-graphite)/30 rounded-2xl border border-brand-sage/10 relative overflow-hidden group">
          <div className="w-12 h-12 rounded-xl bg-(--color-zenthar-void) flex items-center justify-center text-brand-primary shadow-lg transition-transform group-hover:scale-105">
            <StepIcon className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-[11px] font-black text-(--color-zenthar-text-primary) uppercase tracking-[0.3em]">
              {steps[currentStepIndex].label} Layer
            </h2>
            <p className="text-[9px] text-brand-sage font-mono uppercase tracking-widest opacity-60 mt-1">
              {steps[currentStepIndex].desc}
            </p>
          </div>
          <Cpu className="absolute right-4 opacity-[0.05] w-12 h-12 rotate-12" />
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
        >
          <form
            onSubmit={
              step === "verify" ? handleVerify : step === "otp" ? handleOtp : handleCredentials
            }
            className="space-y-6"
          >
            {step === "verify" && (
              <div className="space-y-4">
                <Field
                  label="Personnel Number"
                  placeholder="EMP-00000"
                  value={employeeNumber}
                  onChange={setEmployeeNumber}
                  icon={<ScanFace className="w-4 h-4" />}
                />
                <Field
                  label="National Identity"
                  placeholder="Verification ID"
                  value={nationalId}
                  onChange={setNationalId}
                  icon={<Lock className="w-4 h-4" />}
                />
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-brand-sage uppercase tracking-widest ml-1">
                    Date of Registry
                  </label>
                  <input
                    type="date"
                    required
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className={LAB_INPUT_CLASSES}
                  />
                </div>
              </div>
            )}

            {step === "otp" && (
              <div className="space-y-6">
                <div className="p-6 bg-(--color-zenthar-void) rounded-4xl border border-brand-sage/10 text-center relative overflow-hidden shadow-2xl">
                  <div className="relative z-10">
                    <KeyRound className="w-6 h-6 text-brand-primary mx-auto mb-3 animate-pulse" />
                    <p className="text-[9px] text-brand-sage font-mono uppercase tracking-widest leading-relaxed px-4 opacity-80">
                      Transmission successful. Enter the 6-digit decryption token.
                    </p>
                  </div>
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <ShieldAlert className="w-12 h-12 text-(--color-zenthar-text-primary)" />
                  </div>
                </div>
                <div className="space-y-2">
                  <input
                    autoFocus
                    type="text"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    className="w-full bg-(--color-zenthar-graphite)/30 border-2 border-brand-sage/10 rounded-2xl py-6 text-center text-4xl tracking-[0.5em] font-mono font-black text-(--color-zenthar-text-primary) focus:border-brand-primary focus:bg-(--color-zenthar-graphite) transition-all shadow-inner"
                    placeholder="•••••••"
                  />
                </div>
              </div>
            )}

            {step === "credentials" && (
              <div className="space-y-4">
                <Field
                  label="New Master Password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={setPassword}
                  icon={<KeyRound className="w-4 h-4" />}
                />
                <Field
                  label="Confirm Master Password"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  icon={<CheckCircle2 className="w-4 h-4" />}
                />

                <div className="pt-2 space-y-2">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-[9px] font-black text-brand-sage uppercase tracking-widest">
                      Rapid Access PIN
                    </label>
                    <span className="text-[8px] font-mono text-brand-primary opacity-60">
                      L-LEVEL 1
                    </span>
                  </div>
                  <input
                    type="password"
                    maxLength={4}
                    required
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                    className="w-full bg-(--color-zenthar-void) text-brand-primary border-2 border-brand-sage/10 rounded-2xl py-5 text-center text-3xl tracking-[0.8em] font-mono font-black focus:border-brand-primary transition-all shadow-2xl"
                    placeholder="••••"
                  />
                </div>
              </div>
            )}

            {error && (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl"
              >
                <ShieldAlert className="w-4 h-4 text-red-500" />
                <p className="text-[9px] text-red-500 font-black uppercase tracking-widest">
                  {error}
                </p>
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-5 rounded-2xl font-black uppercase tracking-[0.3em] text-[10px] transition-all duration-500 flex items-center justify-center gap-3 ${
                loading
                  ? "bg-(--color-zenthar-graphite) text-brand-sage"
                  : "bg-brand-primary text-(--color-zenthar-void) hover:bg-brand-primary/90 shadow-2xl shadow-brand-primary/20 active:scale-95"
              }`}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>{step === "credentials" ? "Seal Registry" : "Proceed to Next Node"}</span>
                  <ChevronRight className="w-4 h-4 opacity-50" />
                </>
              )}
            </button>
          </form>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
