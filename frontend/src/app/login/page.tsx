"use client";

import { useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { useRouter } from "next/navigation";
import { motion, Variants } from "framer-motion";
import { LogIn, Eye } from "lucide-react";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

export default function LoginPage() {
  const [employee_id, setEmployeeId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new URLSearchParams();
      formData.append("username", employee_id);
      formData.append("password", password);
      formData.append("grant_type", "password");
      formData.append("scope", "");
      formData.append("client_id", "string");
      formData.append("client_secret", "string");

      const response = await api.post("/users/login", formData.toString(), {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });

      localStorage.setItem("token", response.data.access_token);
      router.push("/dashboard");
    } catch (error: any) {
      console.error("Login Error:", error);
      const detail =
        error?.response?.data?.detail ||
        error?.response?.data?.message ||
        error?.message ||
        "Unknown error";
      alert("Login failed: " + detail);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-50 via-white to-gray-100 px-4">
      <motion.form
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        onSubmit={handleLogin}
        className="w-full max-w-md space-y-6 rounded-2xl border border-gray-100 bg-white/90 p-8 shadow-xl backdrop-blur-md"
      >
        {/* Header */}
        <div className="text-center space-y-1">
          <h2 className="text-3xl font-extrabold text-green-600">
            Welcome Back
          </h2>
          <p className="text-sm text-gray-500">
            Login to access <span className="font-bold">SavolaLab</span>
          </p>
        </div>

        {/* Inputs */}
        <div className="space-y-4">
          <div>
            <input
              type="text"
              placeholder="Employee ID"
              value={employee_id}
              onChange={(e) => setEmployeeId(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 shadow-sm transition focus:border-green-400 focus:ring-2 focus:ring-green-400"
            />
          </div>
          <div>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 shadow-sm transition focus:border-green-400 focus:ring-2 focus:ring-green-400"
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-3">
          <motion.button
            type="submit"
            disabled={loading}
            whileTap={{ scale: 0.96 }}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 py-2.5 font-medium text-white shadow-md transition-colors hover:bg-green-700 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <span className="animate-pulse">Logging in...</span>
            ) : (
              <>
                <LogIn className="h-5 w-5" /> Login
              </>
            )}
          </motion.button>

          <Link
            href="/request"
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-gray-100 py-2.5 font-medium text-gray-700 shadow-sm transition hover:bg-gray-200"
          >
            <Eye className="h-5 w-5" /> Request Access
          </Link>
        </div>
      </motion.form>
    </main>
  );
}
